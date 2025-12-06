import type { ReactNode } from 'react';
import DesktopSidebar from '../DesktopSidebar';
import { type UserProfile, type UserRole } from '../../types';

interface DesktopLayoutProps {
  children: ReactNode;
  view: string;
  setView: (view: string) => void;
  userProfile: UserProfile | null;
  onLogout: () => void;
}

export default function DesktopLayout({ children, view, setView, userProfile, onLogout }: DesktopLayoutProps) {
  // Use default role 'student' if profile is null, and default profile object for sidebar
  const role: UserRole = userProfile?.role || 'student';
  const sidebarProfile = userProfile || { id: '', name: 'User', role: 'student', phone: '', email: 'user@example.com' };

  return (
    <div className="flex min-h-screen bg-gray-50 desktop-layout">
      {/* Desktop Sidebar */}
      <DesktopSidebar
        view={view}
        setView={setView}
        role={role}
        userProfile={sidebarProfile}
        onLogout={onLogout}
      />

      {/* Main Content Area */}
      <div className="flex-1 desktop-main flex flex-col relative" style={{ marginLeft: '280px' }}>
        <main className="p-8 max-w-5xl w-full mx-auto flex-1 pb-8">
          {children}
        </main>
      </div>
    </div>
  );
}
