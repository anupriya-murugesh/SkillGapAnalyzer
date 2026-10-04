import json
import logging
import google.generativeai as genai
from services.ai_extractor import get_api_key

def generate_learning_roadmap(missing_skills: list[str], target_role: str) -> list[dict]:
    if not missing_skills:
        return []

    api_key = get_api_key()
    
    if api_key and not ("your_" in api_key.lower() or "placeholder" in api_key.lower()):
        try:
            genai.configure(api_key=api_key)
            model_name = 'gemini-1.5-flash'
            
            prompt = f"""
            You are an expert career coach. The candidate is targeting the role of '{target_role}'.
            They are missing the following skills: {', '.join(missing_skills)}.
            
            Create a structured 4-week learning roadmap to help them acquire these missing skills.
            Return ONLY a valid JSON array of objects with the following schema:
            [
              {{
                "week": 1,
                "focus_area": "String (Core topic focus)",
                "topics": ["Concept 1", "Concept 2"],
                "recommended_resources": ["Doc or Course 1", "Search Term 2"],
                "hands_on_project": "String (A mini-project)"
              }}
            ]
            """
            
            model = genai.GenerativeModel(model_name)
            response = model.generate_content(
                prompt,
                generation_config={"response_mime_type": "application/json"},
                request_options={"timeout": 12.0}
            )
            parsed = json.loads(response.text)
            
            if isinstance(parsed, list):
                return parsed
        except Exception as e:
            logging.warning(f"Roadmap generation failed: {e}. Falling back...")

    # Fallback Roadmap
    return [
        {
            "week": 1,
            "focus_area": "Foundations & Basics",
            "topics": missing_skills[:2] if len(missing_skills) > 0 else ["General Foundations"],
            "recommended_resources": ["Official Documentation", "YouTube Crash Courses"],
            "hands_on_project": "Set up environment and build a hello-world level application."
        },
        {
            "week": 2,
            "focus_area": "Core Implementation",
            "topics": missing_skills[2:4] if len(missing_skills) > 2 else ["Intermediate Concepts"],
            "recommended_resources": ["Coursera / Udemy Introductory Modules", "GitHub Repositories"],
            "hands_on_project": "Integrate the skills into a single page or single script."
        },
        {
            "week": 3,
            "focus_area": "Advanced Patterns",
            "topics": missing_skills[4:6] if len(missing_skills) > 4 else ["Best Practices & Architecture"],
            "recommended_resources": ["Medium Articles", "Advanced System Design Videos"],
            "hands_on_project": "Refactor previous week's project with best practices."
        },
        {
            "week": 4,
            "focus_area": "Interview Prep & Portfolio",
            "topics": ["Mock Interviews", "Resume Update", "Deployment"],
            "recommended_resources": ["LeetCode", "Interview Prep Books"],
            "hands_on_project": "Deploy the final project and add it to your portfolio."
        }
    ]
