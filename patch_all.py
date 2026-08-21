import os, json, shutil

# 1. Patch api/farmer_profile.py (Vercel read-only crash)
filepath = 'api/farmer_profile.py'
if os.path.exists(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        code = f.read()
    old_path = 'PROFILE_PATH = os.path.join(os.path.dirname(__file__), "farmer_profiles.json")'
    new_path = 'SOURCE_PATH = os.path.join(os.path.dirname(__file__), "farmer_profiles.json")\nPROFILE_PATH = "/tmp/farmer_profiles.json"'
    code = code.replace(old_path, new_path)
    old_load = """def _load_all():
    if not os.path.exists(PROFILE_PATH):
        return {}
    try:
        with open(PROFILE_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}"""
    new_load = """def _load_all():
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
        return {}"""
    code = code.replace(old_load, new_load)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(code)

# 2. Patch script.js (Signout crash)
filepath = 'script.js'
if os.path.exists(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        code = f.read()
    old_signout = """    // Clear inputs in the login box
    document.getElementById("auth-phone-input").value = "";
    document.getElementById("auth-name-input").value = "";
    document.getElementById("auth-state").value = "";
    document.getElementById("auth-district").value = "";
    document.getElementById("auth-mandal").value = "";
    document.getElementById("auth-village").value = "";
    document.getElementById("auth-pin").value = "";"""
    new_signout = """    // Clear inputs in the login box
    document.getElementById("auth-phone-input").value = "";
    document.getElementById("auth-name-input").value = "";"""
    code = code.replace(old_signout, new_signout)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(code)

# 3. Patch api/index.py (Signup duplicate auto-login + Chatbot hi/which bug)
filepath = 'api/index.py'
if os.path.exists(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        code = f.read()
    
    # Enable signup duplicate auto-login
    old_signup = '    existing_profile = get_profile(phone)\n    if existing_profile:\n        return jsonify({"error": "Account already exists. Please Log In instead."}), 400'
    new_signup = '    existing_profile = get_profile(phone)\n    if existing_profile:\n        return jsonify(existing_profile), 200'
    code = code.replace(old_signup, new_signup)

    # Fix greeting hi/which conflict in fallback matching
    old_greeting = """    # Greetings fallbacks
    if "helo" in msg or "hello" in msg or "hi" in msg or "hey" in msg:
        return "Hello! I am KṛṣakaSevā AI. How can I help you today with your farming questions?" """
    
    new_greeting = """    # Greetings fallbacks
    words = msg.split()
    greetings = {"helo", "hello", "hi", "hey", "namaskaram"}
    if any(w in greetings for w in words):
        return "Hello! I am KṛṣakaSevā AI. How can I help you today with your farming questions?" """
    
    code = code.replace(old_greeting, new_greeting)

    # Improve crop recommendation keywords (add best/suitable)
    old_crop = """    if "crop" in msg and ("grow" in msg or "profit" in msg or "better" in msg or "recommend" in msg or "labham" in msg):"""
    new_crop = """    if "crop" in msg and ("grow" in msg or "profit" in msg or "better" in msg or "recommend" in msg or "labham" in msg or "best" in msg or "suitable" in msg):"""
    code = code.replace(old_crop, new_crop)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(code)

print('All files patched successfully!')