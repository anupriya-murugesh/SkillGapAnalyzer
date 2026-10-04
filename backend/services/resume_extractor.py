import json
import logging
import re
import google.generativeai as genai
from services.ai_extractor import get_api_key

def extract_skills_from_resume(resume_text: str) -> list[str]:
    api_key = get_api_key()
    
    # Run AI extraction if valid key is available
    if api_key and not ("your_" in api_key.lower() or "placeholder" in api_key.lower()):
        try:
            genai.configure(api_key=api_key)
            model_name = 'gemini-1.5-flash'
            
            prompt = f"""
            Extract technical and soft skills from the following resume text.
            Return ONLY a valid JSON array of strings (e.g. ["Python", "React", "HTML", "SQL"]).
            
            Resume:
            {resume_text}
            """
            
            model = genai.GenerativeModel(model_name)
            response = model.generate_content(
                prompt,
                generation_config={"response_mime_type": "application/json"},
                request_options={"timeout": 5.0}
            )
            parsed = json.loads(response.text)
            
            # Ensure return value is strictly a list of strings
            if isinstance(parsed, list):
                return [str(s) for s in parsed]
            elif isinstance(parsed, dict):
                for val in parsed.values():
                    if isinstance(val, list):
                        return [str(s) for s in val]
        except Exception as e:
            logging.warning(f"AI extraction failed or timed out: {e}. Falling back...")
    else:
        logging.warning("GEMINI_API_KEY missing or set to placeholder. Falling back to local parser.")

    # Resilient Fallback Parser
    logging.info("Running resilient fallback resume extraction...")
    common_skills = [
        "Python", "FastAPI", "React", "Node.js", "JavaScript", "TypeScript", 
        "SQL", "PostgreSQL", "MongoDB", "Docker", "AWS", "Java", "C++", 
        "HTML", "CSS", "Communication", "Problem Solving", "Leadership", 
        "Teamwork", "Agile", "Time Management"
    ]
    
    found_skills = []
    for skill in common_skills:
        pattern = r'(?:^|\W)' + re.escape(skill) + r'(?:$|\W)'
        if re.search(pattern, resume_text, re.IGNORECASE):
            found_skills.append(skill)
            
    return found_skills
