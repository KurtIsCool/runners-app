import { User } from 'lucide-react';
import AppLogo from '../AppLogo';
import MobileBottomNav from '../MobileBottomNav';
import { type UserProfile, type UserRole } from '../../types';
import type { ReactNode } from 'react';

interface MobileLayoutProps {
  children: ReactNode;
  view: string;
  setView: (view: string) => void;
  userProfile: UserProfile | null;
  onLogout: () => void;
}

export default function MobileLayout({ children, view, setView, userProfile }: MobileLayoutProps) {
  const role: UserRole = userProfile?.role || 'student';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Mobile Navbar */}
      <nav className="bg-white/90 backdrop-blur-md border-b sticky top-0 z-40 shadow-sm">
        <div className="px-4 h-16 flex items-center justify-between relative">

          {/* Invisible Spacer Left to balance layout if needed, but absolute centering is better */}
          <div className="w-8"></div>

          {/* Logo Centered */}
          <div onClick={() => setView('home')} className="absolute left-1/2 transform -translate-x-1/2 cursor-pointer">
            <AppLogo className="h-8" />
          </div>

          {/* Profile on Right */}
          <div
            onClick={() => setView('profile')}
            className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden cursor-pointer flex items-center justify-center border border-gray-100"
          >
            {userProfile?.avatar_url ? (
              <img src={userProfile.avatar_url} className="w-full h-full object-cover" alt="Profile" />
            ) : (
              <User className="w-5 h-5 text-gray-500" />
            )}
          </div>
        </div>
      </nav>

      <main className="p-4 w-full mx-auto flex-1 pb-24">
        {children}
      </main>

      {/* Mobile Bottom Nav */}
      <MobileBottomNav view={view} setView={setView} role={role} />
    </div>
  );
}
