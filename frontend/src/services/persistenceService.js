import { supabase } from '../lib/supabaseClient';

const getLocalId = (data) => data.job_id || data.title || Date.now().toString();

export const saveAnalysisResult = async (analysisData) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;

    if (user && !user.email?.includes('demo')) {
      const { error } = await supabase.from('gap_analyses').insert([
        { user_id: user.id, data: analysisData }
      ]);
      if (error) throw error;
      return;
    }
    throw new Error('No user or demo mode');
  } catch (err) {
    // Fallback to local storage
    const history = JSON.parse(localStorage.getItem('gap_analyses') || '[]');
    history.unshift({ id: Date.now(), data: analysisData, created_at: new Date().toISOString() });
    localStorage.setItem('gap_analyses', JSON.stringify(history.slice(0, 50))); // Keep last 50
  }
};

export const getAnalysisHistory = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;

    if (user && !user.email?.includes('demo')) {
      const { data, error } = await supabase.from('gap_analyses').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }
    throw new Error('No user or demo mode');
  } catch (err) {
    return JSON.parse(localStorage.getItem('gap_analyses') || '[]');
  }
};

export const saveJobBookmark = async (jobData) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    const jobId = getLocalId(jobData);

    if (user && !user.email?.includes('demo')) {
      const { error } = await supabase.from('saved_jobs').insert([
        { user_id: user.id, job_id: jobId, data: jobData }
      ]);
      if (error) throw error;
      return;
    }
    throw new Error('No user or demo mode');
  } catch (err) {
    const jobs = JSON.parse(localStorage.getItem('saved_jobs') || '[]');
    const jobId = getLocalId(jobData);
    if (!jobs.find(j => (j.data?.job_id || j.id) === jobId)) {
      jobs.unshift({ id: jobId, data: jobData, created_at: new Date().toISOString() });
      localStorage.setItem('saved_jobs', JSON.stringify(jobs));
    }
  }
};

export const getSavedJobs = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;

    if (user && !user.email?.includes('demo')) {
      const { data, error } = await supabase.from('saved_jobs').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }
    throw new Error('No user or demo mode');
  } catch (err) {
    return JSON.parse(localStorage.getItem('saved_jobs') || '[]');
  }
};

export const removeJobBookmark = async (jobId) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;

    if (user && !user.email?.includes('demo')) {
      const { error } = await supabase.from('saved_jobs').delete().eq('job_id', jobId).eq('user_id', user.id);
      if (error) throw error;
      return;
    }
    throw new Error('No user or demo mode');
  } catch (err) {
    const jobs = JSON.parse(localStorage.getItem('saved_jobs') || '[]');
    const filtered = jobs.filter(j => (j.data?.job_id || j.id) !== jobId && j.id !== jobId);
    localStorage.setItem('saved_jobs', JSON.stringify(filtered));
  }
};
