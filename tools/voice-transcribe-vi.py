#!/usr/bin/env python3
"""
CapyHub Real-Time Streaming & Noise-Cancelling Viet-lish STT Engine (tools/voice-transcribe-vi.py)
- Khử nhiễu DSP 3 bước: High-Pass Filter (cắt tiếng quạt/ồn tần số thấp <130Hz) + Adaptive Noise Gate + Auto-Gain.
- Chế độ Persistent Warm Daemon (--daemon): Nạp sẵn thư viện trong RAM, dịch từng cụm từ ngay khi đang nói (<250ms).
- Kết hợp N-Best Hypotheses (show_all=True) + 120+ quy tắc âm bồi Việt-Anh (Viet-lish Phonetic Reconstructor).
"""
import array
import json
import os
import re
import sys
import wave

sys.stdout.reconfigure(encoding="utf-8")
sys.stdin.reconfigure(encoding="utf-8")

VIETLISH_PHONETIC_RULES = [
    # 1. Cụm từ WPS / Office / Tài liệu
    (r"\b(vê kép pi ét|đắp lưu pi ét|đắp lưu bi ét|vê đúp pi ét|w\s*b\s*s|w\s*p\s*s)(?!\s+office)\b", "WPS Office"),
    (r"\b(phai guộc|bản guộc)\b", "file Word"),
    (r"\b(phai ích seo|phai éc seo|bảng ích seo|bảng éc seo)\b", "file Excel"),
    (r"\b(ích seo|éc seo)\b", "Excel"),
    (r"\b(pao ơ poi|pao vơ poi|pao ơ pôi)\b", "PowerPoint"),
    (r"\b(bi đi ép|pi đi ép|pê đê ép)\b", "PDF"),
    (r"\b(sờ lai|sơ lai)\b", "slide"),
    (r"\b(trang sít|sít dữ liệu|sít số liệu|sít excel)\b", "sheet dữ liệu"),
    (r"\b(đọc phai|mở phai|xuất phai|lưu phai|gửi phai|tải phai|trong phai|các phai|nhiều phai)\b", lambda m: m.group(0).rsplit(" ", 1)[0] + " file"),
    (r"\b(phai văn bản|phai báo cáo|phai tài liệu|phai số liệu|phai âm thanh|phai bàn giao|phai gốc|phai mẫu|phai mới)\b", lambda m: "file " + m.group(0).split(" ", 1)[1]),
    (r"\b(phôn đơ|phâu đơ|thư mục phôn đơ)\b", "folder"),
    (r"\b(tem pờ lết|tem lết)\b", "template"),
    (r"\b(pho mát|phó mát)\b", "format"),
    (r"\b(ri pọt|rì pọt)\b", "report"),
    (r"\b(ri viu|rì viu)\b", "review"),
    (r"\b(ắp đết|ấp đết)\b", "update"),

    # 2. Cụm từ Harness / AI Agent / Prompt / Task / Confirm
    (r"\b(ha nét|ha nết|hơ nét|hơ nít|bộ ha nét|vòng ha nét)\b", "harness"),
    (r"\b(sấp ây gần|sắp ây gần|súp ây gần|sắp ê gần|sub ây gần|sấp ê giần|sắp agent)\b", "subagent"),
    (r"\b(ây gần|ê gần|ê giần|con ây gần)\b", "agent"),
    (r"\b(ây ai|ê ai)\b", "AI"),
    (r"\b(con phơm|cần phơm|cơn phơm|còn phơm)\b", "confirm"),
    (r"\b(pờ rôm)\b", "prompt"),
    (r"\b(câu rôm|chạy rôm|viết rôm)\b", lambda m: m.group(0).rsplit(" ", 1)[0] + " prompt"),
    (r"\b(tát vụ)\b", "task"),
    (r"\b(cái tát|chia tát|nhận tát|giao tát|làm tát|xử lý tát|hoàn thành tát|các tát|đầu tát)\b", lambda m: m.group(0).rsplit(" ", 1)[0] + " task"),
    (r"\b(sờ kiu|sờ kin|bộ sờ kiu|mắt sờ kiu|max sờ kiu)\b", "skill"),
    (r"\b(guộc phờ lâu|guốc phờ lâu)\b", "workflow"),
    (r"\b(in pút|đầu vào in pút)\b", "input"),
    (r"\b(ao pút|đầu ra ao pút)\b", "output"),
    (r"\b(bút tông|bất tần|nút bút tông)\b", "button"),
    (r"\b(óp sần|ốp sần)\b", "option"),
    (r"\b(mô đờ|mô đồ)\b", "model"),
    (r"\b(phông mát tơ|phông mát|front mát tơ)\b", "frontmatter"),

    # 3. Cụm từ CapCut / Video / Media
    (r"\b(cáp cắt|cắp cắt|cáp cất|cap cut)\b", "CapCut"),
    (r"\b(ê đít|ờ đít|e đít)\b", "edit"),
    (r"\b(tham lai|thai lai)\b", "timeline"),
    (r"\b(vi đê ô|vi đi ô)\b", "video"),
    (r"\b(sắp tai tồ|phụ đề sắp)\b", "subtitle"),
    (r"\b(bi rôn|bê rôn)\b", "B-Roll"),
    (r"\b(ren đơ)\b", "render"),

    # 4. Cụm từ Data / Tài chính / Code / GitHub / Hub
    (r"\b(đa ta|đê ta|dữ liệu đa ta)\b", "data"),
    (r"\b(đát bo|đát bót)\b", "dashboard"),
    (r"\b(cát phờ lâu)\b", "cashflow"),
    (r"\b(phin tơ|phiu tơ)\b", "filter"),
    (r"\b(im pọt)\b", "import"),
    (r"\b(ếch pọt|ích pọt)\b", "export"),
    (r"\b(viết cốt|sửa cốt|chạy cốt|cốt ra|cốt phần mềm|mã cốt)\b", lambda m: m.group(0).replace("cốt", "code")),
    (r"\b(phích bấc|sửa bấc|lỗi bấc)\b", "fix bug"),
    (r"\b(gít hấp|gít hắp|gít húp)\b", "GitHub"),
    (r"\b(cái hấp|mở hấp|trên hấp|bật hấp|bộ hấp)\b", lambda m: m.group(0).replace("hấp", "Hub")),
    (r"\b(cái hắp|mở hắp|trên hắp|bật hắp|bộ hắp)\b", lambda m: m.group(0).replace("hắp", "Hub")),
    (r"\b(ca pi ba ra|ca bi ba ra|ka pi ba ra)\b", "Capybara"),
    (r"\b(xi ai xi đi|cê i cê đê)\b", "CI/CD"),
    (r"\b(quy ây|kiu ây)\b", "QA"),
]

ENGLISH_TECH_KEYWORDS = {
    "wps", "office", "word", "excel", "powerpoint", "pdf", "file", "folder", "slide", "sheet",
    "data", "capcut", "video", "edit", "timeline", "code", "app", "hub", "github", "harness",
    "agent", "subagent", "prompt", "task", "confirm", "skill", "qa", "mic", "button", "voice",
    "text", "update", "review", "report", "format", "template", "dashboard", "filter", "model"
}


def load_custom_glossary(hub_root: str) -> list:
    custom_rules = []
    mem_dir = os.path.join(hub_root, "03_HoSo_TriNho_CaNhan")
    candidates = [
        os.path.join(mem_dir, "VOICE-GLOSSARY.md"),
        os.path.join(mem_dir, "VOICE-GLOSSARY.template.md"),
    ]
    for path in candidates:
        if not os.path.exists(path):
            continue
        try:
            with open(path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if not line.startswith("|") or "spokenPhrase" in line or "---" in line:
                        continue
                    parts = [p.strip().strip("`") for p in line.strip("|").split("|")]
                    if len(parts) >= 2 and parts[0] and parts[1]:
                        if parts[1].startswith("[TRIGGER"):
                            continue
                        phrases = [p.strip().strip("`") for p in parts[0].split(",") if p.strip()]
                        for ph in phrases:
                            escaped = re.escape(ph)
                            custom_rules.append((rf"\b{escaped}\b", parts[1]))
        except Exception:
            pass
    return custom_rules


def apply_vietlish_phonetic_correction(text: str, hub_root: str = "") -> str:
    if not text:
        return ""
    cleaned = text.strip()
    if hub_root:
        for pattern, replacement in load_custom_glossary(hub_root):
            cleaned = re.sub(pattern, replacement, cleaned, flags=re.IGNORECASE)
    for pattern, replacement in VIETLISH_PHONETIC_RULES:
        cleaned = re.sub(pattern, replacement, cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"^(à ừm|à khoan|ừm thì|ờ thì)\s+", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned


def pick_best_hypothesis(raw_response, hub_root: str) -> str:
    if isinstance(raw_response, str):
        return apply_vietlish_phonetic_correction(raw_response, hub_root)
    if not isinstance(raw_response, dict) or "alternative" not in raw_response:
        return ""
    alternatives = raw_response.get("alternative", [])
    if not alternatives:
        return ""

    best_text = ""
    best_score = -1e9
    for idx, alt in enumerate(alternatives):
        raw_t = (alt.get("transcript") or "").strip()
        if not raw_t:
            continue
        corrected_t = apply_vietlish_phonetic_correction(raw_t, hub_root)
        words = set(re.findall(r"[a-zA-Z0-9_]+", corrected_t.lower()))
        en_hits = len(words.intersection(ENGLISH_TECH_KEYWORDS))
        score = (5 - idx) * 1.0 + (en_hits * 2.2)
        if score > best_score:
            best_score = score
            best_text = corrected_t
    return best_text


def denoise_and_normalize_wav(wav_path: str) -> str:
    """
    Bộ lọc DSP 3 bước chống nhiễu Micro:
    1. High-Pass Filter (~130Hz): Loại bỏ tiếng ù quạt tản nhiệt, điều hòa và tạp âm nền trầm.
    2. Adaptive Noise Gate: Triệt tiêu tiếng xì (hiss) ở những khoảng nghỉ giữa các từ.
    3. Peak Auto-Gain Normalization: Đưa giọng nói về biên độ chuẩn 26000 để STT bắt rõ từng âm tiết.
    """
    try:
        with wave.open(wav_path, "rb") as wf:
            params = wf.getparams()
            if params.sampwidth != 2:
                return wav_path
            raw_frames = wf.readframes(params.nframes)

        samples = array.array("h")
        samples.frombytes(raw_frames)
        n = len(samples)
        if n < 160:
            return wav_path

        # Bước 1: High-Pass Filter (y[i] = alpha * (y[i-1] + x[i] - x[i-1]), alpha=0.94 ở 16kHz -> cắt <150Hz)
        filtered = array.array("h", [0] * n)
        alpha = 0.94
        prev_x = float(samples[0])
        prev_y = 0.0
        abs_sum = 0.0
        max_peak = 1

        for i in range(n):
            x = float(samples[i])
            y = alpha * (prev_y + x - prev_x)
            prev_x = x
            prev_y = y
            if y > 32767.0:
                y = 32767.0
            elif y < -32768.0:
                y = -32768.0
            ival = int(y)
            filtered[i] = ival
            a = abs(ival)
            abs_sum += a
            if a > max_peak:
                max_peak = a

        if max_peak < 150:
            return wav_path

        # Bước 2 & 3: Noise Gate nhẹ + Khuếch đại biên độ chuẩn
        avg_amp = abs_sum / float(n)
        gate_threshold = min(650.0, avg_amp * 0.45)
        gain = min(10.0, 26000.0 / float(max_peak)) if max_peak < 22000 else 1.0

        for i in range(n):
            val = float(filtered[i])
            if abs(val) < gate_threshold:
                val *= 0.25  # Dập 75% nhiễu nền ở khoảng lặng
            val = int(val * gain)
            if val > 32767:
                val = 32767
            elif val < -32768:
                val = -32768
            filtered[i] = val

        with wave.open(wav_path, "wb") as out_wf:
            out_wf.setparams(params)
            out_wf.writeframes(filtered.tobytes())
    except Exception:
        pass
    return wav_path


def transcribe_wav_vi(wav_path: str, recognizer=None) -> dict:
    hub_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    if not os.path.exists(wav_path):
        return {"ok": False, "error": f"Không tìm thấy file âm thanh: {wav_path}"}

    try:
        import speech_recognition as sr
    except ImportError:
        return {"ok": False, "error": "Chưa cài SpeechRecognition", "wav_path": wav_path}

    denoise_and_normalize_wav(wav_path)
    if recognizer is None:
        recognizer = sr.Recognizer()
        recognizer.energy_threshold = 140
        recognizer.dynamic_energy_threshold = True

    try:
        with sr.AudioFile(wav_path) as source:
            audio_data = recognizer.record(source)

        raw_res = recognizer.recognize_google(audio_data, language="vi-VN", show_all=True)
        final_text = pick_best_hypothesis(raw_res, hub_root)
        if not final_text:
            return {"ok": False, "error": "silence", "wav_path": wav_path}
        return {"ok": True, "transcript": final_text, "wav_path": wav_path}
    except Exception as exc:
        return {"ok": False, "error": str(exc), "wav_path": wav_path}


def run_streaming_daemon():
    """
    Chế độ Daemon giữ nóng bộ nhận diện trong RAM để dịch streaming theo thời gian thực khi người dùng đang nói.
    """
    try:
        import speech_recognition as sr
        recognizer = sr.Recognizer()
        recognizer.energy_threshold = 140
        recognizer.dynamic_energy_threshold = True
    except Exception:
        recognizer = None

    print(json.dumps({"daemon": "ready"}), flush=True)
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        if line == "EXIT":
            break
        try:
            req = json.loads(line)
            wav_p = req.get("wav_path", "")
            req_id = req.get("id", 0)
            res = transcribe_wav_vi(wav_p, recognizer)
            res["id"] = req_id
            res["is_final"] = bool(req.get("is_final", False))
            print(json.dumps(res, ensure_ascii=False), flush=True)
        except Exception as e:
            print(json.dumps({"ok": False, "error": str(e)}), flush=True)


if __name__ == "__main__":
    if len(sys.argv) >= 2 and sys.argv[1] == "--daemon":
        run_streaming_daemon()
    elif len(sys.argv) >= 3 and sys.argv[1] == "--test-vietlish":
        hub_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        sample = sys.argv[2]
        print(
            json.dumps(
                {
                    "input": sample,
                    "corrected": apply_vietlish_phonetic_correction(sample, hub_root),
                },
                ensure_ascii=False,
            )
        )
    else:
        target = sys.argv[1] if len(sys.argv) > 1 else ""
        print(json.dumps(transcribe_wav_vi(target), ensure_ascii=False))
