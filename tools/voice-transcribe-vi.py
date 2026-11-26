#!/usr/bin/env python3
"""
CapyHub Vietnamese Voice-to-Text Engine (tools/voice-transcribe-vi.py)
- Tự động khuếch đại âm lượng chuẩn hóa (Auto-Gain Normalization) để nghe rõ cả khi nói nhỏ.
- Chuyển toàn bộ âm thanh .wav từ Micro thành văn bản Tiếng Việt (vi-VN) chuẩn UTF-8.
"""
import array
import json
import os
import sys
import wave

sys.stdout.reconfigure(encoding="utf-8")


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
        text = recognizer.recognize_google(audio_data, language="vi-VN")
        return {"ok": True, "transcript": text.strip(), "wav_path": wav_path}
    except sr.UnknownValueError:
        return {
            "ok": False,
            "error": "Chưa bắt được câu nói rõ ràng từ Micro. Bạn hãy nói gần Mic hơn nhé!",
            "wav_path": wav_path,
        }
    except Exception as exc:
        return {"ok": False, "error": str(exc), "wav_path": wav_path}


if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else ""
    print(json.dumps(transcribe_wav_vi(target), ensure_ascii=False))
