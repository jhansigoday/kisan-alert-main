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
        print("Cloud save failed, error:", traceback.format_exc())"""

    target_idx = code.find("def normalize_phone")
    if target_idx != -1:
        code = new_header + "\n\n" + code[target_idx:]
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(code)
        print('Cloud DB Headers patched successfully!')
    else:
        print('Error: Could not find target function in file')