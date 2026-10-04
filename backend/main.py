from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator
from database import supabase
from services.ai_extractor import extract_skills_from_jd
from services.gap_engine import calculate_skill_gap
from services.resume_extractor import extract_skills_from_resume
from services.job_search import search_live_jobs
from services.roadmap_generator import generate_learning_roadmap
import logging
import re

app = FastAPI()

# Configure CORS Middleware to allow origins (*) so React can make requests without cross-origin blocks
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def sanitize_text(text: str) -> str:
    if not isinstance(text, str):
        return text
    # Replace control characters except newlines with space
    return re.sub(r'[\x00-\x09\x0b-\x1f\x7f]', ' ', text)

@app.get("/")
def health_check():
    return {"status": "online", "app": "Skill Gap Analyzer API"}

@app.get("/api/db-check")
def db_check():
    if supabase is not None:
        return {"database": "connected"}
    return {"error": "Missing or invalid Supabase credentials in .env file."}

class JobDescriptionRequest(BaseModel):
    job_description: str

    @field_validator('job_description', mode='before')
    @classmethod
    def clean_jd(cls, v):
        return sanitize_text(v)

@app.post("/api/test-extract")
def test_extract(request: JobDescriptionRequest):
    return extract_skills_from_jd(request.job_description)

class AnalyzeGapRequest(BaseModel):
    user_id: str = "guest_user"
    job_title: str
    job_description: str
    user_skills: list[str]

    @field_validator('job_title', 'job_description', mode='before')
    @classmethod
    def clean_strings(cls, v):
        return sanitize_text(v)

@app.post("/api/analyze-gap")
def analyze_gap(request: AnalyzeGapRequest):
    # 1. Extract required skills from JD
    ai_result = extract_skills_from_jd(request.job_description)
    req_tech = ai_result.get("technical_skills", [])
    req_soft = ai_result.get("soft_skills", [])
    
    # 2. Calculate the skill gap
    gap_result = calculate_skill_gap(request.user_skills, req_tech, req_soft)
    
    # 3. Attempt to save to Supabase
    saved_to_db = False
    if supabase is not None:
        try:
            data_to_insert = {
                "user_id": request.user_id,
                "job_title": request.job_title,
                "match_percentage": gap_result["match_percentage"],
                "matched_skills": gap_result["matched_skills"],
                "missing_tech_skills": gap_result["missing_tech_skills"],
                "missing_soft_skills": gap_result["missing_soft_skills"]
            }
            supabase.table("skill_gap_reports").insert(data_to_insert).execute()
            saved_to_db = True
        except Exception as e:
            logging.error(f"Supabase insert failed: {e}")
            
    # Generate Roadmap
    missing_all = gap_result["missing_tech_skills"] + gap_result["missing_soft_skills"]
    roadmap = generate_learning_roadmap(missing_all, request.job_title)

    # 4. Return the complete analysis
    return {
        "job_title": request.job_title,
        "match_percentage": gap_result["match_percentage"],
        "matched_skills": gap_result["matched_skills"],
        "missing_tech_skills": gap_result["missing_tech_skills"],
        "missing_soft_skills": gap_result["missing_soft_skills"],
        "all_required_tech": req_tech,
        "all_required_soft": req_soft,
        "saved_to_db": saved_to_db,
        "roadmap": roadmap
    }

class ResumeRequest(BaseModel):
    resume_text: str

    @field_validator('resume_text', mode='before')
    @classmethod
    def clean_resume(cls, v):
        return sanitize_text(v)

@app.post("/api/extract-resume")
def extract_resume(request: ResumeRequest):
    skills = extract_skills_from_resume(request.resume_text)
    return {"skills": skills}

# python-multipart dependency removed. Using /api/extract-resume for JSON payloads.

class JobSearchRequest(BaseModel):
    query: str
    location: str = "Global"

@app.post("/api/live-jobs")
def live_jobs(request: JobSearchRequest):
    jobs = search_live_jobs(request.query, request.location)
    return {
        "status": "success",
        "jobs": jobs,
        "count": len(jobs)
    }
