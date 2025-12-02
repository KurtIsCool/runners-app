import { Plus, Bike } from 'lucide-react';
import Marketplace from './Marketplace';
import RequestTracker from './RequestTracker';
import RunnerDashboard from './RunnerDashboard';
import ProfileView from './ProfileView';
import { type UserProfile, type Request } from '../types';

interface AppContentProps {
  view: string;
  setView: (view: string) => void;
  userProfile: UserProfile | null;
  requests: Request[];
  loading?: boolean;
  setShowRequestForm: (show: boolean) => void;
  setShowRatingModal: (request: Request | null) => void;
  setShowProfileModal: (show: boolean) => void;
  onLogout: () => void;
  fetchRequests: () => void;
  createRequest?: (data: any) => Promise<void>;
  updateRequestStatus: (id: string, status: string) => Promise<void>;
  assignRequest: (id: string, runnerId: string) => Promise<void>;
  rateRequest: (id: string, rating: number) => Promise<void>;
  currentUserId: string;
}

export default function AppContent({
  view,
  // setView,
  userProfile,
  requests,
  setShowRequestForm,
  setShowRatingModal,
  setShowProfileModal,
  onLogout,
  fetchRequests,
  updateRequestStatus,
  assignRequest,
  rateRequest,
  currentUserId
}: AppContentProps) {

  if (view === 'home') {
    if (userProfile?.role === 'student') {
      return (
        <div className="space-y-8 animate-slide-up">
          {/* Hero Card */}
          <header className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 md:p-12 text-white shadow-xl relative overflow-hidden flex flex-col items-start justify-center min-h-[300px]">
            <div className="relative z-10 max-w-xl">
              <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">We run.<br />You study.</h1>
              <p className="text-blue-100 text-lg mb-8">Get food, print documents, or buy groceries without leaving your dorm.</p>
              <button
                onClick={() => setShowRequestForm(true)}
                className="bg-white text-blue-600 px-8 py-4 rounded-xl font-bold text-lg btn-press flex items-center gap-3 hover:bg-gray-50 transition-colors shadow-lg"
              >
                <Plus size={24} /> Create New Request
              </button>
            </div>
            <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-blob"></div>
            <div className="absolute right-10 top-10 text-white/10 hidden md:block">
              <Bike size={180} />
            </div>
          </header>

          {/* Category Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['Food', 'Print', 'Shop', 'Drop'].map((t) => (
              <button
                key={t}
                onClick={() => setShowRequestForm(true)}
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
          requests={requests}
          onClaim={(id) => assignRequest(id, currentUserId)}
          onUpdateStatus={updateRequestStatus}
          userId={currentUserId}
          onRefresh={fetchRequests}
          userProfile={userProfile!}
        />
      );
    }
  }

  if (view === 'tracker') {
    return (
      <RequestTracker
        requests={requests.filter(r => r.student_id === currentUserId)}
        currentUserId={currentUserId}
        onRate={(req, r) => {
            if (r > 0) rateRequest(req.id, r);
            else setShowRatingModal(req);
        }}
      />
    );
  }

  if (view === 'dashboard') {
    return (
      <div className="max-w-3xl mx-auto">
        <RunnerDashboard requests={requests} userId={currentUserId} />
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

  return null;
}
