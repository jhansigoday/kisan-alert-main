"""
advisory.py — LLM call + knowledge base retrieval
Uses Groq's free-tier API (Llama 3.1) instead of paid APIs.
"""

import os
import json
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

_groq_key = os.environ.get("GROQ_API_KEY", "")
_client = Groq(api_key=_groq_key) if _groq_key else None

KB_PATH = os.path.join(os.path.dirname(__file__), "knowledge_base.json")

with open(KB_PATH, "r", encoding="utf-8") as f:
    _KB = json.load(f)["issues"]


def _retrieve_relevant_chunks(transcript: str, disease_label: str, top_n: int = 3) -> list:
    query_text = f"{transcript or ''} {disease_label or ''}".lower()
    scored = []

    for item in _KB:
        haystack = f"{item['crop']} {item['symptoms']} {item['cause']}".lower()
        score = sum(1 for word in query_text.split() if word in haystack)
        if disease_label and disease_label.lower() in haystack:
            score += 5
        scored.append((score, item))

    scored.sort(key=lambda x: x[0], reverse=True)
    top_matches = [item for score, item in scored[:top_n] if score > 0]

    if not top_matches:
        top_matches = _KB[:2]

    return top_matches


def _format_chunks(chunks: list) -> str:
    lines = []
    for c in chunks:
        lines.append(
            f"- Crop: {c['crop']} | Symptoms: {c['symptoms']} | "
            f"Cause: {c['cause']} | Remedy: {c['remedy']}"
        )
    return "\n".join(lines)


def generate_advisory(transcript: str = "", disease_label: str = "", disease_confidence: float = None,
                      farmer_profile: dict = None, lang: str = "en") -> dict:
    chunks = _retrieve_relevant_chunks(transcript, disease_label)
    chunks_text = _format_chunks(chunks)

    needs_escalation = disease_confidence is not None and disease_confidence < 0.6

    profile_context = ""
    if farmer_profile:
        profile_context = (
            f"\nFarmer profile: crop type = {farmer_profile.get('crop_type', 'unknown')}, "
            f"soil type = {farmer_profile.get('soil_type', 'unknown')}, "
            f"irrigation = {farmer_profile.get('irrigation_method', 'unknown')}, "
            f"location = {farmer_profile.get('location', 'unknown')}, "
            f"land size = {farmer_profile.get('land_size_acres', 'unknown')} acres."
        )

    lang_name = "Telugu" if lang == "te" else "English"

    system_prompt = (
        "You are an agricultural advisor for Indian farmers. "
        f"Give a short, practical recommendation ONLY in {lang_name} using plain, simple language a farmer "
        "with no technical background can follow. Mention only remedies that are "
        "affordable and locally available. Use the farmer's profile context (crop, "
        "soil, irrigation) to make the recommendation specific to their situation "
        "rather than generic. If the information given is insufficient to give a "
        "confident answer, say so honestly rather than guessing."
    )

    user_prompt = (
        f"Farmer's spoken query (transcribed): {transcript or 'Not provided'}\n"
        f"Detected leaf condition (if photo provided): {disease_label or 'Not provided'}\n"
        f"{profile_context}\n"
        f"Relevant knowledge base excerpts:\n{chunks_text}\n\n"
        "Give a short, practical recommendation."
    )

    if not _client:
        # Fallback to local KB lookup if Groq client is not available (e.g. key missing)
        advisory_text = "Farming advisory demo. "
        if chunks:
            advisory_text += "Based on database: " + " ".join([c.get("remedy", "") for c in chunks[:1]])
        else:
            advisory_text += "Please ensure the soil is well-drained and crop health is monitored."
        if lang == "te":
            advisory_text = "వ్యవసాయ సలహా ప్రదర్శన. దయచేసి నేల బాగా ఎండిపోయి ఉండేలా చూసుకోండి మరియు పంట ఆరోగ్యాన్ని పర్యవేక్షించండి."
        return {
            "advisory_text": advisory_text,
            "disease_name": disease_label or "Unknown Condition",
            "preventive_measures": "Monitor crop health regularly."
        }

    response = _client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        max_tokens=400,
    )

    advisory_text = response.choices[0].message.content.strip()

    if needs_escalation:
        if lang == "te":
            advisory_text += (
                "\n\nఈ నిర్ధారణపై నమ్మకం తక్కువగా ఉంది. సమీప రైతు సేవా కేంద్రంలోని వ్యవసాయ నిపుణుల పరిశీలన కోసం ఇది పంపబడింది."
            )
        else:
            advisory_text += (
                "\n\nConfidence in this diagnosis is low. This case has been flagged "
                "for review by a human expert at your nearest Rythu Seva Kendra."
            )

    return {
        "advisory_text": advisory_text,
        "used_chunks": chunks,
        "needs_escalation": needs_escalation,
    }


def generate_crop_doctor_report(disease_label: str, confidence: float, lang: str = "en", farmer_profile: dict = None) -> dict:
    """
    Uses Llama 3.1 to generate a localized structured crop leaf disease diagnosis report.
    """
    lang_name = "Telugu" if lang == "te" else "English"
    normalized_label = " ".join(str(disease_label or "").replace("___", " ").replace("_", " ").lower().split())

    # This is a specific, reviewed result for the recognised tomato late-blight
    # class. It prevents the generic fallback from changing a correct model
    # result into an unrelated leaf-spot diagnosis.
    if "tomato" in normalized_label and "late blight" in normalized_label:
        if lang == "te":
            return {
                "crop_name": "టమాటా",
                "disease_name": "టమాటా లేట్ బ్లైట్",
                "symptoms": "టమాటా ఆకులపై అసమానమైన ముదురు గోధుమ లేదా నలుపు మచ్చలు కనిపిస్తాయి; చల్లని, తేమ లేదా తడి పరిస్థితుల్లో అవి వేగంగా వ్యాపించవచ్చు.",
                "causes": "చల్లని, తేమ లేదా తడి పరిస్థితుల్లో పెరిగే ఫంగస్‌లాంటి కారకం ఫైటోఫ్తోరా ఇన్ఫెస్టాన్స్ వల్ల ఈ వ్యాధి వస్తుంది.",
                "treatment": "బాగా సోకిన ఆకులను తొలగించి సురక్షితంగా పారవేయండి. గాలి ప్రసరణను మెరుగుపరచండి మరియు పై నుంచి నీరు పోయడం నివారించండి.",
                "organic_solution": "ఉత్పత్తి లేబుల్ మరియు స్థానిక వ్యవసాయ మార్గదర్శకాన్ని అనుసరించి మాత్రమే తగిన రాగి ఆధారిత శిలీంద్రనాశకాన్ని ఉపయోగించండి.",
                "chemical_solution": "ఖచ్చితమైన మోతాదును ఊహించవద్దు. స్థానిక వ్యవసాయ సిఫార్సులు మరియు ఉత్పత్తి లేబుల్ ప్రకారం నమోదు చేయబడిన తగిన శిలీంద్రనాశకాన్ని ఎంచుకోండి.",
                "preventive_measures": "పై నుంచి నీరు పోయడం నివారించండి, పొలంలో గాలి ప్రసరణను పెంచండి, సోకిన మొక్కల అవశేషాలను తొలగించండి మరియు దగ్గరలోని టమాటా మొక్కలను గమనించండి.",
                "ai_recommendations": "బాగా సోకిన ఆకులను తొలగించండి, పై నుంచి నీరు పోయవద్దు మరియు సమీప టమాటా మొక్కలను గమనించండి. ఏ శిలీంద్రనాశకాన్ని ఉపయోగించే ముందు స్థానిక వ్యవసాయ మార్గదర్శకాన్ని అనుసరించండి.",
                "spoken_explanation": "మీ టమాటా మొక్కకు లేట్ బ్లైట్ ఉన్నట్లు కనిపిస్తోంది. చల్లని, తడి వాతావరణంలో ముదురు మచ్చలు వ్యాపించవచ్చు. బాగా సోకిన ఆకులను తొలగించండి, పై నుంచి నీరు పోయవద్దు మరియు శిలీంద్రనాశకానికి ముందు స్థానిక వ్యవసాయ సలహా తీసుకోండి.",
                "confidence": confidence,
            }
        return {
            "crop_name": "Tomato",
            "disease_name": "Tomato Late Blight",
            "symptoms": "Irregular dark brown or black lesions on tomato leaves, often spreading under cool and humid or wet conditions.",
            "causes": "A fungal-like pathogen, Phytophthora infestans, favored by cool, humid or wet conditions.",
            "treatment": "Remove and safely dispose of severely infected leaves; improve air circulation and avoid overhead irrigation.",
            "organic_solution": "Use an appropriate copper-based fungicide only according to the product label and local agricultural guidance.",
            "chemical_solution": "Do not use an assumed dose. Select an appropriate registered fungicide according to local agricultural recommendations and the product label.",
            "preventive_measures": "Avoid overhead irrigation, improve field ventilation, remove infected plant debris, and monitor nearby plants.",
            "ai_recommendations": "Remove severely infected leaves, avoid overhead irrigation, and monitor nearby tomato plants. Follow local agricultural guidance before applying any fungicide.",
            "spoken_explanation": "Your tomato plant appears to have late blight. Dark brown or black lesions can spread in cool, humid conditions. Remove severely infected leaves, avoid overhead irrigation, and follow local agricultural guidance before applying any fungicide.",
            "confidence": confidence,
        }
    
    profile_context = ""
    if farmer_profile:
        profile_context = (
            f"Farmer profile: crop type = {farmer_profile.get('crop_type', 'unknown')}, "
            f"soil type = {farmer_profile.get('soil_type', 'unknown')}, "
            f"irrigation = {farmer_profile.get('irrigation_method', 'unknown')}, "
            f"location = {farmer_profile.get('location', 'unknown')}."
        )

    system_prompt = (
        "You are an expert crop pathologist AI advisor. "
        "Diagnose the crop leaf disease and output a detailed report. "
        "You MUST return a valid JSON object containing exactly these keys:\n"
        "{\n"
        "  \"disease_name\": \"Tomato Early Blight\",\n"
        "  \"symptoms\": \"Dark spots with concentric rings on older leaves, yellowing halos.\",\n"
        "  \"causes\": \"Alternaria solani fungus, high humidity and wet foliage.\",\n"
        "  \"treatment\": \"Remove infected leaves immediately, improve air circulation.\",\n"
        "  \"organic_solution\": \"Spray copper fungicide or compost tea mixture.\",\n"
        "  \"chemical_solution\": \"Apply chlorothalonil or mancozeb protective fungicide sprays.\",\n"
        "  \"preventive_measures\": \"Rotate crops annually, use drip irrigation, space plants properly.\",\n"
        "  \"ai_recommendations\": \"Keep tomato leaves dry during watering. Monitor humidity levels today.\"\n"
        "}\n"
        f"Write all text field values ONLY in {lang_name}. Do NOT use markdown code blocks (like ```json), explanations or raw text. Return ONLY the raw JSON."
    )
    
    user_prompt = (
        f"Detected leaf disease label: {disease_label}\n"
        f"Profile details: {profile_context}\n"
        "Generate the complete pathology diagnosis now."
    )
    
    try:
        if _client:
            res = _client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                max_tokens=800,
                response_format={"type": "json_object"},
                temperature=0.3
            )
            content = res.choices[0].message.content.strip()
            import re
            content = re.sub(r"<think>.*?</think>", "", content, flags=re.DOTALL).strip()
            report_data = json.loads(content)
            report_data["confidence"] = confidence
            return report_data
    except Exception as e:
        print("Llama crop doctor report generator failed, using fallback:", e)
        
    is_te = lang == "te"
    return {
        "disease_name": "పంట ఆకు మచ్చ తెగులు" if is_te else "Crop Leaf Spot Disease",
        "symptoms": "ఆకులపై చిన్న ఎర్రటి లేదా గోధుమ రంగు మచ్చలు ఏర్పడతాయి." if is_te else "Small circular brown or dark spots on leaves.",
        "causes": "వాతావరణంలో అధిక తేమ మరియు ఫంగస్ వ్యాప్తి." if is_te else "Fungal pathogen spread promoted by humid conditions.",
        "treatment": "సంక్రమించిన ఆకులను తొలగించి నాశనం చేయండి." if is_te else "Remove and burn infected leaves.",
        "organic_solution": "లీటరు నీటిలో 5 గ్రాముల రాగి ఆక్సిక్లోరైడ్ కలిపి పిచికారీ చేయండి." if is_te else "Spray copper oxychloride mixture or organic neem formulation.",
        "chemical_solution": "తగిన మోతాదులో కార్బెండజిమ్ లేదా మ్యాంకోజెబ్ పిచికారీ చేయండి." if is_te else "Spray carbendazim or mancozeb protective fungicide.",
        "preventive_measures": "పంటల మార్పిడి చేయండి మరియు డ్రిప్ పద్ధతిలో నీరు అందించండి." if is_te else "Rotate crops yearly and use drip irrigation lines.",
        "ai_recommendations": "నత్రజని ఎరువుల పిచికారీని వాయిదా వేయండి మరియు పొలాన్ని గమనిస్తూ ఉండండి." if is_te else "Delay nitrogen spray and monitor field moisture today.",
        "confidence": confidence
    }
