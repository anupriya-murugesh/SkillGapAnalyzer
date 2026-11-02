import { supabase, withTimeout } from '../lib/supabaseClient';

const getLocalId = (data) => data.job_id || data.title || Date.now().toString();

export const saveAnalysisResult = async (analysisData) => {
  // Always persist locally for 0ms guarantee
  try {
    const history = JSON.parse(localStorage.getItem('gap_analyses') || '[]');
    history.unshift({ id: Date.now(), data: analysisData, created_at: new Date().toISOString() });
    localStorage.setItem('gap_analyses', JSON.stringify(history.slice(0, 50)));
  } catch {}

  // Background sync if authenticated
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (user && !user.email?.includes('demo')) {
      withTimeout(
        supabase.from('gap_analyses').insert([{ user_id: user.id, data: analysisData }]),
        1000
      ).catch(() => {});
    }
  } catch {}
};

export const getAnalysisHistory = async () => {
  const localHistory = JSON.parse(localStorage.getItem('gap_analyses') || '[]');

  // Background fetch if connected
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (user && !user.email?.includes('demo')) {
      withTimeout(
        supabase.from('gap_analyses').select('*').order('created_at', { ascending: false }),
        1000
      ).then((res) => {
        if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
          try {
            localStorage.setItem('gap_analyses', JSON.stringify(res.data));
          } catch {}
        }
      }).catch(() => {});
    }
  } catch {}

  return localHistory;
};

export const saveJobBookmark = async (jobData) => {
  const jobId = getLocalId(jobData);
  try {
    const jobs = JSON.parse(localStorage.getItem('saved_jobs') || '[]');
    if (!jobs.find(j => (j.data?.job_id || j.id) === jobId)) {
      jobs.unshift({ id: jobId, data: jobData, created_at: new Date().toISOString() });
      localStorage.setItem('saved_jobs', JSON.stringify(jobs));
    }
  } catch {}

  try {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (user && !user.email?.includes('demo')) {
      withTimeout(
        supabase.from('saved_jobs').insert([{ user_id: user.id, job_id: jobId, data: jobData }]),
        1000
      ).catch(() => {});
    }
  } catch {}
};

export const getSavedJobs = async () => {
  const localJobs = JSON.parse(localStorage.getItem('saved_jobs') || '[]');

  try {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (user && !user.email?.includes('demo')) {
      withTimeout(
        supabase.from('saved_jobs').select('*').order('created_at', { ascending: false }),
        1000
      ).then((res) => {
        if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
          try {
            localStorage.setItem('saved_jobs', JSON.stringify(res.data));
          } catch {}
        }
      }).catch(() => {});
    }
  } catch {}

  return localJobs;
};

export const removeJobBookmark = async (jobId) => {
  try {
    const jobs = JSON.parse(localStorage.getItem('saved_jobs') || '[]');
    const filtered = jobs.filter(j => (j.data?.job_id || j.id) !== jobId && j.id !== jobId);
    localStorage.setItem('saved_jobs', JSON.stringify(filtered));
  } catch {}

  try {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (user && !user.email?.includes('demo')) {
      withTimeout(
        supabase.from('saved_jobs').delete().eq('job_id', jobId).eq('user_id', user.id),
        1000
      ).catch(() => {});
    }
  } catch {}
};
