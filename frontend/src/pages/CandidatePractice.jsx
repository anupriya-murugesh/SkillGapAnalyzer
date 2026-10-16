import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation, useOutletContext } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import { useToast } from '../context/ToastContext';

// Comprehensive Fallback Question Bank for offline / instant practice
const DEFAULT_QUESTION_BANK = {
  'React': [
    { id: 1, q: 'What is the primary function of the Virtual DOM in React?', options: ['Directly modifies the browser HTML', 'Keeps a lightweight memory representation to compute minimal DOM diffs', 'Replaces standard JavaScript engine', 'Acts as a remote database cache'], answer: 'Keeps a lightweight memory representation to compute minimal DOM diffs', explanation: 'React reconciles the Virtual DOM with the actual DOM using the fiber reconciliation algorithm to minimize expensive real DOM mutations.' },
    { id: 2, q: 'When does the cleanup function in useEffect run?', options: ['Before every re-render and on component unmount', 'Only when the component mounts', 'Only when an error occurs', 'Synchronously before HTML is painted'], answer: 'Before every re-render and on component unmount', explanation: 'The cleanup function cleans up subscriptions, timers, or event listeners before the effect re-runs or when the component unmounts.' },
    { id: 3, q: 'What is the purpose of React.memo?', options: ['Persists state in localStorage', 'Prevents functional component re-renders if props have not changed', 'Creates an asynchronous worker', 'Binds context across server boundaries'], answer: 'Prevents functional component re-renders if props have not changed', explanation: 'React.memo is a higher-order component that performs a shallow comparison of props to skip unnecessary re-renders.' },
    { id: 4, q: 'Which hook should be used to store a mutable value that does NOT trigger a re-render?', options: ['useState', 'useMemo', 'useRef', 'useCallback'], answer: 'useRef', explanation: 'useRef returns a mutable ref object whose .current property can hold any value without triggering a re-render.' },
    { id: 5, q: 'In React 19, what does the new useActionState hook primarily assist with?', options: ['Managing form actions and async pending states', 'Replacing Redux globally', 'Compiling WebAssembly', 'Optimizing CSS modules'], answer: 'Managing form actions and async pending states', explanation: 'React 19 useActionState manages asynchronous form action transitions, loading indicators, and returned action state automatically.' }
  ],
  'Python': [
    { id: 1, q: 'What is the key difference between a Python list and a tuple?', options: ['Lists are immutable; tuples are mutable', 'Lists are mutable; tuples are immutable', 'Tuples only accept integers', 'Lists cannot be indexed'], answer: 'Lists are mutable; tuples are immutable', explanation: 'Tuples cannot be altered once instantiated, making them memory efficient and hashable as dictionary keys.' },
    { id: 2, q: 'What does the Global Interpreter Lock (GIL) in CPython do?', options: ['Prevents multiple native threads from executing Python bytecodes simultaneously', 'Secures the operating system kernel', 'Limits maximum RAM consumption', 'Encrypts bytecode on disk'], answer: 'Prevents multiple native threads from executing Python bytecodes simultaneously', explanation: 'The GIL is a mutex that protects access to Python objects, preventing race conditions in CPython memory management.' },
    { id: 3, q: 'Which keyword turns a standard Python function into a generator?', options: ['return', 'yield', 'async', 'lambda'], answer: 'yield', explanation: 'Using yield produces a generator iterator that yields values one at a time on demand, optimizing memory for large streams.' },
    { id: 4, q: 'What does the @classmethod decorator do?', options: ['Receives the class (cls) as its first implicit parameter rather than an instance (self)', 'Makes the method private', 'Compiles method to C language', 'Runs method in a background thread'], answer: 'Receives the class (cls) as its first implicit parameter rather than an instance (self)', explanation: 'Class methods are bound to the class rather than an individual instance, commonly used for alternative constructors.' }
  ],
  'SQL': [
    { id: 1, q: 'What does ACID stand for in database transaction management?', options: ['Atomicity, Consistency, Isolation, Durability', 'Access, Control, Identity, Data', 'Asynchronous, Concurrent, Isolated, Distributed', 'Automatic, Cached, Indexed, Dynamic'], answer: 'Atomicity, Consistency, Isolation, Durability', explanation: 'ACID guarantees that database transactions are processed reliably even in the event of power outages or server crashes.' },
    { id: 2, q: 'What is the primary performance benefit of a B-Tree index?', options: ['Provides O(log N) lookup, insertion, and deletion complexity', 'Compresses images inside the database', 'Bypasses database authentication', 'Prevents all SQL injection automatically'], answer: 'Provides O(log N) lookup, insertion, and deletion complexity', explanation: 'B-Tree indexes maintain sorted data and provide balanced logarithmic time lookups for equality and range queries.' },
    { id: 3, q: 'Which JOIN returns all rows from the left table and matched rows from the right table?', options: ['INNER JOIN', 'LEFT JOIN (LEFT OUTER JOIN)', 'FULL OUTER JOIN', 'CROSS JOIN'], answer: 'LEFT JOIN (LEFT OUTER JOIN)', explanation: 'A LEFT JOIN returns all records from the left table, plus any matching records from the right table (with NULLs for unmatched rows).' }
  ],
  'System Design': [
    { id: 1, q: 'What is the CAP Theorem trade-off in distributed systems during network partitions (P)?', options: ['You must choose between Consistency (C) and Availability (A)', 'You must choose between Latency and Security', 'All systems achieve C, A, and P simultaneously', 'Storage capacity is halved'], answer: 'You must choose between Consistency (C) and Availability (A)', explanation: 'When a network partition occurs in a distributed system, you can either return consistent data (and reject reads) or remain available (and return stale data).' },
    { id: 2, q: 'What is the role of a reverse proxy like NGINX?', options: ['Directly renders React JSX on the client browser', 'Sits in front of web servers to distribute traffic, terminate SSL, and cache responses', 'Encrypts hard drives on server hardware', 'Manages database tables and primary keys'], answer: 'Sits in front of web servers to distribute traffic, terminate SSL, and cache responses', explanation: 'A reverse proxy intercepts client requests to handle load balancing, security, SSL termination, and static asset caching.' }
  ]
};

export default function CandidatePractice() {
  const navigate = useNavigate();
  const location = useLocation();
  const context = useOutletContext() || {};
  const { profile, session, onProfileUpdated } = context;
  const { addToast } = useToast() || { addToast: () => {} };

  // Target roles & preselected skill
  const querySkill = new URLSearchParams(location.search).get('skill');
  const preSelectedSkill = location.state?.preSelectedSkill || querySkill || 'React';

  // Skills available for practice tests
  const availableSkills = useMemo(() => {
    const list = ['React', 'Python', 'SQL', 'Node.js', 'TypeScript', 'Docker', 'AWS', 'System Design'];
    if (profile?.skills && Array.isArray(profile.skills)) {
      profile.skills.forEach(s => {
        const clean = s.replace(/\s*\(Verified\)/gi, '').trim();
        if (clean && !list.includes(clean)) list.unshift(clean);
      });
    }
    return list;
  }, [profile]);

  const [selectedSkill, setSelectedSkill] = useState(preSelectedSkill);
  const [selectedLevel, setSelectedLevel] = useState('Level 1: Foundational'); // Level 1, Level 2, Level 3

  // Quiz Execution State
  const [isQuizActive, setIsQuizActive] = useState(false);
  const [quizLoading, setQuizLoading] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [scoreData, setScoreData] = useState(null);
  const [timerSeconds, setTimerSeconds] = useState(0);

  // Scorecards History
  const [historyResults, setHistoryResults] = useState(() => {
    try {
      const userId = profile?.id || session?.user?.id || 'demo';
      const saved = localStorage.getItem(`bridgeiq_practice_results_${userId}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Timer countdown / increment
  useEffect(() => {
    let interval = null;
    if (isQuizActive && !quizSubmitted) {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isQuizActive, quizSubmitted]);

  // Launch Assessment
  const handleStartQuiz = async () => {
    setQuizLoading(true);
    setUserAnswers({});
    setCurrentIdx(0);
    setQuizSubmitted(false);
    setScoreData(null);
    setTimerSeconds(0);

    try {
      // 1. Attempt backend AI generation
      const res = await fetch(`${API_BASE_URL}/api/generate-quiz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skill: selectedSkill })
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.questions) && data.questions.length > 0) {
          setQuestions(data.questions);
          setIsQuizActive(true);
          return;
        }
      }
    } catch (err) {
      console.warn('Backend quiz endpoint fallback:', err);
    } finally {
      setQuizLoading(false);
    }

    // 2. High-quality fallback question bank
    const bank = DEFAULT_QUESTION_BANK[selectedSkill] || DEFAULT_QUESTION_BANK['React'];
    setQuestions(bank);
    setIsQuizActive(true);
  };

  // Select Option
  const handleSelectOption = (optionText) => {
    setUserAnswers(prev => ({
      ...prev,
      [currentIdx]: optionText
    }));
  };

  // Submit & Grade Quiz
  const handleSubmitQuiz = () => {
    let correctCount = 0;
    questions.forEach((q, idx) => {
      if (userAnswers[idx] === q.answer) {
        correctCount++;
      }
    });

    const total = questions.length;
    const percentage = Math.round((correctCount / total) * 100);
    const passed = percentage >= 70;

    const result = {
      id: 'test-' + Date.now(),
      skill: selectedSkill,
      level: selectedLevel,
      score: correctCount,
      total,
      percentage,
      passed,
      timeTaken: timerSeconds,
      date: new Date().toISOString()
    };

    setScoreData(result);
    setQuizSubmitted(true);

    // Persist to user test history
    const userId = profile?.id || session?.user?.id || 'demo';
    const updatedHistory = [result, ...historyResults];
    setHistoryResults(updatedHistory);
    try {
      localStorage.setItem(`bridgeiq_practice_results_${userId}`, JSON.stringify(updatedHistory));
    } catch {}

    addToast(
      passed ? `Great job! You passed with ${percentage}%!` : `Assessment finished: ${percentage}%. Review your answers below.`,
      passed ? 'success' : 'info'
    );
  };

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins}:${rem < 10 ? '0' : ''}${rem}`;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-5xl mx-auto pb-16">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#1f2742]">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#B8E3E9]/15 border border-[#B8E3E9]/35 text-[#B8E3E9] text-xs font-bold uppercase tracking-wider">
            <span>🎯</span>
            <span>Technical Assessment Center</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Skill Practice & <span className="bg-gradient-to-r from-[#B298E7] via-[#F5B8D5] to-[#B8E3E9] bg-clip-text text-transparent">Assessment Quizzes</span>
          </h1>
          <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
            Test your proficiency with standardized MCQs. Your scores automatically sync with Level 1, 2, and 3 progress benchmarks on your dashboard.
          </p>
        </div>

        {/* Level Badges */}
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-[#0c0e17] border border-[#B8E3E9]/30 text-xs font-bold text-[#B8E3E9]">
            L1 Foundational
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-[#0c0e17] border border-[#B298E7]/30 text-xs font-bold text-[#B298E7]">
            L2 Competency
          </span>
        </div>
      </div>

      {/* QUIZ INTERACTIVE VIEW (When Active) */}
      {isQuizActive ? (
        <div className="bg-[#121626] border border-[#B298E7]/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
          
          {/* Top Status Bar: Skill, Level, Question Progress, Timer */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-[#B298E7]/20 text-[#B298E7] flex items-center justify-center font-black text-base">
                {selectedSkill.charAt(0)}
              </span>
              <div>
                <h3 className="text-base font-bold text-white">{selectedSkill} Assessment</h3>
                <span className="text-xs text-slate-400">{selectedLevel}</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="px-3 py-1 rounded-xl bg-[#0c0e17] border border-slate-800 text-xs font-bold text-slate-300">
                Question {currentIdx + 1} of {questions.length}
              </span>
              <span className="px-3 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-xs font-mono font-bold text-amber-300">
                ⏱ {formatTime(timerSeconds)}
              </span>
            </div>
          </div>

          {/* Question & Options Area */}
          {!quizSubmitted ? (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-[#0c0e17] border border-slate-800">
                <span className="text-[11px] font-bold text-[#B8E3E9] uppercase tracking-wider block mb-2">
                  Question #{currentIdx + 1}
                </span>
                <p className="text-base sm:text-lg font-bold text-slate-100 leading-relaxed">
                  {questions[currentIdx]?.q || questions[currentIdx]?.question}
                </p>
              </div>

              {/* Options */}
              <div className="space-y-3">
                {(questions[currentIdx]?.options || []).map((option, optIdx) => {
                  const isSelected = userAnswers[currentIdx] === option;
                  const letter = String.fromCharCode(65 + optIdx);
                  return (
                    <button
                      key={optIdx}
                      type="button"
                      onClick={() => handleSelectOption(option)}
                      className={`w-full p-4 rounded-2xl border text-left flex items-center gap-3.5 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#B298E7]/20 border-[#B298E7] text-white shadow-md'
                          : 'bg-[#0c0e17] border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                      }`}
                    >
                      <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                        isSelected ? 'bg-[#B298E7] text-[#0c0e17]' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {letter}
                      </span>
                      <span className="text-sm font-medium">{option}</span>
                    </button>
                  );
                })}
              </div>

              {/* Bottom Navigation Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <button
                  type="button"
                  disabled={currentIdx === 0}
                  onClick={() => setCurrentIdx(prev => prev - 1)}
                  className="px-4 py-2 bg-[#0c0e17] border border-slate-800 text-slate-400 hover:text-white text-xs font-bold rounded-xl disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                >
                  ← Previous
                </button>

                <div className="flex gap-2">
                  {currentIdx < questions.length - 1 ? (
                    <button
                      type="button"
                      onClick={() => setCurrentIdx(prev => prev + 1)}
                      className="px-6 py-2.5 bg-gradient-to-r from-[#B298E7] to-[#B8E3E9] text-[#0c0e17] font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer hover:brightness-105 shadow"
                    >
                      Next Question →
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSubmitQuiz}
                      className="px-6 py-2.5 bg-gradient-to-r from-emerald-400 to-teal-400 text-[#0c0e17] font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer hover:brightness-105 shadow-md"
                    >
                      Submit Assessment ✓
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* RESULTS & REVIEW SECTION */
            <div className="space-y-6 animate-in fade-in duration-300">
              
              {/* Scorecard Hero */}
              <div className="text-center p-8 rounded-3xl bg-gradient-to-br from-[#161c30] to-[#0c0e17] border border-slate-800 space-y-3">
                <span className="text-4xl">{scoreData?.passed ? '🎉' : '📈'}</span>
                <h3 className="text-2xl font-black text-white">
                  {scoreData?.passed ? 'Assessment Passed!' : 'Assessment Completed'}
                </h3>
                <div className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#B298E7] via-[#F5B8D5] to-[#B8E3E9]">
                  {scoreData?.percentage}%
                </div>
                <p className="text-xs text-slate-400 font-medium">
                  You answered <strong className="text-white">{scoreData?.score} of {scoreData?.total}</strong> correctly in {formatTime(scoreData?.timeTaken || 0)}.
                </p>

                <div className="flex justify-center gap-3 pt-3">
                  <button
                    type="button"
                    onClick={handleStartQuiz}
                    className="px-5 py-2.5 bg-gradient-to-r from-[#B298E7] to-[#B8E3E9] text-[#0c0e17] font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer hover:brightness-105"
                  >
                    Retake Quiz ↻
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsQuizActive(false)}
                    className="px-5 py-2.5 bg-[#0c0e17] border border-slate-800 text-slate-300 hover:text-white text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Finish & Close
                  </button>
                </div>
              </div>

              {/* Step-by-Step Question Review with Explanations */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                  Detailed Answer Review
                </h4>
                {questions.map((q, idx) => {
                  const userAns = userAnswers[idx];
                  const isCorrect = userAns === q.answer;
                  return (
                    <div key={idx} className={`p-4 rounded-2xl border ${isCorrect ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-rose-500/10 border-rose-500/30'} space-y-2`}>
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-bold text-white">#{idx + 1}. {q.q || q.question}</span>
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${isCorrect ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                          {isCorrect ? 'Correct' : 'Incorrect'}
                        </span>
                      </div>
                      <div className="text-xs space-y-1 text-slate-300">
                        <p>Your Answer: <strong className={isCorrect ? 'text-emerald-300' : 'text-rose-300'}>{userAns || 'Skipped'}</strong></p>
                        {!isCorrect && <p>Correct Answer: <strong className="text-emerald-300">{q.answer}</strong></p>}
                        {q.explanation && <p className="text-[11px] text-slate-400 pt-1 italic">💡 {q.explanation}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          )}

        </div>
      ) : (
        /* SETUP / LAUNCH CARD */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left: Test Configuration Form */}
          <div className="lg:col-span-2 bg-[#121626] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <span>⚡</span> Configure Technical Assessment
            </h3>

            {/* Select Skill */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Select Skill Category
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {availableSkills.map((sk) => (
                  <button
                    key={sk}
                    type="button"
                    onClick={() => setSelectedSkill(sk)}
                    className={`px-3 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                      selectedSkill === sk
                        ? 'bg-gradient-to-r from-[#B298E7] to-[#B8E3E9] text-[#0c0e17] border-transparent font-black shadow-md'
                        : 'bg-[#0c0e17] border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                    }`}
                  >
                    {sk}
                  </button>
                ))}
              </div>
            </div>

            {/* Select Level */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Assessment Level
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  { id: 'Level 1: Foundational', label: 'Level 1: Foundational (Syntax & Basics)' },
                  { id: 'Level 2: Competency', label: 'Level 2: Applied Competency' },
                  { id: 'Level 3: Architecture', label: 'Level 3: Advanced Systems' }
                ].map((lvl) => (
                  <button
                    key={lvl.id}
                    type="button"
                    onClick={() => setSelectedLevel(lvl.id)}
                    className={`p-3 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer ${
                      selectedLevel === lvl.id
                        ? 'bg-[#B298E7]/20 border-[#B298E7] text-white shadow'
                        : 'bg-[#0c0e17] border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {lvl.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={handleStartQuiz}
              disabled={quizLoading}
              className="w-full py-3.5 bg-gradient-to-r from-[#B298E7] via-[#F5B8D5] to-[#B8E3E9] text-[#0c0e17] font-black text-sm uppercase tracking-wider rounded-xl shadow-lg shadow-[#B298E7]/25 hover:brightness-105 transition-all cursor-pointer disabled:opacity-50"
            >
              {quizLoading ? 'Generating Questions with AI...' : `Start ${selectedSkill} MCQ Assessment →`}
            </button>
          </div>

          {/* Right: Assessment Scorecards & Recent Results */}
          <div className="bg-[#121626] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="text-base font-black text-white flex items-center justify-between">
              <span>Past Scorecards</span>
              <span className="text-xs font-normal text-slate-400">({historyResults.length})</span>
            </h3>

            {historyResults.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs italic">
                No assessments taken yet. Launch your first quiz to benchmark your readiness!
              </div>
            ) : (
              <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                {historyResults.map((rec, rIdx) => (
                  <div key={rec.id || rIdx} className="p-3 rounded-xl bg-[#0c0e17] border border-slate-800 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white">{rec.skill} Assessment</h4>
                      <p className="text-[10px] text-slate-500">{new Date(rec.date).toLocaleDateString()} • {rec.level}</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-black ${rec.passed ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-300'}`}>
                        {rec.percentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
