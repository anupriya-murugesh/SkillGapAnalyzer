import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAnalysisHistory, getSavedJobs, removeJobBookmark } from '../services/persistenceService';
import LearningRoadmap from './LearningRoadmap';
import { useToast } from '../context/ToastContext';

export default function Dashboard() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  
  const [history, setHistory] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedHistoryId, setExpandedHistoryId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const h = await getAnalysisHistory();
      const sj = await getSavedJobs();
      setHistory(h);
      setSavedJobs(sj);
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleRemoveBookmark = async (jobId) => {
    await removeJobBookmark(jobId);
    setSavedJobs(savedJobs.filter(j => (j.data?.job_id || j.id) !== jobId && j.job_id !== jobId));
    addToast('Job removed from wishlist', 'info');
  };

  if (loading) {
    return <div className="text-center py-20 font-bold text-gray-500 animate-pulse text-xl">Loading Dashboard...</div>;
  }

  // Calculate stats
  const totalAnalyses = history.length;
  const recentTechMissing = history[0]?.data?.missing_tech_skills?.length || 0;
  const recentSoftMissing = history[0]?.data?.missing_soft_skills?.length || 0;
  const totalSkills = (history[0]?.data?.matched_skills?.length || 0) + recentTechMissing + recentSoftMissing;
  const lastUpdated = history[0]?.created_at ? new Date(history[0].created_at).toLocaleDateString() : 'No data yet';

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      
      {/* SECTION A: Candidate Overview */}
      <section>
        <h2 className="text-2xl font-black text-gray-800 mb-6 px-2">Candidate Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center text-center hover:shadow-md transition-shadow">
            <span className="text-gray-400 font-bold text-sm uppercase tracking-wider mb-2">Total Analyses</span>
            <span className="text-5xl font-black text-indigo-600">{totalAnalyses}</span>
          </div>
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center text-center hover:shadow-md transition-shadow">
            <span className="text-gray-400 font-bold text-sm uppercase tracking-wider mb-2">Missing Skills Ratio</span>
            <span className="text-4xl font-black text-gray-700">
              <span className="text-red-500">{recentTechMissing}</span> / <span className="text-purple-500">{recentSoftMissing}</span>
            </span>
            <span className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">Tech / Soft</span>
          </div>
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center text-center hover:shadow-md transition-shadow">
            <span className="text-gray-400 font-bold text-sm uppercase tracking-wider mb-2">Last Updated</span>
            <span className="text-3xl font-black text-gray-700 mt-2">{lastUpdated}</span>
          </div>
        </div>
      </section>

      {/* SECTION B: History */}
      <section>
        <h2 className="text-2xl font-black text-gray-800 mb-6 px-2">Analysis History</h2>
        {history.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl text-center text-gray-500 font-bold border-2 border-dashed border-gray-300">
            No analysis history found. Run a skill scan to see your progress!
          </div>
        ) : (
          <div className="grid gap-4">
            {history.map((item, idx) => (
              <div key={idx} className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div 
                  className="p-6 flex flex-col sm:flex-row justify-between items-center gap-4 cursor-pointer"
                  onClick={() => setExpandedHistoryId(expandedHistoryId === idx ? null : idx)}
                >
                  <div className="flex-1 w-full">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-xl text-gray-900">{item.data.jobTitle || 'Custom Job Profile'}</h3>
                      <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-full border border-gray-200 whitespace-nowrap">{new Date(item.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm text-gray-600 font-semibold flex items-center gap-4">
                      <span className="flex items-center gap-1.5"><span className="text-red-500">✗</span> {item.data.missing_tech_skills?.length || 0} Tech Missing</span>
                      <span className="flex items-center gap-1.5"><span className="text-purple-500">✎</span> {item.data.missing_soft_skills?.length || 0} Soft Missing</span>
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0 flex items-center gap-4">
                    <span className={`px-5 py-2.5 rounded-xl font-black text-lg shadow-sm border ${item.data.match_percentage >= 70 ? 'bg-green-50 text-green-700 border-green-200' : item.data.match_percentage >= 40 ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                      {item.data.match_percentage}% Match
                    </span>
                    <span className={`text-gray-400 font-bold transform transition-transform ${expandedHistoryId === idx ? 'rotate-180' : ''}`}>▼</span>
                  </div>
                </div>
                
                {expandedHistoryId === idx && item.data.roadmap && (
                  <div className="px-2 pb-6 pt-2 bg-gray-50 border-t border-gray-100">
                    <LearningRoadmap roadmap={item.data.roadmap} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* SECTION C: Saved Jobs */}
      <section>
        <h2 className="text-2xl font-black text-gray-800 mb-6 flex items-center gap-3 px-2">
          <span className="text-yellow-500 text-3xl leading-none -mt-1">★</span> Saved Jobs Wishlist
        </h2>
        {savedJobs.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl text-center text-gray-500 font-bold border-2 border-dashed border-gray-300">
            No jobs bookmarked yet. Search the Live Market to save opportunities!
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedJobs.map((item, idx) => {
              const job = item.data;
              const id = job.job_id || item.id;
              return (
                <div key={idx} className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm flex flex-col h-full hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 line-clamp-2 leading-tight mb-1">{job.title}</h3>
                      <p className="text-indigo-600 font-bold text-sm">{job.company}</p>
                    </div>
                    <button 
                      onClick={() => handleRemoveBookmark(id)}
                      className="text-gray-300 hover:text-red-500 transition-colors ml-2 bg-gray-50 hover:bg-red-50 p-2 rounded-full"
                      title="Remove bookmark"
                    >
                      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z"/></svg>
                    </button>
                  </div>
                  <p className="text-gray-500 text-xs font-bold mb-6 uppercase tracking-wider">{job.location} • via {job.source}</p>
                  
                  <div className="mt-auto flex flex-col xl:flex-row gap-3">
                    <button 
                      onClick={() => navigate('/analyzer', { state: { jobTitle: job.title, jobDesc: job.description } })}
                      className="flex-1 px-4 py-2.5 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-gray-800 transition-colors"
                    >
                      Analyze
                    </button>
                    {job.apply_link && (
                      <a 
                        href={job.apply_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 px-4 py-2.5 bg-indigo-50 text-indigo-700 border border-indigo-200 text-sm font-bold rounded-xl hover:bg-indigo-100 transition-colors text-center"
                      >
                        Apply
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

    </div>
  );
}
