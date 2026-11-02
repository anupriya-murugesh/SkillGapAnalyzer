import { supabase, withTimeout } from './supabaseClient';

export const ADMIN_EMAILS = [
  'aadhilakshmanan07@gmail.com',
  'anukarthika02@gmail.com'
];

export function isAdminEmail(email) {
  if (!email || typeof email !== 'string') return false;
  return ADMIN_EMAILS.some(adminEmail => adminEmail.toLowerCase() === email.trim().toLowerCase());
}

/**
 * Register a user with Supabase Auth including role metadata.
 * @param {string} email
 * @param {string} password
 * @param {'candidate' | 'employer' | 'admin'} role
 * @returns {Promise<{ user: any, session: any }>}
 */
export async function signUpUser(email, password, role = 'candidate') {
  let normalizedRole = role === 'employer' ? 'employer' : role === 'admin' ? 'admin' : 'candidate';
  if (isAdminEmail(email)) {
    normalizedRole = 'admin';
  }
  const redirectUrl = typeof window !== 'undefined' ? `${window.location.origin}/onboarding` : undefined;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role: normalizedRole,
      },
      emailRedirectTo: redirectUrl,
    },
  });

  if (error) {
    throw error;
  }

  // Also pre-seed a local profile cache so subsequent onboarding can prefill user data
  if (data?.user) {
    try {
      const cacheKey = `bridgeiq_profile_${data.user.id}`;
      const existing = localStorage.getItem(cacheKey);
      if (!existing) {
        localStorage.setItem(
          cacheKey,
          JSON.stringify({
            id: data.user.id,
            email: data.user.email,
            role: normalizedRole,
            is_completed: false,
          })
        );
      }
    } catch {
      // Ignore storage errors
    }
  }

  return data;
}

/**
 * Sign in an existing user with email and password.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ user: any, session: any }>}
 */
export async function signInUser(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Initiate Google OAuth authentication.
 * @returns {Promise<any>}
 */
export async function signInWithGoogle() {
  const redirectUrl = typeof window !== 'undefined' ? `${window.location.origin}/onboarding` : undefined;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl,
    },
  });

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Trigger a password reset email for the given address.
 * @param {string} email
 * @returns {Promise<any>}
 */
export async function resetPassword(email) {
  const redirectUrl = typeof window !== 'undefined' ? `${window.location.origin}/` : undefined;

  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirectUrl,
  });

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Sign out the current user session.
 */
export async function signOutUser() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw error;
  }
}

/**
 * Fetch the current active session.
 */
export async function getCurrentSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    return null;
  }
  return data?.session || null;
}

/**
 * Fetch the currently authenticated user.
 */
export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    return null;
  }
  return data?.user || null;
}

/**
 * Fetch user profile from the public.profiles table or local cache.
 * Fast local-first strategy ensures 0ms latency for role changes and dashboard loads.
 * @param {string} userId
 */
export async function getUserProfile(userId) {
  if (!userId) return null;

  // 1. Instant check of local storage cache (0ms)
  try {
    const cached = localStorage.getItem(`bridgeiq_profile_${userId}`);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (isAdminEmail(parsed?.email)) {
        parsed.role = 'admin';
      }
      return parsed;
    }
  } catch {}

  // 2. Fallback to Supabase with fast circuit-breaker timeout
  try {
    const res = await withTimeout(
      supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle(),
      1200
    );

    const data = res?.data;
    if (data) {
      if (isAdminEmail(data.email)) {
        data.role = 'admin';
      }
      try {
        localStorage.setItem(`bridgeiq_profile_${userId}`, JSON.stringify(data));
      } catch {}
      return data;
    }
  } catch (err) {
    console.warn('Network or schema exception fetching profile:', err?.message || err);
  }

  return null;
}

/**
 * Upsert user profile into public.profiles with local cache fallback.
 * Persists locally first to guarantee instantaneous UI updates.
 * @param {Object} profileData
 */
export async function upsertUserProfile(profileData) {
  if (!profileData?.id) {
    throw new Error('User ID is required to upsert profile.');
  }

  const payload = {
    ...profileData,
    updated_at: new Date().toISOString(),
  };

  // 1. Always persist locally first for 0ms responsiveness
  try {
    localStorage.setItem(`bridgeiq_profile_${profileData.id}`, JSON.stringify(payload));
  } catch {}

  // 2. Non-blocking asynchronous sync to remote Supabase
  withTimeout(
    supabase
      .from('profiles')
      .upsert(payload, { onConflict: 'id' })
      .select()
      .maybeSingle(),
    1200
  ).then((res) => {
    if (res?.data) {
      try {
        const merged = { ...payload, ...res.data, remoteSynced: true };
        localStorage.setItem(`bridgeiq_profile_${profileData.id}`, JSON.stringify(merged));
      } catch {}
    }
  }).catch((err) => {
    console.warn('Supabase profiles background upsert notice:', err?.message || err);
  });

  return payload;
}
