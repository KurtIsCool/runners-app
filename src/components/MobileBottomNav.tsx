import { Home, LayoutDashboard, Clock, UserCircle } from 'lucide-react';
import { type UserRole } from '../types';

const MobileBottomNav = ({ view, setView, role }: { view: string, setView: (v: string) => void, role: UserRole }) => {
    const navItems = [
      { id: 'home', label: 'Home', icon: Home },
      { id: role === 'student' ? 'tracker' : 'dashboard', label: role === 'student' ? 'Activity' : 'Jobs', icon: role === 'student' ? Clock : LayoutDashboard },
      { id: 'profile', label: 'Profile', icon: UserCircle },
    ];

    return (
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe-nav px-6 py-3 flex justify-between items-center shadow-[0_-5px_20px_rgba(0,0,0,0.05)] z-40">
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

export default MobileBottomNav;
