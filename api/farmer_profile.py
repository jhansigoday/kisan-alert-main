import os
import json

# Choose writeable path based on environment
if os.environ.get("VERCEL") or os.access("/tmp", os.W_OK):
    PROFILES_FILE = "/tmp/profiles.json"
else:
    PROFILES_FILE = os.path.join(os.path.dirname(__file__), "profiles.json")

def _load_profiles() -> dict:
    if os.path.exists(PROFILES_FILE):
        try:
            with open(PROFILES_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {}
    return {}

def _save_profiles(profiles: dict):
    try:
        with open(PROFILES_FILE, "w", encoding="utf-8") as f:
            json.dump(profiles, f, indent=4, ensure_ascii=False)
    except Exception as e:
        print("Failed to save profiles:", e)

def get_profile(phone):
    if not phone:
        return None
    profiles = _load_profiles()
    return profiles.get(str(phone))

def create_or_update_profile(phone, data):
    if not phone:
        return {}
    profiles = _load_profiles()
    profiles[str(phone)] = data
    _save_profiles(profiles)
    return data

def delete_profile(phone):
    if not phone:
        return False
    profiles = _load_profiles()
    if str(phone) in profiles:
        del profiles[str(phone)]
        _save_profiles(profiles)
        return True
    return False
