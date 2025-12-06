import { useState, useEffect } from 'react';
import { Clock, CheckCircle, DollarSign, Navigation, Star, X, Package, Copy, MessageCircle, Phone, MapPin, User as UserIcon, QrCode, Banknote, Smartphone } from 'lucide-react';
import { type Request, type RequestStatus, type UserProfile } from '../types';
import ChatBox from './ChatBox';
import MapViewer from './MapViewer';
import PaymentUpload from './PaymentUpload';
import { copyToClipboard } from '../lib/utils';
import { supabase } from '../lib/supabase';

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

const PaymentSection = ({ runnerId, requestId, amount, existingProof }: { runnerId: string, requestId: string, amount: number, existingProof?: string }) => {
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
        const { error } = await supabase.from('requests').update({
            payment_proof_url: proofUrl,
            payment_ref: refNumber,
            status: 'payment_review',
        }).eq('id', requestId);

        if (error) alert("Failed to submit payment");
        else alert("Payment submitted! Waiting for runner confirmation.");
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

interface RequestTrackerProps {
    requests: Request[];
    currentUserId: string;
    onRate: (req: Request, rating: number, comment?: string) => void;
    onViewProfile?: (userId: string) => void;
}

const RequestTracker = ({ requests, currentUserId, onRate, onViewProfile }: RequestTrackerProps) => {
    const [chatRequestId, setChatRequestId] = useState<string | null>(null);
    const [viewProofId, setViewProofId] = useState<string | null>(null);
    const [acceptingRequestId, setAcceptingRequestId] = useState<string | null>(null);

    const handlePaymentSelection = async (method: 'gcash' | 'cash') => {
        if (!acceptingRequestId) return;

        let updateData: any = { payment_method: method };

        if (method === 'gcash') {
            updateData.status = 'awaiting_payment';
        } else {
            updateData.status = 'accepted';
        }

        const { error } = await supabase.from('requests').update(updateData).eq('id', acceptingRequestId);

        if (error) {
            alert('Error updating request');
        } else {
            setAcceptingRequestId(null);
        }
    };

    const getStatusBadge = (status: RequestStatus) => {
      const config = {
          requested: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Waiting' },
          pending_runner: { color: 'bg-indigo-100 text-indigo-800', icon: UserIcon, label: 'Runner Applied' },
          awaiting_payment: { color: 'bg-blue-100 text-blue-800', icon: DollarSign, label: 'To Pay' },
          payment_review: { color: 'bg-orange-100 text-orange-800', icon: Clock, label: 'Verifying' },
          accepted: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle, label: 'Assigned' },
          purchasing: { color: 'bg-purple-100 text-purple-800', icon: DollarSign, label: 'Buying' },
          delivering: { color: 'bg-orange-100 text-orange-800', icon: Navigation, label: 'On the Way' },
          delivered: { color: 'bg-teal-100 text-teal-800', icon: CheckCircle, label: 'Delivered' },
          completed: { color: 'bg-green-100 text-green-800', icon: Star, label: 'Completed' },
          cancelled: { color: 'bg-red-100 text-red-800', icon: X, label: 'Cancelled' },
          disputed: { color: 'bg-red-100 text-red-800', icon: X, label: 'Disputed' }
      }[status] || { color: 'bg-gray-100', icon: Clock, label: status };
      const Icon = config.icon;
      return <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${config.color}`}><Icon size={14} />{config.label}</div>;
    };

    const handleConfirm = async (id: string) => {
        const { error } = await supabase.from('requests').update({ status: 'completed', confirmed_at: new Date().toISOString() }).eq('id', id);
        if (error) alert('Error confirming request');
    };

    const handleDispute = async (id: string) => {
        const reason = window.prompt("Please state the reason for the dispute (e.g. Items missing, Wrong items):");
        if (reason === null) return; // Cancelled
        const { error } = await supabase.from('requests').update({ status: 'disputed', student_comment: reason }).eq('id', id);
        if (error) alert('Error disputing request');
    };

    const activeRequests = requests.filter(r => r.status !== 'cancelled' && r.status !== 'completed');
    const pastRequests = requests.filter(r => r.status === 'completed' || r.status === 'cancelled').sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return (
      <div className="space-y-6 pb-24 animate-slide-up">
        <div className="flex justify-between items-end"><h2 className="text-2xl font-bold text-gray-900">Track Errands</h2></div>
        {activeRequests.length === 0 && <div className="bg-white p-12 rounded-2xl border-dashed border-2 border-gray-200 text-center pop-in"><div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"><Package className="text-gray-300" size={40} /></div><h3 className="font-bold text-gray-900 mb-1">No active errands</h3><p className="text-gray-500">Create a request to get started!</p></div>}
        {activeRequests.map((req, i) => (
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

              {/* Pending Runner - Accept Section */}
              {req.status === 'pending_runner' && req.runner_id && currentUserId === req.student_id && (
                  <div className="mb-4 bg-indigo-50 border border-indigo-100 rounded-xl p-4">
                      <h4 className="font-bold text-indigo-900 text-sm mb-2 flex items-center gap-2"><UserIcon size={16}/> Runner Applied</h4>
                      <p className="text-xs text-indigo-700 mb-4">A runner has offered to take this job. Do you want to accept them?</p>
                      <button
                          onClick={() => setAcceptingRequestId(req.id)}
                          className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 btn-press"
                      >
                          Accept Runner
                      </button>
                  </div>
              )}

              {/* Payment Section */}
              {/* Show payment section if awaiting payment or review. Only if method is GCash. */}
              {((req.status === 'awaiting_payment' || req.status === 'payment_review') || (req.status === 'accepted' && !req.is_paid && req.payment_method === 'gcash')) && req.runner_id && (
                  <div className="mb-4">
                      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                          <h4 className="font-bold text-blue-900 text-sm mb-3 uppercase flex items-center gap-2"><DollarSign size={16}/> Payment Required</h4>
                          <p className="text-xs text-blue-700 mb-4">Please pay the total amount to the runner via GCash to start the task. Upload the receipt below.</p>
                          <PaymentSection runnerId={req.runner_id} requestId={req.id} amount={req.price_estimate} existingProof={req.payment_proof_url} />
                      </div>
                  </div>
              )}

              {/* Proof of Delivery Section */}
              {req.status === 'delivered' && (
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
                                <>
                                    <button onClick={() => handleConfirm(req.id)} className="flex-1 bg-green-600 text-white font-bold py-2 rounded-lg text-sm hover:bg-green-700 btn-press">Confirm Completion</button>
                                    <button onClick={() => handleDispute(req.id)} className="px-4 bg-red-100 text-red-700 font-bold py-2 rounded-lg text-sm hover:bg-red-200 btn-press">Dispute</button>
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
                      <div className="text-2xl font-bold text-gray-900">₱{req.price_estimate}</div>
                      <div className="text-xs text-gray-500">
                        {req.item_cost !== undefined ? (
                           <>Item: ₱{req.item_cost} | Fee: ₱{req.service_fee || 49} {req.additional_cost ? `| Add: ₱${req.additional_cost}` : ''}</>
                        ) : 'Estimated Total'}
                      </div>
                  </div>
                  {req.status !== 'requested' && (<div className="flex gap-2"><button onClick={() => setChatRequestId(req.id)} className="flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-lg font-bold text-sm hover:bg-blue-200 btn-press"><MessageCircle size={18} /> Chat</button><button className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-bold text-sm hover:bg-gray-200 btn-press"><Phone size={18} /> Call</button></div>)}
              </div>
            </div>
            <div className="h-1.5 bg-gray-100 w-full">
                <div className={`h-full transition-all duration-1000 ${
                    req.status === 'requested' ? 'w-1/6 bg-yellow-400' :
                    req.status === 'accepted' ? 'w-2/6 bg-blue-500' :
                    req.status === 'purchasing' ? 'w-3/6 bg-purple-500' :
                    req.status === 'delivering' ? 'w-4/6 bg-orange-500' :
                    req.status === 'delivered' ? 'w-5/6 bg-teal-500' :
                    'w-full bg-green-500'
                }`} />
            </div>
          </div>
        ))}
        {pastRequests.length > 0 && <div className="pt-8 border-t stagger-enter" style={{animationDelay: '200ms'}}><h3 className="text-lg font-bold text-gray-600 mb-4">Past Errands</h3><div className="space-y-4">{pastRequests.map((req, i) => (<div key={req.id} style={{animationDelay: `${i*50}ms`}} className="stagger-enter bg-gray-50 rounded-xl p-4 flex justify-between items-center hover:bg-gray-100 transition-colors hover-lift"><div><div className="flex items-center gap-2"><span className="font-bold capitalize text-gray-900">{req.type}</span>{req.rating && <span className="flex items-center text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded font-bold"><Star size={10} className="fill-yellow-600 text-yellow-600 mr-1"/> {req.rating}</span>}</div><span className="text-gray-500 text-xs flex gap-2">{new Date(req.created_at).toLocaleDateString()} {req.runner_id && <RunnerInfo runnerId={req.runner_id} onClick={onViewProfile} />}</span></div>{!req.rating && req.status === 'completed' ? <button onClick={() => onRate(req, 0)} className="text-xs bg-black text-white px-3 py-1.5 rounded-lg font-bold hover:bg-gray-800 btn-press">Rate Now</button> : <div className="text-sm font-medium text-green-700 bg-green-100 px-2 py-1 rounded">{req.status === 'cancelled' ? 'Cancelled' : req.status === 'disputed' ? 'Disputed' : 'Done'}</div>}</div>))}</div></div>}

        {chatRequestId && (<div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 pop-in"><div className="w-full max-w-md bg-white rounded-xl overflow-hidden relative"><button className="absolute top-2 right-2 text-white z-10" onClick={()=>setChatRequestId(null)}><X/></button><ChatBox requestId={chatRequestId} currentUserId={currentUserId} /></div></div>)}

        {/* Fullscreen Image Preview */}
        {viewProofId && (
            <div className="fixed inset-0 z-[60] bg-black flex items-center justify-center p-4 pop-in" onClick={() => setViewProofId(null)}>
                <img src={requests.find(r => r.id === viewProofId)?.proof_url} alt="Proof Fullscreen" className="max-w-full max-h-full object-contain" />
                <button className="absolute top-4 right-4 text-white bg-white/20 p-2 rounded-full"><X/></button>
            </div>
        )}

        {/* Payment Selection Modal */}
        {acceptingRequestId && (
            <div className="fixed inset-0 z-[70] bg-black/60 flex items-center justify-center p-4 pop-in">
                <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl scale-100 transition-all">
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg text-gray-900">Select Payment Method</h3>
                            <button onClick={() => setAcceptingRequestId(null)} className="bg-gray-100 p-1.5 rounded-full hover:bg-gray-200 transition-all text-gray-600"><X size={16}/></button>
                        </div>
                        <p className="text-sm text-gray-500 mb-6">How would you like to pay for this errand?</p>
                        <div className="space-y-3">
                            <button
                                onClick={() => handlePaymentSelection('gcash')}
                                className="w-full bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl p-4 flex items-center justify-between group transition-all"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="bg-blue-600 text-white p-2 rounded-lg">
                                        <Smartphone size={20} />
                                    </div>
                                    <div className="text-left">
                                        <div className="font-bold text-gray-900">GCash (Pay Now)</div>
                                        <div className="text-[10px] text-gray-500">Upload proof of payment</div>
                                    </div>
                                </div>
                                <div className="h-4 w-4 rounded-full border-2 border-gray-300 group-hover:border-blue-500 transition-colors"></div>
                            </button>

                            <button
                                onClick={() => handlePaymentSelection('cash')}
                                className="w-full bg-green-50 hover:bg-green-100 border border-green-200 rounded-xl p-4 flex items-center justify-between group transition-all"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="bg-green-600 text-white p-2 rounded-lg">
                                        <Banknote size={20} />
                                    </div>
                                    <div className="text-left">
                                        <div className="font-bold text-gray-900">Cash (COD)</div>
                                        <div className="text-[10px] text-gray-500">Pay runner upon delivery</div>
                                    </div>
                                </div>
                                <div className="h-4 w-4 rounded-full border-2 border-gray-300 group-hover:border-green-500 transition-colors"></div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}
      </div>
    );
};

export default RequestTracker;
