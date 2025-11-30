import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  User, MapPin, Plus, Package, Clock, DollarSign, 
  CheckCircle, Loader2, Navigation, Star, X,
  LogOut, MessageCircle, Send, Settings, Phone,
  ChevronRight, AlertCircle, RefreshCw, Copy,
  ArrowRight, ShoppingBag, Bike, QrCode, BadgeCheck, Camera,
  Home, LayoutDashboard, UserCircle
} from 'lucide-react';

// --- Supabase Configuration ---
const SUPABASE_URL = 'https://fbjqzyyvaeqgrcavjvru.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZianF6eXl2YWVxZ3JjYXZqdnJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwNzE1MjgsImV4cCI6MjA3OTY0NzUyOH0.6MOL0HoWwFB1dCn_I5kAo79PVLA1JTCBxFfcqMZJF_A';

// Global Supabase client placeholder
let supabase: any = null;

declare global {
  interface Window {
    supabase: any;
  }
}

// --- Assets ---
const LOGO_URL = "Messenger_creation_4C44CD5D-7E79-4FF6-A824-D7FF2757FE1B.jpeg";

// --- Constants ---
const ILOILO_LANDMARKS = [
  { name: "UP Visayas (City)", lat: 10.6966, lng: 122.5676 },
  { name: "SM City Iloilo", lat: 10.7202, lng: 122.5621 },
  { name: "Central Philippine University", lat: 10.7288, lng: 122.5522 },
  { name: "Festive Walk Mall", lat: 10.7155, lng: 122.5477 },
  { name: "Robinsons Place Jaro", lat: 10.7187, lng: 122.5698 },
  { name: "West Visayas State U", lat: 10.7136, lng: 122.5629 },
];

const ILOILO_LAT = 10.7202;
const ILOILO_LNG = 122.5621;

// --- Utils ---
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 6371; 
  const dLat = (lat2 - lat1) * (Math.PI/180);
  const dLon = (lon2 - lon1) * (Math.PI/180);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * (Math.PI/180)) * Math.cos(lat2 * (Math.PI/180)) * Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c;
};

const copyToClipboard = (text: string) => {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  document.body.appendChild(textArea);
  textArea.select();
  try {
    document.execCommand('copy');
  } catch (err) {
    console.error('Fallback copy error', err);
  }
  document.body.removeChild(textArea);
};

const sendNotification = (title: string, body: string) => {
  if (window.Notification && Notification.permission === 'granted') {
    new Notification(title, { body, icon: LOGO_URL });
  }
};

// --- Types ---
type UserRole = 'student' | 'runner';
type RequestStatus = 'requested' | 'accepted' | 'purchasing' | 'delivering' | 'completed' | 'cancelled';

interface UserProfile {
  id: string; 
  name: string;
  phone: string;
  role: UserRole;
  rating?: number;
  is_verified?: boolean;
  school_id_url?: string;
  payment_qr_url?: string;
}

interface Request {
  id: string;
  student_id: string;
  runner_id?: string;
  type: string;
  pickup_address: string;
  dropoff_address: string;
  details: string;
  price_estimate: number;
  status: RequestStatus;
  rating?: number;
  created_at: string;
  lat?: number;
  lng?: number;
}

interface Message {
  id: string;
  request_id: string;
  sender_id: string;
  text: string;
  created_at: string;
}

// --- CSS Injection ---
const GlobalStyles = () => (
  <style dangerouslySetInnerHTML={{__html: `
    @keyframes float {
      0% { transform: translate(0px, 0px) scale(1); }
      33% { transform: translate(30px, -50px) scale(1.1); }
      66% { transform: translate(-20px, 20px) scale(0.9); }
      100% { transform: translate(0px, 0px) scale(1); }
    }
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes scaleIn {
      from { opacity: 0; transform: scale(0.9); }
      to { opacity: 1; transform: scale(1); }
    }
    .animate-blob { animation: float 10s infinite ease-in-out; }
    .animate-blob-delay { animation: float 12s infinite ease-in-out reverse; }
    .stagger-enter { animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
    .pop-in { animation: scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
    .hover-lift { transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease; }
    .hover-lift:hover { transform: translateY(-4px); box-shadow: 0 10px 20px -10px rgba(0,0,0,0.1); }
    .btn-press { transition: transform 0.1s ease; }
    .btn-press:active { transform: scale(0.95); }
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    /* Bottom Nav Safe Area */
    .pb-safe-nav { padding-bottom: calc(4rem + env(safe-area-inset-bottom)); }
  `}} />
);

// --- Components ---

const AppLogo = () => (
  <div className="flex items-center gap-2 select-none transition-transform hover:scale-105 duration-200 cursor-pointer">
    <img 
      src={LOGO_URL}
      alt="Runners Logo" 
      className="h-10 w-auto object-contain rounded-lg shadow-sm"
      onError={(e) => {
        (e.target as HTMLImageElement).style.display = 'none';
        (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
      }}
    />
    <span className="hidden text-2xl font-black italic tracking-tighter text-blue-900 uppercase" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>RUNNERS</span>
  </div>
);

// 1. Chat Component
const ChatBox = ({ requestId, currentUserId, embedded = false }: { requestId: string, currentUserId: string, embedded?: boolean }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!supabase) return;
    const fetchMessages = async () => {
      const { data } = await supabase.from('messages').select('*').eq('request_id', requestId).order('created_at', { ascending: true });
      if (data) setMessages(data);
    };
    fetchMessages();
    const channel = supabase.channel(`chat:${requestId}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `request_id=eq.${requestId}` }, (payload: any) => {
        setMessages(prev => [...prev, payload.new as Message]);
        if (payload.new.sender_id !== currentUserId) sendNotification("New Message", payload.new.text);
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [requestId, currentUserId]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !supabase) return;
    const tempMsg = { id: Math.random().toString(), request_id: requestId, sender_id: currentUserId, text: newMessage, created_at: new Date().toISOString() };
    setMessages(prev => [...prev, tempMsg]);
    setNewMessage('');
    await supabase.from('messages').insert({ request_id: requestId, sender_id: currentUserId, text: tempMsg.text });
  };

  return (
    <div className={`flex flex-col ${embedded ? 'h-full' : 'h-[500px]'} bg-gray-50`}>
      {!embedded && <div className="bg-blue-600 p-4 text-white font-bold flex items-center gap-2 shadow-md"><MessageCircle size={20} /> Chat</div>}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && <div className="text-center text-gray-400 mt-4 text-sm pop-in">Send a message to coordinate...</div>}
        {messages.map((msg, idx) => {
          const isMe = msg.sender_id === currentUserId;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} stagger-enter`} style={{animationDelay: `${idx * 0.05}s`}}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm shadow-sm ${isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'}`}>{msg.text}</div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSend} className="p-3 bg-white border-t flex gap-2">
        <input type="text" className="flex-1 bg-gray-100 border-0 rounded-full px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all focus:bg-white" placeholder="Type a message..." value={newMessage} onChange={e => setNewMessage(e.target.value)} />
        <button type="submit" disabled={!newMessage.trim()} className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 disabled:opacity-50 btn-press"><Send size={18} /></button>
      </form>
    </div>
  );
};

// 2. Bottom Navigation Bar (Mobile)
const BottomNav = ({ view, setView, role }: { view: string, setView: (v: string) => void, role: UserRole }) => {
  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: role === 'student' ? 'tracker' : 'dashboard', label: role === 'student' ? 'Activity' : 'Jobs', icon: role === 'student' ? Clock : LayoutDashboard },
    { id: 'profile', label: 'Profile', icon: UserCircle },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe-area px-6 py-3 flex justify-between items-center shadow-[0_-5px_20px_rgba(0,0,0,0.05)] z-50 md:hidden">
      {navItems.map((item) => {
        const isActive = view === item.id;
        const Icon = item.icon;
        return (
          <button 
            key={item.id} 
            onClick={() => setView(item.id)}
            className={`flex flex-col items-center gap-1 transition-all duration-300 btn-press ${isActive ? 'text-blue-600 -translate-y-1' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <div className={`p-1 rounded-xl transition-colors ${isActive ? 'bg-blue-50' : 'bg-transparent'}`}>
               <Icon size={24} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'fill-blue-100' : ''} />
            </div>
            <span className="text-[10px] font-bold">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};

// 3. Top Navigation Bar (Desktop + Logo)
const NavBar = ({ userProfile, setView }: any) => {
  // Desktop Nav Logic can remain simple since we prioritize mobile bottom nav
  return (
    <nav className="bg-white/90 backdrop-blur-md border-b sticky top-0 z-40 shadow-sm">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center cursor-pointer gap-2" onClick={() => setView('home')}><AppLogo /></div>
          
          {/* Desktop Links (Hidden on Mobile) */}
          <div className="hidden md:flex items-center space-x-6">
            {userProfile && (
              <>
                <button onClick={() => setView('home')} className="text-gray-600 hover:text-blue-600 font-medium transition-colors">Home</button>
                <button onClick={() => setView(userProfile.role === 'student' ? 'tracker' : 'dashboard')} className="text-gray-600 hover:text-blue-600 font-medium transition-colors">{userProfile.role === 'student' ? 'My Requests' : 'Dashboard'}</button>
                <div className="h-6 w-px bg-gray-200"></div>
                <button onClick={() => setView('profile')} className="flex items-center gap-2 text-gray-800 font-bold hover:text-blue-600 transition-colors">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600"><User size={16}/></div>
                  <span>{userProfile.name}</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

// 4. Profile View (New Feature)
const ProfileView = ({ userProfile, onEdit, onLogout }: { userProfile: UserProfile, onEdit: () => void, onLogout: () => void }) => {
  return (
    <div className="p-4 pb-24 animate-slide-up max-w-xl mx-auto">
       <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white text-center relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-full bg-white/5 backdrop-blur-sm"></div>
             <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl animate-blob"></div>
             
             <div className="relative z-10 flex flex-col items-center">
               <div className="w-24 h-24 bg-white rounded-full p-1 shadow-xl mb-4">
                  <div className="w-full h-full bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                    <User size={40} />
                  </div>
               </div>
               <h1 className="text-2xl font-bold flex items-center gap-2">
                 {userProfile.name}
                 {userProfile.is_verified && <BadgeCheck className="text-blue-200 fill-blue-500" size={24}/>}
               </h1>
               <p className="text-blue-100 uppercase text-xs font-bold tracking-widest mt-1">{userProfile.role}</p>
             </div>
          </div>

          <div className="p-6">
             <div className="flex justify-between items-center py-3 border-b border-gray-50">
                <span className="text-gray-500 text-sm">Phone Number</span>
                <span className="font-medium">{userProfile.phone || 'Not set'}</span>
             </div>
             <div className="flex justify-between items-center py-3 border-b border-gray-50">
                <span className="text-gray-500 text-sm">Status</span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${userProfile.is_verified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                   {userProfile.is_verified ? 'Verified' : 'Pending Verification'}
                </span>
             </div>
             {userProfile.role === 'runner' && (
               <div className="flex justify-between items-center py-3 border-b border-gray-50">
                  <span className="text-gray-500 text-sm">Payment Method</span>
                  <span className="flex items-center gap-1 text-sm font-medium text-blue-600">
                     <QrCode size={14}/> {userProfile.payment_qr_url ? 'GCash Linked' : 'No QR'}
                  </span>
               </div>
             )}
          </div>
       </div>

       <div className="grid grid-cols-1 gap-3">
          <button onClick={onEdit} className="w-full bg-white border border-gray-200 p-4 rounded-2xl flex items-center justify-between hover:bg-gray-50 btn-press shadow-sm">
             <div className="flex items-center gap-3">
               <div className="bg-blue-50 p-2 rounded-full text-blue-600"><Settings size={20}/></div>
               <span className="font-bold text-gray-700">Edit Profile Details</span>
             </div>
             <ChevronRight size={20} className="text-gray-400"/>
          </button>

          <button onClick={onLogout} className="w-full bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center justify-between hover:bg-red-100 btn-press shadow-sm text-red-600 mt-4">
             <div className="flex items-center gap-3">
               <div className="bg-red-100 p-2 rounded-full"><LogOut size={20}/></div>
               <span className="font-bold">Sign Out</span>
             </div>
          </button>
       </div>

       <div className="text-center mt-8 text-xs text-gray-400">
          Runners App v2.0 • Iloilo City
       </div>
    </div>
  );
}

// 5. Request Form
const RequestForm = ({ onSubmit, onCancel }: any) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ type: 'food', pickup_address: '', dropoff_address: '', details: '', price_estimate: 50, lat: 0, lng: 0 });
  const handleLocationPreset = (l: any) => { setFormData({ ...formData, pickup_address: l.name, lat: l.lat, lng: l.lng }); };
  const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); setLoading(true); await onSubmit(formData); setLoading(false); };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm pop-in">
      <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 flex justify-between items-center text-white">
          <div><h3 className="font-bold text-xl">New Errand</h3><p className="text-blue-100 text-sm">Fill in the details below</p></div>
          <button onClick={onCancel} className="bg-white/20 p-2 rounded-full hover:bg-white/30 transition-transform hover:rotate-90"><X size={20}/></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div><label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Errand Type</label><div className="grid grid-cols-2 gap-2">{['food', 'printing', 'groceries', 'transport'].map(type => (<button key={type} type="button" onClick={() => setFormData({...formData, type})} className={`p-3 rounded-lg border text-sm font-medium capitalize transition-all btn-press ${formData.type === type ? 'border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500' : 'border-gray-200 text-gray-600 hover:border-blue-200 hover:bg-gray-50'}`}>{type}</button>))}</div></div>
          <div className="space-y-4">
            <div><label className="block text-xs font-bold uppercase text-gray-500 mb-1">Pickup Location</label><div className="relative"><MapPin size={18} className="absolute left-3 top-3 text-red-500" /><input required type="text" placeholder="e.g. Jollibee" className="w-full pl-10 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all hover:border-gray-400" value={formData.pickup_address} onChange={(e) => setFormData({...formData, pickup_address: e.target.value})}/></div><div className="flex gap-2 mt-2 overflow-x-auto pb-1 no-scrollbar">{ILOILO_LANDMARKS.map((l, i) => (<button key={l.name} type="button" style={{animationDelay: `${i*50}ms`}} onClick={() => handleLocationPreset(l)} className="stagger-enter text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded border border-blue-100 whitespace-nowrap hover:bg-blue-100 btn-press">{l.name}</button>))}</div></div>
            <div className="relative"><Navigation size={18} className="absolute left-3 top-3 text-green-500" /><input required type="text" placeholder="Dropoff Location (e.g. Dorm)" className="w-full pl-10 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all hover:border-gray-400" value={formData.dropoff_address} onChange={(e) => setFormData({...formData, dropoff_address: e.target.value})}/></div>
          </div>
          <div><label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Details</label><textarea required rows={3} placeholder="What specifically do you need?" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all hover:border-gray-400" value={formData.details} onChange={(e) => setFormData({...formData, details: e.target.value})}/></div>
          <div className="bg-blue-50 p-4 rounded-xl flex items-center justify-between border border-blue-100"><div><span className="block text-sm font-bold text-blue-900">Offer Price</span><span className="text-xs text-blue-600">Include item cost + fee</span></div><div className="flex items-center gap-1 bg-white px-3 py-1 rounded-lg border border-blue-200 shadow-sm"><span className="text-gray-500 font-bold">₱</span><input type="number" className="w-20 p-1 text-right font-bold text-xl text-gray-900 outline-none" value={formData.price_estimate} onChange={(e) => setFormData({...formData, price_estimate: Number(e.target.value)})}/></div></div>
          <button type="submit" disabled={loading} className="w-full bg-black text-white font-bold py-4 rounded-xl hover:bg-gray-800 transition-all btn-press shadow-lg hover:shadow-xl">{loading ? <Loader2 className="animate-spin" /> : 'Post Request'}</button>
        </form>
      </div>
    </div>
  );
};

// 6. Active Job View (Mission Control)
const ActiveJobView = ({ job, userId, onUpdateStatus, userProfile }: { job: Request, userId: string, onUpdateStatus: (id: string, status: RequestStatus) => void, userProfile: UserProfile }) => {
  const [updating, setUpdating] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const handleStatusUpdate = async (status: RequestStatus) => { setUpdating(true); try { await onUpdateStatus(job.id, status); } catch (e) { alert("Failed to update status."); } finally { setUpdating(false); } };

  return (
    <div className="fixed inset-0 bg-gray-100 z-50 flex flex-col md:flex-row pop-in">
      <div className="w-full md:w-1/2 lg:w-1/3 bg-white flex flex-col border-r shadow-xl z-10">
        <div className="bg-blue-900 text-white p-6 pb-8 relative overflow-hidden">
           <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-2xl animate-blob"></div>
           <div className="relative z-10">
             <div className="flex justify-between items-center mb-2"><span className="bg-blue-800 text-xs font-bold px-2 py-1 rounded uppercase tracking-widest animate-pulse">Active Mission</span><div className="font-bold text-2xl">₱{job.price_estimate}</div></div>
             <h2 className="text-2xl font-bold capitalize mb-1">{job.type}</h2>
             <div className="flex items-center gap-2 text-blue-200 text-sm"><span>ID: {job.id.slice(0,8)}</span><button onClick={() => setShowPayment(true)} className="ml-2 flex items-center gap-1 bg-blue-800 hover:bg-blue-700 px-2 py-0.5 rounded text-xs text-white btn-press"><QrCode size={12} /> GCash</button></div>
           </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
           <div className="bg-gray-50 rounded-xl p-4 border">
              <div className="text-xs font-bold text-gray-500 uppercase mb-4 tracking-wide">Current Status</div>
              <div className="flex items-center justify-between relative">
                 <div className="absolute top-3 left-0 w-full h-0.5 bg-gray-200 -z-10"></div>
                 {[{s: 'accepted', icon: CheckCircle, label: 'Accepted'},{s: 'purchasing', icon: ShoppingBag, label: 'Buying'},{s: 'delivering', icon: Bike, label: 'Delivery'},{s: 'completed', icon: Star, label: 'Done'}].map((step, idx) => {
                    const isActive = step.s === job.status;
                    const isPast = ['accepted', 'purchasing', 'delivering', 'completed'].indexOf(job.status) >= idx;
                    const Icon = step.icon;
                    return (
                      <div key={step.s} className="flex flex-col items-center bg-gray-50 px-1">
                         <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${isActive ? 'bg-blue-600 border-blue-600 text-white scale-125 shadow-lg' : isPast ? 'bg-blue-100 border-blue-600 text-blue-600' : 'bg-white border-gray-300 text-gray-300'}`}><Icon size={14} /></div>
                         <span className={`text-[10px] mt-1 font-bold ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>{step.label}</span>
                      </div>
                    )
                 })}
              </div>
           </div>
           <div className="space-y-4 stagger-enter">
              <div className="flex gap-3"><div className="mt-1"><MapPin className="text-red-500" size={20}/></div><div><div className="text-xs font-bold text-gray-500 uppercase">Pickup</div><div className="font-medium text-lg text-gray-900">{job.pickup_address}</div></div></div>
              <div className="flex gap-3"><div className="mt-1"><Navigation className="text-green-500" size={20}/></div><div><div className="text-xs font-bold text-gray-500 uppercase">Dropoff</div><div className="font-medium text-lg text-gray-900">{job.dropoff_address}</div></div></div>
           </div>
           <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 stagger-enter"><div className="text-xs font-bold text-blue-500 uppercase mb-1">Instructions</div><p className="text-gray-800">{job.details}</p></div>
        </div>
        <div className="p-4 border-t bg-white pb-safe-nav">
           {job.status === 'accepted' && <button disabled={updating} onClick={() => handleStatusUpdate('purchasing')} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 flex items-center justify-center gap-2 btn-press">{updating ? <Loader2 className="animate-spin"/> : <>Start Purchasing <ArrowRight/></>}</button>}
           {job.status === 'purchasing' && <button disabled={updating} onClick={() => handleStatusUpdate('delivering')} className="w-full bg-purple-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-purple-700 flex items-center justify-center gap-2 btn-press">{updating ? <Loader2 className="animate-spin"/> : <>Start Delivering <Bike/></>}</button>}
           {job.status === 'delivering' && <button disabled={updating} onClick={() => handleStatusUpdate('completed')} className="w-full bg-green-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-green-700 flex items-center justify-center gap-2 btn-press">{updating ? <Loader2 className="animate-spin"/> : <>Mark Completed <CheckCircle/></>}</button>}
        </div>
      </div>
      <div className="flex-1 flex flex-col h-[50vh] md:h-full border-t md:border-t-0 md:border-l">
         <div className="bg-white p-4 border-b flex items-center gap-2 shadow-sm z-10"><div className="bg-green-100 p-2 rounded-full"><MessageCircle className="text-green-600" size={18}/></div><div><div className="font-bold text-gray-900">Direct Chat</div><div className="text-xs text-gray-500">Communicate with student</div></div></div>
         <div className="flex-1 relative"><div className="absolute inset-0"><ChatBox requestId={job.id} currentUserId={userId} embedded={true} /></div></div>
      </div>
      {showPayment && (
        <div className="absolute inset-0 bg-black/80 z-[60] flex items-center justify-center p-6 pop-in">
           <div className="bg-white p-6 rounded-2xl w-full max-w-sm text-center">
              <h3 className="font-bold text-xl mb-2">Scan to Pay</h3>
              <div className="bg-gray-100 w-full aspect-square rounded-lg flex items-center justify-center mb-4 overflow-hidden">
                 {userProfile.payment_qr_url ? <img src={userProfile.payment_qr_url} alt="GCash QR" className="w-full h-full object-contain" /> : <div className="text-center"><QrCode size={64} className="text-gray-400 mx-auto mb-2"/><span className="text-xs text-gray-400">No QR Uploaded</span></div>}
              </div>
              <p className="text-xs text-gray-400 mb-4">Amount: ₱{job.price_estimate}</p>
              <button onClick={() => setShowPayment(false)} className="w-full bg-gray-200 py-3 rounded-lg font-bold hover:bg-gray-300 btn-press">Close</button>
           </div>
        </div>
      )}
    </div>
  );
};

// 7. Marketplace (Runner List)
const Marketplace = ({ requests, onClaim, onUpdateStatus, userId, onRefresh, userProfile }: { requests: Request[], onClaim: (id: string) => void, onUpdateStatus: (id: string, status: RequestStatus) => void, userId: string, onRefresh: () => void, userProfile: UserProfile }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const handleRefresh = async () => { setIsRefreshing(true); await onRefresh(); setTimeout(() => setIsRefreshing(false), 500); };

  const myActiveJob = requests.find(r => r.runner_id === userId && r.status !== 'completed' && r.status !== 'cancelled');
  if (myActiveJob) return <ActiveJobView job={myActiveJob} userId={userId} onUpdateStatus={onUpdateStatus} userProfile={userProfile} />;

  const openRequests = requests.filter(r => r.status === 'requested').map(r => ({ ...r, dist: r.lat && r.lng ? calculateDistance(ILOILO_LAT, ILOILO_LNG, r.lat, r.lng) : 0.5 }));

  return (
    <div className="space-y-6 pb-24 animate-slide-up">
      <div className="flex justify-between items-center mb-4"><div><h2 className="text-2xl font-bold text-gray-900">Job Board</h2><p className="text-gray-500 text-sm">Accept a job to start working</p></div><button onClick={handleRefresh} disabled={isRefreshing} className="bg-white border p-2 rounded-full shadow-sm hover:bg-gray-50 transition-all btn-press"><RefreshCw size={18} className={`text-gray-600 ${isRefreshing ? 'animate-spin' : ''}`}/></button></div>
      {openRequests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-gray-300 pop-in"><div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mb-4"><Navigation className="text-gray-400" size={32} /></div><div className="text-gray-900 font-bold text-lg">No jobs available</div><p className="text-gray-500">Wait for students to post...</p></div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {openRequests.map((req, i) => (
            <div key={req.id} style={{animationDelay: `${i*100}ms`}} className="stagger-enter bg-white rounded-2xl shadow-sm border border-gray-100 hover-lift transition-all duration-200 p-5 group">
              <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-bl-xl">{req.dist.toFixed(1)} km</div>
              <div className="flex items-start justify-between mb-4"><div className="flex items-center gap-3"><div className="bg-blue-50 p-3 rounded-xl text-2xl">{req.type === 'food' ? '🍔' : req.type === 'printing' ? '🖨️' : '📦'}</div><div><h3 className="font-bold text-lg text-gray-900 capitalize">{req.type}</h3><span className="text-xs text-gray-500">{new Date(req.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span></div></div><div className="font-bold text-xl text-green-600 mt-6">₱{req.price_estimate}</div></div>
              <div className="space-y-2 mb-6 border-l-2 border-gray-100 pl-3"><div className="text-sm text-gray-600 truncate"><span className="font-bold text-xs uppercase text-gray-400 mr-2">From</span> {req.pickup_address}</div><div className="text-sm text-gray-600 truncate"><span className="font-bold text-xs uppercase text-gray-400 mr-2">To</span> {req.dropoff_address}</div></div>
              <button onClick={() => onClaim(req.id)} className="w-full bg-black text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors flex justify-center items-center gap-2 btn-press">Accept Job <ArrowRight size={16}/></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// 8. Request Tracker (Student)
const RequestTracker = ({ requests, currentUserId, onRate }: { requests: Request[], currentUserId: string, onRate: (req: Request, rating: number) => void }) => {
  const [chatRequestId, setChatRequestId] = useState<string | null>(null);
  const getStatusBadge = (status: RequestStatus) => {
    const config = { requested: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Waiting' }, accepted: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle, label: 'Assigned' }, purchasing: { color: 'bg-purple-100 text-purple-800', icon: DollarSign, label: 'Buying' }, delivering: { color: 'bg-orange-100 text-orange-800', icon: Navigation, label: 'On the Way' }, completed: { color: 'bg-green-100 text-green-800', icon: Star, label: 'Completed' }, cancelled: { color: 'bg-red-100 text-red-800', icon: X, label: 'Cancelled' } }[status] || { color: 'bg-gray-100', icon: Clock, label: status };
    const Icon = config.icon;
    return <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${config.color}`}><Icon size={14} />{config.label}</div>;
  };

  const activeRequests = requests.filter(r => r.status !== 'cancelled' && r.status !== 'completed');
  const pastRequests = requests.filter(r => r.status === 'completed' || r.status === 'cancelled').sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <div className="space-y-6 pb-24 animate-slide-up">
      <div className="flex justify-between items-end"><h2 className="text-2xl font-bold text-gray-900">Track Errands</h2></div>
      {activeRequests.length === 0 && <div className="bg-white p-12 rounded-2xl border-dashed border-2 border-gray-200 text-center pop-in"><div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"><Package className="text-gray-300" size={40} /></div><h3 className="font-bold text-gray-900 mb-1">No active errands</h3><p className="text-gray-500">Create a request to get started!</p></div>}
      {activeRequests.map((req, i) => (
        <div key={req.id} style={{animationDelay: `${i*100}ms`}} className="stagger-enter bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover-lift">
          <div className="p-6">
            <div className="flex justify-between items-start mb-4"><div className="flex flex-col"><div className="flex items-center gap-2"><h3 className="font-bold text-xl capitalize text-gray-900 mb-1">{req.type} Errand</h3><button onClick={() => copyToClipboard(req.id)} className="text-gray-400 hover:text-blue-600 p-1"><Copy size={14}/></button></div><div className="text-gray-500 text-sm">{new Date(req.created_at).toLocaleString()}</div></div>{getStatusBadge(req.status)}</div>
            <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-3"><div className="flex gap-3"><div className="mt-1"><MapPin size={16} className="text-red-500"/></div><div><div className="text-xs font-bold text-gray-500 uppercase">Pickup</div><div className="text-sm font-medium">{req.pickup_address}</div></div></div><div className="flex gap-3"><div className="mt-1"><Navigation size={16} className="text-green-500"/></div><div><div className="text-xs font-bold text-gray-500 uppercase">Dropoff</div><div className="text-sm font-medium">{req.dropoff_address}</div></div></div><div className="pt-2 mt-2 border-t border-gray-200"><div className="text-xs font-bold text-gray-500 uppercase mb-1">Details</div><p className="text-sm text-gray-700">{req.details}</p></div></div>
            <div className="flex justify-between items-center"><div className="text-2xl font-bold text-gray-900">₱{req.price_estimate}</div>{req.status !== 'requested' && (<div className="flex gap-2"><button onClick={() => setChatRequestId(req.id)} className="flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-lg font-bold text-sm hover:bg-blue-200 btn-press"><MessageCircle size={18} /> Chat</button><button className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-bold text-sm hover:bg-gray-200 btn-press"><Phone size={18} /> Call</button></div>)}</div>
          </div>
          <div className="h-1.5 bg-gray-100 w-full"><div className={`h-full transition-all duration-1000 ${req.status === 'requested' ? 'w-1/5 bg-yellow-400' : req.status === 'accepted' ? 'w-2/5 bg-blue-500' : req.status === 'purchasing' ? 'w-3/5 bg-purple-500' : req.status === 'delivering' ? 'w-4/5 bg-orange-500' : 'w-full bg-green-500'}`} /></div>
        </div>
      ))}
      {pastRequests.length > 0 && <div className="pt-8 border-t stagger-enter" style={{animationDelay: '200ms'}}><h3 className="text-lg font-bold text-gray-600 mb-4">Past Errands</h3><div className="space-y-4">{pastRequests.map((req, i) => (<div key={req.id} style={{animationDelay: `${i*50}ms`}} className="stagger-enter bg-gray-50 rounded-xl p-4 flex justify-between items-center hover:bg-gray-100 transition-colors hover-lift"><div><div className="flex items-center gap-2"><span className="font-bold capitalize text-gray-900">{req.type}</span>{req.rating && <span className="flex items-center text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded font-bold"><Star size={10} className="fill-yellow-600 text-yellow-600 mr-1"/> {req.rating}</span>}</div><span className="text-gray-500 text-xs">{new Date(req.created_at).toLocaleDateString()}</span></div>{!req.rating && req.status === 'completed' ? <button onClick={() => onRate(req, 0)} className="text-xs bg-black text-white px-3 py-1.5 rounded-lg font-bold hover:bg-gray-800 btn-press">Rate Now</button> : <div className="text-sm font-medium text-green-700 bg-green-100 px-2 py-1 rounded">{req.status === 'cancelled' ? 'Cancelled' : 'Done'}</div>}</div>))}</div></div>}
      {chatRequestId && (<div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 pop-in"><div className="w-full max-w-md bg-white rounded-xl overflow-hidden relative"><button className="absolute top-2 right-2 text-white z-10" onClick={()=>setChatRequestId(null)}><X/></button><ChatBox requestId={chatRequestId} currentUserId={currentUserId} /></div></div>)}
    </div>
  );
};

// 9. Runner Dashboard (History)
const RunnerDashboard = ({ requests, userId }: { requests: Request[], userId: string }) => {
  const completed = requests.filter(r => r.runner_id === userId && r.status === 'completed');
  const earnings = completed.reduce((sum, r) => sum + (r.price_estimate || 0), 0);
  const ratedJobs = completed.filter(r => r.rating);
  const avgRating = ratedJobs.length > 0 ? (ratedJobs.reduce((sum, r) => sum + (r.rating || 0), 0) / ratedJobs.length).toFixed(1) : 'New';

  return (
    <div className="space-y-6 pb-24 animate-slide-up">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-800 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden group hover-lift"><div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl animate-blob"></div><p className="text-blue-200 text-xs font-bold uppercase tracking-wider mb-1">Total Earnings</p><h3 className="text-3xl font-bold tracking-tight">₱{earnings.toFixed(2)}</h3></div>
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col justify-center hover-lift"><div className="flex items-center gap-2 mb-1"><Star className="text-yellow-400 fill-yellow-400" size={16} /><p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Rating</p></div><h3 className="text-3xl font-bold text-gray-900">{avgRating}</h3></div>
      </div>
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden stagger-enter" style={{animationDelay: '0.1s'}}>
        <div className="p-6 border-b border-gray-50 flex justify-between items-center"><h3 className="font-bold text-gray-800 text-lg">Work History</h3><span className="text-xs font-medium text-gray-400">{completed.length} Jobs</span></div>
        {completed.length === 0 ? <div className="p-12 text-center text-gray-500"><div className="bg-gray-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"><CheckCircle className="text-gray-300" /></div>No completed tasks yet.</div> : <div className="divide-y divide-gray-50">{completed.map((job, i) => (<div key={job.id} style={{animationDelay: `${i*50}ms`}} className="stagger-enter p-5 flex justify-between items-center hover:bg-gray-50 transition"><div><div className="flex items-center gap-2 mb-1"><p className="font-bold text-gray-900 capitalize">{job.type}</p>{job.rating && <span className="flex items-center text-[10px] bg-yellow-50 text-yellow-700 px-1.5 rounded font-bold border border-yellow-100">{job.rating} <Star size={8} className="ml-0.5 fill-yellow-500 text-yellow-500"/></span>}</div><p className="text-xs text-gray-500">{new Date(job.created_at).toLocaleDateString()}</p></div><span className="font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg text-sm">+₱{job.price_estimate}</span></div>))}</div>}
      </div>
    </div>
  );
};

// 10. Profile Modal & Rating Modal (re-use existing ones)
const ProfileModal = ({ userProfile, onSave, onClose }: any) => {
  const [name, setName] = useState(userProfile.name); const [phone, setPhone] = useState(userProfile.phone); const [uploading, setUploading] = useState(false);
  const handleFileUpload = async (e: any, type: string) => {
    if (!e.target.files.length) return;
    setUploading(true);
    const file = e.target.files[0]; const filePath = `${userProfile.id}/${type}_${Date.now()}.${file.name.split('.').pop()}`;
    try { await supabase.storage.from('runners-assets').upload(filePath, file); const { data } = supabase.storage.from('runners-assets').getPublicUrl(filePath); onSave(type === 'id' ? { school_id_url: data.publicUrl, is_verified: true } : { payment_qr_url: data.publicUrl }); alert('Uploaded!'); } catch (e) { alert('Upload failed'); } finally { setUploading(false); }
  };
  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm pop-in">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6">
        <h2 className="text-xl font-bold mb-4">Edit Profile</h2>
        <form onSubmit={(e) => { e.preventDefault(); onSave({ name, phone }); onClose(); }} className="space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Name</label><input className="w-full p-2 border rounded-lg" value={name} onChange={e => setName(e.target.value)} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone</label><input className="w-full p-2 border rounded-lg" value={phone} onChange={e => setPhone(e.target.value)} /></div>
          <div className="p-3 bg-gray-50 rounded-lg border border-dashed border-gray-300 space-y-3"><label className="flex items-center gap-2 text-sm text-blue-600 cursor-pointer">{uploading ? <Loader2 size={14} className="animate-spin"/> : <Camera size={14}/>} Upload School ID <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'id')} /></label>{userProfile.role === 'runner' && <label className="flex items-center gap-2 text-sm text-green-600 cursor-pointer">{uploading ? <Loader2 size={14} className="animate-spin"/> : <QrCode size={14}/>} Upload GCash QR <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'qr')} /></label>}</div>
          <button type="submit" className="w-full bg-blue-600 text-white font-bold py-2 rounded-lg btn-press">Save</button>
        </form>
      </div>
    </div>
  );
};
const RatingModal = ({ onSubmit }: any) => {
  const [rating, setRating] = useState(0);
  return (<div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 pop-in"><div className="bg-white rounded-2xl p-8 text-center w-full max-w-sm"><h2 className="text-2xl font-bold mb-4">Rate Runner</h2><div className="flex justify-center gap-2 mb-6">{[1,2,3,4,5].map(s => <button key={s} onClick={() => setRating(s)}><Star size={32} className={s <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} /></button>)}</div><button onClick={() => onSubmit(rating)} disabled={rating === 0} className="w-full bg-black text-white py-3 rounded-xl font-bold btn-press">Submit</button></div></div>);
};

// 11. Auth Screen
const AuthScreen = ({ onLogin, onSignup }: any) => {
  const [isLogin, setIsLogin] = useState(true); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [role, setRole] = useState<UserRole>('student'); const [loading, setLoading] = useState(false); const [error, setError] = useState('');
  const handleSubmit = async (e: any) => { e.preventDefault(); setError(''); setLoading(true); try { if (isLogin) await onLogin(email, password); else await onSignup(email, password, role); } catch (e: any) { setError(e.message); } finally { setLoading(false); } };
  return (
    <div className="min-h-screen bg-white flex flex-col justify-center items-center p-6 overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-100 rounded-full blur-3xl animate-blob"></div>
      <div className="mb-8 text-center z-10 pop-in"><div className="w-20 h-20 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl rotate-3 mb-4 mx-auto"><span className="text-4xl font-black text-white italic">R</span></div><h1 className="text-5xl font-black text-gray-900 tracking-tighter">Runners.</h1></div>
      <div className="w-full max-w-md bg-white border border-gray-100 shadow-2xl rounded-3xl p-8 z-10 stagger-enter">
         <div className="flex gap-4 mb-6 border-b pb-4"><button onClick={() => setIsLogin(true)} className={`flex-1 pb-2 font-bold text-sm ${isLogin ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400'}`}>Log In</button><button onClick={() => setIsLogin(false)} className={`flex-1 pb-2 font-bold text-sm ${!isLogin ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400'}`}>Sign Up</button></div>
         {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 flex items-center gap-2"><AlertCircle size={16}/> {error}</div>}
         <form onSubmit={handleSubmit} className="space-y-4">
           <div><label className="block text-xs font-bold uppercase text-gray-500 mb-1">Email</label><input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-3 bg-gray-50 border rounded-xl"/></div>
           <div><label className="block text-xs font-bold uppercase text-gray-500 mb-1">Password</label><input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-3 bg-gray-50 border rounded-xl"/></div>
           {!isLogin && <div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => setRole('student')} className={`p-3 rounded-xl border font-bold text-sm ${role === 'student' ? 'bg-blue-50 text-blue-700' : 'border-gray-200'}`}>Student</button><button type="button" onClick={() => setRole('runner')} className={`p-3 rounded-xl border font-bold text-sm ${role === 'runner' ? 'bg-green-50 text-green-700' : 'border-gray-200'}`}>Runner</button></div>}
           <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 btn-press">{loading ? <Loader2 className="animate-spin mx-auto"/> : (isLogin ? 'Welcome Back' : 'Create Account')}</button>
         </form>
      </div>
    </div>
  );
};


// --- Main App ---

export default function App() {
  const [isSupabaseReady, setIsSupabaseReady] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [view, setView] = useState('home'); // 'home' | 'tracker' | 'dashboard' | 'profile'
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState<Request | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeChatRequest, setActiveChatRequest] = useState<string|null>(null);

  // Initialize Supabase with Script Injection to ensure compatibility
  // in this preview environment. 
  useEffect(() => {
    if (window.Notification && Notification.permission !== 'granted') Notification.requestPermission();
    
    const initSupabase = () => {
      if (window.supabase) { 
        // @ts-ignore
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: true, autoRefreshToken: true } }); 
        setIsSupabaseReady(true); 
      }
    };

    if (window.supabase) {
      initSupabase();
    } else {
      const script = document.createElement('script'); 
      script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js"; 
      script.async = true;
      script.onload = initSupabase; 
      document.body.appendChild(script);
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseReady || !supabase) return;
    supabase.auth.getSession().then(({ data: { session } }: any) => setUser(session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => { 
        setUser(session?.user ?? null); 
        if (!session?.user) { 
            setUserProfile(null); 
            setLoading(false); 
        } 
    });
    return () => subscription.unsubscribe();
  }, [isSupabaseReady]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user || !supabase) return;
      const { data, error } = await supabase.from('users').select('*').eq('id', user.id).single();
      if (data) { setUserProfile(data); if (view === 'home') setView('home'); } // Keep current view if set, else default
      else if (error?.code === 'PGRST116') { await supabase.from('users').insert({ id: user.id, name: user.email.split('@')[0], email: user.email, role: 'student' }); window.location.reload(); }
      setLoading(false);
    };
    if (user) fetchProfile();
  }, [user, isSupabaseReady]);

  const fetchRequests = useCallback(async () => {
     if (!supabase) return;
     const { data } = await supabase.from('requests').select('*').order('created_at', { ascending: false });
     if (data) setRequests(data);
  }, [isSupabaseReady]);

  useEffect(() => { if (user) { fetchRequests(); const ch = supabase.channel('public:requests').on('postgres_changes', { event: '*', schema: 'public', table: 'requests' }, (p: any) => { if (p.eventType === 'INSERT') setRequests(prev => [p.new, ...prev]); else if (p.eventType === 'UPDATE') setRequests(prev => prev.map(r => r.id === p.new.id ? p.new : r)); }).subscribe(); return () => supabase.removeChannel(ch); } }, [user, fetchRequests]);

  const handleAuth = async (type: 'login'|'signup', ...args: any[]) => {
    const { error, data } = await (type === 'login' ? supabase.auth.signInWithPassword({ email: args[0], password: args[1] }) : supabase.auth.signUp({ email: args[0], password: args[1], options: { data: { role: args[2] } } }));
    if (error) throw error;
    if (type === 'signup' && data.session) { await supabase.from('users').insert({ id: data.user.id, name: args[0].split('@')[0], email: args[0], role: args[2] }); }
  };

  const createRequest = async (d: any) => {
    const lat = d.lat || ILOILO_LAT; const lng = d.lng || ILOILO_LNG;
    const { error } = await supabase.from('requests').insert({ student_id: user.id, ...d, lat, lng, status: 'requested' });
    if (!error) { setShowRequestForm(false); setView('tracker'); }
  };

  // Prevent "White Screen": Wait for script to load before trying to render app logic
  if (!isSupabaseReady) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600"/></div>;

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600"/></div>;
  if (!user) return <><GlobalStyles /><AuthScreen onLogin={(e: string, p: string) => handleAuth('login', e, p)} onSignup={(e: string, p: string, r: UserRole) => handleAuth('signup', e, p, r)} /></>;
  if (!userProfile) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600"/></div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-24 font-sans text-gray-900 animate-scale-in">
      <GlobalStyles />
      <NavBar userProfile={userProfile} setView={setView} />
      
      <main className="pt-4 px-4 max-w-5xl mx-auto">
        {view === 'home' && (
           userProfile.role === 'student' ? (
             <div className="space-y-8 animate-slide-up">
               <header className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden"><div className="relative z-10"><h1 className="text-3xl font-bold mb-2">We run. You study.</h1><button onClick={() => setShowRequestForm(true)} className="bg-white text-blue-600 px-6 py-3 rounded-xl font-bold mt-4 btn-press flex items-center gap-2"><Plus size={20}/> Request Runner</button></div><div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-2xl animate-blob"></div></header>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{['Food','Print','Shop','Drop'].map((t) => <button key={t} onClick={() => setShowRequestForm(true)} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover-lift text-center font-bold text-gray-700 btn-press">{t}</button>)}</div>
             </div>
           ) : (
             <Marketplace requests={requests} onClaim={async (id) => { await supabase.from('requests').update({ runner_id: user.id, status: 'accepted' }).eq('id', id); }} onUpdateStatus={async (id, s) => { await supabase.from('requests').update({ status: s }).eq('id', id); }} userId={user.id} onRefresh={fetchRequests} userProfile={userProfile} />
           )
        )}

        {view === 'tracker' && <RequestTracker requests={requests.filter(r => r.student_id === user.id)} currentUserId={user.id} onRate={(req, r) => { if (r > 0) { supabase.from('requests').update({ rating: r }).eq('id', req.id); } else setShowRatingModal(req); }} />}
        {view === 'dashboard' && <div className="max-w-3xl mx-auto"><RunnerDashboard requests={requests} userId={user.id} /></div>}
        {view === 'profile' && <ProfileView userProfile={userProfile} onEdit={() => setShowProfileModal(true)} onLogout={async () => { await supabase.auth.signOut(); setView('home'); }} />}
      </main>

      <BottomNav view={view} setView={setView} role={userProfile.role} />

      {showRequestForm && <RequestForm onSubmit={createRequest} onCancel={() => setShowRequestForm(false)} />}
      {showRatingModal && <RatingModal onSubmit={async (r: number) => { await supabase.from('requests').update({ rating: r }).eq('id', showRatingModal.id); setShowRatingModal(null); }} />}
      {showProfileModal && <ProfileModal userProfile={userProfile} onSave={async (d: any) => { await supabase.from('users').update(d).eq('id', user.id); setUserProfile({...userProfile, ...d}); }} onClose={() => setShowProfileModal(false)} />}
      {activeChatRequest && <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 pop-in"><div className="w-full max-w-md bg-white rounded-xl overflow-hidden relative"><button className="absolute top-2 right-2 text-white z-10" onClick={()=>setActiveChatRequest(null)}><X/></button><ChatBox requestId={activeChatRequest} currentUserId={user.id} /></div></div>}
    </div>
  );
}