import os

filepath = 'api/index.py'
if os.path.exists(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        code = f.read()
    
    # 1. Update the fallback helper to accept and use the profile dictionary
    old_fallback_def = "def get_local_fallback_response(message):"
    new_fallback_def = """def get_local_fallback_response(message, profile=None):
    if not profile:
        profile = {}
    soil = profile.get('soil_type', 'black').lower()
    irrigation = profile.get('irrigation_method', 'irrigation').lower()"""
    
    code = code.replace(old_fallback_def, new_fallback_def)

    # 2. Update Question 4 in the fallback to use the dynamic soil and irrigation variables
    old_fallback_q4 = 'return "Based on your black soil and irrigation, growing cotton, chilli, or groundnut offers high profit margins. Crop rotation is advised."'
    new_fallback_q4 = 'return f"Based on your {soil} soil and {irrigation}, growing cotton, chilli, or groundnut offers high profit margins. Crop rotation is advised."'
    
    code = code.replace(old_fallback_q4, new_fallback_q4)

    # 3. Update the crash handler in the chatbot endpoint
    old_profile = """    profile = {}
    if phone:
        profile = get_profile(phone)"""
        
    new_profile = """    profile = {}
    if phone:
        p = get_profile(phone)
        if p:
            profile = p"""
            
    code = code.replace(old_profile, new_profile)

    # 4. Pass the profile dictionary into the fallback helper on exceptions
    old_fallback_call = "reply = get_local_fallback_response(message)"
    new_fallback_call = "reply = get_local_fallback_response(message, profile)"
    
    code = code.replace(old_fallback_call, new_fallback_call)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(code)
        
    print('Dynamic fallback and NoneType crash patched successfully!')