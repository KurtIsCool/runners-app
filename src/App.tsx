import { useState, useEffect, useCallback } from 'react';
import { Loader2, User, Plus, Bike, X } from 'lucide-react';
import { supabase } from './lib/supabase';
import { type UserRole, type UserProfile, type Request } from './types';
import { ILOILO_LAT, ILOILO_LNG } from './lib/constants';
import AppLogo from './components/AppLogo';
import ChatBox from './components/ChatBox';
import MobileBottomNav from './components/MobileBottomNav';
import DesktopSidebar from './components/DesktopSidebar';
import ProfileView from './components/ProfileView';
import RequestForm from './components/RequestForm';
import Marketplace from './components/Marketplace';
import RequestTracker from './components/RequestTracker';
import RunnerDashboard from './components/RunnerDashboard';
import ProfileModal from './components/ProfileModal';
import RatingModal from './components/RatingModal';
import AuthScreen from './components/AuthScreen';
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
  const [view, setView] = useState('home'); // 'home' | 'tracker' | 'dashboard' | 'profile'
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState<Request | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeChatRequest, setActiveChatRequest] = useState<string|null>(null);

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
          await supabase.from('users').insert({ id: user.id, name: user.email.split('@')[0], email: user.email, role: 'student' }); 
          window.location.reload(); 
      }
      setLoading(false);
    };
    if (user) fetchProfile();
  }, [user, view]);

  const fetchRequests = useCallback(async () => {
     const { data } = await supabase.from('requests').select('*').order('created_at', { ascending: false });
     if (data) setRequests(data);
  }, []);

  useEffect(() => {
    if (user) {
        // Calling async function inside useEffect without setState warning
        const load = async () => {
            await fetchRequests();
        };
        load();
    }
  }, [user, fetchRequests]);

  useEffect(() => {
    if (user) {
        const ch = supabase.channel('public:requests').on('postgres_changes', { event: '*', schema: 'public', table: 'requests' }, (p: RealtimePostgresChangesPayload<Request>) => {
            if (p.eventType === 'INSERT') setRequests(prev => [p.new, ...prev]);
            else if (p.eventType === 'UPDATE') setRequests(prev => prev.map(r => r.id === p.new.id ? p.new : r));
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

  // Type for request creation data, excluding auto-generated fields
  type RequestCreationData = Omit<Request, 'id' | 'student_id' | 'created_at' | 'status'> & { lat?: number; lng?: number };

  const createRequest = async (d: RequestCreationData) => {
    if (!user) return;
    const lat = d.lat || ILOILO_LAT;
    const lng = d.lng || ILOILO_LNG;

    // Explicitly define the object to insert
    const requestToInsert = {
        student_id: user.id,
        type: d.type,
        pickup_address: d.pickup_address,
        dropoff_address: d.dropoff_address,
        details: d.details,
        price_estimate: d.price_estimate,
        lat,
        lng,
        status: 'requested'
    };

    const { error } = await supabase.from('requests').insert(requestToInsert);
    if (!error) { setShowRequestForm(false); setView('tracker'); }
  };

  const handleSaveProfile = async (d: Partial<UserProfile>) => {
    if (!user) return;
    await supabase.from('users').update(d).eq('id', user.id);
    if (userProfile) {
        setUserProfile({...userProfile, ...d});
    }
  };

  const handleUpdateStatus = async (id: string, s: string) => {
     await supabase.from('requests').update({ status: s }).eq('id', id);
  }

  const handleClaim = async (id: string) => {
    if (!user) return;
    await supabase.from('requests').update({ runner_id: user.id, status: 'accepted' }).eq('id', id);
  }

  const handleRatingSubmit = async (r: number) => {
      if (showRatingModal) {
          await supabase.from('requests').update({ rating: r }).eq('id', showRatingModal.id);
          setShowRatingModal(null);
      }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600"/></div>;
  
  if (!user) return (
    <ErrorBoundary>
      <GlobalStyles />
      <AuthScreen onLogin={(e: string, p: string) => handleAuth('login', e, p)} onSignup={(e: string, p: string, r: UserRole) => handleAuth('signup', e, p, r)} />
    </ErrorBoundary>
  );

  return (
    <ErrorBoundary>
      <div className="font-sans text-gray-900 animate-scale-in desktop-layout">
        <GlobalStyles />
        
        {/* Desktop Sidebar (Only visible on MD+) */}
        <DesktopSidebar view={view} setView={setView} role={userProfile?.role} userProfile={userProfile || {name: 'User', role: 'student'}} onLogout={async () => { await supabase.auth.signOut(); setView('home'); }} />
        
        {/* Main Content Area */}
        <div className="flex-1 desktop-main bg-gray-50 min-h-screen flex flex-col relative">
          {/* Add Top Right Logo for Desktop */}
          <div className="hidden md:block absolute top-8 right-8 z-50 opacity-80 hover:opacity-100 transition-opacity cursor-pointer" onClick={() => setView('home')}>
              <AppLogo className="h-12" />
          </div>

          {/* Mobile Navbar (Hidden on Desktop) */}
          <div className="md:hidden">
            <nav className="bg-white/90 backdrop-blur-md border-b sticky top-0 z-40 shadow-sm">
               <div className="px-4 h-16 flex items-center justify-between">
                  {/* Profile on Left */}
                  <div onClick={() => setView('profile')} className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden cursor-pointer">
                     {userProfile?.avatar_url ? <img src={userProfile.avatar_url} className="w-full h-full object-cover"/> : <User className="p-1 text-gray-500"/>}
                  </div>
                  {/* Logo on Right */}
                  <div onClick={() => setView('home')} className="cursor-pointer"><AppLogo className="h-10"/></div>
               </div>
            </nav>
          </div>

          <main className="p-4 md:p-8 max-w-5xl w-full mx-auto flex-1 pb-24 md:pb-8">
            {view === 'home' && (
               userProfile?.role === 'student' ? (
                 <div className="space-y-8 animate-slide-up">
                   {/* Updated Home UI: Hero Card */}
                   <header className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 md:p-12 text-white shadow-xl relative overflow-hidden flex flex-col items-start justify-center min-h-[300px]">
                      <div className="relative z-10 max-w-xl">
                         <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">We run.<br/>You study.</h1>
                         <p className="text-blue-100 text-lg mb-8">Get food, print documents, or buy groceries without leaving your dorm.</p>
                         <button onClick={() => setShowRequestForm(true)} className="bg-white text-blue-600 px-8 py-4 rounded-xl font-bold text-lg btn-press flex items-center gap-3 hover:bg-gray-50 transition-colors shadow-lg">
                            <Plus size={24}/> Create New Request
                         </button>
                      </div>
                      <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-blob"></div>
                      <div className="absolute right-10 top-10 text-white/10 hidden md:block">
                         <Bike size={180} />
                      </div>
                   </header>
                   
                   {/* Category Buttons */}
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                     {['Food','Print','Shop','Drop'].map((t) => (
                       <button key={t} onClick={() => setShowRequestForm(true)} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover-lift text-center font-bold text-gray-700 btn-press transition-all hover:border-blue-200">
                         {t}
                       </button>
                     ))}
                   </div>
                 </div>
               ) : (
                 <Marketplace requests={requests} onClaim={async (id) => { await supabase.from('requests').update({ runner_id: user.id, status: 'accepted' }).eq('id', id); }} onUpdateStatus={async (id, s) => { await supabase.from('requests').update({ status: s }).eq('id', id); }} userId={user.id} onRefresh={fetchRequests} userProfile={userProfile!} />
               )
            )}

            {view === 'tracker' && <RequestTracker requests={requests.filter(r => r.student_id === user.id)} currentUserId={user.id} onRate={(req, r) => { if (r > 0) { supabase.from('requests').update({ rating: r }).eq('id', req.id); } else setShowRatingModal(req); }} />}
            {view === 'dashboard' && <div className="max-w-3xl mx-auto"><RunnerDashboard requests={requests} userId={user.id} /></div>}
            {view === 'profile' && <ProfileView userProfile={userProfile!} onEdit={() => setShowProfileModal(true)} onLogout={async () => { await supabase.auth.signOut(); setView('home'); }} />}
          </main>
        </div>

        {/* Mobile Bottom Nav (Hidden on Desktop) */}
        <MobileBottomNav view={view} setView={setView} role={userProfile?.role || 'student'} />

        {/* Modals & Overlays */}
        {showRequestForm && <RequestForm onSubmit={createRequest} onCancel={() => setShowRequestForm(false)} />}
        {showRatingModal && <RatingModal onSubmit={async (r: number) => { await supabase.from('requests').update({ rating: r }).eq('id', showRatingModal.id); setShowRatingModal(null); }} />}
        {showProfileModal && userProfile && <ProfileModal userProfile={userProfile} onSave={async (d: any) => { await supabase.from('users').update(d).eq('id', user.id); setUserProfile({...userProfile, ...d}); }} onClose={() => setShowProfileModal(false)} />}
        {activeChatRequest && <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 pop-in"><div className="w-full max-w-md bg-white rounded-xl overflow-hidden relative"><button className="absolute top-2 right-2 text-white z-10" onClick={()=>setActiveChatRequest(null)}><X/></button><ChatBox requestId={activeChatRequest} currentUserId={user.id} /></div></div>}
      </div>
    </ErrorBoundary>
  );
}
