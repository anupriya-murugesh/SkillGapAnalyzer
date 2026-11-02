import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Navbar({ session, userProfile, handleLogout, openAuth, onSwitchRole }) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [signInMenuOpen, setSignInMenuOpen] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const signInDropdownRef = useRef(null);
  const roleSwitcherRef = useRef(null);

  const currentRole = userProfile?.role || session?.user?.user_metadata?.role || 'candidate';
  const userInitial = (userProfile?.full_name || session?.user?.email || 'A').trim().charAt(0).toUpperCase();

  const employerLinks = [
    { path: '/employer', label: '📊 Dashboard' },
    { path: '/employer?tab=jobs', label: '📢 Job Postings' },
    { path: '/employer?tab=candidates', label: '👥 Talent Pool' },
    { path: '/employer?tab=post-job', label: '➕ Post a Job' },
    { path: '/employer?tab=analytics', label: '📈 Analytics' }
  ];

  const candidateLinks = [
    { path: '/candidate', label: 'Candidate Portal' },
    { path: '/candidate/roadmap', label: 'AI Roadmap' },
    { path: '/candidate/practice', label: 'Assessments' },
    { path: '/analyzer', label: 'Skill Gap Analyzer' },
    { path: '/jobs', label: 'Live Market' }
  ];

  const adminLinks = [
    { path: '/admin', label: '📊 Overview' },
    { path: '/admin?tab=users', label: '👥 Users' },
    { path: '/admin?tab=jobs', label: '📢 Jobs' },
    { path: '/admin?tab=questions', label: '🧠 Question Bank' },
    { path: '/admin?tab=audits', label: '🛡️ Audits' },
    { path: '/admin?tab=telemetry', label: '⚡ Telemetry' }
  ];

  const navLinks = currentRole === 'admin' ? adminLinks : currentRole === 'employer' ? employerLinks : candidateLinks;

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (signInDropdownRef.current && !signInDropdownRef.current.contains(event.target)) {
        setSignInMenuOpen(false);
      }
      if (roleSwitcherRef.current && !roleSwitcherRef.current.contains(event.target)) {
        setRoleMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getLinkClass = (path) => {
    const isActive = location.pathname === path || (path === '/candidate' && location.pathname.startsWith('/candidate'));
    return `px-3.5 py-2 text-sm font-bold rounded-xl transition-all ${
      isActive
        ? 'bg-emerald-700 text-white shadow-sm'
        : 'text-slate-900 hover:text-emerald-700 hover:bg-emerald-50'
    }`;
  };

  const handleSelectRoleSignIn = (role) => {
    setSignInMenuOpen(false);
    setMobileMenuOpen(false);
    if (openAuth) {
      openAuth('login', role);
    }
  };

  return (
    <nav className="bg-white/95 backdrop-blur-xl border-b-2 border-slate-200 sticky top-0 z-50 transition-colors font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo & Main Nav */}
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-emerald-700 flex items-center justify-center text-white font-black text-xl shadow-md shadow-emerald-700/25 group-hover:bg-emerald-800 transition-all duration-300">
              B
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black text-slate-950 tracking-tight leading-tight group-hover:text-emerald-700 transition-colors">
                Bridge-IQ
              </span>
              <span className="text-[10px] font-extrabold text-emerald-800 tracking-wider uppercase leading-tight font-mono">
                Enterprise Assessment
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-1.5">
            {navLinks.map((link) => (
              <Link key={link.path} to={link.path} className={getLinkClass(link.path)}>
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Desktop Actions */}
        <div className="hidden lg:flex items-center gap-3">
          {session ? (
            <div className="flex items-center gap-3 animate-in fade-in duration-300">
              {/* Quick Role Switcher Trigger Button */}
              <div className="relative" ref={roleSwitcherRef}>
                <button
                  type="button"
                  onClick={() => setRoleMenuOpen((prev) => !prev)}
                  title="Click to instantly switch between Candidate, Employer, and Admin dashboards"
                  className={`px-3 py-1.5 rounded-full text-xs font-black border-2 flex items-center gap-1.5 transition-all cursor-pointer shadow-xs hover:shadow-md hover:scale-105 active:scale-95 ${
                    currentRole === 'admin'
                      ? 'bg-purple-100 hover:bg-purple-200 border-purple-400 text-purple-950'
                      : currentRole === 'employer'
                      ? 'bg-amber-100 hover:bg-amber-200 border-amber-400 text-amber-950'
                      : 'bg-emerald-100 hover:bg-emerald-200 border-emerald-400 text-emerald-950'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full animate-pulse ${
                    currentRole === 'admin' ? 'bg-purple-600' : currentRole === 'employer' ? 'bg-amber-600' : 'bg-emerald-600'
                  }`} />
                  <span>{currentRole === 'admin' ? '👑 Admin' : currentRole === 'employer' ? '🏢 Employer' : '🎯 Candidate'}</span>
                  <span className="text-[9px] text-slate-600 ml-0.5">▼ Switch</span>
                </button>

                {/* Instant Role Switcher Dropdown */}
                {roleMenuOpen && (
                  <div className="absolute left-0 mt-2 w-64 rounded-2xl bg-white border-2 border-slate-200 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-1.5 border-b border-slate-100 mb-1 flex items-center justify-between">
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-600">
                        ⚡ Quick Portal Switcher
                      </p>
                      <span className="text-[9px] font-extrabold bg-emerald-100 text-emerald-900 px-1.5 py-0.5 rounded-full">0ms</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setRoleMenuOpen(false);
                        if (onSwitchRole) onSwitchRole('candidate');
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-bold transition-all cursor-pointer ${
                        currentRole === 'candidate'
                          ? 'bg-emerald-700 text-white shadow-xs'
                          : 'text-slate-800 hover:bg-emerald-50 hover:text-emerald-900'
                      }`}
                    >
                      <span>🎯</span>
                      <div className="flex-1">
                        <div>Candidate Portal</div>
                        <div className={`text-[10px] font-normal ${currentRole === 'candidate' ? 'text-emerald-100' : 'text-slate-500'}`}>Roadmaps & Skill Assessments</div>
                      </div>
                      {currentRole === 'candidate' && <span className="text-xs">✓ Active</span>}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setRoleMenuOpen(false);
                        if (onSwitchRole) onSwitchRole('employer');
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-bold transition-all cursor-pointer mt-1 ${
                        currentRole === 'employer'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'text-slate-800 hover:bg-amber-50 hover:text-amber-950'
                      }`}
                    >
                      <span>🏢</span>
                      <div className="flex-1">
                        <div>Employer Dashboard</div>
                        <div className={`text-[10px] font-normal ${currentRole === 'employer' ? 'text-amber-100' : 'text-slate-500'}`}>Talent Pool & Job Postings</div>
                      </div>
                      {currentRole === 'employer' && <span className="text-xs">✓ Active</span>}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setRoleMenuOpen(false);
                        if (onSwitchRole) onSwitchRole('admin');
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-bold transition-all cursor-pointer mt-1 border-t border-slate-100 pt-1.5 ${
                        currentRole === 'admin'
                          ? 'bg-purple-800 text-white shadow-xs'
                          : 'text-slate-800 hover:bg-purple-50 hover:text-purple-900'
                      }`}
                    >
                      <span>👑</span>
                      <div className="flex-1">
                        <div>Admin Command Center</div>
                        <div className={`text-[10px] font-normal ${currentRole === 'admin' ? 'text-purple-200' : 'text-purple-600'}`}>Full Platform Governance</div>
                      </div>
                      {currentRole === 'admin' && <span className="text-xs">✓ Active</span>}
                    </button>
                  </div>
                )}
              </div>

              {/* User Profile Avatar Pill */}
              <Link
                to={currentRole === 'admin' ? '/admin' : currentRole === 'employer' ? '/employer' : '/candidate/profile'}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-50 border-2 border-slate-200 hover:border-emerald-600 transition-colors shadow-xs"
                title={currentRole === 'admin' ? 'Superadmin Command Center' : currentRole === 'employer' ? 'Employer Dashboard' : 'Candidate Profile'}
              >
                <div className={`w-7 h-7 rounded-full text-white font-black text-xs flex items-center justify-center shadow-xs ${
                  currentRole === 'admin' ? 'bg-purple-700' : 'bg-emerald-700'
                }`}>
                  {userInitial}
                </div>
                <span className="text-xs font-bold text-slate-950 max-w-[140px] truncate">
                  {userProfile?.company_name || userProfile?.full_name || session.user?.email || 'User'}
                </span>
              </Link>

              <button
                onClick={handleLogout}
                className="px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:text-red-700 hover:bg-red-50 border border-slate-300 hover:border-red-300 rounded-xl transition-all cursor-pointer"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 animate-in fade-in duration-300">
              {/* Multi-Role Sign In Dropdown Trigger */}
              <div className="relative" ref={signInDropdownRef}>
                <button
                  type="button"
                  onClick={() => setSignInMenuOpen((prev) => !prev)}
                  className="px-4 py-2 text-sm font-bold text-slate-900 hover:text-emerald-800 bg-white hover:bg-slate-50 border-2 border-slate-300 hover:border-emerald-600 rounded-xl transition-all flex items-center gap-2 shadow-xs cursor-pointer"
                  aria-expanded={signInMenuOpen}
                >
                  <span>Sign In</span>
                  <svg
                    className={`w-4 h-4 text-emerald-700 transition-transform duration-200 ${signInMenuOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Split Dropdown Menu */}
                {signInMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white border-2 border-slate-200 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-2 border-b border-slate-100 mb-1">
                      <p className="text-[11px] font-black uppercase tracking-wider text-emerald-800">
                        Select Portal Access
                      </p>
                    </div>

                    <button
                      onClick={() => handleSelectRoleSignIn('candidate')}
                      className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left hover:bg-emerald-50 transition-colors group cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 border border-emerald-300 text-emerald-900 flex items-center justify-center text-base group-hover:scale-105 transition-transform">
                        🎯
                      </div>
                      <div>
                        <div className="text-sm font-extrabold text-slate-950 group-hover:text-emerald-800 transition-colors">
                          Sign in as Candidate
                        </div>
                        <div className="text-[11px] font-semibold text-slate-600">
                          Assessment & Career Hub
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => handleSelectRoleSignIn('employer')}
                      className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left hover:bg-emerald-50 transition-colors group mt-1 cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 border border-emerald-300 text-emerald-900 flex items-center justify-center text-base group-hover:scale-105 transition-transform">
                        🏢
                      </div>
                      <div>
                        <div className="text-sm font-extrabold text-slate-950 group-hover:text-emerald-800 transition-colors">
                          Sign in as Employer
                        </div>
                        <div className="text-[11px] font-semibold text-slate-600">
                          Hiring & Benchmarking
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => handleSelectRoleSignIn('admin')}
                      className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left hover:bg-purple-50 transition-colors group mt-1 cursor-pointer border-t border-slate-100 pt-2"
                    >
                      <div className="w-8 h-8 rounded-lg bg-purple-100 border border-purple-300 text-purple-900 flex items-center justify-center text-base group-hover:scale-105 transition-transform">
                        👑
                      </div>
                      <div>
                        <div className="text-sm font-extrabold text-slate-950 group-hover:text-purple-800 transition-colors">
                          Sign in as Admin
                        </div>
                        <div className="text-[11px] font-semibold text-purple-700">
                          Governance & Telemetry
                        </div>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              {/* Registration Trigger */}
              <Link
                to="/candidate/signup"
                className="px-4 py-2 text-sm font-extrabold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-all shadow-md shadow-emerald-700/20 active:scale-95"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="lg:hidden flex items-center">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-slate-900 hover:text-emerald-700 focus:outline-none p-2 bg-slate-50 border-2 border-slate-200 rounded-xl"
            aria-label="Toggle navigation menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d={mobileMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t-2 border-slate-200 bg-white px-4 pt-3 pb-6 space-y-2.5 animate-in slide-in-from-top-2 absolute w-full shadow-2xl">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-4 py-2.5 rounded-xl text-sm font-bold ${
                location.pathname === link.path
                  ? 'bg-emerald-700 text-white'
                  : 'text-slate-900 hover:bg-emerald-50'
              }`}
            >
              {link.label}
            </Link>
          ))}

          {!session ? (
            <div className="pt-3 border-t-2 border-slate-200 space-y-2">
              <div className="text-xs font-black uppercase tracking-wider text-emerald-800 px-1 mb-1">
                Account Access
              </div>
              <button
                onClick={() => handleSelectRoleSignIn('candidate')}
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-bold bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-950"
              >
                <span>🎯 Sign in as Candidate</span>
                <span className="text-emerald-700 font-bold">→</span>
              </button>
              <button
                onClick={() => handleSelectRoleSignIn('employer')}
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-bold bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-950"
              >
                <span>🏢 Sign in as Employer</span>
                <span className="text-emerald-700 font-bold">→</span>
              </button>
              <button
                onClick={() => handleSelectRoleSignIn('admin')}
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-bold bg-purple-50 border-2 border-purple-200 rounded-xl text-slate-950"
              >
                <span>👑 Sign in as Admin</span>
                <span className="text-purple-700 font-bold">→</span>
              </button>
              <Link
                to="/candidate/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full block text-center py-3 text-sm font-extrabold bg-emerald-700 text-white rounded-xl shadow-sm"
              >
                Candidate Sign Up
              </Link>
            </div>
          ) : (
            <div className="pt-3 border-t-2 border-slate-200 space-y-2">
              <div className="px-4 py-2 text-xs font-bold text-slate-800 flex items-center justify-between bg-slate-50 rounded-xl border border-slate-200">
                <span className="truncate">{session.user?.email}</span>
                <span className="text-emerald-800 uppercase font-black text-[10px]">{currentRole}</span>
              </div>
              
              <div className="grid grid-cols-3 gap-1 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (onSwitchRole) onSwitchRole('candidate');
                  }}
                  className={`py-2 px-1 text-center rounded-lg text-xs font-bold ${
                    currentRole === 'candidate' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-800'
                  }`}
                >
                  🎯 Candidate
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (onSwitchRole) onSwitchRole('employer');
                  }}
                  className={`py-2 px-1 text-center rounded-lg text-xs font-bold ${
                    currentRole === 'employer' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-800'
                  }`}
                >
                  🏢 Employer
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (onSwitchRole) onSwitchRole('admin');
                  }}
                  className={`py-2 px-1 text-center rounded-lg text-xs font-bold ${
                    currentRole === 'admin' ? 'bg-purple-800 text-white' : 'bg-slate-100 text-slate-800'
                  }`}
                >
                  👑 Admin
                </button>
              </div>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full text-left px-4 py-2.5 text-sm font-bold text-red-700 hover:bg-red-50 rounded-xl transition-colors mt-2"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
