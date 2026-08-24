import os
import json
import shutil

def _normalize_phone_backend(phone):
    phone = "".join(filter(str.isdigit, str(phone)))
    if len(phone) > 10 and phone.startswith("91"):
        phone = phone[-10:]
    return phone

# Choose writeable path based on environment
if os.environ.get("VERCEL") or os.access("/tmp", os.W_OK):
    PROFILES_FILE = "/tmp/profiles.json"
    if not os.path.exists(PROFILES_FILE):
        template_path = os.path.join(os.path.dirname(__file__), "farmer_profiles.json")
        if os.path.exists(template_path):
            try:
                shutil.copy(template_path, PROFILES_FILE)
            except Exception as e:
                print("Failed to copy template profiles:", e)
else:
    PROFILES_FILE = os.path.join(os.path.dirname(__file__), "farmer_profiles.json")

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
    normalized_input = _normalize_phone_backend(phone)
    profiles = _load_profiles()
    for k, v in list(profiles.items()):
        if _normalize_phone_backend(k) == normalized_input:
            return v
    return None

def create_or_update_profile(phone, data):
    if not phone:
        return {}
    normalized_phone = _normalize_phone_backend(phone)
    profiles = _load_profiles()
    profiles[normalized_phone] = data
    _save_profiles(profiles)
    return data

def delete_profile(phone):
    if not phone:
        return False
    normalized_phone = _normalize_phone_backend(phone)
    profiles = _load_profiles()
    for k in list(profiles.keys()):
        if _normalize_phone_backend(k) == normalized_phone:
            del profiles[k]
            _save_profiles(profiles)
            return True
    return False
