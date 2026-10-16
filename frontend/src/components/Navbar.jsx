import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Navbar({ session, userProfile, handleLogout, openAuth }) {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [signInMenuOpen, setSignInMenuOpen] = useState(false);
  const signInDropdownRef = useRef(null);

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

  const navLinks = currentRole === 'employer' ? employerLinks : candidateLinks;

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (signInDropdownRef.current && !signInDropdownRef.current.contains(event.target)) {
        setSignInMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getLinkClass = (path) => {
    const isActive = location.pathname === path || (path === '/candidate' && location.pathname.startsWith('/candidate'));
    return `px-3.5 py-2 text-sm font-semibold rounded-xl transition-all ${
      isActive
        ? 'bg-[#B298E7]/15 text-[#B298E7] border border-[#B298E7]/35 shadow-sm shadow-[#B298E7]/10'
        : 'text-slate-400 hover:text-slate-100 hover:bg-[#161c30]'
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
    <nav className="bg-[#0c0e17]/95 backdrop-blur-xl border-b border-[#1f2742] sticky top-0 z-50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo & Main Nav */}
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#B298E7] via-[#F5B8D5] to-[#B8E3E9] flex items-center justify-center text-[#0c0e17] font-black text-xl shadow-lg shadow-[#B298E7]/25 group-hover:shadow-[#F5B8D5]/30 transition-all duration-300">
              B
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black text-slate-100 tracking-tight leading-tight group-hover:text-white transition-colors">
                Bridge-IQ
              </span>
              <span className="text-[10px] font-bold text-[#B8E3E9] tracking-widest uppercase leading-tight">
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
              {/* Role Indicator Badge */}
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${
                currentRole === 'employer'
                  ? 'bg-[#F5B8D5]/15 border-[#F5B8D5]/40 text-[#F5B8D5]'
                  : 'bg-[#B298E7]/15 border-[#B298E7]/40 text-[#B298E7]'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                  currentRole === 'employer' ? 'bg-[#F9BEDD]' : 'bg-[#B8E3E9]'
                }`} />
                <span>{currentRole === 'employer' ? '🏢 Employer' : '🎯 Candidate'}</span>
              </span>

              {/* User Profile Avatar Pill */}
              <Link
                to={currentRole === 'employer' ? '/employer' : '/candidate/profile'}
                className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl bg-[#121626] border border-[#1f2742] hover:border-[#B298E7]/50 transition-colors"
                title={currentRole === 'employer' ? 'Employer Dashboard' : 'Candidate Profile'}
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#B298E7] via-[#F5B8D5] to-[#B8E3E9] text-[#0c0e17] font-black text-xs flex items-center justify-center shadow-sm">
                  {userInitial}
                </div>
                <span className="text-xs font-semibold text-slate-300 max-w-[140px] truncate">
                  {userProfile?.company_name || userProfile?.full_name || session.user?.email || 'User'}
                </span>
              </Link>

              <button
                onClick={handleLogout}
                className="px-3 py-1.5 text-xs font-bold text-slate-400 hover:text-red-400 hover:bg-red-950/30 border border-transparent hover:border-red-900/50 rounded-xl transition-all"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 animate-in fade-in duration-300">
              {/* Dual-Role Sign In Dropdown Trigger */}
              <div className="relative" ref={signInDropdownRef}>
                <button
                  type="button"
                  onClick={() => setSignInMenuOpen((prev) => !prev)}
                  className="px-4 py-2 text-sm font-bold text-slate-200 hover:text-white bg-[#121626] hover:bg-[#161c30] border border-[#1f2742] hover:border-[#B298E7]/50 rounded-xl transition-all flex items-center gap-2 shadow-sm"
                  aria-expanded={signInMenuOpen}
                >
                  <span>Sign In</span>
                  <svg
                    className={`w-4 h-4 text-[#B8E3E9] transition-transform duration-200 ${signInMenuOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Sleek Split Dropdown Menu */}
                {signInMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#121626] border border-[#1f2742] shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-2 border-b border-[#1f2742] mb-1">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-[#B8E3E9]">
                        Select Portal Access
                      </p>
                    </div>

                    <button
                      onClick={() => handleSelectRoleSignIn('candidate')}
                      className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-left hover:bg-[#161c30] transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-[#B298E7]/15 border border-[#B298E7]/30 text-[#B298E7] flex items-center justify-center text-base group-hover:scale-105 transition-transform">
                        🎯
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-100 group-hover:text-[#B298E7] transition-colors">
                          Sign in as Candidate
                        </div>
                        <div className="text-[11px] text-slate-400">
                          College & Career Assessment Panel
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={() => handleSelectRoleSignIn('employer')}
                      className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-left hover:bg-[#161c30] transition-colors group mt-1"
                    >
                      <div className="w-8 h-8 rounded-lg bg-[#B8E3E9]/15 border border-[#B8E3E9]/30 text-[#B8E3E9] flex items-center justify-center text-base group-hover:scale-105 transition-transform">
                        🏢
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-100 group-hover:text-[#B8E3E9] transition-colors">
                          Sign in as Employer
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Hiring & Talent Benchmarking
                        </div>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              {/* Candidate Registration Trigger */}
              <Link
                to="/candidate/signup"
                className="px-4 py-2 text-sm font-black bg-gradient-to-r from-[#B298E7] via-[#F5B8D5] to-[#F9BEDD] hover:from-[#B8E3E9] hover:to-[#B298E7] text-[#0c0e17] rounded-xl shadow-lg shadow-[#B298E7]/20 hover:shadow-[#F5B8D5]/30 transition-all active:scale-95"
              >
                Candidate Sign Up
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="lg:hidden flex items-center">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-slate-400 hover:text-slate-100 focus:outline-none p-2 bg-[#121626] border border-[#1f2742] rounded-xl"
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
        <div className="lg:hidden border-t border-[#1f2742] bg-[#0c0e17] px-4 pt-3 pb-6 space-y-2.5 animate-in slide-in-from-top-2 absolute w-full shadow-2xl">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-4 py-2.5 rounded-xl text-sm font-bold ${
                location.pathname === link.path
                  ? 'bg-[#B298E7]/15 text-[#B298E7] border border-[#B298E7]/30'
                  : 'text-slate-300 hover:bg-[#121626]'
              }`}
            >
              {link.label}
            </Link>
          ))}

          {!session ? (
            <div className="pt-3 border-t border-[#1f2742] space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-[#B8E3E9] px-1 mb-1">
                Account Access
              </div>
              <button
                onClick={() => handleSelectRoleSignIn('candidate')}
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-bold bg-[#121626] border border-[#1f2742] rounded-xl text-slate-200"
              >
                <span>🎯 Sign in as Candidate</span>
                <span className="text-[#B298E7]">→</span>
              </button>
              <button
                onClick={() => handleSelectRoleSignIn('employer')}
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-bold bg-[#121626] border border-[#1f2742] rounded-xl text-slate-200"
              >
                <span>🏢 Sign in as Employer</span>
                <span className="text-[#B8E3E9]">→</span>
              </button>
              <Link
                to="/candidate/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full block text-center py-3 text-sm font-black bg-gradient-to-r from-[#B298E7] via-[#F5B8D5] to-[#F9BEDD] text-[#0c0e17] rounded-xl"
              >
                Candidate Sign Up
              </Link>
            </div>
          ) : (
            <div className="pt-3 border-t border-[#1f2742] space-y-2">
              <div className="px-4 py-2 text-xs font-semibold text-slate-400 flex items-center justify-between bg-[#121626] rounded-xl border border-[#1f2742]">
                <span className="truncate">{session.user?.email}</span>
                <span className="text-[#B298E7] uppercase font-bold text-[10px]">{currentRole}</span>
              </div>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full text-left px-4 py-2.5 text-sm font-bold text-red-400 hover:bg-red-950/30 rounded-xl transition-colors"
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
