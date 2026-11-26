#!/usr/bin/env python3
"""
CapyHub Bilingual Viet-lish Voice-to-Text & Phonetic Correction Engine (tools/voice-transcribe-vi.py)
Giải quyết triệt để 2 vấn đề khi người Việt nói vào Mic:
  1. Nói tiếng Việt chêm từ tiếng Anh (Code-switching Việt - Anh).
  2. Phát âm tiếng Anh chưa chuẩn (Âm bồi tiếng Việt -> Google STT ghi ra âm tiếng Việt sai).
Cơ chế 3 tầng:
  - Tầng 1: Auto-Gain Normalization (Khuếch đại giọng nói rõ nét).
  - Tầng 2: Google N-Best Hypotheses Fusion (show_all=True, quét cả 5 phương án nhận diện để bắt từ tiếng Anh).
  - Tầng 3: Context-Aware Viet-lish Phonetic Reconstructor (120+ cụm âm bồi Văn phòng / Data / CapCut / Code + đọc động từ 03_HoSo_TriNho_CaNhan/VOICE-GLOSSARY.md).
"""
import array
import json
import os
import re
import sys
import wave

sys.stdout.reconfigure(encoding="utf-8")

# Từ điển ngữ cảnh âm bồi Việt-Anh (Sắp xếp từ cụm dài cụ thể -> từ đơn để không thay nhầm ngữ cảnh)
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

# Tập từ khóa tiếng Anh ưu tiên khi chấm điểm N-Best Hypotheses của Google STT
ENGLISH_TECH_KEYWORDS = {
    "wps", "office", "word", "excel", "powerpoint", "pdf", "file", "folder", "slide", "sheet",
    "data", "capcut", "video", "edit", "timeline", "code", "app", "hub", "github", "harness",
    "agent", "subagent", "prompt", "task", "confirm", "skill", "qa", "mic", "button", "voice",
    "text", "update", "review", "report", "format", "template", "dashboard", "filter", "model"
}


def load_custom_glossary(hub_root: str) -> list:
    """Đọc thêm các quy tắc từ 03_HoSo_TriNho_CaNhan/VOICE-GLOSSARY.md (hoặc .template.md)."""
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

    # 1. Áp dụng từ điển cá nhân VOICE-GLOSSARY.md trước
    if hub_root:
        for pattern, replacement in load_custom_glossary(hub_root):
            cleaned = re.sub(pattern, replacement, cleaned, flags=re.IGNORECASE)

    # 2. Áp dụng từ điển ngữ cảnh âm bồi Việt-Anh 120+ mẫu
    for pattern, replacement in VIETLISH_PHONETIC_RULES:
        cleaned = re.sub(pattern, replacement, cleaned, flags=re.IGNORECASE)

    # 3. Khử từ đệm đầu câu
    cleaned = re.sub(r"^(à ừm|à khoan|ừm thì|ờ thì)\s+", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned


def pick_best_hypothesis(raw_response, hub_root: str) -> str:
    """
    Khi gọi recognize_google(..., show_all=True), Google trả về tới 5 phương án (N-Best).
    Chấm điểm từng phương án: ưu tiên phương án bắt được từ tiếng Anh hoặc khớp từ điển âm bồi Việt-Anh.
    """
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

        # Điểm cơ sở ưu tiên thứ tự confidence của Google, nhưng cộng thưởng lớn nếu phương án đó bắt đúng từ tiếng Anh
        base_rank_score = (5 - idx) * 1.0
        en_bonus = en_hits * 2.2
        score = base_rank_score + en_bonus

        if score > best_score:
            best_score = score
            best_text = corrected_t

    return best_text


def normalize_wav_audio(wav_path: str) -> str:
    """Khuếch đại biên độ PCM 16-bit lên mức rõ nhất (peak ~26000) nếu mic thu nhỏ."""
    try:
        with wave.open(wav_path, "rb") as wf:
            params = wf.getparams()
            if params.sampwidth != 2:
                return wav_path
            raw_frames = wf.readframes(params.nframes)

        samples = array.array("h")
        samples.frombytes(raw_frames)
        if not samples:
            return wav_path

        max_peak = max(abs(s) for s in samples)
        if max_peak < 150:
            return wav_path

        if max_peak < 18000:
            gain = min(12.0, 26000.0 / float(max_peak))
            for i in range(len(samples)):
                val = int(samples[i] * gain)
                if val > 32767:
                    val = 32767
                elif val < -32768:
                    val = -32768
                samples[i] = val

            with wave.open(wav_path, "wb") as out_wf:
                out_wf.setparams(params)
                out_wf.writeframes(samples.tobytes())
    except Exception:
        pass
    return wav_path


def transcribe_wav_vi(wav_path: str) -> dict:
    hub_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    if not os.path.exists(wav_path):
        return {"ok": False, "error": f"Không tìm thấy file âm thanh: {wav_path}"}

    try:
        import speech_recognition as sr
    except ImportError:
        return {
            "ok": False,
            "error": "Chưa cài SpeechRecognition (chạy: pip install SpeechRecognition)",
            "wav_path": wav_path,
        }

    normalize_wav_audio(wav_path)
    recognizer = sr.Recognizer()
    recognizer.energy_threshold = 150
    recognizer.dynamic_energy_threshold = True

    try:
        with sr.AudioFile(wav_path) as source:
            audio_data = recognizer.record(source)

        # Lấy toàn bộ 5 phương án N-Best (show_all=True) để bắt chuẩn cả tiếng Việt lẫn tiếng Anh chêm vào
        raw_res = recognizer.recognize_google(audio_data, language="vi-VN", show_all=True)
        final_text = pick_best_hypothesis(raw_res, hub_root)

        if not final_text:
            return {
                "ok": False,
                "error": "Chưa bắt được câu nói rõ ràng từ Micro. Bạn hãy nói gần Mic hơn nhé!",
                "wav_path": wav_path,
            }

        return {"ok": True, "transcript": final_text, "wav_path": wav_path}
    except Exception as exc:
        return {"ok": False, "error": str(exc), "wav_path": wav_path}


if __name__ == "__main__":
    if len(sys.argv) >= 3 and sys.argv[1] == "--test-vietlish":
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
