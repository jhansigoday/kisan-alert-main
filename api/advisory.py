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
        "You are a crop pathology AI advisor. "
        "Return ONLY the final farmer-facing advisory. "
        "NEVER output: thinking process, chain of thought, analysis, reasoning steps, constraints, deliberation, or internal notes. "
        "Do not explain how you reached the answer. "
        "The response must be written directly to the farmer in simple language. "
        "You MUST structure the response exactly like this:\n\n"
        "DIAGNOSIS:\n"
        "LIKELY CAUSE:\n"
        "SYMPTOMS:\n"
        "WHAT TO DO:\n"
        "PREVENTION:\n"
        "WHEN TO SEEK HELP:\n\n"
        f"Write all text field values ONLY in {lang_name}."
    )

    user_prompt = (
        f"Farmer's spoken query (transcribed): {transcript or 'Not provided'}\n"
        f"Detected leaf condition (if photo provided): {disease_label or 'Not provided'}\n"
        f"{profile_context}\n"
        f"Relevant knowledge base excerpts:\n{chunks_text}\n\n"
        "Generate the structured advisory now."
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
        model="qwen/qwen3.6-27b",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        max_tokens=400,
    )

    advisory_text = response.choices[0].message.content.strip()
    import re
    advisory_text = re.sub(r"<think>.*?</think>", "", advisory_text, flags=re.DOTALL).strip()
    diag_match = re.search(r"(?i)\bDIAGNOSIS\b", advisory_text)
    if diag_match:
        advisory_text = advisory_text[diag_match.start():].strip()

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


def generate_crop_doctor_report(disease_label: str, confidence: float, lang: str = "en",
                                farmer_profile: dict = None, crop_name: str = "",
                                diagnosis_state: str = "high") -> dict:
    """Generate advice for an already validated model label; never re-diagnose it."""
    lang_name = "Telugu" if lang == "te" else "English"
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
        "The vision model has already validated the crop and disease below. Do not change, rename, or diagnose a different crop or disease. "
        "You MUST return a valid JSON object containing exactly these keys:\n"
        "{\n"
        "  \"symptoms\": \"...\",\n"
        "  \"causes\": \"...\",\n"
        "  \"treatment\": \"...\",\n"
        "  \"organic_solution\": \"...\",\n"
        "  \"chemical_solution\": \"...\",\n"
        "  \"preventive_measures\": \"...\",\n"
        "  \"ai_recommendations\": \"...\"\n"
        "}\n"
        f"Write all text field values ONLY in {lang_name}. Do NOT use markdown code blocks (like ```json), explanations or raw text. Return ONLY the raw JSON."
    )
    
    user_prompt = (
        f"Validated crop: {crop_name}\n"
        f"Validated disease label: {disease_label}\n"
        f"Diagnosis certainty: {diagnosis_state}\n"
        f"Profile details: {profile_context}\n"
        "Generate the complete pathology diagnosis now."
    )
    
    try:
        if _client:
            res = _client.chat.completions.create(
                model="qwen/qwen3.6-27b",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                max_tokens=800,
                temperature=0.3
            )
            content = res.choices[0].message.content.strip()
            import re
            content = re.sub(r"<think>.*?</think>", "", content, flags=re.DOTALL).strip()
            if content.startswith("```json"):
                content = content[7:]
            if content.endswith("```"):
                content = content[:-3]
            content = content.strip()
            report_data = json.loads(content)
            return {
                "crop_name": crop_name,
                "disease_name": disease_label,
                "confidence": confidence,
                **{key: report_data.get(key, "") for key in (
                    "symptoms", "causes", "treatment", "organic_solution",
                    "chemical_solution", "preventive_measures", "ai_recommendations"
                )},
                "spoken_explanation": report_data.get("ai_recommendations", ""),
            }
    except Exception as e:
        print("Llama crop doctor report generator failed, using fallback:", e)
        
    is_te = lang == "te"
    return {
        "crop_name": crop_name,
        "disease_name": disease_label,
        "symptoms": "మోడల్ ఫలితానికి స్థానిక వ్యవసాయ నిపుణుడి నిర్ధారణ అవసరం." if is_te else "The model result should be confirmed with a local agricultural expert.",
        "causes": "ధృవీకరించిన నిర్ధారణ లేకుండా కారణం చెప్పలేము." if is_te else "The cause cannot be confirmed without further assessment.",
        "treatment": "సోకిన ఆకులను వేరుచేసి, పొలాన్ని గమనించండి." if is_te else "Isolate visibly affected leaves and monitor the crop.",
        "organic_solution": "స్థానిక వ్యవసాయ మార్గదర్శకం పొందండి." if is_te else "Seek local agricultural guidance before applying a treatment.",
        "chemical_solution": "ధృవీకరణ వచ్చే వరకు రసాయన సిఫార్సు ఇవ్వబడదు." if is_te else "No chemical recommendation is provided until the diagnosis is confirmed.",
        "preventive_measures": "పరికరాలను శుభ్రంగా ఉంచి, ప్రభావిత మొక్కలను గమనించండి." if is_te else "Keep tools clean and monitor nearby plants.",
        "ai_recommendations": "స్పష్టమైన ఆకుతో మరొక ఫోటోను అప్‌లోడ్ చేయండి." if is_te else "Upload another clear photo of the affected leaf for confirmation.",
        "spoken_explanation": "నిర్ధారణకు మరింత స్పష్టమైన ఆకు ఫోటో అవసరం." if is_te else "A clearer leaf photo is needed to confirm this model result.",
        "confidence": confidence,
    }
