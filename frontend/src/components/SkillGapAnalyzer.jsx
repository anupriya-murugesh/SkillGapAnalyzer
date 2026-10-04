import { useState } from 'react';
import ResumeUploader from './ResumeUploader';
import LiveJobSearch from './LiveJobSearch';

export default function SkillGapAnalyzer() {
  const [activeTab, setActiveTab] = useState('analyzer'); // 'analyzer' or 'jobs'

  // Analyzer State
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [userSkills, setUserSkills] = useState([]);
  const [skillInput, setSkillInput] = useState('');
  
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
    setUserSkills(newSkills);
  };

  const handleAnalyzeJob = (title, description) => {
    setJobTitle(title);
    setJobDescription(description);
    setActiveTab('analyzer');
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('http://localhost:8000/api/analyze-gap', {
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
      
      // Auto-save to persistence service
      import('../services/persistenceService').then(({ saveAnalysisResult }) => {
        saveAnalysisResult({ ...data, jobTitle: jobTitle || 'Custom Profile' });
      }).catch(console.error);
    } catch (err) {
      setError(err.message || 'An error occurred during analysis');
    } finally {
      setLoading(false);
    }
  };

  const getMatchColor = (percentage) => {
    if (percentage >= 70) return 'text-green-700 bg-green-50 border-green-200';
    if (percentage >= 40) return 'text-orange-700 bg-orange-50 border-orange-200';
    return 'text-red-700 bg-red-50 border-red-200';
  };

  return (
    <div className="max-w-5xl mx-auto mt-8 px-4">
      {/* Tabs */}
      <div className="flex space-x-2 mb-6 bg-gray-200/50 p-1.5 rounded-2xl">
        <button 
          onClick={() => setActiveTab('analyzer')}
          className={`flex-1 py-3.5 text-sm font-bold rounded-xl transition-all duration-300 ${activeTab === 'analyzer' ? 'bg-white text-indigo-700 shadow-md scale-100' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50 scale-95'}`}
        >
          Skill Analyzer & Resume
        </button>
        <button 
          onClick={() => setActiveTab('jobs')}
          className={`flex-1 py-3.5 text-sm font-bold rounded-xl transition-all duration-300 ${activeTab === 'jobs' ? 'bg-white text-indigo-700 shadow-md scale-100' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50 scale-95'}`}
        >
          Live Global Job Market
        </button>
      </div>

      {activeTab === 'jobs' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <LiveJobSearch onAnalyzeJob={handleAnalyzeJob} />
        </div>
      )}

      {activeTab === 'analyzer' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-xl border border-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">Analyze Your Skill Gap</h2>
          
          <div className="mb-8">
            <ResumeUploader onSkillsExtracted={handleSkillsExtracted} />
          </div>

          <div className="relative flex py-5 items-center">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="flex-shrink-0 mx-4 text-gray-400 text-sm font-semibold uppercase tracking-wider">or manually input</span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 mt-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Job Title</label>
              <input
                type="text"
                required
                className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-0 focus:border-indigo-500 outline-none transition-colors text-gray-700 font-medium bg-gray-50 focus:bg-white"
                placeholder="e.g. Senior Frontend Developer"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Job Description</label>
              <textarea
                required
                rows={5}
                className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-0 focus:border-indigo-500 outline-none resize-none transition-colors text-gray-700 font-medium bg-gray-50 focus:bg-white"
                placeholder="Paste the full job description here..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Your Current Skills</label>
              <div className="p-3 border-2 border-gray-200 rounded-2xl focus-within:border-indigo-500 bg-gray-50 focus-within:bg-white transition-colors flex flex-wrap gap-2 items-center min-h-[64px]">
                {userSkills.map((skill, idx) => (
                  <span key={idx} className="flex items-center gap-1.5 bg-indigo-100 text-indigo-800 px-3.5 py-1.5 rounded-xl text-sm font-bold shadow-sm">
                    {skill}
                    <button type="button" onClick={() => removeSkill(skill)} className="text-indigo-400 hover:text-indigo-900 ml-1 leading-none text-lg">&times;</button>
                  </span>
                ))}
                <input
                  type="text"
                  className="flex-1 outline-none min-w-[180px] bg-transparent text-gray-700 font-medium px-2 py-1"
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
              className="w-full py-4 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed flex justify-center items-center gap-3 text-lg mt-8"
            >
              {loading ? 'Analyzing Skills with AI...' : 'Analyze Match'}
            </button>
          </form>

          {error && (
            <div className="mt-8 p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 font-semibold">
              ⚠️ {error}
            </div>
          )}

          {result && (
            <div className="mt-12 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className={`p-8 rounded-3xl text-center border-2 shadow-sm ${getMatchColor(result.match_percentage)}`}>
                <div className="text-sm font-bold uppercase tracking-widest mb-2 opacity-80">Overall Match</div>
                <div className="text-7xl font-black tracking-tight">{result.match_percentage}%</div>
              </div>

              {result.matched_skills?.length > 0 && (
                <div className="bg-gray-50 p-6 rounded-3xl border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">✓ Matched Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {result.matched_skills.map((skill, idx) => (
                      <span key={idx} className="px-4 py-2 bg-green-100 text-green-800 rounded-xl text-sm font-bold border border-green-200 shadow-sm">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {(result.missing_tech_skills?.length > 0 || result.missing_soft_skills?.length > 0) && (
                <div className="grid md:grid-cols-2 gap-6">
                  {result.missing_tech_skills?.length > 0 && (
                    <div className="bg-white p-6 rounded-3xl border border-red-100 shadow-sm">
                      <h3 className="text-lg font-bold text-gray-800 mb-4 text-red-600">✗ Missing Tech Skills</h3>
                      <div className="flex flex-wrap gap-2">
                        {result.missing_tech_skills.map((skill, idx) => (
                          <span key={idx} className="px-4 py-2 bg-red-50 text-red-700 rounded-xl text-sm font-semibold border border-red-200">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {result.missing_soft_skills?.length > 0 && (
                    <div className="bg-white p-6 rounded-3xl border border-purple-100 shadow-sm">
                      <h3 className="text-lg font-bold text-gray-800 mb-4 text-purple-600">✎ Missing Soft Skills</h3>
                      <div className="flex flex-wrap gap-2">
                        {result.missing_soft_skills.map((skill, idx) => (
                          <span key={idx} className="px-4 py-2 bg-purple-50 text-purple-700 rounded-xl text-sm font-semibold border border-purple-200">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
