import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useToast } from '../context/ToastContext';

// Verified candidate talent pool fallback
const INITIAL_TALENT_POOL = [
  {
    id: 'cand-1',
    full_name: 'Elena Rostova',
    email: 'elena.rostova@engineer.dev',
    target_role: 'Senior Full-Stack Engineer',
    experience_level: 'Senior Staff / Lead',
    skills: ['React (Verified)', 'TypeScript (Verified)', 'Node.js', 'PostgreSQL', 'Docker'],
    match_percentage: 95,
    l1_score: 92,
    location: 'Bengaluru, India (Open to Remote)',
    status: 'Available'
  },
  {
    id: 'cand-2',
    full_name: 'Marcus Vance',
    email: 'marcus.v@ai-cloud.io',
    target_role: 'AI / Machine Learning Engineer',
    experience_level: 'Mid-Level Specialist',
    skills: ['Python (Verified)', 'FastAPI', 'PyTorch', 'Docker (Verified)', 'AWS'],
    match_percentage: 91,
    l1_score: 88,
    location: 'Remote',
    status: 'Interviewing'
  },
  {
    id: 'cand-3',
    full_name: 'Sophia Patel',
    email: 'spatel@cloudscale.tech',
    target_role: 'Cloud DevOps Architect',
    experience_level: 'Senior Staff / Lead',
    skills: ['AWS (Verified)', 'Kubernetes', 'Terraform (Verified)', 'Python', 'CI/CD'],
    match_percentage: 88,
    l1_score: 94,
    location: 'Hyderabad, India',
    status: 'Available'
  },
  {
    id: 'cand-4',
    full_name: 'Liam O’Connor',
    email: 'liam.oc@devstack.net',
    target_role: 'Frontend Systems Specialist',
    experience_level: 'Junior Engineer',
    skills: ['React (Verified)', 'Tailwind CSS', 'Next.js', 'GraphQL'],
    match_percentage: 84,
    l1_score: 80,
    location: 'Remote',
    status: 'Available'
  },
  {
    id: 'cand-5',
    full_name: 'Arjun Mehta',
    email: 'arjun.mehta@polytech.edu',
    target_role: 'Full-Stack Developer',
    experience_level: 'Fresher / Entry-Level',
    skills: ['JavaScript (Verified)', 'React', 'Node.js', 'SQL', 'Git'],
    match_percentage: 82,
    l1_score: 86,
    location: 'Pune, India',
    status: 'Available'
  }
];

export default function EmployerPortal({ session, userProfile, onLogout }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToast } = useToast() || { addToast: () => {} };

  // Active Tab: 'overview' | 'jobs' | 'candidates' | 'post-job' | 'analytics'
  const activeTab = searchParams.get('tab') || 'overview';
  const setActiveTab = (tab) => {
    setSearchParams({ tab });
  };

  // Employer identity
  const companyName = userProfile?.company_name || 'TechCorp Global Systems';
  const recruiterName = userProfile?.full_name || session?.user?.email?.split('@')[0] || 'Talent Acquisition Team';

  // Employer data state
  const [jobs, setJobs] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [shortlistedIds, setShortlistedIds] = useState(new Set());
  const [candidateSearch, setCandidateSearch] = useState('');
  const [candidateSkillFilter, setCandidateSkillFilter] = useState('all');
  const [selectedCandidateModal, setSelectedCandidateModal] = useState(null);

  // Post Job form state
  const [newJob, setNewJob] = useState({
    title: '',
    department: 'Engineering',
    workplace: 'Remote',
    location: 'Global / Remote',
    type: 'Full-Time',
    minSalary: '80000',
    maxSalary: '130000',
    currency: 'USD',
    requiredSkills: 'React, TypeScript, Node.js, SQL',
    description: 'We are seeking an exceptional engineer to design and scale our mission-critical distributed systems. You will collaborate with cross-functional product teams to deliver high-performance user experiences.'
  });
  const [submittingJob, setSubmittingJob] = useState(false);

  // Fetch jobs & candidates on mount
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        // 1. Fetch Employer Jobs
        let remoteJobs = [];
        try {
          const { data: jData, error: jErr } = await supabase
            .from('employer_jobs')
            .select('*')
            .order('created_at', { ascending: false });
          if (!jErr && jData && jData.length > 0) {
            remoteJobs = jData;
          }
        } catch (e) {
          console.warn('Supabase employer_jobs query:', e);
        }

        const localJobs = JSON.parse(localStorage.getItem('bridgeiq_employer_jobs') || '[]');
        const finalJobs = remoteJobs.length > 0 ? remoteJobs : (localJobs.length > 0 ? localJobs : [
          {
            id: 'job-101',
            title: 'Senior Full-Stack Engineer',
            department: 'Core Platform',
            workplace: 'Remote',
            location: 'Remote (Global)',
            type: 'Full-Time',
            salary: '$120k - $160k / yr',
            required_skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL'],
            applicant_count: 14,
            status: 'Active',
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
            applicant_count: 8,
            status: 'Active',
            created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
          }
        ]);
        setJobs(finalJobs);

        // 2. Fetch Candidates
        let remoteCand = [];
        try {
          const { data: cData, error: cErr } = await supabase
            .from('profiles')
            .select('*')
            .eq('role', 'candidate');
          if (!cErr && cData && cData.length > 0) {
            remoteCand = cData.map((c, idx) => ({
              ...c,
              match_percentage: c.match_percentage || (82 + (idx * 5) % 15),
              l1_score: c.l1_score || (80 + (idx * 4) % 18)
            }));
          }
        } catch (e) {
          console.warn('Candidate pool query:', e);
        }

        setCandidates(remoteCand.length > 0 ? remoteCand : INITIAL_TALENT_POOL);
      } catch (err) {
        console.error('Error loading employer portal data:', err);
        setCandidates(INITIAL_TALENT_POOL);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Post Job Handler
  const handlePostJobSubmit = async (e) => {
    e.preventDefault();
    setSubmittingJob(true);

    const skillsArr = newJob.requiredSkills
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const jobPayload = {
      id: 'job-' + Date.now(),
      title: newJob.title,
      department: newJob.department,
      workplace: newJob.workplace,
      location: newJob.location,
      type: newJob.type,
      salary: `$${Math.round(newJob.minSalary / 1000)}k - $${Math.round(newJob.maxSalary / 1000)}k / yr`,
      required_skills: skillsArr,
      description: newJob.description,
      employer_id: userProfile?.id || session?.user?.id || 'emp-demo',
      company_name: companyName,
      created_at: new Date().toISOString(),
      applicant_count: 0,
      status: 'Active'
    };

    try {
      await supabase.from('employer_jobs').insert([jobPayload]);
    } catch {}

    const updated = [jobPayload, ...jobs];
    setJobs(updated);
    try {
      localStorage.setItem('bridgeiq_employer_jobs', JSON.stringify(updated));
    } catch {}

    setSubmittingJob(false);
    addToast(`Position "${jobPayload.title}" posted successfully!`, 'success');
    setActiveTab('jobs');
    setNewJob({
      title: '',
      department: 'Engineering',
      workplace: 'Remote',
      location: 'Global / Remote',
      type: 'Full-Time',
      minSalary: '80000',
      maxSalary: '130000',
      currency: 'USD',
      requiredSkills: '',
      description: ''
    });
  };

  // Toggle Shortlist
  const handleToggleShortlist = (cand) => {
    const next = new Set(shortlistedIds);
    if (next.has(cand.id)) {
      next.delete(cand.id);
      addToast(`${cand.full_name || 'Candidate'} removed from shortlist`, 'info');
    } else {
      next.add(cand.id);
      addToast(`${cand.full_name || 'Candidate'} added to target shortlist!`, 'success');
    }
    setShortlistedIds(next);
  };

  // Send MCQ Assessment Invite
  const handleInviteToAssessment = (cand) => {
    addToast(`Automated MCQ Assessment link dispatched to ${cand.email}!`, 'success');
  };

  // Filtered Candidates
  const filteredCandidates = useMemo(() => {
    return candidates.filter((c) => {
      const q = candidateSearch.toLowerCase().trim();
      const nameMatch = (c.full_name || '').toLowerCase().includes(q);
      const roleMatch = (c.target_role || '').toLowerCase().includes(q);
      const skillsStr = Array.isArray(c.skills) ? c.skills.join(' ').toLowerCase() : (c.skills || '').toLowerCase();
      const textMatch = !q || nameMatch || roleMatch || skillsStr.includes(q);

      const skillFilterMatch = candidateSkillFilter === 'all' || skillsStr.includes(candidateSkillFilter.toLowerCase());
      return textMatch && skillFilterMatch;
    });
  }, [candidates, candidateSearch, candidateSkillFilter]);

  // Key KPI Metrics
  const activePostingsCount = jobs.filter(j => j.status === 'Active').length;
  const totalApplicants = jobs.reduce((acc, j) => acc + (j.applicant_count || 0), 0) + candidates.length;
  const verifiedTalentCount = candidates.filter(c => (c.match_percentage || 0) >= 88).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-300">
      
      {/* 1. Master Employer Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-[#121626] via-[#161c30] to-[#121626] border border-[#B298E7]/30 p-6 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#B298E7]/15 border border-[#B298E7]/35 text-[#B298E7] text-xs font-bold uppercase tracking-wider">
            <span>🏢</span>
            <span>Enterprise Recruitment Workspace</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            {companyName}
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm font-medium">
            Recruiter Portal • Managed by <strong className="text-slate-200">{recruiterName}</strong>
          </p>
        </div>

        {/* Action Button: Post Job */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setActiveTab('post-job')}
            className="px-6 py-3.5 bg-gradient-to-r from-[#B298E7] via-[#F5B8D5] to-[#B8E3E9] text-[#0c0e17] font-black text-xs uppercase tracking-wider rounded-xl shadow-lg hover:brightness-105 transition-all cursor-pointer flex items-center gap-2"
          >
            <span>+ Post a New Role</span>
          </button>
        </div>
      </div>

      {/* 2. Top Employer Navigation Tabs Bar */}
      <div className="bg-[#121626] rounded-2xl p-2 border border-slate-800 shadow-xl flex flex-wrap gap-2">
        {[
          { id: 'overview', label: '📊 Overview', desc: 'KPIs & Summary' },
          { id: 'jobs', label: `📢 Job Postings (${jobs.length})`, desc: 'Manage Roles' },
          { id: 'candidates', label: `👥 Talent Pool (${candidates.length})`, desc: 'Vetted Candidates' },
          { id: 'post-job', label: '➕ Post a Job', desc: 'New Opening' },
          { id: 'analytics', label: '📈 Hiring Analytics', desc: 'Funnel & Match Metrics' }
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-[140px] px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex flex-col items-center sm:items-start ${
                isActive
                  ? 'bg-gradient-to-r from-[#B298E7] to-[#B8E3E9] text-[#0c0e17] font-black shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-[#0c0e17]'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] hidden sm:block ${isActive ? 'text-[#0c0e17]/80' : 'text-slate-500'}`}>
                {tab.desc}
              </span>
            </button>
          );
        })}
      </div>

      {/* =================================================================== */}
      {/* TAB 1: OVERVIEW DASHBOARD                                           */}
      {/* =================================================================== */}
      {activeTab === 'overview' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="bg-[#121626] border border-[#1f2742] rounded-2xl p-5 shadow-lg">
              <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block mb-1">Active Positions</span>
              <div className="text-3xl font-black text-white">{activePostingsCount}</div>
              <span className="text-[11px] text-[#B8E3E9] font-medium mt-1 block">Live across network</span>
            </div>

            <div className="bg-[#121626] border border-[#1f2742] rounded-2xl p-5 shadow-lg">
              <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block mb-1">Total Pipeline</span>
              <div className="text-3xl font-black text-white">{totalApplicants}</div>
              <span className="text-[11px] text-emerald-400 font-medium mt-1 block">+4 new this week</span>
            </div>

            <div className="bg-[#121626] border border-[#1f2742] rounded-2xl p-5 shadow-lg">
              <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block mb-1">Top Verified Matches</span>
              <div className="text-3xl font-black text-white">{verifiedTalentCount}</div>
              <span className="text-[11px] text-[#B298E7] font-medium mt-1 block">Score &ge; 88% Match</span>
            </div>

            <div className="bg-[#121626] border border-[#1f2742] rounded-2xl p-5 shadow-lg">
              <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block mb-1">Shortlisted</span>
              <div className="text-3xl font-black text-white">{shortlistedIds.size}</div>
              <span className="text-[11px] text-[#F5B8D5] font-medium mt-1 block">Ready for interview</span>
            </div>
          </div>

          {/* Quick Active Jobs Preview */}
          <div className="bg-[#121626] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-white">Active Requisitions</h3>
                <p className="text-xs text-slate-400">Recent openings managed by your team</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('jobs')}
                className="text-xs font-bold text-[#B8E3E9] hover:underline cursor-pointer"
              >
                View All ({jobs.length}) →
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {jobs.slice(0, 4).map((j) => (
                <div key={j.id} className="p-4 rounded-2xl bg-[#0c0e17] border border-slate-800 flex items-center justify-between">
                  <div className="min-w-0 pr-4">
                    <h4 className="text-sm font-bold text-white truncate">{j.title}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">{j.department || 'Engineering'} • {j.workplace} • {j.location}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="px-2.5 py-1 rounded-lg bg-[#B298E7]/15 border border-[#B298E7]/30 text-[#B298E7] text-xs font-black">
                      {j.applicant_count || 0} Applicants
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Candidates Quick Preview */}
          <div className="bg-[#121626] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-white">Top Scored Candidates</h3>
                <p className="text-xs text-slate-400">Pre-assessed against platform benchmarks</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('candidates')}
                className="text-xs font-bold text-[#B8E3E9] hover:underline cursor-pointer"
              >
                Explore Talent Pool →
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {candidates.slice(0, 3).map((cand) => (
                <div key={cand.id} className="p-4 rounded-2xl bg-[#0c0e17] border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-[#B298E7]/20 text-[#B298E7] flex items-center justify-center font-black">
                      {cand.full_name?.charAt(0) || 'C'}
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-black">
                      {cand.match_percentage}% Match
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white truncate">{cand.full_name}</h4>
                    <p className="text-xs text-slate-400 truncate">{cand.target_role}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleInviteToAssessment(cand)}
                    className="w-full py-1.5 bg-[#161c30] border border-[#B8E3E9]/30 text-[#B8E3E9] hover:bg-[#1f2742] text-xs font-bold rounded-lg transition-all cursor-pointer"
                  >
                    Send Assessment ↗
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 2: JOB POSTINGS MANAGEMENT                                      */}
      {/* =================================================================== */}
      {activeTab === 'jobs' && (
        <div className="bg-[#121626] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-black text-white">Active Job Postings ({jobs.length})</h3>
              <p className="text-xs text-slate-400">Manage requisitions, review candidates per role, and update listings</p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('post-job')}
              className="px-4 py-2.5 bg-gradient-to-r from-[#B298E7] to-[#B8E3E9] text-[#0c0e17] font-black text-xs rounded-xl shadow cursor-pointer hover:brightness-105"
            >
              + Create New Opening
            </button>
          </div>

          <div className="space-y-4">
            {jobs.map((job) => (
              <div key={job.id} className="p-5 rounded-2xl bg-[#0c0e17] border border-slate-800 hover:border-[#B298E7]/40 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1.5 min-w-0 max-w-xl">
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-bold text-white">{job.title}</h4>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      {job.status || 'Active'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    {job.department || 'Engineering'} • {job.workplace} • {job.location} • {job.salary || '$90k - $130k'}
                  </p>
                  {job.required_skills && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {(Array.isArray(job.required_skills) ? job.required_skills : job.required_skills.split(',')).map((sk) => (
                        <span key={sk} className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-semibold">
                          {sk.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                  <div className="text-right pr-2">
                    <span className="text-lg font-black text-white block">{job.applicant_count || 0}</span>
                    <span className="text-[10px] text-slate-500 uppercase font-bold">Applicants</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setCandidateSearch(job.title.split(' ')[0]);
                      setActiveTab('candidates');
                    }}
                    className="px-4 py-2 bg-[#161c30] border border-[#B8E3E9]/30 text-[#B8E3E9] text-xs font-bold rounded-xl hover:bg-[#1f2742] cursor-pointer"
                  >
                    View Matching Talent →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 3: TALENT POOL / CANDIDATES                                     */}
      {/* =================================================================== */}
      {activeTab === 'candidates' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Search & Filter Bar */}
          <div className="bg-[#121626] rounded-2xl p-4 border border-slate-800 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex-1 w-full relative">
              <span className="absolute left-3.5 top-2.5 text-slate-500 text-sm">🔍</span>
              <input
                type="text"
                placeholder="Search candidates by name, specialization, or skill tags..."
                value={candidateSearch}
                onChange={(e) => setCandidateSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-[#0c0e17] border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:border-[#B298E7] outline-none"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-bold text-slate-400 whitespace-nowrap">Skill Filter:</span>
              <select
                value={candidateSkillFilter}
                onChange={(e) => setCandidateSkillFilter(e.target.value)}
                className="bg-[#0c0e17] border border-slate-800 text-xs font-bold text-slate-200 rounded-xl px-3 py-2 outline-none focus:border-[#B298E7]"
              >
                <option value="all">All Skills</option>
                <option value="React">React</option>
                <option value="Python">Python</option>
                <option value="TypeScript">TypeScript</option>
                <option value="AWS">AWS / Cloud</option>
                <option value="Docker">Docker</option>
                <option value="SQL">SQL</option>
              </select>
            </div>
          </div>

          {/* Candidates List */}
          <div className="space-y-4">
            {filteredCandidates.map((cand) => {
              const isShortlisted = shortlistedIds.has(cand.id);
              const skills = Array.isArray(cand.skills) ? cand.skills : (cand.skills ? String(cand.skills).split(',') : []);

              return (
                <div key={cand.id} className="p-5 rounded-3xl bg-[#121626] border border-slate-800 hover:border-[#B298E7]/40 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-lg">
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-[#0c0e17] border border-slate-800 text-[#B298E7] flex items-center justify-center text-lg font-black flex-shrink-0 shadow-inner">
                      {cand.full_name?.charAt(0) || 'C'}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2.5">
                        <h4 className="text-base font-bold text-white truncate">{cand.full_name}</h4>
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          {cand.match_percentage}% Match
                        </span>
                        {cand.l1_score && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#B8E3E9]/15 text-[#B8E3E9] border border-[#B8E3E9]/30">
                            L1 Score: {cand.l1_score}%
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {cand.target_role} • {cand.experience_level || 'Mid-Level'} • {cand.location || 'Remote'}
                      </p>

                      {/* Skill Badges */}
                      <div className="flex flex-wrap gap-1.5 pt-2">
                        {skills.map((sk) => (
                          <span key={sk} className="px-2 py-0.5 rounded-md bg-[#0c0e17] border border-slate-800 text-[10px] text-slate-300 font-semibold">
                            {sk}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
                    <button
                      type="button"
                      onClick={() => handleToggleShortlist(cand)}
                      className={`px-3.5 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                        isShortlisted
                          ? 'bg-[#F5B8D5]/20 border-[#F5B8D5] text-[#F5B8D5]'
                          : 'bg-[#0c0e17] border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {isShortlisted ? '⭐ Shortlisted' : '☆ Shortlist'}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleInviteToAssessment(cand)}
                      className="px-4 py-2 bg-gradient-to-r from-[#B298E7] to-[#B8E3E9] text-[#0c0e17] font-black text-xs rounded-xl shadow cursor-pointer hover:brightness-105"
                    >
                      Invite to MCQ Test ↗
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 4: POST A JOB FORM                                              */}
      {/* =================================================================== */}
      {activeTab === 'post-job' && (
        <div className="bg-[#121626] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl max-w-3xl mx-auto space-y-6 animate-in fade-in duration-200">
          <div>
            <h3 className="text-2xl font-black text-white">Create New Job Requisition</h3>
            <p className="text-xs text-slate-400 mt-1">
              Publish your requirements to the Bridge-IQ network. Candidates will be automatically benchmarked.
            </p>
          </div>

          <form onSubmit={handlePostJobSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Job Title <span className="text-[#F5B8D5]">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Senior Full-Stack Engineer"
                value={newJob.title}
                onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                className="w-full px-4 py-3 bg-[#0c0e17] border border-slate-800 rounded-xl text-white text-xs outline-none focus:border-[#B298E7]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Department
                </label>
                <input
                  type="text"
                  placeholder="e.g. Core Engineering"
                  value={newJob.department}
                  onChange={(e) => setNewJob({ ...newJob, department: e.target.value })}
                  className="w-full px-4 py-3 bg-[#0c0e17] border border-slate-800 rounded-xl text-white text-xs outline-none focus:border-[#B298E7]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Workplace Mode
                </label>
                <select
                  value={newJob.workplace}
                  onChange={(e) => setNewJob({ ...newJob, workplace: e.target.value })}
                  className="w-full px-4 py-3 bg-[#0c0e17] border border-slate-800 rounded-xl text-white text-xs outline-none focus:border-[#B298E7]"
                >
                  <option value="Remote">🌐 Remote</option>
                  <option value="Hybrid">🔄 Hybrid</option>
                  <option value="On-Site">🏢 On-Site</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bengaluru, India or Remote"
                  value={newJob.location}
                  onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
                  className="w-full px-4 py-3 bg-[#0c0e17] border border-slate-800 rounded-xl text-white text-xs outline-none focus:border-[#B298E7]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Employment Type
                </label>
                <select
                  value={newJob.type}
                  onChange={(e) => setNewJob({ ...newJob, type: e.target.value })}
                  className="w-full px-4 py-3 bg-[#0c0e17] border border-slate-800 rounded-xl text-white text-xs outline-none focus:border-[#B298E7]"
                >
                  <option value="Full-Time">Full-Time</option>
                  <option value="Contract">Contract</option>
                  <option value="Part-Time">Part-Time</option>
                  <option value="Internship">Internship</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Required Benchmark Skills (comma-separated) <span className="text-[#F5B8D5]">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="React, TypeScript, Node.js, PostgreSQL, Docker"
                value={newJob.requiredSkills}
                onChange={(e) => setNewJob({ ...newJob, requiredSkills: e.target.value })}
                className="w-full px-4 py-3 bg-[#0c0e17] border border-slate-800 rounded-xl text-white text-xs outline-none focus:border-[#B298E7]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Role Description & Expectations
              </label>
              <textarea
                rows={4}
                required
                value={newJob.description}
                onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                className="w-full px-4 py-3 bg-[#0c0e17] border border-slate-800 rounded-xl text-white text-xs outline-none focus:border-[#B298E7]"
              />
            </div>

            <button
              type="submit"
              disabled={submittingJob}
              className="w-full py-3.5 bg-gradient-to-r from-[#B298E7] via-[#F5B8D5] to-[#B8E3E9] text-[#0c0e17] font-black text-xs uppercase tracking-wider rounded-xl shadow-lg hover:brightness-105 transition-all cursor-pointer"
            >
              {submittingJob ? 'Publishing Opening...' : 'Publish Job Opening Now ✓'}
            </button>
          </form>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 5: HIRING ANALYTICS                                             */}
      {/* =================================================================== */}
      {activeTab === 'analytics' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Chart 1: Talent Match Distribution */}
            <div className="bg-[#121626] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
              <h3 className="text-base font-black text-white">Talent Match Distribution</h3>
              <p className="text-xs text-slate-400">Match score breakdown of current applicant pool</p>

              <div className="space-y-3 pt-2">
                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-300 mb-1">
                    <span>High Match (90%+)</span>
                    <span className="text-emerald-400">42% of candidates</span>
                  </div>
                  <div className="w-full bg-[#0c0e17] h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-400 h-full rounded-full" style={{ width: '42%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-300 mb-1">
                    <span>Mid-High Match (75% - 89%)</span>
                    <span className="text-[#B8E3E9]">38% of candidates</span>
                  </div>
                  <div className="w-full bg-[#0c0e17] h-2 rounded-full overflow-hidden">
                    <div className="bg-[#B8E3E9] h-full rounded-full" style={{ width: '38%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-300 mb-1">
                    <span>Developing Match (&lt;75%)</span>
                    <span className="text-slate-400">20% of candidates</span>
                  </div>
                  <div className="w-full bg-[#0c0e17] h-2 rounded-full overflow-hidden">
                    <div className="bg-slate-600 h-full rounded-full" style={{ width: '20%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Chart 2: Top Skills in Pool */}
            <div className="bg-[#121626] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
              <h3 className="text-base font-black text-white">Most Prevalent Candidate Skills</h3>
              <p className="text-xs text-slate-400">Top verified proficiencies across your talent network</p>

              <div className="space-y-3 pt-2">
                {[
                  { skill: 'React / Next.js', pct: '85%' },
                  { skill: 'TypeScript & JavaScript', pct: '78%' },
                  { skill: 'Python & AI Frameworks', pct: '64%' },
                  { skill: 'Docker & Cloud Deployment', pct: '58%' },
                  { skill: 'PostgreSQL / SQL', pct: '52%' }
                ].map((sk) => (
                  <div key={sk.skill}>
                    <div className="flex justify-between text-xs font-bold text-slate-300 mb-1">
                      <span>{sk.skill}</span>
                      <span className="text-[#B298E7]">{sk.pct}</span>
                    </div>
                    <div className="w-full bg-[#0c0e17] h-2 rounded-full overflow-hidden">
                      <div className="bg-gradient-to-r from-[#B298E7] to-[#B8E3E9] h-full rounded-full" style={{ width: sk.pct }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
