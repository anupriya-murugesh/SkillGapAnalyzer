import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { upsertUserProfile, getUserProfile } from '../lib/auth';
import { useToast } from '../context/ToastContext';

export default function Onboarding({ session: propSession, onProfileUpdated }) {
  const navigate = useNavigate();
  const { addToast } = useToast() || { addToast: () => {} };

  const [sessionUser, setSessionUser] = useState(propSession?.user || null);
  const [role, setRole] = useState('candidate');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  // Candidate Form State
  const [candidateData, setCandidateData] = useState({
    fullName: '',
    targetRole: 'Full-Stack Engineer',
    experienceLevel: 'Mid-Level',
    skillsInput: 'React, Node.js, TypeScript, PostgreSQL',
  });

  // Employer Form State
  const [employerData, setEmployerData] = useState({
    fullName: '',
    companyName: '',
    companyWebsite: '',
    industry: 'Technology & Software',
    hiringFocus: '',
  });

  // Popular quick-add skill suggestions
  const suggestedSkills = [
    'React', 'TypeScript', 'Node.js', 'Python', 'AWS', 
    'Docker', 'PostgreSQL', 'FastAPI', 'GraphQL', 'Kubernetes'
  ];

  // Industry options
  const industryOptions = [
    'Technology & Software',
    'AI & Machine Learning',
    'Financial Services & FinTech',
    'Healthcare & Biotech',
    'E-Commerce & Retail',
    'Cybersecurity & Cloud',
    'Other / Enterprise Services'
  ];

  // Fetch current user & existing profile on mount
  useEffect(() => {
    let isMounted = true;

    async function loadUserAndProfile() {
      setLoading(true);
      try {
        let user = propSession?.user;
        if (!user) {
          const { data } = await supabase.auth.getSession();
          user = data?.session?.user;
        }

        // Demo fallback user if not logged in
        if (!user) {
          user = {
            id: 'guest-' + Date.now(),
            email: 'guest@bridgeiq.ai',
            user_metadata: { role: 'candidate' }
          };
        }

        if (!isMounted) return;
        setSessionUser(user);

        // Determine initial role preference
        const detectedRole = user?.user_metadata?.role === 'employer' ? 'employer' : 'candidate';
        setRole(detectedRole);

        // Check if profile exists
        if (user?.id) {
          const existingProfile = await getUserProfile(user.id);
          if (existingProfile && isMounted) {
            if (existingProfile.role) {
              setRole(existingProfile.role);
            }
            if (existingProfile.role === 'employer') {
              setEmployerData(prev => ({
                ...prev,
                fullName: existingProfile.full_name || '',
                companyName: existingProfile.company_name || '',
                companyWebsite: existingProfile.company_website || '',
                industry: existingProfile.industry || prev.industry,
                hiringFocus: existingProfile.hiring_focus || '',
              }));
            } else {
              const skillsStr = Array.isArray(existingProfile.skills)
                ? existingProfile.skills.join(', ')
                : (existingProfile.skills || prev.skillsInput);
              setCandidateData(prev => ({
                ...prev,
                fullName: existingProfile.full_name || '',
                targetRole: existingProfile.target_role || prev.targetRole,
                experienceLevel: existingProfile.experience_level || prev.experienceLevel,
                skillsInput: skillsStr,
              }));
            }
          }
        }
      } catch (err) {
        console.warn('Error loading onboarding profile:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadUserAndProfile();
    return () => { isMounted = false; };
  }, [propSession]);

  // Skill tag pills helper
  const parsedCandidateSkills = candidateData.skillsInput
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  const toggleSkillChip = (skillName) => {
    const current = candidateData.skillsInput
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    let updated;
    if (current.includes(skillName)) {
      updated = current.filter(s => s.toLowerCase() !== skillName.toLowerCase());
    } else {
      updated = [...current, skillName];
    }
    setCandidateData(prev => ({ ...prev, skillsInput: updated.join(', ') }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!sessionUser) {
      addToast('Please log in or register before completing setup.', 'error');
      return;
    }

    setSaving(true);
    setStatusMsg('');

    try {
      const skillsArray = candidateData.skillsInput
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      const profilePayload = {
        id: sessionUser.id,
        email: sessionUser.email,
        role: role,
        full_name: role === 'candidate' ? candidateData.fullName : employerData.fullName,
        is_completed: true,
        ...(role === 'candidate'
          ? {
              target_role: candidateData.targetRole,
              experience_level: candidateData.experienceLevel,
              skills: skillsArray,
            }
          : {
              company_name: employerData.companyName,
              company_website: employerData.companyWebsite,
              industry: employerData.industry,
              hiring_focus: employerData.hiringFocus,
            }),
      };

      // Upsert directly to public.profiles via supabase client with resilience helper
      const savedProfile = await upsertUserProfile(profilePayload);
      
      addToast('Profile setup complete! Welcome aboard.', 'success');
      onProfileUpdated?.(savedProfile);

      // Route to destination
      setTimeout(() => {
        if (role === 'employer') {
          navigate('/jobs');
        } else {
          navigate('/dashboard');
        }
      }, 800);
    } catch (err) {
      console.error('Error saving onboarding profile:', err);
      const msg = err.message || 'Could not save profile. Changes kept in local session.';
      setStatusMsg(msg);
      addToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-slate-400">
        <div className="w-12 h-12 border-4 border-[#B298E7]/20 border-t-[#B298E7] rounded-full animate-spin mb-4" />
        <p className="font-semibold text-slate-300">Loading your profile preferences...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto flex flex-col justify-center animate-in fade-in duration-500">
      
      {/* Top Banner & Mode Switcher */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#B298E7]/10 border border-[#B298E7]/30 text-[#B298E7] font-mono text-xs uppercase tracking-widest mb-3">
          <span className="w-2 h-2 rounded-full bg-[#B8E3E9] animate-pulse" />
          Bridge-IQ Identity Engine
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          Complete Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#B298E7] via-[#F5B8D5] to-[#B8E3E9]">Professional Profile</span>
        </h1>
        <p className="mt-2 text-slate-400 text-sm sm:text-base max-w-2xl mx-auto font-medium">
          Personalize your Bridge-IQ telemetry. We tailor skill gap benchmarks, market metrics, and intelligence to your exact role.
        </p>

        {/* Dual Role Selector */}
        <div className="mt-8 inline-flex p-1.5 bg-[#121626] backdrop-blur-md rounded-2xl border border-slate-800 shadow-inner">
          <button
            type="button"
            onClick={() => setRole('candidate')}
            className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl font-black text-sm transition-all duration-200 cursor-pointer ${
              role === 'candidate'
                ? 'bg-gradient-to-r from-[#B298E7] to-[#B8E3E9] text-[#0c0e17] shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>🎯</span>
            <span>Candidate Track</span>
          </button>
          
          <button
            type="button"
            onClick={() => setRole('employer')}
            className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl font-black text-sm transition-all duration-200 cursor-pointer ${
              role === 'employer'
                ? 'bg-gradient-to-r from-[#B298E7] to-[#B8E3E9] text-[#0c0e17] shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>🏢</span>
            <span>Employer Track</span>
          </button>
        </div>
      </div>

      {/* Main Glass Card Form */}
      <div className="relative rounded-3xl bg-[#121626]/95 backdrop-blur-2xl border border-slate-800 shadow-2xl text-white p-6 sm:p-10 overflow-hidden">
        
        {/* Ambient Gradient Glows with 4-color combo */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#B298E7]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#B8E3E9]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* Left Column: Context Card & Dynamic Info */}
          <div className="lg:col-span-4 space-y-6">
            <div className="p-5 rounded-2xl bg-[#0c0e17] border border-slate-800">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#B298E7]/20 border border-[#B298E7]/40 flex items-center justify-center text-xl shadow-md text-[#B298E7]">
                  {role === 'candidate' ? '🚀' : '💼'}
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">
                    {role === 'candidate' ? 'Engineering Candidate' : 'Hiring Organization'}
                  </h3>
                  <span className="text-xs text-[#B8E3E9] font-medium">
                    {sessionUser?.email || 'Logged in user'}
                  </span>
                </div>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">
                {role === 'candidate'
                  ? 'Your profile feeds directly into our gap analyzer algorithms, calibrating missing skills against active market job postings.'
                  : 'Benchmark role descriptions against real engineering market datasets and configure required skill matrices for recruitment.'}
              </p>
            </div>

            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block px-1">
                Unlocked Capabilities
              </span>
              {(role === 'candidate'
                ? [
                    'Tailored 12-week skills roadmap',
                    'Real-time missing skills scoring',
                    'Resume artifact persistence',
                    'Live job compensation tracking',
                  ]
                : [
                    'Job description skill extraction',
                    'Market salary & skill radar charts',
                    'Candidate assessment rubrics',
                    'Direct vacancy bookmarking',
                  ]
              ).map((feature, idx) => (
                <div key={idx} className="flex items-center gap-2.5 text-xs text-slate-300 font-medium bg-[#0c0e17]/80 px-3 py-2 rounded-xl border border-slate-800/80">
                  <span className="text-[#B8E3E9] font-bold">✓</span>
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Interactive Form */}
          <div className="lg:col-span-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* CANDIDATE SPECIFIC FIELDS */}
              {role === 'candidate' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Full Name */}
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                        Full Name <span className="text-[#F5B8D5]">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={candidateData.fullName}
                        onChange={(e) => setCandidateData({ ...candidateData, fullName: e.target.value })}
                        placeholder="e.g. Alex Chen"
                        className="w-full px-4 py-3 bg-[#0c0e17] border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#B298E7] transition-all text-sm font-medium"
                      />
                    </div>

                    {/* Target Role */}
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                        Target Role <span className="text-[#F5B8D5]">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={candidateData.targetRole}
                        onChange={(e) => setCandidateData({ ...candidateData, targetRole: e.target.value })}
                        placeholder="e.g. Senior Full-Stack Engineer"
                        className="w-full px-4 py-3 bg-[#0c0e17] border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#B298E7] transition-all text-sm font-medium"
                      />
                    </div>
                  </div>

                  {/* Experience Level */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-2 uppercase tracking-wider">
                      Experience Level <span className="text-[#F5B8D5]">*</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {['Junior (0-2y)', 'Mid-Level (3-5y)', 'Senior (6-8y)', 'Lead / Principal (8y+)'].map((lvl) => {
                        const simpleKey = lvl.split(' ')[0];
                        const isSelected = candidateData.experienceLevel.toLowerCase().includes(simpleKey.toLowerCase());
                        return (
                          <button
                            key={lvl}
                            type="button"
                            onClick={() => setCandidateData({ ...candidateData, experienceLevel: simpleKey })}
                            className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
                              isSelected
                                ? 'bg-gradient-to-r from-[#B298E7] to-[#B8E3E9] border-transparent text-[#0c0e17] font-black shadow-md'
                                : 'bg-[#0c0e17] border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900'
                            }`}
                          >
                            {lvl}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Core Skills (comma-separated with chips) */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                        Core Skills (comma-separated) <span className="text-[#F5B8D5]">*</span>
                      </label>
                      <span className="text-[11px] text-slate-400 font-semibold">
                        {parsedCandidateSkills.length} skills listed
                      </span>
                    </div>

                    <input
                      type="text"
                      required
                      value={candidateData.skillsInput}
                      onChange={(e) => setCandidateData({ ...candidateData, skillsInput: e.target.value })}
                      placeholder="React, TypeScript, Python, Docker, AWS, GraphQL"
                      className="w-full px-4 py-3 bg-[#0c0e17] border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#B298E7] transition-all text-sm font-medium"
                    />

                    {/* Live Skill Chips Preview */}
                    {parsedCandidateSkills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2.5">
                        {parsedCandidateSkills.map((skill, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#B298E7]/15 border border-[#B298E7]/30 text-[#B298E7] text-xs font-bold"
                          >
                            <span>{skill}</span>
                            <button
                              type="button"
                              onClick={() => toggleSkillChip(skill)}
                              className="text-[#B298E7] hover:text-[#F5B8D5] text-xs font-bold leading-none cursor-pointer"
                            >
                              &times;
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Suggested skills bar */}
                    <div className="mt-3">
                      <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block mb-1.5">
                        Quick Add Recommended:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {suggestedSkills.map((s) => {
                          const hasIt = parsedCandidateSkills.some(skill => skill.toLowerCase() === s.toLowerCase());
                          return (
                            <button
                              key={s}
                              type="button"
                              onClick={() => toggleSkillChip(s)}
                              className={`text-[11px] px-2.5 py-1 rounded-lg transition-all font-semibold cursor-pointer ${
                                hasIt
                                  ? 'bg-[#0c0e17] text-slate-500 border border-slate-800'
                                  : 'bg-[#0c0e17] text-slate-300 hover:text-white border border-slate-800 hover:border-[#B8E3E9]'
                              }`}
                            >
                              {hasIt ? `✓ ${s}` : `+ ${s}`}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* EMPLOYER SPECIFIC FIELDS */}
              {role === 'employer' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Recruiter Full Name */}
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                        Full Name / Recruiter Name <span className="text-[#F5B8D5]">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={employerData.fullName}
                        onChange={(e) => setEmployerData({ ...employerData, fullName: e.target.value })}
                        placeholder="e.g. Jordan Vance"
                        className="w-full px-4 py-3 bg-[#0c0e17] border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#B298E7] transition-all text-sm font-medium"
                      />
                    </div>

                    {/* Company Name */}
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                        Company Name <span className="text-[#F5B8D5]">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={employerData.companyName}
                        onChange={(e) => setEmployerData({ ...employerData, companyName: e.target.value })}
                        placeholder="e.g. Acme Cloud Systems"
                        className="w-full px-4 py-3 bg-[#0c0e17] border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#B298E7] transition-all text-sm font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Company Website */}
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                        Company Website <span className="text-[#F5B8D5]">*</span>
                      </label>
                      <input
                        type="url"
                        required
                        value={employerData.companyWebsite}
                        onChange={(e) => setEmployerData({ ...employerData, companyWebsite: e.target.value })}
                        placeholder="https://acmecloud.com"
                        className="w-full px-4 py-3 bg-[#0c0e17] border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#B298E7] transition-all text-sm font-medium"
                      />
                    </div>

                    {/* Industry */}
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                        Industry <span className="text-[#F5B8D5]">*</span>
                      </label>
                      <select
                        required
                        value={employerData.industry}
                        onChange={(e) => setEmployerData({ ...employerData, industry: e.target.value })}
                        className="w-full px-4 py-3 bg-[#0c0e17] border border-slate-800 rounded-xl text-white focus:outline-none focus:border-[#B298E7] transition-all text-sm font-medium"
                      >
                        {industryOptions.map((opt) => (
                          <option key={opt} value={opt} className="bg-[#0c0e17] text-white">
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Primary Hiring Target / Focus */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                      Primary Hiring Roles & Skill Stack (Optional)
                    </label>
                    <input
                      type="text"
                      value={employerData.hiringFocus}
                      onChange={(e) => setEmployerData({ ...employerData, hiringFocus: e.target.value })}
                      placeholder="e.g. Senior Frontend, Staff DevOps, React, Rust, Kubernetes"
                      className="w-full px-4 py-3 bg-[#0c0e17] border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#B298E7] transition-all text-sm font-medium"
                    />
                  </div>
                </>
              )}

              {/* Status Alert */}
              {statusMsg && (
                <div className="p-3 bg-[#F5B8D5]/10 border border-[#F5B8D5]/30 text-[#F5B8D5] rounded-xl text-xs font-semibold">
                  {statusMsg}
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full sm:w-auto flex-1 py-4 px-8 bg-gradient-to-r from-[#B298E7] via-[#F5B8D5] to-[#B8E3E9] text-[#0c0e17] font-black rounded-xl shadow-xl hover:brightness-105 transition-all active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 text-sm cursor-pointer"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-[#0c0e17]/30 border-t-[#0c0e17] rounded-full animate-spin" />
                      <span>Saving to Supabase profiles...</span>
                    </>
                  ) : (
                    <span>Save & Enter Platform →</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => navigate(role === 'employer' ? '/jobs' : '/dashboard')}
                  className="w-full sm:w-auto px-6 py-4 bg-[#0c0e17] hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-xl text-sm font-bold transition-all cursor-pointer"
                >
                  Skip for Now
                </button>
              </div>

            </form>
          </div>

        </div>
      </div>
    </div>
  );
}
