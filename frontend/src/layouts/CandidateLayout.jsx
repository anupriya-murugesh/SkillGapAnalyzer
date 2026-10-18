import { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
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

  const isAuthenticated = Boolean(sessionUser?.id || profile?.id);

  const isNavActive = (item) => {
    if (item.exact) {
      return location.pathname === '/candidate' || location.pathname === '/candidate/';
    }
    return location.pathname.startsWith(item.to);
  };

  return (
    <div className="min-h-screen bg-[#FAFCF8] text-slate-900 flex flex-col font-sans">
      
      {/* =================================================================== */}
      {/* SUB-BAR: Candidate Workspace Indicator (NO duplicate Bridge-IQ logo)*/}
      {/* =================================================================== */}
      <div className="bg-white border-b-2 border-slate-200 px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
            className="md:hidden p-2 rounded-xl bg-slate-100 text-slate-800 hover:text-black border border-slate-300"
            aria-label="Toggle Navigation"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-950 bg-emerald-100 px-3 py-1 rounded-md border-2 border-emerald-300">
              Candidate Workspace
            </span>
          </div>
        </div>

        {/* Center Prompt Banner */}
        {isAuthenticated ? (
          <div className="hidden sm:flex items-center gap-3 px-4 py-1.5 rounded-full bg-slate-50 border-2 border-slate-200 shadow-xs">
            <span className="text-xs font-bold text-slate-800">
              Are you still looking for a job?
            </span>
            <div className="flex items-center gap-1.5 bg-white p-0.5 rounded-full border border-slate-200">
              <button
                type="button"
                onClick={() => handleJobStatusChange('yes')}
                className={`px-3 py-1 rounded-full text-xs font-black transition-all cursor-pointer ${
                  lookingForJob === 'yes'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-700 hover:text-slate-950 font-bold'
                }`}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => handleJobStatusChange('no')}
                className={`px-3 py-1 rounded-full text-xs font-black transition-all cursor-pointer ${
                  lookingForJob === 'no'
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'text-slate-700 hover:text-slate-950 font-bold'
                }`}
              >
                No
              </button>
            </div>
          </div>
        ) : (
          <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 border-2 border-emerald-300 text-xs font-black text-emerald-950">
            <span className="w-2 h-2 rounded-full bg-emerald-700 animate-pulse"></span>
            <span>{isGuestPreview ? 'Demo Preview Mode' : 'Guest Visitor'}</span>
          </div>
        )}
      </div>

      {/* =================================================================== */}
      {/* MAIN CONTAINER: LEFT SIDEBAR + WORKSPACE                            */}
      {/* =================================================================== */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* ================================================================= */}
        {/* LEFT NAVIGATION SIDEBAR                                           */}
        {/* ================================================================= */}
        <aside className={`w-64 bg-white border-r-2 border-slate-200 flex flex-col justify-between p-4 fixed md:sticky top-16 h-[calc(100vh-4rem)] z-30 transition-transform duration-300 ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}>
          <div className="space-y-6">
            
            {/* Sidebar Header Title */}
            <div className="px-3 pt-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-900">
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
                        ? 'bg-emerald-700 text-white shadow-sm'
                        : 'text-slate-800 hover:text-emerald-800 hover:bg-emerald-50'
                    }`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span>{item.label}</span>
                    {active && (
                      <span className="ml-auto w-2 h-2 rounded-full bg-white" />
                    )}
                  </NavLink>
                );
              })}
            </nav>

          </div>

          {/* Sidebar Footer Info Card */}
          <div className="space-y-3">
            {!isAuthenticated && (
              <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-300 shadow-sm space-y-2">
                <div className="flex items-center gap-1.5 text-emerald-950 font-black text-xs uppercase tracking-wider">
                  <span>🔒</span> Guest Mode
                </div>
                <p className="text-xs text-slate-700 leading-snug font-medium">
                  Sign in to track real assessments and save your benchmark history.
                </p>
                <button
                  type="button"
                  onClick={() => openAuth ? openAuth('login', 'candidate') : navigate('/')}
                  className="w-full py-2 bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow cursor-pointer hover:bg-emerald-800"
                >
                  Sign In Now
                </button>
              </div>
            )}

            <div className="p-4 rounded-2xl bg-slate-50 border-2 border-slate-200">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                <span className="text-emerald-700">🛡️</span>
                <span className="text-emerald-800 font-extrabold">Curriculum Verified</span>
              </div>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed font-medium">
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
