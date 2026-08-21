import os
import json
from twilio.twiml.voice_response import VoiceResponse, Gather
from farmer_profile import get_profile
from weather_alert import get_weather_alert
from advisory import _client
from tts import synthesize_speech

_SOS_SESSIONS = {}

def get_sos_session(session_id):
    return _SOS_SESSIONS.get(session_id)

def start_sos_call(session_id) -> str:
    """Initiates the SOS call and asks for language selection."""
    response = VoiceResponse()
    
    gather = Gather(num_digits=1, action="/api/sos/language-selected")
    gather.say("Welcome to KrushakSeva Emergency Assistance. Press 1 for English. తెలుగు కోసం 2 నొక్కండి.", voice="alice", language="en-IN")
    response.append(gather)
    
    response.redirect("/api/sos/language-selected")
    return str(response)

def handle_sos_language_selection(session_id: str, digit: str, phone: str = None, location: str = None) -> str:
    """Saves language choice and plays the disaster selection keypad prompt."""
    lang = "te" if str(digit).strip() == "2" else "en"
    
    _SOS_SESSIONS[session_id] = {
        "language": lang,
        "phone": phone,
        "location": location,
        "step": 1
    }
    
    response = VoiceResponse()
    gather = Gather(num_digits=1, action="/api/sos/disaster-selected")
    
    if lang == "te":
        gather.say("దయచేసి మీరు ఎదుర్కొంటున్న అత్యవసర పరిస్థితిని ఎంచుకోండి. వరద కోసం 1 నొక్కండి, తుఫాను కోసం 2 నొక్కండి, కరువు కోసం 3 నొక్కండి, భారీ వర్షం కోసం 4 నొక్కండి, వడగాల్పుల కోసం 5 నొక్కండి, తెగుళ్ళ దాడి కోసం 6 నొక్కండి, ఇతర అత్యవసర పరిస్థితుల కోసం 7 నొక్కండి.", voice="alice", language="te-IN")
    else:
        gather.say("Please select the emergency you are facing. Press 1 for Flood, Press 2 for Cyclone, Press 3 for Drought, Press 4 for Heavy Rain, Press 5 for Heat Wave, Press 6 for Pest Attack, Press 7 for Other Emergency.", voice="alice", language="en-IN")
        
    response.append(gather)
    response.redirect("/api/sos/disaster-selected")
    return str(response)

def handle_sos_disaster_selection(session_id: str, digit: str, host_url: str) -> str:
    """Processes the selected disaster, queries Llama 3.1 for localized guidance, and plays the advisory in full."""
    session = _SOS_SESSIONS.get(session_id)
    if not session:
        session = {
            "language": "en",
            "phone": "+918247543026",
            "location": "Nellore",
            "step": 1
        }
        _SOS_SESSIONS[session_id] = session

    lang = session.get("language", "en")
    phone = session.get("phone")
    
    disasters_en = {
        "1": "Flood",
        "2": "Cyclone",
        "3": "Drought",
        "4": "Heavy Rain",
        "5": "Heat Wave",
        "6": "Pest Attack",
        "7": "Other Emergency"
    }
    disasters_te = {
        "1": "వరదలు (Flood)",
        "2": "తుఫాను (Cyclone)",
        "3": "కరువు (Drought)",
        "4": "భారీ వర్షం (Heavy Rain)",
        "5": "వడగాల్పులు (Heat Wave)",
        "6": "తెగుళ్ళ దాడి (Pest Attack)",
        "7": "ఇతర అత్యవసర పరిస్థితులు (Other Emergency)"
    }
    
    disaster_choice = disasters_te.get(str(digit), "ఇతర అత్యవసర పరిస్థితులు") if lang == "te" else disasters_en.get(str(digit), "Other Emergency")
    
    profile = {}
    crop = "Rice"
    lat, lon = 14.4426, 79.9865
    if phone:
        profile = get_profile(phone) or {}
        crop = profile.get("crop_type", "Rice")
        lat = profile.get("latitude") or 14.4426
        lon = profile.get("longitude") or 79.9865
        
    weather_info = {}
    try:
        weather_info = get_weather_alert(lat, lon, lang)
    except Exception:
        pass
        
    lang_name = "Telugu" if lang == "te" else "English"
    
    system_prompt = (
        "You are an emergency agricultural responder. "
        "Generate immediate safety precautions and crop protection guidance. "
        "Include actionable, low-cost steps for: "
        f"Selected Disaster: {disaster_choice}, "
        f"Crop: {crop}, "
        f"Location coordinates: {lat}, {lon}. "
        f"Weather details: {weather_info.get('condition', 'unknown')}, Temp {weather_info.get('current_temp_c', 'unknown')}C. "
        f"Write your response ONLY in {lang_name} using simple, direct terms. Do NOT exceed 120 words so the voice audio doesn't cut off."
    )
    
    advisory_text = ""
    try:
        if _client:
            res = _client.chat.completions.create(
                model="qwen/qwen3.6-27b",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": "Generate emergency response instructions."}
                ],
                max_tokens=250,
                temperature=0.3
            )
            advisory_text = res.choices[0].message.content.strip()
    except Exception as e:
        print("Llama Emergency IVR generation failed:", e)
        
    if not advisory_text:
        if lang == "te":
            advisory_text = f"హే కృషక్. అత్యవసర పరిస్థితిగా {disaster_choice} ఎంపిక చేయబడింది. దయచేసి పొలంలో సురక్షిత ప్రదేశానికి వెళ్ళండి మరియు తదుపరి సమాచారం కోసం Rythu Seva Kendra ని సంప్రదించండి."
        else:
            advisory_text = f"Hello. Emergency {disaster_choice} has been selected. Please move to a safe location on your farm and contact Rythu Seva Kendra immediately."

    audio_path = synthesize_speech(advisory_text, lang)
    full_audio_url = f"{host_url.rstrip('/')}{audio_path}"
    
    response = VoiceResponse()
    response.play(full_audio_url)
    response.pause(length=3)
    response.hangup()
    
    return str(response), advisory_text, audio_path
