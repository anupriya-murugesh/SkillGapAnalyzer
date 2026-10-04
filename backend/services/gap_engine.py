import re

# Canonical Skill Dictionary
SKILL_ALIASES = {
    'hypertext markup language': 'html',
    'js': 'javascript',
    'ts': 'typescript',
    'postgres': 'postgresql',
    'reactjs': 'react',
    'node': 'nodejs',
    'node.js': 'nodejs',
    'vuejs': 'vue',
    'cascading style sheets': 'css'
}

def normalize_skill(skill_name: str) -> str:
    """Normalize skill names to lowercase and handle known aliases/synonyms."""
    s = skill_name.strip().lower()
    return SKILL_ALIASES.get(s, s)

def is_skill_match(req_skill: str, user_skills_normalized: list[str]) -> bool:
    """Check if the required skill is present or a substring in any user skill."""
    req_norm = normalize_skill(req_skill)
    
    for u_skill in user_skills_normalized:
        if req_norm == u_skill or req_norm in u_skill or u_skill in req_norm:
            return True
    return False

def calculate_skill_gap(user_skills: list[str], required_tech: list[str], required_soft: list[str]) -> dict:
    user_skills_normalized = [normalize_skill(s) for s in user_skills]
    
    # Ensure unique required skills
    req_tech_unique = list(set(required_tech))
    req_soft_unique = list(set(required_soft))
    
    total_required_count = len(req_tech_unique) + len(req_soft_unique)
    
    matched_skills = []
    missing_tech_skills = []
    missing_soft_skills = []
    
    for req_original in req_tech_unique:
        if is_skill_match(req_original, user_skills_normalized):
            matched_skills.append(req_original)
        else:
            missing_tech_skills.append(req_original)
            
    for req_original in req_soft_unique:
        if is_skill_match(req_original, user_skills_normalized):
            matched_skills.append(req_original)
        else:
            missing_soft_skills.append(req_original)
            
    match_percentage = 0.0
    if total_required_count > 0:
        match_percentage = round((len(matched_skills) / total_required_count) * 100, 1)
        
    return {
        "match_percentage": match_percentage,
        "matched_skills": matched_skills,
        "missing_tech_skills": missing_tech_skills,
        "missing_soft_skills": missing_soft_skills,
        "total_required_count": total_required_count
    }
