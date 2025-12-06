import { useState, useEffect } from 'react';
import { RefreshCw, Navigation, ArrowRight, ChevronRight, User as UserIcon, Loader2 } from 'lucide-react';
import AppLogo from './AppLogo';
import { type Mission, type UserProfile, type MissionStatus } from '../types';
import ActiveJobView from './ActiveJobView';
import { supabase } from '../lib/supabase';
import { api } from '../lib/api';

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

const Marketplace = ({
    requests: missions, // Alias to reuse logic
    userId,
    onRefresh,
    userProfile,
    onViewProfile,
    onRateUser
}: {
    requests: Mission[],
    onClaim: (id: string) => Promise<void> | void,
    onUpdateStatus: (id: string, status: string) => void,
    userId: string,
    onRefresh: () => void,
    userProfile: UserProfile,
    onViewProfile?: (userId: string) => void,
    onRateUser?: (req: Mission) => void
}) => {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [viewActiveJob, setViewActiveJob] = useState(false);
    const [applyingId, setApplyingId] = useState<string | null>(null);

    const handleRefresh = async () => { setIsRefreshing(true); await onRefresh(); setTimeout(() => setIsRefreshing(false), 500); };

    const handleApply = async (id: string) => {
        setApplyingId(id);
        const res = await api.applyToMission(userId, id);
        if (res.error || !res.data.success) {
            alert(res.error?.message || res.data?.message || "Failed to apply.");
        } else {
            // Optimistic update or wait for realtime
            onRefresh();
        }
        setApplyingId(null);
    };

    // My Active Job: Any job where I am assigned OR I applied
    // Actually, "Active" for runner means assigned. "Applied" is just pending.
    // The previous code blocked taking new jobs if "pending_runner" (applied).
    // Prompt: "Clicking 'Apply' ... MUST NOT transition ... to active_mission ... Apply = application only."
    // BUT Prompt 5 says: "Marketplace: list open missions... Apply button... If mission assigned... show Active UI"
    // So "Active Job Banner" should only show for ASSIGNED missions.

    // However, can a runner apply to multiple?
    // Prompt 8 "Multiple applicants: Two runners apply". This implies yes.
    // So "Applied" status should NOT block seeing the marketplace.
    // BUT "Runner already has an active mission" RPC check implies strict 1 active mission.
    // The RPC check `active_mission_count` checks statuses: 'runner_selected', 'awaiting_payment', 'payment_submitted', 'payment_verified', 'active_mission', 'proof_submitted'.
    // It does NOT check 'pending_runner_confirmation' (applicant).
    // So I can apply to many. Once ONE is confirmed, I am blocked from OTHERS.

    // So `myActiveJob` should be one where I am the `runner_id` AND status is advanced.
    const myActiveJob = missions.find(r =>
        r.runner_id === userId &&
        ['runner_selected', 'awaiting_payment', 'payment_submitted', 'payment_verified', 'active_mission', 'proof_submitted', 'awaiting_student_confirmation'].includes(r.status)
    );

    // Also need to know which jobs I have applied to, to show "Applied" button state.
    const [myApplications, setMyApplications] = useState<string[]>([]);

    useEffect(() => {
        const fetchApps = async () => {
             const { data } = await supabase.from('mission_applicants').select('mission_id').eq('runner_id', userId);
             if (data) setMyApplications(data.map(d => d.mission_id));
        };
        fetchApps();
        // Subscribe to my applications
        const ch = supabase.channel(`my_apps:${userId}`)
           .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mission_applicants', filter: `runner_id=eq.${userId}` }, (p) => {
               setMyApplications(prev => [...prev, p.new.mission_id]);
           })
           .subscribe();
        return () => { supabase.removeChannel(ch); };
    }, [userId]);


    // Helper to get banner content based on status
    const getBannerContent = (status: MissionStatus) => {
        switch (status) {
            case 'runner_selected': return { title: 'Application Accepted!', sub: 'Waiting for payment...' };
            case 'awaiting_payment': return { title: 'Application Accepted!', sub: 'Waiting for payment...' };
            case 'payment_submitted': return { title: 'Payment Received', sub: 'Verify payment to start' };
            case 'payment_verified': return { title: 'Payment Verified', sub: 'Mission is active' };
            case 'active_mission': return { title: 'Mission Active', sub: 'Fulfill the request' };
            default: return { title: 'Mission Update', sub: 'Check status' };
        }
    };

    if (viewActiveJob && myActiveJob) {
        return <ActiveJobView job={myActiveJob} userId={userId} userProfile={userProfile} onClose={() => setViewActiveJob(false)} onRateUser={onRateUser} />;
    }

    // Filter Open Requests: 'requested' OR 'pending_runner_confirmation' (which just means >0 applicants)
    // Actually if status is 'pending_runner_confirmation', it is still open for others to apply?
    // Prompt 2: "pending_runner_confirmation (one or more runners may be in applicants list)"
    // So yes, it should appear in marketplace.
    // However, strict RPC apply_to_request checks: IN ('requested', 'pending_runner_confirmation', 'runner_selected')
    // Wait, if 'runner_selected', usually it's closed. But RPC allows apply? Maybe a fallback.
    // Let's list 'requested' and 'pending_runner_confirmation'.
    const openRequests = missions.filter(r => ['requested', 'pending_runner_confirmation'].includes(r.status));

    return (
      <div className="space-y-6 pb-24 animate-slide-up">
        {/* Banner for Active Job when minimized */}
        {myActiveJob && (
            <div className={`p-4 rounded-xl flex items-center justify-between shadow-lg cursor-pointer transition ${myActiveJob.status === 'payment_submitted' ? 'bg-orange-600 hover:bg-orange-700 animate-pulse' : 'bg-blue-600 hover:bg-blue-700'} text-white`} onClick={() => setViewActiveJob(true)}>
               <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-lg"><AppLogo className="h-5 w-5 text-white"/></div>
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
            {openRequests.map((req, i) => {
              const hasApplied = myApplications.includes(req.id);
              return (
              <div key={req.id} style={{animationDelay: `${i*100}ms`}} className={`stagger-enter bg-white rounded-2xl shadow-sm border border-gray-100 hover-lift transition-all duration-200 p-5 group ${myActiveJob ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-50 p-3 rounded-xl text-2xl">{req.type === 'food' ? '🍔' : req.type === 'printing' ? '🖨️' : '📦'}</div>
                        <div>
                            <h3 className="font-bold text-lg text-gray-900 capitalize leading-none">{req.type}</h3>
                            <JobRequester studentId={req.student_id} onClick={onViewProfile} />
                            <span className="text-xs text-gray-400 block mt-0.5">{new Date(req.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                    </div>
                    <div className="mt-6 text-right">
                        <div className="font-bold text-xl text-green-600">₱{req.price_estimate}</div>
                        {req.item_cost !== undefined && <div className="text-[10px] text-gray-400">Items: ₱{req.item_cost}</div>}
                    </div>
                </div>
                <div className="space-y-2 mb-6 border-l-2 border-gray-100 pl-3"><div className="text-sm text-gray-600 truncate"><span className="font-bold text-xs uppercase text-gray-400 mr-2">From</span> {req.pickup_address}</div><div className="text-sm text-gray-600 truncate"><span className="font-bold text-xs uppercase text-gray-400 mr-2">To</span> {req.dropoff_address}</div></div>
                <button
                  onClick={() => !myActiveJob && !hasApplied && handleApply(req.id)}
                  disabled={!!myActiveJob || hasApplied || applyingId === req.id}
                  className={`w-full py-3 rounded-xl font-bold transition-colors flex justify-center items-center gap-2 btn-press disabled:opacity-50 disabled:cursor-not-allowed ${hasApplied ? 'bg-green-100 text-green-700' : 'bg-black text-white hover:bg-gray-800'}`}
                >
                  {applyingId === req.id ? <Loader2 className="animate-spin" /> : hasApplied ? 'Applied' : myActiveJob ? 'Finish Active Job First' : 'Apply Now'} {!hasApplied && <ArrowRight size={16}/>}
                </button>
              </div>
            )})}
          </div>
        )}
      </div>
    );
};

export default Marketplace;
