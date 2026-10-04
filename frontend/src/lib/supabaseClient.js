import { createClient } from '@supabase/supabase-js';

let supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://lenjytkwvsbxjytfwqce.supabase.co/rest/v1/';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxlbmp5dGt3dnNieGp5dGZ3cWNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEwODczNDMsImV4cCI6MjEwNjY2MzM0M30.xFhCAEscM5B22lTu7rCZEMGivRycqDTZKqfJkba-H5g';

// The JS client strictly requires the base URL. If the REST API path is included, strip it.
if (supabaseUrl.includes('/rest/v1')) {
  supabaseUrl = supabaseUrl.split('/rest/v1')[0];
}

const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Verify the environment variable is actively populated and correctly formatted
const isRealSupabase = supabaseUrl && isValidUrl(supabaseUrl) && !supabaseUrl.includes('placeholder');

export const supabase = isRealSupabase
  ? createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: true } })
  : {
      auth: {
        // Dummy Client to prevent app crashes if `.env` isn't fully configured
        getSession: async () => ({ data: { session: null } }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signInWithPassword: async () => { throw new Error('Failed to fetch') },
        signUp: async () => { throw new Error('Failed to fetch') },
        signOut: async () => { return { error: null } }
      }
    };
