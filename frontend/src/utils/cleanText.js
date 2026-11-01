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

export const TAXONOMY_SKILLS = [
  // Programming Languages
  "Python", "JavaScript", "TypeScript", "Java", "C++", "C#", "C", "Go", "Golang", 
  "Rust", "PHP", "Ruby", "Swift", "Kotlin", "R", "Scala", "Dart", "Perl", 
  "Haskell", "Elixir", "Lua", "Julia", "SQL", "HTML", "HTML5", "CSS", "CSS3", 
  "Bash", "Shell", "PowerShell",

  // Frontend Frameworks & Libraries
  "React", "React.js", "Next.js", "Vue", "Vue.js", "Nuxt.js", "Angular", "AngularJS", 
  "Svelte", "SvelteKit", "Redux", "Redux Toolkit", "Zustand", "MobX", "Tailwind CSS", 
  "Bootstrap", "Material UI", "Chakra UI", "SASS", "SCSS", "Less", "Webpack", 
  "Vite", "Babel", "jQuery", "Three.js", "D3.js", "Chart.js",

  // Backend Frameworks & APIs
  "Node.js", "Express.js", "Express", "FastAPI", "Django", "Flask", "Spring", 
  "Spring Boot", "ASP.NET", ".NET", ".NET Core", "Ruby on Rails", "Laravel", 
  "Symfony", "NestJS", "Fastify", "Koa", "GraphQL", "REST API", "RESTful APIs", 
  "gRPC", "WebSockets", "Microservices", "Celery", "Socket.io",

  // Databases & Caching
  "PostgreSQL", "MySQL", "MongoDB", "Redis", "SQLite", "Oracle", "Microsoft SQL Server", 
  "Cassandra", "Elasticsearch", "DynamoDB", "Firebase", "Supabase", "MariaDB", 
  "CouchDB", "Neo4j", "Memcached", "Prisma", "SQLAlchemy", "Mongoose", "Hibernate",

  // Cloud & DevOps
  "AWS", "Amazon Web Services", "Azure", "Microsoft Azure", "Google Cloud", 
  "Google Cloud Platform", "GCP", "Docker", "Kubernetes", "K8s", "Terraform", 
  "Ansible", "Jenkins", "CI/CD", "GitHub Actions", "GitLab CI", "CircleCI", 
  "Linux", "Ubuntu", "Debian", "CentOS", "RedHat", "Unix", "Nginx", "Apache", 
  "Serverless", "Prometheus", "Grafana", "Cloudflare", "OpenShift", "Helm",

  // AI, ML, Data Science & Big Data
  "Machine Learning", "Deep Learning", "Artificial Intelligence", "NLP", 
  "Natural Language Processing", "Computer Vision", "LLMs", "Generative AI", 
  "Prompt Engineering", "PyTorch", "TensorFlow", "Keras", "Scikit-Learn", 
  "Pandas", "NumPy", "SciPy", "OpenCV", "Hugging Face", "LangChain", "LlamaIndex", 
  "RAG", "Data Analysis", "Data Engineering", "Data Science", "ETL", "Apache Spark", 
  "PySpark", "Hadoop", "Apache Kafka", "Kafka", "RabbitMQ", "Power BI", "Tableau", 
  "Matplotlib", "Seaborn", "Jupyter", "Databricks", "Snowflake", "BigQuery",

  // Mobile & Desktop Development
  "React Native", "Flutter", "Android", "iOS", "SwiftUI", "Expo", "Ionic", 
  "Electron", "Capacitor",

  // Testing & Quality Assurance
  "Git", "GitHub", "GitLab", "Bitbucket", "Postman", "Swagger", "OpenAPI", 
  "Jest", "Mocha", "Chai", "PyTest", "Selenium", "Cypress", "Playwright", 
  "JUnit", "Unit Testing", "Integration Testing", "End-to-End Testing", 
  "TDD", "BDD", "Jira", "Confluence", "Figma",

  // Software Engineering & Architecture
  "Data Structures", "Algorithms", "Object-Oriented Programming", "OOP", 
  "System Design", "Distributed Systems", "Design Patterns", "Clean Code", 
  "Refactoring", "Microservices Architecture", "Agile", "Scrum", "Kanban",

  // Professional & Soft Skills
  "Problem Solving", "Critical Thinking", "Communication", "Team Collaboration", 
  "Leadership", "Time Management", "Adaptability", "Mentoring", "Analytical Skills", 
  "Stakeholder Management", "Project Management", "Attention to Detail"
];

export const CANONICAL_NAME_MAP = {
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
};

function canonicalizeSkill(name) {
  const cleaned = name.trim();
  const key = cleaned.toLowerCase();
  return CANONICAL_NAME_MAP[key] || cleaned;
}

export function extractAllResumeSkills(text) {
  if (!text || typeof text !== 'string') return [];

  const foundSet = new Set();
  const foundNormalized = new Set();

  for (const skill of TAXONOMY_SKILLS) {
    const escaped = skill.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    let pattern;
    if (["c", "r", "go"].includes(skill.toLowerCase())) {
      pattern = new RegExp(`(?<![A-Za-z0-9])${escaped}(?![A-Za-z0-9])`, 'i');
    } else if (/[+#./\-]/.test(skill)) {
      pattern = new RegExp(`(?:^|[\\s,;/()\\[\\]])${escaped}(?:$|[\\s,;/()\\[\\]])`, 'i');
    } else {
      pattern = new RegExp(`\\b${escaped}\\b`, 'i');
    }

    if (pattern.test(text)) {
      const canonical = canonicalizeSkill(skill);
      const cLower = canonical.toLowerCase();
      if (!foundNormalized.has(cLower)) {
        foundNormalized.add(cLower);
        foundSet.add(canonical);
      }
    }
  }

  return Array.from(foundSet).sort((a, b) => a.localeCompare(b));
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
