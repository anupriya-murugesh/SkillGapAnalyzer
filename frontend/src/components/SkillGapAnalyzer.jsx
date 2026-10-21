import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import ResumeUploader from './ResumeUploader';
import LearningRoadmap from './LearningRoadmap';
import { useToast } from '../context/ToastContext';
import { API_BASE_URL } from '../config';

export default function SkillGapAnalyzer() {
  const location = useLocation();
  const { addToast } = useToast();
  
  const incomingJobTitle = location.state?.jobTitle || '';
  const incomingJobDesc = location.state?.jobDesc || '';

  // Analyzer State
  const [jobTitle, setJobTitle] = useState(incomingJobTitle);
  const [jobDescription, setJobDescription] = useState(incomingJobDesc);
  const [userSkills, setUserSkills] = useState([]);
  const [skillInput, setSkillInput] = useState('');
  
  useEffect(() => {
    if (incomingJobTitle) setJobTitle(incomingJobTitle);
    if (incomingJobDesc) setJobDescription(incomingJobDesc);
  }, [incomingJobTitle, incomingJobDesc]);
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleAddSkill = (e) => {
    if (e.key === 'Enter' && skillInput.trim()) {
      e.preventDefault();
      if (!userSkills.includes(skillInput.trim())) {
        setUserSkills([...userSkills, skillInput.trim()]);
      }
      setSkillInput('');
    }
  };

  const removeSkill = (skillToRemove) => {
    setUserSkills(userSkills.filter(s => s !== skillToRemove));
  };

  const handleSkillsExtracted = (extractedSkills) => {
    const newSkills = [...new Set([...userSkills, ...extractedSkills])];
    const addedCount = newSkills.length - userSkills.length;
    setUserSkills(newSkills);
    addToast(`Extracted ${extractedSkills.length} skills (${addedCount} new) from your resume!`, 'success');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/analyze-gap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_title: jobTitle,
          job_description: jobDescription,
          user_skills: userSkills
        }),
      });

      if (!response.ok) throw new Error('Analysis request failed');
      const data = await response.json();
      setResult(data);
      addToast('Job match analysis complete!', 'success');
      
      // Auto-save to persistence service
      import('../services/persistenceService').then(({ saveAnalysisResult }) => {
        saveAnalysisResult({ ...data, jobTitle: jobTitle || 'Custom Profile' });
      }).catch(console.error);
    } catch (err) {
      console.error('SkillGapAnalyzer Error:', err);
      let errorMsg = err.message || 'An error occurred during analysis';
      if (err.name === 'TypeError' && String(err.message).toLowerCase().includes('fetch')) {
        const isProd = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
        if (isProd && API_BASE_URL.includes('localhost')) {
          errorMsg = 'Cannot connect to backend: Your deployed frontend is still attempting to call localhost:8000. Please add the VITE_BACKEND_URL environment variable in your Netlify/Vercel dashboard pointing to your deployed backend URL (e.g. https://your-backend.onrender.com).';
        } else {
          errorMsg = 'Unable to connect to the backend server. Please ensure the backend is running and reachable.';
        }
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const getMatchColor = (percentage) => {
    if (percentage >= 70) return 'text-emerald-950 bg-emerald-50 border-emerald-300';
    if (percentage >= 40) return 'text-amber-950 bg-amber-50 border-amber-300';
    return 'text-rose-950 bg-rose-50 border-rose-300';
  };

  return (
    <div className="max-w-5xl mx-auto mt-8 px-4">
        <div className="bg-white p-6 sm:p-10 rounded-3xl shadow-sm border-2 border-slate-200 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between mb-8 pb-4 border-b-2 border-slate-100">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 border-2 border-emerald-300 text-emerald-950 text-xs font-black uppercase tracking-wider mb-2">
                <span>AI GAP TELEMETRY</span>
              </div>
              <h2 className="text-3xl font-black text-slate-950 tracking-tight">Analyze Your Skill Gap</h2>
            </div>
            <div className="hidden sm:block text-xs font-mono text-emerald-800 font-extrabold">Bridge-IQ Engine v2.0</div>
          </div>
          
          <div className="mb-8">
            <ResumeUploader onSkillsExtracted={handleSkillsExtracted} />
          </div>

          <div className="relative flex py-5 items-center">
            <div className="flex-grow border-t-2 border-slate-200"></div>
            <span className="flex-shrink-0 mx-4 text-slate-500 text-xs font-black uppercase tracking-widest">or manually input details</span>
            <div className="flex-grow border-t-2 border-slate-200"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 mt-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-800 mb-2">
                Job Title <span className="text-emerald-700">*</span>
              </label>
              <input
                type="text"
                required
                className="w-full px-5 py-4 border-2 border-slate-300 rounded-2xl focus:border-emerald-600 outline-none transition-colors text-slate-950 font-medium bg-white placeholder-slate-400"
                placeholder="e.g. Senior Frontend Developer"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-800 mb-2">
                Job Description <span className="text-emerald-700">*</span>
              </label>
              <textarea
                required
                rows={5}
                className="w-full px-5 py-4 border-2 border-slate-300 rounded-2xl focus:border-emerald-600 outline-none resize-none transition-colors text-slate-950 font-medium bg-white placeholder-slate-400"
                placeholder="Paste the target job description or requirements here..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-800">
                  Your Current Skills {userSkills.length > 0 && <span className="text-emerald-700 font-black">({userSkills.length})</span>}
                </label>
                {userSkills.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setUserSkills([])}
                    className="text-[11px] font-bold text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                  >
                    Clear All
                  </button>
                )}
              </div>
              <div className="p-3 border-2 border-slate-300 rounded-2xl focus-within:border-emerald-600 bg-white transition-colors flex flex-wrap gap-2 items-center min-h-[64px]">
                {userSkills.map((skill, idx) => (
                  <span key={idx} className="flex items-center gap-1.5 bg-emerald-100 text-emerald-950 border border-emerald-300 px-3.5 py-1.5 rounded-xl text-sm font-bold shadow-xs">
                    {skill}
                    <button type="button" onClick={() => removeSkill(skill)} className="text-emerald-800 hover:text-red-700 ml-1 leading-none text-lg cursor-pointer font-bold">&times;</button>
                  </span>
                ))}
                <input
                  type="text"
                  className="flex-1 outline-none min-w-[180px] bg-transparent text-slate-950 font-medium px-2 py-1 placeholder-slate-400"
                  placeholder={userSkills.length === 0 ? "Type a skill and press Enter..." : "Add another skill..."}
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={handleAddSkill}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || userSkills.length === 0}
              className="w-full py-4 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-black rounded-2xl shadow-md shadow-emerald-700/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-3 text-lg mt-8 cursor-pointer active:scale-[0.99]"
            >
              {loading ? 'Analyzing Skills with AI...' : 'Analyze Match'}
            </button>
          </form>

          {error && (
            <div className="mt-8 p-4 bg-red-50 text-red-900 rounded-2xl border-2 border-red-300 font-bold">
              ⚠️ {error}
            </div>
          )}

          {result && (
            <div className="mt-12 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className={`p-8 rounded-3xl text-center border-2 shadow-sm ${getMatchColor(result.match_percentage)}`}>
                <div className="text-xs font-mono font-black uppercase tracking-widest mb-2 opacity-90">Overall Market Alignment</div>
                <div className="text-7xl font-black tracking-tight">{result.match_percentage}%</div>
              </div>

              {result.matched_skills?.length > 0 && (
                <div className="bg-slate-50 p-6 sm:p-8 rounded-3xl border-2 border-slate-200">
                  <h3 className="text-lg font-black text-emerald-950 mb-4 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-700"></span> Matched Skills ({result.matched_skills.length})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {result.matched_skills.map((skill, idx) => (
                      <span key={idx} className="px-4 py-2 bg-emerald-100 text-emerald-950 rounded-xl text-sm font-bold border border-emerald-300 shadow-xs">
                        ✓ {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {(result.missing_tech_skills?.length > 0 || result.missing_soft_skills?.length > 0) && (
                <div className="grid md:grid-cols-2 gap-6">
                  {result.missing_tech_skills?.length > 0 && (
                    <div className="bg-slate-50 p-6 rounded-3xl border-2 border-slate-200 shadow-xs">
                      <h3 className="text-lg font-black text-rose-950 mb-4 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span> Missing Tech Skills ({result.missing_tech_skills.length})
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {result.missing_tech_skills.map((skill, idx) => (
                          <span key={idx} className="px-4 py-2 bg-rose-100 text-rose-950 rounded-xl text-sm font-bold border border-rose-300">
                            ✗ {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {result.missing_soft_skills?.length > 0 && (
                    <div className="bg-slate-50 p-6 rounded-3xl border-2 border-slate-200 shadow-xs">
                      <h3 className="text-lg font-black text-amber-950 mb-4 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-600"></span> Missing Soft Skills ({result.missing_soft_skills.length})
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {result.missing_soft_skills.map((skill, idx) => (
                          <span key={idx} className="px-4 py-2 bg-amber-100 text-amber-950 rounded-xl text-sm font-bold border border-amber-300">
                            ✎ {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {result.roadmap && result.roadmap.length > 0 && (
                <div className="mt-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <LearningRoadmap roadmap={result.roadmap} />
                </div>
              )}
            </div>
          )}
        </div>
    </div>
  );
}
