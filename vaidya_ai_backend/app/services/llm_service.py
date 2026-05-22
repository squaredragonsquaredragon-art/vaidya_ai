import json
from openai import AsyncOpenAI
from app.core.config import settings

# Lazy client — initialized on first use
_client = None


def _get_client():
    global _client
    if _client is None and settings.OPENAI_API_KEY:
        _client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    return _client


MEDICAL_DISCLAIMER = (
    "\n\n⚠️ *This is AI-generated health information for educational purposes only. "
    "Always consult a qualified healthcare professional for medical advice, diagnosis, or treatment.*"
)


KANNADA_PROMPT_INSTRUCTION = (
    "\n\nIMPORTANT: The user has selected Kannada as their primary language. "
    "You MUST translate all textual values in the output JSON into Kannada, written in Kannada script (ಕನ್ನಡ ಲಿಪಿ). "
    "Keep the JSON keys (e.g., 'condition', 'cause', 'remedy', 'warning', 'severity', 'name', 'use', 'dosage', 'side_effects', 'avoid', 'desc', 'causes', 'symptoms', 'cure', 'prevention') EXACTLY the same and in English. "
    "Translate all text contents (descriptions, diagnoses, medicine usages, causes, precautions, etc.) into natural, clear, polite, and helpful Kannada. "
    "Do NOT translate the JSON keys. Only translate string values into Kannada."
)


def _no_key_response(feature: str, lang: str = "en") -> dict:
    """Fallback response when OpenAI API key is not set."""
    is_kn = "kn" in lang.lower()

    if is_kn:
        if feature == "Symptom":
            return {
                "condition": "[ಡೆಮೊ ಮೋಡ್] ಸಾಮಾನ್ಯ ಸೌಮ್ಯ ಜ್ವರ",
                "cause": "OpenAI API ಕೀಲಿಯನ್ನು ಬ್ಯಾಕೆಂಡ್‌ನಲ್ಲಿ ಕಾನ್ಫಿಗರ್ ಮಾಡಲಾಗಿಲ್ಲ (.env ನಲ್ಲಿ OPENAI_API_KEY ಸೇರಿಸಿ).",
                "remedy": "ಬೆಚ್ಚಗಿನ ನೀರನ್ನು ಕುಡಿಯಿರಿ, ವಿಶ್ರಾಂತಿ ಪಡೆಯಿರಿ ಮತ್ತು ಲಕ್ಷಣಗಳು ಮುಂದುವರಿದರೆ ಪ್ಯಾರಾಸೆಟಮಾಲ್ ತೆಗೆದುಕೊಳ್ಳಿ.",
                "warning": "ತಾಪಮಾನ ೧೦೩°F ಮೀರಿ ಹೆಚ್ಚಾದರೆ ಅಥವಾ ಉಸಿರಾಟದ ತೊಂದರೆ ಕಂಡುಬಂದರೆ ತಕ್ಷಣ ವೈದ್ಯರನ್ನು ಸಂಪರ್ಕಿಸಿ.",
                "severity": "mild",
            }
        elif feature == "Medicine":
            return {
                "name": "[ಡೆಮೊ ಮೋಡ್] ಪ್ಯಾರಾಸೆಟಮಾಲ್ (Paracetamol)",
                "use": "ಜ್ವರ ನಿವಾರಣೆ ಮತ್ತು ಸೌಮ್ಯ ತಲೆನೋವು ಉಪಶಮನಕ್ಕಾಗಿ ಬಳಸಲಾಗುತ್ತದೆ.",
                "dosage": "ವಯಸ್ಕರಿಗೆ ದಿನಕ್ಕೆ ೨-೩ ಬಾರಿ ೫೦೦mg ಮಾತ್ರೆ (ಊಟದ ನಂತರ).",
                "side_effects": "ಅತಿಯಾದ ಬಳಕೆಯಿಂದ ಯಕೃತ್ತಿನ (liver) ತೊಂದರೆ ಉಂಟಾಗಬಹುದು.",
                "avoid": "ಯಕೃತ್ತಿನ ಕಾಯಿಲೆ ಇರುವವರು ಅಥವಾ ಅತಿಯಾದ ಮದ್ಯಪಾನ ಮಾಡುವವರು ಇದನ್ನು ಬಳಸಬಾರದು.",
                "severity": "green",
            }
        elif feature == "Disease":
            return {
                "name": "[ಡೆಮೊ ಮೋಡ್] ಮಧುಮೇಹ (Diabetes)",
                "desc": "ದೇಹದಲ್ಲಿ ರಕ್ತದ ಸಕ್ಕರೆಯ ಪ್ರಮಾಣ ಹೆಚ್ಚಾಗುವ ಒಂದು ದೀರ್ಘಕಾಲದ ಕಾಯಿಲೆ.",
                "causes": "ಇನ್ಸುಲಿನ್ ಕೊರತೆ ಅಥವಾ ಇನ್ಸುಲಿನ್ ಪ್ರತಿರೋಧ ಹಾಗೂ ಜಡ ಜೀವನಶೈಲಿ ಪ್ರಮುಖ ಕಾರಣಗಳಾಗಿವೆ.",
                "symptoms": "ಅತಿಯಾದ ಬಾಯಾರಿಕೆ, ಪದೇ ಪದೇ ಮೂತ್ರ ವಿಸರ್ಜನೆ, ಆಯಾಸ ಮತ್ತು ತೂಕ ಇಳಿಕೆ.",
                "cure": "ಆರೋಗ್ಯಕರ ಆಹಾರ ಪದ್ಧತಿ, ನಿಯಮಿತ ವ್ಯಾಯಾಮ ಮತ್ತು ವೈದ್ಯರು ಸೂಚಿಸಿದ ಮೆಟ್‌ಫಾರ್ಮಿನ್‌ನಂತಹ ಔಷಧಿಗಳ ಬಳಕೆ.",
                "prevention": "ಸಕ್ಕರೆಯ ಪ್ರಮಾಣ ಕಡಿಮೆ ಮಾಡುವುದು, ತೂಕ ನಿಯಂತ್ರಣ ಮತ್ತು ಸಕ್ರಿಯ ಜೀವನಶೈಲಿ ಅಳವಡಿಸಿಕೊಳ್ಳುವುದು.",
                "severity": "moderate",
            }
        else: # Image Diagnosis
            return {
                "condition": "[ಡೆಮೊ ಮೋಡ್] ಸೌಮ್ಯ ಚರ್ಮದ ದದ್ದು (Mild Rash)",
                "cause": "ಅಲರ್ಜಿ ಅಥವಾ ಪರಿಸರ ಮಾಲಿನ್ಯಕ್ಕೆ ಒಡ್ಡಿಕೊಳ್ಳುವುದರಿಂದ ಉಂಟಾಗಬಹುದು.",
                "remedy": "ಸೌಮ್ಯವಾದ ಮಾಯಿಶ್ಚರೈಸರ್ ಹಚ್ಚಿ, ಅತಿಯಾಗಿ ಕೆರೆಯಬೇಡಿ ಮತ್ತು ಆಂಟಿಹಿಸ್ಟಮೈನ್ ಔಷಧಿಯನ್ನು ಬಳಸಿ.",
                "warning": "ದದ್ದುಗಳು ಇಡೀ ದೇಹಕ್ಕೆ ಹರಡಿದರೆ ಅಥವಾ ಜ್ವರ ಬಂದರೆ ಚರ್ಮರೋಗ ವೈದ್ಯರನ್ನು ಭೇಟಿ ಮಾಡಿ.",
                "severity": "mild",
            }

    # English Default
    if feature == "Symptom":
        return {
            "condition": "[Demo Mode] General Mild Fever",
            "cause": "OpenAI API key not configured. Add your key to .env to get real AI-powered responses.",
            "remedy": "Stay hydrated, rest, and consider taking over-the-counter Paracetamol if symptoms persist.",
            "warning": "Consult a doctor immediately if fever exceeds 103°F or lasts more than 3 days.",
            "severity": "mild",
        }
    elif feature == "Medicine":
        return {
            "name": "[Demo Mode] Paracetamol (500mg)",
            "use": "Mainly used for reducing fever and providing relief from mild to moderate pain.",
            "dosage": "1 tablet (500mg) every 4-6 hours as needed for adults. Do not exceed 4g daily.",
            "side_effects": "Rare, but can cause liver damage if taken in excessive doses.",
            "avoid": "Avoid if you have severe liver disease or active alcohol addiction.",
            "severity": "green",
        }
    elif feature == "Disease":
        return {
            "name": "[Demo Mode] Diabetes Mellitus",
            "desc": "A chronic metabolic condition characterized by elevated levels of blood glucose.",
            "causes": "Insufficient insulin production by the pancreas or the body's inability to effectively use insulin.",
            "symptoms": "Increased thirst, frequent urination, unexplained weight loss, extreme fatigue",
            "cure": "Managed via lifestyle modifications (diet, exercise) and oral medication like Metformin or Insulin injections.",
            "prevention": "Maintain a healthy weight, consume a balanced diet low in refined sugars, and engage in regular exercise.",
            "severity": "moderate",
        }
    else: # Image Diagnosis
        return {
            "condition": "[Demo Mode] Mild Contact Dermatitis",
            "cause": "Allergic reaction due to contact with an irritating substance or allergen.",
            "remedy": "Apply over-the-counter hydrocortisone cream and avoid scratching the affected area.",
            "warning": "Seek medical help if rash shows signs of infection like pus or severe swelling.",
            "severity": "mild",
        }


def _strip_json(raw: str) -> str:
    """Strip markdown code fences from GPT response."""
    if raw.startswith("```"):
        parts = raw.split("```")
        raw = parts[1] if len(parts) > 1 else raw
        if raw.startswith("json"):
            raw = raw[4:]
    return raw.strip()


async def analyze_symptoms(symptom_text: str, lang: str = "en") -> dict:
    """Analyze symptoms and return structured medical response."""
    client = _get_client()
    if not client:
        return _no_key_response("Symptom", lang)

    system_prompt = """You are Vaidya AI, a professional medical assistant for Indian patients.
Analyze the given symptoms and return ONLY a valid JSON object (no markdown, no extra text) with these exact keys:
{
  "condition": "Most likely condition name",
  "cause": "Primary causes in 1-2 sentences",
  "remedy": "Specific remedies and OTC medications available in India (with dosage)",
  "warning": "When to see a doctor urgently",
  "severity": "mild | moderate | serious"
}"""

    if "kn" in lang.lower():
        system_prompt += KANNADA_PROMPT_INSTRUCTION

    try:
        response = await client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Patient symptoms: {symptom_text}"},
            ],
            max_tokens=600,
            temperature=0.3,
        )
        raw = _strip_json(response.choices[0].message.content.strip())
        return json.loads(raw)
    except json.JSONDecodeError:
        return {
            "condition": "Analysis Complete" if "kn" not in lang.lower() else "ವಿಶ್ಲೇಷಣೆ ಪೂರ್ಣಗೊಂಡಿದೆ",
            "cause": raw if 'raw' in dir() else "Unable to parse response.",
            "remedy": "Please consult a healthcare professional." if "kn" not in lang.lower() else "ದಯವಿಟ್ಟು ವೈದ್ಯರನ್ನು ಸಂಪರ್ಕಿಸಿ.",
            "warning": "If symptoms are severe, seek immediate medical attention." if "kn" not in lang.lower() else "ಲಕ್ಷಣಗಳು ತೀವ್ರವಾಗಿದ್ದರೆ ತಕ್ಷಣ ವೈದ್ಯಕೀಯ ಚಿಕಿತ್ಸೆ ಪಡೆಯಿರಿ.",
            "severity": "moderate",
        }
    except Exception as e:
        return {
            "condition": "Error" if "kn" not in lang.lower() else "ದೋಷ",
            "cause": str(e),
            "remedy": "Please try again." if "kn" not in lang.lower() else "ದಯವಿಟ್ಟು ಇನ್ನೊಮ್ಮೆ ಪ್ರಯತ್ನಿಸಿ.",
            "warning": "Service temporarily unavailable." if "kn" not in lang.lower() else "ಸೇವೆ ತಾತ್ಕಾಲಿಕವಾಗಿ ಲಭ್ಯವಿಲ್ಲ.",
            "severity": "moderate",
        }


async def analyze_medicine(medicine_name: str, lang: str = "en") -> dict:
    """Return structured drug information."""
    client = _get_client()
    if not client:
        return _no_key_response("Medicine", lang)

    system_prompt = """You are a professional medical pharmacist assistant for Indian patients.
Given a medicine/tablet name, return ONLY a valid JSON object with these exact keys:
{
  "name": "Full official name (brand names in India)",
  "use": "Primary uses and indications",
  "dosage": "Standard adult dosage",
  "side_effects": "Common side effects",
  "avoid": "Contraindications - who should avoid",
  "severity": "green (OTC/safe) | yellow (use with care) | red (prescription only)"
}"""

    if "kn" in lang.lower():
        system_prompt += KANNADA_PROMPT_INSTRUCTION

    try:
        response = await client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Medicine: {medicine_name}"},
            ],
            max_tokens=500,
            temperature=0.2,
        )
        raw = _strip_json(response.choices[0].message.content.strip())
        return json.loads(raw)
    except json.JSONDecodeError:
        return {
            "name": medicine_name,
            "use": raw if 'raw' in dir() else "Unable to parse response.",
            "dosage": "Consult your pharmacist." if "kn" not in lang.lower() else "ಫಾರ್ಮಾಸಿಸ್ಟ್ ಸಂಪರ್ಕಿಸಿ.",
            "side_effects": "Not available" if "kn" not in lang.lower() else "ಲಭ್ಯವಿಲ್ಲ",
            "avoid": "Not available" if "kn" not in lang.lower() else "ಲಭ್ಯವಿಲ್ಲ",
            "severity": "yellow",
        }
    except Exception as e:
        return {"name": medicine_name, "use": str(e), "dosage": "", "side_effects": "", "avoid": "", "severity": "yellow"}


async def analyze_disease(disease_name: str, lang: str = "en") -> dict:
    """Return structured disease encyclopedia entry."""
    client = _get_client()
    if not client:
        return _no_key_response("Disease", lang)

    system_prompt = """You are a medical reference assistant for Indian patients.
Given a disease name, return ONLY a valid JSON object with these exact keys:
{
  "name": "Official disease name",
  "desc": "One-sentence description",
  "causes": "Primary causes",
  "symptoms": "Key symptoms (comma-separated)",
  "cure": "Treatment and management in India context",
  "prevention": "Prevention strategies",
  "severity": "mild | moderate | serious"
}"""

    if "kn" in lang.lower():
        system_prompt += KANNADA_PROMPT_INSTRUCTION

    try:
        response = await client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Disease: {disease_name}"},
            ],
            max_tokens=600,
            temperature=0.2,
        )
        raw = _strip_json(response.choices[0].message.content.strip())
        return json.loads(raw)
    except json.JSONDecodeError:
        return {
            "name": disease_name,
            "desc": raw if 'raw' in dir() else "Unable to parse response.",
            "causes": "",
            "symptoms": "",
            "cure": "",
            "prevention": "",
            "severity": "moderate",
        }
    except Exception as e:
        return {"name": disease_name, "desc": str(e), "causes": "", "symptoms": "", "cure": "", "prevention": "", "severity": "moderate"}


async def analyze_skin_image(image_base64: str, mime_type: str = "image/jpeg", lang: str = "en") -> dict:
    """Use GPT-4o Vision to analyze skin/wound images."""
    client = _get_client()
    if not client:
        return _no_key_response("Image Diagnosis", lang)

    system_prompt = """You are a medical image analysis assistant specializing in dermatology and wound care.
Analyze the provided skin/wound/medical image and return ONLY a valid JSON object with these exact keys:
{
  "condition": "Most likely skin condition or wound type",
  "cause": "Likely cause of this condition",
  "remedy": "Recommended treatment steps and OTC medications available in India",
  "warning": "Urgency and when to see a dermatologist/doctor",
  "severity": "mild | moderate | serious"
}
Be specific but note you are not a replacement for professional medical diagnosis."""

    if "kn" in lang.lower():
        system_prompt += KANNADA_PROMPT_INSTRUCTION

    try:
        response = await client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:{mime_type};base64,{image_base64}",
                                "detail": "high",
                            },
                        },
                        {
                            "type": "text",
                            "text": "Please analyze this skin condition or wound and provide medical guidance.",
                        },
                    ],
                },
            ],
            max_tokens=600,
            temperature=0.3,
        )
        raw = _strip_json(response.choices[0].message.content.strip())
        return json.loads(raw)
    except json.JSONDecodeError:
        return {
            "condition": "Analysis Complete" if "kn" not in lang.lower() else "ವಿಶ್ಲೇಷಣೆ ಪೂರ್ಣಗೊಂಡಿದೆ",
            "cause": raw if 'raw' in dir() else "Unable to parse response.",
            "remedy": "Please consult a dermatologist." if "kn" not in lang.lower() else "ದಯವಿಟ್ಟು ಚರ್ಮರೋಗ ವೈದ್ಯರನ್ನು ಸಂಪರ್ಕಿಸಿ.",
            "warning": "If spreading rapidly, seek immediate care." if "kn" not in lang.lower() else "ಶೀಘ್ರವಾಗಿ ಹರಡುತ್ತಿದ್ದರೆ ತಕ್ಷಣ ಚಿಕಿತ್ಸೆ ಪಡೆಯಿರಿ.",
            "severity": "moderate",
        }
    except Exception as e:
        return {
            "condition": "Error" if "kn" not in lang.lower() else "ದೋಷ",
            "cause": str(e),
            "remedy": "Please try again." if "kn" not in lang.lower() else "ದಯವಿಟ್ಟು ಇನ್ನೊಮ್ಮೆ ಪ್ರಯತ್ನಿಸಿ.",
            "warning": "Service temporarily unavailable." if "kn" not in lang.lower() else "ಸೇವೆ ತಾತ್ಕಾಲಿಕವಾಗಿ ಲಭ್ಯವಿಲ್ಲ.",
            "severity": "moderate",
        }


async def analyze_tablet_image(image_base64: str, mime_type: str = "image/jpeg", lang: str = "en") -> dict:
    """Use GPT-4o Vision to analyze tablet cover/medicine packaging images and return structured drug information."""
    client = _get_client()
    if not client:
        return _no_key_response("Medicine", lang)

    system_prompt = """You are a professional medical pharmacist assistant for Indian patients.
Analyze the provided image of a medicine container, tablet blister pack, prescription box, or bottle, identify the medicine/tablet, and return ONLY a valid JSON object with these exact keys:
{
  "name": "Full official name (brand names in India) of the identified medicine",
  "use": "Primary uses and indications",
  "dosage": "Standard adult dosage",
  "side_effects": "Common side effects",
  "avoid": "Contraindications - who should avoid",
  "severity": "green (OTC/safe) | yellow (use with care) | red (prescription only)"
}
If you cannot identify the medicine clearly from the image, try your best to read any visible text or name, or return the most likely identification. Keep responses medically accurate and direct."""

    if "kn" in lang.lower():
        system_prompt += KANNADA_PROMPT_INSTRUCTION

    try:
        response = await client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:{mime_type};base64,{image_base64}",
                                "detail": "high",
                            },
                        },
                        {
                            "type": "text",
                            "text": "Please identify the medicine in this packaging image and provide detailed clinical information.",
                        },
                    ],
                },
            ],
            max_tokens=600,
            temperature=0.2,
        )
        raw = _strip_json(response.choices[0].message.content.strip())
        return json.loads(raw)
    except json.JSONDecodeError:
        return {
            "name": "Identified Medicine" if "kn" not in lang.lower() else "ಗುರುತಿಸಲಾದ ಔಷಧಿ",
            "use": raw if 'raw' in dir() else "Unable to parse response.",
            "dosage": "Consult your pharmacist." if "kn" not in lang.lower() else "ಫಾರ್ಮಾಸಿಸ್ಟ್ ಸಂಪರ್ಕಿಸಿ.",
            "side_effects": "Not available" if "kn" not in lang.lower() else "ಲಭ್ಯವಿಲ್ಲ",
            "avoid": "Not available" if "kn" not in lang.lower() else "ಲಭ್ಯವಿಲ್ಲ",
            "severity": "yellow",
        }
    except Exception as e:
        return {
            "name": "Error" if "kn" not in lang.lower() else "ದೋಷ",
            "use": str(e),
            "dosage": "",
            "side_effects": "",
            "avoid": "",
            "severity": "yellow",
        }

