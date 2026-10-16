import { useState, useEffect } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { getUserProfile, upsertUserProfile } from '../lib/auth';
import { useToast } from '../context/ToastContext';

export default function CandidateLayout({ session, userProfile, onProfileUpdated, onLogout, openAuth }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { addToast } = useToast() || { addToast: () => {} };

  // Profile & Auth state
  const [profile, setProfile] = useState(userProfile || null);
  const [sessionUser, setSessionUser] = useState(session?.user || null);
  const [isGuestPreview, setIsGuestPreview] = useState(false);
  const [lookingForJob, setLookingForJob] = useState('yes');
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    async function initProfile() {
      // 1. Direct userProfile prop if authenticated
      if (userProfile?.id) {
        setProfile(userProfile);
        setSessionUser(session?.user || { id: userProfile.id, email: userProfile.email });
        if (userProfile.looking_for_job !== undefined) {
          setLookingForJob(userProfile.looking_for_job ? 'yes' : 'no');
        }
        return;
      }

      // 2. Check Supabase auth session
      try {
        const { data } = await supabase.auth.getSession();
        const currentSession = data?.session || session;

        if (currentSession?.user?.id) {
          setSessionUser(currentSession.user);
          const fetched = await getUserProfile(currentSession.user.id);
          if (fetched) {
            setProfile(fetched);
            if (fetched.looking_for_job !== undefined) {
              setLookingForJob(fetched.looking_for_job ? 'yes' : 'no');
            }
          } else {
            // New user without full profile record yet
            const basicProfile = {
              id: currentSession.user.id,
              email: currentSession.user.email,
              full_name: currentSession.user.user_metadata?.full_name || currentSession.user.email?.split('@')[0] || 'Candidate',
              role: 'candidate',
              looking_for_job: true,
            };
            setProfile(basicProfile);
          }
        } else {
          // NO active session - Clean unauthenticated state
          setSessionUser(null);
          setProfile(null);
        }
      } catch (err) {
        console.warn('Could not initialize layout profile:', err);
        setSessionUser(null);
        setProfile(null);
      }
    }

    initProfile();
  }, [userProfile, session]);

  // Handle "Are you still looking for a job?" Yes / No toggle
  const handleJobStatusChange = async (status) => {
    setLookingForJob(status);
    const isLooking = status === 'yes';
    addToast(
      isLooking ? 'Job status updated: Actively looking for a job' : 'Job status updated: Not actively looking',
      'info'
    );

    if (profile?.id) {
      const updated = {
        ...profile,
        looking_for_job: isLooking,
      };
      setProfile(updated);
      onProfileUpdated?.(updated);
      try {
        await upsertUserProfile(updated);
      } catch (e) {
        console.warn('Sync job status notice:', e);
      }
    }
  };

  const navItems = [
    {
      to: '/candidate',
      label: 'Home',
      icon: '🏠',
      exact: true,
    },
    {
      to: '/candidate/roadmap',
      label: 'AI Roadmap',
      icon: '🗺️',
      exact: false,
    },
    {
      to: '/candidate/practice',
      label: 'Assessments & MCQs',
      icon: '🎯',
      exact: false,
    },
    {
      to: '/jobs',
      label: 'Live Market',
      icon: '🌐',
      exact: false,
    },
    {
      to: '/candidate/profile',
      label: 'My Profile',
      icon: '⚙️',
      exact: false,
    },
  ];

  // Dynamic user details
  const isAuthenticated = Boolean(sessionUser?.id || profile?.id);
  const displayName = isAuthenticated
    ? (profile?.full_name || profile?.first_name || sessionUser?.user_metadata?.full_name || sessionUser?.email?.split('@')[0] || 'Candidate')
    : (isGuestPreview ? 'Guest Candidate' : 'Guest Visitor');
  const displayEmail = isAuthenticated
    ? (profile?.email || sessionUser?.email || '')
    : (isGuestPreview ? 'guest@bridgeiq.demo' : '');
  const initialLetter = isAuthenticated
    ? (displayName.trim().charAt(0) || 'C').toUpperCase()
    : (isGuestPreview ? 'G' : '?');

  const isNavActive = (item) => {
    if (item.exact) {
      return location.pathname === '/candidate' || location.pathname === '/candidate/';
    }
    return location.pathname.startsWith(item.to);
  };

  return (
    <div className="min-h-screen bg-[#0c0e17] text-slate-100 flex flex-col font-sans">
      
      {/* =================================================================== */}
      {/* A. TOP HEADER BAR                                                   */}
      {/* =================================================================== */}
      <header className="h-16 bg-[#121626] border-b border-[#1f2742] sticky top-0 z-40 px-4 sm:px-6 lg:px-8 flex items-center justify-between shadow-md">
        
        {/* Left: Logo (Bridge-IQ) & Mobile Hamburger */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="md:hidden p-2 rounded-xl bg-[#161c30] text-slate-300 hover:text-white"
            aria-label="Toggle Navigation"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <Link to="/candidate" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#B298E7] via-[#F5B8D5] to-[#B8E3E9] flex items-center justify-center text-[#0c0e17] font-black text-lg shadow-md shadow-[#B298E7]/25">
              B
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tight text-slate-100 group-hover:text-white transition-colors">
                Bridge-IQ
              </span>
              <span className="text-[9px] font-bold uppercase tracking-widest text-[#B8E3E9]">
                Candidate Panel
              </span>
            </div>
          </Link>
        </div>

        {/* Center Prompt Banner */}
        {isAuthenticated ? (
          <div className="hidden sm:flex items-center gap-3 px-4 py-1.5 rounded-full bg-[#0c0e17]/80 border border-[#1f2742] shadow-inner">
            <span className="text-xs font-semibold text-slate-200">
              Are you still looking for a job?
            </span>
            <div className="flex items-center gap-1.5 bg-[#121626] p-0.5 rounded-full border border-[#1f2742]">
              <button
                type="button"
                onClick={() => handleJobStatusChange('yes')}
                className={`px-3 py-1 rounded-full text-xs font-black transition-all cursor-pointer ${
                  lookingForJob === 'yes'
                    ? 'bg-gradient-to-r from-[#B298E7] via-[#F5B8D5] to-[#F9BEDD] text-[#0c0e17] shadow-sm shadow-[#B298E7]/30 scale-102'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => handleJobStatusChange('no')}
                className={`px-3 py-1 rounded-full text-xs font-black transition-all cursor-pointer ${
                  lookingForJob === 'no'
                    ? 'bg-[#1f2742] text-slate-100 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                No
              </button>
            </div>
          </div>
        ) : (
          <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#B298E7]/10 border border-[#B298E7]/25 text-[11px] font-bold text-[#B298E7]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#B298E7] animate-pulse"></span>
            <span>{isGuestPreview ? 'Demo Preview Mode' : 'Guest Visitor'}</span>
          </div>
        )}

        {/* Far Right: User Profile Avatar or Sign In Controls */}
        <div className="flex items-center gap-3">
          {!isAuthenticated && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => openAuth ? openAuth('login', 'candidate') : navigate('/')}
                className="px-3.5 py-1.5 bg-gradient-to-r from-[#B298E7] to-[#B8E3E9] text-[#0c0e17] font-black text-xs rounded-xl shadow-md cursor-pointer hover:brightness-105 transition-all"
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => navigate('/candidate/signup')}
                className="hidden md:inline-block px-3 py-1.5 bg-[#161c30] border border-[#B8E3E9]/30 text-white font-bold text-xs rounded-xl hover:border-[#B8E3E9] transition-all"
              >
                Register
              </button>
            </div>
          )}

          <div className="relative">
            <button
              type="button"
              onClick={() => setAvatarMenuOpen(!avatarMenuOpen)}
              className="flex items-center gap-2.5 p-1 rounded-full hover:ring-2 hover:ring-[#B298E7]/40 transition-all focus:outline-none cursor-pointer"
              aria-label="User profile menu"
            >
              <div className={`w-10 h-10 rounded-full font-black text-base flex items-center justify-center shadow-lg border-2 ${
                isAuthenticated 
                  ? 'bg-gradient-to-tr from-[#B298E7] via-[#F5B8D5] to-[#B8E3E9] text-[#0c0e17] border-[#1f2742] shadow-[#B298E7]/25' 
                  : 'bg-[#161c30] text-slate-300 border-slate-700'
              }`}>
                {initialLetter}
              </div>
            </button>

            {/* Avatar Dropdown */}
            {avatarMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#121626] border border-[#1f2742] shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3.5 py-3 border-b border-[#1f2742]">
                  <div className="text-sm font-bold text-slate-100 truncate">{displayName}</div>
                  {displayEmail && <div className="text-xs text-slate-400 truncate">{displayEmail}</div>}
                  <div className={`mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isAuthenticated 
                      ? 'bg-[#B298E7]/15 border border-[#B298E7]/30 text-[#B298E7]' 
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    <span>{isAuthenticated ? 'Candidate Account' : 'Guest Account'}</span>
                  </div>
                </div>

                <div className="py-1">
                  {isAuthenticated ? (
                    <Link
                      to="/candidate/profile"
                      onClick={() => setAvatarMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-[#161c30] transition-colors"
                    >
                      <span>⚙️</span>
                      <span>My Profile Settings</span>
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setAvatarMenuOpen(false);
                        if (openAuth) openAuth('login', 'candidate');
                        else navigate('/candidate/signup');
                      }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-bold text-[#B298E7] hover:bg-[#161c30] transition-colors text-left"
                    >
                      <span>🔑</span>
                      <span>Sign In / Create Account</span>
                    </button>
                  )}
                  
                  <Link
                    to="/"
                    onClick={() => setAvatarMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-[#161c30] transition-colors"
                  >
                    <span>🌐</span>
                    <span>Public Platform</span>
                  </Link>
                </div>

                {isAuthenticated && (
                  <div className="pt-1 border-t border-[#1f2742]">
                    <button
                      type="button"
                      onClick={() => {
                        setAvatarMenuOpen(false);
                        if (onLogout) onLogout();
                        else navigate('/');
                      }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-red-400 hover:bg-red-950/30 transition-colors cursor-pointer text-left"
                    >
                      <span>🚪</span>
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      </header>

      {/* =================================================================== */}
      {/* MAIN CONTAINER: LEFT SIDEBAR + WORKSPACE                            */}
      {/* =================================================================== */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* ================================================================= */}
        {/* B. LEFT NAVIGATION SIDEBAR                                        */}
        {/* ================================================================= */}
        <aside className={`w-64 bg-[#121626] border-r border-[#1f2742] flex flex-col justify-between p-4 fixed md:sticky top-16 h-[calc(100vh-4rem)] z-30 transition-transform duration-300 ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}>
          <div className="space-y-6">
            
            {/* Sidebar Header Title */}
            <div className="px-3 pt-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#B8E3E9]">
                Candidate Navigation
              </span>
            </div>

            {/* Navigation Items */}
            <nav className="space-y-1.5">
              {navItems.map((item) => {
                const active = isNavActive(item);
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.exact}
                    onClick={() => setMobileSidebarOpen(false)}
                    className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                      active
                        ? 'bg-[#B298E7]/15 text-[#B298E7] border border-[#B298E7]/35 shadow-md shadow-[#B298E7]/10'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-[#161c30]'
                    }`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span>{item.label}</span>
                    {active && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#B8E3E9] animate-pulse" />
                    )}
                  </NavLink>
                );
              })}
            </nav>

          </div>

          {/* Sidebar Footer Info Card */}
          <div className="space-y-3">
            {!isAuthenticated && (
              <div className="p-3.5 rounded-2xl bg-[#0c0e17] border border-[#B298E7]/35 shadow-md space-y-2">
                <div className="flex items-center gap-1.5 text-[#B298E7] font-bold text-[11px] uppercase tracking-wider">
                  <span>🔒</span> Guest Mode
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Sign in to track real assessments and save your benchmark history.
                </p>
                <button
                  type="button"
                  onClick={() => openAuth ? openAuth('login', 'candidate') : navigate('/')}
                  className="w-full py-2 bg-gradient-to-r from-[#B298E7] to-[#B8E3E9] text-[#0c0e17] font-black text-xs rounded-xl shadow cursor-pointer hover:brightness-105"
                >
                  Sign In Now
                </button>
              </div>
            )}

            <div className="p-3.5 rounded-2xl bg-[#0c0e17] border border-[#1f2742]">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                <span className="text-[#B298E7]">🛡️</span>
                <span className="text-[#B298E7]">Bridge-IQ Verified</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Assessment records and scorecards stay synced with your institutional curriculum.
              </p>
            </div>
          </div>
        </aside>

        {/* Mobile backdrop */}
        {mobileSidebarOpen && (
          <div
            onClick={() => setMobileSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 md:hidden"
          />
        )}

        {/* ================================================================= */}
        {/* OUTLET WORKSPACE CONTENT                                          */}
        {/* ================================================================= */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto w-full">
          <Outlet context={{ 
            profile, 
            setProfile, 
            onProfileUpdated,
            session: sessionUser ? { user: sessionUser } : session,
            isAuthenticated,
            isGuestPreview,
            setIsGuestPreview,
            openAuth,
            onLogout
          }} />
        </main>

      </div>

    </div>
  );
}
