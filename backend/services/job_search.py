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
    print("\n=================== JOB SEARCH DIAGNOSTICS ===================")
    print("⚠️ [Notice] JSearch API on RapidAPI is currently returning 404 Endpoint Not Found.")
    print("🔄 [System] Automatically falling back to RemoteOK API engine...")

    try:
        # Format query for RemoteOK (uses comma-separated tags)
        search_tags = urllib.parse.quote(query.replace(' ', ','))
        url = f"https://remoteok.com/api?tags={search_tags}"
        
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }

        req = urllib.request.Request(url, headers=headers)
        
        with urllib.request.urlopen(req, timeout=12) as response:
            status_code = response.getcode()
            response_data = response.read().decode('utf-8')
            raw_jobs = json.loads(response_data)
            
        print(f"✅ [RemoteOK] Success (HTTP {status_code}): Fetched {len(raw_jobs)} jobs for '{query}'.")
        print("===========================================================\n")
        
        jobs = []
        # RemoteOK returns a legal text object in index 0, actual jobs start at 1
        for item in raw_jobs[1:]:
            jobs.append({
                "job_id": str(item.get("id", "")),
                "title": item.get("position", "Unknown Position"),
                "company": item.get("company", "Unknown"),
                "location": item.get("location", "Global / Remote") or "Remote",
                "source": "RemoteOK",
                "description": item.get("description", ""),
                "apply_link": item.get("apply_url", "#")
            })
            
            if len(jobs) >= 20: # Limit to 20 jobs to keep UI snappy
                break
                
        return jobs

    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8', errors='ignore')
        print(f"❌ [RemoteOK] HTTP Error {e.code}: {e.reason}")
        print(f"📄 Response Body: {error_body}")
        print("===========================================================\n")
        return []
    except Exception as e:
        print(f"❌ [RemoteOK] Exception: {e}")
        print("===========================================================\n")
        return []
