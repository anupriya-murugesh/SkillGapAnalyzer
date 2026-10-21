from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator
from database import supabase
from services.ai_extractor import extract_skills_from_jd
from services.gap_engine import calculate_skill_gap
from services.resume_extractor import extract_skills_from_resume
from services.job_search import search_live_jobs
from services.roadmap_generator import generate_learning_roadmap
from services.quiz_generator import generate_quiz_questions, generate_coding_challenges
from services.code_evaluator import evaluate_submission
import logging
import re
import time

app = FastAPI()

# Configure CORS Middleware to allow origins (*) so React can make requests without cross-origin blocks
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
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

@app.get("/api")
def api_health_check():
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

class QuizRequest(BaseModel):
    skill: str
    user_email: str = ""

@app.post("/api/generate-quiz")
def generate_quiz(request: QuizRequest):
    questions = generate_quiz_questions(request.skill, user_email=request.user_email)
    return {
        "status": "success",
        "skill": request.skill,
        "questions": questions
    }

@app.post("/api/generate-coding-challenge")
def generate_coding_challenge_api(request: QuizRequest):
    challenges = generate_coding_challenges(request.skill)
    return {
        "status": "success",
        "skill": request.skill,
        "challenges": challenges
    }

class EvaluateCodeRequest(BaseModel):
    skill: str
    challenge_id: str
    code: str
    test_cases: list[dict]

@app.post("/api/evaluate-coding-challenge")
def evaluate_coding_challenge_api(request: EvaluateCodeRequest):
    results = evaluate_submission(
        skill=request.skill,
        challenge_id=request.challenge_id,
        code=request.code,
        test_cases=request.test_cases
    )
    passed_count = sum(1 for r in results if r.get("passed"))
    return {
        "status": "success",
        "challenge_id": request.challenge_id,
        "results": results,
        "passed_count": passed_count,
        "total_count": len(results),
        "all_passed": passed_count == len(results)
    }

class RoadmapRequest(BaseModel):
    target_role: str = "Full-Stack Developer"
    missing_skills: list[str] = []

@app.post("/api/generate-roadmap")
def generate_roadmap_api(request: RoadmapRequest):
    skills = request.missing_skills if request.missing_skills else ["Core Architecture", "APIs", "Database Design", "Cloud Deployment"]
    roadmap = generate_learning_roadmap(skills, request.target_role)
    return {
        "status": "success",
        "target_role": request.target_role,
        "roadmap": roadmap
    }

# =============================================================================
# EMPLOYER PORTAL ENDPOINTS
# =============================================================================

class EmployerJobModel(BaseModel):
    id: str = ""
    title: str
    department: str = "Engineering"
    workplace: str = "Remote"
    location: str = "Global / Remote"
    type: str = "Full-Time"
    salary: str = "$90k - $140k / yr"
    required_skills: list[str] = []
    description: str = ""
    employer_id: str = "default_employer"
    company_name: str = "TechCorp Global"
    applicant_count: int = 0
    status: str = "Active"

@app.get("/api/employer/jobs")
def get_employer_jobs_api():
    if supabase is not None:
        try:
            res = supabase.table("employer_jobs").select("*").order("created_at", desc=True).execute()
            if res.data:
                return {"status": "success", "jobs": res.data}
        except Exception as e:
            logging.warning(f"Supabase employer_jobs fetch error: {e}")
    return {"status": "success", "jobs": []}

@app.post("/api/employer/jobs")
def create_employer_job_api(job: EmployerJobModel):
    job_dict = job.dict()
    if not job_dict.get("id"):
        job_dict["id"] = f"job-{int(time.time() * 1000)}" if 'time' in globals() else "job-new"
    
    if supabase is not None:
        try:
            supabase.table("employer_jobs").insert(job_dict).execute()
        except Exception as e:
            logging.warning(f"Supabase employer_jobs insert error: {e}")
            
    return {"status": "success", "job": job_dict}

@app.put("/api/employer/jobs/{job_id}")
def update_employer_job_api(job_id: str, updates: dict):
    if supabase is not None:
        try:
            supabase.table("employer_jobs").update(updates).eq("id", job_id).execute()
        except Exception as e:
            logging.warning(f"Supabase employer_jobs update error: {e}")
    return {"status": "success", "job_id": job_id, "updates": updates}

@app.delete("/api/employer/jobs/{job_id}")
def delete_employer_job_api(job_id: str):
    if supabase is not None:
        try:
            supabase.table("employer_jobs").delete().eq("id", job_id).execute()
        except Exception as e:
            logging.warning(f"Supabase employer_jobs delete error: {e}")
    return {"status": "success", "deleted_id": job_id}

class AssessmentInviteModel(BaseModel):
    candidate_id: str = ""
    candidate_name: str
    candidate_email: str
    skill: str
    difficulty: str = "Intermediate"
    role_title: str = "Software Engineer"
    employer_name: str = "TechCorp Global"
    custom_message: str = ""

@app.post("/api/employer/invite")
def create_invite_api(invite: AssessmentInviteModel):
    invite_dict = invite.dict()
    invite_dict["token"] = f"inv-{invite.skill[:3].lower()}-{int(time.time() * 1000)}" if 'time' in globals() else "inv-demo"
    invite_dict["status"] = "Pending"
    
    if supabase is not None:
        try:
            supabase.table("assessment_invitations").insert(invite_dict).execute()
        except Exception as e:
            logging.warning(f"Supabase assessment_invitations insert error: {e}")
            
    return {"status": "success", "invitation": invite_dict}


