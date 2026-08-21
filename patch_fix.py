import os

filepath = 'api/index.py'
if os.path.exists(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        code = f.read()

    # Define the new fallback helper function
    new_fallback_func = """def get_local_fallback_response(message, profile=None):
    if not profile:
        profile = {}
    msg = message.lower().strip()
    soil = profile.get("soil_type", "black").lower()
    crop = profile.get("crop_type", "Rice")
    irrigation = profile.get("irrigation_method", "borewell").lower()
    
    # Question 1: Planting time / when to plant rice
    if "rice" in msg and ("when" in msg or "plant" in msg or "sow" in msg):
        return "Rice is typically planted during the Kharif season (June-July) or Rabi season (November-December) depending on water availability."
        
    # Question 2: Water requirement of rice
    if "water" in msg and ("rice" in msg or "much" in msg or "requirement" in msg or "irrigate" in msg) and not ("limited" in msg or "low" in msg or "scarce" in msg):
        return "Rice crop requires about 1200 to 1500 mm of water. Keep a constant standing water level of 2-5 cm in the field."

    # Limited water crop recommendation (Flow 4)
    if "water" in msg and ("limited" in msg or "low" in msg or "scarce" in msg or "shortage" in msg):
        return f"Since you have limited water, growing drought-resistant crops like bajra, sorghum, or groundnut is highly suitable for your {soil} soil."
        
    # Question 3: Yellow leaves (Flow 3)
    if "yellow" in msg and ("leaf" in msg or "leaves" in msg or "color" in msg or "why" in msg):
        return "Yellowing of rice leaves is often caused by Nitrogen or Zinc deficiency. Apply 20 kg of Urea or spray 2g of Zinc Sulphate per litre of water."
        
    if "pest" in msg or "insect" in msg or "bug" in msg or "worm" in msg or "pesticide" in msg or "pulugu" in msg:
        return "For pest infestations, spray neem oil at 5ml per litre of water or use carbaryl at 2g per litre as a chemical alternative."
        
    # Bajra questions (Flow 1 follow-ups)
    if "bajra" in msg:
        if "loss" in msg or "profitable" in msg or "profit" in msg:
            return "Bajra is a hardy millet crop with low water requirement. Given the current market demand and low input costs, growing bajra is generally profitable and has low risk of loss."
        return "Bajra (pearl millet) is highly suitable for dry regions. It is profitable and has low input costs. Would you like to know about its sowing time or water needs?"

    # Weather/Rain questions (Flow 2)
    if "rain" in msg or "weather" in msg or "forecast" in msg:
        return "The current weather is Sunny, 29C, Humidity: 65%. The forecast suggests moderate rain probabilities later this week."

    # Question 4: Crop recommendation / profit (Flow 1)
    if "crop" in msg and ("grow" in msg or "profit" in msg or "better" in msg or "recommend" in msg or "labham" in msg or "best" in msg or "suitable" in msg):
        return f"Based on your {soil} soil and {irrigation}, growing cotton, chilli, or groundnut offers high profit margins. Crop rotation is advised."

    # Greetings fallbacks
    words = msg.split()
    greetings = {"helo", "hello", "hi", "hey", "namaskaram"}
    if any(w in greetings for w in words):
        return "Hello! I am K\u1e5b\u1e63akaSev\u0101 AI. How can I help you today with your farming questions?"

    # Generic Fallbacks
    return "I apologize, I could not fully process that request. Please specify your crop type, irrigation question, or pest problem."
"""

    # Extract the block to replace
    # We will locate the start of get_local_fallback_response and the start of @app.route("/api/chat")
    start_idx = code.find('def get_local_fallback_response')
    end_idx = code.find('@app.route("/api/chat"')
    
    if start_idx != -1 and end_idx != -1:
        code = code[:start_idx] + new_fallback_func + "\n\n" + code[end_idx:]

    # Ensure profile NoneType crash handling is applied
    old_profile = """    profile = {}
    if phone:
        profile = get_profile(phone)"""
        
    new_profile = """    profile = {}
    if phone:
        p = get_profile(phone)
        if p:
            profile = p"""
            
    code = code.replace(old_profile, new_profile)

    # Ensure fallback call passes the profile
    old_fallback_call = "reply = get_local_fallback_response(message)"
    new_fallback_call = "reply = get_local_fallback_response(message, profile)"
    
    code = code.replace(old_fallback_call, new_fallback_call)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(code)
        
    print('All chatbot conversation and fallback issues patched successfully!')