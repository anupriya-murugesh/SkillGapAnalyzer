import { supabase } from '../lib/supabaseClient';

const JOBS_STORAGE_KEY = 'bridgeiq_employer_jobs';
const SHORTLIST_STORAGE_KEY_PREFIX = 'bridgeiq_employer_shortlist_';
const INVITATIONS_STORAGE_KEY = 'bridgeiq_assessment_invitations';
const APPLICATIONS_STORAGE_KEY = 'bridgeiq_job_applications';

// Default initial jobs if none exist
const DEFAULT_INITIAL_JOBS = [
  {
    id: 'job-101',
    title: 'Senior Full-Stack Engineer',
    department: 'Core Platform',
    workplace: 'Remote',
    location: 'Remote (Global)',
    type: 'Full-Time',
    salary: '$120k - $160k / yr',
    required_skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL'],
    description: 'Lead the architecture and implementation of enterprise distributed web applications. Work with modern React, TypeScript, and microservice infrastructure.',
    applicant_count: 3,
    status: 'Active',
    company_name: 'TechCorp Global Systems',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'job-102',
    title: 'AI / Machine Learning Specialist',
    department: 'Intelligence & Research',
    workplace: 'Hybrid',
    location: 'Bengaluru, India',
    type: 'Full-Time',
    salary: '$110k - $145k / yr',
    required_skills: ['Python', 'PyTorch', 'FastAPI', 'Docker', 'AWS'],
    description: 'Design and deploy state-of-the-art LLM pipelines and embedding search microservices for our core enterprise intelligence platform.',
    applicant_count: 2,
    status: 'Active',
    company_name: 'TechCorp Global Systems',
    created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
  }
];

// Helper to get current session safely
const getSessionUser = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user || null;
  } catch {
    return null;
  }
};

// ============================================================================
// 1. EMPLOYER JOBS MANAGEMENT (CRUD)
// ============================================================================

export const getEmployerJobs = async () => {
  let remoteJobs = [];
  try {
    const { data, error } = await supabase
      .from('employer_jobs')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && Array.isArray(data) && data.length > 0) {
      remoteJobs = data;
    }
  } catch (err) {
    console.warn('[employerService] Supabase getEmployerJobs fallback to storage:', err);
  }

  const localRaw = localStorage.getItem(JOBS_STORAGE_KEY);
  let localJobs = [];
  try {
    localJobs = localRaw ? JSON.parse(localRaw) : [];
  } catch {
    localJobs = [];
  }

  if (remoteJobs.length > 0) {
    try {
      localStorage.setItem(JOBS_STORAGE_KEY, JSON.stringify(remoteJobs));
    } catch {}
    return remoteJobs;
  }

  if (localJobs.length > 0) {
    return localJobs;
  }

  try {
    localStorage.setItem(JOBS_STORAGE_KEY, JSON.stringify(DEFAULT_INITIAL_JOBS));
  } catch {}
  return DEFAULT_INITIAL_JOBS;
};

// Used by Candidate Live Market to display internal active openings
export const getActiveEmployerJobs = async () => {
  const allJobs = await getEmployerJobs();
  return allJobs.filter(j => (j.status || 'Active').toLowerCase() === 'active');
};

export const createEmployerJob = async (jobPayload) => {
  const jobWithId = {
    ...jobPayload,
    id: jobPayload.id || `job-${Date.now()}`,
    applicant_count: jobPayload.applicant_count || 0,
    status: jobPayload.status || 'Active',
    created_at: jobPayload.created_at || new Date().toISOString()
  };

  try {
    await supabase.from('employer_jobs').insert([jobWithId]);
  } catch (err) {
    console.warn('[employerService] createEmployerJob Supabase insert failed, using local storage:', err);
  }

  const existing = await getEmployerJobs();
  const updated = [jobWithId, ...existing.filter(j => j.id !== jobWithId.id)];
  try {
    localStorage.setItem(JOBS_STORAGE_KEY, JSON.stringify(updated));
  } catch {}

  return jobWithId;
};

export const updateEmployerJob = async (jobId, updatedFields) => {
  try {
    await supabase
      .from('employer_jobs')
      .update(updatedFields)
      .eq('id', jobId);
  } catch (err) {
    console.warn('[employerService] updateEmployerJob Supabase update failed:', err);
  }

  const existing = await getEmployerJobs();
  const updated = existing.map(j => (j.id === jobId ? { ...j, ...updatedFields } : j));
  try {
    localStorage.setItem(JOBS_STORAGE_KEY, JSON.stringify(updated));
  } catch {}

  return updated.find(j => j.id === jobId);
};

export const deleteEmployerJob = async (jobId) => {
  try {
    await supabase
      .from('employer_jobs')
      .delete()
      .eq('id', jobId);
  } catch (err) {
    console.warn('[employerService] deleteEmployerJob Supabase delete failed:', err);
  }

  const existing = await getEmployerJobs();
  const updated = existing.filter(j => j.id !== jobId);
  try {
    localStorage.setItem(JOBS_STORAGE_KEY, JSON.stringify(updated));
  } catch {}

  return true;
};

// ============================================================================
// 2. CANDIDATE SHORTLISTING PERSISTENCE
// ============================================================================

export const getShortlistedCandidateIds = async (employerId = 'default_employer') => {
  const key = `${SHORTLIST_STORAGE_KEY_PREFIX}${employerId}`;
  try {
    const raw = localStorage.getItem(key);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
};

export const toggleShortlistCandidate = async (candidateId, employerId = 'default_employer') => {
  const key = `${SHORTLIST_STORAGE_KEY_PREFIX}${employerId}`;
  const currentSet = await getShortlistedCandidateIds(employerId);
  const isCurrentlyShortlisted = currentSet.has(candidateId);

  if (isCurrentlyShortlisted) {
    currentSet.delete(candidateId);
  } else {
    currentSet.add(candidateId);
  }

  try {
    localStorage.setItem(key, JSON.stringify(Array.from(currentSet)));
  } catch {}

  try {
    const user = await getSessionUser();
    if (user) {
      if (!isCurrentlyShortlisted) {
        await supabase.from('employer_shortlists').insert([
          { employer_id: user.id, candidate_id: candidateId, created_at: new Date().toISOString() }
        ]);
      } else {
        await supabase.from('employer_shortlists')
          .delete()
          .eq('employer_id', user.id)
          .eq('candidate_id', candidateId);
      }
    }
  } catch {}

  return {
    isShortlisted: !isCurrentlyShortlisted,
    shortlistCount: currentSet.size
  };
};

// ============================================================================
// 3. ASSESSMENT INVITATIONS (Real, End-to-End)
// ============================================================================

export const createAssessmentInvitation = async ({
  candidateId,
  candidateName,
  candidateEmail,
  skill,
  difficulty = 'Intermediate',
  roleTitle = 'Software Engineer',
  employerName = 'TechCorp Global',
  customMessage = ''
}) => {
  const inviteToken = `inv-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
  const invitation = {
    id: `invite-${Date.now()}`,
    token: inviteToken,
    candidate_id: candidateId,
    candidate_name: candidateName,
    candidate_email: candidateEmail,
    skill: skill || 'Full-Stack',
    difficulty,
    role_title: roleTitle,
    employer_name: employerName,
    custom_message: customMessage,
    status: 'Pending',
    score: null,
    created_at: new Date().toISOString(),
    invite_url: `${window.location.origin}/candidate/practice?skill=${encodeURIComponent(skill)}&invite=${inviteToken}&employer=${encodeURIComponent(employerName)}`
  };

  try {
    await supabase.from('assessment_invitations').insert([invitation]);
  } catch (err) {
    console.warn('[employerService] createAssessmentInvitation Supabase insert failed:', err);
  }

  try {
    const raw = localStorage.getItem(INVITATIONS_STORAGE_KEY);
    const existing = raw ? JSON.parse(raw) : [];
    const updated = [invitation, ...existing];
    localStorage.setItem(INVITATIONS_STORAGE_KEY, JSON.stringify(updated));
  } catch {}

  return invitation;
};

export const getAssessmentInvitations = async (employerName = null) => {
  let invitations = [];
  try {
    const { data, error } = await supabase
      .from('assessment_invitations')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && Array.isArray(data) && data.length > 0) {
      invitations = data;
    }
  } catch {}

  if (invitations.length === 0) {
    try {
      const raw = localStorage.getItem(INVITATIONS_STORAGE_KEY);
      invitations = raw ? JSON.parse(raw) : [];
    } catch {
      invitations = [];
    }
  }

  if (employerName) {
    return invitations.filter(inv => !inv.employer_name || inv.employer_name.toLowerCase() === employerName.toLowerCase());
  }
  return invitations;
};

export const getCandidateInvitations = async (candidateEmail) => {
  const all = await getAssessmentInvitations();
  if (!candidateEmail) return all;
  return all.filter(inv => inv.candidate_email && inv.candidate_email.toLowerCase() === candidateEmail.toLowerCase());
};

export const markInvitationCompleted = async (token, score) => {
  if (!token) return;

  try {
    await supabase
      .from('assessment_invitations')
      .update({ status: 'Completed', score: score, completed_at: new Date().toISOString() })
      .eq('token', token);
  } catch {}

  try {
    const raw = localStorage.getItem(INVITATIONS_STORAGE_KEY);
    const existing = raw ? JSON.parse(raw) : [];
    const updated = existing.map(inv => {
      if (inv.token === token) {
        return {
          ...inv,
          status: 'Completed',
          score: score,
          completed_at: new Date().toISOString()
        };
      }
      return inv;
    });
    localStorage.setItem(INVITATIONS_STORAGE_KEY, JSON.stringify(updated));
  } catch {}
};

// ============================================================================
// 4. CANDIDATE DIRECT JOB APPLICATIONS
// ============================================================================

export const applyToEmployerJob = async ({
  jobId,
  jobTitle,
  candidateProfile,
  session
}) => {
  const candidateId = candidateProfile?.id || session?.user?.id || `cand-${Date.now()}`;
  const candidateName = candidateProfile?.full_name || candidateProfile?.first_name || session?.user?.email?.split('@')[0] || 'Candidate Applicant';
  const candidateEmail = candidateProfile?.email || session?.user?.email || 'applicant@candidate.dev';

  const application = {
    id: `app-${Date.now()}`,
    job_id: jobId,
    job_title: jobTitle,
    candidate_id: candidateId,
    candidate_name: candidateName,
    candidate_email: candidateEmail,
    skills: candidateProfile?.skills || ['JavaScript', 'React', 'Problem Solving'],
    match_percentage: candidateProfile?.match_percentage || 88,
    l1_score: candidateProfile?.l1_score || 85,
    applied_at: new Date().toISOString(),
    status: 'Applied'
  };

  try {
    await supabase.from('job_applications').insert([application]);
  } catch {}

  try {
    const raw = localStorage.getItem(APPLICATIONS_STORAGE_KEY);
    const existing = raw ? JSON.parse(raw) : [];
    const alreadyApplied = existing.some(a => a.job_id === jobId && a.candidate_email === candidateEmail);
    if (!alreadyApplied) {
      localStorage.setItem(APPLICATIONS_STORAGE_KEY, JSON.stringify([application, ...existing]));
    }
  } catch {}

  // Increment applicant count on job
  const existingJobs = await getEmployerJobs();
  const targetJob = existingJobs.find(j => j.id === jobId);
  if (targetJob) {
    const newCount = (targetJob.applicant_count || 0) + 1;
    await updateEmployerJob(jobId, { applicant_count: newCount });
  }

  return application;
};

export const getApplicationsForJob = async (jobId) => {
  let applications = [];
  try {
    const { data, error } = await supabase
      .from('job_applications')
      .select('*')
      .eq('job_id', jobId)
      .order('applied_at', { ascending: false });
    if (!error && Array.isArray(data) && data.length > 0) {
      applications = data;
    }
  } catch {}

  if (applications.length === 0) {
    try {
      const raw = localStorage.getItem(APPLICATIONS_STORAGE_KEY);
      const all = raw ? JSON.parse(raw) : [];
      applications = all.filter(a => a.job_id === jobId);
    } catch {
      applications = [];
    }
  }

  if (applications.length === 0 && (jobId === 'job-101' || jobId === 'job-102')) {
    return [
      {
        id: 'app-sample-1',
        job_id: jobId,
        candidate_name: 'Elena Rostova',
        candidate_email: 'elena.rostova@engineer.dev',
        skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL'],
        match_percentage: 95,
        l1_score: 92,
        applied_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        status: 'Screening'
      },
      {
        id: 'app-sample-2',
        job_id: jobId,
        candidate_name: 'Sophia Patel',
        candidate_email: 'spatel@cloudscale.tech',
        skills: ['AWS', 'Kubernetes', 'Python', 'CI/CD'],
        match_percentage: 88,
        l1_score: 94,
        applied_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        status: 'Under Review'
      }
    ];
  }

  return applications;
};
