"""
sms_gateway.py — SMS and Outbound Call alerts layer using Twilio
"""

import os
from twilio.rest import Client
from dotenv import load_dotenv

load_dotenv()

_ACCOUNT_SID = os.environ.get("TWILIO_ACCOUNT_SID", "")
_AUTH_TOKEN = os.environ.get("TWILIO_AUTH_TOKEN", "")
_FROM_NUMBER = os.environ.get("TWILIO_PHONE_NUMBER", "")

_client = Client(_ACCOUNT_SID, _AUTH_TOKEN) if (_ACCOUNT_SID and _AUTH_TOKEN) else None


def send_sms(to_number: str, message: str) -> dict:
    """
    Sends an SMS via Twilio. On a trial account, 'to_number' must be a
    phone number verified in the Twilio console.
    """
    try:
        sms = _client.messages.create(
            body=message,
            from_=_FROM_NUMBER,
            to=to_number,
        )
        return {
            "sid": sms.sid,
            "status": sms.status,
            "to": to_number,
            "body": message,
        }
    except Exception as e:
        print("Twilio SMS send failed:", e)
        return {
            "error": str(e),
            "status": "failed",
            "to": to_number,
            "body": message
        }


def make_voice_call_alert(to_number: str, message_text: str) -> dict:
    """
    Triggers an outbound Twilio voice call and reads aloud the 
    personalized severe weather warning using Text-to-Speech.
    """
    try:
        from twilio.twiml.voice_response import VoiceResponse
        response = VoiceResponse()
        response.say(message_text, voice="alice", language="en-IN")
        twiml_str = str(response)

        call = _client.calls.create(
            twiml=twiml_str,
            from_=_FROM_NUMBER,
            to=to_number
        )
        return {
            "call_sid": call.sid,
            "status": call.status,
            "to": to_number
        }
    except Exception as e:
        print("Twilio Outbound Call trigger failed:", e)
        return {
            "error": str(e),
            "status": "failed",
            "to": to_number
        }


def dispatch_severe_weather_alert(phone: str, crop: str, location: str, weather_data: dict) -> dict:
    """
    Scans the weather dataset for active warnings and automatically sends 
    personalized SMS alerts and triggers outbound Twilio emergency calls.
    """
    alerts = weather_data.get("alerts", [])
    if not alerts:
        return {"status": "no_alerts", "message": "No severe conditions detected."}

    # Grab the highest severity alert
    alert = alerts[0]
    alert_type = alert["type"]
    alert_msg = alert["message"]
    
    # Grab language preference based on characters in alert_msg
    lang = "te" if any(0x0C00 <= ord(c) <= 0x0C7F for c in alert_msg) else "en"
    
    # Generate personalized recommendations
    remedy_hint = ""
    if alert_type == "HEAVY_RAIN":
        remedy_hint = (
            "Delay applying fertilizers or chemical sprays on your crop to prevent washing off, and clear drainage channels."
            if lang == "en" else
            "ఎరువులు లేదా మందులు పిచికారీ చేయడం వాయిదా వేయండి మరియు డ్రైనేజీ కాలువలను శుభ్రం చేయండి."
        )
    elif alert_type == "EXTREME_HEAT":
        remedy_hint = (
            "Increase watering cycles during early morning to prevent canopy drying."
            if lang == "en" else
            "ఎండ వేడిమి నుండి పంటను రక్షించడానికి తెల్లవారుజామున నీటి తడులు పెంచండి."
        )
    elif alert_type == "DRY_SPELL":
        remedy_hint = (
            "Conserve water and apply drip irrigation today to protect soil moisture."
            if lang == "en" else
            "నేలలో తేమను కాపాడటానికి డ్రిప్ పద్ధతిలో నీరు పెట్టండి."
        )
    elif alert_type == "FROST":
        remedy_hint = (
            "Provide light soil watering tonight to raise ambient temperature and protect seedlings."
            if lang == "en" else
            "మొక్కలను రక్షించడానికి రాత్రి సమయంలో తేలికపాటి తడులు ఇవ్వండి."
        )
    else:
        remedy_hint = (
            "Monitor crop status closely and consult extension officers."
            if lang == "en" else
            "పంట పరిస్థితిని నిరంతరం గమనిస్తూ ఉండండి మరియు వ్యవసాయ అధికారులను సంప్రదించండి."
        )
        
    title_msg = (
        f"🌾 KṛṣakaSevā Severe Alert for your crop {crop or 'Rice'} at {location or 'farm'}:\n"
        if lang == "en" else
        f"🌾 పంట రక్షణ హెచ్చరిక - మీ పంట {crop or 'వరి'} వద్ద {location or 'పొలం'}:\n"
    )
    warning_label = "Warning" if lang == "en" else "హెచ్చరిక"
    advice_label = "AI Advice" if lang == "en" else "AI సలహా"

    full_message = (
        f"{title_msg}"
        f"⚠️ {warning_label}: {alert_msg}\n"
        f"💡 {advice_label}: {remedy_hint}"
    )

    # 1. Dispatch SMS
    sms_res = send_sms(phone, full_message)
    
    # 2. Trigger Outbound phone call alert
    call_res = make_voice_call_alert(phone, full_message)

    return {
        "status": "dispatched",
        "alert_type": alert_type,
        "phone": phone,
        "sms_result": sms_res,
        "call_result": call_res
    }