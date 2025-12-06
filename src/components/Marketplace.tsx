import { useState, useEffect } from 'react';
import { RefreshCw, Navigation, ArrowRight, ChevronRight, User as UserIcon, Check } from 'lucide-react';
import AppLogo from './AppLogo';
import { type Mission, type UserProfile, type MissionStatus } from '../types';
import ActiveJobView from './ActiveJobView';
import { supabase } from '../lib/supabase';
import { api } from '../lib/api';

// Sub-component for fetching student name in job card
const JobMissioner = ({ studentId, onClick }: { studentId: string, onClick?: (id: string) => void }) => {
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

const Marketplace = ({ missions, userId, onRefresh, userProfile, onViewProfile, onRateUser }: { missions: Mission[], onClaim?: (id: string) => Promise<void> | void, onUpdateStatus?: (id: string, status: MissionStatus) => void, userId: string, onRefresh: () => void, userProfile: UserProfile, onViewProfile?: (userId: string) => void, onRateUser?: (req: Mission) => void }) => {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [viewActiveJob, setViewActiveJob] = useState(false);
    const [myApplications, setMyApplications] = useState<string[]>([]); // Mission IDs where I applied

    // Fetch my applications
    useEffect(() => {
        const fetchApps = async () => {
            const { data } = await supabase.from('mission_applicants').select('mission_id').eq('runner_id', userId);
            if (data) setMyApplications(data.map(d => d.mission_id));
        };
        fetchApps();
        // Subscribe to my applications?
    }, [userId, missions]); // Refetch when missions refresh ideally

    const handleRefresh = async () => { setIsRefreshing(true); await onRefresh(); setTimeout(() => setIsRefreshing(false), 500); };

    const handleApply = async (id: string) => {
        try {
            const res = await api.applyToMission(userId, id);
            if (res.error) throw new Error(res.error.message);
            if (!res.data.success) throw new Error(res.data.message);

            // Optimistically update
            setMyApplications(prev => [...prev, id]);
            alert("Application submitted! Wait for the student to confirm.");
        } catch (error) {
            console.error(error);
            alert(error instanceof Error ? error.message : "Failed to apply.");
        }
    };

    // Determine active job based on new canonical list
    // Runner has active mission if they are assigned (runner_selected) OR further along
    const activeStatuses = [
        'runner_selected',
        'awaiting_payment',
        'payment_submitted',
        'payment_verified',
        'active_mission',
        'proof_submitted',
        'awaiting_student_confirmation'
    ];

    // Disputed? Maybe show in dashboard but not strictly "blocking" active view if we want them to take new jobs?
    // Prompt says: "Runner already has active mission -> return error". So we block.
    // Prompt list for blocking count: "statuses active_mission, payment_verified, etc."
    // Let's stick to the list above.

    const myActiveJob = missions.find(r => r.runner_id === userId && activeStatuses.includes(r.status));

    // Helper to get banner content based on status
    const getBannerContent = (status: MissionStatus) => {
        switch (status) {
            case 'runner_selected':
            case 'awaiting_payment':
                return { title: 'Assigned to Mission', sub: 'Wait for payment' };
            case 'payment_submitted': return { title: 'Payment Submitted', sub: 'Verify payment now' };
            case 'payment_verified': return { title: 'Payment Verified', sub: 'Mission starting...' };
            case 'active_mission': return { title: 'Mission in Progress', sub: 'Click to view details' };
            case 'proof_submitted': return { title: 'Proof Submitted', sub: 'Waiting for student confirmation' };
            default: return { title: 'Mission Update', sub: 'Check status' };
        }
    };

    if (viewActiveJob && myActiveJob) {
        return <ActiveJobView job={myActiveJob} userId={userId} userProfile={userProfile} onClose={() => setViewActiveJob(false)} onRateUser={onRateUser} />;
    }

    const openMissions = missions.filter(r => r.status === 'requested' || r.status === 'pending_runner_confirmation');

    return (
      <div className="space-y-6 pb-24 animate-slide-up">
        {/* Banner for Active Job when minimized */}
        {myActiveJob && (
            <div className={`p-4 rounded-xl flex items-center justify-between shadow-lg cursor-pointer transition ${myActiveJob.status === 'payment_submitted' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700'} text-white`} onClick={() => setViewActiveJob(true)}>
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

        <div className="flex justify-between items-center mb-4"><div><h2 className="text-2xl font-bold text-gray-900">Job Board</h2><p className="text-gray-500 text-sm">Apply for jobs to earn</p></div><button onClick={handleRefresh} disabled={isRefreshing} className="bg-white border p-2 rounded-full shadow-sm hover:bg-gray-50 transition-all btn-press"><RefreshCw size={18} className={`text-gray-600 ${isRefreshing ? 'animate-spin' : ''}`}/></button></div>

        {openMissions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-gray-300 pop-in"><div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mb-4"><Navigation className="text-gray-400" size={32} /></div><div className="text-gray-900 font-bold text-lg">No jobs available</div><p className="text-gray-500">Wait for students to post...</p></div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {openMissions.map((req, i) => {
              const hasApplied = myApplications.includes(req.id);
              return (
              <div key={req.id} style={{animationDelay: `${i*100}ms`}} className={`stagger-enter bg-white rounded-2xl shadow-sm border border-gray-100 hover-lift transition-all duration-200 p-5 group ${myActiveJob && !hasApplied ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-50 p-3 rounded-xl text-2xl">{req.type === 'food' ? '🍔' : req.type === 'printing' ? '🖨️' : '📦'}</div>
                        <div>
                            <h3 className="font-bold text-lg text-gray-900 capitalize leading-none">{req.type}</h3>
                            <JobMissioner studentId={req.student_id} onClick={onViewProfile} />
                            <span className="text-xs text-gray-400 block mt-0.5">{new Date(req.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                    </div>
                    <div className="mt-6 text-right">
                        <div className="font-bold text-xl text-green-600">₱{req.price_estimate}</div>
                        {req.item_cost !== undefined && <div className="text-[10px] text-gray-400">Items: ₱{req.item_cost}</div>}
                    </div>
                </div>
                <div className="space-y-2 mb-6 border-l-2 border-gray-100 pl-3"><div className="text-sm text-gray-600 truncate"><span className="font-bold text-xs uppercase text-gray-400 mr-2">From</span> {req.pickup_address}</div><div className="text-sm text-gray-600 truncate"><span className="font-bold text-xs uppercase text-gray-400 mr-2">To</span> {req.dropoff_address}</div></div>

                {hasApplied ? (
                    <button disabled className="w-full bg-indigo-50 text-indigo-600 py-3 rounded-xl font-bold flex justify-center items-center gap-2 cursor-default">
                        <Check size={18}/> Applied
                    </button>
                ) : (
                    <button
                    onClick={() => !myActiveJob && handleApply(req.id)}
                    disabled={!!myActiveJob}
                    className="w-full bg-black text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors flex justify-center items-center gap-2 btn-press disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                    {myActiveJob ? 'Finish Active Job First' : 'Apply Now'} <ArrowRight size={16}/>
                    </button>
                )}
              </div>
            )})}
          </div>
        )}
      </div>
    );
};

export default Marketplace;
