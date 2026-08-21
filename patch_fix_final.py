import os

filepath = 'api/index.py'
if os.path.exists(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        code = f.read()
    
    # Insert normalize_phone helper right at the top of the file
    if 'def normalize_phone' not in code:
        code = code.replace('import os', 'import os\n\ndef normalize_phone(phone):\n    phone = "".join(filter(str.isdigit, str(phone)))\n    if len(phone) > 10 and phone.startswith("91"):\n        phone = phone[-10:]\n    return phone')
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(code)
        print('Added normalize_phone definition to api/index.py successfully!')
    else:
        print('normalize_phone is already defined in api/index.py!')