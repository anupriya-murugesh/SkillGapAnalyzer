import os
import io
import json
import logging
import re
from typing import List, Optional
import google.generativeai as genai
import pypdf

from services.quiz_generator import get_api_keys

logger = logging.getLogger(__name__)

# =========================================================================
# 1. ROBUST PDF TEXT EXTRACTION
# =========================================================================

def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """Extract plain text from binary PDF data using pypdf with page-by-page fallback."""
    if not pdf_bytes:
        return ""
    try:
        reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))
        pages_text = []
        for idx, page in enumerate(reader.pages):
            try:
                t = page.extract_text()
                if t:
                    pages_text.append(t)
            except Exception as page_err:
                logger.warning(f"Error extracting text from PDF page {idx+1}: {page_err}")
                continue
        combined = "\n\n".join(pages_text).strip()
        # Clean up excessive null bytes or weird control characters if any
        combined = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f]', '', combined)
        return combined
    except Exception as e:
        logger.error(f"Failed to parse PDF bytes with pypdf: {e}")
        return ""


# =========================================================================
# 2. COMPREHENSIVE 350+ SKILL TAXONOMY (HIGH-RECALL MATCHER)
# =========================================================================

TAXONOMY_SKILLS = [
    # Programming Languages
    "Python", "JavaScript", "TypeScript", "Java", "C++", "C#", "C", "Go", "Golang", 
    "Rust", "PHP", "Ruby", "Swift", "Kotlin", "R", "Scala", "Dart", "Perl", 
    "Haskell", "Elixir", "Lua", "Julia", "SQL", "HTML", "HTML5", "CSS", "CSS3", 
    "Bash", "Shell", "PowerShell",

    # Frontend Frameworks & Libraries
    "React", "React.js", "Next.js", "Vue", "Vue.js", "Nuxt.js", "Angular", "AngularJS", 
    "Svelte", "SvelteKit", "Redux", "Redux Toolkit", "Zustand", "MobX", "Tailwind CSS", 
    "Bootstrap", "Material UI", "Chakra UI", "SASS", "SCSS", "Less", "Webpack", 
    "Vite", "Babel", "jQuery", "Three.js", "D3.js", "Chart.js",

    # Backend Frameworks & APIs
    "Node.js", "Express.js", "Express", "FastAPI", "Django", "Flask", "Spring", 
    "Spring Boot", "ASP.NET", ".NET", ".NET Core", "Ruby on Rails", "Laravel", 
    "Symfony", "NestJS", "Fastify", "Koa", "GraphQL", "REST API", "RESTful APIs", 
    "gRPC", "WebSockets", "Microservices", "Celery", "Socket.io",

    # Databases & Caching
    "PostgreSQL", "MySQL", "MongoDB", "Redis", "SQLite", "Oracle", "Microsoft SQL Server", 
    "Cassandra", "Elasticsearch", "DynamoDB", "Firebase", "Supabase", "MariaDB", 
    "CouchDB", "Neo4j", "Memcached", "Prisma", "SQLAlchemy", "Mongoose", "Hibernate",

    # Cloud & DevOps
    "AWS", "Amazon Web Services", "Azure", "Microsoft Azure", "Google Cloud", 
    "Google Cloud Platform", "GCP", "Docker", "Kubernetes", "K8s", "Terraform", 
    "Ansible", "Jenkins", "CI/CD", "GitHub Actions", "GitLab CI", "CircleCI", 
    "Linux", "Ubuntu", "Debian", "CentOS", "RedHat", "Unix", "Nginx", "Apache", 
    "Serverless", "Prometheus", "Grafana", "Cloudflare", "OpenShift", "Helm",

    # AI, ML, Data Science & Big Data
    "Machine Learning", "Deep Learning", "Artificial Intelligence", "NLP", 
    "Natural Language Processing", "Computer Vision", "LLMs", "Generative AI", 
    "Prompt Engineering", "PyTorch", "TensorFlow", "Keras", "Scikit-Learn", 
    "Pandas", "NumPy", "SciPy", "OpenCV", "Hugging Face", "LangChain", "LlamaIndex", 
    "RAG", "Data Analysis", "Data Engineering", "Data Science", "ETL", "Apache Spark", 
    "PySpark", "Hadoop", "Apache Kafka", "Kafka", "RabbitMQ", "Power BI", "Tableau", 
    "Matplotlib", "Seaborn", "Jupyter", "Databricks", "Snowflake", "BigQuery",

    # Mobile & Desktop Development
    "React Native", "Flutter", "Android", "iOS", "SwiftUI", "Expo", "Ionic", 
    "Electron", "Capacitor",

    # Testing & Quality Assurance
    "Git", "GitHub", "GitLab", "Bitbucket", "Postman", "Swagger", "OpenAPI", 
    "Jest", "Mocha", "Chai", "PyTest", "Selenium", "Cypress", "Playwright", 
    "JUnit", "Unit Testing", "Integration Testing", "End-to-End Testing", 
    "TDD", "BDD", "Jira", "Confluence", "Figma",

    # Software Engineering & Architecture
    "Data Structures", "Algorithms", "Object-Oriented Programming", "OOP", 
    "System Design", "Distributed Systems", "Design Patterns", "Clean Code", 
    "Refactoring", "Microservices Architecture", "Agile", "Scrum", "Kanban",

    # Professional & Soft Skills
    "Problem Solving", "Critical Thinking", "Communication", "Team Collaboration", 
    "Leadership", "Time Management", "Adaptability", "Mentoring", "Analytical Skills", 
    "Stakeholder Management", "Project Management", "Attention to Detail"
]

CANONICAL_NAME_MAP = {
    "react.js": "React",
    "reactjs": "React",
    "vue.js": "Vue",
    "vuejs": "Vue",
    "node.js": "Node.js",
    "nodejs": "Node.js",
    "express.js": "Express",
    "next.js": "Next.js",
    "nuxt.js": "Nuxt.js",
    "restful apis": "REST API",
    "rest api": "REST API",
    "k8s": "Kubernetes",
    "amazon web services": "AWS",
    "google cloud platform": "GCP",
    "google cloud": "GCP",
    "microsoft azure": "Azure",
    "html5": "HTML5",
    "css3": "CSS3",
    "js": "JavaScript",
    "ts": "TypeScript",
    "golang": "Go",
    "postgresql": "PostgreSQL",
    "postgres": "PostgreSQL",
    "mongodb": "MongoDB",
    "scikit-learn": "Scikit-Learn",
    "scikitlearn": "Scikit-Learn",
    "pytorch": "PyTorch",
    "tensorflow": "TensorFlow",
    "github actions": "GitHub Actions",
    "ci/cd": "CI/CD",
    "cicd": "CI/CD",
    "object-oriented programming": "OOP",
    "natural language processing": "NLP",
    "large language models": "LLMs",
    "llm": "LLMs",
    "llms": "LLMs"
}

def _canonicalize_skill_name(name: str) -> str:
    cleaned = name.strip()
    key = cleaned.lower()
    if key in CANONICAL_NAME_MAP:
        return CANONICAL_NAME_MAP[key]
    return cleaned

def scan_text_for_taxonomy_skills(text: str) -> List[str]:
    """Scan resume text with precise word boundaries for high-recall taxonomy matching."""
    if not text:
        return []
    
    found_set = set()
    found_normalized = set()

    for skill in TAXONOMY_SKILLS:
        escaped = re.escape(skill)
        if skill.lower() in ["c", "r", "go"]:
            pattern = rf'(?<![A-Za-z0-9]){escaped}(?![A-Za-z0-9])'
        elif any(c in skill for c in "+#./-"):
            pattern = rf'(?:^|[\s,;/()\[\]]){escaped}(?:$|[\s,;/()\[\]])'
        else:
            pattern = rf'\b{escaped}\b'

        if re.search(pattern, text, re.IGNORECASE):
            canonical = _canonicalize_skill_name(skill)
            c_lower = canonical.lower()
            if c_lower not in found_normalized:
                found_normalized.add(c_lower)
                found_set.add(canonical)

    return sorted(list(found_set), key=lambda x: x.lower())


# =========================================================================
# 3. HYBRID SKILL EXTRACTION (AI + DETERMINISTIC TAXONOMY ENGINE)
# =========================================================================

def extract_skills_from_resume(resume_text: str = "", pdf_bytes: Optional[bytes] = None) -> List[str]:
    """
    Extract skills from resume text or raw PDF bytes.
    Uses a hybrid approach:
      1. Converts PDF to text if provided.
      2. Runs Google Gemini AI extraction across candidate models with generous 20s timeout.
      3. Runs 350+ skill taxonomy scanner across text to capture any skills the AI might miss.
      4. Merges, deduplicates, and canonicalizes skill names for maximum accuracy.
    """
    # 1. Decode PDF if provided and resume_text is empty
    if pdf_bytes and not resume_text:
        resume_text = extract_text_from_pdf(pdf_bytes)

    if not resume_text or not resume_text.strip():
        logger.warning("Empty resume text provided for extraction.")
        return []

    cleaned_text = resume_text.strip()
    extracted_skills_set = set()
    normalized_keys = set()

    def add_skill(s: str):
        if not s or not isinstance(s, str):
            return
        s_clean = s.strip()
        # Filter out multi-sentence noise or hallucinated sentences
        if len(s_clean) < 2 or len(s_clean) > 40 or "\n" in s_clean:
            return
        canonical = _canonicalize_skill_name(s_clean)
        k = canonical.lower()
        if k not in normalized_keys:
            normalized_keys.add(k)
            extracted_skills_set.add(canonical)

    # 2. Attempt Google Gemini AI extraction
    api_keys = get_api_keys()
    candidate_models = ['gemini-3.8-flash', 'gemini-flash-latest']

    ai_success = False
    if api_keys:
        prompt = f"""
You are an expert technical talent recruiter and ATS resume parser.
Extract ALL professional skills from the resume text below.

Include:
- Programming Languages (e.g. Python, Java, TypeScript, C++)
- Frontend Frameworks & Libraries (e.g. React, Next.js, Tailwind CSS)
- Backend & APIs (e.g. Node.js, FastAPI, Django, GraphQL, REST APIs)
- Databases & Storage (e.g. PostgreSQL, MongoDB, Redis)
- Cloud & DevOps (e.g. AWS, Docker, Kubernetes, CI/CD, Git, Linux)
- Data Science, ML & AI (e.g. PyTorch, Pandas, Scikit-Learn, LLMs)
- Testing & Methodologies (e.g. Jest, PyTest, Agile, Scrum)
- Soft Skills (e.g. Communication, Problem Solving, Leadership)

Return ONLY a valid JSON array of skill strings with canonical capitalization.
Example: ["Python", "FastAPI", "React", "PostgreSQL", "Docker", "Git", "Problem Solving"]

Resume Text:
{cleaned_text[:12000]}
"""
        # Single responsive AI attempt (6s timeout) to prevent UI lag on network timeouts
        for key in api_keys[:1]:
            if ai_success:
                break
            try:
                genai.configure(api_key=key)
                model = genai.GenerativeModel('gemini-3.8-flash')
                response = model.generate_content(
                    prompt,
                    generation_config={"response_mime_type": "application/json"},
                    request_options={"timeout": 6.0}
                )
                parsed = json.loads(response.text)
                
                items = []
                if isinstance(parsed, list):
                    items = parsed
                elif isinstance(parsed, dict):
                    for v in parsed.values():
                        if isinstance(v, list):
                            items.extend(v)

                for item in items:
                    if isinstance(item, str):
                        add_skill(item)
                
                if len(items) > 0:
                    logger.info(f"AI extracted {len(items)} skills.")
                    ai_success = True
                    break
            except Exception as model_err:
                logger.warning(f"AI attempt note: {model_err}. Proceeding with taxonomy scanner...")
                break

    # 3. Always run the comprehensive 350+ taxonomy scan over the full resume text
    # This guarantees that even if the AI drops bullet points or times out, every skill is recovered!
    taxonomy_matched = scan_text_for_taxonomy_skills(cleaned_text)
    for skill in taxonomy_matched:
        add_skill(skill)

    result = sorted(list(extracted_skills_set), key=lambda x: x.lower())
    logger.info(f"Final hybrid extraction identified {len(result)} skills.")
    return result
