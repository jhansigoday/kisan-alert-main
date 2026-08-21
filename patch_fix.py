import os

filepath = 'api/index.py'
if os.path.exists(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        code = f.read()
    
    old_profile = """    profile = {}
    if phone:
        profile = get_profile(phone)"""
        
    new_profile = """    profile = {}
    if phone:
        p = get_profile(phone)
        if p:
            profile = p"""
            
    code = code.replace(old_profile, new_profile)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(code)
        
    print('NoneType crash patched successfully!')