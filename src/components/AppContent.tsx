import { Plus } from 'lucide-react';
import AppLogo from './AppLogo';
import Marketplace from './Marketplace';
import MissionTracker from './MissionTracker';
import RunnerDashboard from './RunnerDashboard';
import ProfileView from './ProfileView';
import StaticPage from './StaticPages';
import { type UserProfile, type Mission } from '../types';
import { useEffect } from 'react';

interface AppContentProps {
  view: string;
  setView: (view: string) => void;
  userProfile: UserProfile | null;
  missions: Mission[];
  loading?: boolean;
  setShowMissionForm: (show: boolean) => void;
  setShowRatingModal: (mission: Mission | null) => void;
  setShowProfileModal: (show: boolean) => void;
  // New: Handler for viewing other profiles
  setShowPublicProfileModal?: (userId: string) => void;
  onLogout: () => void;
  fetchMissions: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createMission?: (data: any) => Promise<void>;
  updateMissionStatus: (id: string, status: string) => Promise<void>;
  assignMission: (id: string, runnerId: string) => Promise<void>;
  rateMission: (id: string, rating: number, comment?: string) => Promise<void>;
  currentUserId: string;
}

export default function AppContent({
  view,
  setView,
  userProfile,
  missions,
  setShowMissionForm,
  setShowRatingModal,
  setShowProfileModal,
  setShowPublicProfileModal,
  onLogout,
  fetchMissions,
  updateMissionStatus,
  assignMission,
  rateMission,
  currentUserId
}: AppContentProps) {

  // Moved useEffect to top level
  useEffect(() => {
    const handleNavigation = (e: Event) => {
       const detail = (e as CustomEvent).detail;
       if (detail) setView(detail);
    };
    window.addEventListener('navigate', handleNavigation);
    return () => window.removeEventListener('navigate', handleNavigation);
  }, [setView]);

  if (view === 'home') {
    if (userProfile?.role === 'student') {
      return (
        <div className="space-y-8 animate-slide-up">
          {/* Hero Card */}
          <header className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 md:p-12 text-white shadow-xl relative overflow-hidden flex flex-col items-start justify-center min-h-[300px]">
            <div className="relative z-10 max-w-xl">
              <div className="mb-6">
                <AppLogo className="h-24 w-24 text-white" />
              </div>
              <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">We run.<br />You study.</h1>
              <p className="text-blue-100 text-lg mb-8">Get food, print documents, or buy groceries without leaving your dorm.</p>
              <button
                onClick={() => setShowMissionForm(true)}
                className="bg-white text-blue-600 px-8 py-4 rounded-xl font-bold text-lg btn-press flex items-center gap-3 hover:bg-gray-50 transition-colors shadow-lg"
              >
                <Plus size={24} /> Create New Mission
              </button>
            </div>
            <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-blob"></div>
          </header>

          {/* Category Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['Food', 'Print', 'Shop', 'Drop'].map((t) => (
              <button
                key={t}
                onClick={() => setShowMissionForm(true)}
                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover-lift text-center font-bold text-gray-700 btn-press transition-all hover:border-blue-200"
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      );
    } else {
      // Runner View (Marketplace)
      return (
        <Marketplace
          requests={missions}
          onClaim={(id) => assignMission(id, currentUserId)}
          onUpdateStatus={updateMissionStatus}
          userId={currentUserId}
          onRefresh={fetchMissions}
          userProfile={userProfile!}
          onViewProfile={setShowPublicProfileModal}
          onRateUser={setShowRatingModal}
        />
      );
    }
  }

  if (view === 'tracker') {
    return (
      <MissionTracker
        missions={missions.filter(r => r.student_id === currentUserId)}
        currentUserId={currentUserId}
        onRate={(req, r, c) => {
            if (r > 0) rateMission(req.id, r, c);
            else setShowRatingModal(req);
        }}
        onViewProfile={setShowPublicProfileModal}
      />
    );
  }

  if (view === 'dashboard') {
    return (
      <div className="max-w-3xl mx-auto">
        <RunnerDashboard
          requests={missions}
          userId={currentUserId}
          onViewProfile={setShowPublicProfileModal}
          onRateUser={setShowRatingModal}
        />
      </div>
    );
  }

  if (view === 'profile') {
    return (
      <ProfileView
        userProfile={userProfile!}
        onEdit={() => setShowProfileModal(true)}
        onLogout={onLogout}
      />
    );
  }

  if (['about', 'contact', 'faqs', 'terms', 'privacy', 'help'].includes(view)) {
    return <StaticPage page={view} onBack={() => setView('profile')} />;
  }

  return null;
}
