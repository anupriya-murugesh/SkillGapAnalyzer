import { supabase } from '../lib/supabaseClient';
import { getEmployerJobs, updateEmployerJob, deleteEmployerJob } from './employerService';
import { ADMIN_EMAILS } from '../lib/auth';

const ADMIN_USERS_STORAGE_KEY = 'bridgeiq_admin_users';
const ADMIN_QUESTIONS_STORAGE_KEY = 'bridgeiq_admin_custom_questions';
const ADMIN_AUDIT_LOGS_STORAGE_KEY = 'bridgeiq_admin_audit_logs';

// Default initial platform users
const INITIAL_USERS = [
  {
    id: 'admin-1',
    full_name: 'Aadhi Lakshmanan',
    email: 'aadhilakshmanan07@gmail.com',
    role: 'admin',
    is_master_admin: true,
    status: 'Active',
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    institution: 'Bridge-IQ Core Team',
    verified_badges: ['System Architect', 'Lead Admin'],
    target_role: 'Platform Administrator'
  },
  {
    id: 'admin-2',
    full_name: 'Anu Karthika',
    email: 'anukarthika02@gmail.com',
    role: 'admin',
    is_master_admin: true,
    status: 'Active',
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    institution: 'Bridge-IQ Core Team',
    verified_badges: ['Lead Evaluator', 'Lead Admin'],
    target_role: 'Platform Administrator'
  },
  {
    id: 'user-cand-101',
    full_name: 'Elena Rostova',
    email: 'elena.rostova@engineer.dev',
    role: 'candidate',
    status: 'Verified',
    created_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    institution: 'PSG College of Technology',
    verified_badges: ['React (Verified)', 'TypeScript (Verified)'],
    target_role: 'Senior Full-Stack Engineer',
    cgpa: '9.4',
    assessments_completed: 4,
    avg_score: 92
  },
  {
    id: 'user-cand-102',
    full_name: 'Marcus Vance',
    email: 'marcus.v@ai-cloud.io',
    role: 'candidate',
    status: 'Verified',
    created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    institution: 'Indian Institute of Technology, Madras',
    verified_badges: ['Python (Verified)', 'Docker (Verified)'],
    target_role: 'AI / Machine Learning Engineer',
    cgpa: '8.9',
    assessments_completed: 3,
    avg_score: 88
  },
  {
    id: 'user-cand-103',
    full_name: 'Sophia Patel',
    email: 'spatel@cloudscale.tech',
    role: 'candidate',
    status: 'Verified',
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    institution: 'BITS Pilani',
    verified_badges: ['AWS (Verified)', 'Terraform (Verified)'],
    target_role: 'Cloud DevOps Architect',
    cgpa: '9.1',
    assessments_completed: 5,
    avg_score: 94
  },
  {
    id: 'user-cand-104',
    full_name: 'Arjun Mehta',
    email: 'arjun.mehta@polytech.edu',
    role: 'candidate',
    status: 'Active',
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    institution: 'Vellore Institute of Technology',
    verified_badges: ['JavaScript (Verified)'],
    target_role: 'Full-Stack Developer',
    cgpa: '8.6',
    assessments_completed: 2,
    avg_score: 84
  },
  {
    id: 'user-emp-201',
    full_name: 'Sarah Jenkins',
    email: 'recruiter@techcorp.io',
    role: 'employer',
    status: 'Verified',
    created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    company_name: 'TechCorp Global Systems',
    active_jobs_posted: 3,
    invitations_sent: 14
  },
  {
    id: 'user-emp-202',
    full_name: 'Vikram Seth',
    email: 'careers@nexus-ai.org',
    role: 'employer',
    status: 'Verified',
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    company_name: 'Nexus AI Labs',
    active_jobs_posted: 2,
    invitations_sent: 8
  }
];

// Default initial question bank custom entries
const INITIAL_CUSTOM_QUESTIONS = [
  {
    id: 'cust-mcq-1',
    type: 'mcq',
    skill: 'Python',
    difficulty: 'Hard',
    category: 'Memory & Concurrency',
    question: 'How does Python handle cyclic memory references during garbage collection?',
    code_snippet: 'import gc\n# Generational garbage collector inspection\nprint(gc.get_threshold())',
    options: [
      'Through a tri-color generational cycle-detecting garbage collector',
      'Cyclic references always trigger immediate MemoryError in CPython',
      'Reference counting handles cycles automatically without collector sweeps',
      'CPython relies strictly on the OS kernel page reclaimer'
    ],
    correct_answer: 'Through a tri-color generational cycle-detecting garbage collector',
    explanation: 'While standard reference counting handles most lifecycles, circular graphs are cleared periodically by the generational garbage collector utilizing linked-list traversal.'
  },
  {
    id: 'cust-mcq-2',
    type: 'mcq',
    skill: 'React',
    difficulty: 'Hard',
    category: 'React 19 Internals',
    question: 'What is the primary architectural improvement of React 19 Server Actions compared to traditional client fetching?',
    code_snippet: '// Server Action definition\nasync function updateProfile(formData) {\n  "use server";\n  await db.save(formData);\n}',
    options: [
      'They eliminate client bundle overhead and execute secure server-side mutation logic natively with progressive enhancement',
      'They convert all React components into Web Workers running in parallel',
      'They force synchronous browser blocking during data submission',
      'They bypass HTTP networks entirely via local peer-to-peer protocols'
    ],
    correct_answer: 'They eliminate client bundle overhead and execute secure server-side mutation logic natively with progressive enhancement',
    explanation: 'Server Actions allow direct form submissions and RPC calls handled securely on the server with zero client JavaScript required for the action logic.'
  }
];

// Default initial submission audit logs
const INITIAL_AUDIT_LOGS = [
  {
    id: 'audit-001',
    candidate_name: 'Elena Rostova',
    candidate_email: 'elena.rostova@engineer.dev',
    skill: 'React',
    stage: 'Stage 2 (Coding)',
    challenge_title: 'Profile Card Component Styling & Flexbox',
    score: 100,
    passed_tests: 6,
    total_tests: 6,
    execution_time_ms: 12,
    submitted_code: `// Verified Submission by Elena Rostova\nimport React from 'react';\n\nexport default function ProfileCard({ user }) {\n  return (\n    <div className="profile-card" style={{ display: 'flex', borderRadius: '12px', padding: '24px' }}>\n      <h2>{user.name}</h2>\n      <p>{user.title}</p>\n    </div>\n  );\n}`,
    proctor_status: 'Clean (No anomalies detected)',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'audit-002',
    candidate_name: 'Marcus Vance',
    candidate_email: 'marcus.v@ai-cloud.io',
    skill: 'Python',
    stage: 'Stage 2 (Coding)',
    challenge_title: 'Maximum Subsegment Sum (Kadane Algorithm)',
    score: 100,
    passed_tests: 6,
    total_tests: 6,
    execution_time_ms: 18,
    submitted_code: `def max_subsegment_sum(nums):\n    if not nums:\n        return 0\n    max_current = max_global = nums[0]\n    for x in nums[1:]:\n        max_current = max(x, max_current + x)\n        if max_current > max_global:\n            max_global = max_current\n    return max_global`,
    proctor_status: 'Clean',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'audit-003',
    candidate_name: 'Sophia Patel',
    candidate_email: 'spatel@cloudscale.tech',
    skill: 'Python',
    stage: 'Stage 1 (MCQ Diagnostic)',
    challenge_title: '20-Question Core Concurrency Assessment',
    score: 95,
    passed_tests: 19,
    total_tests: 20,
    execution_time_ms: 0,
    submitted_code: 'MCQ Assessment — 19 of 20 correct answers recorded.',
    proctor_status: 'Clean',
    timestamp: new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'audit-004',
    candidate_name: 'Arjun Mehta',
    candidate_email: 'arjun.mehta@polytech.edu',
    skill: 'JavaScript',
    stage: 'Stage 2 (Coding)',
    challenge_title: 'Balanced Parentheses Parser',
    score: 83,
    passed_tests: 5,
    total_tests: 6,
    execution_time_ms: 24,
    submitted_code: `function isValid(s) {\n  const stack = [];\n  const pairs = { ')': '(', '}': '{', ']': '[' };\n  for (let c of s) {\n    if (c === '(' || c === '{' || c === '[') stack.push(c);\n    else if (stack.pop() !== pairs[c]) return false;\n  }\n  return stack.length === 0;\n}`,
    proctor_status: 'Flagged (1 window blur detected during stage)',
    timestamp: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString()
  }
];

// ============================================================================
// 1. PLATFORM METRICS & KPI ENGINE
// ============================================================================

export const getAdminMetrics = async () => {
  const users = await getAdminUsers();
  const jobs = await getEmployerJobs();
  const auditLogs = await getAdminAuditLogs();

  const candidatesCount = users.filter(u => u.role === 'candidate').length;
  const employersCount = users.filter(u => u.role === 'employer').length;
  const adminsCount = users.filter(u => u.role === 'admin').length;
  const activeJobsCount = jobs.filter(j => (j.status || 'Active').toLowerCase() === 'active').length;
  
  const totalTests = auditLogs.length + 32; // Include simulated historical runs
  const avgScore = Math.round(auditLogs.reduce((acc, curr) => acc + (curr.score || 0), 0) / Math.max(1, auditLogs.length));

  return {
    total_users: users.length,
    candidates_count: candidatesCount,
    employers_count: employersCount,
    admins_count: adminsCount,
    active_jobs: activeJobsCount,
    total_assessments_taken: totalTests,
    avg_pass_rate: `${avgScore}%`,
    verified_talent_count: users.filter(u => u.status === 'Verified' || (u.verified_badges && u.verified_badges.length > 0)).length,
    system_health: {
      gemini_ai: 'Operational (gemini-3.8-flash)',
      supabase_db: 'Connected',
      rapidapi_jsearch: 'Active Quota'
    }
  };
};

// ============================================================================
// 2. USER DIRECTORY & ROLE MANAGEMENT
// ============================================================================

export const getAdminUsers = async () => {
  // Try remote Supabase profiles first
  let remoteUsers = [];
  try {
    const { data, error } = await supabase.from('profiles').select('*');
    if (!error && Array.isArray(data) && data.length > 0) {
      remoteUsers = data;
    }
  } catch (err) {
    console.warn('[adminService] Supabase profiles fetch notice:', err);
  }

  // Load local store
  const localRaw = localStorage.getItem(ADMIN_USERS_STORAGE_KEY);
  let localUsers = [];
  try {
    localUsers = localRaw ? JSON.parse(localRaw) : [];
  } catch {
    localUsers = [];
  }

  // Ensure default master admins are always present and correctly elevated
  let merged = [...INITIAL_USERS];

  if (localUsers.length > 0) {
    localUsers.forEach(u => {
      const idx = merged.findIndex(m => m.id === u.id || m.email?.toLowerCase() === u.email?.toLowerCase());
      if (idx !== -1) merged[idx] = { ...merged[idx], ...u };
      else merged.push(u);
    });
  }

  if (remoteUsers.length > 0) {
    remoteUsers.forEach(r => {
      const idx = merged.findIndex(m => m.id === r.id || m.email?.toLowerCase() === r.email?.toLowerCase());
      if (idx !== -1) merged[idx] = { ...merged[idx], ...r };
      else merged.push(r);
    });
  }

  // Guarantee designated emails always have admin role
  merged = merged.map(u => {
    if (ADMIN_EMAILS.some(e => e.toLowerCase() === u.email?.toLowerCase())) {
      return { ...u, role: 'admin', is_master_admin: true, status: 'Active' };
    }
    return u;
  });

  try {
    localStorage.setItem(ADMIN_USERS_STORAGE_KEY, JSON.stringify(merged));
  } catch {}

  return merged;
};

export const updateUserRole = async (userId, newRole) => {
  const users = await getAdminUsers();
  const updated = users.map(u => {
    if (u.id === userId) {
      return { ...u, role: newRole, updated_at: new Date().toISOString() };
    }
    return u;
  });

  try {
    localStorage.setItem(ADMIN_USERS_STORAGE_KEY, JSON.stringify(updated));
  } catch {}

  // Attempt Supabase sync
  try {
    await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
  } catch {}

  return updated;
};

export const toggleUserVerification = async (userId) => {
  const users = await getAdminUsers();
  const updated = users.map(u => {
    if (u.id === userId) {
      const nextStatus = u.status === 'Verified' ? 'Active' : 'Verified';
      return { ...u, status: nextStatus, updated_at: new Date().toISOString() };
    }
    return u;
  });

  try {
    localStorage.setItem(ADMIN_USERS_STORAGE_KEY, JSON.stringify(updated));
  } catch {}

  return updated;
};

// ============================================================================
// 3. JOB MODERATION
// ============================================================================

export const moderateJob = async (jobId, newStatus) => {
  // Update job status in employerService
  return await updateEmployerJob(jobId, { status: newStatus, moderated_at: new Date().toISOString() });
};

// ============================================================================
// 4. QUESTION & CHALLENGE BANK MANAGEMENT
// ============================================================================

export const getAdminCustomQuestions = async () => {
  try {
    const raw = localStorage.getItem(ADMIN_QUESTIONS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : INITIAL_CUSTOM_QUESTIONS;
  } catch {
    return INITIAL_CUSTOM_QUESTIONS;
  }
};

export const addCustomQuestion = async (questionData) => {
  const questions = await getAdminCustomQuestions();
  const newQ = {
    ...questionData,
    id: `cust-${Date.now()}`,
    created_at: new Date().toISOString()
  };
  const updated = [newQ, ...questions];

  try {
    localStorage.setItem(ADMIN_QUESTIONS_STORAGE_KEY, JSON.stringify(updated));
  } catch {}

  return newQ;
};

// ============================================================================
// 5. SUBMISSION & PROCTORING AUDIT LOGS
// ============================================================================

export const getAdminAuditLogs = async () => {
  try {
    const raw = localStorage.getItem(ADMIN_AUDIT_LOGS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : INITIAL_AUDIT_LOGS;
  } catch {
    return INITIAL_AUDIT_LOGS;
  }
};

export const recordAuditSubmission = async (auditEntry) => {
  const logs = await getAdminAuditLogs();
  const newLog = {
    ...auditEntry,
    id: `audit-${Date.now()}`,
    timestamp: new Date().toISOString()
  };
  const updated = [newLog, ...logs];

  try {
    localStorage.setItem(ADMIN_AUDIT_LOGS_STORAGE_KEY, JSON.stringify(updated.slice(0, 100)));
  } catch {}

  return newLog;
};
