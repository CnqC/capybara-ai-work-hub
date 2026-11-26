#!/usr/bin/env python3
"""
CapyHub Vietnamese Voice-to-Text Engine (tools/voice-transcribe-vi.py)
Nhận file âm thanh .wav thu trực tiếp từ Micro trên Capybara-Hub.exe
và chuyển thành văn bản Tiếng Việt (vi-VN) chuẩn UTF-8.
"""
import json
import os
import sys

sys.stdout.reconfigure(encoding="utf-8")


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

    recognizer = sr.Recognizer()
    try:
        with sr.AudioFile(wav_path) as source:
            audio_data = recognizer.record(source)
        text = recognizer.recognize_google(audio_data, language="vi-VN")
        return {"ok": True, "transcript": text.strip(), "wav_path": wav_path}
    except sr.UnknownValueError:
        return {
            "ok": False,
            "error": "Không nghe rõ lời nói trong Mic (hãy nói to hơn hoặc kiểm tra thiết bị Mic).",
            "wav_path": wav_path,
        }
    except Exception as exc:
        return {"ok": False, "error": str(exc), "wav_path": wav_path}


if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else ""
    print(json.dumps(transcribe_wav_vi(target), ensure_ascii=False))
