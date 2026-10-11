import os
import json
import logging
import urllib.request
import urllib.parse
import urllib.error
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables dynamically from all possible locations
current_file = Path(__file__).resolve()
services_dir = current_file.parent
backend_dir = services_dir.parent
root_dir = backend_dir.parent

def load_env_vars():
    load_dotenv(dotenv_path=services_dir / ".env", override=True)
    load_dotenv(dotenv_path=backend_dir / ".env", override=True)
    load_dotenv(dotenv_path=root_dir / ".env", override=True)

load_env_vars()

def search_live_jobs(query: str, location: str = "Global") -> list[dict]:
    # Reload environment variables so updates to .env are picked up immediately
    load_env_vars()

    rapidapi_key = (
        os.getenv("RAPIDAPI_KEY") or 
        os.getenv("VITE_RAPIDAPI_KEY") or 
        os.getenv("JSEARCH_KEY") or
        os.getenv("JSEARCH_API_KEY") or
        ""
    ).strip()
    
    print("\n=================== JSEARCH DIAGNOSTICS ===================")
    print(f"[KEY STATUS] API Key Found: {'YES' if rapidapi_key else 'NO'} | Preview: '{rapidapi_key[:8]}...' (Length: {len(rapidapi_key)})")

    if not rapidapi_key or "your_" in rapidapi_key.lower() or "placeholder" in rapidapi_key.lower():
        print("[JSearch] Error: Missing or default RAPIDAPI_KEY in .env file.")
        print("===========================================================\n")
        return []

    try:
        search_term = f"{query} in {location}" if location and location.lower() != "global" else query
        search_query = urllib.parse.quote(search_term)
        
        # JSearch on RapidAPI uses /search-v2
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
            
        # Parse returned jobs safely across multiple formats (/search-v2 returns data.jobs)
        data_field = data.get("data")
        if isinstance(data_field, dict):
            raw_jobs = data_field.get("jobs", [])
        elif isinstance(data_field, list):
            raw_jobs = data_field
        elif isinstance(data, list):
            raw_jobs = data
        else:
            raw_jobs = data.get("jobs", [])
        
        print(f"[JSearch] Success (HTTP {status_code}): Fetched {len(raw_jobs)} jobs for '{query}' in '{location}'.")
        print("===========================================================\n")
        
        jobs = []
        for item in raw_jobs:
            if not isinstance(item, dict):
                continue
            city = item.get("job_city") or ""
            country = item.get("job_country") or ""
            loc_parts = [p for p in [city, country] if p]
            loc_str = ", ".join(loc_parts) if loc_parts else (item.get("job_location") or location)
            
            jobs.append({
                "job_id": item.get("job_id") or str(hash(str(item.get("job_title", "")) + str(item.get("employer_name", "")))),
                "title": item.get("job_title") or item.get("title", "Untitled Role"),
                "company": item.get("employer_name") or item.get("company", "Confidential"),
                "location": loc_str,
                "source": "JSearch",
                "description": item.get("job_description") or item.get("description", ""),
                "apply_link": item.get("job_apply_link") or item.get("apply_link", "#")
            })
            
        return jobs

    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8', errors='ignore')
        print(f"[JSearch] HTTP Error {e.code}: {e.reason}")
        print(f"[JSearch] RapidAPI Response: {error_body}")
        if e.code == 403:
            print("[Tip] RapidAPI 403: Ensure your account is subscribed to JSearch API on RapidAPI.")
        elif e.code == 429:
            print("[Tip] RapidAPI 429: Rate limit or monthly quota exceeded.")
        print("===========================================================\n")
        return []
    except Exception as e:
        print(f"[JSearch] Exception: {e}")
        print("===========================================================\n")
        return []
