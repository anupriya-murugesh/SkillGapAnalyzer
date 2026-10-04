import { useState, useEffect } from 'react';
import { saveJobBookmark, removeJobBookmark, getSavedJobs } from '../services/persistenceService';

export default function LiveJobSearch({ onAnalyzeJob }) {
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [error, setError] = useState('');
  const [savedJobIds, setSavedJobIds] = useState(new Set());

  useEffect(() => {
    getSavedJobs().then(saved => {
      const ids = new Set(saved.map(j => j.data?.job_id || j.id || j.job_id));
      setSavedJobIds(ids);
    });
  }, []);

  const handleBookmark = async (job) => {
    const id = job.job_id || job.title;
    if (savedJobIds.has(id)) {
      await removeJobBookmark(id);
      const newIds = new Set(savedJobIds);
      newIds.delete(id);
      setSavedJobIds(newIds);
    } else {
      const jobToSave = { ...job, job_id: id };
      await saveJobBookmark(jobToSave);
      setSavedJobIds(new Set(savedJobIds).add(id));
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:8000/api/live-jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, location: location || 'Global' }),
      });

      if (!response.ok) throw new Error('Job search failed');
      
      const data = await response.json();
      setJobs(data.jobs || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-8 bg-white rounded-2xl shadow-xl border border-gray-100">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Live Global Job Market</h2>
      
      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4 mb-8">
        <input
          type="text"
          required
          placeholder="Job Query (e.g., Full Stack Developer)"
          className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <input
          type="text"
          placeholder="Location (e.g., Remote)"
          className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
        <button
          type="submit"
          disabled={loading}
          className="px-8 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-70 flex justify-center items-center gap-2"
        >
          {loading ? 'Searching...' : 'Search Engine Active'}
        </button>
      </form>

      {error && <p className="text-red-500 mb-6 font-semibold">{error}</p>}

      <div className="grid gap-6">
        {jobs.map((job, idx) => (
          <div key={idx} className="border border-gray-200 rounded-2xl p-6 hover:shadow-md transition-shadow bg-gray-50 flex flex-col h-full">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{job.title}</h3>
                <p className="text-gray-600 font-semibold">{job.company} • {job.location}</p>
              </div>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-full uppercase tracking-wider whitespace-nowrap">
                via {job.source}
              </span>
            </div>
            
            <p className="text-gray-700 mb-6 text-sm line-clamp-3 flex-grow">{job.description}</p>
            
            <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-gray-200">
              <button 
                onClick={() => onAnalyzeJob(job.title, job.description)}
                className="flex-1 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-bold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-colors shadow-sm"
              >
                Analyze Skill Gap
              </button>
              {job.apply_link && (
                <a 
                  href={job.apply_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 px-6 py-2.5 bg-white border-2 border-gray-300 text-gray-700 text-sm font-bold rounded-lg hover:bg-gray-50 transition-colors text-center"
                >
                  Apply Directly
                </a>
              )}
              <button
                onClick={() => handleBookmark(job)}
                className="px-4 py-2.5 border-2 border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center group"
                title={savedJobIds.has(job.job_id || job.title) ? "Remove Bookmark" : "Bookmark Job"}
              >
                <svg className={`w-6 h-6 transition-colors ${savedJobIds.has(job.job_id || job.title) ? 'text-yellow-500 fill-current' : 'text-gray-400 fill-none stroke-current stroke-2 group-hover:text-yellow-500'}`} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </button>
            </div>
          </div>
        ))}
        {!loading && jobs.length === 0 && query && !error && (
          <p className="text-center text-gray-500 font-semibold py-8 bg-gray-50 rounded-xl border border-dashed">No jobs found in this area. Try expanding your search.</p>
        )}
      </div>
    </div>
  );
}
