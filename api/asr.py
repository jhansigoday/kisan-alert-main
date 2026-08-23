"""
asr.py — audio -> text
Pipeline: raw audio -> optional noise reduction -> Groq Whisper transcription.
Supports local Whisper ASR fallback if libraries are installed,
otherwise relies on Groq's cloud-hosted Whisper API (perfect for Vercel)
using the raw audio file directly.
"""

import os
import uuid
from groq import Groq
from dotenv import load_dotenv

# Load env variables
env_path = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(dotenv_path=env_path)

# Try importing audio libraries for local processing and local Whisper
try:
    import numpy as np
    import librosa
    import soundfile as sf
    import noisereduce as nr
    HAS_AUDIO_LIBS = True
except ImportError:
    HAS_AUDIO_LIBS = False

try:
    import whisper
    HAS_LOCAL_WHISPER = True
except ImportError:
    HAS_LOCAL_WHISPER = False

# Initialize local Whisper once as fallback if available
_local_whisper_model = None

try:
    TEMP_DIR = os.path.join(os.path.dirname(__file__), "temp_audio")
    os.makedirs(TEMP_DIR, exist_ok=True)
    # test write permission
    test_file = os.path.join(TEMP_DIR, ".write_test")
    with open(test_file, "w") as f:
        f.write("test")
    os.remove(test_file)
except OSError:
    TEMP_DIR = "/tmp/temp_audio"
    os.makedirs(TEMP_DIR, exist_ok=True)

# Initialize Groq client
_groq_key = os.environ.get("GROQ_API_KEY", "")
_client = Groq(api_key=_groq_key) if _groq_key else None

def _denoise_and_resample(input_path: str) -> str:
    """Load audio, apply spectral-gating noise reduction, resample to 16kHz mono, save WAV."""
    if not HAS_AUDIO_LIBS:
        print("[ASR] Audio libraries (librosa, noisereduce) not available. Using original audio file.")
        return input_path

    try:
        y, sr = librosa.load(input_path, sr=None, mono=True)

        # Apply noise reduction
        if len(y) > sr:
            noise_clip = y[: int(sr * 0.5)]
            reduced = nr.reduce_noise(y=y, sr=sr, y_noise=noise_clip, stationary=False)
        else:
            reduced = nr.reduce_noise(y=y, sr=sr, stationary=False)

        # Resample to 16kHz (Whisper's expected input rate)
        if sr != 16000:
            reduced = librosa.resample(reduced, orig_sr=sr, target_sr=16000)

        out_path = os.path.join(TEMP_DIR, f"{uuid.uuid4().hex}.wav")
        sf.write(out_path, reduced, 16000)
        return out_path
    except Exception as e:
        print("[ASR] Denoising/resampling failed:", e)
        return input_path

def transcribe_audio(input_path: str) -> dict:
    """
    Full ASR pipeline entry point.
    Attempts Groq Cloud Whisper Large V3 first (high speed & accuracy).
    Falls back to local Whisper base model if available, or a demo transcript.
    """
    global _local_whisper_model
    cleaned_path = None
    try:
        cleaned_path = _denoise_and_resample(input_path)
    except Exception as e:
        print("Denoise and resample failed, using raw audio or fallback:", e)
        cleaned_path = input_path

    transcript = ""
    language = "en"

    # Attempt Groq Cloud Whisper API (blazing fast, high accuracy)
    if _client:
        try:
            with open(cleaned_path, "rb") as file:
                transcription = _client.audio.transcriptions.create(
                    file=(os.path.basename(cleaned_path), file.read()),
                    model="whisper-large-v3",
                    response_format="json"
                )
                transcript = transcription.text.strip()
                language = "te" if any(ord(c) > 3000 for c in transcript) else "en"
                try:
                    safe_print = transcript.encode("ascii", "ignore").decode("ascii")
                    print(f"Groq Whisper ASR Transcript: {safe_print} (Language: {language})")
                except Exception:
                    pass
                
                if cleaned_path != input_path and os.path.exists(cleaned_path):
                    os.remove(cleaned_path)
                return {"transcript": transcript, "language": language}
        except Exception as e:
            print("Groq Whisper Cloud API failed, falling back to local model:", e)

    # Fallback to Local Whisper Model if installed
    if HAS_LOCAL_WHISPER:
        try:
            if _local_whisper_model is None:
                print("Loading local Whisper base model...")
                _local_whisper_model = whisper.load_model("base")
                
            result = _local_whisper_model.transcribe(cleaned_path, task="transcribe")
            transcript = result.get("text", "").strip()
            language = result.get("language", "en")
        except Exception as e:
            print("ASR local fallback failed completely:", e)
            transcript = "[ASR Error: Local Whisper execution failed]"
    else:
        print("ASR local Whisper library is not installed.")
        transcript = "[Demo Fallback] Groq API is offline and local Whisper is not installed."
        language = "en"

    if cleaned_path != input_path and os.path.exists(cleaned_path):
        try:
            os.remove(cleaned_path)
        except Exception:
            pass

    return {"transcript": transcript, "language": language}