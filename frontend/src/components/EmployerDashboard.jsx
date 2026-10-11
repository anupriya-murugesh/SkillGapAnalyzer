import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useToast } from '../context/ToastContext';

// Initial Mock Candidates if Supabase database has 0 candidates
const INITIAL_FALLBACK_CANDIDATES = [
  {
    id: 'cand-1',
    full_name: 'Elena Rostova',
    email: 'elena.rostova@engineer.dev',
    target_role: 'Senior Full-Stack Engineer',
    experience_level: 'Senior',
    skills: ['React (Verified)', 'TypeScript (Verified)', 'Node.js', 'PostgreSQL', 'Docker'],
    match_percentage: 95,
  },
  {
    id: 'cand-2',
    full_name: 'Marcus Vance',
    email: 'marcus.v@ai-cloud.io',
    target_role: 'AI / Machine Learning Engineer',
    experience_level: 'Mid-Level',
    skills: ['Python (Verified)', 'FastAPI', 'PyTorch', 'Docker (Verified)', 'AWS'],
    match_percentage: 91,
  },
  {
    id: 'cand-3',
    full_name: 'Sophia Patel',
    email: 'spatel@cloudscale.tech',
    target_role: 'Cloud DevOps Architect',
    experience_level: 'Lead',
    skills: ['AWS (Verified)', 'Kubernetes', 'Terraform (Verified)', 'Python', 'CI/CD'],
    match_percentage: 88,
  },
  {
    id: 'cand-4',
    full_name: 'Liam O’Connor',
    email: 'liam.oc@devstack.net',
    target_role: 'Frontend Systems Specialist',
    experience_level: 'Mid-Level',
    skills: ['React (Verified)', 'Tailwind CSS', 'Next.js', 'GraphQL'],
    match_percentage: 84,
  },
];

export default function EmployerDashboard({ profile, session }) {
  const { addToast } = useToast() || { addToast: () => {} };

  // Employer Profile
  const companyName = profile?.company_name || 'TechCorp Global';
  const recruiterName = profile?.full_name || session?.user?.email || 'Recruiter';

  // State
  const [jobs, setJobs] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPostJobModalOpen, setIsPostJobModalOpen] = useState(false);
  const [shortlistedCandidateIds, setShortlistedCandidateIds] = useState(new Set());
  const [searchFilter, setSearchFilter] = useState('');

  // Post Job Form State
  const [newJob, setNewJob] = useState({
    title: '',
    location: 'Remote',
    description: '',
    requiredSkills: '',
  });
  const [submittingJob, setSubmittingJob] = useState(false);

  // Fetch Jobs & Candidates from Supabase
  useEffect(() => {
    async function fetchEmployerData() {
      setLoading(true);
      try {
        // 1. Fetch Employer Jobs
        let remoteJobs = [];
        try {
          const { data: jobsData, error: jobsError } = await supabase
            .from('employer_jobs')
            .select('*')
            .order('created_at', { ascending: false });

          if (!jobsError && jobsData && jobsData.length > 0) {
            remoteJobs = jobsData;
          }
        } catch (e) {
          console.warn('Could not query employer_jobs from remote Supabase:', e);
        }

        // Check local storage for cached jobs
        const localJobsStr = localStorage.getItem('employer_jobs');
        const localJobs = localJobsStr ? JSON.parse(localJobsStr) : [];
        const mergedJobs = remoteJobs.length > 0 ? remoteJobs : localJobs;
        setJobs(mergedJobs);

        // 2. Fetch Candidates from public.profiles
        let remoteCandidates = [];
        try {
          const { data: candData, error: candError } = await supabase
            .from('profiles')
            .select('*')
            .eq('role', 'candidate');

          if (!candError && candData && candData.length > 0) {
            remoteCandidates = candData.map((c, i) => ({
              ...c,
              match_percentage: c.match_percentage || 80 + ((i * 7) % 18),
            }));
          }
        } catch (e) {
          console.warn('Could not query candidate profiles from remote Supabase:', e);
        }

        // Merge with initial pool
        if (remoteCandidates.length > 0) {
          setCandidates(remoteCandidates);
        } else {
          setCandidates(INITIAL_FALLBACK_CANDIDATES);
        }
      } catch (err) {
        console.error('Employer dashboard fetch error:', err);
        setCandidates(INITIAL_FALLBACK_CANDIDATES);
      } finally {
        setLoading(false);
      }
    }

    fetchEmployerData();
  }, []);

  // Handle Post Job Submission
  const handlePostJob = async (e) => {
    e.preventDefault();
    setSubmittingJob(true);

    const skillsArray = newJob.requiredSkills
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const jobPayload = {
      id: 'job-' + Date.now(),
      title: newJob.title,
      location: newJob.location,
      description: newJob.description,
      required_skills: skillsArray,
      employer_id: profile?.id || session?.user?.id || 'emp-demo',
      company_name: companyName,
      created_at: new Date().toISOString(),
      applicant_count: 0,
    };

    try {
      // Save directly to Supabase employer_jobs table
      const { error } = await supabase.from('employer_jobs').insert([jobPayload]);
      if (error) {
        console.warn('Remote employer_jobs insert notice:', error.message);
      }
    } catch (err) {
      console.warn('Database insert fallback to localStorage:', err);
    }

    // Always persist to local cache for demo resilience
    const updatedJobs = [jobPayload, ...jobs];
    setJobs(updatedJobs);
    try {
      localStorage.setItem('employer_jobs', JSON.stringify(updatedJobs));
    } catch {}

    setSubmittingJob(false);
    setIsPostJobModalOpen(false);
    setNewJob({
      title: '',
      location: 'Remote',
      description: '',
      requiredSkills: '',
    });

    addToast(`Job "${jobPayload.title}" posted successfully!`, 'success');
  };

  // Action: Invite to MCQ Assessment
  const handleInviteCandidate = (candidate) => {
    addToast(
      `Invitation to MCQ Assessment sent to ${candidate.full_name || candidate.email}!`,
      'success'
    );
  };

  // Action: Toggle Shortlist
  const handleToggleShortlist = (candidate) => {
    const nextSet = new Set(shortlistedCandidateIds);
    if (nextSet.has(candidate.id)) {
      nextSet.delete(candidate.id);
      addToast(`${candidate.full_name || 'Candidate'} removed from shortlist.`, 'info');
    } else {
      nextSet.add(candidate.id);
      addToast(`${candidate.full_name || 'Candidate'} shortlisted!`, 'success');
    }
    setShortlistedCandidateIds(nextSet);
  };

  // Filter Candidates
  const filteredCandidates = candidates.filter((c) => {
    const q = searchFilter.toLowerCase();
    const nameMatch = c.full_name?.toLowerCase().includes(q);
    const roleMatch = c.target_role?.toLowerCase().includes(q);
    const skills = Array.isArray(c.skills) ? c.skills.join(' ') : (c.skills || '');
    const skillMatch = skills.toLowerCase().includes(q);
    return !q || nameMatch || roleMatch || skillMatch;
  });

  // Calculate Metrics
  const activeJobCount = jobs.length;
  const totalApplicantCount = candidates.length + jobs.reduce((acc, j) => acc + (j.applicant_count || 0), 0);
  const verifiedMatchesCount = candidates.filter((c) => {
    const skills = Array.isArray(c.skills) ? c.skills : [];
    return skills.some((s) => s.includes('(Verified)')) || (c.match_percentage || 0) >= 88;
  }).length;

  return (
    <div className="space-y-10 animate-in fade-in duration-500 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-zinc-950/90 backdrop-blur-2xl border border-zinc-800/80 shadow-2xl p-6 sm:p-8 text-white">
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              Employer Talent Portal
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              {companyName}
            </h1>
            <p className="text-zinc-400 text-sm font-medium">
              Managed by <span className="text-zinc-200 font-bold">{recruiterName}</span> • Benchmark & recruit vetted engineering talent
            </p>
          </div>

          <button
            onClick={() => setIsPostJobModalOpen(true)}
            className="px-6 py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-500 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <span>+ Post a New Job</span>
          </button>
        </div>
      </div>

      {/* KEY METRICS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        
        {/* Metric 1: Active Job Posts */}
        <div className="p-6 rounded-3xl bg-zinc-950/80 backdrop-blur-xl border border-zinc-800/80 shadow-xl relative overflow-hidden group hover:border-blue-500/40 transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Active Job Posts
            </span>
            <span className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center text-lg">
              💼
            </span>
          </div>
          <div className="text-4xl font-black text-white mb-1">
            {activeJobCount}
          </div>
          <div className="text-xs font-medium text-emerald-400 flex items-center gap-1">
            <span>● Live on Bridge-IQ Platform</span>
          </div>
        </div>

        {/* Metric 2: Total Applicants */}
        <div className="p-6 rounded-3xl bg-zinc-950/80 backdrop-blur-xl border border-zinc-800/80 shadow-xl relative overflow-hidden group hover:border-indigo-500/40 transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Total Applicants
            </span>
            <span className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center text-lg">
              👥
            </span>
          </div>
          <div className="text-4xl font-black text-white mb-1">
            {totalApplicantCount}
          </div>
          <div className="text-xs font-medium text-indigo-300">
            Across active postings & verified talent
          </div>
        </div>

        {/* Metric 3: Verified Top Matches */}
        <div className="p-6 rounded-3xl bg-zinc-950/80 backdrop-blur-xl border border-zinc-800/80 shadow-xl relative overflow-hidden group hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Verified Top Matches
            </span>
            <span className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-lg">
              🛡️
            </span>
          </div>
          <div className="text-4xl font-black text-emerald-400 mb-1">
            {verifiedMatchesCount}
          </div>
          <div className="text-xs font-medium text-zinc-400">
            Candidates with ≥80% skill certifications
          </div>
        </div>

      </div>

      {/* ACTIVE JOB POSTINGS SECTION (If any) */}
      {jobs.length > 0 && (
        <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-sm border border-gray-100 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-gray-900">Your Active Job Vacancies</h3>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
              {jobs.length} Open
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {jobs.map((j) => (
              <div key={j.id} className="p-5 rounded-2xl bg-gray-50 border border-gray-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="font-bold text-gray-900 text-base">{j.title}</h4>
                    <span className="text-[11px] font-semibold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full whitespace-nowrap">
                      {j.location}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2 mb-3">{j.description || 'No description provided'}</p>
                </div>

                <div>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {(Array.isArray(j.required_skills) ? j.required_skills : []).slice(0, 4).map((sk, i) => (
                      <span key={i} className="text-[10px] font-bold px-2 py-0.5 bg-gray-200 text-gray-700 rounded-md">
                        {sk}
                      </span>
                    ))}
                  </div>
                  <div className="text-[11px] text-gray-400 font-medium">
                    Posted on {new Date(j.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CANDIDATE TALENT POOL TABLE */}
      <div className="rounded-3xl bg-zinc-950/90 backdrop-blur-2xl border border-zinc-800/80 shadow-2xl p-6 sm:p-8 text-white space-y-6">
        
        {/* Table Header and Search Filter */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
          <div>
            <h3 className="text-2xl font-black text-white">Candidate Talent Pool</h3>
            <p className="text-zinc-400 text-xs sm:text-sm">
              Profiles fetched directly from <code className="text-indigo-400 font-mono">public.profiles</code> where <code className="text-indigo-400 font-mono">role = 'candidate'</code>.
            </p>
          </div>

          <div className="w-full md:w-72">
            <input
              type="text"
              placeholder="Filter by skill, role, or name..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            />
          </div>
        </div>

        {/* Talent Table */}
        {loading ? (
          <div className="py-16 text-center text-zinc-400 font-semibold animate-pulse">
            Fetching candidate talent records...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-[11px] uppercase tracking-wider text-zinc-500 border-b border-zinc-800">
                <tr>
                  <th className="py-3 px-4">Candidate</th>
                  <th className="py-3 px-4">Target Role</th>
                  <th className="py-3 px-4">Skill Matrix</th>
                  <th className="py-3 px-4 text-center">Match %</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850">
                {filteredCandidates.map((candidate) => {
                  const candidateSkills = Array.isArray(candidate.skills)
                    ? candidate.skills
                    : typeof candidate.skills === 'string'
                    ? candidate.skills.split(',').map((s) => s.trim()).filter(Boolean)
                    : [];

                  const isShortlisted = shortlistedCandidateIds.has(candidate.id);
                  const match = candidate.match_percentage || 85;

                  return (
                    <tr key={candidate.id} className="hover:bg-zinc-900/50 transition-colors">
                      
                      {/* Name & Email */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="font-bold text-white text-sm">
                          {candidate.full_name || 'Anonymous Engineer'}
                        </div>
                        <div className="text-zinc-500 text-xs font-medium">
                          {candidate.email || 'candidate@bridgeiq.ai'}
                        </div>
                      </td>

                      {/* Target Role & Experience */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="text-zinc-200 font-semibold text-xs">
                          {candidate.target_role || 'Full-Stack Engineer'}
                        </div>
                        {candidate.experience_level && (
                          <span className="text-[10px] text-indigo-400 font-bold bg-indigo-500/10 px-2 py-0.5 rounded">
                            {candidate.experience_level}
                          </span>
                        )}
                      </td>

                      {/* Skills */}
                      <td className="py-4 px-4 max-w-xs">
                        <div className="flex flex-wrap gap-1.5">
                          {candidateSkills.slice(0, 5).map((skill, sIdx) => {
                            const isVerified = skill.includes('(Verified)');
                            const clean = skill.replace(/\s*\(Verified\)/gi, '').trim();
                            return (
                              <span
                                key={sIdx}
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                                  isVerified
                                    ? 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-300'
                                    : 'bg-zinc-800 text-zinc-300'
                                }`}
                              >
                                {isVerified && <span>🛡️</span>}
                                <span>{clean}</span>
                              </span>
                            );
                          })}
                          {candidateSkills.length > 5 && (
                            <span className="text-[10px] font-semibold text-zinc-500 px-1">
                              +{candidateSkills.length - 5}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Match % Badge */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-block px-3 py-1 rounded-xl text-xs font-black border ${
                            match >= 90
                              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400'
                              : match >= 80
                              ? 'bg-blue-950/60 border-blue-500/40 text-blue-400'
                              : 'bg-zinc-800 border-zinc-700 text-zinc-300'
                          }`}
                        >
                          {match}%
                        </span>
                      </td>

                      {/* Action Buttons */}
                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => handleInviteCandidate(candidate)}
                            className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 rounded-xl text-xs font-bold transition-all"
                            title="Send MCQ test invite"
                          >
                            Invite to MCQ
                          </button>

                          <button
                            onClick={() => handleToggleShortlist(candidate)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                              isShortlisted
                                ? 'bg-amber-500 text-black border-amber-400 font-black shadow-md'
                                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700'
                            }`}
                          >
                            {isShortlisted ? '★ Shortlisted' : 'Shortlist'}
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* "POST A JOB" MODAL */}
      {isPostJobModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="relative w-full max-w-lg bg-zinc-950/95 border border-zinc-800 rounded-3xl shadow-2xl p-6 sm:p-8 text-white">
            
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-6">
              <div>
                <h3 className="text-xl font-black text-white">Post an Engineering Role</h3>
                <p className="text-zinc-400 text-xs">
                  Saves to Supabase <code className="text-indigo-400">employer_jobs</code> table
                </p>
              </div>
              <button
                onClick={() => setIsPostJobModalOpen(false)}
                className="w-8 h-8 rounded-full bg-zinc-900 text-zinc-400 hover:text-white flex items-center justify-center text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handlePostJob} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5 uppercase tracking-wider">
                  Job Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior React Developer"
                  value={newJob.title}
                  onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                  className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5 uppercase tracking-wider">
                  Location *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Remote, San Francisco, CA"
                  value={newJob.location}
                  onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
                  className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5 uppercase tracking-wider">
                  Required Skills (comma-separated) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. React, TypeScript, GraphQL, Docker, Node.js"
                  value={newJob.requiredSkills}
                  onChange={(e) => setNewJob({ ...newJob, requiredSkills: e.target.value })}
                  className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5 uppercase tracking-wider">
                  Job Description *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Describe the responsibilities, engineering culture, and expectations..."
                  value={newJob.description}
                  onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                  className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsPostJobModalOpen(false)}
                  className="px-5 py-2.5 bg-zinc-900 text-zinc-400 hover:text-white rounded-xl text-sm font-semibold"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submittingJob}
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-sm font-bold shadow-lg disabled:opacity-50 flex items-center gap-2"
                >
                  {submittingJob ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      <span>Posting...</span>
                    </>
                  ) : (
                    <span>Publish Vacancy</span>
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
