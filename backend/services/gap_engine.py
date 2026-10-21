import re

# Canonical Skill Dictionary with comprehensive industry aliases
SKILL_ALIASES = {
    'hypertext markup language': 'html',
    'html5': 'html',
    'cascading style sheets': 'css',
    'css3': 'css',
    'js': 'javascript',
    'ts': 'typescript',
    'golang': 'go',
    'py': 'python',
    'postgres': 'postgresql',
    'psql': 'postgresql',
    'reactjs': 'react',
    'react.js': 'react',
    'vuejs': 'vue',
    'vue.js': 'vue',
    'angularjs': 'angular',
    'angular.js': 'angular',
    'node': 'nodejs',
    'node.js': 'nodejs',
    'express.js': 'express',
    'nextjs': 'next.js',
    'nuxtjs': 'nuxt.js',
    'k8s': 'kubernetes',
    'aws': 'amazon web services',
    'gcp': 'google cloud platform',
    'google cloud': 'google cloud platform',
    'azure': 'microsoft azure',
    'ml': 'machine learning',
    'dl': 'deep learning',
    'ai': 'artificial intelligence',
    'nlp': 'natural language processing',
    'llm': 'large language models',
    'llms': 'large language models',
    'tailwind': 'tailwindcss',
    'tailwind css': 'tailwindcss',
    'ci/cd': 'cicd',
    'ci cd': 'cicd',
    'continuous integration': 'cicd',
    'continuous deployment': 'cicd',
    'github action': 'github actions',
    'rest': 'rest api',
    'restful api': 'rest api',
    'restful apis': 'rest api',
    'rest apis': 'rest api',
    'scikitlearn': 'scikit-learn',
    'tf': 'tensorflow',
    'oop': 'object-oriented programming',
    'dbms': 'database management'
}

# Words that must NEVER match via naive substring check due to false positives
STRICT_EXACT_MATCH_TERMS = {'c', 'r', 'go', 'java', 'sql', 'git', 'rust', 'ruby', 'dart', 'php', 'bash', 'css'}

def normalize_skill(skill_name: str) -> str:
    """Normalize skill names to lowercase and resolve known aliases."""
    s = skill_name.strip().lower()
    return SKILL_ALIASES.get(s, s)

def is_skill_match(req_skill: str, user_skills_normalized: list[str]) -> bool:
    """
    Check if the required skill matches any user skill safely.
    Uses exact canonical alias equality, and token-level boundary matching
    while guarding against false substring matches (e.g., 'Java' vs 'JavaScript', 'C' vs 'CSS').
    """
    req_norm = normalize_skill(req_skill)
    
    for u_skill in user_skills_normalized:
        u_norm = normalize_skill(u_skill)
        
        # 1. Exact match
        if req_norm == u_norm:
            return True

        # 2. Prevent strict terms from matching as substring
        if req_norm in STRICT_EXACT_MATCH_TERMS or u_norm in STRICT_EXACT_MATCH_TERMS:
            continue

        # 3. Token-aware match (e.g. 'rest api' matches 'restful apis', or 'react native' contains 'react')
        # Only allow substring match if the shorter term is >= 4 chars and aligns on word boundary
        shorter, longer = (req_norm, u_norm) if len(req_norm) <= len(u_norm) else (u_norm, req_norm)
        if len(shorter) >= 4:
            pattern = rf'(?:^|[\s\-_/]){re.escape(shorter)}(?:$|[\s\-_/])'
            if re.search(pattern, longer):
                return True

    return False

def calculate_skill_gap(user_skills: list[str], required_tech: list[str], required_soft: list[str]) -> dict:
    user_skills_clean = [s.strip() for s in user_skills if s and s.strip()]
    
    # Ensure unique required skills
    req_tech_unique = list(set([s.strip() for s in required_tech if s and s.strip()]))
    req_soft_unique = list(set([s.strip() for s in required_soft if s and s.strip()]))
    
    total_required_count = len(req_tech_unique) + len(req_soft_unique)
    
    matched_skills = []
    missing_tech_skills = []
    missing_soft_skills = []
    
    for req_original in req_tech_unique:
        if is_skill_match(req_original, user_skills_clean):
            matched_skills.append(req_original)
        else:
            missing_tech_skills.append(req_original)
            
    for req_original in req_soft_unique:
        if is_skill_match(req_original, user_skills_clean):
            matched_skills.append(req_original)
        else:
            missing_soft_skills.append(req_original)
            
    match_percentage = 0.0
    if total_required_count > 0:
        match_percentage = round((len(matched_skills) / total_required_count) * 100, 1)
        
    return {
        "match_percentage": match_percentage,
        "matched_skills": sorted(matched_skills, key=lambda x: x.lower()),
        "missing_tech_skills": sorted(missing_tech_skills, key=lambda x: x.lower()),
        "missing_soft_skills": sorted(missing_soft_skills, key=lambda x: x.lower()),
        "total_required_count": total_required_count
    }
