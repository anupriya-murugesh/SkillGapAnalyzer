import os
import json
import re
import logging
from pathlib import Path
from dotenv import load_dotenv
import google.generativeai as genai
from services.quiz_generator import get_api_keys

logger = logging.getLogger(__name__)

# Locate the .env file inside backend/
env_path = Path(__file__).resolve().parent.parent / ".env"

def get_api_key():
    load_dotenv(dotenv_path=env_path, override=True)
    return os.getenv("GEMINI_API_KEY", "").strip()

def extract_skills_from_jd(job_description: str) -> dict:
    if not job_description or not job_description.strip():
        return {"technical_skills": ["Software Engineering"], "soft_skills": ["Communication"]}

    api_keys = get_api_keys()
    
    # 1. Single rapid attempt with gemini-3.8-flash (3.0s timeout max)
    if api_keys:
        primary_key = api_keys[0]
        try:
            genai.configure(api_key=primary_key)
            model = genai.GenerativeModel('gemini-3.8-flash')
            prompt = f"""
Extract the required technical and soft skills from this job description.
Return ONLY a valid JSON object with this exact structure:
{{
  "technical_skills": ["skill1", "skill2"],
  "soft_skills": ["skill3", "skill4"]
}}

Job Description:
{job_description[:4000]}
"""
            response = model.generate_content(
                prompt,
                generation_config={"response_mime_type": "application/json"},
                request_options={"timeout": 3.0}
            )
            parsed = json.loads(response.text)
            if isinstance(parsed, dict) and "technical_skills" in parsed:
                return parsed
        except Exception as e:
            logger.info(f"AI JD extraction fast-fail notice: {e}. Switching immediately to instant taxonomy extractor.")

    # 2. High-speed Instant Taxonomy & Pattern Extractor (< 1 millisecond response)
    common_tech = [
        "Python", "FastAPI", "React", "React.js", "Node.js", "JavaScript", "TypeScript",
        "SQL", "PostgreSQL", "MongoDB", "Redis", "Docker", "Kubernetes", "AWS", "Java",
        "C++", "C#", "HTML", "CSS", "Tailwind", "Next.js", "Django", "Flask", "Git",
        "GitHub Actions", "CI/CD", "Linux", "GraphQL", "REST API", "Microservices",
        "PyTorch", "TensorFlow", "Machine Learning", "Deep Learning", "Pandas", "Scikit-Learn"
    ]
    common_soft = [
        "Communication", "Problem Solving", "Leadership", "Teamwork", "Agile",
        "Scrum", "Time Management", "Analytical Skills", "Critical Thinking", "Adaptability"
    ]
    
    found_tech = []
    found_tech_lower = set()
    for s in common_tech:
        if re.search(r'\b' + re.escape(s) + r'\b', job_description, re.IGNORECASE):
            canonical = "React" if s.lower() == "react.js" else s
            if canonical.lower() not in found_tech_lower:
                found_tech_lower.add(canonical.lower())
                found_tech.append(canonical)
                
    found_soft = [s for s in common_soft if re.search(r'\b' + re.escape(s) + r'\b', job_description, re.IGNORECASE)]
    
    return {
        "technical_skills": found_tech if found_tech else ["Software Engineering", "Problem Solving"],
        "soft_skills": found_soft if found_soft else ["Communication", "Team Collaboration"]
    }
