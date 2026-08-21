import os

filepath = 'api/farmer_profile.py'
if os.path.exists(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        code = f.read()

    new_header = """import os
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
        print("Cloud save failed:", e)"""

    target_idx = code.find("def create_or_update_profile")
    if target_idx != -1:
        code = new_header + "\n\n" + code[target_idx:]
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(code)
        print('Cloud DB integration applied successfully!')
    else:
        print('Error: Could not find target function in file')