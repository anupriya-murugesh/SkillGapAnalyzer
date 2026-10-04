import { useState, useEffect } from 'react';
import SkillGapAnalyzer from './components/SkillGapAnalyzer';
import Dashboard from './components/Dashboard';
import AuthModal from './components/AuthModal';
import { supabase } from './lib/supabaseClient';

function App() {
  const [session, setSession] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [demoToast, setDemoToast] = useState(false);
  const [activeView, setActiveView] = useState('analyzer'); // 'analyzer' or 'dashboard'

  useEffect(() => {
    // Get current session on load
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setSession(session);
    });

    // Listen for auth state changes globally
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  const handleAuthSuccess = (demoSession = null) => {
    setIsAuthModalOpen(false);
    if (demoSession) {
      setSession(demoSession);
      setDemoToast(true);
      setTimeout(() => setDemoToast(false), 5000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
      {/* Top Navigation Bar */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setActiveView('analyzer')}>
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center text-white font-black text-xl shadow-sm">
                S
              </div>
              <span className="text-xl font-black text-gray-900 tracking-tight">SkillGap AI</span>
            </div>

            {/* Main Navigation Tabs */}
            <div className="hidden md:flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
              <button 
                onClick={() => setActiveView('analyzer')}
                className={`px-5 py-1.5 text-sm font-bold rounded-lg transition-all ${activeView === 'analyzer' ? 'bg-white text-indigo-700 shadow-sm scale-100' : 'text-gray-500 hover:text-gray-700 scale-95 hover:bg-gray-200/50'}`}
              >
                Scan & Analyze
              </button>
              <button 
                onClick={() => setActiveView('dashboard')}
                className={`px-5 py-1.5 text-sm font-bold rounded-lg transition-all ${activeView === 'dashboard' ? 'bg-white text-indigo-700 shadow-sm scale-100' : 'text-gray-500 hover:text-gray-700 scale-95 hover:bg-gray-200/50'}`}
              >
                My Dashboard
              </button>
            </div>
          </div>
          
          <div>
            {session ? (
              <div className="flex items-center gap-4 animate-in fade-in duration-300">
                <span className="hidden sm:inline-flex items-center px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-sm font-bold text-indigo-700">
                  {session.user?.email || 'user@skillgap.ai'}
                </span>
                <button 
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm font-bold text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setIsAuthModalOpen(true)}
                className="px-5 py-2.5 text-sm font-bold bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors shadow-sm hover:shadow-md animate-in fade-in duration-300"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="py-12 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 tracking-tight mb-3">
              {activeView === 'analyzer' ? 'Skill Gap Analyzer' : 'Career Dashboard'}
            </h1>
            <p className="mt-2 text-xl font-medium text-gray-600">
              {activeView === 'analyzer' ? 'AI Career Copilot' : 'Your Professional Progress'}
            </p>
          </div>
          
          <div className={activeView === 'analyzer' ? 'block' : 'hidden'}>
            <SkillGapAnalyzer />
          </div>
          <div className={activeView === 'dashboard' ? 'block' : 'hidden'}>
            <Dashboard onAnalyzeJob={() => {
              setActiveView('analyzer');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }} />
          </div>
        </div>
      </div>

      {/* Demo Mode Toast */}
      {demoToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-6 py-4 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-5 font-bold border border-gray-700 flex items-center gap-3">
          <span className="text-blue-400 text-xl">ℹ️</span>
          Logged in (Demo Mode). Connect Supabase in .env to persist real accounts.
        </div>
      )}

      {/* Authentication Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  )
}

export default App
