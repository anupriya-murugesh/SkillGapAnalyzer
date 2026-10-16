export function cleanHtmlText(rawText) {
  if (!rawText || typeof rawText !== "string") return "";

  try {
    // 1. Unescape HTML entities (&lt;p&gt; -> <p>)
    const parser = new DOMParser();
    const doc = parser.parseFromString(rawText, "text/html");
    let text = doc.body.textContent || "";

    // 2. Unescape double-encoded text
    if (text.includes("&lt;") || text.includes("&gt;")) {
      const doc2 = parser.parseFromString(text, "text/html");
      text = doc2.body.textContent || "";
    }

    // 3. Strip HTML tags and standalone tag words (br, p, li, div, ul)
    return text
      .replace(/<[^>]*>/g, " ")
      .replace(/\b(br|p|div|li|ul|ol|span|strong|em|h1|h2|h3|a)\b/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
  } catch (e) {
    return rawText.replace(/<[^>]*>?/gm, " ").replace(/\s+/g, " ").trim();
  }
}

export function truncateText(text, maxLength = 180) {
  const cleaned = cleanHtmlText(text);
  if (!cleaned) return "No description available.";
  if (cleaned.length <= maxLength) return cleaned;
  return cleaned.slice(0, maxLength).trim() + "...";
}

export function extractKeySkills(text, existingTags = []) {
  const commonSkills = [
    "React", "Next.js", "Vue", "Angular", "Node.js", "Express", "Python", "Django", "FastAPI",
    "Java", "Spring", "C#", ".NET", "C++", "Go", "Rust", "TypeScript", "JavaScript",
    "TailwindCSS", "AWS", "Azure", "GCP", "Docker", "Kubernetes", "SQL", "PostgreSQL",
    "MySQL", "MongoDB", "Redis", "GraphQL", "REST APIs", "Git", "CI/CD", "Terraform",
    "Linux", "Kafka", "Machine Learning", "AI", "Microservices"
  ];
  
  const found = new Set();
  
  if (Array.isArray(existingTags)) {
    existingTags.forEach(t => {
      if (t && typeof t === 'string' && t.trim()) {
        found.add(t.trim());
      }
    });
  }

  if (text) {
    commonSkills.forEach(skill => {
      const escaped = skill.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
      if (new RegExp(`\\b${escaped}\\b`, 'i').test(text)) {
        found.add(skill);
      }
    });
  }

  const result = Array.from(found);
  return result.length > 0 ? result.slice(0, 7) : ["Software Engineering"];
}

export function formatSalary(min, max, currency = 'USD', period = 'YEAR') {
  if (!min && !max) return null;

  const symbolMap = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    INR: '₹',
    CAD: 'CA$',
    AUD: 'AU$'
  };
  const sym = symbolMap[currency?.toUpperCase()] || `${currency} `;

  const formatNum = (val) => {
    if (!val || isNaN(val)) return '';
    const num = Number(val);
    if (num >= 1000000) return `${(num / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
    if (num >= 1000) return `${Math.round(num / 1000)}k`;
    return num.toLocaleString();
  };

  const periodLabel = period?.toUpperCase() === 'HOUR' ? '/hr' : period?.toUpperCase() === 'MONTH' ? '/mo' : '/yr';

  if (min && max && min !== max) {
    return `${sym}${formatNum(min)} - ${sym}${formatNum(max)} ${periodLabel}`;
  }
  return `${sym}${formatNum(min || max)} ${periodLabel}`;
}

export function getRelativeTime(timestamp) {
  if (!timestamp) return 'Recent';
  try {
    let date;
    if (typeof timestamp === 'number') {
      // If seconds instead of milliseconds
      date = timestamp < 10000000000 ? new Date(timestamp * 1000) : new Date(timestamp);
    } else {
      date = new Date(timestamp);
    }

    if (isNaN(date.getTime())) return 'Recent';

    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return `${Math.floor(diffDays / 30)}mo ago`;
  } catch {
    return 'Recent';
  }
}

export function determineExperienceLevel(job) {
  const text = `${job.title || ''} ${job.description || ''}`.toLowerCase();
  const months = job.experience_months;

  if (typeof months === 'number') {
    if (months <= 24) return 'Entry-Level';
    if (months > 60) return 'Senior / Lead';
    return 'Mid-Level';
  }

  if (/\b(junior|jr|entry|intern|internship|graduate|trainee|associate)\b/i.test(job.title || '')) {
    return 'Entry-Level';
  }
  if (/\b(director|vp|vice president|chief|cto|head of|executive)\b/i.test(job.title || '')) {
    return 'Executive / Lead';
  }
  if (/\b(senior|sr|lead|principal|staff|architect)\b/i.test(job.title || '')) {
    return 'Senior / Lead';
  }
  if (/\b(junior|entry-level|graduate)\b/i.test(text.slice(0, 300))) {
    return 'Entry-Level';
  }
  return 'Mid-Level';
}

export function determineWorkplaceType(job) {
  if (job.is_remote === true) return 'Remote';
  const loc = (job.location || '').toLowerCase();
  const title = (job.title || '').toLowerCase();
  if (loc.includes('remote') || title.includes('remote') || loc.includes('anywhere')) {
    return 'Remote';
  }
  if (loc.includes('hybrid') || title.includes('hybrid')) {
    return 'Hybrid';
  }
  return 'On-Site';
}
