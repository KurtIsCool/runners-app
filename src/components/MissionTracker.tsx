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

const PaymentSection = ({ runnerId, missionId, amount, existingProof, onSubmitted }: { runnerId: string, missionId: string, amount: number, existingProof?: string, onSubmitted: () => void }) => {
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
        // Call RPC
        const { data, error } = await supabase.auth.getUser(); // Ensure we have user for ID
        if (error || !data.user) {
            setUploading(false);
            return;
        }

        const res = await api.submitPaymentProof(data.user.id, missionId, {
            payment_proof_url: proofUrl,
            payment_ref: refNumber
        });

        if (res.error) {
            alert("Failed to submit payment: " + res.error.message);
        } else if (!res.data.success) {
             alert("Error: " + res.data.message);
        } else {
            alert(res.data.message);
            onSubmitted();
        }
        setUploading(false);
    };

    if (!runnerProfile) return <div className="p-4 text-center"><span className="loading loading-spinner"></span> Loading Payment Details...</div>;

    return (
        <div className="bg-white rounded-xl p-4 border border-blue-200 shadow-sm animate-fade-in">
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
                         <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Total Amount (Fee included)</label>
                         <div className="text-2xl font-black text-blue-600">₱{amount.toFixed(2)}</div>
                         <div className="text-xs text-gray-500">Breakdown: Task Cost + ₱49 Fee</div>
                     </div>

                     {existingProof ? (
                         <div className="bg-green-50 p-3 rounded-xl border border-green-100 text-center">
                             <CheckCircle className="mx-auto text-green-600 mb-1" size={24}/>
                             <p className="font-bold text-green-800 text-sm">Payment Submitted</p>
                             <p className="text-xs text-green-600">Waiting for runner confirmation</p>
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

const ApplicantList = ({ missionId, studentId, onConfirm }: { missionId: string, studentId: string, onConfirm: (runnerId: string) => void }) => {
    const [applicants, setApplicants] = useState<MissionApplicant[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchApplicants = async () => {
        const { data, error } = await supabase
            .from('mission_applicants')
            .select('*, runner:runner_id(*)') // Fetch runner details joined
            .eq('mission_id', missionId);
        if (!error && data) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setApplicants(data as any);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchApplicants();
        // Subscribe to new applicants
        const ch = supabase.channel(`applicants:${missionId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'mission_applicants', filter: `mission_id=eq.${missionId}` }, () => {
                fetchApplicants();
            })
            .subscribe();
        return () => { supabase.removeChannel(ch); };
    }, [missionId]);

    const handleConfirm = async (runnerId: string) => {
        if (!confirm("Confirm this runner?")) return;
        const res = await api.confirmRunner(studentId, missionId, runnerId);
        if (res.error) {
            alert("Error: " + res.error.message);
        } else if (!res.data.success) {
            alert(res.data.message);
        } else {
            // Success handled by parent re-render via realtime
            onConfirm(runnerId);
        }
    };

    if (loading) return <div className="text-xs text-gray-400">Loading applicants...</div>;
    if (applicants.length === 0) return <div className="text-sm text-gray-500 italic bg-gray-50 p-3 rounded-lg border border-dashed border-gray-200 text-center">No applicants yet. Waiting for runners...</div>;

    return (
        <div className="space-y-3 mt-3 animate-fade-in">
            <h4 className="text-xs font-bold text-gray-500 uppercase">Applicants ({applicants.length})</h4>
            {applicants.map(app => (
                <div key={app.id} className="bg-indigo-50 border border-indigo-100 p-3 rounded-xl flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-700 font-bold">
                            {app.runner?.name?.[0]?.toUpperCase() || 'R'}
                        </div>
                        <div>
                            <div className="font-bold text-sm text-gray-900">{app.runner?.name || 'Unknown Runner'}</div>
                            <div className="flex items-center text-xs text-gray-500 gap-2">
                                <span className="flex items-center text-yellow-600 font-bold"><Star size={10} className="fill-yellow-600 mr-0.5"/> {app.runner?.rating?.toFixed(1) || 'N/A'}</span>
                                <span>• {new Date(app.applied_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => handleConfirm(app.runner_id)}
                        className="bg-indigo-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-indigo-700 btn-press"
                    >
                        Confirm
                    </button>
                </div>
            ))}
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
      const config = {
          requested: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Waiting' },
          pending_runner_confirmation: { color: 'bg-indigo-100 text-indigo-800', icon: UserIcon, label: 'Reviewing Runners' },
          runner_selected: { color: 'bg-blue-100 text-blue-800', icon: DollarSign, label: 'To Pay' },
          awaiting_payment: { color: 'bg-blue-100 text-blue-800', icon: DollarSign, label: 'To Pay' }, // Synonym
          payment_submitted: { color: 'bg-orange-100 text-orange-800', icon: Clock, label: 'Verifying Payment' },
          payment_verified: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle, label: 'Payment Verified' },
          active_mission: { color: 'bg-orange-100 text-orange-800', icon: Navigation, label: 'On Mission' },
          proof_submitted: { color: 'bg-teal-100 text-teal-800', icon: CheckCircle, label: 'Proof Submitted' },
          awaiting_student_confirmation: { color: 'bg-teal-100 text-teal-800', icon: CheckCircle, label: 'Confirm Delivery' },
          completed: { color: 'bg-green-100 text-green-800', icon: Star, label: 'Completed' },
          disputed: { color: 'bg-red-100 text-red-800', icon: X, label: 'Disputed' },
          cancelled: { color: 'bg-gray-100 text-gray-800', icon: X, label: 'Cancelled' }
      }[status] || { color: 'bg-gray-100', icon: Clock, label: status.replace(/_/g, ' ') };

      // Override for specific display needs if any, keeping it simple
      const Icon = config.icon;
      return <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${config.color}`}><Icon size={14} />{config.label}</div>;
    };

    const handleConfirmDelivery = async (id: string) => {
        const res = await api.confirmDelivery(currentUserId, id);
        if (res.error || (res.data && !res.data.success)) {
            alert("Error: " + (res.error?.message || res.data?.message));
        } else {
            // Trigger Rating Modal via parent callback if needed, or let parent handle the status change detection
            // The status becomes 'awaiting_student_confirmation' or 'completed' depending on RPC?
            // Prompt says: "Set delivery_confirmed_at=now(), show Rating UI... status='completed'"
            // My RPC implementation sets 'awaiting_student_confirmation' to trigger UI.
            // Wait, the prompt says "after rating mission status becomes: completed".
            // So we need to show rating modal now.

            // We can trigger onRate immediately if the status changes to awaiting_student_confirmation
            // Or we check status in the list below.
        }
    };

    // Check for rating trigger
    useEffect(() => {
        const toRate = missions.find(m => m.status === 'awaiting_student_confirmation' || (m.status === 'proof_submitted' && false /* handled by button */));
        if (toRate && !toRate.student_rating) {
            // Logic to trigger modal? Handled by App.tsx generally?
            // App.tsx uses `setShowRatingModal` but here we just have onRate.
            // We'll let the button trigger it or let the user click "Rate"
        }
    }, [missions]);

    const handleDispute = async (id: string) => {
        const reason = window.prompt("Please state the reason for the dispute (e.g. Items missing, Wrong items):");
        if (reason === null) return;
        const { error } = await supabase.from('missions').update({ status: 'disputed', student_comment: reason }).eq('id', id);
        if (error) alert('Error disputing request');
    };

    const activeMissions = missions.filter(r => r.status !== 'cancelled' && r.status !== 'completed');
    const pastMissions = missions.filter(r => r.status === 'completed' || r.status === 'cancelled').sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return (
      <div className="space-y-6 pb-24 animate-slide-up">
        <div className="flex justify-between items-end"><h2 className="text-2xl font-bold text-gray-900">Track Errands</h2></div>

        {activeMissions.length === 0 && <div className="bg-white p-12 rounded-2xl border-dashed border-2 border-gray-200 text-center pop-in"><div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"><Package className="text-gray-300" size={40} /></div><h3 className="font-bold text-gray-900 mb-1">No active errands</h3><p className="text-gray-500">Create a request to get started!</p></div>}

        {activeMissions.map((req, i) => (
          <div key={req.id} style={{animationDelay: `${i*100}ms`}} className="stagger-enter bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover-lift">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                  <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                          <h3 className="font-bold text-xl capitalize text-gray-900 mb-1">{req.type} Errand</h3>
                          <button onClick={() => copyToClipboard(req.id)} className="text-gray-400 hover:text-blue-600 p-1"><Copy size={14}/></button>
                      </div>
                      <div className="text-gray-500 text-sm mb-1">{new Date(req.created_at).toLocaleString()}</div>
                      {req.runner_id && <RunnerInfo runnerId={req.runner_id} onClick={onViewProfile} />}
                  </div>
                  {getStatusBadge(req.status)}
              </div>

              {/* Map View */}
              {(req.pickup_lat || req.dropoff_lat) && (
                  <div className="mb-4">
                       <MapViewer
                         pickup={req.pickup_lat ? { lat: req.pickup_lat, lng: req.pickup_lng! } : undefined}
                         dropoff={req.dropoff_lat ? { lat: req.dropoff_lat, lng: req.dropoff_lng! } : undefined}
                       />
                  </div>
              )}

              <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-3"><div className="flex gap-3"><div className="mt-1"><MapPin size={16} className="text-red-500"/></div><div><div className="text-xs font-bold text-gray-500 uppercase">Pickup</div><div className="text-sm font-medium">{req.pickup_address}</div></div></div><div className="flex gap-3"><div className="mt-1"><Navigation size={16} className="text-green-500"/></div><div><div className="text-xs font-bold text-gray-500 uppercase">Dropoff</div><div className="text-sm font-medium">{req.dropoff_address}</div></div></div><div className="pt-2 mt-2 border-t border-gray-200"><div className="text-xs font-bold text-gray-500 uppercase mb-1">Details</div><p className="text-sm text-gray-700">{req.details}</p></div></div>

              {/* Applicants List (Requested / Pending Confirmation) */}
              {(req.status === 'requested' || req.status === 'pending_runner_confirmation') && (
                  <ApplicantList
                    missionId={req.id}
                    studentId={currentUserId}
                    onConfirm={() => {/* Realtime update will handle UI transition */}}
                  />
              )}

              {/* Payment Section - When Runner Selected */}
              {(req.status === 'runner_selected' || req.status === 'awaiting_payment' || (req.status === 'payment_submitted' && !req.payment_status)) && req.runner_id && (
                  <div className="mb-4">
                      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                          <h4 className="font-bold text-blue-900 text-sm mb-3 uppercase flex items-center gap-2"><DollarSign size={16}/> Payment Required</h4>
                          <p className="text-xs text-blue-700 mb-4">Please pay the total amount to the runner via GCash to start the task.</p>
                          <PaymentSection
                            runnerId={req.runner_id}
                            missionId={req.id}
                            amount={req.price_estimate}
                            existingProof={req.payment_proof_url}
                            onSubmitted={() => {}}
                          />
                      </div>
                  </div>
              )}

              {/* Payment Submitted - Waiting for Verification */}
              {req.status === 'payment_submitted' && (
                  <div className="mb-4 bg-orange-50 border border-orange-100 rounded-xl p-4 flex items-center gap-3">
                      <Clock className="text-orange-500" />
                      <div>
                          <p className="font-bold text-orange-900 text-sm">Payment Verification Pending</p>
                          <p className="text-xs text-orange-700">The runner is verifying your payment. The mission will start shortly.</p>
                      </div>
                  </div>
              )}

              {/* Proof of Delivery / Confirmation Section */}
              {(req.status === 'proof_submitted' || req.status === 'awaiting_student_confirmation') && (
                  <div className="mb-4">
                      <div className="bg-green-50 border border-green-100 rounded-xl p-3">
                          <p className="text-xs font-bold text-green-800 mb-2 uppercase">Proof of Delivery</p>
                          {req.proof_url ? (
                              <img
                                src={req.proof_url}
                                alt="Proof"
                                className="w-full h-32 object-cover rounded-lg cursor-pointer bg-gray-100"
                                onClick={() => setViewProofId(req.id)}
                              />
                          ) : (
                              <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs italic">
                                  No proof image available
                              </div>
                          )}
                          <div className="mt-3 flex gap-2">
                              {currentUserId === req.student_id ? (
                                req.status === 'awaiting_student_confirmation' ? (
                                     <button onClick={() => onRate(req, 0)} className="flex-1 bg-black text-white font-bold py-2 rounded-lg text-sm hover:bg-gray-800 btn-press">Rate Runner to Complete</button>
                                ) : (
                                     <>
                                        <button onClick={() => handleConfirmDelivery(req.id)} className="flex-1 bg-green-600 text-white font-bold py-2 rounded-lg text-sm hover:bg-green-700 btn-press">Confirm Delivery</button>
                                        <button onClick={() => handleDispute(req.id)} className="px-4 bg-red-100 text-red-700 font-bold py-2 rounded-lg text-sm hover:bg-red-200 btn-press">Dispute</button>
                                     </>
                                )
                              ) : (
                                <div className="flex-1 bg-yellow-100 text-yellow-800 text-center font-bold py-2 rounded-lg text-sm">Waiting for Confirmation</div>
                              )}
                          </div>
                      </div>
                  </div>
              )}

              <div className="flex justify-between items-center">
                  <div>
                      <div className="text-2xl font-bold text-gray-900">₱{req.price_estimate}</div>
                      {req.item_cost !== undefined && <div className="text-xs text-gray-500">Includes ₱{req.item_cost} Item + ₱49 Fee</div>}
                  </div>
                  {req.status !== 'requested' && (<div className="flex gap-2"><button onClick={() => setChatMissionId(req.id)} className="flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-lg font-bold text-sm hover:bg-blue-200 btn-press"><MessageCircle size={18} /> Chat</button><button className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-bold text-sm hover:bg-gray-200 btn-press"><Phone size={18} /> Call</button></div>)}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="h-1.5 bg-gray-100 w-full">
                <div className={`h-full transition-all duration-1000 ${
                    ['requested', 'pending_runner_confirmation'].includes(req.status) ? 'w-1/6 bg-yellow-400' :
                    ['runner_selected', 'awaiting_payment'].includes(req.status) ? 'w-2/6 bg-blue-400' :
                    ['payment_submitted', 'payment_verified'].includes(req.status) ? 'w-3/6 bg-indigo-500' :
                    req.status === 'active_mission' ? 'w-4/6 bg-orange-500' :
                    req.status === 'proof_submitted' ? 'w-5/6 bg-teal-500' :
                    'w-full bg-green-500'
                }`} />
            </div>
          </div>
        ))}
        {pastMissions.length > 0 && <div className="pt-8 border-t stagger-enter" style={{animationDelay: '200ms'}}><h3 className="text-lg font-bold text-gray-600 mb-4">Past Errands</h3><div className="space-y-4">{pastMissions.map((req, i) => (<div key={req.id} style={{animationDelay: `${i*50}ms`}} className="stagger-enter bg-gray-50 rounded-xl p-4 flex justify-between items-center hover:bg-gray-100 transition-colors hover-lift"><div><div className="flex items-center gap-2"><span className="font-bold capitalize text-gray-900">{req.type}</span>{req.rating && <span className="flex items-center text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded font-bold"><Star size={10} className="fill-yellow-600 text-yellow-600 mr-1"/> {req.rating}</span>}</div><span className="text-gray-500 text-xs flex gap-2">{new Date(req.created_at).toLocaleDateString()} {req.runner_id && <RunnerInfo runnerId={req.runner_id} onClick={onViewProfile} />}</span></div>{!req.rating && req.status === 'completed' ? <button onClick={() => onRate(req, 0)} className="text-xs bg-black text-white px-3 py-1.5 rounded-lg font-bold hover:bg-gray-800 btn-press">Rate Now</button> : <div className="text-sm font-medium text-green-700 bg-green-100 px-2 py-1 rounded">{req.status === 'cancelled' ? 'Cancelled' : req.status === 'disputed' ? 'Disputed' : 'Done'}</div>}</div>))}</div></div>}

        {chatMissionId && (<div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 pop-in"><div className="w-full max-w-md bg-white rounded-xl overflow-hidden relative"><button className="absolute top-2 right-2 text-white z-10" onClick={()=>setChatMissionId(null)}><X/></button><ChatBox requestId={chatMissionId} currentUserId={currentUserId} /></div></div>)}

        {/* Fullscreen Image Preview */}
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
