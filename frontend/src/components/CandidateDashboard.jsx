import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import { upsertUserProfile } from '../lib/auth';
import { getAnalysisHistory, getSavedJobs, removeJobBookmark } from '../services/persistenceService';
import { useToast } from '../context/ToastContext';
import LearningRoadmap from './LearningRoadmap';

export default function CandidateDashboard({ profile, session, onProfileUpdated }) {
  const navigate = useNavigate();
  const { addToast } = useToast() || { addToast: () => {} };

  // Profile data
  const [localProfile, setLocalProfile] = useState(null);
  const userProfile = localProfile || profile;

  const [history, setHistory] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);

  // Skill Assessment State
  const defaultSkills = ['React', 'Python', 'Node.js', 'TypeScript', 'Docker', 'AWS', 'PostgreSQL'];
  const userSkillList = Array.isArray(userProfile?.skills)
    ? userProfile.skills
    : typeof userProfile?.skills === 'string'
    ? userProfile.skills.split(',').map((s) => s.trim()).filter(Boolean)
    : defaultSkills;

  // Combine user skills with popular skills for the dropdown
  const availableTestSkills = Array.from(
    new Set([
      ...userSkillList.map((s) => s.replace(/\s*\(Verified\)/gi, '').trim()),
      'React',
      'Python',
      'Node.js',
      'TypeScript',
      'Docker',
      'AWS',
      'PostgreSQL',
    ])
  ).filter(Boolean);

  const [selectedSkill, setSelectedSkill] = useState(availableTestSkills[0] || 'React');
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [quizLoading, setQuizLoading] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [showLearningRoadmap, setShowLearningRoadmap] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const h = await getAnalysisHistory();
        const sj = await getSavedJobs();
        setHistory(h || []);
        setSavedJobs(sj || []);
      } catch (err) {
        console.warn('Error loading dashboard history:', err);
      }
    }
    loadData();
  }, []);

  const handleRemoveBookmark = async (jobId) => {
    await removeJobBookmark(jobId);
    setSavedJobs((prev) => prev.filter((j) => (j.data?.job_id || j.id) !== jobId && j.job_id !== jobId));
    addToast('Job removed from wishlist', 'info');
  };

  // Open Quiz Modal & Fetch Questions from POST /api/generate-quiz
  const handleStartQuiz = async () => {
    setIsQuizModalOpen(true);
    setQuizLoading(true);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setQuizSubmitted(false);
    setQuizScore(0);

    try {
      const response = await fetch(`${API_BASE_URL}/api/generate-quiz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skill: selectedSkill }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch quiz: ${response.statusText}`);
      }

      const data = await response.json();
      if (data?.questions && data.questions.length > 0) {
        setQuizQuestions(data.questions);
      } else {
        throw new Error('No questions returned from quiz service');
      }
    } catch (err) {
      console.warn('Backend quiz API call fallback:', err);
      // Client-side backup questions to ensure user is never blocked
      setQuizQuestions([
        {
          id: 1,
          question: `What is a primary architectural design principle in ${selectedSkill}?`,
          options: [
            'Tight coupling and global mutable state',
            'Separation of concerns and modular component design',
            'Writing all logic into a single monolithic script',
            'Skipping error handling and exception logging',
          ],
          correct_answer: 'Separation of concerns and modular component design',
          explanation: 'Decoupling application boundaries ensures scalable maintenance and unit testability.',
        },
        {
          id: 2,
          question: `How should high-throughput asynchronous operations be handled in ${selectedSkill}?`,
          options: [
            'Busy-waiting polling loops',
            'Non-blocking event-driven paradigms, promises, or async pipelines',
            'Pausing the runtime process thread',
            'Synchronous blocking I/O calls exclusively',
          ],
          correct_answer: 'Non-blocking event-driven paradigms, promises, or async pipelines',
          explanation: 'Non-blocking execution maximizes resource utilization without freezing execution loops.',
        },
        {
          id: 3,
          question: `Which methodology is considered industry standard for managing dependencies in ${selectedSkill}?`,
          options: [
            'Unpinned wildcard imports from third-party CDNs',
            'Semantic version locking and regular automated CVE vulnerability scanning',
            'Manually copying source code from developer forums',
            'Disabling security checksum verification',
          ],
          correct_answer: 'Semantic version locking and regular automated CVE vulnerability scanning',
          explanation: 'Lockfiles and automated audit checks safeguard systems against supply-chain vulnerabilities.',
        },
        {
          id: 4,
          question: `When optimizing performance in ${selectedSkill}, what is the first recommended step?`,
          options: [
            'Prematurely rewriting algorithms without telemetry',
            'Benchmarking and profiling with telemetry data to isolate actual bottlenecks',
            'Increasing server memory without investigation',
            'Disabling logging and monitoring',
          ],
          correct_answer: 'Benchmarking and profiling with telemetry data to isolate actual bottlenecks',
          explanation: 'Empirical profiling identifies hotspots so engineers optimize code with measurable impact.',
        },
        {
          id: 5,
          question: `What is the best practice for deploying and monitoring production services utilizing ${selectedSkill}?`,
          options: [
            'Manual unversioned FTP transfers to live hosts',
            'Automated CI/CD pipelines with canary rollouts and health check alarms',
            'Deploying uncommitted local changes directly',
            'Turning off alerting systems during business hours',
          ],
          correct_answer: 'Automated CI/CD pipelines with canary rollouts and health check alarms',
          explanation: 'Continuous integration and health metrics ensure reliable releases and zero-downtime rollouts.',
        },
      ]);
    } finally {
      setQuizLoading(false);
    }
  };

  const handleSelectOption = (questionId, option) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: option,
    }));
  };

  // Submit Quiz and Evaluate Score
  const handleQuizSubmit = async () => {
    let correctCount = 0;
    quizQuestions.forEach((q) => {
      if (selectedAnswers[q.id] === q.correct_answer) {
        correctCount += 1;
      }
    });

    const percentage = Math.round((correctCount / quizQuestions.length) * 100);
    setQuizScore(percentage);
    setQuizSubmitted(true);

    if (percentage >= 80) {
      addToast(`🎉 Congratulations! You scored ${percentage}% on ${selectedSkill}!`, 'success');

      // Update skills in Supabase profiles table to mark [Skill Name] (Verified)
      try {
        const verifiedTag = `${selectedSkill} (Verified)`;
        let currentSkills = Array.isArray(userProfile?.skills)
          ? [...userProfile.skills]
          : typeof userProfile?.skills === 'string'
          ? userProfile.skills.split(',').map((s) => s.trim()).filter(Boolean)
          : [];

        // Remove unverified version and add verified tag
        currentSkills = currentSkills.filter(
          (s) => s.toLowerCase() !== selectedSkill.toLowerCase() && s.toLowerCase() !== verifiedTag.toLowerCase()
        );
        currentSkills.unshift(verifiedTag);

        const updatedProfile = {
          ...userProfile,
          id: userProfile?.id || session?.user?.id || 'candidate-' + Date.now(),
          skills: currentSkills,
          is_completed: true,
        };

        // Persist via upsert helper
        const result = await upsertUserProfile(updatedProfile);
        setLocalProfile(result);
        onProfileUpdated?.(result);

        addToast(`${verifiedTag} badge has been attached to your profile!`, 'success');
      } catch (err) {
        console.error('Error updating verified skill in profile:', err);
      }
    } else {
      addToast(`You scored ${percentage}%. 80% is required to earn the Verified badge. Try again!`, 'info');
    }
  };

  // Extract verified skills
  const verifiedSkills = (Array.isArray(userProfile?.skills) ? userProfile.skills : userSkillList).filter((s) =>
    s.includes('(Verified)')
  );

  const targetRole = userProfile?.target_role || 'Senior Full-Stack Engineer';
  const matchScore = history[0]?.data?.match_percentage || 85;

  return (
    <div className="space-y-10 animate-in fade-in duration-500 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* SECTION 1: Skill Summary Header */}
      <div className="relative overflow-hidden rounded-3xl bg-[#121626]/95 backdrop-blur-2xl border border-slate-800 shadow-2xl p-6 sm:p-8 text-white">
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-[#B298E7]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-[#B8E3E9]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#B298E7]/10 border border-[#B298E7]/30 text-[#B298E7] text-xs font-bold tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-[#B8E3E9] animate-pulse" />
              Candidate Career Hub
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              {userProfile?.full_name || 'Engineering Candidate'}
            </h1>
            <p className="text-slate-400 text-sm font-medium flex items-center gap-2">
              <span>Target Role:</span>
              <span className="text-[#B8E3E9] font-bold bg-[#B8E3E9]/15 px-2.5 py-0.5 rounded-lg border border-[#B8E3E9]/30">
                {targetRole}
              </span>
            </p>
          </div>

          {/* Match Score Badge */}
          <div className="flex items-center gap-4 bg-[#0c0e17] p-4 rounded-2xl border border-slate-800 shadow-inner">
            <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#B298E7] to-[#B8E3E9] text-[#0c0e17] font-black text-2xl shadow-lg">
              {matchScore}%
            </div>
            <div>
              <div className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                Market Match Score
              </div>
              <div className="text-sm font-bold text-slate-200">
                Calibrated to Active Postings
              </div>
            </div>
          </div>
        </div>

        {/* Verified Skill Badges Banner */}
        <div className="mt-8 pt-6 border-t border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <span>Verified Skill Accreditations</span>
              <span className="px-2 py-0.5 rounded-full bg-[#B298E7]/20 text-[#B298E7] text-[10px] font-bold">
                {verifiedSkills.length} Verified
              </span>
            </span>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {verifiedSkills.length > 0 ? (
              verifiedSkills.map((s, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#B8E3E9]/15 border border-[#B8E3E9]/40 text-[#B8E3E9] text-xs font-bold shadow-md animate-in fade-in"
                >
                  <span className="text-sm">🛡️</span>
                  <span>{s}</span>
                </span>
              ))
            ) : (
              <div className="text-xs text-slate-400 italic flex items-center gap-2">
                <span>No verified skills yet.</span>
                <span className="text-[#B8E3E9] font-medium">Take an MCQ Assessment below to earn your first verified badge!</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 2: Skill Assessment & MCQ Testing Module */}
      <div className="rounded-3xl bg-[#121626]/95 backdrop-blur-2xl border border-slate-800 shadow-2xl p-6 sm:p-8 text-white relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-800">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#B298E7]/10 border border-[#B298E7]/30 text-[#B298E7] text-xs font-bold">
              <span>⚡ Skill Certification Exam</span>
            </div>
            <h2 className="text-2xl font-black text-white">MCQ Skill Assessment</h2>
            <p className="text-slate-400 text-xs sm:text-sm">
              Take an interactive 5-question test. Score 80% or higher to earn a <span className="text-[#B8E3E9] font-bold">(Verified)</span> badge directly on your public profile.
            </p>
          </div>

          {/* Skill Selector and Start Button */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="w-full sm:w-auto">
              <label htmlFor="skill-selector" className="sr-only">Select Skill</label>
              <select
                id="skill-selector"
                value={selectedSkill}
                onChange={(e) => setSelectedSkill(e.target.value)}
                className="w-full sm:w-48 px-4 py-3 bg-[#0c0e17] border border-slate-800 rounded-xl text-white font-bold text-sm focus:outline-none focus:border-[#B298E7]"
              >
                {availableTestSkills.map((sk) => (
                  <option key={sk} value={sk}>
                    {sk}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleStartQuiz}
              className="w-full sm:w-auto px-5 py-3 bg-gradient-to-r from-[#B298E7] via-[#F5B8D5] to-[#B8E3E9] hover:brightness-105 text-[#0c0e17] font-black text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <span>Quick MCQ Test</span>
              <span>⚡</span>
            </button>

            <button
              onClick={() => navigate('/candidate/practice', { state: { preSelectedSkill: selectedSkill } })}
              className="w-full sm:w-auto px-5 py-3 bg-[#0c0e17] border border-[#B8E3E9]/40 hover:border-[#B8E3E9] text-[#B8E3E9] font-bold text-sm rounded-xl shadow transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <span>Full Practice Center</span>
              <span>↗</span>
            </button>
          </div>
        </div>

        {/* Skills Overview Pills */}
        <div className="pt-6">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            Your Stack Status
          </div>
          <div className="flex flex-wrap gap-2">
            {userSkillList.map((skill, index) => {
              const isVerified = skill.includes('(Verified)');
              const cleanName = skill.replace(/\s*\(Verified\)/gi, '').trim();
              return (
                <div
                  key={index}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 border ${
                    isVerified
                      ? 'bg-[#B8E3E9]/15 border-[#B8E3E9]/40 text-[#B8E3E9]'
                      : 'bg-[#0c0e17] border-slate-800 text-slate-300'
                  }`}
                >
                  <span>{cleanName}</span>
                  {isVerified ? (
                    <span className="text-[#0c0e17] font-black text-[10px] bg-[#B8E3E9] px-1.5 py-0.5 rounded">
                      Verified ✓
                    </span>
                  ) : (
                    <button
                      onClick={() => {
                        setSelectedSkill(cleanName);
                        handleStartQuiz();
                      }}
                      className="text-[#B298E7] hover:text-[#B8E3E9] text-[10px] font-bold underline cursor-pointer"
                    >
                      Verify Now
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* SECTION 3: Quick Navigation Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div
          onClick={() => navigate('/analyzer')}
          className="group cursor-pointer p-6 rounded-3xl bg-[#121626] backdrop-blur-xl border border-slate-800 hover:border-[#B298E7]/40 transition-all duration-300 shadow-xl hover:-translate-y-1"
        >
          <div className="w-12 h-12 rounded-2xl bg-[#B298E7]/15 border border-[#B298E7]/30 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
            📊
          </div>
          <h3 className="text-lg font-bold text-white mb-1 group-hover:text-[#B298E7] transition-colors">
            Skill Gap Analyzer
          </h3>
          <p className="text-slate-400 text-xs leading-relaxed">
            Upload your resume or enter skills to benchmark against real tech job descriptions.
          </p>
        </div>

        <div
          onClick={() => navigate('/jobs')}
          className="group cursor-pointer p-6 rounded-3xl bg-[#121626] backdrop-blur-xl border border-slate-800 hover:border-[#B8E3E9]/40 transition-all duration-300 shadow-xl hover:-translate-y-1"
        >
          <div className="w-12 h-12 rounded-2xl bg-[#B8E3E9]/15 border border-[#B8E3E9]/30 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
            🌐
          </div>
          <h3 className="text-lg font-bold text-white mb-1 group-hover:text-[#B8E3E9] transition-colors">
            Live Job Market
          </h3>
          <p className="text-slate-400 text-xs leading-relaxed">
            Search active engineering roles synced via JSearch API with instant bookmarking.
          </p>
        </div>

        <div
          onClick={() => setShowLearningRoadmap(!showLearningRoadmap)}
          className="group cursor-pointer p-6 rounded-3xl bg-[#121626] backdrop-blur-xl border border-slate-800 hover:border-[#F5B8D5]/40 transition-all duration-300 shadow-xl hover:-translate-y-1"
        >
          <div className="w-12 h-12 rounded-2xl bg-[#F5B8D5]/15 border border-[#F5B8D5]/30 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
            🗺️
          </div>
          <h3 className="text-lg font-bold text-white mb-1 group-hover:text-[#F5B8D5] transition-colors">
            Learning Roadmap
          </h3>
          <p className="text-slate-400 text-xs leading-relaxed">
            Explore 12-week curated development plans to eliminate your identified missing skills.
          </p>
        </div>
      </div>

      {/* SECTION 4: Learning Roadmap Accordion / View */}
      {showLearningRoadmap && (
        <div className="p-6 sm:p-8 rounded-3xl bg-[#121626] shadow-xl border border-slate-800 animate-in fade-in duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-black text-white">12-Week AI Career Roadmap</h3>
            <button
              onClick={() => setShowLearningRoadmap(false)}
              className="text-slate-400 hover:text-white text-sm font-bold cursor-pointer"
            >
              ✕ Close
            </button>
          </div>
          <LearningRoadmap
            missingSkills={history[0]?.data?.missing_tech_skills || ['GraphQL', 'Docker', 'System Architecture']}
            jobTitle={targetRole}
          />
        </div>
      )}

      {/* SECTION 5: Saved Jobs & Wishlist */}
      <div className="rounded-3xl bg-[#121626] p-6 sm:p-8 shadow-xl border border-slate-800 space-y-6">
        <h3 className="text-xl font-black text-white">Saved Job Bookmarks</h3>
        {savedJobs.length === 0 ? (
          <p className="text-slate-400 text-sm italic">
            No saved jobs yet. Search roles on the <button onClick={() => navigate('/jobs')} className="text-[#B8E3E9] font-bold underline cursor-pointer">Live Market</button> to bookmark opportunities.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {savedJobs.map((job) => {
              const data = job.data || job;
              const jobId = data.job_id || job.id;
              return (
                <div key={jobId} className="p-4 rounded-2xl bg-[#0c0e17] border border-slate-800 flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-white text-sm">{data.title || data.job_title}</h4>
                    <p className="text-xs text-slate-400 font-medium">{data.company || data.employer_name} • {data.location || 'Remote'}</p>
                  </div>
                  <button
                    onClick={() => handleRemoveBookmark(jobId)}
                    className="text-xs font-bold text-[#F5B8D5] hover:brightness-125 px-2.5 py-1 rounded-lg bg-[#F5B8D5]/10 border border-[#F5B8D5]/30 cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* QUIZ MODAL */}
      {isQuizModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="relative w-full max-w-2xl bg-[#121626] border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 text-white overflow-hidden">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🎯</span>
                <div>
                  <h3 className="text-lg font-black text-white">
                    {selectedSkill} Technical Assessment
                  </h3>
                  <span className="text-xs text-[#B8E3E9] font-semibold">
                    Score ≥ 80% to earn Verification
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsQuizModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#0c0e17] text-slate-400 hover:text-white flex items-center justify-center text-lg font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* Modal Body */}
            {quizLoading ? (
              <div className="py-16 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-10 h-10 border-4 border-[#B298E7]/20 border-t-[#B298E7] rounded-full animate-spin" />
                <p className="text-slate-300 font-bold text-sm">
                  Generating AI Questions for {selectedSkill}...
                </p>
              </div>
            ) : quizSubmitted ? (
              /* RESULTS SCREEN */
              <div className="py-8 text-center space-y-6 animate-in zoom-in-95 duration-200">
                <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-[#B298E7] to-[#B8E3E9] flex items-center justify-center text-4xl shadow-xl">
                  {quizScore >= 80 ? '🏆' : '📊'}
                </div>

                <div>
                  <h4 className="text-2xl font-black text-white">
                    {quizScore >= 80 ? 'Verification Achieved!' : 'Assessment Completed'}
                  </h4>
                  <p className="text-slate-400 text-sm mt-1">
                    You scored <span className="font-bold text-white">{quizScore}%</span> ({quizQuestions.filter(q => selectedAnswers[q.id] === q.correct_answer).length} / {quizQuestions.length} correct)
                  </p>
                </div>

                {quizScore >= 80 ? (
                  <div className="p-4 rounded-2xl bg-[#B8E3E9]/15 border border-[#B8E3E9]/40 text-[#B8E3E9] text-sm font-semibold max-w-md mx-auto">
                    ✓ {selectedSkill} (Verified) has been appended to your skill credentials.
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-[#F5B8D5]/15 border border-[#F5B8D5]/40 text-[#F5B8D5] text-sm font-semibold max-w-md mx-auto">
                    ⚡ You need 80% to pass. Brush up on {selectedSkill} and take the test again anytime.
                  </div>
                )}

                <div className="flex justify-center gap-3 pt-2">
                  <button
                    onClick={handleStartQuiz}
                    className="px-6 py-2.5 bg-[#0c0e17] hover:bg-slate-900 border border-slate-700 text-white rounded-xl text-sm font-bold transition-all cursor-pointer"
                  >
                    Retry Assessment
                  </button>
                  <button
                    onClick={() => setIsQuizModalOpen(false)}
                    className="px-6 py-2.5 bg-gradient-to-r from-[#B298E7] to-[#B8E3E9] text-[#0c0e17] rounded-xl text-sm font-black shadow-lg transition-all cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              /* QUESTION PRESENTATION */
              <div className="py-6 space-y-6">
                {/* Progress Indicator */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-slate-400">
                    <span>Question {currentQuestionIndex + 1} of {quizQuestions.length}</span>
                    <span>{Math.round(((currentQuestionIndex + 1) / quizQuestions.length) * 100)}%</span>
                  </div>
                  <div className="w-full h-2 bg-[#0c0e17] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#B298E7] via-[#F5B8D5] to-[#B8E3E9] transition-all duration-300"
                      style={{ width: `${((currentQuestionIndex + 1) / quizQuestions.length) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Current Question */}
                {quizQuestions[currentQuestionIndex] && (
                  <div className="space-y-4">
                    <h4 className="text-base sm:text-lg font-bold text-slate-100 leading-relaxed">
                      {quizQuestions[currentQuestionIndex].question}
                    </h4>

                    {/* Options */}
                    <div className="space-y-2.5">
                      {quizQuestions[currentQuestionIndex].options.map((opt, optIdx) => {
                        const qId = quizQuestions[currentQuestionIndex].id;
                        const isChosen = selectedAnswers[qId] === opt;
                        return (
                          <button
                            key={optIdx}
                            type="button"
                            onClick={() => handleSelectOption(qId, opt)}
                            className={`w-full p-4 rounded-xl border text-left text-sm font-medium transition-all flex items-center justify-between cursor-pointer ${
                              isChosen
                                ? 'bg-[#B298E7]/20 border-[#B298E7] text-white shadow-md'
                                : 'bg-[#0c0e17] border-slate-800 text-slate-300 hover:bg-slate-900 hover:border-slate-700'
                            }`}
                          >
                            <span>{opt}</span>
                            <span className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] ${
                              isChosen ? 'border-[#B298E7] bg-[#B298E7] text-[#0c0e17] font-black' : 'border-slate-700'
                            }`}>
                              {isChosen && '✓'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Question Navigation */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    disabled={currentQuestionIndex === 0}
                    onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                    className="px-4 py-2 bg-[#0c0e17] text-slate-400 hover:text-white rounded-xl text-xs font-bold disabled:opacity-40 cursor-pointer"
                  >
                    ← Previous
                  </button>

                  {currentQuestionIndex < quizQuestions.length - 1 ? (
                    <button
                      type="button"
                      disabled={!selectedAnswers[quizQuestions[currentQuestionIndex]?.id]}
                      onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                      className="px-5 py-2.5 bg-[#B298E7] text-[#0c0e17] hover:brightness-105 rounded-xl text-xs font-black disabled:opacity-40 transition-all cursor-pointer"
                    >
                      Next Question →
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={Object.keys(selectedAnswers).length < quizQuestions.length}
                      onClick={handleQuizSubmit}
                      className="px-6 py-2.5 bg-gradient-to-r from-[#B298E7] via-[#F5B8D5] to-[#B8E3E9] hover:brightness-105 text-[#0c0e17] rounded-xl text-xs font-black shadow-lg disabled:opacity-40 transition-all cursor-pointer"
                    >
                      Submit Exam
                    </button>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
