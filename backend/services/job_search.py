import os
import json
import logging
import urllib.request
import urllib.parse
from dotenv import load_dotenv
from pathlib import Path

# Locate the .env file inside backend/
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path, override=True)

def search_live_jobs(query: str, location: str = "Global") -> list[dict]:
    rapidapi_key = os.getenv("RAPIDAPI_KEY", "").strip()
    
    # 1. Primary Engine: JSearch API via RapidAPI
    if rapidapi_key and "your_" not in rapidapi_key.lower() and "placeholder" not in rapidapi_key.lower():
        try:
            search_query = urllib.parse.quote(f"{query} in {location}")
            url = f"https://jsearch.p.rapidapi.com/search?query={search_query}&page=1&num_pages=1"
            
            req = urllib.request.Request(url, headers={
                "X-RapidAPI-Key": rapidapi_key,
                "X-RapidAPI-Host": "jsearch.p.rapidapi.com"
            })
            
            with urllib.request.urlopen(req, timeout=10) as response:
                data = json.loads(response.read().decode())
                
            jobs = []
            for item in data.get("data", []):
                jobs.append({
                    "job_id": item.get("job_id"),
                    "title": item.get("job_title"),
                    "company": item.get("employer_name"),
                    "location": f"{item.get('job_city', '')}, {item.get('job_country', '')}".strip(', '),
                    "source": item.get("job_publisher"),
                    "description": item.get("job_description"),
                    "apply_link": item.get("job_apply_link")
                })
            return jobs
        except Exception as e:
            logging.warning(f"JSearch API failed: {e}. Falling back to Arbeitnow...")
            
    # 2. Resilient Fallback Engine: Arbeitnow (Free, No Auth required)
    logging.info("Running fallback job search via Arbeitnow API...")
    try:
        url = "https://www.arbeitnow.com/api/job-board-api"
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
        with urllib.request.urlopen(req, timeout=10) as response:
            data = json.loads(response.read().decode())
            
        jobs = []
        q_lower = query.lower()
        
        for item in data.get("data", []):
            title = item.get("title", "")
            description = item.get("description", "")
            
            # Substring match filtering to simulate search
            if q_lower in title.lower() or q_lower in description.lower():
                jobs.append({
                    "job_id": item.get("slug"),
                    "title": title,
                    "company": item.get("company_name"),
                    "location": item.get("location"),
                    "source": "Arbeitnow",
                    "description": description,
                    "apply_link": item.get("url")
                })
                
        return jobs
    except Exception as e:
        logging.error(f"Arbeitnow fallback API failed: {e}")
        return []
