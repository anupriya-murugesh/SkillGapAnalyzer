import os
import json
import logging
import urllib.request
import urllib.parse
import urllib.error
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables from both backend folder and root directory
backend_dir = Path(__file__).resolve().parent
root_dir = backend_dir.parent

load_dotenv(dotenv_path=backend_dir / ".env", override=True)
load_dotenv(dotenv_path=root_dir / ".env", override=True)

def search_live_jobs(query: str, location: str = "Global") -> list[dict]:
    rapidapi_key = (
        os.getenv("VITE_RAPIDAPI_KEY") or 
        os.getenv("RAPIDAPI_KEY") or 
        ""
    ).strip()
    
    print("\n=================== JSEARCH DIAGNOSTICS ===================")
    print(f"🔑 API Key Found: {'YES' if rapidapi_key else 'NO'} | Key Preview: '{rapidapi_key[:8]}...' (Length: {len(rapidapi_key)})")

    if not rapidapi_key or "your_" in rapidapi_key.lower() or "placeholder" in rapidapi_key.lower():
        print("❌ [JSearch] Error: Missing or default RAPIDAPI_KEY in .env file.")
        print("===========================================================\n")
        return []

    try:
        search_query = urllib.parse.quote(f"{query} in {location}")
        # The provider deprecated `/search`. We must use `/search-v2`.
        url = f"https://jsearch.p.rapidapi.com/search-v2?query={search_query}&page=1&num_pages=1"
        
        headers = {
            "X-RapidAPI-Key": rapidapi_key,
            "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }

        req = urllib.request.Request(url, headers=headers)
        
        with urllib.request.urlopen(req, timeout=12) as response:
            status_code = response.getcode()
            response_data = response.read().decode('utf-8')
            data = json.loads(response_data)
            
        # `/search-v2` returns a dict inside `data`: {"data": {"jobs": [...]}}
        raw_jobs = data.get("data", {}).get("jobs", [])
        
        print(f"✅ [JSearch] Success (HTTP {status_code}): Fetched {len(raw_jobs)} jobs for '{query}' in '{location}'.")
        print("===========================================================\n")
        
        jobs = []
        for item in raw_jobs:
            jobs.append({
                "job_id": item.get("job_id"),
                "title": item.get("job_title"),
                "company": item.get("employer_name"),
                "location": f"{item.get('job_city', '')}, {item.get('job_country', '')}".strip(', ') or location,
                "source": "JSearch",
                "description": item.get("job_description", ""),
                "apply_link": item.get("job_apply_link", "#")
            })
            
        return jobs

    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8', errors='ignore')
        print(f"❌ [JSearch] HTTP Error {e.code}: {e.reason}")
        print(f"📄 RapidAPI Response Body: {error_body}")
        print("===========================================================\n")
        return []
    except Exception as e:
        print(f"❌ [JSearch] Exception: {e}")
        print("===========================================================\n")
        return []
