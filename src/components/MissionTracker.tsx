import { useState, useEffect } from 'react';
import { Clock, CheckCircle, DollarSign, Navigation, Star, X, Package, Copy, MessageCircle, Phone, MapPin, User as UserIcon, QrCode } from 'lucide-react';
import { type Mission, type MissionStatus, type UserProfile, type MissionApplicant } from '../types';
import ChatBox from './ChatBox';
import MapViewer from './MapViewer';
import PaymentUpload from './PaymentUpload';
import { copyToClipboard } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { api } from '../lib/api';

// Sub-component for fetching runner name and allowing profile click
const RunnerInfo = ({ runnerId, onClick }: { runnerId?: string, onClick?: (id: string) => void }) => {
    const [runnerName, setRunnerName] = useState<string>('Unassigned');
    useEffect(() => {
        const fetchName = async () => {
            if (runnerId) {
                const { data } = await supabase.from('users').select('name').eq('id', runnerId).single();
                if (data) setRunnerName(data.name);
            } else {
                setRunnerName('Unassigned');
            }
        };
        fetchName();
    }, [runnerId]);

    if (!runnerId) return null;
    return (
        <button
            onClick={() => onClick && onClick(runnerId)}
            className="text-xs text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-full flex items-center gap-1 w-fit hover:bg-blue-100 transition-colors"
        >
            <UserIcon size={10} /> {runnerName}
        </button>
    );
}

// Applicants List Component
const ApplicantList = ({ missionId, onConfirm, onViewProfile }: { missionId: string, onConfirm: (runnerId: string) => void, onViewProfile?: (id: string) => void }) => {
    const [applicants, setApplicants] = useState<MissionApplicant[]>([]);

    useEffect(() => {
        const fetchApplicants = async () => {
            const { data } = await supabase.from('mission_applicants')
                .select('*, runner:runner_id(name, rating, avatar_url)')
                .eq('mission_id', missionId);
            if (data) setApplicants(data as any);
        };
        fetchApplicants();

        const ch = supabase.channel(`applicants:${missionId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'mission_applicants', filter: `mission_id=eq.${missionId}` }, () => {
                fetchApplicants();
            })
            .subscribe();
        return () => { supabase.removeChannel(ch); };
    }, [missionId]);

    if (applicants.length === 0) return <div className="text-xs text-gray-400 italic">Waiting for runners to apply...</div>;

    return (
        <div className="space-y-2 mt-2">
            <h4 className="text-xs font-bold text-gray-500 uppercase">Applicants ({applicants.length})</h4>
            {applicants.map(app => (
                <div key={app.id} className="bg-white border rounded-lg p-3 flex justify-between items-center shadow-sm">
                    <div className="flex items-center gap-2" onClick={() => onViewProfile && onViewProfile(app.runner_id)}>
                         <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                             {app.runner?.name?.[0] || 'R'}
                         </div>
                         <div>
                             <div className="font-bold text-sm text-gray-900 hover:text-blue-600 cursor-pointer">{app.runner?.name || 'Unknown Runner'}</div>
                             <div className="flex items-center text-xs text-gray-500">
                                 <Star size={10} className="fill-yellow-400 text-yellow-400 mr-1"/> {app.runner?.rating?.toFixed(1) || 'New'}
                             </div>
                         </div>
                    </div>
                    <button
                        onClick={() => onConfirm(app.runner_id)}
                        className="bg-indigo-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-indigo-700 btn-press"
                    >
                        Confirm
                    </button>
                </div>
            ))}
        </div>
    );
};

const PaymentSection = ({ runnerId, missionId, amount, existingProof, status }: { runnerId: string, missionId: string, amount: number, existingProof?: string, status: MissionStatus }) => {
    const [runnerProfile, setRunnerProfile] = useState<UserProfile | null>(null);
    const [uploading, setUploading] = useState(false);
    const [refNumber, setRefNumber] = useState('');
    const [proofUrl, setProofUrl] = useState<string | null>(existingProof || null);

    useEffect(() => {
        const fetchRunner = async () => {
            const { data } = await supabase.from('users').select('*').eq('id', runnerId).single();
            if (data) setRunnerProfile(data);
        };
        fetchRunner();
    }, [runnerId]);

    const handleSubmit = async () => {
        if (!proofUrl || !refNumber) {
            alert("Please upload receipt and enter reference number.");
            return;
        }
        setUploading(true);
        // Using RPC
        // Assuming current user is student (caller of this component)
        // We need student ID, but we can pass it or rely on auth context if we had it here.
        // Actually api call needs studentId. We'll grab from auth in parent or assume the parent passes handlers.
        // BUT for now, let's just use the `api` wrapper but we need current user ID.
        // We will assume `supabase.auth.getUser()` is safe or pass `currentUserId` to `PaymentSection`.

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const res = await api.submitPaymentProof(user.id, missionId, {
            payment_proof_url: proofUrl,
            payment_ref: refNumber
        });

        if (res.error || !res.data.success) {
            alert("Failed to submit payment: " + (res.error?.message || res.data?.message));
        } else {
            // alert("Payment submitted! Waiting for runner confirmation.");
        }
        setUploading(false);
    };

    if (!runnerProfile) return <div className="p-4 text-center"><span className="loading loading-spinner"></span> Loading Payment Details...</div>;

    return (
        <div className="bg-white rounded-xl p-4 border border-blue-200 shadow-sm">
            <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-3 text-center md:text-left">
                    <div className="bg-gray-100 rounded-xl p-3 inline-block mx-auto md:mx-0">
                         {runnerProfile.payment_qr_url ? (
                             <img src={runnerProfile.payment_qr_url} alt="QR Code" className="w-32 h-32 object-contain bg-white rounded-lg" />
                         ) : (
                             <div className="w-32 h-32 flex flex-col items-center justify-center text-gray-400">
                                 <QrCode size={32} />
                                 <span className="text-[10px] mt-1">No QR</span>
                             </div>
                         )}
                    </div>
                    <div>
                        <div className="text-xs text-gray-500 uppercase font-bold">GCash Name</div>
                        <div className="font-bold text-gray-900">{runnerProfile.name}</div>
                    </div>
                    <div>
                         <div className="text-xs text-gray-500 uppercase font-bold">GCash Number</div>
                         <div className="flex items-center justify-center md:justify-start gap-2">
                             <div className="font-mono bg-gray-100 px-2 py-1 rounded text-sm">{runnerProfile.payment_number || runnerProfile.phone || 'N/A'}</div>
                             <button onClick={() => copyToClipboard(runnerProfile.payment_number || runnerProfile.phone || '')} className="text-blue-600 p-1 hover:bg-blue-50 rounded"><Copy size={12}/></button>
                         </div>
                    </div>
                </div>

                <div className="flex-1 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6 space-y-4">
                     <div>
                         <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Total Amount</label>
                         <div className="text-2xl font-black text-blue-600">₱{amount.toFixed(2)}</div>
                     </div>

                     {status === 'payment_submitted' || (status as string) === 'payment_verified' || (existingProof && status !== 'runner_selected') ? (
                         <div className="bg-green-50 p-3 rounded-xl border border-green-100 text-center">
                             <CheckCircle className="mx-auto text-green-600 mb-1" size={24}/>
                             <p className="font-bold text-green-800 text-sm">Payment Submitted</p>
                             <p className="text-xs text-green-600">Waiting for runner verification.</p>
                             {status === 'payment_verified' && <p className="text-xs font-bold text-green-700 mt-1">Verified!</p>}
                         </div>
                     ) : (
                        <>
                            <PaymentUpload onUpload={setProofUrl} currentUrl={proofUrl || undefined} />
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Reference No.</label>
                                <input
                                    type="text"
                                    placeholder="e.g. 1234 5678 9012"
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
                                    value={refNumber}
                                    onChange={(e) => setRefNumber(e.target.value)}
                                />
                            </div>
                            <button
                                onClick={handleSubmit}
                                disabled={uploading || !proofUrl || !refNumber}
                                className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed btn-press"
                            >
                                {uploading ? 'Submitting...' : 'Submit Payment'}
                            </button>
                        </>
                     )}
                </div>
            </div>
        </div>
    );
};

interface MissionTrackerProps {
    missions: Mission[];
    currentUserId: string;
    onRate: (req: Mission, rating: number, comment?: string) => void;
    onViewProfile?: (userId: string) => void;
}

const MissionTracker = ({ missions, currentUserId, onRate, onViewProfile }: MissionTrackerProps) => {
    const [chatMissionId, setChatMissionId] = useState<string | null>(null);
    const [viewProofId, setViewProofId] = useState<string | null>(null);

    const getStatusBadge = (status: MissionStatus) => {
      const config: Record<string, { color: string, icon: any, label: string }> = {
          requested: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Waiting' },
          pending_runner_confirmation: { color: 'bg-indigo-100 text-indigo-800', icon: UserIcon, label: 'Runners Applied' },
          runner_selected: { color: 'bg-blue-100 text-blue-800', icon: DollarSign, label: 'To Pay' },
          awaiting_payment: { color: 'bg-blue-100 text-blue-800', icon: DollarSign, label: 'To Pay' }, // Synonym
          payment_submitted: { color: 'bg-orange-100 text-orange-800', icon: Clock, label: 'Verifying' },
          payment_verified: { color: 'bg-purple-100 text-purple-800', icon: CheckCircle, label: 'Paid' },
          active_mission: { color: 'bg-orange-100 text-orange-800', icon: Navigation, label: 'In Progress' },
          proof_submitted: { color: 'bg-teal-100 text-teal-800', icon: CheckCircle, label: 'Delivered' },
          awaiting_student_confirmation: { color: 'bg-teal-100 text-teal-800', icon: CheckCircle, label: 'Confirming' },
          completed: { color: 'bg-green-100 text-green-800', icon: Star, label: 'Completed' },
          cancelled: { color: 'bg-red-100 text-red-800', icon: X, label: 'Cancelled' },
          disputed: { color: 'bg-red-100 text-red-800', icon: X, label: 'Disputed' }
      };

      const conf = config[status] || { color: 'bg-gray-100', icon: Clock, label: status };
      const Icon = conf.icon;
      return <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${conf.color}`}><Icon size={14} />{conf.label}</div>;
    };

    const handleConfirmRunner = async (missionId: string, runnerId: string) => {
        const res = await api.confirmRunner(currentUserId, missionId, runnerId);
        if (res.error || !res.data.success) {
            alert("Failed to confirm runner: " + (res.error?.message || res.data?.message));
        }
    };

    const handleConfirmDelivery = async (id: string) => {
        // Confirm delivery logic -> Show Rating Modal
        // The rating modal is triggered by parent if we set a "rating pending" state or just call rate directly.
        // But first, update status to completed? No, requirement says "Student confirms delivery -> Rating UI appears; after rating mission status becomes: completed".
        // So we call confirmDelivery RPC first.
        const res = await api.confirmDelivery(currentUserId, id);
        if (res.error || !res.data.success) {
             alert("Error: " + (res.error?.message || res.data?.message));
             return;
        }

        // Now trigger rating. We can assume the parent App.tsx sees the status change (to awaiting_student_confirmation or similar) and shows modal?
        // Or we explicitly tell parent to show rating modal.
        // Let's rely on parent finding the mission and showing rating, OR we just show rating UI here.
        // Prompt says "Rating UI appears".
        // The `onRate` prop can open the modal.
        // We'll pass the mission object.
        const mission = missions.find(m => m.id === id);
        if (mission) onRate(mission, 0);
    };

    const handleDispute = async (id: string) => {
        const reason = window.prompt("Reason for dispute:");
        if (!reason) return;
        await supabase.from('missions').update({ status: 'disputed', student_comment: reason }).eq('id', id);
    };

    const activeMissions = missions.filter(r => r.status !== 'cancelled' && r.status !== 'completed');
    const pastMissions = missions.filter(r => r.status === 'completed' || r.status === 'cancelled').sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return (
      <div className="space-y-6 pb-24 animate-slide-up">
        <div className="flex justify-between items-end"><h2 className="text-2xl font-bold text-gray-900">Track Errands</h2></div>
        {activeMissions.length === 0 && <div className="bg-white p-12 rounded-2xl border-dashed border-2 border-gray-200 text-center pop-in"><div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"><Package className="text-gray-300" size={40} /></div><h3 className="font-bold text-gray-900 mb-1">No active errands</h3><p className="text-gray-500">Create a request to get started!</p></div>}
        {activeMissions.map((mission, i) => (
          <div key={mission.id} style={{animationDelay: `${i*100}ms`}} className="stagger-enter bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover-lift">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                  <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                          <h3 className="font-bold text-xl capitalize text-gray-900 mb-1">{mission.type} Errand</h3>
                          <button onClick={() => copyToClipboard(mission.id)} className="text-gray-400 hover:text-blue-600 p-1"><Copy size={14}/></button>
                      </div>
                      <div className="text-gray-500 text-sm mb-1">{new Date(mission.created_at).toLocaleString()}</div>
                      {mission.runner_id && <RunnerInfo runnerId={mission.runner_id} onClick={onViewProfile} />}
                  </div>
                  {getStatusBadge(mission.status)}
              </div>

              {/* Map View */}
              {(mission.pickup_lat || mission.dropoff_lat) && (
                  <div className="mb-4">
                       <MapViewer
                         pickup={mission.pickup_lat ? { lat: mission.pickup_lat, lng: mission.pickup_lng! } : undefined}
                         dropoff={mission.dropoff_lat ? { lat: mission.dropoff_lat, lng: mission.dropoff_lng! } : undefined}
                       />
                  </div>
              )}

              <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-3"><div className="flex gap-3"><div className="mt-1"><MapPin size={16} className="text-red-500"/></div><div><div className="text-xs font-bold text-gray-500 uppercase">Pickup</div><div className="text-sm font-medium">{mission.pickup_address}</div></div></div><div className="flex gap-3"><div className="mt-1"><Navigation size={16} className="text-green-500"/></div><div><div className="text-xs font-bold text-gray-500 uppercase">Dropoff</div><div className="text-sm font-medium">{mission.dropoff_address}</div></div></div><div className="pt-2 mt-2 border-t border-gray-200"><div className="text-xs font-bold text-gray-500 uppercase mb-1">Details</div><p className="text-sm text-gray-700">{mission.details}</p></div></div>

              {/* Applicants Section */}
              {(mission.status === 'requested' || mission.status === 'pending_runner_confirmation') && (
                  <ApplicantList
                    missionId={mission.id}
                    onConfirm={(runnerId) => handleConfirmRunner(mission.id, runnerId)}
                    onViewProfile={onViewProfile}
                  />
              )}

              {/* Payment Section */}
              {(mission.status === 'runner_selected' || mission.status === 'awaiting_payment' || mission.status === 'payment_submitted') && mission.runner_id && (
                  <div className="mb-4">
                      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                          <h4 className="font-bold text-blue-900 text-sm mb-3 uppercase flex items-center gap-2"><DollarSign size={16}/> Payment Required</h4>
                          <p className="text-xs text-blue-700 mb-4">Please pay the total amount to the runner via GCash to start the task. Upload the receipt below.</p>
                          <PaymentSection
                            runnerId={mission.runner_id}
                            missionId={mission.id}
                            amount={mission.price_estimate}
                            existingProof={mission.payment_proof_url}
                            status={mission.status}
                          />
                      </div>
                  </div>
              )}

              {/* Proof of Delivery Section */}
              {(mission.status === 'proof_submitted' || mission.status === 'awaiting_student_confirmation') && (
                  <div className="mb-4">
                      <div className="bg-green-50 border border-green-100 rounded-xl p-3">
                          <p className="text-xs font-bold text-green-800 mb-2 uppercase">Proof of Delivery</p>
                          {mission.proof_url ? (
                              <img
                                src={mission.proof_url}
                                alt="Proof"
                                className="w-full h-32 object-cover rounded-lg cursor-pointer bg-gray-100"
                                onClick={() => setViewProofId(mission.id)}
                              />
                          ) : (
                              <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs italic">
                                  No proof image available
                              </div>
                          )}
                          <div className="mt-3 flex gap-2">
                              {currentUserId === mission.student_id ? (
                                <>
                                    <button onClick={() => handleConfirmDelivery(mission.id)} className="flex-1 bg-green-600 text-white font-bold py-2 rounded-lg text-sm hover:bg-green-700 btn-press">Confirm Completion & Rate</button>
                                    <button onClick={() => handleDispute(mission.id)} className="px-4 bg-red-100 text-red-700 font-bold py-2 rounded-lg text-sm hover:bg-red-200 btn-press">Dispute</button>
                                </>
                              ) : (
                                <div className="flex-1 bg-yellow-100 text-yellow-800 text-center font-bold py-2 rounded-lg text-sm">Waiting for Confirmation</div>
                              )}
                          </div>
                      </div>
                  </div>
              )}

              <div className="flex justify-between items-center">
                  <div>
                      <div className="text-2xl font-bold text-gray-900">₱{mission.price_estimate}</div>
                      {mission.item_cost !== undefined && <div className="text-xs text-gray-500">Includes ₱{mission.item_cost} Item + ₱49 Fee</div>}
                  </div>
                  {mission.status !== 'requested' && mission.status !== 'pending_runner_confirmation' && (<div className="flex gap-2"><button onClick={() => setChatMissionId(mission.id)} className="flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-lg font-bold text-sm hover:bg-blue-200 btn-press"><MessageCircle size={18} /> Chat</button><button className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-bold text-sm hover:bg-gray-200 btn-press"><Phone size={18} /> Call</button></div>)}
              </div>
            </div>
            {/* Simple progress bar approximation */}
            <div className="h-1.5 bg-gray-100 w-full">
                <div className={`h-full transition-all duration-1000 ${
                    mission.status === 'active_mission' ? 'w-3/5 bg-orange-500' :
                    mission.status === 'completed' ? 'w-full bg-green-500' :
                    'w-1/6 bg-yellow-400'
                }`} />
            </div>
          </div>
        ))}
        {pastMissions.length > 0 && <div className="pt-8 border-t stagger-enter" style={{animationDelay: '200ms'}}><h3 className="text-lg font-bold text-gray-600 mb-4">Past Errands</h3><div className="space-y-4">{pastMissions.map((mission, i) => (<div key={mission.id} style={{animationDelay: `${i*50}ms`}} className="stagger-enter bg-gray-50 rounded-xl p-4 flex justify-between items-center hover:bg-gray-100 transition-colors hover-lift"><div><div className="flex items-center gap-2"><span className="font-bold capitalize text-gray-900">{mission.type}</span>{mission.rating && <span className="flex items-center text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded font-bold"><Star size={10} className="fill-yellow-600 text-yellow-600 mr-1"/> {mission.rating}</span>}</div><span className="text-gray-500 text-xs flex gap-2">{new Date(mission.created_at).toLocaleDateString()} {mission.runner_id && <RunnerInfo runnerId={mission.runner_id} onClick={onViewProfile} />}</span></div>{!mission.student_rating && mission.status === 'completed' ? <button onClick={() => onRate(mission, 0)} className="text-xs bg-black text-white px-3 py-1.5 rounded-lg font-bold hover:bg-gray-800 btn-press">Rate Now</button> : <div className="text-sm font-medium text-green-700 bg-green-100 px-2 py-1 rounded">{mission.status === 'cancelled' ? 'Cancelled' : mission.status === 'disputed' ? 'Disputed' : 'Done'}</div>}</div>))}</div></div>}

        {chatMissionId && (<div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 pop-in"><div className="w-full max-w-md bg-white rounded-xl overflow-hidden relative"><button className="absolute top-2 right-2 text-white z-10" onClick={()=>setChatMissionId(null)}><X/></button><ChatBox requestId={chatMissionId} currentUserId={currentUserId} /></div></div>)}

        {viewProofId && (
            <div className="fixed inset-0 z-[60] bg-black flex items-center justify-center p-4 pop-in" onClick={() => setViewProofId(null)}>
                <img src={missions.find(r => r.id === viewProofId)?.proof_url} alt="Proof Fullscreen" className="max-w-full max-h-full object-contain" />
                <button className="absolute top-4 right-4 text-white bg-white/20 p-2 rounded-full"><X/></button>
            </div>
        )}
      </div>
    );
};

export default MissionTracker;
