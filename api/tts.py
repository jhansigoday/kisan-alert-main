"""
tts.py — text -> speech
Day 1/2 version: gTTS (free, simple). Swap for Google Cloud TTS later for better Indic voices.
Supports writing to /tmp when executing inside Vercel's read-only environment.
"""

import os
import uuid
import base64
from io import BytesIO
from gtts import gTTS

# If running on Vercel, write to /tmp/static/audio_replies, otherwise local static folder
if os.environ.get("VERCEL"):
    OUTPUT_DIR = "/tmp/static/audio_replies"
else:
    OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "static", "audio_replies")

os.makedirs(OUTPUT_DIR, exist_ok=True)

# Map Whisper's detected language codes to gTTS-supported codes.
_LANG_MAP = {
    "te": "te",
    "hi": "hi",
    "en": "en",
}

def synthesize_speech(text: str, language: str = "en") -> str:
    """
    Converts text to speech, saves as MP3, returns the relative URL path.
    """
    lang_code = _LANG_MAP.get(language, "en")
    filename = f"{uuid.uuid4().hex}.mp3"
    filepath = os.path.join(OUTPUT_DIR, filename)

    tts = gTTS(text=text, lang=lang_code)
    tts.save(filepath)

    return f"/static/audio_replies/{filename}"


def synthesize_speech_data_url(text: str, language: str = "en") -> str:
    """Return an MP3 data URL for a browser IVR reply in the same request.

    This avoids relying on a temporary serverless file being available when the
    simulator browser asks for it a moment later.
    """
    lang_code = _LANG_MAP.get(language, "en")
    buffer = BytesIO()
    gTTS(text=text, lang=lang_code).write_to_fp(buffer)
    encoded = base64.b64encode(buffer.getvalue()).decode("ascii")
    return f"data:audio/mpeg;base64,{encoded}"
