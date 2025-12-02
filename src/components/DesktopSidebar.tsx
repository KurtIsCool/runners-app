import { Home, LayoutDashboard, Clock, UserCircle, User, LogOut } from 'lucide-react';
import { type UserRole, type UserProfile } from '../types';
import AppLogo from './AppLogo';

interface DesktopSidebarProps {
    view: string;
    setView: (v: string) => void;
    role: UserRole;
    userProfile: UserProfile;
    onLogout: () => void;
}

const DesktopSidebar = ({ view, setView, role, userProfile, onLogout }: DesktopSidebarProps) => {
    return (
      <div className="flex flex-col h-full desktop-sidebar p-6">
        {/* Kept sidebar logo large, as "30px" typically applies to header/context logos */}
        <div className="mb-10 pl-2 cursor-pointer" onClick={() => setView('home')}>
          <AppLogo className="h-24" />
        </div>

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

export default DesktopSidebar;
