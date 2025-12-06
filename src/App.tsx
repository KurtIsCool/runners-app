import { useState, useEffect, useCallback } from 'react';
import { Loader2, X } from 'lucide-react';
import { supabase } from './lib/supabase';
import { api } from './lib/api';
import { type UserRole, type UserProfile, type Mission } from './types';
import { ILOILO_LAT, ILOILO_LNG } from './lib/constants';
import ChatBox from './components/ChatBox';
import MissionForm from './components/MissionForm';
import ProfileModal from './components/ProfileModal';
import RatingModal from './components/RatingModal';
import AuthScreen from './components/AuthScreen';
import ErrorBoundary from './components/ErrorBoundary';
import MobileLayout from './components/layouts/MobileLayout';
import DesktopLayout from './components/layouts/DesktopLayout';
import AppContent from './components/AppContent';
import { useMediaQuery } from './hooks/useMediaQuery';
import { type Session, type User as SupabaseUser, type RealtimePostgresChangesPayload } from '@supabase/supabase-js';

// --- 5. CSS Injection (Includes Desktop Styles) ---
const GlobalStyles = () => (
  <style dangerouslySetInnerHTML={{__html: `
    @keyframes float { 0% { transform: translate(0px, 0px) scale(1); } 33% { transform: translate(30px, -50px) scale(1.1); } 66% { transform: translate(-20px, 20px) scale(0.9); } 100% { transform: translate(0px, 0px) scale(1); } }
    @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes scaleIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
    .animate-blob { animation: float 10s infinite ease-in-out; }
    .stagger-enter { animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
    .pop-in { animation: scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
    .hover-lift { transition: transform 0.2s ease, box-shadow 0.2s ease; }
    .hover-lift:hover { transform: translateY(-4px); box-shadow: 0 10px 20px -10px rgba(0,0,0,0.1); }
    .btn-press:active { transform: scale(0.95); }
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    .pb-safe-nav { padding-bottom: calc(5rem + env(safe-area-inset-bottom)); }

    /* Desktop Layout Utilities */
    @media (min-width: 768px) {
      .desktop-layout { display: flex; min-height: 100vh; background-color: #f3f4f6; }
      .desktop-sidebar { width: 280px; position: fixed; height: 100vh; background: white; border-right: 1px solid #e5e7eb; z-index: 50; }
      .desktop-main { margin-left: 280px; flex: 1; padding: 2rem; max-width: 1200px; }
      .auth-split { display: flex; min-height: 100vh; width: 100%; }
      .auth-left { width: 50%; background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); display: flex; flex-direction: column; justify-content: center; padding: 4rem; color: white; position: relative; overflow: hidden; }
      .auth-right { width: 50%; display: flex; align-items: center; justify-content: center; background: white; }
    }
  `}} />
);

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [view, setView] = useState('home');
  const [showMissionForm, setShowMissionForm] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState<Mission | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPublicProfileId, setShowPublicProfileId] = useState<string | null>(null);
  const [publicProfile, setPublicProfile] = useState<UserProfile | null>(null);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeChatMission, setActiveChatMission] = useState<string|null>(null);

  const isDesktop = useMediaQuery('(min-width: 768px)');

  useEffect(() => {
    if (window.Notification && Notification.permission !== 'granted') Notification.requestPermission();
    
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
        setUser(session?.user ?? null);
        if (!session?.user) {
            setLoading(false); // If no session, stop loading immediately so we see login screen
        }
    });
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session: Session | null) => {
        setUser(session?.user ?? null); 
        if (!session?.user) { 
            setUserProfile(null); 
            setLoading(false); 
        } 
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      const { data, error } = await supabase.from('users').select('*').eq('id', user.id).single();
      if (data) { 
          setUserProfile(data); 
          if (view === 'home') setView('home'); 
      } 
      else if (error?.code === 'PGRST116') { 
          const email = user.email || '';
          await supabase.from('users').insert({ id: user.id, name: email.split('@')[0], email: email, role: 'student' });
          window.location.reload(); 
      }
      setLoading(false);
    };
    if (user) fetchProfile();
  }, [user, view]);

  // Fetch Public Profile when showPublicProfileId changes
  useEffect(() => {
    const fetchPublicProfile = async () => {
        if (!showPublicProfileId) {
            setPublicProfile(null);
            return;
        }

        const { data: userData, error } = await supabase.from('users').select('*').eq('id', showPublicProfileId).single();
        if (error || !userData) {
            console.error("Failed to fetch user");
            return;
        }

        let query = supabase.from('missions').select('rating, runner_rating, student_rating, status');
        if (userData.role === 'student') {
            query = query.eq('student_id', showPublicProfileId);
        } else {
            query = query.eq('runner_id', showPublicProfileId).eq('status', 'completed');
        }

        const { data: missionsData } = await query;

        let calculatedRating = 0;
        let reviewCount = 0;
        let completedCount = 0;

        if (missionsData) {
            completedCount = missionsData.length;

            const ratings = missionsData
                .map(r => userData.role === 'student' ? r.student_rating : r.runner_rating)
                .filter(r => r !== null && r !== undefined);

            reviewCount = ratings.length;
            if (reviewCount > 0) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                calculatedRating = ratings.reduce((a: any, b: any) => a + b, 0) / reviewCount;
            }
        }

        const enrichedProfile: UserProfile = {
            ...userData,
            [userData.role === 'student' ? 'student_rating' : 'runner_rating']: calculatedRating,
            total_reviews: reviewCount,
            history: Array(completedCount).fill('id'),
            rating: calculatedRating
        };

        setPublicProfile(enrichedProfile);
    };
    fetchPublicProfile();
  }, [showPublicProfileId]);

  const fetchMissions = useCallback(async () => {
     const { data } = await supabase.from('missions').select('*').order('created_at', { ascending: false });
     if (data) setMissions(data);
  }, []);

  useEffect(() => {
    if (user) {
        const load = async () => {
            await fetchMissions();
        };
        load();
    }
  }, [user, fetchMissions]);

  useEffect(() => {
    if (user) {
        const ch = supabase.channel('public:missions').on('postgres_changes', { event: '*', schema: 'public', table: 'missions' }, (p: RealtimePostgresChangesPayload<Mission>) => {
            if (p.eventType === 'INSERT') setMissions(prev => [p.new, ...prev]);
            else if (p.eventType === 'UPDATE') setMissions(prev => prev.map(r => r.id === p.new.id ? p.new : r));
        }).subscribe();
        return () => { supabase.removeChannel(ch); };
    }
  }, [user]);

  const handleAuth = async (type: 'login'|'signup', ...args: unknown[]) => {
    const email = args[0] as string;
    const password = args[1] as string;
    const role = args[2] as UserRole | undefined;

    const { error, data } = await (type === 'login' ? supabase.auth.signInWithPassword({ email, password }) : supabase.auth.signUp({ email, password, options: { data: { role } } }));
    if (error) throw error;
    if (type === 'signup' && data.session) { await supabase.from('users').insert({ id: data.user?.id, name: email.split('@')[0], email, role }); }
  };

  type MissionCreationData = Omit<Mission, 'id' | 'student_id' | 'created_at' | 'status' | 'payment_status'> & { lat?: number; lng?: number };

  const createMission = async (d: MissionCreationData) => {
    if (!user) return;
    const lat = d.lat || ILOILO_LAT;
    const lng = d.lng || ILOILO_LNG;

    const missionToInsert = {
        student_id: user.id,
        type: d.type,
        pickup_address: d.pickup_address,
        dropoff_address: d.dropoff_address,
        details: d.details,
        price_estimate: d.price_estimate,
        item_cost: d.item_cost || 0,
        lat,
        lng,
        status: 'requested'
    };

    const { error } = await supabase.from('missions').insert(missionToInsert);
    if (!error) { setShowMissionForm(false); setView('tracker'); }
  };

  const updateMissionStatus = async (id: string, status: string) => {
    await supabase.from('missions').update({ status }).eq('id', id);
  };

  const assignMission = async (id: string, runnerId: string) => {
    // Only update if status is 'requested'
    const { data, error } = await supabase
        .from('missions')
        .update({ runner_id: runnerId, status: 'pending_runner_confirmation' })
        .eq('id', id)
        .eq('status', 'requested')
        .select();

    if (error || !data || data.length === 0) {
        throw new Error("Job already taken or unavailable.");
    }
  };

  const rateMission = async (id: string, rating: number, comment?: string) => {
    if (!user) return;

    if (userProfile?.role === 'student') {
        const res = await api.rateRunner(user.id, id, rating, comment || '');
        if (res.error || !res.data.success) {
            console.error("Rate failed", res);
            alert("Rating failed: " + (res.error?.message || res.data?.message));
        }
    } else {
        // Fallback for runner rating student
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updateData: any = { student_rating: rating };
        if (comment) updateData.runner_comment = comment;
        await supabase.from('missions').update(updateData).eq('id', id);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600"/></div>;
  
  if (!user) return (
    <ErrorBoundary>
      <GlobalStyles />
      <AuthScreen onLogin={(e: string, p: string) => handleAuth('login', e, p)} onSignup={(e: string, p: string, r: UserRole) => handleAuth('signup', e, p, r)} />
    </ErrorBoundary>
  );

  const Layout = isDesktop ? DesktopLayout : MobileLayout;

  return (
    <ErrorBoundary>
      <div className="font-sans text-gray-900 animate-scale-in">
        <GlobalStyles />
        
        <Layout
          view={view}
          setView={setView}
          userProfile={userProfile}
          onLogout={async () => { await supabase.auth.signOut(); setView('home'); }}
        >
          <AppContent
            view={view}
            setView={setView}
            userProfile={userProfile}
            missions={missions}
            setShowMissionForm={setShowMissionForm}
            setShowRatingModal={setShowRatingModal}
            setShowProfileModal={setShowProfileModal}
            setShowPublicProfileModal={setShowPublicProfileId}
            onLogout={async () => { await supabase.auth.signOut(); setView('home'); }}
            fetchMissions={fetchMissions}
            createMission={createMission}
            updateMissionStatus={updateMissionStatus}
            assignMission={assignMission}
            rateMission={rateMission}
            currentUserId={user.id}
          />
        </Layout>

        {showMissionForm && <MissionForm onSubmit={createMission} onCancel={() => setShowMissionForm(false)} />}
        {showRatingModal && <RatingModal onSubmit={async (r: number, c?: string) => { await rateMission(showRatingModal.id, r, c); setShowRatingModal(null); }} onClose={() => setShowRatingModal(null)} />}

        {showProfileModal && userProfile && <ProfileModal userProfile={userProfile} onSave={async (d: Partial<UserProfile>) => { await supabase.from('users').update(d).eq('id', user.id); setUserProfile({...userProfile, ...d}); }} onClose={() => setShowProfileModal(false)} />}

        {showPublicProfileId && publicProfile && (
            <div className="fixed inset-0 z-[65] bg-black/50 flex items-center justify-center p-4">
                 <div className="relative w-full max-w-md pointer-events-auto">
                    <ProfileModal
                        userProfile={publicProfile}
                        onSave={() => {}}
                        onClose={() => setShowPublicProfileId(null)}
                        readOnly={true}
                    />
                 </div>
            </div>
        )}

        {activeChatMission && <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 pop-in"><div className="w-full max-w-md bg-white rounded-xl overflow-hidden relative"><button className="absolute top-2 right-2 text-white z-10" onClick={()=>setActiveChatMission(null)}><X/></button><ChatBox requestId={activeChatMission} currentUserId={user.id} /></div></div>}
      </div>
    </ErrorBoundary>
  );
}
