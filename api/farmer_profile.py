import os
import json
import urllib.request

BUCKET_URL = "https://kvdb.io/kisan_alert_f47fcdd7/profiles"
LOCAL_PATH = os.path.join(os.path.dirname(__file__), "farmer_profiles.json")

def _load_all():
    try:
        req = urllib.request.Request(BUCKET_URL)
        with urllib.request.urlopen(req, timeout=5) as r:
            return json.loads(r.read().decode('utf-8'))
    except Exception as e:
        print("Cloud load failed, reading local:", e)
        if os.path.exists(LOCAL_PATH):
            try:
                with open(LOCAL_PATH, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                return {}
        return {}

def _save_all(profiles):
    try:
        req = urllib.request.Request(
            BUCKET_URL,
            data=json.dumps(profiles).encode('utf-8'),
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=5) as r:
            pass
    except Exception as e:
        print("Cloud save failed:", e)

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