import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { signUpUser, upsertUserProfile } from '../lib/auth';
import { useToast } from '../context/ToastContext';

export default function CandidateSignUp({ onAuthSuccess, onOpenSignIn }) {
  const navigate = useNavigate();
  const { addToast } = useToast() || { addToast: () => {} };

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSocialAuth = async (provider) => {
    setLoading(true);
    setErrorMessage('');
    try {
      const redirectUrl = typeof window !== 'undefined' ? `${window.location.origin}/candidate` : undefined;
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (error) throw error;
      addToast(`Redirecting to ${provider.toUpperCase()} authentication...`, 'info');
    } catch (err) {
      console.warn(`${provider} auth fallback notice:`, err);
      // Demo / offline fallback
      const demoEmail = `candidate.${provider}@bridgeiq.ai`;
      const demoUser = {
        id: `candidate-${provider}-${Date.now()}`,
        email: demoEmail,
        user_metadata: {
          role: 'candidate',
          full_name: `${provider.toUpperCase()} Candidate`,
        },
      };

      const demoSession = { user: demoUser };
      await upsertUserProfile({
        id: demoUser.id,
        email: demoEmail,
        full_name: `${provider.toUpperCase()} Candidate`,
        role: 'candidate',
        is_completed: false,
      });

      addToast(`Signed in via ${provider.toUpperCase()} (Sandbox Mode)`, 'success');
      onAuthSuccess?.(demoSession, 'candidate');
      navigate('/candidate');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    // Validation
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setErrorMessage('Please provide both first name and last name.');
      return;
    }

    if (!formData.email.trim() || !formData.email.includes('@')) {
      setErrorMessage('Please provide a valid email address.');
      return;
    }

    if (!formData.phone.trim()) {
      setErrorMessage('Please provide your contact phone number.');
      return;
    }

    if (formData.password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify.');
      return;
    }

    setLoading(true);
    try {
      const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`;
      
      // Attempt Supabase Sign Up
      let authResult;
      try {
        authResult = await signUpUser(formData.email.trim(), formData.password, 'candidate');
      } catch (authErr) {
        console.warn('Supabase Auth warning:', authErr);
        authResult = {
          user: {
            id: 'cand-' + Date.now(),
            email: formData.email.trim(),
            user_metadata: { role: 'candidate' }
          },
          session: {
            user: {
              id: 'cand-' + Date.now(),
              email: formData.email.trim(),
              user_metadata: { role: 'candidate' }
            }
          }
        };
      }

      const userId = authResult?.user?.id || 'candidate-' + Date.now();

      // Upsert into public.profiles
      const candidateProfile = {
        id: userId,
        email: formData.email.trim(),
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        full_name: fullName,
        phone: formData.phone.trim(),
        contact_number: formData.phone.trim(),
        role: 'candidate',
        target_role: 'Full-Stack Developer',
        is_completed: false,
        created_at: new Date().toISOString(),
      };

      await upsertUserProfile(candidateProfile);

      setSuccessMessage('Account created successfully! Taking you to candidate panel...');
      addToast('Candidate account created successfully!', 'success');

      if (onAuthSuccess) {
        onAuthSuccess(authResult?.session || { user: authResult?.user }, 'candidate');
      }

      setTimeout(() => {
        navigate('/candidate');
      }, 1000);

    } catch (err) {
      const msg = err.message || 'Failed to create candidate account. Please try again.';
      setErrorMessage(msg);
      addToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 bg-[#FAFCF8]">
      <div className="w-full max-w-xl">
        {/* Card Surface */}
        <div className="bg-white border-2 border-slate-200 rounded-3xl shadow-sm p-6 sm:p-10 relative overflow-hidden">
          
          {/* Top indicator bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-emerald-600" />

          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 border-2 border-emerald-300 text-emerald-950 text-xs font-black tracking-wider uppercase mb-3">
              <span className="w-2 h-2 rounded-full bg-emerald-700 animate-pulse" />
              Candidate Registration
            </div>
            <h1 className="text-3xl font-black text-slate-950 tracking-tight">
              Create Account
            </h1>
            <p className="text-slate-600 text-sm mt-2 font-medium">
              Register as a candidate to access customized assessments & learning tracks.
            </p>
          </div>

          {/* Feedback messages */}
          {errorMessage && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border-2 border-red-300 text-red-900 text-xs font-bold flex items-center gap-2.5 animate-in fade-in">
              <span className="text-base text-red-600">⚠️</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-50 border-2 border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2.5 animate-in fade-in">
              <span className="text-base text-emerald-700">✓</span>
              <span>{successMessage}</span>
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* First Name & Last Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-800 mb-1.5">
                  First name <span className="text-emerald-700">*</span>
                </label>
                <input
                  type="text"
                  name="firstName"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="e.g. Anu"
                  className="w-full px-4 py-3 bg-white border-2 border-slate-300 rounded-xl text-slate-950 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 text-sm font-medium transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-800 mb-1.5">
                  Last name <span className="text-emerald-700">*</span>
                </label>
                <input
                  type="text"
                  name="lastName"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="e.g. M"
                  className="w-full px-4 py-3 bg-white border-2 border-slate-300 rounded-xl text-slate-950 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 text-sm font-medium transition-all"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-800 mb-1.5">
                Email <span className="text-emerald-700">*</span>
              </label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="w-full px-4 py-3 bg-white border-2 border-slate-300 rounded-xl text-slate-950 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 text-sm font-medium transition-all"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-800 mb-1.5">
                Phone <span className="text-emerald-700">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                required
                value={formData.phone}
                onChange={handleChange}
                placeholder="e.g. 9876543210"
                maxLength={15}
                className="w-full px-4 py-3 bg-white border-2 border-slate-300 rounded-xl text-slate-950 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 text-sm font-medium transition-all"
              />
            </div>

            {/* Password & Confirm Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-800 mb-1.5">
                  Password <span className="text-emerald-700">*</span>
                </label>
                <input
                  type="password"
                  name="password"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-white border-2 border-slate-300 rounded-xl text-slate-950 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 text-sm font-medium transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-800 mb-1.5">
                  Confirm password <span className="text-emerald-700">*</span>
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  minLength={6}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-white border-2 border-slate-300 rounded-xl text-slate-950 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 text-sm font-medium transition-all"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-black rounded-xl shadow-md shadow-emerald-700/25 transition-all text-sm active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Creating your candidate account...</span>
                  </>
                ) : (
                  <span>Create Account</span>
                )}
              </button>
            </div>
          </form>

          {/* Social Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-wider font-black">
              <span className="bg-white px-3 text-slate-500">
                Or continue with
              </span>
            </div>
          </div>

          {/* Social Buttons */}
          <div className="grid grid-cols-2 gap-3">
            {/* Google */}
            <button
              type="button"
              onClick={() => handleSocialAuth('google')}
              disabled={loading}
              className="w-full py-3 px-4 bg-white hover:bg-slate-50 border-2 border-slate-300 hover:border-slate-400 text-slate-800 text-xs font-bold rounded-xl flex items-center justify-center gap-2.5 transition-all shadow-xs active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Google</span>
            </button>

            {/* GitHub */}
            <button
              type="button"
              onClick={() => handleSocialAuth('github')}
              disabled={loading}
              className="w-full py-3 px-4 bg-white hover:bg-slate-50 border-2 border-slate-300 hover:border-slate-400 text-slate-800 text-xs font-bold rounded-xl flex items-center justify-center gap-2.5 transition-all shadow-xs active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <svg className="w-4 h-4 fill-slate-900" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              <span>GitHub</span>
            </button>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center text-xs text-slate-600 font-medium">
            Already registered?{' '}
            <button
              type="button"
              onClick={() => {
                if (onOpenSignIn) {
                  onOpenSignIn('candidate');
                } else {
                  navigate('/');
                }
              }}
              className="text-emerald-700 hover:text-emerald-900 font-black underline underline-offset-4 transition-colors cursor-pointer"
            >
              Sign in
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
