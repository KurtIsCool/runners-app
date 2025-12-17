import { useState, useEffect } from 'react';
import { RefreshCw, Navigation, ArrowRight, ChevronRight, User as UserIcon } from 'lucide-react';
import AppLogo from './AppLogo';
import { type Request, type UserProfile, type RequestStatus } from '../types';
import ActiveJobView from './ActiveJobView';
import { supabase } from '../lib/supabase';

// Sub-component for fetching student name in job card
const JobRequester = ({ studentId, onClick }: { studentId: string, onClick?: (id: string) => void }) => {
    const [name, setName] = useState<string>('Student');
    useEffect(() => {
        const fetchName = async () => {
            const { data } = await supabase.from('users').select('name').eq('id', studentId).single();
            if (data) setName(data.name);
        };
        fetchName();
    }, [studentId]);
    return (
      <button
        onClick={() => onClick && onClick(studentId)}
        className="text-xs text-gray-500 flex items-center gap-1 mt-1 hover:text-blue-600 transition-colors"
      >
        <UserIcon size={10} /> {name}
      </button>
    );
}

const Marketplace = ({ requests, onClaim, onUpdateStatus, userId, onRefresh, userProfile, onViewProfile, onRateUser, onCancelRequest }: { requests: Request[], onClaim: (id: string) => Promise<void> | void, onUpdateStatus: (id: string, status: RequestStatus) => void, userId: string, onRefresh: () => void, userProfile: UserProfile, onViewProfile?: (userId: string) => void, onRateUser?: (req: Request) => void, onCancelRequest?: (id: string, reason: string) => void }) => {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [viewActiveJob, setViewActiveJob] = useState(false);
    const handleRefresh = async () => { setIsRefreshing(true); await onRefresh(); setTimeout(() => setIsRefreshing(false), 500); };

    const handleClaim = async (id: string) => {
        try {
            await onClaim(id);
        } catch (error) {
            console.error(error);
            alert(error instanceof Error ? error.message : "Failed to accept job. It might have been taken.");
            onRefresh();
        }
    };

    // Exclude disputed jobs so runner is not blocked.
    // Ensure all active states are caught.
    const myActiveJob = requests.find(r =>
        r.runner_id === userId &&
        ['pending_runner', 'awaiting_payment', 'payment_review', 'accepted', 'purchasing', 'delivering', 'delivered'].includes(r.status)
    );

    // Helper to get banner content based on status
    const getBannerContent = (status: RequestStatus) => {
        switch (status) {
            case 'pending_runner': return { title: 'Application Sent', sub: 'Waiting for student approval' };
            case 'awaiting_payment': return { title: 'Offer Accepted', sub: 'Waiting for payment' };
            case 'payment_review': return { title: 'Payment Review', sub: 'Confirm receipt of payment' };
            default: return { title: 'Mission in Progress', sub: 'Click to resume' };
        }
    };

    if (viewActiveJob && myActiveJob) {
        return <ActiveJobView job={myActiveJob} userId={userId} onUpdateStatus={onUpdateStatus} userProfile={userProfile} onClose={() => setViewActiveJob(false)} onRateUser={onRateUser} onCancel={onCancelRequest} onRefresh={onRefresh} />;
    }

    const openRequests = requests.filter(r => r.status === 'requested');

    return (
      <div className="space-y-6 pb-24 animate-slide-up">
        {/* Banner for Active Job when minimized */}
        {myActiveJob && (
            <div className={`p-4 rounded-xl flex items-center justify-between shadow-lg cursor-pointer transition ${myActiveJob.status === 'pending_runner' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-blue-600 hover:bg-blue-700'} text-white`} onClick={() => setViewActiveJob(true)}>
               <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-lg"><AppLogo className="h-5 w-5 animate-pulse text-white"/></div>
                  <div>
                      <div className="font-bold text-sm">{getBannerContent(myActiveJob.status).title}</div>
                      <p className="text-xs text-blue-100">{getBannerContent(myActiveJob.status).sub}</p>
                  </div>
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
              <div key={req.id} style={{animationDelay: `${i*100}ms`}} className={`stagger-enter bg-white rounded-2xl shadow-sm border border-gray-100 hover-lift transition-all duration-200 p-5 group ${myActiveJob ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-50 p-3 rounded-xl text-2xl">{req.type === 'food' ? '🍔' : req.type === 'printing' ? '🖨️' : req.type === 'custom' ? '✨' : '📦'}</div>
                        <div>
                            <h3 className="font-bold text-lg text-gray-900 capitalize leading-none">{req.type === 'custom' ? 'Custom Errand' : req.type}</h3>
                            <JobRequester studentId={req.student_id} onClick={onViewProfile} />
                            <span className="text-xs text-gray-400 block mt-0.5">{new Date(req.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                    </div>
                    <div className="mt-6 text-right">
                        <div className="font-bold text-xl text-green-600">₱{req.price_estimate}</div>
                        {req.item_cost !== undefined ? (
                            <div className="text-[10px] text-gray-400 flex flex-col items-end">
                                <span>Item: ₱{req.item_cost}</span>
                                <span>Fee: ₱{req.service_fee || 49}</span>
                                {req.additional_cost ? <span>Add: ₱{req.additional_cost}</span> : null}
                            </div>
                        ) : <div className="text-[10px] text-gray-400">Est. Total</div>}
                    </div>
                </div>
                <div className="space-y-2 mb-6 border-l-2 border-gray-100 pl-3"><div className="text-sm text-gray-600 truncate"><span className="font-bold text-xs uppercase text-gray-400 mr-2">From</span> {req.pickup_address}</div><div className="text-sm text-gray-600 truncate"><span className="font-bold text-xs uppercase text-gray-400 mr-2">To</span> {req.dropoff_address}</div></div>
                <button
                  onClick={() => !myActiveJob && handleClaim(req.id)}
                  disabled={!!myActiveJob}
                  className="w-full bg-black text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors flex justify-center items-center gap-2 btn-press disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {myActiveJob ? 'Finish Active Job First' : 'Apply for Job'} <ArrowRight size={16}/>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
};

export default Marketplace;
