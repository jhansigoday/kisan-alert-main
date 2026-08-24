"""
index.py — Flask app, route definitions (configured for Vercel)
"""

import os
import json
import sys
import uuid

def normalize_phone(phone):
    phone = "".join(filter(str.isdigit, str(phone)))
    if len(phone) > 10 and phone.startswith("91"):
        phone = phone[-10:]
    return phone

# Inject the api/ directory path into sys.path to resolve serverless imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from flask import Flask, request, jsonify, send_from_directory
from ivr_flow import start_call, handle_language_selection, handle_language_selection_twilio, handle_dtmf_input, handle_answer_twilio, get_session, end_session
from flask_cors import CORS
import requests
from weather_alert import get_weather_alert
from farmer_profile import create_or_update_profile, get_profile
from feedback import log_feedback
from crop_recommendation import recommend_crops
from satellite_monitoring import get_field_health_report
from extension_office import find_nearest_office
# Deferring asr import to prevent cold start latency
# Deferring image_diagnosis import to prevent cold start latency
from advisory import generate_advisory
from tts import synthesize_speech, synthesize_speech_data_url
from market_price import get_market_price
# Vercel supplies environment variables directly.  Loading a local .env is
# optional so the server still starts when python-dotenv is not installed.
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass
from sms_gateway import send_sms
from twilio.twiml.voice_response import VoiceResponse

app = Flask(__name__, static_folder="static")
CORS(app)

def get_public_host_url():
    host = request.headers.get("Host", "")
    if "ngrok" in host:
        return f"https://{host}"
    if "localhost" in host or "127.0.0.1" in host:
        return "https://sagging-rewind-happiness.ngrok-free.dev"
    return request.host_url

# Configure UPLOAD_DIR (with fallback to /tmp if filesystem is read-only)
try:
    UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    # test write permission
    test_file = os.path.join(UPLOAD_DIR, ".write_test")
    with open(test_file, "w") as f:
        f.write("test")
    os.remove(test_file)
except OSError:
    UPLOAD_DIR = "/tmp/uploads"
    os.makedirs(UPLOAD_DIR, exist_ok=True)

def _save_upload(file_obj, subdir="") -> str:
    ext = os.path.splitext(file_obj.filename)[1]
    filename = f"{uuid.uuid4().hex}{ext}"
    target_dir = os.path.join(UPLOAD_DIR, subdir)
    os.makedirs(target_dir, exist_ok=True)
    path = os.path.join(target_dir, filename)
    file_obj.save(path)
    return path


@app.route("/api/voice-query", methods=["POST"])
def voice_query():
    if "audio" not in request.files:
        return jsonify({"error": "No audio file provided"}), 400

    audio_path = _save_upload(request.files["audio"], subdir="audio")

    try:
        from asr import transcribe_audio
        asr_result = transcribe_audio(audio_path)
        transcript = asr_result["transcript"]
        lang = request.form.get("lang", "en").strip()

        advisory_result = generate_advisory(transcript=transcript, lang=lang)
        advisory_text = advisory_result["advisory_text"]

        audio_reply_url = synthesize_speech(advisory_text, language=lang)

        return jsonify({
            "transcript": transcript,
            "language": lang,
            "advisory_text": advisory_text,
            "audio_reply_url": audio_reply_url,
        })
    finally:
        if os.path.exists(audio_path):
            os.remove(audio_path)


@app.route("/api/photo-query", methods=["POST"])
def photo_query():
    if "image" not in request.files:
        return jsonify({"error": "No image file provided"}), 400

    image_path = _save_upload(request.files["image"], subdir="images")
    phone = request.form.get("phone", "")
    profile_json = request.form.get("profile")
    farmer_profile = {}
    if profile_json:
        try:
            farmer_profile = json.loads(profile_json) or {}
        except Exception:
            pass
    if not farmer_profile and phone:
        farmer_profile = get_profile(phone) or {}

    transcript = None
    language = "en"
    audio_path = None
    if "audio" in request.files:
        audio_path = _save_upload(request.files["audio"], subdir="audio")

    try:
        from image_diagnosis import diagnose_leaf
        diagnosis = diagnose_leaf(image_path, original_filename=request.files["image"].filename)
        diagnosis_state = diagnosis.get("state", "unavailable")
        disease_label = diagnosis.get("disease_label")
        confidence = diagnosis.get("confidence")
        
        lang = request.form.get("lang", "en").strip()

        crop_name = diagnosis.get("crop_name") or ""
        price_info = get_market_price(crop_name) if crop_name else {"available": False}

        if audio_path:
            from asr import transcribe_audio
            asr_result = transcribe_audio(audio_path)
            transcript = asr_result["transcript"]
            language = asr_result["language"]

        if "report" in diagnosis:
            report = diagnosis["report"]
        elif diagnosis_state in {"high", "moderate"}:
            from advisory import generate_crop_doctor_report
            report = generate_crop_doctor_report(
                disease_label=disease_label,
                confidence=confidence,
                lang=lang,
                farmer_profile=farmer_profile,
                crop_name=crop_name,
                diagnosis_state=diagnosis_state,
            )
        else:
            caution = diagnosis.get("message") or "⚠️ Unable to reliably diagnose this image. Please upload a clear image of the affected plant leaf."
            report = {
                "crop_name": "",
                "disease_name": "Unable to reliably diagnose this image",
                "symptoms": caution,
                "causes": "A disease-specific cause cannot be confirmed from this image.",
                "treatment": "Upload a clear close-up of the affected leaf and consult a local agricultural expert if symptoms are spreading.",
                "organic_solution": "No disease-specific treatment is recommended until the diagnosis is confirmed.",
                "chemical_solution": "No chemical recommendation is provided for an uncertain diagnosis.",
                "preventive_measures": "Clean tools between plants and monitor nearby leaves for changes.",
                "ai_recommendations": caution,
                "spoken_explanation": caution,
            }
        
        # Merge properties into result dictionary
        advisory_text = report.get("ai_recommendations", "")
        disease_label = report.get("disease_name", disease_label)
        crop_name = report.get("crop_name", diagnosis.get("crop_name", crop_name))

        needs_escalation = diagnosis_state not in {"high", "moderate"} or (confidence is not None and confidence < 0.6)
        nearest_office = None
        if needs_escalation and farmer_profile.get("location"):
            try:
                lat = float(request.form.get("lat", 17.6868))
                lon = float(request.form.get("lon", 83.2185))
                nearest_office = find_nearest_office(lat, lon)
            except (TypeError, ValueError):
                pass

        spoken_explanation = report.get("spoken_explanation", advisory_text)
        try:
            audio_reply_url = synthesize_speech_data_url(spoken_explanation, language=lang)
        except Exception as error:
            # A diagnosis must still be shown if the optional audio provider
            # is unavailable.
            print("Crop Doctor TTS generation failed:", error)
            audio_reply_url = None

        return jsonify({
            "disease_label": disease_label,
            "crop_name": crop_name,
            "confidence": confidence,
            "diagnosis_state": diagnosis_state,
            "diagnosis_message": diagnosis.get("message", ""),
            "confidence_level": diagnosis.get("confidence_level", "unavailable"),
            "transcript": transcript,
            "advisory_text": advisory_text,
            "spoken_explanation": spoken_explanation,
            "audio_reply_url": audio_reply_url,
            "needs_escalation": needs_escalation,
            "market_price": price_info,
            "nearest_office": nearest_office,
            "symptoms": report.get("symptoms", ""),
            "causes": report.get("causes", ""),
            "treatment": report.get("treatment", ""),
            "organic_solution": report.get("organic_solution", ""),
            "chemical_solution": report.get("chemical_solution", ""),
            "preventive_measures": report.get("preventive_measures", "")
        })
    except Exception as error:
        import traceback
        error_details = traceback.format_exc()
        # Avoid Vercel's HTML error page so the frontend always receives a
        # usable JSON response, while retaining details in deployment logs.
        print("Crop Doctor request failed:", error_details)
        return jsonify({
            "error": f"Crop Doctor is temporarily unavailable. Error: {repr(error)}",
            "traceback": error_details
        }), 503
    finally:
        if os.path.exists(image_path):
            os.remove(image_path)
        if audio_path and os.path.exists(audio_path):
            os.remove(audio_path)
@app.route("/static/audio_replies/<filename>")
def serve_audio_reply(filename):
    if os.environ.get("VERCEL"):
        return send_from_directory("/tmp/static/audio_replies", filename)
    else:
        static_dir = os.path.join(os.path.dirname(__file__), "static", "audio_replies")
        return send_from_directory(static_dir, filename)

@app.route("/api/market-price", methods=["GET"])
def market_price():
    crop = request.args.get("crop", "").strip()
    location = request.args.get("location", "").strip()
    if not crop:
        return jsonify({"error": "Missing 'crop' query parameter"}), 400
    try:
        lat = float(request.args.get("lat"))
        lon = float(request.args.get("lon"))
        return jsonify(get_market_price(crop, lat, lon, location))
    except (TypeError, ValueError):
        return jsonify(get_market_price(crop, location=location))


@app.route("/api/analytics", methods=["GET"])
def analytics():    # Day 3 stretch — placeholder for query-logging aggregation
    return jsonify({"message": "Analytics not yet implemented (Day 3 stretch goal)"})

@app.route("/api/weather-alert", methods=["GET"])
def weather_alert():
    try:
        lat = float(request.args.get("lat"))
        lon = float(request.args.get("lon"))
    except (TypeError, ValueError):
        return jsonify({"error": "Missing or invalid 'lat'/'lon' query parameters"}), 400
    lang = request.args.get("lang", "en").strip()
    return jsonify(get_weather_alert(lat, lon, lang))


@app.route("/api/auth/login-no-otp", methods=["POST"])
def login_no_otp():
    data = request.get_json(force=True) or {}
    phone = normalize_phone(data.get("phone", "").strip())
    if not phone:
        return jsonify({"error": "Missing 'phone' field"}), 400
        
    profile = get_profile(phone)
    if not profile:
        return jsonify({"error": "Account not found. Please Sign Up first."}), 404
        
    return jsonify({
        "status": "success",
        "new_user": False,
        "profile": profile
    })


_active_otps = {}

@app.route("/api/auth/send-otp", methods=["POST"])
def send_otp():
    data = request.get_json(force=True) or {}
    phone = normalize_phone(data.get("phone", "").strip())
    if not phone:
        return jsonify({"error": "Missing 'phone' field"}), 400
        
    import random
    otp = str(random.randint(100000, 999999))
    _active_otps[phone] = otp
    
    # Send actual SMS if twilio is set up
    try:
        from sms_gateway import send_sms
        send_sms(phone, f"🌾 KṛṣakaSevā OTP: {otp}. Use this code to log in securely.")
    except Exception as e:
        print("Twilio SMS send error:", e)
        
    print(f"====================================\n[AUTH] Secure OTP generated for {phone}: {otp}\n====================================")
    return jsonify({"status": "sent", "otp_demo": otp})

@app.route("/api/auth/verify-otp", methods=["POST"])
def verify_otp():
    data = request.get_json(force=True) or {}
    phone = normalize_phone(data.get("phone", "").strip())
    otp = data.get("otp", "").strip()
    if not phone or not otp:
        return jsonify({"error": "Missing 'phone' or 'otp' fields"}), 400
        
    expected_otp = _active_otps.get(phone)
    if expected_otp != otp:
        return jsonify({"error": "Invalid OTP code"}), 400
        
    # Correct OTP, pop from memory
    _active_otps.pop(phone, None)
    
    # Check if profile exists
    from farmer_profile import get_profile
    profile = get_profile(phone)
    if profile:
        return jsonify({
            "status": "success",
            "new_user": False,
            "profile": profile
        })
    else:
        return jsonify({
            "status": "success",
            "new_user": True
        })


@app.route("/api/sos/broadcast", methods=["POST"])
def sos_broadcast():
    data = request.get_json(force=True) or {}
    phone = normalize_phone(data.get("phone", "").strip())
    event_type = data.get("event_type", "General Emergency").strip()
    lat = data.get("latitude", "unknown")
    lon = data.get("longitude", "unknown")
    location = data.get("location", "unknown")
    
    if not phone:
        return jsonify({"error": "Missing 'phone' field"}), 400
        
    broadcast_msg = (
        f"🚨 [SOS KṛṣakaSevā BROADCAST]\n"
        f"Farmer Mobile: {phone}\n"
        f"Emergency Event: {event_type}\n"
        f"📍 Location: {location}\n"
        f"🌐 GPS Coordinates: {lat}, {lon}\n"
        f"Status: Emergency assistance dispatched."
    )
    
    # Send SMS alert to farmer and regional officer
    sms_res = {}
    try:
        from sms_gateway import send_sms
        sms_res = send_sms(phone, broadcast_msg)
        # Send also to Mandal Extension Officer
        send_sms("+919848012345", broadcast_msg)
    except Exception as e:
        print("SOS Broadcast Twilio SMS failure:", e)
        sms_res = {"error": str(e)}
        
    try:
        print("[SOS BROADCAST] Dispatched")
    except Exception:
        pass
    return jsonify({
        "status": "dispatched",
        "message": "SOS broadcast successfully transmitted via Twilio.",
        "details": sms_res
    })


@app.route("/api/sos/call-farmer", methods=["POST"])
def sos_call_farmer():
    data = request.get_json(force=True) or {}
    phone = normalize_phone(data.get("phone", "").strip())
    if not phone:
        return jsonify({"error": "Missing 'phone' field"}), 400

    account_sid = os.environ.get("TWILIO_ACCOUNT_SID")
    auth_token = os.environ.get("TWILIO_AUTH_TOKEN")
    from_number = os.environ.get("TWILIO_PHONE_NUMBER") or os.environ.get("TWILIO_FROM_NUMBER")

    from sms_gateway import send_sms
    send_sms(phone, "🚨 [KṛṣakaSevā Emergency Call Alert]\nAn emergency voice assistance call has been placed to your number. Please answer immediately.")

    if not account_sid or not auth_token or not from_number:
        return jsonify({
            "status": "demo",
            "message": "Twilio credentials missing. Running SOS simulator."
        })

    try:
        from twilio.rest import Client
        client = Client(account_sid, auth_token)
        twiml_url = f"{get_public_host_url().rstrip('/')}/api/sos/incoming-call"
        
        call = client.calls.create(
            url=twiml_url,
            to=phone,
            from_=from_number
        )
        return jsonify({
            "status": "triggered",
            "call_sid": call.sid,
            "message": "Outbound interactive SOS Emergency call placed successfully."
        })
    except Exception as e:
        print("SOS Twilio Outbound Call trigger failed:", e)
        return jsonify({"error": str(e)}), 500


@app.route("/api/sos/incoming-call", methods=["GET", "POST"])
def sos_incoming_call():
    from sos_flow import start_sos_call
    call_sid = request.values.get("CallSid") or "web_sos_session"
    twiml = start_sos_call(call_sid)
    return twiml, 200, {"Content-Type": "text/xml"}


@app.route("/api/sos/language-selected", methods=["GET", "POST"])
def sos_language_selected():
    from sos_flow import handle_sos_language_selection
    call_sid = request.values.get("CallSid") or "web_sos_session"
    digit = request.values.get("Digits", "1")
    phone = request.values.get("From")
    location = request.values.get("FromCity") or request.values.get("FromState") or "unknown"
    twiml = handle_sos_language_selection(call_sid, digit, phone, location)
    return twiml, 200, {"Content-Type": "text/xml"}


@app.route("/api/sos/disaster-selected", methods=["GET", "POST"])
def sos_disaster_selected():
    from sos_flow import handle_sos_disaster_selection
    call_sid = request.values.get("CallSid") or "web_sos_session"
    digit = request.values.get("Digits", "1")
    twiml, advisory_text, audio_url = handle_sos_disaster_selection(call_sid, digit, get_public_host_url())
    return twiml, 200, {"Content-Type": "text/xml"}


@app.route("/api/sos/web/start", methods=["POST"])
def sos_web_start():
    from sos_flow import start_sos_call
    session_id = request.json.get("session_id") or "web_sos_session"
    twiml = start_sos_call(session_id)
    
    from tts import synthesize_speech
    welcome_text = "Welcome to KrushakSeva Emergency Assistance. Press 1 for English. తెలుగు కోసం 2 నొక్కండి."
    audio_url = synthesize_speech(welcome_text, "en")
    
    return jsonify({
        "session_sid": session_id,
        "text": welcome_text,
        "audio_url": audio_url,
        "language": "en",
        "is_finished": False
    })


@app.route("/api/sos/web/step", methods=["POST"])
def sos_web_step():
    data = request.get_json(force=True) or {}
    session_id = data.get("session_id") or "web_sos_session"
    digit = data.get("digit", "1")
    phone = normalize_phone(data.get("phone", ""))
    
    from sos_flow import get_sos_session, handle_sos_language_selection, handle_sos_disaster_selection
    session = get_sos_session(session_id)
    
    if not session:
        handle_sos_language_selection(session_id, digit, phone=phone)
        session = get_sos_session(session_id)
        lang = session.get("language", "en")
        
        prompt_text = (
            "దయచేసి మీరు ఎదుర్కొంటున్న అత్యవసర పరిస్థితిని ఎంచుకోండి. వరద కోసం 1 నొక్కండి, తుఫాను కోసం 2 నొక్కండి, కరువు కోసం 3 నొక్కండి, భారీ వర్షం కోసం 4 నొక్కండి, వడగాల్పుల కోసం 5 నొక్కండి, తెగుళ్ళ దాడి కోసం 6 నొక్కండి, ఇతర అత్యవసర పరిస్థితుల కోసం 7 నొక్కండి."
            if lang == "te" else
            "Please select the emergency you are facing. Press 1 for Flood, Press 2 for Cyclone, Press 3 for Drought, Press 4 for Heavy Rain, Press 5 for Heat Wave, Press 6 for Pest Attack, Press 7 for Other Emergency."
        )
        from tts import synthesize_speech
        audio_url = synthesize_speech(prompt_text, lang)
        
        return jsonify({
            "session_sid": session_id,
            "text": prompt_text,
            "audio_url": audio_url,
            "is_finished": False
        })
    else:
        twiml, advisory_text, audio_url = handle_sos_disaster_selection(session_id, digit, get_public_host_url())
        return jsonify({
            "session_sid": session_id,
            "text": advisory_text,
            "audio_url": audio_url,
            "is_finished": True
        })


@app.route("/api/farmer-profile", methods=["POST"])
def farmer_profile_create():
    data = request.get_json(silent=True) or {}
    phone = normalize_phone(data.get("phone", ""))
    if not phone:
        return jsonify({"error": "Missing 'phone' field"}), 400
    data["phone"] = phone
    create_or_update_profile(phone, data)
    return jsonify(data), 200

@app.route("/api/farmer-profile/<phone>", methods=["GET"])
def farmer_profile_get(phone):
    profile = get_profile(phone)
    if not profile:
        return jsonify({"error": "Profile not found"}), 404
    return jsonify(profile)


@app.route("/api/feedback", methods=["POST"])
def feedback_submit():
    data = request.get_json(force=True)
    query_id = data.get("query_id")
    rating = data.get("rating")
    if not query_id or rating is None:
        return jsonify({"error": "Missing 'query_id' or 'rating' field"}), 400
    entry = log_feedback(query_id, rating, data.get("comment", ""))
    return jsonify(entry)
@app.route("/api/crop-recommendation", methods=["GET"])
def crop_recommendation():
    try:
        lat = float(request.args.get("lat"))
        lon = float(request.args.get("lon"))
    except (TypeError, ValueError):
        return jsonify({"error": "Missing or invalid 'lat'/'lon' query parameters"}), 400
    
    soil_type = request.args.get("soil_type")
    water_availability = request.args.get("water_availability")
    irrigation_source = request.args.get("irrigation_source")
    try:
        soil_ph = float(request.args.get("soil_ph"))
    except (TypeError, ValueError):
        soil_ph = None

    lang = request.args.get("lang", "en").strip()

    return jsonify(recommend_crops(
        latitude=lat,
        longitude=lon,
        soil_type=soil_type,
        water_availability=water_availability,
        irrigation_source=irrigation_source,
        soil_ph=soil_ph,
        language=lang
    ))


@app.route("/api/crop-recommendation/detailed", methods=["POST"])
def crop_recommendation_detailed():
    data = request.get_json(force=True) or {}
    location = data.get("location", "unknown")
    land_size = data.get("land_size", "unknown")
    soil_type = data.get("soil_type", "unknown")
    water_resources = data.get("water_resources", "unknown")
    language = data.get("language", "en")
    selected_crops = data.get("selected_crops", ["Rice", "Groundnut", "Maize"])
    
    try:
        lat = float(data.get("lat", 17.6868))
        from crop_recommendation import _get_real_soil_ph
        soil_ph = _get_real_soil_ph(lat, float(data.get("lon", 83.2185)))
    except Exception:
        soil_ph = 6.5

    lang_label = "Telugu" if language == "te" else "English"

    system_prompt = (
        "You are an expert agricultural scientist advising Indian farmers. "
        f"Analyze and compare ONLY the following selected crops: {', '.join(selected_crops)}.\n"
        "Evaluate them using: soil pH, climate, season, water/irrigation, land size, and local market demand.\n"
        "You MUST return a valid JSON object with exactly three keys:\n"
        "1. \"comparison\": a list of objects, one for each selected crop, containing these exact fields:\n"
        "   - \"crop\": crop name\n"
        "   - \"suitability_score\": score out of 10 (decimal or float)\n"
        "   - \"soil_compatibility\": e.g. 'Highly Compatible' or explanation\n"
        "   - \"water_requirement\": e.g. 'Low' or 'High'\n"
        "   - \"climate_suitability\": e.g. 'Optimal temperature range'\n"
        "   - \"expected_investment\": e.g. '₹18,000/acre'\n"
        "   - \"expected_yield\": e.g. '2.4 tons/acre'\n"
        "   - \"expected_revenue\": e.g. '₹54,000/acre'\n"
        "   - \"expected_profit\": e.g. '₹36,000/acre'\n"
        "   - \"disease_risk\": e.g. 'Blast, Stem Borer'\n"
        "   - \"local_demand\": e.g. 'High' or 'Low'\n"
        "   - \"mandi_price\": e.g. '₹2,250/quintal'\n"
        "2. \"best_crop\": name of the single best crop option\n"
        "3. \"explanation\": a clear paragraph explaining why it is the best choice.\n\n"
        f"Write all text explanations ONLY in {lang_label}. Do NOT use markdown code blocks or formatting. Return ONLY the raw JSON object."
    )

    user_prompt = (
        f"Farmer Profile details:\n"
        f"- Location: {location}\n"
        f"- Land size: {land_size} acres\n"
        f"- Soil type: {soil_type}\n"
        f"- Soil pH (SoilGrids API real data): {soil_ph}\n"
        f"- Water resources: {water_resources}\n"
        f"- Crops to compare: {', '.join(selected_crops)}\n"
    )

    try:
        from groq import Groq
        groq_key = os.environ.get("GROQ_API_KEY", "")
        if groq_key:
            client = Groq(api_key=groq_key)
            res = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                max_tokens=1000,
                temperature=0.2
            )
            content = res.choices[0].message.content.strip()
            import re
            content = re.sub(r"<think>.*?</think>", "", content, flags=re.DOTALL).strip()
            content = content.replace("```json", "").replace("```", "").strip()
            result = json.loads(content)
            return jsonify(result)
    except Exception as e:
        print("Groq detailed comparison failed:", e)

    # Fallback to realistic comparative data
    comparison = []
    for c in selected_crops:
        comparison.append({
            "crop": c,
            "suitability_score": 8.5,
            "soil_compatibility": "Highly compatible with local soil pH" if language == "en" else "స్థానిక నేల పిహెచ్‌కి బాగా అనుకూలంగా ఉంది",
            "water_requirement": "Medium" if language == "en" else "మధ్యస్థం",
            "climate_suitability": "Perfect regional climate" if language == "en" else "అనుకూల ప్రాంతీయ వాతావరణం",
            "expected_investment": "₹15,000/acre",
            "expected_yield": "1.8 tons/acre",
            "expected_revenue": "₹48,000/acre",
            "expected_profit": "₹33,000/acre",
            "disease_risk": "None observed" if language == "en" else "ఏమీ లేదు",
            "local_demand": "High" if language == "en" else "ఎక్కువ",
            "mandi_price": "₹2,200/quintal"
        })
    
    fallback_exp = (
        "వరి మరియు వేరుశనగ పంటలు ఈ ప్రాంత పరిస్థితులలో అత్యధిక దిగుబడిని మరియు గరిష్ట ఆదాయాన్ని అందించగలవు."
        if language == "te" else
        "Rice and Groundnut are highly suitable crops showing optimal returns under current region temperature profiles."
    )
    
    return jsonify({
        "comparison": comparison,
        "best_crop": selected_crops[0],
        "explanation": fallback_exp
    })


@app.route("/api/field-health", methods=["GET"])
def field_health():
    try:
        lat = float(request.args.get("lat"))
        lon = float(request.args.get("lon"))
    except (TypeError, ValueError):
        return jsonify({"error": "Missing or invalid 'lat'/'lon' query parameters"}), 400
    field_id = request.args.get("field_id", "field_1")
    profile = {
        "crop_type": request.args.get("crop_type", ""),
        "soil_type": request.args.get("soil_type", ""),
        "soil_ph": request.args.get("soil_ph", ""),
        "water_availability": request.args.get("water_availability", ""),
        "irrigation_method": request.args.get("irrigation_method", ""),
        "land_size_acres": request.args.get("land_size_acres", ""),
    }
    return jsonify(get_field_health_report(lat, lon, field_id, profile))


def get_local_fallback_response(message, profile=None, lang="en"):
    if not profile:
        profile = {}
    msg = message.lower().strip()
    # Honour the selected UI language, while also recognising a Telugu question
    # when a farmer writes in Telugu without switching the page language.
    response_language = "te" if lang == "te" or any("\u0c00" <= char <= "\u0c7f" for char in message) else "en"
    soil = profile.get("soil_type", "black").lower()
    crop = profile.get("crop_type", "Rice")
    irrigation = profile.get("irrigation_method", "borewell").lower()
    water_availability = profile.get("water_availability", "medium").lower()

    def localized(english, telugu):
        return telugu if response_language == "te" else english

    def live_weather_answer():
        """Answer weather questions from the farmer's saved coordinates, free of charge."""
        try:
            lat = float(profile.get("latitude"))
            lon = float(profile.get("longitude"))
            weather_data = get_weather_alert(lat, lon)
            if weather_data.get("error"):
                raise RuntimeError(weather_data["error"])

            forecast = weather_data.get("forecast", [])
            if not forecast:
                raise RuntimeError("No forecast returned")

            if "tomorrow" in msg and len(forecast) > 1:
                day = forecast[1]
                probability = day.get("rain_prob", 0)
                rainfall = day.get("rain_mm", 0)
                if probability >= 60 or rainfall >= 5:
                    return localized(
                        f"Tomorrow has a {probability}% chance of rain, with about {rainfall} mm forecast. Avoid spraying pesticides if rain arrives.",
                        f"రేపు వర్షం పడే అవకాశం {probability}%; సుమారు {rainfall} మి.మీ. వర్షం అంచనా ఉంది. వర్షం వచ్చే అవకాశం ఉంటే పురుగుమందులు పిచికారీ చేయవద్దు."
                    )
                return localized(
                    f"Tomorrow has only a {probability}% chance of rain, with about {rainfall} mm forecast. Irrigate only if your field needs it.",
                    f"రేపు వర్షం పడే అవకాశం కేవలం {probability}%; సుమారు {rainfall} మి.మీ. వర్షం అంచనా ఉంది. అవసరమైతేనే నీరు పెట్టండి."
                )

            total_rain = round(sum(day.get("rain_mm", 0) for day in forecast[:7]), 1)
            wet_days = sum(1 for day in forecast[:7] if day.get("rain_prob", 0) >= 50)
            current = weather_data.get("weather", {})
            return localized(
                f"For your farm, it is currently {current.get('condition', 'unknown')} at "
                f"{current.get('temp_c', 'unknown')}°C. The next 7 days show about {total_rain} mm "
                f"of rain across {wet_days} likely rainy day(s); plan irrigation around those days.",
                f"మీ పొలం వద్ద ప్రస్తుతం {current.get('condition', 'తెలియదు')}, ఉష్ణోగ్రత "
                f"{current.get('temp_c', 'తెలియదు')}°C ఉంది. రాబోయే 7 రోజుల్లో సుమారు {total_rain} మి.మీ. "
                f"వర్షం, {wet_days} వర్షపు రోజు/రోజులు ఉండే అవకాశం ఉంది; దానికి అనుగుణంగా నీరు పెట్టండి."
            )
        except (TypeError, ValueError, RuntimeError):
            return localized(
                "I could not reach the live weather service for your saved location. Please try again shortly.",
                "మీ నమోదైన ప్రాంతానికి ప్రత్యక్ష వాతావరణ సేవను చేరుకోలేకపోయాను. కొద్దిసేపటి తర్వాత మళ్లీ ప్రయత్నించండి."
            )

    def profile_crop_advice():
        """Useful no-key crop advice when the optional AI service is unavailable."""
        plentiful_water = any(term in water_availability for term in ("high", "abundant", "good")) or any(
            term in irrigation for term in ("river", "canal", "tank")
        )
        limited_water = any(term in water_availability for term in ("low", "limited", "scarce"))

        if any(term in soil for term in ("mountain", "hill", "hilly", "slope")):
            if plentiful_water:
                return localized("For hilly land with a river source, turmeric, ginger, and beans are better fits than cotton. Use contour beds and drainage; choose crops after checking local market demand.", "కొండ నేల మరియు నది నీటి వనరుతో పసుపు, అల్లం, బీన్స్ పత్తి కంటే మెరుగైనవి. కాంటూర్ బెడ్లు, డ్రైనేజీ వాడండి; స్థానిక మార్కెట్ ధరలు చూసి తుది పంటను ఎంచుకోండి.")
            return localized("For hilly land with limited water, choose millets, pigeon pea, or horse gram. Use contour bunds and mulching to retain moisture.", "తక్కువ నీరు ఉన్న కొండ నేలకు చిరుధాన్యాలు, కందులు లేదా ఉలవలు ఎంచుకోండి. తేమ నిలుపుకోవడానికి కాంటూర్ కట్టలు, మల్చింగ్ వాడండి.")
        if "red" in soil:
            if limited_water:
                return localized("Red soil with limited water is better suited to groundnut, foxtail millet, or pigeon pea. Avoid water-intensive paddy unless reliable irrigation is available.", "తక్కువ నీరు ఉన్న ఎర్ర నేలకు వేరుశనగ, కొర్రలు లేదా కందులు అనుకూలం. నమ్మకమైన నీటి వనరు లేకపోతే వరిని నివారించండి.")
            if plentiful_water:
                return localized("With red soil and reliable water, groundnut, maize, and chilli are practical options. Use drip irrigation for chilli and avoid waterlogging.", "ఎర్ర నేల, నమ్మకమైన నీటితో వేరుశనగ, మొక్కజొన్న, మిరప మంచి ఎంపికలు. మిరపకు డ్రిప్ వాడండి; నీరు నిలవనివ్వవద్దు.")
            return localized("For red soil with medium water, groundnut, maize, and pigeon pea are safer choices. Rotate with a pulse crop to protect soil fertility.", "మధ్యస్థ నీరు ఉన్న ఎర్ర నేలకు వేరుశనగ, మొక్కజొన్న, కందులు సురక్షిత ఎంపికలు. నేల సారాన్ని కాపాడటానికి పప్పుధాన్యంతో పంట మార్పిడి చేయండి.")
        if any(term in soil for term in ("black", "regur", "cotton")):
            if limited_water:
                return localized("Black soil with limited water suits sorghum, pigeon pea, and hardy cotton varieties. Keep wide drainage channels because black soil holds water after rain.", "తక్కువ నీరు ఉన్న నల్ల నేలకు జొన్న, కందులు, తట్టుకునే పత్తి రకాలు అనుకూలం. వర్షం తర్వాత నల్ల నేలలో నీరు నిలుస్తుంది కాబట్టి వెడల్పైన డ్రైనేజీ కాలువలు ఉంచండి.")
            return localized("Black soil with reliable water suits cotton, soybean, and maize. Do not grow cotton repeatedly in the same plot; include a pulse crop in the next season.", "నమ్మకమైన నీరు ఉన్న నల్ల నేలకు పత్తి, సోయాబీన్, మొక్కజొన్న అనుకూలం. ఒకే పొలంలో పత్తిని వరుసగా వేయవద్దు; తరువాతి సీజన్‌లో పప్పుధాన్యాన్ని చేర్చండి.")
        if any(term in soil for term in ("sandy", "coastal")):
            return localized("Sandy soil drains quickly, so choose groundnut, watermelon, or vegetables with drip irrigation. Add compost and mulch to hold moisture.", "ఇసుక నేలలో నీరు త్వరగా దిగిపోతుంది; డ్రిప్‌తో వేరుశనగ, పుచ్చకాయ లేదా కూరగాయలు ఎంచుకోండి. తేమ నిలవడానికి కంపోస్ట్, మల్చింగ్ వేయండి.")
        if plentiful_water:
            return localized("With reliable water, paddy, maize, and suitable vegetables can work on your soil. Confirm drainage before choosing paddy, especially during heavy-rain weeks.", "నమ్మకమైన నీరు ఉంటే వరి, మొక్కజొన్న, అనుకూల కూరగాయలు వేయవచ్చు. ముఖ్యంగా భారీ వర్షాల సమయంలో వరి ఎంచుకునే ముందు డ్రైనేజీని నిర్ధారించుకోండి.")
        if limited_water:
            return localized("With limited water, prefer millets, pulses, and groundnut over water-intensive crops. Drip irrigation and mulching will reduce risk.", "తక్కువ నీటిలో ఎక్కువ నీరు అవసరమైన పంటల కంటే చిరుధాన్యాలు, పప్పుధాన్యాలు, వేరుశనగ ఎంచుకోండి. డ్రిప్, మల్చింగ్ ప్రమాదాన్ని తగ్గిస్తాయి.")
        return localized("For medium water availability, maize, pulses, and groundnut are balanced options. A local soil test and current mandi prices should decide the final choice.", "మధ్యస్థ నీటికి మొక్కజొన్న, పప్పుధాన్యాలు, వేరుశనగ సమతుల్య ఎంపికలు. స్థానిక నేల పరీక్ష, ప్రస్తుత మండి ధరలు చూసి తుది పంటను ఎంచుకోండి.")

    is_rice_question = "rice" in msg or "paddy" in msg or "వరి" in msg
    if any(term in msg for term in ("fertilizer", "fertiliser", "urea", "ఎరువు", "ఎరువులు", "యూరియా")):
        if is_rice_question:
            return localized(
                "For paddy, apply fertiliser in split doses: a basal dose at transplanting, then nitrogen around 20–25 and 40–45 days after transplanting. Use the exact dose from a soil test or your local agriculture officer.",
                "వరి పంటకు ఎరువులను విడతలుగా వేయండి: నాటే సమయంలో బేసల్ డోస్, తరువాత నాటిన 20–25 రోజులకు మరియు 40–45 రోజులకు నత్రజని వేయండి. ఖచ్చితమైన మోతాదుకు నేల పరీక్ష లేదా స్థానిక వ్యవసాయ అధికారి సలహా తీసుకోండి."
            )
        return localized(
            "Apply fertiliser according to your soil-test result and crop stage; avoid applying it immediately before heavy rain. Tell me the crop and its age for a more specific schedule.",
            "నేల పరీక్ష ఫలితం మరియు పంట దశను బట్టి ఎరువులు వేయండి; భారీ వర్షానికి ముందు వేయవద్దు. పంట పేరు, వయస్సు చెబితే మరింత ఖచ్చితమైన షెడ్యూల్ ఇస్తాను."
        )

    if any(term in msg for term in ("yellow", "leaf", "leaves", "పసుపు", "ఆకు", "ఆకులు")):
        return localized(
            "Yellow leaves can be caused by nitrogen or zinc deficiency, waterlogging, or pests. Check the underside of leaves and soil moisture before applying fertiliser or pesticide.",
            "పసుపు ఆకులు నత్రజని లేదా జింక్ లోపం, నీరు నిలవడం లేదా తెగుళ్ల వల్ల రావచ్చు. ఎరువు లేదా మందు వేయే ముందు ఆకుల అడుగు భాగం, నేల తేమను పరిశీలించండి."
        )

    if any(term in msg for term in ("pest", "insect", "worm", "pesticide", "పురుగు", "తెగులు", "మందు")):
        return localized(
            "Identify the pest before spraying. Start with neem oil where suitable, avoid spraying before rain, and follow the label dose for any approved pesticide.",
            "మందు పిచికారీకి ముందు తెగులును గుర్తించండి. సాధ్యమైతే వేపనూనెతో ప్రారంభించండి, వర్షానికి ముందు పిచికారీ చేయవద్దు, అనుమతించిన మందు లేబుల్‌లోని మోతాదునే పాటించండి."
        )
    
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

    # Weather/Rain questions use live Open-Meteo data for the saved farm location.
    if any(term in msg for term in ("rain", "weather", "forecast", "వర్ష", "వాతావరణ", "రేపు")):
        return live_weather_answer()

    # Question 4: Crop recommendation / profit (Flow 1)
    if (
        ("crop" in msg or "land" in msg or "soil" in msg or "పంట" in msg or "నేల" in msg)
        and ("grow" in msg or "profit" in msg or "better" in msg or "recommend" in msg or "labham" in msg or "best" in msg or "suitable" in msg or "suit" in msg or "ఏది" in msg or "మంచి" in msg or "సరిపోత" in msg)
    ):
        return profile_crop_advice()

    # Greetings fallbacks
    words = msg.split()
    greetings = {"helo", "hello", "hi", "hey", "namaskaram", "నమస్కారం", "హాయ్"}
    if any(w in greetings for w in words):
        return localized("Hello! I am KṛṣakaSevā AI. How can I help you today with your farming questions?", "నమస్కారం! నేను కృషకసేవ AI. మీ వ్యవసాయ ప్రశ్నలకు ఎలా సహాయం చేయగలను?")

    # Generic Fallbacks
    return localized("I could not fully process that request. Please specify your crop type, irrigation question, or pest problem.", "మీ ప్రశ్నను పూర్తిగా అర్థం చేసుకోలేకపోయాను. దయచేసి పంట, నీటి అవసరం లేదా తెగులు సమస్య గురించి కొంత వివరంగా అడగండి.")


@app.route("/api/chat", methods=["POST"])
def chat_query():
    data = request.get_json(force=True) or {}
    message = data.get("message", "").strip()
    history = data.get("history", [])
    phone = normalize_phone(data.get("phone", "").strip())
    requested_language = data.get("lang", "en").lower()
    if requested_language not in {"en", "te"}:
        requested_language = "en"
    if any("\u0c00" <= char <= "\u0c7f" for char in message):
        requested_language = "te"

    if not message:
        return jsonify({"error": "Missing 'message' field"}), 400

    # Profiles live in browser localStorage and are sent with each chat
    # request.  Never attempt to look one up from server-side storage.
    profile = data.get("profile") or {}
    if not isinstance(profile, dict):
        profile = {}
    if phone:
        profile["phone"] = phone

    # Use live, free Open-Meteo data when available.  The local fallback also
    # calls this service for weather questions, so it never invents a forecast.
    weather_summary = "Live weather unavailable for this request."
    try:
        lat = float(profile.get("latitude"))
        lon = float(profile.get("longitude"))
        weather_data = get_weather_alert(lat, lon)
        if not weather_data.get("error"):
            current_weather = weather_data.get("weather", {})
            weather_summary = (
                f"{current_weather.get('condition', 'Unknown')}, "
                f"{current_weather.get('temp_c', 'unknown')}°C, "
                f"humidity {current_weather.get('humidity', 'unknown')}%."
            )
    except (TypeError, ValueError):
        pass
    mandi_context = f"Crop Modal Price: ₹2,600 per quintal. Nearest Mandi: {profile.get('location', 'Nellore')} Mandi."

    system_prompt = (
        "You are KṛṣakaSevā (KṛṣakaSevā), an expert agricultural scientist AI.\n"
        f"Reply in {'Telugu' if requested_language == 'te' else 'English'}. The farmer may mix Telugu and English; understand both and use {'Telugu' if requested_language == 'te' else 'English'} in your reply.\n"
        "CRITICAL: Do NOT output any greetings, taglines, slogans, or introductions. Answer the question directly and immediately.\n"
        "CRITICAL: Do NOT say 'He Kṛṣaka, Sukhī Bhava!' or any greetings. Do not repeat any slogans.\n"
        "CRITICAL: Keep your response extremely brief, direct, and under 3 sentences.\n"
        "Do NOT use markdown code blocks, bold markers (**), or symbols. Answer concisely.\n\n"
        "Here is the context of the farmer asking the question:\n"
        f"- Name: {profile.get('name', 'Farmer')}\n"
        f"- Crop grown: {profile.get('crop_type', 'Rice')}\n"
        f"- Soil Type: {profile.get('soil_type', 'Black')}\n"
        f"- Water Source: {profile.get('irrigation_method', 'Borewell')}\n"
        f"- Water Availability: {profile.get('water_availability', 'Medium')}\n"
        f"- Soil pH: {profile.get('soil_ph', '6.5')}\n"
        f"- Land Size: {profile.get('land_size_acres', 2.0)} acres\n"
        f"- Location: {profile.get('location', 'Andhra Pradesh')}\n"
        f"- Current Weather: {weather_summary}\n"
        f"- Live Mandi prices context: {mandi_context}\n"
    )

    messages = [{"role": "system", "content": system_prompt}]
    for msg in history:
        messages.append({"role": msg.get("role"), "content": msg.get("content")})
    messages.append({"role": "user", "content": message})

    try:
        from groq import Groq
        groq_key = os.environ.get("GROQ_API_KEY", "")
        if groq_key:
            client = Groq(api_key=groq_key)
            res = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=messages,
                max_tokens=500,
                temperature=0.3,
                timeout=7.0
            )
            reply = res.choices[0].message.content.strip()
            import re
            reply = re.sub(r"<think>.*?</think>", "", reply, flags=re.DOTALL)
            if "<think>" in reply:
                reply = reply.split("<think>")[0]
            if not reply:
                raise Exception("Empty response returned from model")
        else:
            raise Exception("Missing Groq API Key")
    except Exception as e:
        print("Chatbot query failed, using local English fallback:", e)
        reply = get_local_fallback_response(message, profile, requested_language)

    return jsonify({"reply": reply})


@app.route("/api/trigger-alerts", methods=["POST"])
def trigger_alerts():
    data = request.get_json(force=True) or {}
    phone = normalize_phone(data.get("phone", "").strip())
    if not phone:
        return jsonify({"error": "Missing 'phone' parameter"}), 400
        
    profile = get_profile(phone)
    if not profile:
        return jsonify({"error": "Farmer profile not found"}), 404
        
    try:
        lat = float(profile.get("latitude", 14.4426))
        lon = float(profile.get("longitude", 79.9865))
    except (TypeError, ValueError):
        lat, lon = 14.4426, 79.9865
    lang = profile.get("preferred_language", "en")
    weather_data = get_weather_alert(lat, lon, lang)
    
    from sms_gateway import dispatch_severe_weather_alert
    result = dispatch_severe_weather_alert(
        phone=phone,
        crop=profile.get("crop_type", "Rice"),
        location=profile.get("location", "farm"),
        weather_data=weather_data
    )
    return jsonify(result)


@app.route("/api/send-sms-advisory", methods=["POST"])
def send_sms_advisory():
    data = request.get_json(force=True)
    phone = data.get("phone")
    message = data.get("message")
    if not phone or not message:
        return jsonify({"error": "Missing 'phone' or 'message' field"}), 400
    try:
        result = send_sms(phone, message)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
@app.route("/api/voice-advisory", methods=["POST"])
def voice_advisory():
    """
    Twilio calls this when placing an outbound advisory call.
    Speaks the advisory message and then hangs up cleanly.
    """
    response = VoiceResponse()
    response.say(
        "Welcome to KrishakaSeva. Your latest crop advisory is: "
        "apply copper based fungicide for early blight, and avoid overhead watering.",
        voice="alice",
        language="en-IN",
    )
    response.hangup()
    return str(response), 200, {"Content-Type": "text/xml"}
@app.route("/api/ivr/trigger-outbound", methods=["POST"])
def ivr_trigger_outbound():
    data = request.get_json(force=True) or {}
    phone = normalize_phone(data.get("phone", "").strip())
    if not phone:
        return jsonify({"error": "Missing 'phone' field"}), 400
        
    try:
        from twilio.rest import Client
        account_sid = os.environ.get("TWILIO_ACCOUNT_SID")
        auth_token = os.environ.get("TWILIO_AUTH_TOKEN")
        from_number = os.environ.get("TWILIO_FROM_NUMBER") or os.environ.get("TWILIO_PHONE_NUMBER")
        
        if not account_sid or not auth_token or not from_number:
            return jsonify({"status": "demo", "message": "Twilio credentials missing. Running simulator."})
            
        client = Client(account_sid, auth_token)
        twiml_url = f"{get_public_host_url().rstrip('/')}/api/ivr/incoming-call"
        
        call = client.calls.create(
            url=twiml_url,
            to=phone,
            from_=from_number
        )
        return jsonify({
            "status": "triggered",
            "call_sid": call.sid,
            "message": "Outbound interactive IVR call queued successfully."
        })
    except Exception as e:
        print("Outbound IVR trigger failed:", e)
        return jsonify({"error": str(e)}), 500


@app.route("/api/ivr/incoming-call", methods=["GET", "POST"])
def ivr_incoming_call():
    twiml = start_call()
    return twiml, 200, {"Content-Type": "text/xml"}


@app.route("/api/ivr/language-selected", methods=["GET", "POST"])
def ivr_language_selected():
    call_sid = request.values.get("CallSid")
    digit = request.values.get("Digits", "1")
    phone = request.values.get("From")
    location = request.values.get("FromCity") or request.values.get("FromState") or "unknown"
    twiml = handle_language_selection_twilio(call_sid, digit, phone, location)
    return twiml, 200, {"Content-Type": "text/xml"}


@app.route("/api/ivr/answer-received", methods=["GET", "POST"])
def ivr_answer_received():
    call_sid = request.values.get("CallSid")
    digit = request.values.get("Digits")
    twiml = handle_answer_twilio(call_sid, digit)
    return twiml, 200, {"Content-Type": "text/xml"}


# Web-based Call Simulator Endpoints
def _safe_ivr_audio(text, language):
    """Keep the IVR transcript usable even if the TTS provider is unavailable."""
    try:
        return synthesize_speech_data_url(text, language)
    except Exception as error:
        print("IVR TTS generation failed:", error)
        return None


@app.route("/api/ivr/web/start", methods=["POST"])
def ivr_web_start():
    try:
        data = request.get_json(force=True) or {}
    except Exception:
        data = {}
    session_id = data.get("session_id") or data.get("session_sid") or uuid.uuid4().hex
    
    welcome_text = "Welcome to KrishakaSeva. For English, press 1. For Telugu, press 2."
    audio_url = _safe_ivr_audio(welcome_text, "en")
    
    return jsonify({
        "session_sid": session_id,
        "session_id": session_id,
        "text": welcome_text,
        "audio_url": audio_url,
        "language": "en",
        "profile": {},
        "is_finished": False
    })


@app.route("/api/ivr/web/step", methods=["POST"])
def ivr_web_step():
    # Support both JSON payloads and URL-encoded forms
    if request.is_json or request.content_type == "application/json":
        try:
            data = request.get_json(force=True) or {}
        except Exception:
            data = {}
    else:
        data = request.form or {}
        
    session_id = data.get("session_sid") or data.get("session_id") or request.form.get("session_id")
    digit = data.get("digit") or data.get("Digits") or request.form.get("digit")
    
    if not session_id:
        return jsonify({"error": "Missing 'session_id' or 'session_sid'"}), 400

    session = get_session(session_id)
    if not session:
        # Initial language selection
        phone = data.get("phone") or request.form.get("phone")
        lat = data.get("lat") or request.form.get("lat")
        lon = data.get("lon") or request.form.get("lon")
        try:
            lat = float(lat) if lat else None
            lon = float(lon) if lon else None
        except Exception:
            lat, lon = None, None
            
        welcome_text = handle_language_selection(session_id, digit, phone=phone, lat=lat, lon=lon)
        session = get_session(session_id)
        audio_url = _safe_ivr_audio(welcome_text, session.get("language", "en"))
        return jsonify({
            "session_sid": session_id,
            "session_id": session_id,
            "text": welcome_text,
            "audio_url": audio_url,
            "language": session.get("language", "en"),
            "profile": session.get("answers", {}),
            "is_finished": False
        })
        
    if digit:
        response_text, is_finished = handle_dtmf_input(session_id, digit)
        audio_url = _safe_ivr_audio(response_text, session.get("language", "en"))
        return jsonify({
            "session_sid": session_id,
            "session_id": session_id,
            "text": response_text,
            "audio_url": audio_url,
            "language": session.get("language", "en"),
            "profile": session.get("answers", {}),
            "is_finished": is_finished
        })
        
# Host Frontend Static Files directly from Flask
@app.route("/")
def serve_frontend_index():
    root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    return send_from_directory(root_dir, "index.html")


@app.route("/<path:path>")
def serve_frontend_files(path):
    root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    # Check if the file exists in the root folder
    if os.path.exists(os.path.join(root_dir, path)):
        return send_from_directory(root_dir, path)
    
    # Fallback to static folder
    static_dir = os.path.join(os.path.dirname(__file__), "static")
    if os.path.exists(os.path.join(static_dir, path)):
        return send_from_directory(static_dir, path)
        
    return "Not Found", 404


if __name__ == "__main__":
    app.run(debug=False, port=5000)
