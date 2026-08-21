"""
farmer_profile.py — simple farmer profiling ("Krishi Sakhi" style)
Day 1/2 version: local JSON file storage. Swap for a real DB (SQLite/Postgres)
if the team has time later.
"""

import os
import json

SOURCE_PATH = os.path.join(os.path.dirname(__file__), "farmer_profiles.json")
PROFILE_PATH = "/tmp/farmer_profiles.json"


def _load_all():
    if not os.path.exists(PROFILE_PATH):
        import shutil
        if os.path.exists(SOURCE_PATH):
            try:
                shutil.copy(SOURCE_PATH, PROFILE_PATH)
            except Exception as e:
                print("Failed to copy profiles to /tmp, fallback to loading directly:", e)
                try:
                    with open(SOURCE_PATH, "r", encoding="utf-8") as f:
                        return json.load(f)
                except Exception:
                    return {}
        else:
            return {}
    try:
        with open(PROFILE_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}

def _save_all(data: dict):
    with open(PROFILE_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)


def translate_name_to_telugu(name: str) -> str:
    """Uses Groq to phonetically translate the English name to Telugu script."""
    if not name:
        return ""
    try:
        from groq import Groq
        import os
        import re
        groq_key = os.environ.get("GROQ_API_KEY", "")
        if groq_key:
            client = Groq(api_key=groq_key)
            res = client.chat.completions.create(
                model="qwen/qwen3.6-27b",
                messages=[
                    {"role": "system", "content": "You are a translation assistant. Translate the following English name phonetically to Telugu script. Respond ONLY with the translated Telugu script name. No explanation, no punctuation, no other words."},
                    {"role": "user", "content": name}
                ],
                max_tokens=500,
                temperature=0.0
            )
            reply = res.choices[0].message.content.strip()
            reply = re.sub(r"<think>.*?</think>", "", reply, flags=re.DOTALL)
            if "<think>" in reply:
                reply = reply.split("<think>")[0]
            return reply.strip()
    except Exception as e:
        print("Name translation failed:", e)
    return name


def create_or_update_profile(phone: str, name: str = "", location: str = "",
                              land_size_acres: float = None, crop_type: str = "",
                              soil_type: str = "", irrigation_method: str = "",
                              water_availability: str = "", soil_ph: float = None,
                              latitude: float = None, longitude: float = None,
                              name_telugu: str = "") -> dict:
    profiles = _load_all()
    profile = profiles.get(phone, {})
    
    stored_name = profile.get("name", "")
    stored_name_telugu = profile.get("name_telugu", "")
    
    resolved_name = name or stored_name
    resolved_name_telugu = name_telugu or stored_name_telugu
    
    if resolved_name and (resolved_name != stored_name or not resolved_name_telugu):
        resolved_name_telugu = translate_name_to_telugu(resolved_name)

    profile.update({
        "phone": phone,
        "name": resolved_name,
        "name_telugu": resolved_name_telugu,
        "location": location or profile.get("location", ""),
        "land_size_acres": land_size_acres if land_size_acres is not None else profile.get("land_size_acres"),
        "crop_type": crop_type or profile.get("crop_type", ""),
        "soil_type": soil_type or profile.get("soil_type", ""),
        "irrigation_method": irrigation_method or profile.get("irrigation_method", ""),
        "water_availability": water_availability or profile.get("water_availability", "Medium"),
        "soil_ph": soil_ph if soil_ph is not None else profile.get("soil_ph", 6.5),
        "latitude": latitude if latitude is not None else profile.get("latitude", 14.4426),
        "longitude": longitude if longitude is not None else profile.get("longitude", 79.9865),
    })
    profiles[phone] = profile
    _save_all(profiles)
    return profile


def get_profile(phone: str) -> dict:
    profiles = _load_all()
    profile = profiles.get(phone, {})
    if profile and profile.get("name") and not profile.get("name_telugu"):
        # Auto-translate for existing old database records
        profile["name_telugu"] = translate_name_to_telugu(profile["name"])
        profiles[phone] = profile
        _save_all(profiles)
    return profile


def get_latest_phone_number() -> str:
    """Returns the phone number of the latest profile added to the database."""
    profiles = _load_all()
    if not profiles:
        return ""
    return list(profiles.keys())[-1]