import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { getUserProfile } from '../lib/auth';
import CandidateDashboard from '../components/CandidateDashboard';
import EmployerDashboard from '../components/EmployerDashboard';
import { useToast } from '../context/ToastContext';

export default function Dashboard({ session: propSession, userProfile: propProfile }) {
  const [session, setSession] = useState(propSession || null);
  const [profile, setProfile] = useState(propProfile || null);
  const [loading, setLoading] = useState(!propProfile);
  const { addToast } = useToast() || { addToast: () => {} };

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      if (propProfile) return;
      setLoading(true);
      try {
        let currentSession = propSession;
        if (!currentSession) {
          const { data } = await supabase.auth.getSession();
          currentSession = data?.session;
        }

        if (currentSession && isMounted) {
          setSession(currentSession);
        }

        const userId = currentSession?.user?.id || 'demo-user';
        const userProf = await getUserProfile(userId);

        if (isMounted) {
          if (userProf) {
            setProfile(userProf);
          } else {
            const fallbackRole = currentSession?.user?.user_metadata?.role || 'candidate';
            setProfile({
              id: userId,
              email: currentSession?.user?.email || 'user@bridge-iq.ai',
              full_name: currentSession?.user?.email ? currentSession.user.email.split('@')[0] : 'Engineering Candidate',
              role: fallbackRole,
              target_role: 'Senior Full-Stack Engineer',
              skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL'],
            });
          }
        }
      } catch (err) {
        console.warn('Dashboard profile fetch notice:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadProfile();
    return () => { isMounted = false; };
  }, [propSession, propProfile]);

  // Demo Role Toggle helper (allows previewing both Candidate and Employer dashboards)
  const handleToggleRolePreview = () => {
    const nextRole = profile?.role === 'employer' ? 'candidate' : 'employer';
    const updated = {
      ...profile,
      role: nextRole,
    };
    setProfile(updated);
    addToast(`Switched view to ${nextRole === 'employer' ? 'Employer Portal' : 'Candidate Dashboard'}`, 'info');
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-4 text-center">
        <div className="w-12 h-12 border-4 border-[#B298E7]/20 border-t-[#B298E7] rounded-full animate-spin" />
        <p className="text-slate-400 font-bold text-sm">Loading your personalized dashboard...</p>
      </div>
    );
  }

  const isEmployer = profile?.role === 'employer';

  return (
    <div className="space-y-6">
      
      {/* Top Sandbox Role Toggle Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-end">
        <button
          onClick={handleToggleRolePreview}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#121626] hover:bg-[#161c30] border border-slate-700/80 text-slate-300 hover:text-white text-xs font-semibold shadow-sm transition-all active:scale-95 cursor-pointer"
          title="Toggle between Candidate and Employer role views"
        >
          <span className="text-xs">🔄</span>
          <span>View as: <strong className="text-[#B8E3E9] capitalize">{profile?.role || 'candidate'}</strong> (Click to switch)</span>
        </button>
      </div>

      {/* Role-Based Dashboard View */}
      {isEmployer ? (
        <EmployerDashboard 
          profile={profile} 
          session={session} 
        />
      ) : (
        <CandidateDashboard 
          profile={profile} 
          session={session} 
          onProfileUpdated={(updated) => setProfile(updated)} 
        />
      )}

    </div>
  );
}
