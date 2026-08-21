import os

# 1. Add phone normalization helper and patch requirements
filepath = 'api/index.py'
if os.path.exists(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        code = f.read()
        
    old_normalizer = """def get_profile(phone):"""
    new_normalizer = """def normalize_phone(phone):
    phone = "".join(filter(str.isdigit, str(phone)))
    if len(phone) > 10 and phone.startswith("91"):
        phone = phone[-10:]
    return phone

def get_profile(phone):
    phone = normalize_phone(phone)"""
    
    code = code.replace(old_normalizer, new_normalizer)
    
    # Normalize phone numbers in login and signup routes
    code = code.replace('phone = data.get("phone", "").strip()', 'phone = normalize_phone(data.get("phone", "").strip())')
    code = code.replace('phone = data.get("phone", "")', 'phone = normalize_phone(data.get("phone", ""))')
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(code)

# 2. Normalize phone numbers in farmer_profile database lookups
filepath = 'api/farmer_profile.py'
if os.path.exists(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        code = f.read()
        
    old_normalize_helpers = """def create_or_update_profile"""
    new_normalize_helpers = """def normalize_phone(phone):
    phone = "".join(filter(str.isdigit, str(phone)))
    if len(phone) > 10 and phone.startswith("91"):
        phone = phone[-10:]
    return phone

def create_or_update_profile"""
    
    code = code.replace(old_normalize_helpers, new_normalize_helpers)
    code = code.replace('profiles[phone] = profile', 'profiles[normalize_phone(phone)] = profile')
    code = code.replace('profile = profiles.get(phone)', 'profile = profiles.get(normalize_phone(phone))')
    code = code.replace('profiles.pop(phone, None)', 'profiles.pop(normalize_phone(phone), None)')
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(code)

# 3. Add groq to requirements.txt
filepath = 'requirements.txt'
if os.path.exists(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    if 'groq' not in content.lower():
        content = content.strip() + '\ngroq\n'
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
else:
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write('flask\nflask-cors\ngroq\n')

print('Phone normalization and requirements patched successfully!')