import os
import json
import urllib.request

BUCKET_URL = "https://kvdb.io/kisan_alert_f47fcdd7/profiles"
LOCAL_PATH = os.path.join(os.path.dirname(__file__), "farmer_profiles.json")

def translate_name_to_telugu(name):
    return name

def _load_all():
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
    try:
        req = urllib.request.Request(BUCKET_URL, headers=headers)
        with urllib.request.urlopen(req, timeout=5) as r:
            return json.loads(r.read().decode('utf-8'))
    except Exception as e:
        import traceback
        print("Cloud load failed, error:", traceback.format_exc())
        if os.path.exists(LOCAL_PATH):
            try:
                with open(LOCAL_PATH, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                return {}
        return {}

def _save_all(profiles):
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Content-Type": "application/json"
    }
    try:
        req = urllib.request.Request(
            BUCKET_URL,
            data=json.dumps(profiles).encode('utf-8'),
            headers=headers,
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=5) as r:
            pass
    except Exception as e:
        import traceback
        print("Cloud save failed, error:", traceback.format_exc())

def normalize_phone(phone):
    phone = "".join(filter(str.isdigit, str(phone)))
    if len(phone) > 10 and phone.startswith("91"):
        phone = phone[-10:]
    return phone

def normalize_phone(phone):
    phone = "".join(filter(str.isdigit, str(phone)))
    if len(phone) > 10 and phone.startswith("91"):
        phone = phone[-10:]
    return phone

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
    profiles[normalize_phone(phone)] = profile
    _save_all(profiles)
    return profile


def get_profile(phone: str) -> dict:
    profiles = _load_all()
    profile = profiles.get(phone, {})
    if profile and profile.get("name") and not profile.get("name_telugu"):
        # Auto-translate for existing old database records
        profile["name_telugu"] = translate_name_to_telugu(profile["name"])
        profiles[normalize_phone(phone)] = profile
        _save_all(profiles)
    return profile


def get_latest_phone_number() -> str:
    """Returns the phone number of the latest profile added to the database."""
    profiles = _load_all()
    if not profiles:
        return ""
    return list(profiles.keys())[-1]