import os
import json
import re
import logging
from pathlib import Path
from dotenv import load_dotenv
import google.generativeai as genai

# Locate the .env file inside backend/
env_path = Path(__file__).resolve().parent.parent / ".env"

def get_api_key():
    load_dotenv(dotenv_path=env_path, override=True)
    return os.getenv("GEMINI_API_KEY", "").strip()

def extract_skills_from_jd(job_description: str) -> dict:
    api_key = get_api_key()
    
    # Target 2026 live Gemini models
    candidate_models = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-2.0-flash']
    
    prompt = f"""
    Extract the required technical and soft skills from the following job description.
    Return ONLY a valid JSON object with this exact structure:
    {{
      "technical_skills": ["skill1", "skill2"],
      "soft_skills": ["skill3", "skill4"]
    }}
    
    Job Description:
    {job_description}
    """
    
    if api_key and not ("your_" in api_key.lower() or "placeholder" in api_key.lower()):
        try:
            genai.configure(api_key=api_key)
            for model_name in candidate_models:
                try:
                    model = genai.GenerativeModel(model_name)
                    response = model.generate_content(
                        prompt,
                        generation_config={"response_mime_type": "application/json"}
                    )
                    return json.loads(response.text)
                except Exception as e:
                    logging.warning(f"Model {model_name} attempt failed: {e}. Trying next candidate...")
                    continue
        except Exception as err:
            logging.error(f"Gemini API initialization error: {err}")

    # Fallback Parser: Guarantees application continuity if external API is unreachable
    logging.info("Running resilient fallback skill extraction...")
    common_tech = ["Python", "FastAPI", "React", "Node.js", "JavaScript", "TypeScript", "SQL", "PostgreSQL", "MongoDB", "Docker", "AWS", "Java", "C++", "HTML", "CSS", "Tailwind"]
    common_soft = ["Communication", "Problem Solving", "Leadership", "Teamwork", "Agile", "Time Management"]
    
    found_tech = [s for s in common_tech if re.search(r'\b' + re.escape(s) + r'\b', job_description, re.IGNORECASE)]
    found_soft = [s for s in common_soft if re.search(r'\b' + re.escape(s) + r'\b', job_description, re.IGNORECASE)]
    
    return {
        "technical_skills": found_tech if found_tech else ["Software Engineering"],
        "soft_skills": found_soft if found_soft else ["Communication"]
    }
