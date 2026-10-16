import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { getAnalysisHistory, getSavedJobs } from '../services/persistenceService';

export default function CandidateHome() {
  const navigate = useNavigate();
  const context = useOutletContext() || {};
  const {
    profile,
    session,
    isAuthenticated,
    isGuestPreview,
    setIsGuestPreview,
    openAuth,
  } = context;

  // Real user activity stats
  const [history, setHistory] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);
  const [practiceResults, setPracticeResults] = useState([]);

  // Load real user activity from storage / Supabase
  useEffect(() => {
    async function loadActivity() {
      try {
        const [h, sj] = await Promise.all([
          getAnalysisHistory(),
          getSavedJobs()
        ]);
        setHistory(h || []);
        setSavedJobs(sj || []);

        const userId = profile?.id || session?.user?.id || 'demo';
        const rawPractice = localStorage.getItem(`bridgeiq_practice_results_${userId}`);
        if (rawPractice) {
          setPracticeResults(JSON.parse(rawPractice));
        }
      } catch (err) {
        console.warn('Could not load candidate activity metrics:', err);
      }
    }

    loadActivity();
  }, [profile, session]);

  // Derived user details
  const userName = isAuthenticated
    ? (profile?.full_name || profile?.first_name || session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0] || 'Candidate')
    : (isGuestPreview ? 'Guest Candidate' : 'Visitor');
  
  const targetRoles = useMemo(() => {
    if (Array.isArray(profile?.target_roles) && profile.target_roles.length > 0) {
      return profile.target_roles;
    }
    if (profile?.target_role && profile.target_role.trim()) {
      return [profile.target_role.trim()];
    }
    return [];
  }, [profile]);

  const [activeRoleIndex, setActiveRoleIndex] = useState(0);
  const targetRole = targetRoles[activeRoleIndex] || profile?.target_role || '';
  const hasJobRole = Boolean(targetRole && targetRole.trim());

  // 12-Week Roadmap Progress Calculation
  const roadmapProgress = useMemo(() => {
    const userId = profile?.id || session?.user?.id || 'demo';
    const saved = localStorage.getItem(`bridgeiq_roadmap_progress_${userId}`);
    if (!saved) return 25;
    try {
      const parsed = JSON.parse(saved);
      const totalChecked = Object.values(parsed).filter(Boolean).length;
      return Math.min(100, Math.round((totalChecked / 24) * 100)) || 25;
    } catch {
      return 25;
    }
  }, [profile, session]);

  // Real Profile Completeness Metric
  const profileCompleteness = useMemo(() => {
    if (!profile) return isAuthenticated ? 25 : 10;
    const coreFields = [
      'first_name',
      'email',
      'contact_number',
      'target_role',
      'college_name',
      'degree',
      'city',
      'cgpa',
      'skills'
    ];
    let filled = 0;
    coreFields.forEach((f) => {
      if (profile[f] && String(profile[f]).trim()) filled++;
    });
    return Math.round((filled / coreFields.length) * 100);
  }, [profile, isAuthenticated]);

  // Best Match Score from Gap Analysis History
  const bestMatchScore = useMemo(() => {
    if (history.length === 0) return null;
    let highest = 0;
    history.forEach((item) => {
      const score = item.data?.overall_match_percentage || item.match_percentage || item.score;
      if (score && score > highest) highest = score;
    });
    return highest > 0 ? highest : null;
  }, [history]);

  // Practice Assessment Stats
  const l1TestsCompleted = practiceResults.length;
  const avgPracticeScore = useMemo(() => {
    if (practiceResults.length === 0) return 0;
    const sum = practiceResults.reduce((acc, curr) => acc + (curr.percentage || curr.score || 0), 0);
    return Math.round(sum / practiceResults.length);
  }, [practiceResults]);

  const handleAddJobRole = () => {
    navigate('/candidate/profile', { state: { activeTab: 3 } });
  };

  // =========================================================================
  // VIEW A: UNAUTHENTICATED SIGN-IN REQUIRED GATE
  // =========================================================================
  if (!isAuthenticated && !isGuestPreview) {
    return (
      <div className="max-w-4xl mx-auto py-8 space-y-8 animate-in fade-in duration-300">
        
        {/* Auth Gate Hero Banner */}
        <div className="rounded-3xl bg-gradient-to-br from-[#121626] via-[#161c30] to-[#121626] border border-[#B298E7]/40 p-8 sm:p-12 shadow-2xl relative overflow-hidden text-center sm:text-left">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-[#B298E7]/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#B298E7]/15 border border-[#B298E7]/35 text-[#B298E7] text-xs font-bold uppercase tracking-wider mb-6">
            <span>🔒</span>
            <span>Authentication Required</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight mb-4">
            Sign In to Access Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#B298E7] via-[#F5B8D5] to-[#B8E3E9]">Candidate Portal.</span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base max-w-2xl leading-relaxed mb-8">
            Your candidate dashboard is personalized to your career progress. Sign in to track your skill gap benchmarks, complete Level 1, 2, and 3 curriculum assessments, take practice tests, and save target job roles.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <button
              type="button"
              onClick={() => openAuth ? openAuth('login', 'candidate') : navigate('/')}
              className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-[#B298E7] via-[#F5B8D5] to-[#B8E3E9] text-[#0c0e17] font-black text-sm uppercase tracking-wider rounded-xl shadow-lg shadow-[#B298E7]/25 hover:brightness-105 transition-all cursor-pointer active:scale-95"
            >
              Sign In to Your Account
            </button>

            <button
              type="button"
              onClick={() => navigate('/candidate/signup')}
              className="w-full sm:w-auto px-6 py-3.5 bg-[#0c0e17] border border-[#B8E3E9]/40 text-[#B8E3E9] font-bold text-sm rounded-xl hover:bg-[#161c30] transition-colors cursor-pointer"
            >
              Create Free Account
            </button>

            <button
              type="button"
              onClick={() => setIsGuestPreview(true)}
              className="w-full sm:w-auto px-4 py-3.5 text-xs text-slate-400 hover:text-white font-semibold underline underline-offset-4 cursor-pointer"
            >
              Continue in Demo Mode →
            </button>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#121626] border border-[#1f2742] rounded-2xl p-6 shadow-xl space-y-3">
            <div className="w-12 h-12 rounded-xl bg-[#B8E3E9]/15 text-[#B8E3E9] flex items-center justify-center text-2xl font-black">
              📊
            </div>
            <h3 className="text-base font-bold text-white">AI Skill Gap Benchmarking</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Upload job descriptions or pick live market roles to identify missing tech proficiencies with high-precision AI matching.
            </p>
          </div>

          <div className="bg-[#121626] border border-[#1f2742] rounded-2xl p-6 shadow-xl space-y-3">
            <div className="w-12 h-12 rounded-xl bg-[#B298E7]/15 text-[#B298E7] flex items-center justify-center text-2xl font-black">
              🎯
            </div>
            <h3 className="text-base font-bold text-white">3-Tier Assessment Levels</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Move step-by-step from foundational coding concepts (L1) to specialized competencies (L2) and system architecture (L3).
            </p>
          </div>

          <div className="bg-[#121626] border border-[#1f2742] rounded-2xl p-6 shadow-xl space-y-3">
            <div className="w-12 h-12 rounded-xl bg-[#F5B8D5]/15 text-[#F5B8D5] flex items-center justify-center text-2xl font-black">
              🌐
            </div>
            <h3 className="text-base font-bold text-white">Live Market Sync</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Save opportunities into your target wishlist and test your readiness before submitting direct applications.
            </p>
          </div>
        </div>

      </div>
    );
  }

  // =========================================================================
  // VIEW B: AUTHENTICATED REAL USER PROGRESS DASHBOARD
  // =========================================================================
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* 1. Greeting & User Status Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
              isAuthenticated 
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' 
                : 'bg-[#B298E7]/15 text-[#B298E7] border border-[#B298E7]/30'
            }`}>
              {isAuthenticated ? '● Verified Candidate' : '● Demo Preview Mode'}
            </span>
            {isGuestPreview && (
              <span className="text-[11px] text-slate-400">
                (Sign in to save your personal metrics)
              </span>
            )}
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-100 tracking-tight">
            Welcome Back, <span className="bg-gradient-to-r from-[#B298E7] via-[#F5B8D5] to-[#B8E3E9] bg-clip-text text-transparent">{userName}</span>
          </h1>
          <p className="text-slate-400 text-sm max-w-3xl leading-relaxed">
            Monitor your skill assessments, keep your target profile aligned, and track your progress across all 3 competency levels.
          </p>
        </div>

        {/* Profile Completeness Pill Card */}
        <div className="bg-[#121626] border border-slate-800 rounded-2xl p-4 min-w-[220px] shadow-lg">
          <div className="flex items-center justify-between text-xs font-bold mb-1.5">
            <span className="text-slate-400">Profile Readiness</span>
            <span className="text-[#B8E3E9] font-black">{profileCompleteness}%</span>
          </div>
          <div className="w-full bg-[#0c0e17] rounded-full h-2 overflow-hidden border border-slate-800">
            <div 
              className="bg-gradient-to-r from-[#B298E7] to-[#B8E3E9] h-full rounded-full transition-all duration-500"
              style={{ width: `${profileCompleteness}%` }}
            />
          </div>
          <div className="mt-2 text-right">
            <button
              onClick={() => navigate('/candidate/profile')}
              className="text-[11px] text-slate-400 hover:text-white font-bold cursor-pointer"
            >
              {profileCompleteness < 100 ? 'Complete Profile →' : 'View Profile Details →'}
            </button>
          </div>
        </div>
      </div>

      {/* 2. Multi-Target Role Action Bar */}
      <div className="rounded-2xl bg-gradient-to-r from-[#121626] via-[#161c30] to-[#121626] border border-[#B298E7]/35 p-5 sm:p-6 shadow-xl flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#B298E7]/15 border border-[#B298E7]/30 text-[#B298E7] flex items-center justify-center text-2xl flex-shrink-0 shadow-inner">
              🎯
            </div>
            <div>
              <p className="text-sm sm:text-base font-bold text-slate-100">
                {hasJobRole
                  ? `Active Target Track: ${targetRole}`
                  : 'Configure your target job roles in My Profile to unlock customized assessments & roadmap.'}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                {hasJobRole
                  ? `You are tracking ${targetRoles.length} target role${targetRoles.length > 1 ? 's' : ''}. Your assessments and roadmaps calibrate to your active track.`
                  : 'Setting your specializations will activate tailored quizzes and 12-week roadmaps.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAddJobRole}
            className="px-5 py-2.5 bg-gradient-to-r from-[#B298E7] via-[#F5B8D5] to-[#F9BEDD] hover:from-[#B8E3E9] hover:to-[#B298E7] text-[#0c0e17] font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-[#B298E7]/25 transition-all flex items-center gap-2 cursor-pointer active:scale-95 whitespace-nowrap"
          >
            <span>{hasJobRole ? 'Manage Target Roles' : 'Select Target Roles'}</span>
            <span>→</span>
          </button>
        </div>

        {/* Multi-Role Switcher Pills */}
        {targetRoles.length > 0 && (
          <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
              Switch Track:
            </span>
            {targetRoles.map((role, idx) => {
              const isActive = idx === activeRoleIndex;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveRoleIndex(idx)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-[#B298E7] text-[#0c0e17] shadow-md shadow-[#B298E7]/20 font-black'
                      : 'bg-[#0c0e17] border border-slate-700 text-slate-300 hover:text-white hover:border-[#B298E7]/50'
                  }`}
                >
                  {isActive && <span>✓</span>}
                  <span>{role}</span>
                  {idx === 0 && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-black ${isActive ? 'bg-[#0c0e17]/20 text-[#0c0e17]' : 'bg-[#B8E3E9]/20 text-[#B8E3E9]'}`}>
                      Primary
                    </span>
                  )}
                </button>
              );
            })}
            <button
              type="button"
              onClick={handleAddJobRole}
              className="px-2.5 py-1 rounded-xl text-xs font-semibold text-[#B8E3E9] border border-dashed border-[#B8E3E9]/40 hover:bg-[#B8E3E9]/10 transition-colors cursor-pointer"
            >
              + Add Role
            </button>
          </div>
        )}
      </div>

      {/* 3. 4-Column Live KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        
        {/* KPI 1: Target Role */}
        <div className="bg-[#121626] border border-[#1f2742] rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-2">
            <span>Specialization</span>
            <span className="text-base">💼</span>
          </div>
          <div className="text-base sm:text-lg font-black text-white truncate" title={targetRole || 'Not Set'}>
            {targetRole || 'Not Selected'}
          </div>
          <div className="text-[11px] text-[#B8E3E9] font-medium mt-1">
            {hasJobRole ? 'Active Curriculum' : 'Setup required'}
          </div>
        </div>

        {/* KPI 2: Gap Analyses Run */}
        <div className="bg-[#121626] border border-[#1f2742] rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-2">
            <span>Skill Gap Reports</span>
            <span className="text-base">📊</span>
          </div>
          <div className="text-2xl font-black text-white">
            {history.length}
          </div>
          <div className="text-[11px] text-slate-400 font-medium mt-1">
            {bestMatchScore ? `Top Match: ${bestMatchScore}%` : 'No analyses yet'}
          </div>
        </div>

        {/* KPI 3: Practice Tests Taken */}
        <div className="bg-[#121626] border border-[#1f2742] rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-2">
            <span>Practice Tests</span>
            <span className="text-base">📝</span>
          </div>
          <div className="text-2xl font-black text-white">
            {l1TestsCompleted}
          </div>
          <div className="text-[11px] text-emerald-400 font-medium mt-1">
            {l1TestsCompleted > 0 ? `Avg Score: ${avgPracticeScore}%` : 'Ready to start'}
          </div>
        </div>

        {/* KPI 4: Saved Live Market Jobs */}
        <div className="bg-[#121626] border border-[#1f2742] rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold mb-2">
            <span>Job Wishlist</span>
            <span className="text-base">⭐</span>
          </div>
          <div className="text-2xl font-black text-white">
            {savedJobs.length}
          </div>
          <div className="text-[11px] text-[#F5B8D5] font-medium mt-1">
            <button onClick={() => navigate('/jobs')} className="underline hover:text-white cursor-pointer">
              Browse Market →
            </button>
          </div>
        </div>

      </div>

      {/* Personalized 12-Week AI Learning Roadmap Showcase */}
      <div className="rounded-3xl bg-gradient-to-br from-[#121626] via-[#161c30] to-[#121626] border border-[#B8E3E9]/30 p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-56 h-56 bg-[#B8E3E9]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#B8E3E9]/15 border border-[#B8E3E9]/35 text-[#B8E3E9] text-xs font-bold uppercase tracking-wider">
              <span>🚀 Personalized Career Trajectory</span>
              <span>•</span>
              <span>12 Weeks</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white">
              AI Learning Roadmap: <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#B8E3E9] via-[#B298E7] to-[#F5B8D5]">{targetRole || 'Full-Stack Software Engineering'}</span>
            </h2>

            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Step-by-step curriculum customized for your career path. Covers foundational computer science, intermediate frameworks, production cloud architecture, and capstone deployment.
            </p>

            {/* 3 Phases Badges */}
            <div className="pt-2 flex flex-wrap gap-2 text-xs">
              <span className="px-3 py-1 rounded-lg bg-[#0c0e17] border border-[#B8E3E9]/30 text-[#B8E3E9] font-semibold">
                Phase 1: Foundations (W1-W4)
              </span>
              <span className="px-3 py-1 rounded-lg bg-[#0c0e17] border border-[#B298E7]/30 text-[#B298E7] font-semibold">
                Phase 2: Frameworks (W5-W8)
              </span>
              <span className="px-3 py-1 rounded-lg bg-[#0c0e17] border border-[#F5B8D5]/30 text-[#F5B8D5] font-semibold">
                Phase 3: Production (W9-W12)
              </span>
            </div>
          </div>

          {/* Action & Progress Card */}
          <div className="bg-[#0c0e17]/80 border border-slate-800 rounded-2xl p-5 min-w-[260px] flex flex-col justify-between gap-4 shadow-xl">
            <div>
              <div className="flex items-center justify-between text-xs font-bold mb-2">
                <span className="text-slate-400">Curriculum Progress</span>
                <span className="text-[#B8E3E9] font-black">{roadmapProgress}%</span>
              </div>
              <div className="w-full bg-[#121626] rounded-full h-2.5 overflow-hidden border border-slate-800">
                <div 
                  className="bg-gradient-to-r from-[#B8E3E9] via-[#B298E7] to-[#F5B8D5] h-full rounded-full transition-all duration-500"
                  style={{ width: `${roadmapProgress}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-2 font-medium">
                Milestones completed & synced with assessment scorecards
              </p>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => navigate('/candidate/roadmap')}
                className="w-full py-3 bg-gradient-to-r from-[#B298E7] via-[#F5B8D5] to-[#B8E3E9] text-[#0c0e17] font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-[#B298E7]/25 hover:brightness-105 transition-all text-center cursor-pointer active:scale-95"
              >
                Open Full 12-Week Roadmap →
              </button>
              <button
                type="button"
                onClick={() => navigate('/candidate/practice')}
                className="w-full py-2 bg-[#121626] border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white text-xs font-bold rounded-xl transition-colors text-center cursor-pointer"
              >
                Take Skills Assessment ↗
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Section Title */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 pt-2">
        <h2 className="text-xl sm:text-2xl font-black text-slate-100">
          Your Assessment Levels
        </h2>
        <span className="text-xs font-semibold text-[#B8E3E9]">
          {l1TestsCompleted > 0
            ? `${l1TestsCompleted} assessment(s) evaluated • Continuous benchmark active`
            : '3 levels available • Start Level 1 to build your scorecard'}
        </span>
      </div>

      {/* 5. 3-Column Dynamic Assessment Levels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Level 1 (Easy / Foundational) - Aqua Highlight #B8E3E9 */}
        <div className="bg-[#121626] border border-[#1f2742] hover:border-[#B8E3E9]/50 rounded-2xl p-6 shadow-xl transition-all duration-300 flex flex-col justify-between group">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="px-3 py-1 rounded-full bg-[#B8E3E9]/15 border border-[#B8E3E9]/35 text-[#B8E3E9] text-xs font-bold uppercase tracking-wider">
                Level 1
              </span>
              <span className="text-xs font-semibold text-slate-400">
                Foundational
              </span>
            </div>

            <h3 className="text-lg font-bold text-slate-100 group-hover:text-[#B8E3E9] transition-colors mb-2">
              Core CS & Programming Fundamentals
            </h3>

            {/* Dynamic Status Badge */}
            <div className="my-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0c0e17] border border-[#1f2742] text-xs font-semibold">
              <span className={`w-2 h-2 rounded-full ${l1TestsCompleted > 0 ? 'bg-emerald-400 animate-pulse' : 'bg-[#B8E3E9]'}`} />
              <span className={l1TestsCompleted > 0 ? 'text-emerald-400 font-bold' : 'text-slate-300'}>
                {l1TestsCompleted > 0 ? `${l1TestsCompleted} Completed (${avgPracticeScore}%)` : 'Ready to Start Diagnostic'}
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed mb-6">
              Evaluates fundamental data structures, algorithms, syntax proficiency, and problem-solving basics.
            </p>
          </div>

          <div className="pt-4 border-t border-[#1f2742] space-y-3">
            <button
              type="button"
              onClick={() => navigate('/candidate/practice')}
              className="w-full py-2 bg-[#0c0e17] border border-[#B8E3E9]/40 hover:border-[#B8E3E9] hover:bg-[#161c30] text-[#B8E3E9] text-xs font-black rounded-xl transition-all cursor-pointer shadow-sm text-center"
            >
              {l1TestsCompleted > 0 ? 'Retake Practice Quiz ↗' : 'Start Level 1 Diagnostic ↗'}
            </button>
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
              <span>Diagnostic Test: 3 Questions</span>
              <span className="text-[#B8E3E9] font-bold">L1 Core</span>
            </div>
          </div>
        </div>

        {/* Level 2 (Intermediate) - Lavender Highlight #B298E7 */}
        <div className="bg-[#121626] border border-[#1f2742] hover:border-[#B298E7]/50 rounded-2xl p-6 shadow-xl transition-all duration-300 flex flex-col justify-between group">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="px-3 py-1 rounded-full bg-[#B298E7]/15 border border-[#B298E7]/35 text-[#B298E7] text-xs font-bold uppercase tracking-wider">
                Level 2
              </span>
              <span className="text-xs font-semibold text-slate-400">
                Intermediate
              </span>
            </div>

            <h3 className="text-lg font-bold text-slate-100 group-hover:text-[#B298E7] transition-colors mb-2">
              Specialized Competency & Frameworks
            </h3>

            {/* Dynamic Status Badge */}
            <div className="my-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0c0e17] border border-[#1f2742] text-xs font-semibold">
              <span className={`w-2 h-2 rounded-full ${hasJobRole ? 'bg-[#B298E7]' : 'bg-slate-500'}`} />
              <span className={hasJobRole ? 'text-[#B298E7] font-bold' : 'text-slate-400'}>
                {hasJobRole ? `Track: ${targetRole}` : 'Role Setup Needed'}
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed mb-6">
              {hasJobRole 
                ? `Calibrated for ${targetRole}: Evaluates component architecture, state management, REST APIs, and database transactions.`
                : 'Choose your target role in My Profile to generate specialized framework assessments.'}
            </p>
          </div>

          <div className="pt-4 border-t border-[#1f2742] space-y-3">
            <button
              type="button"
              onClick={hasJobRole ? () => navigate('/candidate/practice') : handleAddJobRole}
              className="w-full py-2 bg-[#0c0e17] border border-[#B298E7]/40 hover:border-[#B298E7] hover:bg-[#161c30] text-[#B298E7] text-xs font-black rounded-xl transition-all cursor-pointer shadow-sm text-center"
            >
              {hasJobRole ? 'Take Framework Assessment ↗' : 'Configure Role in Profile →'}
            </button>
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
              <span>Framework Competency</span>
              <span className="text-[#B298E7] font-bold">L2 Applied</span>
            </div>
          </div>
        </div>

        {/* Level 3 (Expert) - Rose Highlight #F5B8D5 */}
        <div className="bg-[#121626] border border-[#1f2742] hover:border-[#F5B8D5]/50 rounded-2xl p-6 shadow-xl transition-all duration-300 flex flex-col justify-between group">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="px-3 py-1 rounded-full bg-[#F5B8D5]/15 border border-[#F5B8D5]/35 text-[#F5B8D5] text-xs font-bold uppercase tracking-wider">
                Level 3
              </span>
              <span className="text-xs font-semibold text-slate-400">
                Expert
              </span>
            </div>

            <h3 className="text-lg font-bold text-slate-100 group-hover:text-[#F5B8D5] transition-colors mb-2">
              Advanced System Architecture
            </h3>

            {/* Dynamic Status Badge */}
            <div className="my-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0c0e17] border border-[#1f2742] text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#F5B8D5]" />
              <span className="text-slate-300">
                Production Readiness Benchmark
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed mb-6">
              Microservices scalability, cloud infrastructure (Docker/AWS), CI/CD pipelines, security, and high-concurrency design.
            </p>
          </div>

          <div className="pt-4 border-t border-[#1f2742] space-y-3">
            <button
              type="button"
              onClick={() => navigate('/analyzer')}
              className="w-full py-2 bg-[#0c0e17] border border-[#F5B8D5]/40 hover:border-[#F5B8D5] hover:bg-[#161c30] text-[#F5B8D5] text-xs font-black rounded-xl transition-all cursor-pointer shadow-sm text-center"
            >
              Run Architecture Gap Analysis ↗
            </button>
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
              <span>Production Capstone</span>
              <span className="text-[#F5B8D5] font-bold">L3 Master</span>
            </div>
          </div>
        </div>

      </div>

      {/* 6. Recent Gap Analysis & Activity History */}
      {history.length > 0 && (
        <div className="rounded-3xl bg-[#121626] p-6 sm:p-8 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg sm:text-xl font-black text-white">
              Recent Skill Gap Analyses
            </h3>
            <button
              onClick={() => navigate('/analyzer')}
              className="text-xs font-bold text-[#B8E3E9] hover:underline cursor-pointer"
            >
              + New Analysis
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {history.slice(0, 4).map((item, idx) => {
              const data = item.data || item;
              const roleTitle = data.target_role || data.job_title || 'Software Role';
              const match = data.overall_match_percentage || data.match_percentage || 75;
              const date = item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Recent';

              return (
                <div key={item.id || idx} className="p-4 rounded-2xl bg-[#0c0e17] border border-slate-800 flex items-center justify-between">
                  <div className="min-w-0 pr-4">
                    <h4 className="text-sm font-bold text-white truncate">{roleTitle}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Analyzed on {date}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="px-2.5 py-1 rounded-lg bg-[#B298E7]/15 border border-[#B298E7]/30 text-[#B298E7] text-xs font-black">
                      {match}% Match
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 7. Institutional Sync Footer */}
      <div className="p-4 rounded-xl bg-[#121626] border border-[#1f2742] text-xs text-slate-400 flex items-center gap-3">
        <span className="text-[#B298E7] text-base">📌</span>
        <span>
          Assessment links are automatically dispatched by your campus placement office. Ensure your contact details and resume in My Profile are verified.
        </span>
      </div>

    </div>
  );
}
