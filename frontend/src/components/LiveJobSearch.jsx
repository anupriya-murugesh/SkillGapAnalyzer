import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveJobBookmark, removeJobBookmark, getSavedJobs } from '../services/persistenceService';
import { useToast } from '../context/ToastContext';
import { API_BASE_URL } from '../config';
import { cleanHtmlText, truncateText, extractKeySkills } from '../utils/cleanText';

export default function LiveJobSearch() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  
  const [query, setQuery] = useState('Software Developer');
  const [location, setLocation] = useState('India');
  const [jobType, setJobType] = useState('All');
  
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [error, setError] = useState('');
  const [apiWarning, setApiWarning] = useState('');
  const [savedJobIds, setSavedJobIds] = useState(new Set());

  useEffect(() => {
    getSavedJobs().then(saved => {
      const ids = new Set(saved.map(j => j.data?.job_id || j.id || j.job_id));
      setSavedJobIds(ids);
    });
  }, []);

  const handleBookmark = async (job) => {
    const id = job.id;
    if (savedJobIds.has(id)) {
      await removeJobBookmark(id);
      const newIds = new Set(savedJobIds);
      newIds.delete(id);
      setSavedJobIds(newIds);
      addToast('Job removed from wishlist', 'info');
    } else {
      const jobToSave = { ...job, job_id: id };
      await saveJobBookmark(jobToSave);
      setSavedJobIds(new Set(savedJobIds).add(id));
      addToast('Job saved to your Target Wishlist!', 'success');
    }
  };

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');

    const searchQuery = jobType === 'All' ? query : `${query} ${jobType}`;
    const qLower = searchQuery.toLowerCase();

    try {
      // Execute Hybrid Dual-Source Aggregator
      const [jsearchResult, arbeitnowResult] = await Promise.allSettled([
        fetch(`${API_BASE_URL}/api/live-jobs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: searchQuery, location: location || 'Global' }),
        }).then(async res => {
          if (!res.ok) throw new Error('JSearch API Error');
          const data = await res.json();
          return data.jobs || [];
        }),
        
        fetch('https://www.arbeitnow.com/api/job-board-api')
          .then(async res => {
            if (!res.ok) throw new Error('Arbeitnow API Error');
            const data = await res.json();
            return data.data || [];
          })
      ]);

      let aggregatedJobs = [];
      setApiWarning('');

      // 1. Process JSearch (RapidAPI via Backend)
      if (jsearchResult.status === 'fulfilled' && Array.isArray(jsearchResult.value)) {
        const normalizedJSearch = jsearchResult.value.map((job) => ({
          id: job.job_id || Math.random().toString(),
          title: job.title || job.job_title, 
          company: job.company || job.employer_name || "Unknown",
          location: job.location || "Global / Remote",
          description: cleanHtmlText(job.description || job.job_description),
          url: job.apply_link || job.job_apply_link || "#",
          source: job.source || "JSearch",
          badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200"
        }));
        aggregatedJobs = [...aggregatedJobs, ...normalizedJSearch];
      } else {
        setApiWarning('JSearch API failed to connect. Showing available fallback results from Arbeitnow.');
      }

      // 2. Process Arbeitnow (Public API directly from Frontend)
      if (arbeitnowResult.status === 'fulfilled' && Array.isArray(arbeitnowResult.value)) {
        const normalizedArbeitnow = arbeitnowResult.value
          .filter(job => 
            job.title?.toLowerCase().includes(qLower) || 
            job.description?.toLowerCase().includes(qLower)
          )
          .map((job) => ({
            id: job.slug || Math.random().toString(),
            title: job.title,
            company: job.company_name || "Unknown",
            location: job.location || "Germany / EU",
            description: cleanHtmlText(job.description),
            url: job.url || "#",
            source: "Arbeitnow",
            badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200"
          }));
        aggregatedJobs = [...aggregatedJobs, ...normalizedArbeitnow];
      }

      if (aggregatedJobs.length === 0) {
        if (jsearchResult.status === 'rejected' && arbeitnowResult.status === 'rejected') {
          throw new Error('Both Job APIs failed to respond. Please try again later.');
        }
      }

      setJobs(aggregatedJobs);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getLocationBadge = (loc) => {
    if (!loc) return { text: 'Global', icon: '🌐' };
    const lowerLoc = loc.toLowerCase();
    if (lowerLoc.includes('remote')) return { text: 'Remote', icon: '🌐' };
    if (lowerLoc.includes('india') || lowerLoc.includes('in')) return { text: loc, icon: '🇮🇳' };
    if (lowerLoc.includes('germany') || lowerLoc.includes('de')) return { text: loc, icon: '🇩🇪' };
    if (lowerLoc.includes('usa') || lowerLoc.includes('us') || lowerLoc.includes('united states')) return { text: loc, icon: '🇺🇸' };
    if (lowerLoc.includes('uk') || lowerLoc.includes('united kingdom')) return { text: loc, icon: '🇬🇧' };
    return { text: loc, icon: '📍' };
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-20">
      
      {/* Header */}
      <div className="mb-10 text-center max-w-2xl mx-auto pt-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-zinc-200 bg-white text-zinc-600 font-mono text-[10px] uppercase tracking-widest mb-4 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          Dual-Source Engine Active
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-zinc-900 tracking-tight mb-4">Discover Your Next Move.</h1>
        <p className="text-zinc-500 font-medium text-lg">Search global opportunities, benchmark your skills, and eliminate gaps instantly.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        {/* Left Column / Filter Bar */}
        <div className="w-full lg:w-[320px] flex-shrink-0">
          <form onSubmit={handleSearch} className="bg-white rounded-3xl p-6 border border-zinc-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] sticky top-24">
            <h3 className="text-sm font-black text-zinc-900 uppercase tracking-widest mb-6">Search Filters</h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Job Title / Skill</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Software Developer"
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm font-medium text-zinc-900 placeholder:text-zinc-400"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Location</label>
                <input
                  type="text"
                  placeholder="e.g. India or Remote"
                  className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm font-medium text-zinc-900 placeholder:text-zinc-400"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Job Type</label>
                <div className="flex flex-wrap gap-2">
                  {['All', 'Remote', 'Full-Time', 'Contract'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setJobType(type)}
                      className={`px-3 py-1.5 text-[11px] font-bold rounded-lg border transition-all uppercase tracking-wider ${
                        jobType === type 
                          ? 'bg-zinc-900 text-white border-zinc-900' 
                          : 'bg-white text-zinc-500 border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 py-3.5 bg-indigo-600 text-white font-bold text-sm rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-500/20 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? 'Searching...' : 'Search Engine Active'}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column / Job Cards Grid */}
        <div className="flex-1 w-full min-w-0">
          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-100 font-medium mb-6 text-sm">
              {error}
            </div>
          )}
          
          {apiWarning && !error && (
            <div className="bg-amber-50 text-amber-700 p-4 rounded-xl border border-amber-200 font-medium mb-6 text-sm flex items-start gap-3">
              <span className="text-amber-500">⚠️</span>
              {apiWarning}
            </div>
          )}

          {!loading && jobs.length === 0 && !error && (
            <div className="bg-white rounded-3xl border border-zinc-200/60 border-dashed p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
              <div className="w-16 h-16 bg-zinc-50 border border-zinc-100 rounded-full flex items-center justify-center text-2xl mb-4">🔍</div>
              <h3 className="text-lg font-black text-zinc-900 mb-2 tracking-tight">No Jobs Found</h3>
              <p className="text-sm font-medium text-zinc-500 max-w-sm">We couldn't find any positions matching those exact filters. Try adjusting your location or query.</p>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((skeleton) => (
                <div key={skeleton} className="bg-white rounded-3xl border border-zinc-100 p-6 animate-pulse">
                  <div className="flex gap-4 mb-4">
                    <div className="w-12 h-12 bg-zinc-100 rounded-xl"></div>
                    <div className="flex-1 space-y-2 py-1">
                      <div className="h-4 bg-zinc-100 rounded w-3/4"></div>
                      <div className="h-3 bg-zinc-50 rounded w-1/2"></div>
                    </div>
                  </div>
                  <div className="space-y-2 mb-6">
                    <div className="h-3 bg-zinc-50 rounded w-full"></div>
                    <div className="h-3 bg-zinc-50 rounded w-5/6"></div>
                  </div>
                  <div className="flex gap-2">
                    <div className="h-10 bg-zinc-100 rounded-xl w-1/2"></div>
                    <div className="h-10 bg-zinc-50 rounded-xl w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {jobs.map((job, idx) => {
                const isBookmarked = savedJobIds.has(job.id);
                const locBadge = getLocationBadge(job.location);
                const skills = extractKeySkills(job.description);

                return (
                  <div key={job.id || idx} className="bg-white rounded-3xl border border-zinc-200/60 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:border-zinc-300 transition-all flex flex-col h-full group relative overflow-hidden">
                    
                    {/* Top Section: Logo, Title, Company */}
                    <div className="flex gap-4 items-start mb-4">
                      <div className="w-12 h-12 flex-shrink-0 bg-gradient-to-br from-zinc-50 to-zinc-100 border border-zinc-200/50 rounded-xl flex items-center justify-center text-lg font-black text-zinc-400 shadow-inner">
                        {job.company ? job.company.charAt(0).toUpperCase() : 'B'}
                      </div>
                      <div className="flex-1 min-w-0 pr-8">
                        <h3 className="text-lg font-black text-zinc-900 truncate tracking-tight" title={job.title}>{job.title}</h3>
                        <p className="text-sm font-medium text-zinc-500 truncate">{job.company}</p>
                      </div>
                      
                      {/* Bookmark Icon */}
                      <button
                        onClick={() => handleBookmark(job)}
                        className="absolute top-6 right-6 text-zinc-300 hover:text-amber-500 transition-colors"
                      >
                        <svg className={`w-6 h-6 ${isBookmarked ? 'text-amber-400 fill-current' : 'fill-none stroke-current stroke-2'}`} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                      </button>
                    </div>

                    {/* Location Badge & Source Badge */}
                    <div className="flex items-center gap-2 mb-5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-zinc-50 text-zinc-600 rounded-md text-xs font-bold border border-zinc-200/60 shadow-sm">
                        <span>{locBadge.icon}</span> {locBadge.text}
                      </span>
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                        job.source === 'JSearch' 
                          ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200' 
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200'
                      }`}>
                        {job.source || 'Arbeitnow'}
                      </span>
                    </div>

                    {/* Truncated & Clamped Job Description */}
                    <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-3 overflow-hidden text-ellipsis whitespace-normal my-3 min-h-[60px] max-h-[72px]">
                      {truncateText(job.description, 180)}
                    </p>

                    {/* Extracted Skills */}
                    {skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-6">
                        {skills.map(skill => (
                          <span key={skill} className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-md text-[10px] font-bold uppercase tracking-widest shadow-sm">
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 mt-auto pt-4 border-t border-zinc-100">
                      <button 
                        onClick={() => navigate('/analyzer', { state: { jobTitle: job.title, jobDesc: job.description } })}
                        className="flex-1 px-4 py-2.5 bg-zinc-900 text-white text-xs font-bold rounded-xl hover:bg-zinc-800 transition-colors shadow-sm"
                      >
                        Analyze Skill Gap
                      </button>
                      {job.url ? (
                        <a 
                          href={job.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 px-4 py-2.5 bg-white border border-zinc-200 text-zinc-700 text-xs font-bold rounded-xl hover:bg-zinc-50 transition-colors text-center shadow-sm"
                        >
                          Apply Directly
                        </a>
                      ) : (
                        <div className="flex-1 px-4 py-2.5 bg-zinc-50 border border-zinc-100 text-zinc-400 text-xs font-bold rounded-xl text-center cursor-not-allowed">
                          No Link
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
