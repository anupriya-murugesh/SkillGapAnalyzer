import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import CandidateSignUp from './components/CandidateSignUp';
import CandidateLayout from './layouts/CandidateLayout';
import CandidateHome from './pages/CandidateHome';
import CandidatePractice from './pages/CandidatePractice';
import CandidateProfile from './pages/CandidateProfile';
import CandidateRoadmap from './pages/CandidateRoadmap';
import EmployerPortal from './pages/EmployerPortal';
import AdminPortal from './pages/AdminPortal';
import SkillGapAnalyzer from './components/SkillGapAnalyzer';
import Dashboard from './pages/Dashboard';
import AuthModal from './components/AuthModal';
import LandingPage from './components/LandingPage';
import LiveJobSearch from './components/LiveJobSearch';
import Onboarding from './pages/Onboarding';
import { supabase } from './lib/supabaseClient';
import { getUserProfile, isAdminEmail } from './lib/auth';
import { ToastProvider, useToast } from './context/ToastContext';
import { ErrorBoundary } from './components/ErrorBoundary';

function MainApp() {
  const [session, setSession] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [authRole, setAuthRole] = useState('candidate');
  const navigate = useNavigate();
  const { addToast } = useToast() || { addToast: () => {} };

  useEffect(() => {
    const checkUserSession = async (user) => {
      if (!user?.id) return;
      try {
        const profile = await getUserProfile(user.id);
        if (profile && isAdminEmail(user.email)) {
          profile.role = 'admin';
        }
        setUserProfile(profile);
      } catch (e) {
        console.warn('Profile check error:', e);
      }
    };

    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      if (existingSession) {
        setSession(existingSession);
        checkUserSession(existingSession.user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (currentSession) {
        setSession(currentSession);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUserProfile(null);
    navigate('/');
    addToast('Logged out successfully.', 'info');
  };

  const openAuth = (mode = 'login', role = 'candidate') => {
    setAuthMode(mode);
    setAuthRole(role);
    setIsAuthModalOpen(true);
  };

  const handleAuthSuccess = async (newSession = null, chosenRole = null) => {
    setIsAuthModalOpen(false);
    const resolvedSession = newSession || session;

    if (resolvedSession) {
      setSession(resolvedSession);
      const user = resolvedSession.user;
      let profile = await getUserProfile(user?.id);

      const isMasterAdmin = isAdminEmail(user?.email);

      if (!profile) {
        profile = {
          id: user?.id,
          email: user?.email,
          role: isMasterAdmin ? 'admin' : (chosenRole || authRole || 'candidate'),
          is_completed: false,
        };
      } else if (isMasterAdmin) {
        profile.role = 'admin';
      }

      setUserProfile(profile);

      const effectiveRole = profile.role || (isMasterAdmin ? 'admin' : chosenRole) || authRole;
      if (effectiveRole === 'admin') {
        addToast('Welcome Master Administrator to Bridge-IQ Command Center!', 'success');
        navigate('/admin');
      } else if (effectiveRole === 'candidate') {
        addToast('Welcome to your Candidate Panel!', 'success');
        navigate('/candidate');
      } else {
        addToast('Welcome to Bridge-IQ Employer Platform!', 'success');
        navigate('/employer');
      }
    } else {
      addToast('Authenticated successfully.', 'success');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFCF8] text-slate-900 flex flex-col font-sans">
      
      {/* Header Navbar with Dual-Role Sign In trigger */}
      <Navbar
        session={session}
        userProfile={userProfile}
        handleLogout={handleLogout}
        openAuth={openAuth}
      />

      <div className="flex-grow flex flex-col relative z-10">
        <Routes>
          {/* Public Landing Page */}
          <Route
            path="/"
            element={
              <LandingPage
                onSignUp={() => navigate('/candidate/signup')}
                onExplore={() => navigate('/jobs')}
              />
            }
          />

          {/* Candidate Registration Page */}
          <Route
            path="/candidate/signup"
            element={
              <CandidateSignUp
                onAuthSuccess={handleAuthSuccess}
                onOpenSignIn={(role) => openAuth('login', role)}
              />
            }
          />

          {/* Candidate Portal Master Shell & Pages */}
          <Route
            path="/candidate"
            element={
              <CandidateLayout
                session={session}
                userProfile={userProfile}
                onProfileUpdated={(updated) => setUserProfile(updated)}
                onLogout={handleLogout}
                openAuth={openAuth}
              />
            }
          >
            <Route index element={<CandidateHome />} />
            <Route path="home" element={<CandidateHome />} />
            <Route path="practice" element={<CandidatePractice />} />
            <Route path="roadmap" element={<CandidateRoadmap />} />
            <Route path="profile" element={<CandidateProfile />} />
          </Route>

          {/* Dedicated Enterprise Employer Portal */}
          <Route
            path="/employer"
            element={
              <EmployerPortal
                session={session}
                userProfile={userProfile}
                onLogout={handleLogout}
              />
            }
          />

          {/* Superadmin Governance & Telemetry Portal */}
          <Route
            path="/admin"
            element={
              <AdminPortal
                session={session}
                userProfile={userProfile}
                onLogout={handleLogout}
              />
            }
          />

          {/* Legacy Onboarding Setup */}
          <Route
            path="/onboarding"
            element={
              <Onboarding
                session={session}
                onProfileUpdated={(updated) => setUserProfile(updated)}
              />
            }
          />

          {/* Skill Gap Analyzer */}
          <Route
            path="/analyzer"
            element={
              <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
                <div className="text-center mb-10">
                  <h1 className="text-4xl md:text-5xl font-black text-slate-950 tracking-tight mb-3">
                    Skill Gap Analyzer
                  </h1>
                  <p className="mt-2 text-lg md:text-xl font-bold text-emerald-800">
                    AI Enterprise Assessment Copilot
                  </p>
                </div>
                <SkillGapAnalyzer />
              </div>
            }
          />

          {/* Live Market Jobs */}
          <Route
            path="/jobs"
            element={
              <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
                <LiveJobSearch />
              </div>
            }
          />

          {/* Multi-Role Dashboard */}
          <Route
            path="/dashboard"
            element={
              userProfile?.role === 'admin' ? (
                <AdminPortal
                  session={session}
                  userProfile={userProfile}
                  onLogout={handleLogout}
                />
              ) : userProfile?.role === 'employer' ? (
                <EmployerPortal
                  session={session}
                  userProfile={userProfile}
                  onLogout={handleLogout}
                />
              ) : (
                <div className="py-8 max-w-7xl mx-auto w-full">
                  <Dashboard session={session} userProfile={userProfile} />
                </div>
              )
            }
          />
        </Routes>
      </div>

      {/* Dual-Role Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
        initialMode={authMode}
        initialRole={authRole}
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
