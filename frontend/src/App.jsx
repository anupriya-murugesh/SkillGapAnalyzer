import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import SkillGapAnalyzer from './components/SkillGapAnalyzer';
import Dashboard from './components/Dashboard';
import AuthModal from './components/AuthModal';
import LandingPage from './components/LandingPage';
import LiveJobSearch from './components/LiveJobSearch';
import { supabase } from './lib/supabaseClient';
import { ToastProvider, useToast } from './context/ToastContext';
import { ErrorBoundary } from './components/ErrorBoundary';

function Navigation({ session, handleLogout, openAuth }) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { path: '/analyzer', label: 'Analyzer' },
    { path: '/jobs', label: 'Live Market' },
    { path: '/dashboard', label: 'Dashboard' }
  ];

  const getLinkClass = (path) => 
    `px-4 py-2 text-sm font-bold rounded-lg transition-colors ${location.pathname === path ? 'bg-gray-100 text-indigo-700' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`;

  return (
    <nav className="bg-white/95 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center text-white font-black text-xl shadow-sm">
              S
            </div>
            <span className="text-xl font-black text-gray-900 tracking-tight hidden sm:block">SkillGap AI</span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-2">
            {navLinks.map(link => (
              <Link key={link.path} to={link.path} className={getLinkClass(link.path)}>
                {link.label}
              </Link>
            ))}
            <Link to="/#features" className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors">Features</Link>
          </div>
        </div>
        
        {/* Desktop Actions */}
        <div className="hidden lg:flex items-center gap-3">
          {session ? (
            <div className="flex items-center gap-3 animate-in fade-in duration-300">
              <span className="px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-sm font-bold text-indigo-700">
                {session.user?.email || 'user@skillgap.ai'}
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
          {!session ? (
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100">
              <button onClick={() => { setMobileMenuOpen(false); openAuth('login'); }} className="py-3 text-sm font-bold text-gray-700 bg-gray-100 rounded-xl">Log In</button>
              <button onClick={() => { setMobileMenuOpen(false); openAuth('signup'); }} className="py-3 text-sm font-bold bg-gray-900 text-white rounded-xl">Sign Up</button>
            </div>
          ) : (
            <div className="pt-4 border-t border-gray-100 space-y-3">
              <div className="px-4 text-sm font-bold text-indigo-600 truncate">{session.user?.email || 'user@skillgap.ai'}</div>
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
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const navigate = useNavigate();
  const { addToast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setSession(session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    navigate('/');
    addToast('Logged out successfully.', 'info');
  };

  const openAuth = (mode) => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleAuthSuccess = (demoSession = null) => {
    setIsAuthModalOpen(false);
    if (demoSession) {
      setSession(demoSession);
      addToast('Logged in (Demo Mode). Connect Supabase to persist your account.', 'info');
    } else {
      addToast('Logged in successfully.', 'success');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] flex flex-col">
      <Navigation session={session} handleLogout={handleLogout} openAuth={openAuth} />
      
      <div className="flex-grow flex flex-col relative z-10">
        <Routes>
          <Route path="/" element={<LandingPage onSignUp={() => openAuth('signup')} onExplore={() => navigate('/jobs')} />} />
          
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
            <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
              <div className="text-center mb-10">
                <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 tracking-tight mb-3">Career Dashboard</h1>
                <p className="mt-2 text-lg md:text-xl font-medium text-gray-600">Your Professional Progress</p>
              </div>
              <Dashboard />
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
