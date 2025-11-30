import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  User, MapPin, Plus, Package, Clock, DollarSign, 
  CheckCircle, Loader2, Navigation, Star, X,
  LogOut, MessageCircle, Send, Settings, Phone,
  ChevronRight, AlertCircle, RefreshCw, Copy,
  ArrowRight, ShoppingBag, Bike, QrCode, BadgeCheck, Camera,
  Home, LayoutDashboard, UserCircle, Minimize2, Image as ImageIcon,
  BookOpen, Mail, Lock
} from 'lucide-react';

// --- Supabase Configuration ---
const SUPABASE_URL = 'https://fbjqzyyvaeqgrcavjvru.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZianF6eXl2YWVxZ3JjYXZqdnJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwNzE1MjgsImV4cCI6MjA3OTY0NzUyOH0.6MOL0HoWwFB1dCn_I5kAo79PVLA1JTCBxFfcqMZJF_A';

// --- Global Variable Placeholder ---
let supabase: any = null;

declare global {
  interface Window {
    supabase: any;
  }
}

// --- Constants ---
const ILOILO_LAT = 10.7202;
const ILOILO_LNG = 122.5621;

// --- Utils ---
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
    new Notification(title, { body, icon: "https://cdn-icons-png.flaticon.com/512/75/75806.png" });
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
  avatar_url?: string;
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
    .stagger-enter { animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
    .pop-in { animation: scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
    .hover-lift { transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease; }
    .hover-lift:hover { transform: translateY(-4px); box-shadow: 0 10px 20px -10px rgba(0,0,0,0.1); }
    .btn-press { transition: transform 0.1s ease; }
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

// --- Components ---

// UPDATED: AppLogo now uses 'text-blue-600' to match the app theme
// and allows easier sizing via className
const AppLogo = ({ dark = false, className = "h-[200px]" }: { dark?: boolean, className?: string }) => (
  <div 
className={`absolute top10 ${dark ? 'text-white' : 'text-blue-600'} ${className}`}  >
    <svg 
      viewBox="0 -76 760 560" 
      xmlns="http://www.w3.org/2000/svg"
      className="fill-current w-100 h-full" 
      style={{ display: 'block' }}
    >
      <g>
        <path d="M 429.69 397.00 C424.63,397.53 419.46,397.97 418.19,397.98 C414.46,398.01 416.64,396.23 421.26,395.49 C426.71,394.61 442.60,386.90 449.30,381.88 C462.18,372.23 472.77,359.51 480.01,345.00 C481.79,341.42 486.61,333.41 490.71,327.18 C494.81,320.96 497.93,315.27 497.65,314.54 C496.85,312.44 490.20,307.76 489.04,308.47 C487.54,309.40 487.76,311.56 489.50,313.00 C491.61,314.75 491.37,317.33 488.61,322.78 C485.70,328.51 483.69,330.36 478.60,332.00 C474.45,333.34 466.21,332.17 461.10,329.53 C458.89,328.38 459.19,328.23 465.10,327.47 L 471.50 326.66 L 463.50 325.50 C454.37,324.18 449.89,322.47 445.25,318.56 C441.00,314.98 441.14,314.01 445.75,315.08 C447.81,315.56 453.55,315.92 458.50,315.87 C468.08,315.79 467.46,315.27 455.10,313.02 C447.37,311.62 439.37,308.72 434.84,305.68 C431.45,303.40 427.03,296.64 428.18,295.49 C428.52,295.14 430.54,295.73 432.65,296.80 C437.95,299.48 446.04,301.67 455.32,302.93 C469.58,304.88 469.69,304.11 455.67,300.47 C443.88,297.40 431.42,292.69 428.76,290.29 C426.10,287.88 423.33,282.27 422.43,277.47 L 421.69 273.52 L 425.09 276.12 C432.73,281.94 446.13,286.88 466.50,291.40 C492.68,297.20 497.93,299.09 510.59,307.22 C514.48,309.73 520.70,313.41 524.41,315.41 L 531.15 319.05 L 535.05 315.96 C537.19,314.27 541.41,310.15 544.43,306.81 C550.56,300.04 553.00,299.62 553.00,305.33 C553.00,307.64 551.73,310.60 549.04,314.56 C545.00,320.51 534.36,332.00 532.88,332.00 C532.43,332.00 528.41,330.67 523.96,329.04 L 515.86 326.09 L 512.82 329.55 C506.34,336.93 501.98,342.87 502.72,343.31 C503.15,343.56 505.08,344.08 507.00,344.46 C514.60,345.96 523.98,350.18 526.58,353.28 C530.39,357.81 529.54,363.28 524.32,367.80 C516.54,374.52 499.21,381.96 491.25,381.99 C487.69,382.00 487.13,380.97 489.60,378.92 C490.48,378.18 492.67,375.29 494.46,372.49 C497.12,368.33 498.52,367.16 502.11,366.10 C504.52,365.39 508.05,363.86 509.93,362.71 L 513.37 360.61 L 510.50 359.84 C508.92,359.42 504.00,358.79 499.57,358.43 L 491.50 357.79 L 484.28 366.15 C475.85,375.89 469.89,380.84 459.37,386.84 C448.46,393.06 440.19,395.89 429.69,397.00 ZM 623.26 463.00 L 619.45 482.50 L 610.63 483.00 C605.77,483.27 601.61,483.18 601.37,482.79 C601.12,482.39 601.59,479.47 602.41,476.29 C603.23,473.10 605.95,460.15 608.47,447.50 C610.98,434.85 613.54,422.32 614.14,419.66 L 615.24 414.82 L 634.87 415.18 C656.63,415.57 658.10,415.93 663.80,422.42 C666.93,425.99 668.98,431.38 668.99,436.07 C669.01,444.68 661.50,456.60 654.46,459.15 C652.56,459.84 651.00,460.77 651.00,461.22 C651.00,461.67 653.03,466.37 655.50,471.66 C657.97,476.96 660.00,481.79 660.00,482.40 C660.00,483.15 656.87,483.40 650.18,483.19 L 640.36 482.87 L 639.05 479.19 C638.33,477.16 636.48,472.69 634.93,469.25 L 632.13 463.00 ZM 281.96 477.75 L 280.80 483.00 L 262.91 483.00 L 263.56 479.25 C263.92,477.19 265.09,471.45 266.17,466.50 C267.25,461.55 269.90,448.95 272.06,438.50 C274.22,428.05 276.23,418.45 276.53,417.17 L 277.08 414.85 L 295.79 415.17 C312.69,415.47 314.89,415.71 318.50,417.66 C326.51,421.98 330.00,427.52 330.00,435.92 C330.00,445.41 324.70,454.55 317.09,458.15 C314.56,459.35 312.37,460.42 312.21,460.54 C312.05,460.66 312.59,462.27 313.42,464.13 C316.83,471.79 321.00,481.88 321.00,482.45 C321.00,482.79 316.64,482.94 311.31,482.79 L 301.62 482.50 L 293.78 463.00 L 285.20 463.00 L 284.16 467.75 C283.59,470.36 282.60,474.86 281.96,477.75 ZM 418.88 465.74 L 415.50 482.98 L 406.75 482.99 C406.20,482.99 405.68,483.00 405.19,483.00 C401.52,483.02 399.51,483.03 398.63,482.03 C397.55,480.82 398.15,478.11 399.47,472.10 C399.62,471.44 399.78,470.74 399.94,470.00 C403.04,455.80 409.04,427.87 410.35,421.50 L 411.58 415.50 L 419.71 415.21 L 427.83 414.92 L 437.16 432.95 C442.30,442.86 446.74,450.98 447.04,450.99 C447.55,451.00 448.73,446.07 453.09,425.67 C454.13,420.81 455.24,416.42 455.55,415.92 C455.86,415.41 459.94,415.00 464.62,415.00 L 473.12 415.00 L 472.45 419.75 C472.07,422.36 469.81,433.50 467.42,444.50 C465.02,455.50 462.34,467.88 461.45,472.00 C460.57,476.12 459.62,480.29 459.35,481.25 C458.94,482.73 457.64,483.00 451.06,483.00 L 443.26 483.00 L 433.43 464.49 C427.70,453.70 423.32,446.50 422.93,447.24 C422.57,447.93 420.75,456.26 418.88,465.74 ZM 487.56 479.25 L 486.91 483.00 L 477.95 483.00 C473.03,483.00 469.00,482.89 469.01,482.75 C469.02,482.24 473.97,457.23 475.49,450.00 C476.98,442.95 481.44,422.21 482.54,417.25 C483.00,415.15 483.56,415.00 490.89,415.00 L 498.74 415.00 L 505.76 427.75 C509.61,434.76 513.96,442.86 515.40,445.75 C516.85,448.64 518.20,451.00 518.40,451.00 C518.82,451.00 522.17,436.83 524.79,424.00 L 526.53 415.50 L 535.26 415.21 C543.13,414.95 544.00,415.10 544.00,416.73 C544.00,417.72 541.77,429.10 539.05,442.02 C536.33,454.93 533.33,469.44 532.39,474.25 L 530.69 483.00 L 522.59 482.99 L 514.50 482.98 L 508.10 470.74 C504.59,464.01 500.10,455.58 498.14,452.02 C494.62,445.63 494.56,445.58 493.92,448.52 C492.01,457.23 488.13,475.99 487.56,479.25 ZM 594.36 480.71 L 593.78 483.00 L 539.77 483.00 L 540.38 480.75 C540.71,479.51 542.56,470.62 544.49,461.00 C546.42,451.38 548.69,440.12 549.54,436.00 C550.39,431.88 551.65,425.58 552.34,422.00 L 553.59 415.50 L 606.00 414.97 L 605.96 417.23 C605.93,418.48 605.35,422.20 604.67,425.50 L 603.42 431.50 L 585.84 431.77 L 568.25 432.05 L 567.64 435.77 C567.30,437.82 567.02,440.06 567.01,440.75 C567.00,441.70 570.69,442.00 582.13,442.00 L 597.26 442.00 L 596.59 447.04 C596.22,449.81 595.50,453.19 594.99,454.54 L 594.05 457.00 L 579.08 457.00 C570.85,457.00 563.88,457.38 563.60,457.85 C563.31,458.31 562.77,460.56 562.41,462.85 L 561.74 467.00 L 596.28 467.00 L 595.60 472.71 C595.24,475.85 594.67,479.45 594.36,480.71 ZM 374.55 481.60 C365.82,485.59 352.88,485.52 344.83,481.45 C333.32,475.63 330.45,465.03 335.02,445.24 C336.13,440.43 338.04,431.77 339.27,426.00 L 341.50 415.50 L 350.25 415.21 C358.14,414.95 359.00,415.10 359.00,416.74 C359.00,417.74 357.42,426.09 355.50,435.29 C351.70,453.46 351.20,460.41 353.46,463.64 C356.72,468.29 364.93,469.09 369.58,465.20 C374.63,460.97 376.65,454.82 382.09,427.25 L 384.50 415.00 L 393.25 415.00 C399.69,415.00 402.00,415.34 402.00,416.28 C402.00,418.62 394.98,453.41 393.38,458.99 C390.24,469.93 384.19,477.20 374.55,481.60 ZM 708.62 482.05 C698.60,486.48 683.96,485.37 672.88,479.34 C664.16,474.59 664.06,474.15 670.01,466.58 C672.85,462.96 675.54,460.00 675.97,460.00 C676.40,460.00 677.34,460.71 678.06,461.58 C680.29,464.26 688.91,468.08 694.12,468.70 C700.41,469.45 704.00,467.75 704.00,464.03 C704.00,461.92 703.15,460.99 699.75,459.33 C697.41,458.20 693.98,456.93 692.11,456.52 C687.48,455.51 680.12,451.05 677.68,447.78 C674.87,444.01 674.26,435.22 676.43,429.55 C678.64,423.76 685.32,417.72 691.94,415.52 C696.00,414.17 699.22,413.89 705.86,414.28 C716.33,414.91 720.44,416.09 725.88,420.03 L 730.03 423.04 L 725.43 429.77 C722.89,433.47 720.52,436.48 720.16,436.45 C719.80,436.42 716.58,434.96 713.00,433.20 C702.29,427.93 692.79,429.06 694.39,435.40 C694.83,437.18 696.27,438.29 699.75,439.52 C702.36,440.45 707.73,442.75 711.68,444.63 C720.77,448.95 723.00,452.16 723.00,460.91 C723.00,470.88 718.32,477.76 708.62,482.05 ZM 528.10 306.72 C524.21,309.33 521.84,309.50 517.27,307.52 C511.10,304.84 508.37,297.05 511.48,291.04 C518.62,277.24 538.05,285.64 532.94,300.31 C532.02,302.93 530.26,305.27 528.10,306.72 ZM 627.41 443.75 L 626.74 448.00 L 634.47 448.00 C643.25,448.00 647.21,446.33 649.07,441.83 C650.47,438.44 649.61,434.40 647.21,433.11 C645.63,432.27 638.33,431.68 632.29,431.91 C629.95,432.00 628.83,434.73 627.41,443.75 ZM 289.00 447.05 C289.00,447.86 291.54,448.10 297.59,447.85 C305.55,447.53 306.35,447.30 308.59,444.69 C310.11,442.92 311.00,440.64 311.00,438.50 C311.00,433.49 308.24,432.00 298.92,432.00 L 291.29 432.00 L 290.15 438.94 C289.52,442.76 289.00,446.41 289.00,447.05 Z" />
      </g>
    </svg>
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
        setMessages(prev => {
            if (prev.find(m => m.id === payload.new.id)) return prev;
            return [...prev, payload.new as Message];
        });
        if (payload.new.sender_id !== currentUserId) sendNotification("New Message", payload.new.text);
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [requestId, currentUserId]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !supabase) return;
    const textToSend = newMessage;
    setNewMessage(''); 
    await supabase.from('messages').insert({ request_id: requestId, sender_id: currentUserId, text: textToSend });
  };

  return (
    <div className={`flex flex-col ${embedded ? 'h-full' : 'h-[500px]'} bg-gray-50`}>
      {!embedded && <div className="bg-blue-600 p-4 text-white font-bold flex items-center gap-2 shadow-md"><MessageCircle size={20} /> Chat</div>}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && <div className="text-center text-gray-400 mt-4 text-sm pop-in">Send a message to coordinate...</div>}
        {messages.map((msg, idx) => {
          const isMe = msg.sender_id === currentUserId;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} stagger-enter`} style={{animationDelay: '0s'}}>
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

// 2. Navigation Components
const MobileBottomNav = ({ view, setView, role }: { view: string, setView: (v: string) => void, role: UserRole }) => {
  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: role === 'student' ? 'tracker' : 'dashboard', label: role === 'student' ? 'Activity' : 'Jobs', icon: role === 'student' ? Clock : LayoutDashboard },
    { id: 'profile', label: 'Profile', icon: UserCircle },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe-nav px-6 py-3 flex justify-between items-center shadow-[0_-5px_20px_rgba(0,0,0,0.05)] z-40">
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

const DesktopSidebar = ({ view, setView, role, userProfile, onLogout }: any) => {
  return (
    <div className="hidden md:flex flex-col h-full desktop-sidebar p-6">
      {/* Kept sidebar logo large, as "30px" typically applies to header/context logos */}
      <div className="mb-10 pl-2"><AppLogo className="h-24" /></div>
      
      <div className="space-y-2 flex-1">
        <button onClick={() => setView('home')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${view === 'home' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}>
          <Home size={20} /> Home
        </button>
        <button onClick={() => setView(role === 'student' ? 'tracker' : 'dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${view === 'tracker' || view === 'dashboard' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}>
          {role === 'student' ? <Clock size={20} /> : <LayoutDashboard size={20} />} {role === 'student' ? 'My Activity' : 'Job Board'}
        </button>
        <button onClick={() => setView('profile')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${view === 'profile' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}>
          <UserCircle size={20} /> Profile
        </button>
      </div>

      <div className="border-t pt-4">
        <div className="flex items-center gap-3 px-2 mb-4">
           <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
             {userProfile.avatar_url ? <img src={userProfile.avatar_url} className="w-full h-full object-cover"/> : <User size={20} className="m-2 text-gray-400"/>}
           </div>
           <div>
             <p className="font-bold text-sm truncate w-32">{userProfile.name}</p>
             <p className="text-xs text-gray-500 capitalize">{userProfile.role}</p>
           </div>
        </div>
        <button onClick={onLogout} className="w-full flex items-center gap-2 text-red-600 text-sm font-bold px-2 hover:bg-red-50 py-2 rounded-lg transition-colors">
          <LogOut size={16} /> Sign Out
        </button>
      </div>
    </div>
  );
}

// 3. Profile View
const ProfileView = ({ userProfile, onEdit, onLogout }: { userProfile: UserProfile, onEdit: () => void, onLogout: () => void }) => {
  return (
    <div className="animate-slide-up max-w-xl mx-auto w-full">
       <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white text-center relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-full bg-white/5 backdrop-blur-sm"></div>
             <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl animate-blob"></div>
             
             <div className="relative z-10 flex flex-col items-center">
               <div className="w-28 h-28 bg-white rounded-full p-1 shadow-xl mb-4 relative group cursor-pointer" onClick={onEdit}>
                  <div className="w-full h-full bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                    {userProfile.avatar_url ? (
                      <img src={userProfile.avatar_url} className="w-full h-full object-cover" alt="Profile" />
                    ) : (
                      <User size={40} className="text-gray-400" />
                    )}
                  </div>
                  <div className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full border-2 border-white shadow-sm"><Camera size={14}/></div>
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
               <span className="font-bold text-gray-700">Edit Profile & Avatar</span>
             </div>
             <ChevronRight size={20} className="text-gray-400"/>
          </button>

          <button onClick={onLogout} className="md:hidden w-full bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center justify-between hover:bg-red-100 btn-press shadow-sm text-red-600 mt-4">
             <div className="flex items-center gap-3">
               <div className="bg-red-100 p-2 rounded-full"><LogOut size={20}/></div>
               <span className="font-bold">Sign Out</span>
             </div>
          </button>
       </div>
    </div>
  );
}

// 4. Request Form
const RequestForm = ({ onSubmit, onCancel }: any) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ type: 'food', pickup_address: '', dropoff_address: '', details: '', price_estimate: 50, lat: 0, lng: 0 });
  const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); setLoading(true); await onSubmit(formData); setLoading(false); };

  return (
    <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4 backdrop-blur-sm pop-in">
      <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 flex justify-between items-center text-white">
          <div><h3 className="font-bold text-xl">New Errand</h3><p className="text-blue-100 text-sm">Fill in the details below</p></div>
          <button onClick={onCancel} className="bg-white/20 p-2 rounded-full hover:bg-white/30 transition-transform hover:rotate-90"><X size={20}/></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div><label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Errand Type</label><div className="grid grid-cols-2 gap-2">{['food', 'printing', 'groceries', 'transport'].map(type => (<button key={type} type="button" onClick={() => setFormData({...formData, type})} className={`p-3 rounded-lg border text-sm font-medium capitalize transition-all btn-press ${formData.type === type ? 'border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500' : 'border-gray-200 text-gray-600 hover:border-blue-200 hover:bg-gray-50'}`}>{type}</button>))}</div></div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Pickup Location</label>
              <div className="relative">
                <MapPin size={18} className="absolute left-3 top-3 text-red-500" />
                <input required type="text" placeholder="e.g. Jollibee" className="w-full pl-10 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all hover:border-gray-400" value={formData.pickup_address} onChange={(e) => setFormData({...formData, pickup_address: e.target.value})}/>
              </div>
            </div>
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

// 5. Active Job View
const ActiveJobView = ({ job, userId, onUpdateStatus, userProfile, onClose }: { job: Request, userId: string, onUpdateStatus: (id: string, status: RequestStatus) => void, userProfile: UserProfile, onClose: () => void }) => {
  const [updating, setUpdating] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const handleStatusUpdate = async (status: RequestStatus) => { setUpdating(true); try { await onUpdateStatus(job.id, status); } catch (e) { alert("Failed to update status."); } finally { setUpdating(false); } };

  return (
    <div className="fixed inset-0 bg-gray-100 z-[60] flex flex-col md:flex-row pop-in">
      <div className="w-full md:w-1/2 lg:w-1/3 bg-white flex flex-col border-r shadow-xl z-10">
        <div className="bg-blue-900 text-white p-6 pb-8 relative overflow-hidden">
           {/* BACK BUTTON */}
           <div className="absolute top-4 right-4 z-20">
             <button onClick={onClose} className="bg-white/20 hover:bg-white/30 p-2 rounded-full backdrop-blur-sm transition-all">
               <Minimize2 size={20} className="text-white"/>
             </button>
           </div>

           <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-2xl animate-blob"></div>
           <div className="relative z-10 mt-6">
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

// 6. Marketplace
const Marketplace = ({ requests, onClaim, onUpdateStatus, userId, onRefresh, userProfile }: { requests: Request[], onClaim: (id: string) => void, onUpdateStatus: (id: string, status: RequestStatus) => void, userId: string, onRefresh: () => void, userProfile: UserProfile }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewActiveJob, setViewActiveJob] = useState(false);
  const handleRefresh = async () => { setIsRefreshing(true); await onRefresh(); setTimeout(() => setIsRefreshing(false), 500); };

  const myActiveJob = requests.find(r => r.runner_id === userId && r.status !== 'completed' && r.status !== 'cancelled');

  if (viewActiveJob && myActiveJob) {
      return <ActiveJobView job={myActiveJob} userId={userId} onUpdateStatus={onUpdateStatus} userProfile={userProfile} onClose={() => setViewActiveJob(false)} />;
  }

  const openRequests = requests.filter(r => r.status === 'requested');

  return (
    <div className="space-y-6 pb-24 animate-slide-up">
      {/* Banner for Active Job when minimized */}
      {myActiveJob && (
          <div className="bg-blue-600 text-white p-4 rounded-xl flex items-center justify-between shadow-lg cursor-pointer hover:bg-blue-700 transition" onClick={() => setViewActiveJob(true)}>
             <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg"><Bike size={20} className="animate-pulse"/></div>
                <div><div className="font-bold text-sm">Mission in Progress</div><p className="text-xs text-blue-100">Click to resume</p></div>
             </div>
             <ChevronRight />
          </div>
      )}

      <div className="flex justify-between items-center mb-4"><div><h2 className="text-2xl font-bold text-gray-900">Job Board</h2><p className="text-gray-500 text-sm">Accept a job to start working</p></div><button onClick={handleRefresh} disabled={isRefreshing} className="bg-white border p-2 rounded-full shadow-sm hover:bg-gray-50 transition-all btn-press"><RefreshCw size={18} className={`text-gray-600 ${isRefreshing ? 'animate-spin' : ''}`}/></button></div>
      {openRequests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-gray-300 pop-in"><div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mb-4"><Navigation className="text-gray-400" size={32} /></div><div className="text-gray-900 font-bold text-lg">No jobs available</div><p className="text-gray-500">Wait for students to post...</p></div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {openRequests.map((req, i) => (
            <div key={req.id} style={{animationDelay: `${i*100}ms`}} className="stagger-enter bg-white rounded-2xl shadow-sm border border-gray-100 hover-lift transition-all duration-200 p-5 group">
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

// 7. Request Tracker (Student)
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
      {chatRequestId && (<div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 pop-in"><div className="w-full max-w-md bg-white rounded-xl overflow-hidden relative"><button className="absolute top-2 right-2 text-white z-10" onClick={()=>setChatRequestId(null)}><X/></button><ChatBox requestId={chatRequestId} currentUserId={user.id} /></div></div>)}
    </div>
  );
};

// 8. Runner Dashboard
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

// 9. Profile Modal
const ProfileModal = ({ userProfile, onSave, onClose }: any) => {
  const [name, setName] = useState(userProfile.name);
  const [phone, setPhone] = useState(userProfile.phone);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e: any, type: string) => {
    if (!e.target.files.length) return;
    setUploading(true);
    const file = e.target.files[0];
    const filePath = `${userProfile.id}/${type}_${Date.now()}.${file.name.split('.').pop()}`;
    try {
       await supabase.storage.from('runners-assets').upload(filePath, file);
       const { data } = supabase.storage.from('runners-assets').getPublicUrl(filePath);
       
       let updateData = {};
       if (type === 'id') updateData = { school_id_url: data.publicUrl, is_verified: true };
       else if (type === 'qr') updateData = { payment_qr_url: data.publicUrl };
       else if (type === 'avatar') updateData = { avatar_url: data.publicUrl };

       onSave(updateData);
       alert('Uploaded successfully!');
    } catch (e) {
       alert('Upload failed. Please try again.');
    } finally {
       setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm pop-in">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6">
        <h2 className="text-xl font-bold mb-4">Edit Profile</h2>
        <form onSubmit={(e) => { e.preventDefault(); onSave({ name, phone }); onClose(); }} className="space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Name</label><input className="w-full p-2 border rounded-lg" value={name} onChange={e => setName(e.target.value)} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone</label><input className="w-full p-2 border rounded-lg" value={phone} onChange={e => setPhone(e.target.value)} /></div>
          
          <div className="p-3 bg-gray-50 rounded-lg border border-dashed border-gray-300 space-y-3">
             <label className="flex items-center gap-2 text-sm text-blue-600 cursor-pointer font-medium hover:bg-blue-50 p-2 rounded transition">
                {uploading ? <Loader2 size={14} className="animate-spin"/> : <ImageIcon size={14}/>} Upload Profile Picture 
                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'avatar')} />
             </label>
             <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer hover:bg-gray-100 p-2 rounded transition">
                {uploading ? <Loader2 size={14} className="animate-spin"/> : <Camera size={14}/>} Upload School ID 
                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'id')} />
             </label>
             {userProfile.role === 'runner' && (
                <label className="flex items-center gap-2 text-sm text-green-600 cursor-pointer hover:bg-green-50 p-2 rounded transition">
                   {uploading ? <Loader2 size={14} className="animate-spin"/> : <QrCode size={14}/>} Upload GCash QR 
                   <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'qr')} />
                </label>
             )}
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white font-bold py-2 rounded-lg btn-press">Save Changes</button>
        </form>
      </div>
    </div>
  );
};

const RatingModal = ({ onSubmit }: any) => {
  const [rating, setRating] = useState(0);
  return (<div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 pop-in"><div className="bg-white rounded-2xl p-8 text-center w-full max-w-sm"><h2 className="text-2xl font-bold mb-4">Rate Runner</h2><div className="flex justify-center gap-2 mb-6">{[1,2,3,4,5].map(s => <button key={s} onClick={() => setRating(s)}><Star size={32} className={s <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} /></button>)}</div><button onClick={() => onSubmit(rating)} disabled={rating === 0} className="w-full bg-black text-white py-3 rounded-xl font-bold btn-press">Submit</button></div></div>);
};

// 10. Auth Screen (REDESIGNED)
const AuthScreen = ({ onLogin, onSignup }: any) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) await onLogin(email, password);
      else await onSignup(email, password, role);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-split bg-gray-50 font-sans text-gray-900">
      {/* LEFT SIDE: Brand (Hidden on Mobile) */}
      <div className="hidden md:flex auth-left relative">
         <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
         <div className="absolute -top-20 -left-20 w-96 h-96 bg-white/20 rounded-full blur-3xl animate-blob"></div>
         <div className="absolute bottom-0 right-0 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl animate-blob"></div>
         
         <div className="relative z-10 max-w-md">
           <AppLogo dark={true} />
           <h1 className="text-5xl font-black mt-8 mb-6 leading-tight">We run,<br/>you study.</h1>
           <p className="text-blue-100 text-lg mb-8">Join the student community that helps you focus on what matters most. Whether you need a delivery or want to earn extra cash, we've got you covered.</p>
           
           <div className="flex gap-4">
             <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20 flex-1">
               <BookOpen className="mb-2 text-blue-200" />
               <h3 className="font-bold">Students</h3>
               <p className="text-xs text-blue-200 opacity-80">Get food & prints delivered.</p>
             </div>
             <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20 flex-1">
               <Bike className="mb-2 text-green-300" />
               <h3 className="font-bold">Runners</h3>
               <p className="text-xs text-blue-200 opacity-80">Earn cash in your free time.</p>
             </div>
           </div>
         </div>
      </div>

      {/* RIGHT SIDE: Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 relative overflow-hidden">
         <div className="absolute -top-10 -right-10 w-64 h-64 bg-blue-100 rounded-full blur-3xl animate-blob md:hidden"></div>
         
         <div className="w-full max-w-md bg-white md:bg-transparent rounded-3xl shadow-2xl md:shadow-none p-8 z-10 animate-scale-in border md:border-0 border-gray-100">
            <div className="md:hidden text-center mb-8">
               <AppLogo />
               <h2 className="text-2xl font-bold mt-4 text-gray-800">Welcome Back!</h2>
            </div>

            <div className="hidden md:block mb-8">
               <h2 className="text-3xl font-bold text-gray-900">{isLogin ? 'Sign In' : 'Create Account'}</h2>
               <p className="text-gray-500 mt-2 text-sm">Enter your credentials to access your account.</p>
            </div>

            {/* Toggle Switch */}
            <div className="bg-gray-100 p-1 rounded-xl flex mb-8">
              <button 
                onClick={() => setIsLogin(true)} 
                className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${isLogin ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Log In
              </button>
              <button 
                onClick={() => setIsLogin(false)} 
                className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${!isLogin ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Sign Up
              </button>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm mb-6 flex items-start gap-3 border border-red-100">
                <AlertCircle size={18} className="mt-0.5 shrink-0"/> 
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-4">
                <div className="relative group">
                   <Mail className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={20}/>
                   <input 
                     required 
                     type="email" 
                     placeholder="Email Address" 
                     value={email} 
                     onChange={e => setEmail(e.target.value)} 
                     className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                   />
                </div>
                <div className="relative group">
                   <Lock className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={20}/>
                   <input 
                     required 
                     type="password" 
                     placeholder="Password" 
                     value={password} 
                     onChange={e => setPassword(e.target.value)} 
                     className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                   />
                </div>
              </div>

              {/* Enhanced Role Selection */}
              {!isLogin && (
                <div className="grid grid-cols-2 gap-3 mt-2 animate-slide-up">
                  <div 
                    onClick={() => setRole('student')}
                    className={`cursor-pointer p-4 rounded-xl border-2 transition-all text-center ${role === 'student' ? 'border-blue-500 bg-blue-50' : 'border-gray-100 hover:border-gray-300'}`}
                  >
                    <BookOpen className={`mx-auto mb-2 ${role === 'student' ? 'text-blue-600' : 'text-gray-400'}`} size={24}/>
                    <div className={`font-bold text-sm ${role === 'student' ? 'text-blue-700' : 'text-gray-600'}`}>Student</div>
                  </div>
                  <div 
                    onClick={() => setRole('runner')}
                    className={`cursor-pointer p-4 rounded-xl border-2 transition-all text-center ${role === 'runner' ? 'border-green-500 bg-green-50' : 'border-gray-100 hover:border-gray-300'}`}
                  >
                    <Bike className={`mx-auto mb-2 ${role === 'runner' ? 'text-green-600' : 'text-gray-400'}`} size={24}/>
                    <div className={`font-bold text-sm ${role === 'runner' ? 'text-green-700' : 'text-gray-600'}`}>Runner</div>
                  </div>
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading} 
                className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 active:scale-[0.98] transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" /> : (isLogin ? 'Sign In' : 'Create Account')}
                {!loading && <ArrowRight size={20} />}
              </button>
            </form>
         </div>
      </div>
    </div>
  );
}


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

  // Initialize Supabase via CDN script injection
  useEffect(() => {
    if (window.Notification && Notification.permission !== 'granted') Notification.requestPermission();
    
    const initSupabase = () => {
      if (window.supabase) { 
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
    supabase.auth.getSession().then(({ data: { session } }: any) => {
        setUser(session?.user ?? null);
        if (!session?.user) {
            setLoading(false); // If no session, stop loading immediately so we see login screen
        }
    });
    
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

  useEffect(() => { if (user && isSupabaseReady) { fetchRequests(); const ch = supabase.channel('public:requests').on('postgres_changes', { event: '*', schema: 'public', table: 'requests' }, (p: any) => { if (p.eventType === 'INSERT') setRequests(prev => [p.new, ...prev]); else if (p.eventType === 'UPDATE') setRequests(prev => prev.map(r => r.id === p.new.id ? p.new : r)); }).subscribe(); return () => supabase.removeChannel(ch); } }, [user, fetchRequests, isSupabaseReady]);

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

  if (!isSupabaseReady) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="flex flex-col items-center gap-4"><Loader2 className="animate-spin text-blue-600" size={40}/><p className="text-gray-500 font-medium">Connecting to Runners...</p></div></div>;
  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600"/></div>;
  if (!user) return <><GlobalStyles /><AuthScreen onLogin={(e: string, p: string) => handleAuth('login', e, p)} onSignup={(e: string, p: string, r: UserRole) => handleAuth('signup', e, p, r)} /></>;
  if (!userProfile) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600"/></div>;

  // --- LAYOUT RENDERING ---
  return (
    <div className="font-sans text-gray-900 animate-scale-in desktop-layout">
      <GlobalStyles />
      
      {/* Desktop Sidebar (Only visible on MD+) */}
      <DesktopSidebar view={view} setView={setView} role={userProfile.role} userProfile={userProfile} onLogout={async () => { await supabase.auth.signOut(); setView('home'); }} />
      
      {/* Main Content Area */}
      <div className="flex-1 desktop-main bg-gray-50 min-h-screen flex flex-col relative">
        {/* Add Top Right Logo for Desktop */}
        <div className="hidden md:block absolute top-8 right-8 z-50 opacity-80 hover:opacity-100 transition-opacity cursor-pointer" onClick={() => setView('home')}>
            <AppLogo />
        </div>

        {/* Mobile Navbar (Hidden on Desktop) */}
        <div className="md:hidden">
          {/* We hide the top navbar on desktop because the sidebar handles it */}
          <nav className="bg-white/90 backdrop-blur-md border-b sticky top-0 z-40 shadow-sm">
             <div className="px-4 h-16 flex items-center justify-between">
                {/* Profile on Left */}
                <div onClick={() => setView('profile')} className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden cursor-pointer">
                   {userProfile.avatar_url ? <img src={userProfile.avatar_url} className="w-full h-full object-cover"/> : <User className="p-1 text-gray-500"/>}
                </div>
                {/* Logo on Right */}
                <div onClick={() => setView('home')} className="cursor-pointer"><AppLogo /></div>
             </div>
          </nav>
        </div>

        <main className="p-4 md:p-8 max-w-5xl w-full mx-auto flex-1 pb-24 md:pb-8">
          {view === 'home' && (
             userProfile.role === 'student' ? (
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
               </div>
             ) : (
               <Marketplace requests={requests} onClaim={async (id) => { await supabase.from('requests').update({ runner_id: user.id, status: 'accepted' }).eq('id', id); }} onUpdateStatus={async (id, s) => { await supabase.from('requests').update({ status: s }).eq('id', id); }} userId={user.id} onRefresh={fetchRequests} userProfile={userProfile} />
             )
          )}

          {view === 'tracker' && <RequestTracker requests={requests.filter(r => r.student_id === user.id)} currentUserId={user.id} onRate={(req, r) => { if (r > 0) { supabase.from('requests').update({ rating: r }).eq('id', req.id); } else setShowRatingModal(req); }} />}
          {view === 'dashboard' && <div className="max-w-3xl mx-auto"><RunnerDashboard requests={requests} userId={user.id} /></div>}
          {view === 'profile' && <ProfileView userProfile={userProfile} onEdit={() => setShowProfileModal(true)} onLogout={async () => { await supabase.auth.signOut(); setView('home'); }} />}
        </main>
      </div>

      {/* Mobile Bottom Nav (Hidden on Desktop) */}
      <MobileBottomNav view={view} setView={setView} role={userProfile.role} />

      {/* Modals & Overlays */}
      {showRequestForm && <RequestForm onSubmit={createRequest} onCancel={() => setShowRequestForm(false)} />}
      {showRatingModal && <RatingModal onSubmit={async (r: number) => { await supabase.from('requests').update({ rating: r }).eq('id', showRatingModal.id); setShowRatingModal(null); }} />}
      {showProfileModal && <ProfileModal userProfile={userProfile} onSave={async (d: any) => { await supabase.from('users').update(d).eq('id', user.id); setUserProfile({...userProfile, ...d}); }} onClose={() => setShowProfileModal(false)} />}
      {activeChatRequest && <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 pop-in"><div className="w-full max-w-md bg-white rounded-xl overflow-hidden relative"><button className="absolute top-2 right-2 text-white z-10" onClick={()=>setActiveChatRequest(null)}><X/></button><ChatBox requestId={activeChatRequest} currentUserId={user.id} /></div></div>}
    </div>
  );
}