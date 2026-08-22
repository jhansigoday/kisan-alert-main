"""
ivr_flow.py — Keypad-driven (DTMF) voice conversation for farmers.
Minimizes the survey to exactly 6 necessary inputs: Language, Crop, Land Size, Soil, Water, and Problem.
"""

import os
import json
import re
import uuid
from groq import Groq
from twilio.twiml.voice_response import VoiceResponse, Gather
from dotenv import load_dotenv

# Import profile helpers
from farmer_profile import create_or_update_profile, get_profile
from flask import request
from tts import synthesize_speech

load_dotenv()

# Groq Client setup
_groq_key = os.environ.get("GROQ_API_KEY", "")
_client = Groq(api_key=_groq_key) if _groq_key else None

# In-memory store of each caller's dynamic session, keyed by CallSid or Web session ID
_call_sessions = {}

# DTMF Choices Mappings
_CROP_CHOICES = {
    "1": "Rice",
    "2": "Wheat",
    "3": "Maize",
    "4": "Groundnut",
    "5": "Cotton",
    "6": "Other"
}

_LAND_SIZE_CHOICES = {
    "1": "Less than 2 acres",
    "2": "2-5 acres",
    "3": "More than 5 acres"
}

_SOIL_CHOICES = {
    "1": "Black Soil",
    "2": "Red Soil",
    "3": "Alluvial Soil",
    "4": "Sandy Soil",
    "5": "Other"
}

_WATER_CHOICES = {
    "1": "Low",
    "2": "Medium",
    "3": "High"
}

_PROBLEM_CHOICES = {
    "1": "yellow leaves",
    "2": "brown spots",
    "3": "white powder on leaves",
    "4": "insects or pests",
    "5": "wilting plants",
    "6": "general farming advice"
}

# Keypad prompts
_PROMPTS = {
    "en": {
        "crop_type": "Please select your crop. Press 1 for Rice, 2 for Wheat, 3 for Maize, 4 for Groundnut, 5 for Cotton, or 6 for Other.",
        "land_size": "Select your land size. Press 1 for Less than 2 acres, 2 for 2 to 5 acres, or 3 for More than 5 acres.",
        "soil_type": "Select your soil type. Press 1 for Black soil, 2 for Red soil, 3 for Alluvial soil, 4 for Sandy soil, or 5 for Other.",
        "water_availability": "Select your water availability. Press 1 for Low, 2 for Medium, or 3 for High.",
        "problem": "Please select the problem you are facing. Press 1 for yellow leaves, Press 2 for brown spots, Press 3 for white powder on leaves, Press 4 for insects or pests, Press 5 for wilting plants, or Press 6 for general farming advice."
    },
    "te": {
        "crop_type": "మీ పంటను ఎంచుకోండి. వరి కోసం 1, గోధుమ కోసం 2, మొక్కజొన్న కోసం 3, వేరుశనగ కోసం 4, పత్తి కోసం 5, లేదా ఇతర పంటల కోసం 6 నొక్కండి.",
        "land_size": "మీ భూమి పరిమాణాన్ని ఎంచుకోండి. 2 ఎకరాల కంటే తక్కువ కోసం 1, 2 నుండి 5 ఎకరాల కోసం 2, లేదా 5 ఎకరాల కంటే ఎక్కువ కోసం 3 నొక్కండి.",
        "soil_type": "మీ పొలం మట్టి రకాన్ని ఎంచుకోండి. నల్ల రేగడి నేల కోసం 1, ఎర్ర నేల కోసం 2, ఒండ్రు నేల కోసం 3, ఇసుక నేల కోసం 4, లేదా ఇతర నేలల కోసం 5 నొక్కండి.",
        "water_availability": "మీ నీటి లభ్యతను ఎంచుకోండి. తక్కువ కోసం 1, మధ్యస్థం కోసం 2, లేదా ఎక్కువ కోసం 3 నొక్కండి.",
        "problem": "మీరు ఎదుర్కొంటున్న సమస్యను ఎంచుకోండి. ఆకులు పసుపు రంగులోకి మారడం కోసం 1, గోధుమ రంగు మచ్చల కోసం 2, ఆకులపై తెల్లటి పొడి కోసం 3, పురుగులు లేదా కీటకాల కోసం 4, మొక్కలు వాడిపోవడం కోసం 5, లేదా సాధారణ వ్యవసాయ సలహా కోసం 6 నొక్కండి."
    }
}

def start_call():
    """First response for Twilio: language selection menu (1: English, 2: Telugu)."""
    text = "Welcome to KrishakaSeva. For English, press 1. For Telugu, press 2."
    try:
        audio_url_path = synthesize_speech(text, "en")
        public_audio_url = f"{request.host_url.rstrip('/')}{audio_url_path}"
    except Exception as e:
        print("start_call TTS synthesis failed, falling back to Twilio Say:", e)
        public_audio_url = None

    response = VoiceResponse()
    gather = Gather(num_digits=1, action="/api/ivr/language-selected", method="POST")
    if public_audio_url:
        gather.play(public_audio_url)
    else:
        gather.say(text, voice="alice", language="en-IN")
    response.append(gather)
    response.say("We did not receive your selection. Goodbye.", voice="alice", language="en-IN")
    return str(response)

def handle_language_selection(call_sid: str, digit: str, phone: str = None, location: str = None, lat: float = None, lon: float = None) -> str:
    """Initialize session and generate the first crop selection keypad prompt."""
    lang = "te" if str(digit).strip() == "2" else "en"

    # Fetch latitude and longitude from DB if not passed directly
    if phone and (not lat or not lon):
        try:
            profile = get_profile(phone)
            if profile:
                lat = profile.get("latitude")
                lon = profile.get("longitude")
        except Exception:
            pass

    _call_sessions[call_sid] = {
        "language": lang,
        "phone": phone,
        "location": location or "unknown",
        "latitude": lat,
        "longitude": lon,
        "current_step": "crop_type",
        "answers": {
            "crop_type": None,
            "land_size": None,
            "soil_type": None,
            "water_availability": None,
            "problem": None
        },
        "completed": False
    }

    welcome_prefix = (
        "నా పేరు కృషక్‌సేవ. నేను మీకు సహాయం చేయడానికి ఇక్కడ ఉన్నాను. "
        if lang == "te" else
        "Hello, I am KrishakaSeva. I am here to help you. "
    )
    first_question = welcome_prefix + _PROMPTS[lang]["crop_type"]
    return first_question

def handle_language_selection_twilio(call_sid: str, digit: str, phone: str = None, location: str = None) -> str:
    """After language selection via Twilio keypad, return TwiML for first question."""
    welcome_text = handle_language_selection(call_sid, digit, phone, location)
    return get_twilio_response(call_sid, welcome_text, is_finished=False)

def handle_dtmf_input(call_sid: str, digit: str) -> tuple:
    """
    Processes one keypad press and returns (response_text, is_finished).
    Serves as the core state machine for the simplified 6-step IVR flow.
    """
    session = _call_sessions.get(call_sid)
    if not session:
        return "Session expired. Please start again.", True

    if session["completed"]:
        return "Thank you for calling KrishakaSeva. Goodbye.", True

    lang = session["language"]
    step = session["current_step"]
    digit = str(digit).strip()

    # Simplified 6-Step Keypad Transitions
    if step == "crop_type":
        val = _CROP_CHOICES.get(digit)
        if not val:
            return _PROMPTS[lang]["crop_type"], False
        session["answers"]["crop_type"] = val
        session["current_step"] = "land_size"
        
    elif step == "land_size":
        val = _LAND_SIZE_CHOICES.get(digit)
        if not val:
            return _PROMPTS[lang]["land_size"], False
        session["answers"]["land_size"] = val
        session["current_step"] = "soil_type"
        
    elif step == "soil_type":
        val = _SOIL_CHOICES.get(digit)
        if not val:
            return _PROMPTS[lang]["soil_type"], False
        session["answers"]["soil_type"] = val
        session["current_step"] = "water_availability"
        
    elif step == "water_availability":
        val = _WATER_CHOICES.get(digit)
        if not val:
            return _PROMPTS[lang]["water_availability"], False
        session["answers"]["water_availability"] = val
        session["current_step"] = "problem"
        
    elif step == "problem":
        val = _PROBLEM_CHOICES.get(digit)
        if not val:
            return _PROMPTS[lang]["problem"], False
        session["answers"]["problem"] = val
        
        # End of questionnaire
        session["current_step"] = "completed"
        session["completed"] = True
        
        # Generate final custom remedy from Groq Llama
        remedy = _generate_ai_remedy(session)
        
        # Save profile variables to Firestore
        _save_profile_to_db(session)
        
        goodbye_suffix = (
            " కృషక్‌సేవా కాల్ చేసినందుకు ధన్యవాదాలు. సెలవు!"
            if lang == "te" else
            " Thank you for calling KrishakaSeva. Goodbye!"
        )
        return remedy + goodbye_suffix, True

    # Advance to prompt next question
    next_step = session["current_step"]
    return _PROMPTS[lang][next_step], False

def handle_answer_twilio(call_sid: str, digit: str) -> str:
    """Processes farmer keypad input from Twilio, returns TwiML response."""
    ai_text, is_finished = handle_dtmf_input(call_sid, digit)
    return get_twilio_response(call_sid, ai_text, is_finished)

def get_twilio_response(call_sid: str, text_to_say: str, is_finished: bool = False) -> str:
    """Renders final TwiML responses with speech synthesis and keypad gather."""
    session = _call_sessions.get(call_sid, {})
    lang = session.get("language", "en")
    
    # Pre-synthesize text to high-quality natural MP3 using local Edge-TTS engine
    try:
        audio_url_path = synthesize_speech(text_to_say, lang)
        public_audio_url = f"{request.host_url.rstrip('/')}{audio_url_path}"
    except Exception as e:
        print("TTS synthesis failed, falling back to Twilio Say:", e)
        public_audio_url = None
        
    response = VoiceResponse()
    if is_finished:
        if public_audio_url:
            response.play(public_audio_url)
        else:
            voice, lang_code = ("alice", "te-IN") if lang == "te" else ("alice", "en-IN")
            response.say(text_to_say, voice=voice, language=lang_code)
        response.pause(length=3)
        response.hangup()
        end_session(call_sid)
    else:
        # Gather keypad press
        gather = Gather(num_digits=1, action="/api/ivr/answer-received", method="POST")
        if public_audio_url:
            gather.play(public_audio_url)
        else:
            voice, lang_code = ("alice", "te-IN") if lang == "te" else ("alice", "en-IN")
            gather.say(text_to_say, voice=voice, language=lang_code)
        response.append(gather)
        
        # Safe timeout prompt
        response.say("We did not receive any input. Goodbye.", voice="alice", language="en-IN")
        
    return str(response)

def _generate_ai_remedy(session: dict) -> str:
    """Queries Llama 3.1 on Groq to generate a customized structured remedy statement."""
    lang = session["language"]
    answers = session["answers"]
    lang_name = "Telugu" if lang == "te" else "English"
    
    lat = session.get("latitude")
    lon = session.get("longitude")
    
    if not lat or not lon:
        lat, lon = 14.4426, 79.9865
        
    weather_summary = "Weather data unavailable"
    forecast_summary = "Forecast data unavailable"
    try:
        from weather_alert import get_weather_alert
        weather = get_weather_alert(lat, lon, lang)
        curr = weather.get("weather", {})
        weather_summary = f"{curr.get('temp_c')}C, {curr.get('condition')}, Humidity: {curr.get('humidity')}%"
        forecast_list = [f"{day['date']}: {day['condition']} ({day['temp_max_c']}C/{day['temp_min_c']}C)" for day in weather.get("forecast", [])[:5]]
        forecast_summary = ", ".join(forecast_list)
    except Exception:
        pass
        
    mandi_context = "Mandi price data unavailable"
    try:
        from market_price import get_market_price
        mandi_res = get_market_price(answers.get("crop_type", "Rice"), lat, lon)
        if mandi_res and mandi_res.get("available"):
            mandi_context = (
                f"Crop Modal Price: Rs {mandi_res.get('modal_price')} per quintal. "
                f"Highest price paying mandi: {mandi_res.get('highest_paying_market')}."
            )
    except Exception:
        pass

    system_prompt = (
        "You are an expert agricultural scientist advising Indian farmers via an interactive voice system. "
        "Recommend a concise, highly tailored agricultural advice package using the farmer's specific environment details. "
        "You MUST structure your spoken advice to cover the following topics in order:\n"
        "1. Diagnosis of the problem / general advice\n"
        "2. Irrigation recommendations based on water availability and local weather\n"
        "3. Fertilizer or nutrient advice\n"
        "4. Pest or disease management advice\n"
        "5. Weather precautions using the 5-day forecast\n"
        "6. One critical recommendation based on current soil or weather conditions\n\n"
        "Keep your response concise and direct (approximately 20-40 seconds of reading time, under 4 sentences total). "
        f"Write your response ONLY in {lang_name}. Do NOT use markdown bold formatting (**), lists, bullets, or code blocks. Write as a single spoken paragraph."
    )
    
    user_prompt = (
        f"Farmer Profile & Inputs:\n"
        f"- Selected Crop: {answers['crop_type']}\n"
        f"- Land Size: {answers['land_size']}\n"
        f"- Soil Type: {answers['soil_type']} soil\n"
        f"- Water Availability: {answers['water_availability']}\n"
        f"- Farmer Problem: {answers['problem']}\n"
        f"- Current Weather: {weather_summary}\n"
        f"- 5-day Forecast: {forecast_summary}\n"
        f"- Live Mandi prices context: {mandi_context}\n"
        f"- Location coordinates: {lat}, {lon}\n"
    )
    
    try:
        if _client:
            res = _client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                max_tokens=400,
                temperature=0.3
            )
            return res.choices[0].message.content.strip()
    except Exception as e:
        print("Groq simplified remedy generator failed:", e)
        
    crop = answers["crop_type"]
    prob = answers["problem"]
    
    if lang == "te":
        if "insects" in prob or "pest" in prob:
            return "పంటకు కీటకాల నివారణకు లీటరు నీటికి 5 మిల్లీలీటర్ల వేప నూనె కలిపి ఆకులపై పిచికారీ చేయండి. వాతావరణం పొడిగా ఉండటంతో తెల్లవారుజామున నీటి తడులు ఇవ్వండి. స్థానిక మార్కెట్లో ధరలు అనుకూలంగా ఉన్నాయి."
        else:
            return f"మీరు ఎంచుకున్న {crop} పంటకు సంబంధించి, భూమి తేమను కాపాడటానికి మట్టి పరీక్షల ఆధారంగా నత్రజని ఎరువులు వేయండి. రాబోయే రోజుల్లో తేలికపాటి వర్ష సూచన ఉన్నందున అదనపు నీటి తడులు నిలిపివేయండి."
    else:
        if "insects" in prob or "pest" in prob:
            return "To control pests, spray neem oil at 5ml per liter of water under the leaves. Due to current dry weather, irrigate early in the morning. Market prices are favorable."
        else:
            return f"For your {crop} crop, apply nitrogen fertilizer to boost growth. Since rain is expected in the forecast, delay irrigation and clean drainage channels to protect roots."

def _save_profile_to_db(session: dict):
    """Saves the DTMF gathered details into the database/Firestore."""
    answers = session["answers"]
    phone = session.get("phone") or f"ivr_{session.get('language')}_{hash(str(session.get('location')))}"[-10:]
    try:
        land_size_str = answers.get("land_size", "2-5 acres")
        land_size_val = 1.0
        if "2-5" in land_size_str:
            land_size_val = 3.0
        elif "More than 5" in land_size_str:
            land_size_val = 6.0
            
        create_or_update_profile(
            phone=phone,
            location=session.get("location", "unknown"),
            land_size_acres=land_size_val,
            crop_type=answers.get("crop_type", ""),
            soil_type=answers.get("soil_type", ""),
            irrigation_method="",
            latitude=session.get("latitude"),
            longitude=session.get("longitude")
        )
    except Exception as e:
        print("Error saving farmer profile from IVR:", e)

def get_session(call_sid: str) -> dict:
    return _call_sessions.get(call_sid, {})

def end_session(call_sid: str):
    _call_sessions.pop(call_sid, None)