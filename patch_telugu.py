import os

filepath = 'api/farmer_profile.py'
if os.path.exists(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        code = f.read()
        
    old_def = 'LOCAL_PATH = os.path.join(os.path.dirname(__file__), "farmer_profiles.json")'
    new_def = 'LOCAL_PATH = os.path.join(os.path.dirname(__file__), "farmer_profiles.json")\n\ndef translate_name_to_telugu(name):\n    return name'
    
    code = code.replace(old_def, new_def)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(code)
        
    print('Telugu translation stub added successfully!')