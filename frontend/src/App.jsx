import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import SkillGapAnalyzer from './components/SkillGapAnalyzer';
import Dashboard from './pages/Dashboard';
import AuthModal from './components/AuthModal';
import LandingPage from './components/LandingPage';
import LiveJobSearch from './components/LiveJobSearch';
import Onboarding from './pages/Onboarding';
import { supabase } from './lib/supabaseClient';
import { getUserProfile } from './lib/auth';
import { ToastProvider, useToast } from './context/ToastContext';
import { ErrorBoundary } from './components/ErrorBoundary';

function Navigation({ session, userProfile, handleLogout, openAuth }) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { path: '/analyzer', label: 'Analyzer' },
    { path: '/jobs', label: 'Live Market' },
    { path: '/dashboard', label: 'Dashboard' }
  ];

  const getLinkClass = (path) => 
    `px-4 py-2 text-sm font-bold rounded-lg transition-colors ${location.pathname === path ? 'bg-gray-100 text-indigo-700' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`;

  const currentRole = userProfile?.role || session?.user?.user_metadata?.role || 'candidate';

  return (
    <nav className="bg-white/95 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-md">
              B
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black text-gray-900 tracking-tight hidden sm:block leading-tight">Bridge-IQ</span>
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest hidden sm:block leading-tight">Skill Analytics</span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-2">
            {navLinks.map(link => (
              <Link key={link.path} to={link.path} className={getLinkClass(link.path)}>
                {link.label}
              </Link>
            ))}
            <Link to="/#features" className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors">Features</Link>
            {session && (
              <Link 
                to="/onboarding" 
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${location.pathname === '/onboarding' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-500 hover:text-gray-800'}`}
              >
                Profile Setup
              </Link>
            )}
          </div>
        </div>
        
        {/* Desktop Actions */}
        <div className="hidden lg:flex items-center gap-3">
          {session ? (
            <div className="flex items-center gap-3 animate-in fade-in duration-300">
              {/* Role Indicator Badge */}
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1 ${
                currentRole === 'employer' 
                  ? 'bg-blue-50 border-blue-200 text-blue-700' 
                  : 'bg-emerald-50 border-emerald-200 text-emerald-700'
              }`}>
                <span>{currentRole === 'employer' ? '🏢 Employer' : '🎯 Candidate'}</span>
              </span>

              <span className="px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-sm font-bold text-indigo-700 max-w-[180px] truncate">
                {session.user?.email || 'user@bridge-iq.ai'}
              </span>
              <Link 
                to="/dashboard"
                className="px-4 py-2 text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Dashboard
              </Link>
              <button 
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-bold text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 animate-in fade-in duration-300">
              <button onClick={() => openAuth('login')} className="px-5 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-100 rounded-xl transition-colors">Log In</button>
              <button onClick={() => openAuth('signup')} className="px-5 py-2.5 text-sm font-bold bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors shadow-sm hover:shadow-md">Sign Up</button>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="lg:hidden flex items-center">
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-gray-500 hover:text-gray-900 focus:outline-none p-2 bg-gray-50 rounded-lg">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={mobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-100 bg-white px-4 pt-2 pb-6 space-y-2 animate-in slide-in-from-top-2 absolute w-full shadow-lg">
          {navLinks.map(link => (
            <Link key={link.path} to={link.path} onClick={() => setMobileMenuOpen(false)} className={`block px-4 py-3 rounded-xl text-base font-bold ${location.pathname === link.path ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}>
              {link.label}
            </Link>
          ))}
          {session && (
            <Link to="/onboarding" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3 rounded-xl text-base font-bold text-indigo-600 hover:bg-indigo-50">
              Profile Setup & Onboarding
            </Link>
          )}
          {!session ? (
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100">
              <button onClick={() => { setMobileMenuOpen(false); openAuth('login'); }} className="py-3 text-sm font-bold text-gray-700 bg-gray-100 rounded-xl">Log In</button>
              <button onClick={() => { setMobileMenuOpen(false); openAuth('signup'); }} className="py-3 text-sm font-bold bg-gray-900 text-white rounded-xl">Sign Up</button>
            </div>
          ) : (
            <div className="pt-4 border-t border-gray-100 space-y-3">
              <div className="px-4 text-sm font-bold text-indigo-600 truncate flex items-center justify-between">
                <span>{session.user?.email || 'user@bridge-iq.ai'}</span>
                <span className="text-xs px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">{currentRole}</span>
              </div>
              <button onClick={() => { setMobileMenuOpen(false); handleLogout(); }} className="w-full text-left px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors">Logout</button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}

function MainApp() {
  const [session, setSession] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const navigate = useNavigate();
  const location = useLocation();
  const { addToast } = useToast();

  useEffect(() => {
    const checkAndNavigateOnboarding = async (user) => {
      if (!user?.id) return;
      try {
        const profile = await getUserProfile(user.id);
        setUserProfile(profile);
        if (!profile || !profile.is_completed) {
          if (location.pathname === '/' || location.pathname === '') {
            navigate('/onboarding');
          }
        }
      } catch (e) {
        console.warn('Profile check error:', e);
      }
    };

    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      if (existingSession) {
        setSession(existingSession);
        checkAndNavigateOnboarding(existingSession.user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (currentSession) {
        setSession(currentSession);
      }
    });
    return () => subscription.unsubscribe();
  }, [location.pathname, navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUserProfile(null);
    navigate('/');
    addToast('Logged out successfully.', 'info');
  };

  const openAuth = (mode) => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleAuthSuccess = async (newSession = null, chosenRole = null) => {
    setIsAuthModalOpen(false);
    const resolvedSession = newSession || session;

    if (resolvedSession) {
      setSession(resolvedSession);
      const user = resolvedSession.user;
      let profile = await getUserProfile(user?.id);

      if (!profile && chosenRole) {
        profile = {
          id: user?.id,
          email: user?.email,
          role: chosenRole,
          is_completed: false,
        };
      }

      setUserProfile(profile);

      // Check if profile is incomplete
      if (!profile || !profile.is_completed) {
        addToast('Please complete your profile setup.', 'info');
        navigate('/onboarding');
      } else {
        addToast('Welcome back to Bridge-IQ!', 'success');
      }
    } else {
      addToast('Authenticated successfully.', 'success');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] flex flex-col">
      <Navigation 
        session={session} 
        userProfile={userProfile}
        handleLogout={handleLogout} 
        openAuth={openAuth} 
      />
      
      <div className="flex-grow flex flex-col relative z-10">
        <Routes>
          <Route path="/" element={<LandingPage onSignUp={() => openAuth('signup')} onExplore={() => navigate('/jobs')} />} />
          
          <Route path="/onboarding" element={
            <Onboarding 
              session={session} 
              onProfileUpdated={(updated) => setUserProfile(updated)} 
            />
          } />

          <Route path="/analyzer" element={
            <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
              <div className="text-center mb-10">
                <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 tracking-tight mb-3">Skill Gap Analyzer</h1>
                <p className="mt-2 text-lg md:text-xl font-medium text-gray-600">AI Career Copilot</p>
              </div>
              <SkillGapAnalyzer />
            </div>
          } />
          
          <Route path="/jobs" element={
            <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
              <LiveJobSearch />
            </div>
          } />
          
          <Route path="/dashboard" element={
            <div className="py-8 max-w-7xl mx-auto w-full">
              <Dashboard session={session} userProfile={userProfile} />
            </div>
          } />
        </Routes>
      </div>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onAuthSuccess={handleAuthSuccess}
        initialMode={authMode}
      />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <Router>
          <MainApp />
        </Router>
      </ToastProvider>
    </ErrorBoundary>
  );
}

