import os

filepath = 'api/index.py'
if os.path.exists(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        code = f.read()
    
    # Replace the invalid model ID with the correct Groq model ID
    code = code.replace('model="qwen/qwen3.6-27b"', 'model="llama-3.3-70b-versatile"')
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(code)
        
    print('Model ID patched successfully!')