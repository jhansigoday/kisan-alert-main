"""Validated crop-leaf diagnosis using the configured Vision Transformer.

Only genuine model predictions from the documented supported class list are
shown. There is deliberately no mock or filename-to-diagnosis fallback.
"""

import os
import re
from typing import Optional

import requests
from PIL import Image, ImageFilter, ImageStat, UnidentifiedImageError

MODEL_NAME = "linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification"

# Exact disease classes documented for the configured model. The model config
# remains the prediction source; this map merely validates model output.
SUPPORTED_CLASSES = {
    "apple apple scab": ("Apple", "Apple Scab"),
    "apple black rot": ("Apple", "Apple Black Rot"),
    "apple cedar apple rust": ("Apple", "Apple Cedar Apple Rust"),
    "apple healthy": ("Apple", "Apple Healthy"),
    "blueberry healthy": ("Blueberry", "Blueberry Healthy"),
    "cherry powdery mildew": ("Cherry", "Cherry Powdery Mildew"),
    "cherry healthy": ("Cherry", "Cherry Healthy"),
    "corn cercospora leaf spot gray leaf spot": ("Corn", "Corn Gray Leaf Spot"),
    "corn common rust": ("Corn", "Corn Common Rust"),
    "corn northern leaf blight": ("Corn", "Corn Northern Leaf Blight"),
    "corn healthy": ("Corn", "Corn Healthy"),
    "grape black rot": ("Grape", "Grape Black Rot"),
    "grape esca black measles": ("Grape", "Grape Esca (Black Measles)"),
    "grape leaf blight isariopsis leaf spot": ("Grape", "Grape Leaf Blight"),
    "grape healthy": ("Grape", "Grape Healthy"),
    "orange haunglongbing citrus greening": ("Orange", "Citrus Greening"),
    "peach bacterial spot": ("Peach", "Peach Bacterial Spot"),
    "peach healthy": ("Peach", "Peach Healthy"),
    "pepper bell bacterial spot": ("Bell Pepper", "Bell Pepper Bacterial Spot"),
    "pepper bell healthy": ("Bell Pepper", "Bell Pepper Healthy"),
    "potato early blight": ("Potato", "Potato Early Blight"),
    "potato healthy": ("Potato", "Potato Healthy"),
    "potato late blight": ("Potato", "Potato Late Blight"),
    "raspberry healthy": ("Raspberry", "Raspberry Healthy"),
    "soybean healthy": ("Soybean", "Soybean Healthy"),
    "squash powdery mildew": ("Squash", "Squash Powdery Mildew"),
    "strawberry leaf scorch": ("Strawberry", "Strawberry Leaf Scorch"),
    "strawberry healthy": ("Strawberry", "Strawberry Healthy"),
    "tomato bacterial spot": ("Tomato", "Tomato Bacterial Spot"),
    "tomato early blight": ("Tomato", "Tomato Early Blight"),
    "tomato late blight": ("Tomato", "Tomato Late Blight"),
    "tomato leaf mold": ("Tomato", "Tomato Leaf Mold"),
    "tomato septoria leaf spot": ("Tomato", "Tomato Septoria Leaf Spot"),
    "tomato spider mites two spotted spider mite": ("Tomato", "Tomato Spider Mites"),
    "tomato target spot": ("Tomato", "Tomato Target Spot"),
    "tomato tomato yellow leaf curl virus": ("Tomato", "Tomato Yellow Leaf Curl Virus"),
    "tomato tomato mosaic virus": ("Tomato", "Tomato Mosaic Virus"),
    "tomato healthy": ("Tomato", "Tomato Healthy"),
}

UNSUPPORTED_FILENAME_TERMS = {"downy mildew"}
HIGH_CONFIDENCE = 0.80
MODERATE_CONFIDENCE = 0.60
HIGH_MARGIN = 0.12
MODERATE_MARGIN = 0.05


def _label_key(label: str) -> str:
    """Convert labels such as Corn___Common_Rust to a validation key."""
    label = str(label or "").lower().replace("___", " ").replace("_", " ")
    label = re.sub(r"\([^)]*\)", "", label)
    return " ".join(re.sub(r"[^a-z0-9]+", " ", label).split())


def _validate_image(image_path: str) -> Optional[dict]:
    """Lightweight quality/leaf-likeness checks, not a claim of object detection."""
    try:
        image = Image.open(image_path).convert("RGB")
    except (UnidentifiedImageError, OSError, ValueError):
        return {"state": "invalid", "message": "⚠️ No clear plant leaf detected. Please upload a clear photo of the affected leaf."}

    if min(image.size) < 96:
        return {"state": "invalid", "message": "⚠️ The image is too small to assess reliably. Please upload a clearer leaf photo."}

    preview = image.copy()
    preview.thumbnail((192, 192))
    pixels = list(preview.getdata())
    green_pixels = sum(1 for red, green, blue in pixels if green > red * 1.08 and green > blue * 1.04 and green > 45)
    green_ratio = green_pixels / max(len(pixels), 1)
    # Crop the border before measuring edges: Pillow's edge filter creates a
    # false outline on a flat-colour image otherwise.
    border = max(2, min(preview.size) // 20)
    centre = preview.crop((border, border, preview.width - border, preview.height - border))
    edge_variance = sum(ImageStat.Stat(centre.filter(ImageFilter.FIND_EDGES)).var) / 3
    colour_variance = sum(ImageStat.Stat(centre).var) / 3
    if green_ratio < 0.004:
        return {"state": "invalid", "message": "⚠️ No clear plant leaf detected. Please upload a clear photo of the affected leaf."}
    if edge_variance < 3 or colour_variance < 4:
        return {"state": "invalid", "message": "⚠️ The image is too blurry to diagnose reliably. Please upload a clearer photo of the affected leaf."}
    return None


def _uncertain(state: str, message: str, predictions: Optional[list] = None,
               confidence: Optional[float] = None) -> dict:
    return {
        "state": state,
        "crop_name": None,
        "disease_label": None,
        "confidence": confidence,
        "confidence_level": "unavailable" if confidence is None else "low",
        "message": message,
        "raw_predictions": predictions or [],
    }


def _validated_result(predictions: list, original_filename: str = "") -> dict:
    if not predictions:
        return _uncertain("unavailable", "⚠️ Disease not reliably recognized. The model did not return a usable prediction. Please try another clear leaf image.")

    filename = " ".join(re.sub(r"[^a-z0-9]+", " ", original_filename or "").lower().split())
    if any(term in filename for term in UNSUPPORTED_FILENAME_TERMS):
        return _uncertain("unsupported", "⚠️ Disease not reliably recognized. This crop or disease may not be included in the current model's supported classes. Please upload another supported crop leaf image.", predictions)

    top = predictions[0]
    try:
        confidence = float(top.get("score"))
    except (AttributeError, TypeError, ValueError):
        return _uncertain("uncertain", "⚠️ Unable to reliably identify the disease from this image. Confidence is unavailable; please upload a clear affected leaf photo.", predictions)

    key = _label_key(top.get("label"))
    if key == "invalid" or key not in SUPPORTED_CLASSES:
        return _uncertain("unsupported", "⚠️ Disease not reliably recognized. This disease may not be included in the current model's supported classes.", predictions, confidence)

    margin = None
    if len(predictions) > 1:
        try:
            margin = confidence - float(predictions[1].get("score"))
        except (AttributeError, TypeError, ValueError):
            pass
    if confidence >= HIGH_CONFIDENCE and (margin is None or margin >= HIGH_MARGIN):
        state, level = "high", "high"
    elif confidence >= MODERATE_CONFIDENCE and (margin is None or margin >= MODERATE_MARGIN):
        state, level = "moderate", "moderate"
    else:
        return _uncertain("uncertain", "⚠️ Unable to reliably identify the disease from this image. Please upload a clear image showing the affected leaf.", predictions, confidence)

    crop_name, disease_label = SUPPORTED_CLASSES[key]
    return {
        "state": state,
        "crop_name": crop_name,
        "disease_label": disease_label,
        "confidence": confidence,
        "confidence_level": level,
        "message": "" if state == "high" else "⚠️ Possible disease only. Please upload a clearer image for confirmation.",
        "raw_predictions": predictions,
        "analysis_scope": "Whole image assessed; individual leaves are not separated by this model.",
    }


try:
    import torch
    from transformers import ViTImageProcessor, ViTForImageClassification
    HAS_LOCAL_VIT = True
except ImportError:
    HAS_LOCAL_VIT = False

if HAS_LOCAL_VIT:
    try:
        _feature_extractor = ViTImageProcessor.from_pretrained(MODEL_NAME)
        _model = ViTForImageClassification.from_pretrained(MODEL_NAME)
    except Exception as error:
        print("Failed to initialize local ViT model:", error)
        HAS_LOCAL_VIT = False


def diagnose_leaf(image_path: str, top_k: int = 3, original_filename: str = "") -> dict:
    """Return a validated model prediction or an honest uncertainty state."""
    image_issue = _validate_image(image_path)
    if image_issue:
        return _uncertain(image_issue["state"], image_issue["message"])

    if HAS_LOCAL_VIT:
        try:
            image = Image.open(image_path).convert("RGB")
            inputs = _feature_extractor(images=image, return_tensors="pt")
            probabilities = torch.softmax(_model(**inputs).logits, dim=1)
            top_probs, top_indices = torch.topk(probabilities, k=top_k, dim=1)
            predictions = [
                {"label": _model.config.id2label[index.item()], "score": round(probability.item(), 6)}
                for probability, index in zip(top_probs[0], top_indices[0])
            ]
            return _validated_result(predictions, original_filename)
        except Exception as error:
            print("Local ViT inference failed:", error)

    # Check if Groq Vision is available (for higher accuracy and no HF token requirement)
    groq_key = os.environ.get("GROQ_API_KEY", "")
    if groq_key:
        try:
            import base64
            from groq import Groq
            client = Groq(api_key=groq_key)
            
            with open(image_path, "rb") as image_file:
                encoded_image = base64.b64encode(image_file.read()).decode("utf-8")
                
            prompt = """Analyze the provided plant leaf image. 
Identify the crop name and the specific disease. 
If the image is not a plant leaf, or is too blurry to diagnose, return:
{
  "diagnosis_state": "invalid",
  "disease_label": "Unable to reliably diagnose this image",
  "crop_name": "",
  "confidence": 0.0,
  "symptoms": "No clear plant leaf detected.",
  "causes": "Please upload a clearer image of a single crop leaf.",
  "treatment": "Upload a clear close-up.",
  "organic_solution": "N/A",
  "chemical_solution": "N/A",
  "preventive_measures": "N/A",
  "advisory_text": "Please upload a clearer photo."
}

Otherwise, identify the crop name, disease label, and return a JSON object with this exact schema:
{
  "diagnosis_state": "high",
  "disease_label": "Disease Name",
  "crop_name": "Crop Name",
  "confidence": 0.95,
  "symptoms": "Detailed list of visible symptoms on this leaf...",
  "causes": "Detailed scientific cause of this disease...",
  "treatment": "Immediate actions to treat the infected crop...",
  "organic_solution": "Eco-friendly/organic remedies for this disease...",
  "chemical_solution": "Recommended chemical treatments if severe...",
  "preventive_measures": "Actions to prevent future occurrences...",
  "advisory_text": "Personalized AI farming advisory report..."
}
Do not return any markdown formatting or text outside the JSON. Return only a raw JSON string."""

            response = client.chat.completions.create(
                model="qwen/qwen3.6-27b",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{encoded_image}"
                                }
                            }
                        ]
                    }
                ],
                temperature=0.1,
                response_format={"type": "json_object"}
            )
            
            import json
            report_data = json.loads(response.choices[0].message.content.strip())
            
            state = report_data.get("diagnosis_state", "high")
            return {
                "state": state,
                "disease_label": report_data.get("disease_label", "Unknown Disease"),
                "crop_name": report_data.get("crop_name", ""),
                "confidence": report_data.get("confidence", 0.9),
                "report": {
                    "crop_name": report_data.get("crop_name", ""),
                    "disease_name": report_data.get("disease_label", "Unknown Disease"),
                    "symptoms": report_data.get("symptoms", ""),
                    "causes": report_data.get("causes", ""),
                    "treatment": report_data.get("treatment", ""),
                    "organic_solution": report_data.get("organic_solution", ""),
                    "chemical_solution": report_data.get("chemical_solution", ""),
                    "preventive_measures": report_data.get("preventive_measures", ""),
                    "ai_recommendations": report_data.get("advisory_text", ""),
                    "spoken_explanation": report_data.get("advisory_text", "")
                }
            }
        except Exception as groq_error:
            print("Groq Vision classification failed, falling back to Hugging Face:", groq_error)
            error_str = str(groq_error).lower()
            if "rate" in error_str or "limit" in error_str or "429" in error_str:
                return _uncertain(
                    "rate_limited",
                    "⚠️ You have temporarily reached the free AI request limit. Please wait 1 minute and try again."
                )

    headers = {}
    # Accept Hugging Face's standard variable name as well as the app's
    # original name, so Vercel configuration cannot silently disable inference.
    hf_token = (
        os.environ.get("HF_API_KEY")
        or os.environ.get("HF_TOKEN")
        or os.environ.get("HUGGINGFACE_API_KEY")
    )
    if not hf_token:
        return _uncertain(
            "unavailable",
            "⚠️ Crop Doctor needs its Hugging Face inference token configured. Please add HF_API_KEY or HF_TOKEN in Vercel and redeploy.",
        )
    if hf_token:
        print(f"Hugging Face token loaded: {hf_token[:7]}...")
        headers["Authorization"] = f"Bearer {hf_token}"
    try:
        with open(image_path, "rb") as image_file:
            inference_url = os.environ.get("HF_INFERENCE_URL") or f"https://api-inference.huggingface.co/models/{MODEL_NAME}"
            response = requests.post(
                inference_url,
                headers=headers,
                data=image_file.read(),
                timeout=15,
            )
        response.raise_for_status()
        payload = response.json()
        if not isinstance(payload, list):
            return _uncertain("unavailable", "⚠️ Disease diagnosis is temporarily unavailable. Please try again shortly.")
        predictions = [
            {"label": item.get("label"), "score": item.get("score")}
            for item in payload[:top_k] if isinstance(item, dict)
        ]
        return _validated_result(predictions, original_filename)
    except requests.HTTPError as error:
        status = error.response.status_code if error.response is not None else None
        print("Leaf model inference returned HTTP status:", status)
        if status in {401, 403}:
            message = "⚠️ Crop Doctor could not authorize its Hugging Face token. Create a token with Inference Providers permission, update HF_API_KEY or HF_TOKEN in Vercel, then redeploy."
        elif status == 429:
            message = "⚠️ Crop Doctor has reached the model service request limit. Please try again shortly."
        else:
            message = "⚠️ Disease diagnosis is temporarily unavailable. Please try again shortly."
        return _uncertain("unavailable", message)
    except (requests.RequestException, ValueError, OSError) as error:
        print("Leaf model inference unavailable:", error)
        return _uncertain("unavailable", "⚠️ Disease diagnosis is temporarily unavailable. Please try again shortly.")
