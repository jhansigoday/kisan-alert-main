import os

# 1. Update script.js to send the profile in the chat body
filepath = 'script.js'
if os.path.exists(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        code = f.read()
    
    old_chat_body = """      body: JSON.stringify({
        message,
        phone: localStorage.getItem("krushakseva_phone"),
        history: chatHistory.slice(-10) // Send last 10 messages for context
      })"""
      
    new_chat_body = """      body: JSON.stringify({
        message,
        phone: localStorage.getItem("krushakseva_phone"),
        profile: registeredFarmer,
        history: chatHistory.slice(-10) // Send last 10 messages for context
      })"""
      
    code = code.replace(old_chat_body, new_chat_body)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(code)

# 2. Update api/index.py to read the profile from the request body
filepath = 'api/index.py'
if os.path.exists(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        code = f.read()
        
    old_extract = """    data = request.json or {}
    phone = data.get("phone", "")
    message = data.get("message", "")
    history = data.get("history", [])"""
    
    new_extract = """    data = request.json or {}
    phone = data.get("phone", "")
    message = data.get("message", "")
    history = data.get("history", [])
    profile = data.get("profile", {})
    
    if not profile and phone:
        p = get_profile(phone)
        if p:
            profile = p"""
            
    code = code.replace(old_extract, new_extract)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(code)

print('Ephemeral safety patch applied successfully!')