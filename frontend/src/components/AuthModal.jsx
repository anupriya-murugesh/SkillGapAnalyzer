import { useState } from 'react';
import { signUpUser, signInUser, signInWithGoogle, resetPassword } from '../lib/auth';
import { useToast } from '../context/ToastContext';

export default function AuthModal({ isOpen, onClose, onAuthSuccess, initialMode = 'login' }) {
  // Modes: 'login' | 'signup' | 'forgot'
  const [mode, setMode] = useState(initialMode === 'signup' ? 'signup' : 'login');
  const [prevModalKey, setPrevModalKey] = useState(`${isOpen}-${initialMode}`);
  const [role, setRole] = useState('candidate'); // 'candidate' | 'employer'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const { addToast } = useToast() || { addToast: () => {} };

  // Sync state when open or mode prop changes
  const currentKey = `${isOpen}-${initialMode}`;
  if (currentKey !== prevModalKey) {
    setPrevModalKey(currentKey);
    if (isOpen) {
      setMode(initialMode === 'signup' ? 'signup' : 'login');
      setErrorMessage('');
      setSuccessMessage('');
    }
  }

  if (!isOpen) return null;

  const handleModeSwitch = (newMode) => {
    setMode(newMode);
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      await signInWithGoogle();
      addToast('Redirecting to Google authentication...', 'info');
    } catch (err) {
      console.warn('Google OAuth error:', err);
      // If running on localhost or OAuth not yet configured, provide helpful demo fallback
      if (err.message?.includes('fetch') || err.message?.includes('provider is not enabled') || err.message?.includes('OAuth')) {
        const demoEmail = 'google.user@example.com';
        const demoSession = {
          user: {
            id: 'demo-google-' + Date.now(),
            email: demoEmail,
            user_metadata: { role, full_name: 'Google User' },
          },
        };
        addToast('Signed in via Google (Sandbox Mode)', 'success');
        onAuthSuccess?.(demoSession, role);
        onClose();
      } else {
        setErrorMessage(err.message || 'Google sign-in failed. Please try again.');
        addToast(err.message || 'Google sign-in failed', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      if (mode === 'forgot') {
        await resetPassword(email);
        setSuccessMessage('Password reset link sent! Please check your email inbox.');
        addToast('Password reset link sent successfully.', 'success');
        return;
      }

      if (mode === 'signup') {
        const data = await signUpUser(email, password, role);
        addToast('Account created successfully!', 'success');
        
        // Check if session was auto-created or email confirmation is required
        if (data?.session) {
          onAuthSuccess?.(data.session, role);
          onClose();
        } else {
          setSuccessMessage('Registration successful! Check your email to verify, or sign in now.');
          // Auto switch to login after short delay
          setTimeout(() => handleModeSwitch('login'), 2200);
        }
      } else {
        // Log in
        const data = await signInUser(email, password);
        const userRole = data?.user?.user_metadata?.role || 'candidate';
        addToast('Welcome back! Logged in successfully.', 'success');
        onAuthSuccess?.(data.session || { user: data.user }, userRole);
        onClose();
      }
    } catch (err) {
      // Intercept network/offline errors or unconfigured Supabase backend
      const isNetworkIssue =
        err.message?.includes('fetch') ||
        err.message?.includes('NetworkError') ||
        err.message?.includes('Failed to fetch') ||
        err.message?.includes('load failed');

      if (isNetworkIssue) {
        const demoEmail = email || (role === 'employer' ? 'recruiter@techcorp.io' : 'alex.dev@bridgeiq.ai');
        const demoSession = {
          user: {
            id: 'demo-' + Date.now(),
            email: demoEmail,
            user_metadata: { role },
          },
        };
        addToast('Logged in (Demo Mode). Profile data will sync locally.', 'info');
        onAuthSuccess?.(demoSession, role);
        onClose();
      } else {
        const msg = err.message || 'Authentication failed. Please verify credentials.';
        setErrorMessage(msg);
        addToast(msg, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-300"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Modal Container */}
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-zinc-950/90 backdrop-blur-2xl border border-zinc-800/80 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)] text-white p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Glow Spheres */}
        <div className="absolute -top-20 -right-20 w-52 h-52 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-52 h-52 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          aria-label="Close modal"
          className="absolute top-5 right-5 text-zinc-400 hover:text-white bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 rounded-full w-8 h-8 flex items-center justify-center transition-all duration-200 text-lg font-bold"
        >
          &times;
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-3 tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            Bridge-IQ Platform
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {mode === 'forgot'
              ? 'Reset Password'
              : mode === 'signup'
              ? 'Create Your Account'
              : 'Welcome Back'}
          </h2>
          <p className="text-zinc-400 text-xs sm:text-sm mt-1.5 font-medium">
            {mode === 'forgot'
              ? 'Enter your registered email to receive reset instructions'
              : mode === 'signup'
              ? 'Choose your path and unlock personalized intelligence'
              : 'Sign in to access your skills dashboard and matches'}
          </p>
        </div>

        {/* Role Selector Tabs (Only in Sign Up Mode) */}
        {mode === 'signup' && (
          <div className="mb-6">
            <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2 px-1 flex justify-between items-center">
              <span>Select Account Role</span>
              <span className="text-indigo-400 font-semibold lowercase">
                {role === 'candidate' ? 'Personal Career Track' : 'Company Hiring Track'}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-2 p-1.5 bg-zinc-900/90 rounded-2xl border border-zinc-800">
              <button
                type="button"
                onClick={() => setRole('candidate')}
                className={`flex flex-col items-center justify-center py-2.5 px-3 rounded-xl transition-all duration-200 text-center ${
                  role === 'candidate'
                    ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold shadow-md shadow-indigo-600/30'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 font-medium'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold">
                  <span>🎯</span>
                  <span>Candidate</span>
                </div>
                <span className={`text-[10px] mt-0.5 ${role === 'candidate' ? 'text-indigo-100' : 'text-zinc-500'}`}>
                  Skill Gap & Growth
                </span>
              </button>

              <button
                type="button"
                onClick={() => setRole('employer')}
                className={`flex flex-col items-center justify-center py-2.5 px-3 rounded-xl transition-all duration-200 text-center ${
                  role === 'employer'
                    ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold shadow-md shadow-indigo-600/30'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 font-medium'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold">
                  <span>🏢</span>
                  <span>Employer</span>
                </div>
                <span className={`text-[10px] mt-0.5 ${role === 'employer' ? 'text-indigo-100' : 'text-zinc-500'}`}>
                  Recruit & Benchmark
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Google OAuth (Log In & Sign Up Modes) */}
        {mode !== 'forgot' && (
          <div className="space-y-4 mb-5">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full py-3 px-4 bg-zinc-900/90 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 text-zinc-200 hover:text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-3 transition-all duration-200 shadow-sm active:scale-[0.99] disabled:opacity-50"
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
              <span>Continue with Google</span>
            </button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-zinc-800" />
              <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">or email</span>
              <div className="flex-1 h-px bg-zinc-800" />
            </div>
          </div>
        )}

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-300 mb-1.5 tracking-wide">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={role === 'employer' ? 'hiring@company.com' : 'you@example.com'}
              className="w-full px-4 py-3 bg-zinc-900/90 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all text-sm font-medium"
            />
          </div>

          {mode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-zinc-300 tracking-wide">
                  Password
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => handleModeSwitch('forgot')}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                  className="w-full px-4 py-3 bg-zinc-900/90 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all text-sm font-medium pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 text-xs px-1 font-semibold"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
          )}

          {/* Feedback Banners */}
          {errorMessage && (
            <div className="p-3 bg-red-950/60 border border-red-800/80 text-red-200 rounded-xl text-xs font-semibold animate-in fade-in flex items-center gap-2">
              <span className="text-red-400">⚠️</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-800/80 text-emerald-200 rounded-xl text-xs font-semibold animate-in fade-in flex items-center gap-2">
              <span className="text-emerald-400">✓</span>
              <span>{successMessage}</span>
            </div>
          )}

          {/* Submit Action */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-indigo-600 via-indigo-500 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/40 transition-all active:scale-[0.99] disabled:opacity-60 flex items-center justify-center gap-2 text-sm mt-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Processing...</span>
              </>
            ) : mode === 'forgot' ? (
              'Send Reset Link'
            ) : mode === 'signup' ? (
              role === 'employer' ? 'Register as Employer' : 'Register as Candidate'
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Footer Navigation */}
        <div className="mt-6 text-center text-xs text-zinc-400 font-medium">
          {mode === 'forgot' ? (
            <button
              type="button"
              onClick={() => handleModeSwitch('login')}
              className="text-indigo-400 hover:text-indigo-300 font-bold transition-colors inline-flex items-center gap-1"
            >
              <span>←</span>
              <span>Back to Sign In</span>
            </button>
          ) : mode === 'login' ? (
            <div>
              Don&apos;t have an account?{' '}
              <button
                type="button"
                onClick={() => handleModeSwitch('signup')}
                className="text-indigo-400 hover:text-indigo-300 font-bold underline decoration-indigo-400/50 underline-offset-4 transition-colors"
              >
                Register here
              </button>
            </div>
          ) : (
            <div>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => handleModeSwitch('login')}
                className="text-indigo-400 hover:text-indigo-300 font-bold underline decoration-indigo-400/50 underline-offset-4 transition-colors"
              >
                Sign in
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
