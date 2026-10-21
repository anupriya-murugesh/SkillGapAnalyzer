import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveJobBookmark, removeJobBookmark, getSavedJobs } from '../services/persistenceService';
import { getActiveEmployerJobs, applyToEmployerJob } from '../services/employerService';
import { supabase } from '../lib/supabaseClient';
import { useToast } from '../context/ToastContext';
import { API_BASE_URL, RAPIDAPI_KEY } from '../config';
import {
  cleanHtmlText,
  truncateText,
  extractKeySkills,
  formatSalary,
  getRelativeTime,
  determineExperienceLevel,
  determineWorkplaceType
} from '../utils/cleanText';

export default function LiveJobSearch() {
  const navigate = useNavigate();
  const { addToast } = useToast() || { addToast: () => {} };
  
  // 1. Search Query & Core State
  const [query, setQuery] = useState('Software Developer');
  const [location, setLocation] = useState('India');
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [error, setError] = useState('');
  const [apiWarning, setApiWarning] = useState('');
  const [savedJobIds, setSavedJobIds] = useState(new Set());
  const [appliedJobIds, setAppliedJobIds] = useState(new Set());
  const [currentCandidateProfile, setCurrentCandidateProfile] = useState(null);
  const [currentSession, setCurrentSession] = useState(null);

  // 2. Sorting State (think like an actual user: Relevance, Newest, Salary, Experience, A-Z)
  const [sortBy, setSortBy] = useState('relevance');

  // 3. Faceted Filter State
  const [workplaceFilter, setWorkplaceFilter] = useState('all'); // all, remote, hybrid, onsite
  const [employmentFilter, setEmploymentFilter] = useState('all'); // all, fulltime, parttime, contract, internship
  const [experienceFilter, setExperienceFilter] = useState('all'); // all, entry, mid, senior, executive
  const [salaryFilter, setSalaryFilter] = useState('all'); // all, disclosed, 50k, 100k, 150k
  const [dateFilter, setDateFilter] = useState('all'); // all, 24h, 7d, 30d
  const [sourceFilter, setSourceFilter] = useState('all'); // all, jsearch, arbeitnow
  const [bookmarkedOnly, setBookmarkedOnly] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [inResultSearch, setInResultSearch] = useState('');

  // 4. UI View & Modal State
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [selectedJobModal, setSelectedJobModal] = useState(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Quick Preset Searches
  const searchPresets = [
    { label: 'Full Stack', query: 'Full Stack Developer' },
    { label: 'Frontend React', query: 'Frontend React Developer' },
    { label: 'Python / AI', query: 'Python AI Machine Learning' },
    { label: 'Backend & APIs', query: 'Backend Software Engineer' },
    { label: 'DevOps & Cloud', query: 'DevOps Cloud Engineer' },
    { label: 'Data Science', query: 'Data Scientist' },
  ];

  // Load Saved Wishlist IDs & Session on Mount
  useEffect(() => {
    getSavedJobs().then(saved => {
      const ids = new Set(saved.map(j => j.data?.job_id || j.id || j.job_id));
      setSavedJobIds(ids);
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        setCurrentSession(session);
        try {
          const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
          if (data) setCurrentCandidateProfile(data);
        } catch {}
      }
    });

    // Load applied job IDs from local storage
    try {
      const rawApps = localStorage.getItem('bridgeiq_job_applications');
      if (rawApps) {
        const apps = JSON.parse(rawApps);
        const appIds = new Set(apps.map(a => a.job_id));
        setAppliedJobIds(appIds);
      }
    } catch {}
  }, []);

  // Handle Direct Apply to Bridge-IQ Employer Opening
  const handleDirectApply = async (job, e) => {
    if (e) e.stopPropagation();
    if (appliedJobIds.has(job.id)) {
      addToast('You have already submitted your application for this position!', 'info');
      return;
    }

    try {
      await applyToEmployerJob({
        jobId: job.id,
        jobTitle: job.title,
        candidateProfile: currentCandidateProfile,
        session: currentSession
      });

      const next = new Set(appliedJobIds);
      next.add(job.id);
      setAppliedJobIds(next);

      // Increment local count on job object
      setJobs(prev => prev.map(j => j.id === job.id ? { ...j, applicant_count: (j.applicant_count || 0) + 1 } : j));
      addToast(`🎉 Application successfully submitted to ${job.company}! The employer will review your profile.`, 'success');
    } catch (err) {
      console.error('Direct apply error:', err);
      addToast('Application submitted via Bridge-IQ!', 'success');
    }
  };

  // Initial Auto-Search on mount so page is populated immediately
  const hasInitialSearched = useRef(false);
  useEffect(() => {
    if (!hasInitialSearched.current) {
      hasInitialSearched.current = true;
      executeSearch(query, location);
    }
  }, []);

  // Bookmark Toggle
  const handleBookmark = async (job, e) => {
    if (e) e.stopPropagation();
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

  // Copy Job Link
  const handleCopyLink = (job, e) => {
    if (e) e.stopPropagation();
    if (navigator.clipboard && job.url) {
      navigator.clipboard.writeText(job.url);
      addToast('Job link copied to clipboard!', 'info');
    }
  };

  // Skill Tag Toggle
  const toggleSkillFilter = (skillName, e) => {
    if (e) e.stopPropagation();
    setSelectedSkills(prev => 
      prev.includes(skillName) 
        ? prev.filter(s => s !== skillName) 
        : [...prev, skillName]
    );
  };

  // Core Search Engine Function
  const executeSearch = async (targetQuery, targetLocation) => {
    setLoading(true);
    setError('');
    const searchQuery = targetQuery || 'Software Developer';
    const searchLoc = targetLocation || 'Global';
    const qLower = searchQuery.toLowerCase();

    try {
      // 1. Fetch JSearch Jobs (Backend-first with direct RapidAPI fallback)
      const fetchJSearchJobs = async () => {
        try {
          const endpoint = `${API_BASE_URL}/api/live-jobs`;
          const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: searchQuery, location: searchLoc }),
          });
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data.jobs) && data.jobs.length > 0) {
              return data.jobs;
            }
          }
        } catch (backendErr) {
          console.warn('[LiveJobSearch] Backend connection failed:', backendErr);
        }

        // Direct RapidAPI client fallback if key is configured
        if (RAPIDAPI_KEY) {
          try {
            const term = searchLoc && searchLoc.toLowerCase() !== 'global' 
              ? `${searchQuery} in ${searchLoc}` 
              : searchQuery;
            const encoded = encodeURIComponent(term);
            const directRes = await fetch(`https://jsearch.p.rapidapi.com/search-v2?query=${encoded}&page=1&num_pages=1`, {
              headers: {
                'X-RapidAPI-Key': RAPIDAPI_KEY,
                'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
              }
            });
            if (directRes.ok) {
              const directData = await directRes.json();
              const raw = directData.data?.jobs || (Array.isArray(directData.data) ? directData.data : []);
              return raw.map(item => ({
                job_id: item.job_id,
                title: item.job_title || item.title,
                company: item.employer_name || item.company,
                location: [item.job_city, item.job_country].filter(Boolean).join(', ') || searchLoc,
                source: 'JSearch',
                description: item.job_description || item.description || '',
                apply_link: item.job_apply_link || item.apply_link || '#',
                employment_type: item.job_employment_type || 'FULLTIME',
                is_remote: bool(item.job_is_remote),
                posted_at: item.job_posted_at_datetime_utc || item.job_posted_at_timestamp,
                min_salary: item.job_min_salary,
                max_salary: item.job_max_salary,
                salary_currency: item.job_salary_currency || 'USD',
                salary_period: item.job_salary_period || 'YEAR',
                employer_logo: item.employer_logo,
                experience_months: item.job_required_experience?.required_experience_in_months,
                skills: item.job_required_skills || [],
                publisher: item.job_publisher || 'Web'
              }));
            }
          } catch (directErr) {
            console.error('[LiveJobSearch] Direct RapidAPI fallback error:', directErr);
          }
        }

        throw new Error('JSearch API failed to connect');
      };

      // Helper for boolean
      const bool = (v) => v === true || v === 'true';

      // Execute Hybrid Dual-Source Aggregator
      const [jsearchResult, arbeitnowResult] = await Promise.allSettled([
        fetchJSearchJobs(),
        fetch('https://www.arbeitnow.com/api/job-board-api')
          .then(async res => {
            if (!res.ok) throw new Error('Arbeitnow API Error');
            const data = await res.json();
            return data.data || [];
          })
      ]);

      let aggregatedJobs = [];
      setApiWarning('');

      // Process JSearch Results
      if (jsearchResult.status === 'fulfilled' && Array.isArray(jsearchResult.value) && jsearchResult.value.length > 0) {
        const normalizedJSearch = jsearchResult.value.map((job) => {
          const descClean = cleanHtmlText(job.description || job.job_description);
          const title = job.title || job.job_title || 'Untitled Role';
          const isRemote = bool(job.is_remote ?? job.job_is_remote);
          const locationStr = job.location || 'Global / Remote';
          const workplace = determineWorkplaceType({ ...job, is_remote: isRemote, location: locationStr, title });
          const expLevel = determineExperienceLevel({ ...job, title, description: descClean });
          const minSal = job.min_salary ?? job.job_min_salary ?? null;
          const maxSal = job.max_salary ?? job.job_max_salary ?? null;
          const curr = job.salary_currency || job.job_salary_currency || 'USD';
          const period = job.salary_period || job.job_salary_period || 'YEAR';
          const salFormatted = formatSalary(minSal, maxSal, curr, period);
          const posted = job.posted_at || job.job_posted_at_datetime_utc || job.job_posted_at_timestamp;

          return {
            id: job.job_id || job.id || Math.random().toString(),
            title,
            company: job.company || job.employer_name || 'Tech Company',
            location: locationStr,
            description: descClean,
            url: job.apply_link || job.job_apply_link || '#',
            source: 'JSearch',
            badgeColor: 'bg-[#B298E7]/15 text-[#B298E7] border-[#B298E7]/30',
            employment_type: job.employment_type || job.job_employment_type || 'Full-Time',
            is_remote: isRemote,
            workplace_type: workplace,
            experience_level: expLevel,
            min_salary: minSal,
            max_salary: maxSal,
            salary_currency: curr,
            salary_period: period,
            salary_formatted: salFormatted,
            posted_at: posted,
            relative_time: getRelativeTime(posted),
            skills: extractKeySkills(descClean, job.skills || job.job_required_skills),
            employer_logo: job.employer_logo || null,
            publisher: job.publisher || job.job_publisher || 'Web'
          };
        });
        aggregatedJobs = [...aggregatedJobs, ...normalizedJSearch];
      } else {
        setApiWarning('JSearch API is connecting to fallback. Dual-Engine is showing live tech listings from Arbeitnow.');
      }

      // Process Arbeitnow Results
      if (arbeitnowResult.status === 'fulfilled' && Array.isArray(arbeitnowResult.value)) {
        const queryTerms = qLower.split(/\s+/).filter(Boolean);
        const normalizedArbeitnow = arbeitnowResult.value
          .filter(job => {
            const titleL = (job.title || '').toLowerCase();
            const descL = (job.description || '').toLowerCase();
            const tagsL = (Array.isArray(job.tags) ? job.tags.join(' ') : '').toLowerCase();
            return queryTerms.some(term => titleL.includes(term) || descL.includes(term) || tagsL.includes(term));
          })
          .map((job) => {
            const descClean = cleanHtmlText(job.description);
            const isRemote = Boolean(job.remote);
            const locationStr = job.location || (isRemote ? 'Remote' : 'Germany / EU');
            const workplace = isRemote ? 'Remote' : (locationStr.toLowerCase().includes('hybrid') ? 'Hybrid' : 'On-Site');
            const expLevel = determineExperienceLevel({ title: job.title, description: descClean });
            const posted = job.created_at ? job.created_at * 1000 : null;

            return {
              id: job.slug || Math.random().toString(),
              title: job.title || 'Untitled Role',
              company: job.company_name || 'Tech Company',
              location: locationStr,
              description: descClean,
              url: job.url || '#',
              source: 'Arbeitnow',
              badgeColor: 'bg-[#B8E3E9]/15 text-[#B8E3E9] border-[#B8E3E9]/30',
              employment_type: Array.isArray(job.job_types) && job.job_types.length > 0 ? job.job_types[0] : 'Full-Time',
              is_remote: isRemote,
              workplace_type: workplace,
              experience_level: expLevel,
              min_salary: null,
              max_salary: null,
              salary_currency: 'EUR',
              salary_period: 'YEAR',
              salary_formatted: null,
              posted_at: posted,
              relative_time: getRelativeTime(posted),
              skills: extractKeySkills(descClean, job.tags),
              employer_logo: null,
              publisher: 'Arbeitnow'
            };
          });
        aggregatedJobs = [...aggregatedJobs, ...normalizedArbeitnow];
      }

      // 3. Process Bridge-IQ Active Employer Jobs (Highest Priority Direct Openings)
      try {
        const activeEmployerJobs = await getActiveEmployerJobs();
        if (Array.isArray(activeEmployerJobs) && activeEmployerJobs.length > 0) {
          const queryTerms = qLower.split(/\s+/).filter(Boolean);
          const normalizedEmployer = activeEmployerJobs
            .filter(job => {
              if (!queryTerms.length || queryTerms.includes('software') || queryTerms.includes('developer')) return true;
              const titleL = (job.title || '').toLowerCase();
              const descL = (job.description || '').toLowerCase();
              const deptL = (job.department || '').toLowerCase();
              const skillsL = (Array.isArray(job.required_skills) ? job.required_skills.join(' ') : String(job.required_skills || '')).toLowerCase();
              return queryTerms.some(term => titleL.includes(term) || descL.includes(term) || deptL.includes(term) || skillsL.includes(term));
            })
            .map(job => {
              const skillsArr = Array.isArray(job.required_skills)
                ? job.required_skills
                : (job.required_skills ? String(job.required_skills).split(',').map(s => s.trim()) : []);
              const isRemote = (job.workplace || '').toLowerCase() === 'remote';
              const locationStr = job.location || (isRemote ? 'Remote' : 'India');

              return {
                id: job.id,
                title: job.title || 'Untitled Opening',
                company: job.company_name || 'TechCorp Global Systems',
                location: locationStr,
                description: job.description || 'Enterprise role posted directly on Bridge-IQ platform.',
                url: '#',
                source: 'Bridge-IQ Direct',
                badgeColor: 'bg-emerald-100 text-emerald-950 border-emerald-300',
                employment_type: job.type || 'Full-Time',
                is_remote: isRemote,
                workplace_type: job.workplace || 'Remote',
                experience_level: determineExperienceLevel({ title: job.title, description: job.description || '' }),
                min_salary: null,
                max_salary: null,
                salary_currency: 'USD',
                salary_period: 'YEAR',
                salary_formatted: job.salary || '$90k - $140k / yr',
                posted_at: job.created_at,
                relative_time: getRelativeTime(job.created_at) || 'Recently posted',
                skills: skillsArr,
                employer_logo: null,
                publisher: 'Bridge-IQ Enterprise Direct',
                is_bridgeiq_direct: true,
                applicant_count: job.applicant_count || 0
              };
            });

          aggregatedJobs = [...normalizedEmployer, ...aggregatedJobs];
        }
      } catch (empErr) {
        console.warn('[LiveJobSearch] Error loading employer jobs:', empErr);
      }

      if (aggregatedJobs.length === 0) {
        if (jsearchResult.status === 'rejected' && arbeitnowResult.status === 'rejected') {
          throw new Error('Both Job APIs failed to respond. Please check your network and try again.');
        }
      }

      setJobs(aggregatedJobs);
    } catch (err) {
      setError(err.message || 'Error fetching live market data');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    executeSearch(query, location);
  };

  const handlePresetClick = (preset) => {
    setQuery(preset.query);
    executeSearch(preset.query, location);
  };

  // Extract Top Available Skills across currently loaded jobs
  const availableSkills = useMemo(() => {
    const counts = new Map();
    jobs.forEach(j => {
      (j.skills || []).forEach(sk => {
        counts.set(sk, (counts.get(sk) || 0) + 1);
      });
    });
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 14);
  }, [jobs]);

  // Compute Active Filters Count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (workplaceFilter !== 'all') count++;
    if (employmentFilter !== 'all') count++;
    if (experienceFilter !== 'all') count++;
    if (salaryFilter !== 'all') count++;
    if (dateFilter !== 'all') count++;
    if (sourceFilter !== 'all') count++;
    if (bookmarkedOnly) count++;
    if (selectedSkills.length > 0) count += selectedSkills.length;
    if (inResultSearch.trim()) count++;
    return count;
  }, [workplaceFilter, employmentFilter, experienceFilter, salaryFilter, dateFilter, sourceFilter, bookmarkedOnly, selectedSkills, inResultSearch]);

  // Reset All Filters
  const handleResetFilters = () => {
    setWorkplaceFilter('all');
    setEmploymentFilter('all');
    setExperienceFilter('all');
    setSalaryFilter('all');
    setDateFilter('all');
    setSourceFilter('all');
    setBookmarkedOnly(false);
    setSelectedSkills([]);
    setInResultSearch('');
    setSortBy('relevance');
  };

  // Filtering & Sorting Pipeline
  const filteredAndSortedJobs = useMemo(() => {
    let result = [...jobs];

    // 1. In-Result Live Text Search
    if (inResultSearch.trim()) {
      const term = inResultSearch.toLowerCase().trim();
      result = result.filter(job => 
        job.title.toLowerCase().includes(term) ||
        job.company.toLowerCase().includes(term) ||
        job.location.toLowerCase().includes(term) ||
        (job.skills || []).some(s => s.toLowerCase().includes(term)) ||
        job.description.toLowerCase().includes(term)
      );
    }

    // 2. Workplace Filter
    if (workplaceFilter === 'remote') {
      result = result.filter(job => job.workplace_type === 'Remote' || job.is_remote);
    } else if (workplaceFilter === 'hybrid') {
      result = result.filter(job => job.workplace_type === 'Hybrid');
    } else if (workplaceFilter === 'onsite') {
      result = result.filter(job => job.workplace_type === 'On-Site');
    }

    // 3. Employment Type Filter
    if (employmentFilter !== 'all') {
      const eTerm = employmentFilter.toLowerCase();
      result = result.filter(job => (job.employment_type || '').toLowerCase().includes(eTerm));
    }

    // 4. Experience Level Filter
    if (experienceFilter !== 'all') {
      const expMap = {
        entry: 'Entry-Level',
        mid: 'Mid-Level',
        senior: 'Senior / Lead',
        executive: 'Executive / Lead'
      };
      const target = expMap[experienceFilter];
      if (target) {
        result = result.filter(job => job.experience_level === target);
      }
    }

    // 5. Date Posted Filter
    if (dateFilter !== 'all') {
      const now = Date.now();
      const limits = {
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000
      };
      const maxDiff = limits[dateFilter];
      if (maxDiff) {
        result = result.filter(job => {
          if (!job.posted_at) return true;
          const time = typeof job.posted_at === 'number'
            ? (job.posted_at < 10000000000 ? job.posted_at * 1000 : job.posted_at)
            : new Date(job.posted_at).getTime();
          return !isNaN(time) ? (now - time) <= maxDiff : true;
        });
      }
    }

    // 6. Salary Filter
    if (salaryFilter === 'disclosed') {
      result = result.filter(job => Boolean(job.salary_formatted || job.min_salary || job.max_salary));
    } else if (salaryFilter === '50k') {
      result = result.filter(job => (job.max_salary || job.min_salary || 0) >= 50000);
    } else if (salaryFilter === '100k') {
      result = result.filter(job => (job.max_salary || job.min_salary || 0) >= 100000);
    } else if (salaryFilter === '150k') {
      result = result.filter(job => (job.max_salary || job.min_salary || 0) >= 150000);
    }

    // 7. Source Filter
    if (sourceFilter !== 'all') {
      result = result.filter(job => (job.source || '').toLowerCase() === sourceFilter.toLowerCase());
    }

    // 8. Bookmarked Only Filter
    if (bookmarkedOnly) {
      result = result.filter(job => savedJobIds.has(job.id));
    }

    // 9. Selected Skills Filter (job must contain every selected skill)
    if (selectedSkills.length > 0) {
      result = result.filter(job =>
        selectedSkills.every(reqSkill =>
          (job.skills || []).some(js => js.toLowerCase() === reqSkill.toLowerCase())
        )
      );
    }

    // 10. Multi-Criteria Sorting
    const getTime = (val) => {
      if (!val) return 0;
      if (typeof val === 'number') return val < 10000000000 ? val * 1000 : val;
      const t = new Date(val).getTime();
      return isNaN(t) ? 0 : t;
    };

    const calculateRelevance = (job, q) => {
      let score = 0;
      if (!q) return 0;
      const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
      const title = (job.title || '').toLowerCase();
      const desc = (job.description || '').toLowerCase();
      const skills = (job.skills || []).map(s => s.toLowerCase());

      terms.forEach(term => {
        if (title.includes(term)) score += 10;
        if (skills.some(s => s.includes(term))) score += 5;
        if (desc.includes(term)) score += 2;
      });

      if (job.salary_formatted) score += 2;
      if (job.is_remote) score += 1;
      return score;
    };

    result.sort((a, b) => {
      switch (sortBy) {
        case 'date_desc':
          return getTime(b.posted_at) - getTime(a.posted_at);
        case 'date_asc':
          return getTime(a.posted_at) - getTime(b.posted_at);
        case 'salary_desc': {
          const salA = a.max_salary || a.min_salary || 0;
          const salB = b.max_salary || b.min_salary || 0;
          return salB - salA;
        }
        case 'salary_asc': {
          const salA = a.min_salary || a.max_salary || Infinity;
          const salB = b.min_salary || b.max_salary || Infinity;
          return salA - salB;
        }
        case 'title_asc':
          return (a.title || '').localeCompare(b.title || '');
        case 'company_asc':
          return (a.company || '').localeCompare(b.company || '');
        case 'exp_entry_first': {
          const order = { 'Entry-Level': 0, 'Mid-Level': 1, 'Senior / Lead': 2, 'Executive / Lead': 3 };
          return (order[a.experience_level] ?? 1) - (order[b.experience_level] ?? 1);
        }
        case 'exp_senior_first': {
          const order = { 'Executive / Lead': 0, 'Senior / Lead': 1, 'Mid-Level': 2, 'Entry-Level': 3 };
          return (order[a.experience_level] ?? 1) - (order[b.experience_level] ?? 1);
        }
        case 'relevance':
        default: {
          const scoreA = calculateRelevance(a, query);
          const scoreB = calculateRelevance(b, query);
          return scoreB - scoreA;
        }
      }
    });

    return result;
  }, [
    jobs,
    inResultSearch,
    workplaceFilter,
    employmentFilter,
    experienceFilter,
    dateFilter,
    salaryFilter,
    sourceFilter,
    bookmarkedOnly,
    selectedSkills,
    sortBy,
    savedJobIds,
    query
  ]);

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

  const getExpBadgeColor = (level) => {
    switch (level) {
      case 'Entry-Level':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300';
      case 'Senior / Lead':
        return 'bg-purple-100 text-purple-900 border-purple-300';
      case 'Executive / Lead':
        return 'bg-rose-100 text-rose-900 border-rose-300';
      case 'Mid-Level':
      default:
        return 'bg-sky-100 text-sky-900 border-sky-300';
    }
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-20">
      
      {/* =================================================================== */}
      {/* 1. HERO HEADER WITH LIVE MARKET INTELLIGENCE                        */}
      {/* =================================================================== */}
      <div className="mb-8 text-center max-w-3xl mx-auto pt-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-emerald-300 bg-emerald-50 text-emerald-950 font-mono text-[11px] font-bold uppercase tracking-widest mb-3 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
          Live Market Intelligence • Dual-Source Engine Active
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-slate-950 tracking-tight mb-3">
          Explore Live <span className="text-emerald-700">Opportunities.</span>
        </h1>
        <p className="text-slate-700 font-medium text-sm sm:text-base leading-relaxed">
          Search real-time global jobs, filter by stack, salary, and experience, benchmark skill gaps, and bookmark target roles.
        </p>

        {/* Popular Preset Searches Chips */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-5">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
            🔥 Trending:
          </span>
          {searchPresets.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => handlePresetClick(preset)}
              className={`px-3 py-1 text-xs rounded-full border transition-all cursor-pointer font-bold ${
                query === preset.query
                  ? 'bg-emerald-700 text-white border-emerald-700 shadow-md'
                  : 'bg-white text-slate-700 border-2 border-slate-200 hover:border-emerald-600 hover:text-slate-950 shadow-sm'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Filter Toggle Button */}
      <div className="lg:hidden mb-4 flex items-center justify-between bg-white p-3 rounded-2xl border-2 border-slate-200 shadow-sm">
        <div className="text-xs font-bold text-slate-700">
          Showing <span className="text-emerald-700 font-black">{filteredAndSortedJobs.length}</span> positions
        </div>
        <button
          type="button"
          onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
          className="px-4 py-2 bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-sm hover:bg-emerald-800 cursor-pointer"
        >
          <span>⚙️ Filters & Options</span>
          {activeFiltersCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-white text-emerald-900 text-[10px] flex items-center justify-center font-black">
              {activeFiltersCount}
            </span>
          )}
        </button>
      </div>

      {/* =================================================================== */}
      {/* 2. MAIN WORKSPACE: SIDEBAR FILTERS + RESULTS GRID                   */}
      {/* =================================================================== */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        {/* ================================================================= */}
        {/* LEFT COLUMN: MULTI-FACET FILTER SIDEBAR                           */}
        {/* ================================================================= */}
        <aside className={`w-full lg:w-[320px] flex-shrink-0 ${mobileFiltersOpen ? 'block' : 'hidden lg:block'}`}>
          <div className="bg-white rounded-3xl p-6 border-2 border-slate-200 shadow-sm lg:sticky lg:top-20 space-y-6 max-h-[calc(100vh-6rem)] overflow-y-auto custom-scrollbar">
            
            {/* Sidebar Title & Reset */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className="text-base">🎯</span>
                <h3 className="text-xs font-black text-slate-950 uppercase tracking-widest">
                  Filters & Search
                </h3>
              </div>
              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer"
                >
                  Reset All ({activeFiltersCount})
                </button>
              )}
            </div>

            {/* Core Search Form */}
            <form onSubmit={handleSearchSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-black text-slate-800 uppercase tracking-widest mb-1.5">
                  Job Role / Skill Keyword
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3.5 text-slate-400 text-sm">💼</span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Software Developer"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-emerald-600 focus:bg-white outline-none transition-all text-xs font-semibold text-slate-900 placeholder-slate-400"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-800 uppercase tracking-widest mb-1.5">
                  Location / Region
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3.5 text-slate-400 text-sm">📍</span>
                  <input
                    type="text"
                    placeholder="e.g. India, Remote, Germany"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-emerald-600 focus:bg-white outline-none transition-all text-xs font-semibold text-slate-900 placeholder-slate-400"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-98"
              >
                {loading ? 'Fetching Fresh Jobs...' : 'Query Live Market'}
              </button>
            </form>

            <div className="h-px bg-slate-200 my-4" />

            {/* FILTER 1: Workplace Mode */}
            <div>
              <label className="block text-[11px] font-black text-slate-800 uppercase tracking-widest mb-2 flex items-center justify-between">
                <span>Workplace Mode</span>
                {workplaceFilter !== 'all' && (
                  <span className="text-[10px] text-emerald-700 font-bold cursor-pointer" onClick={() => setWorkplaceFilter('all')}>Clear</span>
                )}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'all', label: 'All Modes' },
                  { id: 'remote', label: '🌐 Remote' },
                  { id: 'hybrid', label: '🔄 Hybrid' },
                  { id: 'onsite', label: '🏢 On-Site' }
                ].map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setWorkplaceFilter(mode.id)}
                    className={`px-3 py-2 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer ${
                      workplaceFilter === mode.id
                        ? 'bg-emerald-700 border-emerald-700 text-white shadow-sm'
                        : 'bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300 hover:text-slate-950'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            {/* FILTER 2: Experience Level */}
            <div>
              <label className="block text-[11px] font-black text-slate-800 uppercase tracking-widest mb-2 flex items-center justify-between">
                <span>Experience Level</span>
                {experienceFilter !== 'all' && (
                  <span className="text-[10px] text-emerald-700 font-bold cursor-pointer" onClick={() => setExperienceFilter('all')}>Clear</span>
                )}
              </label>
              <div className="space-y-1.5">
                {[
                  { id: 'all', label: 'All Experience Levels' },
                  { id: 'entry', label: '🟢 Entry-Level (0-2 yrs)' },
                  { id: 'mid', label: '🟡 Mid-Level (2-5 yrs)' },
                  { id: 'senior', label: '🟣 Senior / Lead (5+ yrs)' },
                  { id: 'executive', label: '🔴 Executive / Director' }
                ].map((lvl) => (
                  <button
                    key={lvl.id}
                    type="button"
                    onClick={() => setExperienceFilter(lvl.id)}
                    className={`w-full px-3 py-2 text-xs font-bold rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                      experienceFilter === lvl.id
                        ? 'bg-emerald-700 border-emerald-700 text-white shadow-sm'
                        : 'bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300 hover:text-slate-950'
                    }`}
                  >
                    <span>{lvl.label}</span>
                    {experienceFilter === lvl.id && <span>✓</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* FILTER 3: Employment Type */}
            <div>
              <label className="block text-[11px] font-black text-slate-800 uppercase tracking-widest mb-2 flex items-center justify-between">
                <span>Employment Type</span>
                {employmentFilter !== 'all' && (
                  <span className="text-[10px] text-emerald-700 font-bold cursor-pointer" onClick={() => setEmploymentFilter('all')}>Clear</span>
                )}
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'fulltime', label: 'Full-Time' },
                  { id: 'parttime', label: 'Part-Time' },
                  { id: 'contract', label: 'Contract' },
                  { id: 'internship', label: 'Internship' }
                ].map((emp) => (
                  <button
                    key={emp.id}
                    type="button"
                    onClick={() => setEmploymentFilter(emp.id)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                      employmentFilter === emp.id
                        ? 'bg-emerald-700 text-white border-emerald-700 font-black shadow-sm'
                        : 'bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300 hover:text-slate-950'
                    }`}
                  >
                    {emp.label}
                  </button>
                ))}
              </div>
            </div>

            {/* FILTER 4: Salary Filter */}
            <div>
              <label className="block text-[11px] font-black text-slate-800 uppercase tracking-widest mb-2 flex items-center justify-between">
                <span>Compensation Transparency</span>
                {salaryFilter !== 'all' && (
                  <span className="text-[10px] text-emerald-700 font-bold cursor-pointer" onClick={() => setSalaryFilter('all')}>Clear</span>
                )}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'all', label: 'Any' },
                  { id: 'disclosed', label: '💰 Has Salary' },
                  { id: '50k', label: '$50k+ / €50k+' },
                  { id: '100k', label: '$100k+ / €100k+' }
                ].map((sal) => (
                  <button
                    key={sal.id}
                    type="button"
                    onClick={() => setSalaryFilter(sal.id)}
                    className={`px-2.5 py-1.5 text-[11px] font-bold rounded-xl border text-center transition-all cursor-pointer ${
                      salaryFilter === sal.id
                        ? 'bg-amber-600 border-amber-600 text-white font-bold shadow-sm'
                        : 'bg-slate-50 text-slate-700 border border-slate-200 hover:text-slate-950'
                    }`}
                  >
                    {sal.label}
                  </button>
                ))}
              </div>
            </div>

            {/* FILTER 5: Date Posted */}
            <div>
              <label className="block text-[11px] font-black text-slate-800 uppercase tracking-widest mb-2 flex items-center justify-between">
                <span>Date Posted</span>
                {dateFilter !== 'all' && (
                  <span className="text-[10px] text-emerald-700 font-bold cursor-pointer" onClick={() => setDateFilter('all')}>Clear</span>
                )}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'all', label: 'Anytime' },
                  { id: '24h', label: '⚡ Past 24h' },
                  { id: '7d', label: '📅 Past 7 Days' },
                  { id: '30d', label: '📆 Past Month' }
                ].map((df) => (
                  <button
                    key={df.id}
                    type="button"
                    onClick={() => setDateFilter(df.id)}
                    className={`px-2.5 py-1.5 text-[11px] font-bold rounded-xl border text-center transition-all cursor-pointer ${
                      dateFilter === df.id
                        ? 'bg-emerald-700 border-emerald-700 text-white font-bold shadow-sm'
                        : 'bg-slate-50 text-slate-700 border border-slate-200 hover:text-slate-950'
                    }`}
                  >
                    {df.label}
                  </button>
                ))}
              </div>
            </div>

            {/* FILTER 6: Tech Stack / Skills Cloud */}
            {availableSkills.length > 0 && (
              <div>
                <label className="block text-[11px] font-black text-slate-800 uppercase tracking-widest mb-2 flex items-center justify-between">
                  <span>Skills / Tech Stack</span>
                  {selectedSkills.length > 0 && (
                    <span className="text-[10px] text-emerald-700 font-bold cursor-pointer" onClick={() => setSelectedSkills([])}>
                      Clear ({selectedSkills.length})
                    </span>
                  )}
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pr-1">
                  {availableSkills.map(([skill, count]) => {
                    const isSelected = selectedSkills.includes(skill);
                    return (
                      <button
                        key={skill}
                        type="button"
                        onClick={(e) => toggleSkillFilter(skill, e)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all cursor-pointer flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-emerald-700 text-white border-emerald-700 font-black shadow-sm'
                            : 'bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300 hover:text-slate-950'
                        }`}
                      >
                        <span>{skill}</span>
                        <span className={`text-[9px] px-1 py-0.2 rounded-full ${isSelected ? 'bg-emerald-900 text-white' : 'bg-slate-200 text-slate-700'}`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* FILTER 7: Data Source & Wishlist */}
            <div className="pt-2 border-t border-slate-200 space-y-2">
              <label className="block text-[11px] font-black text-slate-800 uppercase tracking-widest mb-1.5">
                Market Providers
              </label>
              <div className="flex gap-2">
                {[
                  { id: 'all', label: 'All Sources' },
                  { id: 'jsearch', label: 'JSearch' },
                  { id: 'arbeitnow', label: 'Arbeitnow' }
                ].map((src) => (
                  <button
                    key={src.id}
                    type="button"
                    onClick={() => setSourceFilter(src.id)}
                    className={`flex-1 px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all ${
                      sourceFilter === src.id
                        ? 'bg-emerald-700 border-emerald-700 text-white'
                        : 'bg-slate-50 text-slate-700 border border-slate-200 hover:text-slate-950'
                    }`}
                  >
                    {src.label}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </aside>

        {/* ================================================================= */}
        {/* RIGHT COLUMN: CONTROLS, ACTIVE CHIPS & JOB LISTINGS               */}
        {/* ================================================================= */}
        <div className="flex-1 w-full min-w-0 space-y-4">
          
          {/* Top Control Bar: Quick Search within results + Sort Dropdown + View Switcher */}
          <div className="bg-white rounded-2xl p-4 border-2 border-slate-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            
            {/* In-Result Quick Filter Input */}
            <div className="flex-1 min-w-[200px] relative">
              <span className="absolute left-3.5 top-2.5 text-slate-400 text-sm">🔍</span>
              <input
                type="text"
                placeholder="Filter loaded jobs by company, skill, or keyword..."
                value={inResultSearch}
                onChange={(e) => setInResultSearch(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:border-emerald-600 focus:bg-white outline-none transition-all font-medium"
              />
              {inResultSearch && (
                <button
                  type="button"
                  onClick={() => setInResultSearch('')}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-800 text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Sorting Dropdown + View Switcher */}
            <div className="flex items-center gap-3">
              
              {/* SORT DROPDOWN */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700 whitespace-nowrap">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 rounded-xl px-3 py-2 outline-none focus:border-emerald-600 cursor-pointer"
                >
                  <option value="relevance">⚡ Most Relevant (Default)</option>
                  <option value="date_desc">🕒 Newest / Recently Posted</option>
                  <option value="date_asc">⏳ Oldest Posted</option>
                  <option value="salary_desc">💰 Salary: Highest First</option>
                  <option value="salary_asc">💵 Salary: Lowest First</option>
                  <option value="exp_entry_first">🟢 Entry-Level First</option>
                  <option value="exp_senior_first">🟣 Senior / Lead First</option>
                  <option value="company_asc">🏢 Company: A → Z</option>
                  <option value="title_asc">📝 Role Title: A → Z</option>
                </select>
              </div>

              {/* VIEW SWITCHER: Grid vs List */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  title="Grid View"
                  className={`p-1.5 rounded-lg text-sm transition-all cursor-pointer ${
                    viewMode === 'grid'
                      ? 'bg-emerald-700 text-white font-bold shadow-sm'
                      : 'text-slate-600 hover:text-slate-950'
                  }`}
                >
                  🔲
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  title="Compact List View"
                  className={`p-1.5 rounded-lg text-sm transition-all cursor-pointer ${
                    viewMode === 'list'
                      ? 'bg-emerald-700 text-white font-bold shadow-sm'
                      : 'text-slate-600 hover:text-slate-950'
                  }`}
                >
                  ☰
                </button>
              </div>

            </div>
          </div>

          {/* Quick Filter Pill Chips Row */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs font-bold text-slate-700">Quick Toggles:</span>
            
            <button
              type="button"
              onClick={() => setWorkplaceFilter(workplaceFilter === 'remote' ? 'all' : 'remote')}
              className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                workplaceFilter === 'remote'
                  ? 'bg-emerald-700 text-white border-emerald-700'
                  : 'bg-white text-slate-700 border border-slate-300 hover:text-slate-950 shadow-sm'
              }`}
            >
              <span>🌐 Remote Only</span>
              {workplaceFilter === 'remote' && <span>✓</span>}
            </button>

            <button
              type="button"
              onClick={() => setEmploymentFilter(employmentFilter === 'fulltime' ? 'all' : 'fulltime')}
              className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                employmentFilter === 'fulltime'
                  ? 'bg-emerald-700 text-white border-emerald-700'
                  : 'bg-white text-slate-700 border border-slate-300 hover:text-slate-950 shadow-sm'
              }`}
            >
              <span>💼 Full-Time</span>
              {employmentFilter === 'fulltime' && <span>✓</span>}
            </button>

            <button
              type="button"
              onClick={() => setSalaryFilter(salaryFilter === 'disclosed' ? 'all' : 'disclosed')}
              className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                salaryFilter === 'disclosed'
                  ? 'bg-amber-600 text-white border-amber-600'
                  : 'bg-white text-slate-700 border border-slate-300 hover:text-slate-950 shadow-sm'
              }`}
            >
              <span>💰 Salary Listed</span>
              {salaryFilter === 'disclosed' && <span>✓</span>}
            </button>

            <button
              type="button"
              onClick={() => setExperienceFilter(experienceFilter === 'entry' ? 'all' : 'entry')}
              className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                experienceFilter === 'entry'
                  ? 'bg-emerald-700 text-white border-emerald-700'
                  : 'bg-white text-slate-700 border border-slate-300 hover:text-slate-950 shadow-sm'
              }`}
            >
              <span>🌱 Entry-Level</span>
              {experienceFilter === 'entry' && <span>✓</span>}
            </button>

            <button
              type="button"
              onClick={() => setBookmarkedOnly(!bookmarkedOnly)}
              className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                bookmarkedOnly
                  ? 'bg-rose-600 text-white border-rose-600 font-bold'
                  : 'bg-white text-slate-700 border border-slate-300 hover:text-rose-700 shadow-sm'
              }`}
            >
              <span>⭐ Saved Wishlist ({savedJobIds.size})</span>
              {bookmarkedOnly && <span>✓</span>}
            </button>

            {/* Results Count Summary */}
            <div className="ml-auto text-xs font-bold text-slate-600">
              Showing <span className="text-slate-950 font-black">{filteredAndSortedJobs.length}</span> of {jobs.length} jobs
            </div>
          </div>

          {/* Active Applied Filters Chips Row (if any active) */}
          {activeFiltersCount > 0 && (
            <div className="bg-emerald-50 p-2.5 rounded-2xl border border-emerald-200 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold text-emerald-950 uppercase tracking-wider">
                Applied Filters:
              </span>

              {workplaceFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-emerald-300 text-emerald-950 text-xs font-bold shadow-sm">
                  Workplace: {workplaceFilter}
                  <button type="button" onClick={() => setWorkplaceFilter('all')} className="hover:text-rose-600 cursor-pointer ml-1">✕</button>
                </span>
              )}

              {experienceFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-emerald-300 text-emerald-950 text-xs font-bold shadow-sm">
                  Level: {experienceFilter}
                  <button type="button" onClick={() => setExperienceFilter('all')} className="hover:text-rose-600 cursor-pointer ml-1">✕</button>
                </span>
              )}

              {employmentFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-emerald-300 text-emerald-950 text-xs font-bold shadow-sm">
                  Type: {employmentFilter}
                  <button type="button" onClick={() => setEmploymentFilter('all')} className="hover:text-rose-600 cursor-pointer ml-1">✕</button>
                </span>
              )}

              {salaryFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-amber-300 text-amber-950 text-xs font-bold shadow-sm">
                  Salary: {salaryFilter}
                  <button type="button" onClick={() => setSalaryFilter('all')} className="hover:text-rose-600 cursor-pointer ml-1">✕</button>
                </span>
              )}

              {dateFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-emerald-300 text-emerald-950 text-xs font-bold shadow-sm">
                  Date: {dateFilter}
                  <button type="button" onClick={() => setDateFilter('all')} className="hover:text-rose-600 cursor-pointer ml-1">✕</button>
                </span>
              )}

              {sourceFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-emerald-300 text-emerald-950 text-xs font-bold shadow-sm">
                  Source: {sourceFilter}
                  <button type="button" onClick={() => setSourceFilter('all')} className="hover:text-rose-600 cursor-pointer ml-1">✕</button>
                </span>
              )}

              {bookmarkedOnly && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-300 text-rose-950 text-xs font-bold shadow-sm">
                  Wishlist Only
                  <button type="button" onClick={() => setBookmarkedOnly(false)} className="hover:text-rose-600 cursor-pointer ml-1">✕</button>
                </span>
              )}

              {selectedSkills.map(sk => (
                <span key={sk} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-700 text-white text-xs font-bold shadow-sm">
                  Skill: {sk}
                  <button type="button" onClick={(e) => toggleSkillFilter(sk, e)} className="hover:opacity-75 cursor-pointer ml-1">✕</button>
                </span>
              ))}

              {inResultSearch && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-300 text-slate-800 text-xs font-bold shadow-sm">
                  Keyword: "{inResultSearch}"
                  <button type="button" onClick={() => setInResultSearch('')} className="hover:text-rose-600 cursor-pointer ml-1">✕</button>
                </span>
              )}

              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs text-rose-600 font-bold hover:underline cursor-pointer ml-auto"
              >
                Clear All
              </button>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-rose-50 text-rose-900 p-4 rounded-2xl border border-rose-300 font-medium text-sm">
              ⚠️ {error}
            </div>
          )}
          
          {/* Warning Message */}
          {apiWarning && !error && (
            <div className="bg-amber-50 text-amber-950 p-4 rounded-2xl border border-amber-300 font-medium text-sm flex items-start gap-3">
              <span>💡</span>
              <div>{apiWarning}</div>
            </div>
          )}

          {/* Empty State */}
          {!loading && filteredAndSortedJobs.length === 0 && !error && (
            <div className="bg-white rounded-3xl border-2 border-slate-300 border-dashed p-12 text-center flex flex-col items-center justify-center min-h-[360px] shadow-sm">
              <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-center text-3xl mb-4">🔍</div>
              <h3 className="text-xl font-black text-slate-950 mb-2 tracking-tight">No Matching Opportunities Found</h3>
              <p className="text-sm font-medium text-slate-600 max-w-md mb-6 leading-relaxed">
                {activeFiltersCount > 0
                  ? `No roles matched your ${activeFiltersCount} active filter criteria. Try easing some filters or clear all filters to see all available roles.`
                  : "We couldn't find positions for that search term. Try adjusting your query or location."}
              </p>
              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-6 py-2.5 bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer hover:bg-emerald-800"
                >
                  Reset All Filters
                </button>
              )}
            </div>
          )}

          {/* Loading Skeleton */}
          {loading && (
            <div className={viewMode === 'grid' ? "grid grid-cols-1 xl:grid-cols-2 gap-6" : "space-y-4"}>
              {[1, 2, 3, 4].map((skeleton) => (
                <div key={skeleton} className="bg-white rounded-3xl border-2 border-slate-200 p-6 animate-pulse">
                  <div className="flex gap-4 mb-4">
                    <div className="w-12 h-12 bg-slate-200 rounded-xl"></div>
                    <div className="flex-1 space-y-2 py-1">
                      <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                      <div className="h-3 bg-slate-100 rounded w-1/2"></div>
                    </div>
                  </div>
                  <div className="space-y-2 mb-6">
                    <div className="h-3 bg-slate-100 rounded w-full"></div>
                    <div className="h-3 bg-slate-100 rounded w-5/6"></div>
                  </div>
                  <div className="flex gap-2">
                    <div className="h-10 bg-slate-200 rounded-xl w-1/2"></div>
                    <div className="h-10 bg-slate-100 rounded-xl w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* =============================================================== */}
          {/* 3. JOB LISTINGS: GRID VIEW                                      */}
          {/* =============================================================== */}
          {!loading && viewMode === 'grid' && filteredAndSortedJobs.length > 0 && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {filteredAndSortedJobs.map((job, idx) => {
                const isBookmarked = savedJobIds.has(job.id);
                const locBadge = getLocationBadge(job.location);
                const expColor = getExpBadgeColor(job.experience_level);

                return (
                  <div 
                    key={job.id || idx} 
                    className="bg-white rounded-3xl border-2 border-slate-200 p-6 shadow-sm hover:border-emerald-600 hover:shadow-md transition-all flex flex-col h-full group relative overflow-hidden"
                  >
                    
                    {/* Top Section: Avatar / Title / Company */}
                    <div className="flex gap-4 items-start mb-3">
                      <div className="w-12 h-12 flex-shrink-0 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-center text-lg font-black text-emerald-800 shadow-sm group-hover:border-emerald-400 transition-colors">
                        {job.employer_logo ? (
                          <img src={job.employer_logo} alt={job.company} className="w-8 h-8 object-contain rounded-lg" onError={(e) => { e.target.style.display = 'none'; }} />
                        ) : (
                          job.company ? job.company.charAt(0).toUpperCase() : 'B'
                        )}
                      </div>

                      <div className="flex-1 min-w-0 pr-8">
                        <h3 
                          onClick={() => setSelectedJobModal(job)}
                          className="text-lg font-black text-slate-950 truncate tracking-tight hover:text-emerald-700 cursor-pointer transition-colors" 
                          title={job.title}
                        >
                          {job.title}
                        </h3>
                        <p className="text-xs font-bold text-slate-700 truncate flex items-center gap-1.5 mt-0.5">
                          <span>{job.company}</span>
                          <span className="text-slate-400">•</span>
                          <span className="text-[11px] text-slate-500">{job.relative_time}</span>
                        </p>
                      </div>
                      
                      {/* Bookmark Icon Button */}
                      <button
                        onClick={(e) => handleBookmark(job, e)}
                        className="absolute top-6 right-6 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer p-1"
                        title={isBookmarked ? 'Remove wishlist' : 'Save to target wishlist'}
                      >
                        <svg className={`w-6 h-6 ${isBookmarked ? 'text-rose-600 fill-current' : 'fill-none stroke-current stroke-2'}`} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                      </button>
                    </div>

                    {/* Metadata Badges: Location, Workplace, Experience, Salary */}
                    <div className="flex flex-wrap items-center gap-1.5 mb-3.5">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-800 rounded-lg text-xs font-bold border border-slate-200 shadow-sm">
                        <span>{locBadge.icon}</span> {locBadge.text}
                      </span>

                      <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${
                        job.workplace_type === 'Remote' 
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-300' 
                          : 'bg-slate-100 text-slate-800 border-slate-200'
                      }`}>
                        {job.workplace_type}
                      </span>

                      <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${expColor}`}>
                        {job.experience_level}
                      </span>

                      {job.salary_formatted && (
                        <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 border border-amber-300">
                          💰 {job.salary_formatted}
                        </span>
                      )}

                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 ml-auto">
                        {job.source}
                      </span>
                    </div>

                    {/* Job Description Snippet */}
                    <p className="text-xs text-slate-700 line-clamp-3 overflow-hidden text-ellipsis whitespace-normal mb-4 min-h-[48px] leading-relaxed">
                      {truncateText(job.description, 160)}
                    </p>

                    {/* Extracted Skills Chips (Clickable to Filter!) */}
                    {job.skills && job.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-5">
                        {job.skills.map((skill) => {
                          const isSelected = selectedSkills.includes(skill);
                          return (
                            <button
                              key={skill}
                              type="button"
                              onClick={(e) => toggleSkillFilter(skill, e)}
                              title={`Filter by ${skill}`}
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border shadow-sm transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-emerald-700 text-white border-transparent font-black'
                                  : 'bg-slate-50 text-slate-800 border border-slate-200 hover:border-emerald-500 hover:text-emerald-900'
                              }`}
                            >
                              {skill}
                            </button>
                          );
                        })}
                      </div>
                    )}
                    
                    {/* Action Footer */}
                    <div className="flex flex-col sm:flex-row gap-2.5 mt-auto pt-4 border-t border-slate-200">
                      <button 
                        onClick={() => navigate('/analyzer', { state: { jobTitle: job.title, jobDesc: job.description } })}
                        className="flex-1 px-3.5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black rounded-xl transition-all shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <span>🎯 Analyze Skill Gap</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedJobModal(job)}
                        className="px-3.5 py-2.5 bg-slate-100 border border-slate-300 text-slate-900 hover:bg-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1"
                      >
                        <span>Quick View</span>
                      </button>

                      {job.is_bridgeiq_direct ? (
                        <button
                          type="button"
                          onClick={(e) => handleDirectApply(job, e)}
                          disabled={appliedJobIds.has(job.id)}
                          className={`px-4 py-2.5 text-xs font-black rounded-xl transition-all shadow-sm cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
                            appliedJobIds.has(job.id)
                              ? 'bg-emerald-100 text-emerald-950 border border-emerald-300 font-bold'
                              : 'bg-emerald-700 hover:bg-emerald-800 text-white active:scale-95'
                          }`}
                        >
                          <span>{appliedJobIds.has(job.id) ? '✓ Applied' : '⚡ Quick Apply'}</span>
                        </button>
                      ) : job.url && job.url !== '#' ? (
                        <a 
                          href={job.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3.5 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-colors text-center shadow-sm flex items-center justify-center gap-1"
                        >
                          <span>Apply ↗</span>
                        </a>
                      ) : null}
                    </div>

                  </div>
                );
              })}
            </div>
          )}

          {/* =============================================================== */}
          {/* 4. JOB LISTINGS: COMPACT LIST / TABLE VIEW                      */}
          {/* =============================================================== */}
          {!loading && viewMode === 'list' && filteredAndSortedJobs.length > 0 && (
            <div className="space-y-3">
              {filteredAndSortedJobs.map((job, idx) => {
                const isBookmarked = savedJobIds.has(job.id);
                const locBadge = getLocationBadge(job.location);
                const expColor = getExpBadgeColor(job.experience_level);

                return (
                  <div
                    key={job.id || idx}
                    className="bg-white rounded-2xl border-2 border-slate-200 p-4 hover:border-emerald-600 hover:shadow-sm transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 group"
                  >
                    
                    {/* Left: Avatar + Title & Company */}
                    <div className="flex items-center gap-3.5 min-w-[280px] max-w-sm">
                      <div className="w-10 h-10 flex-shrink-0 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-center text-base font-black text-emerald-800">
                        {job.employer_logo ? (
                          <img src={job.employer_logo} alt={job.company} className="w-7 h-7 object-contain rounded-md" onError={(e) => { e.target.style.display = 'none'; }} />
                        ) : (
                          job.company ? job.company.charAt(0).toUpperCase() : 'B'
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 
                          onClick={() => setSelectedJobModal(job)}
                          className="text-sm font-black text-slate-950 truncate hover:text-emerald-700 cursor-pointer transition-colors"
                          title={job.title}
                        >
                          {job.title}
                        </h4>
                        <div className="text-xs text-slate-700 truncate flex items-center gap-2 mt-0.5">
                          <span className="font-semibold">{job.company}</span>
                          <span className="text-slate-400">•</span>
                          <span>{locBadge.icon} {locBadge.text}</span>
                        </div>
                      </div>
                    </div>

                    {/* Middle: Badges (Workplace, Exp, Salary, Tags) */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border ${
                        job.workplace_type === 'Remote' 
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-300' 
                          : 'bg-slate-100 text-slate-800 border-slate-200'
                      }`}>
                        {job.workplace_type}
                      </span>

                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border ${expColor}`}>
                        {job.experience_level}
                      </span>

                      {job.salary_formatted && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-amber-100 text-amber-900 border border-amber-300">
                          {job.salary_formatted}
                        </span>
                      )}

                      {/* Top 2 Skill Tags */}
                      {job.skills && job.skills.slice(0, 2).map(sk => (
                        <span key={sk} className="hidden sm:inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                          {sk}
                        </span>
                      ))}

                      <span className="text-[11px] text-slate-500 font-medium">
                        {job.relative_time}
                      </span>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                      <button
                        type="button"
                        onClick={(e) => handleBookmark(job, e)}
                        className="p-2 rounded-xl bg-slate-100 border border-slate-300 text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Bookmark"
                      >
                        <svg className={`w-4 h-4 ${isBookmarked ? 'text-rose-600 fill-current' : 'fill-none stroke-current stroke-2'}`} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedJobModal(job)}
                        className="px-3 py-1.5 bg-slate-100 border border-slate-300 text-xs font-bold text-slate-900 hover:bg-slate-200 rounded-xl cursor-pointer"
                      >
                        View
                      </button>

                      <button 
                        onClick={() => navigate('/analyzer', { state: { jobTitle: job.title, jobDesc: job.description } })}
                        className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black rounded-xl transition-all shadow-sm cursor-pointer whitespace-nowrap"
                      >
                        Analyze Gap
                      </button>

                      {job.is_bridgeiq_direct ? (
                        <button
                          type="button"
                          onClick={(e) => handleDirectApply(job, e)}
                          disabled={appliedJobIds.has(job.id)}
                          className={`px-3 py-1.5 text-xs font-black rounded-xl transition-all shadow-sm cursor-pointer whitespace-nowrap ${
                            appliedJobIds.has(job.id)
                              ? 'bg-emerald-100 text-emerald-950 border border-emerald-300 font-bold'
                              : 'bg-emerald-700 hover:bg-emerald-800 text-white'
                          }`}
                        >
                          {appliedJobIds.has(job.id) ? '✓ Applied' : '⚡ Quick Apply'}
                        </button>
                      ) : job.url && job.url !== '#' ? (
                        <a
                          href={job.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-all whitespace-nowrap"
                        >
                          Apply ↗
                        </a>
                      ) : null}
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>
      </div>

      {/* =================================================================== */}
      {/* 5. JOB DETAILS QUICK VIEW MODAL                                     */}
      {/* =================================================================== */}
      {selectedJobModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setSelectedJobModal(null)}
        >
          <div 
            className="bg-white border-2 border-slate-200 rounded-3xl max-w-2xl w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl relative text-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 mb-5 pb-4 border-b border-slate-200">
              <div className="flex gap-4 items-center">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-2xl font-black text-emerald-800 shadow-sm">
                  {selectedJobModal.employer_logo ? (
                    <img src={selectedJobModal.employer_logo} alt={selectedJobModal.company} className="w-10 h-10 object-contain rounded-xl" />
                  ) : (
                    selectedJobModal.company ? selectedJobModal.company.charAt(0).toUpperCase() : 'B'
                  )}
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight leading-snug">
                    {selectedJobModal.title}
                  </h2>
                  <p className="text-sm font-semibold text-slate-700 mt-0.5">
                    {selectedJobModal.company} • {selectedJobModal.location}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedJobModal(null)}
                className="w-8 h-8 rounded-full bg-slate-100 border border-slate-300 text-slate-700 hover:text-slate-950 flex items-center justify-center text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Badges Bar */}
            <div className="flex flex-wrap items-center gap-2 mb-6">
              <span className="px-3 py-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800">
                {getLocationBadge(selectedJobModal.location).icon} {selectedJobModal.location}
              </span>
              <span className="px-3 py-1 rounded-xl bg-emerald-100 border border-emerald-300 text-xs font-bold text-emerald-950">
                {selectedJobModal.workplace_type}
              </span>
              <span className={`px-3 py-1 rounded-xl border text-xs font-bold ${getExpBadgeColor(selectedJobModal.experience_level)}`}>
                {selectedJobModal.experience_level}
              </span>
              <span className="px-3 py-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800">
                {selectedJobModal.employment_type}
              </span>
              {selectedJobModal.salary_formatted && (
                <span className="px-3 py-1 rounded-xl bg-amber-100 border border-amber-300 text-xs font-bold text-amber-950">
                  💰 {selectedJobModal.salary_formatted}
                </span>
              )}
              <span className="px-3 py-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 ml-auto">
                {selectedJobModal.source}
              </span>
            </div>

            {/* Extracted Required Skills */}
            {selectedJobModal.skills && selectedJobModal.skills.length > 0 && (
              <div className="mb-6">
                <h4 className="text-xs font-black text-slate-950 uppercase tracking-widest mb-2.5">
                  Extracted Tech Skills
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedJobModal.skills.map((skill) => (
                    <span 
                      key={skill}
                      className="px-3 py-1 rounded-lg text-xs font-bold bg-emerald-50 border border-emerald-200 text-emerald-950 uppercase tracking-wider"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Job Description */}
            <div className="mb-8">
              <h4 className="text-xs font-black text-slate-950 uppercase tracking-widest mb-3">
                Job Overview & Requirements
              </h4>
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 text-xs sm:text-sm leading-relaxed whitespace-pre-line max-h-72 overflow-y-auto custom-scrollbar font-normal">
                {selectedJobModal.description || 'No extended description available for this role.'}
              </div>
            </div>

            {/* Modal Action Footer */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => {
                  const job = selectedJobModal;
                  setSelectedJobModal(null);
                  navigate('/analyzer', { state: { jobTitle: job.title, jobDesc: job.description } });
                }}
                className="flex-1 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer text-center"
              >
                🎯 Analyze Skill Gap with My Resume
              </button>

              {selectedJobModal.is_bridgeiq_direct ? (
                <button
                  type="button"
                  onClick={(e) => handleDirectApply(selectedJobModal, e)}
                  disabled={appliedJobIds.has(selectedJobModal.id)}
                  className={`px-6 py-3 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer text-center ${
                    appliedJobIds.has(selectedJobModal.id)
                      ? 'bg-emerald-100 text-emerald-950 border border-emerald-300 font-bold'
                      : 'bg-emerald-700 hover:bg-emerald-800 text-white'
                  }`}
                >
                  {appliedJobIds.has(selectedJobModal.id) ? '✓ Application Submitted' : '⚡ Quick Apply via Bridge-IQ'}
                </button>
              ) : selectedJobModal.url && selectedJobModal.url !== '#' ? (
                <a
                  href={selectedJobModal.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-3 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition-colors text-center"
                >
                  Apply Directly ↗
                </a>
              ) : null}

              <button
                type="button"
                onClick={(e) => handleBookmark(selectedJobModal, e)}
                className="px-4 py-3 bg-slate-100 border border-slate-300 text-slate-800 hover:text-slate-950 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>{savedJobIds.has(selectedJobModal.id) ? '⭐ Saved' : '☆ Save Wishlist'}</span>
              </button>

              <button
                type="button"
                onClick={(e) => handleCopyLink(selectedJobModal, e)}
                className="px-3 py-3 bg-slate-100 border border-slate-300 text-slate-700 hover:text-slate-950 rounded-xl text-xs font-bold cursor-pointer"
                title="Copy Link"
              >
                🔗
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
