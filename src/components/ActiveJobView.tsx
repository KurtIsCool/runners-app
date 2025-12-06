import { useState, useEffect } from 'react';
import { Minimize2, QrCode, CheckCircle, Star, MapPin, Navigation, Loader2, MessageCircle, Camera, X } from 'lucide-react';
import { type Mission, type UserProfile } from '../types';
import ChatBox from './ChatBox';
import ProofUpload from './ProofUpload';
import { supabase } from '../lib/supabase';
import { api } from '../lib/api';

const ActiveJobView = ({ job, userId, userProfile, onClose, onRateUser }: { job: Mission, userId: string, userProfile: UserProfile, onClose: () => void, onRateUser?: (req: Mission) => void }) => {
    const [updating, setUpdating] = useState(false);
    const [showPayment, setShowPayment] = useState(false);
    const [studentName, setStudentName] = useState<string>('Student');
    const [proofUrl, setProofUrl] = useState<string | null>(job.proof_url || null);
    const [showProofUpload, setShowProofUpload] = useState(false);
    const [verifyingPayment, setVerifyingPayment] = useState(false);
    const [showPaymentProof, setShowPaymentProof] = useState(false);

    useEffect(() => {
        const fetchStudentName = async () => {
            if (job.student_id) {
                const { data } = await supabase.from('users').select('name').eq('id', job.student_id).single();
                if (data) setStudentName(data.name);
            }
        };
        fetchStudentName();
    }, [job.student_id]);


    const confirmPayment = async () => {
        if (!confirm("Confirm that you have received the payment?")) return;
        setVerifyingPayment(true);

        // Use RPC
        const res = await api.verifyPayment(userId, job.id, true);
        if (res.error || !res.data.success) {
            alert("Failed to verify payment: " + (res.error?.message || res.data?.message));
        }
        setVerifyingPayment(false);
    };

    const handleProofUpload = async (url: string) => {
        setProofUrl(url);
    };

    const submitDelivery = async () => {
        if (!proofUrl) {
            alert("Please upload a proof of delivery first.");
            return;
        }
        setUpdating(true);

        const res = await api.submitProofOfDelivery(userId, job.id, proofUrl);
        if (res.error || !res.data.success) {
             alert("Failed to submit proof: " + (res.error?.message || res.data?.message));
        } else {
             setShowProofUpload(false);
        }
        setUpdating(false);
    };

    return (
      <div className="fixed inset-0 bg-gray-100 z-[60] flex flex-col md:flex-row pop-in">
        {/* Left Side: Job Details */}
        <div className="w-full md:w-1/2 lg:w-1/3 bg-white flex flex-col border-r shadow-xl z-10 md:h-full order-1 h-[45vh]">
          <div className="bg-blue-900 text-white p-6 pb-6 relative overflow-hidden shrink-0">
             <div className="absolute top-4 right-4 z-20">
               <button onClick={onClose} className="bg-white/20 hover:bg-white/30 p-2 rounded-full backdrop-blur-sm transition-all">
                 <Minimize2 size={20} className="text-white"/>
               </button>
             </div>

             <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-2xl animate-blob"></div>
             <div className="relative z-10 mt-4">
               <div className="flex justify-between items-center mb-1">
                   <span className="bg-blue-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-widest animate-pulse">Active Mission</span>
                   <div className="text-right">
                       <div className="font-bold text-xl">₱{job.price_estimate}</div>
                       {job.item_cost !== undefined && <div className="text-[10px] text-blue-200">Collect ₱{job.price_estimate}</div>}
                   </div>
               </div>
               <h2 className="text-xl font-bold capitalize mb-1">{job.type}</h2>
               <div className="flex items-center gap-2 text-blue-200 text-xs">
                   <span>Order for {studentName}</span>
                   <button onClick={() => setShowPayment(true)} className="ml-auto flex items-center gap-1 bg-blue-800 hover:bg-blue-700 px-2 py-0.5 rounded text-[10px] text-white btn-press"><QrCode size={10} /> GCash</button>
               </div>
             </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
             <div className="bg-white rounded-xl p-3 border shadow-sm">
                <div className="text-[10px] font-bold text-gray-400 uppercase mb-3 tracking-wide">Current Status</div>
                <div className="flex items-center justify-between relative px-2">
                   <div className="absolute top-3 left-0 w-full h-0.5 bg-gray-100 -z-10"></div>
                   {/* Simplified stepper for pre-active states */}
                   {['runner_selected', 'awaiting_payment', 'payment_submitted', 'payment_verified'].includes(job.status) ? (
                        <div className="flex items-center justify-center w-full py-2">
                            <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                                {job.status === 'runner_selected' && "Assigned - Waiting Payment"}
                                {job.status === 'awaiting_payment' && "Assigned - Waiting Payment"}
                                {job.status === 'payment_submitted' && "Action Required: Verify Payment"}
                                {job.status === 'payment_verified' && "Payment Verified"}
                            </span>
                        </div>
                   ) : (
                       [{s: 'active_mission', icon: CheckCircle, label: 'Active'}, {s: 'proof_submitted', icon: Camera, label: 'Submitted'}, {s: 'awaiting_student_confirmation', icon: CheckCircle, label: 'Confirming'}, {s: 'completed', icon: Star, label: 'Done'}].map((step) => {
                          const isActive = step.s === job.status;
                          const Icon = step.icon;
                          return (
                            <div key={step.s} className="flex flex-col items-center">
                               <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${isActive ? 'bg-blue-600 border-blue-600 text-white scale-125 shadow-lg' : 'bg-white border-gray-200 text-gray-200'}`}><Icon size={12} /></div>
                               <span className={`text-[9px] mt-1 font-bold ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>{step.label}</span>
                            </div>
                          )
                       })
                   )}
                </div>
             </div>

             {/* Status specific cards */}
             {(job.status === 'runner_selected' || job.status === 'awaiting_payment') && (
                 <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                     <p className="text-sm text-blue-800 text-center font-bold">Assignment Confirmed!</p>
                     <p className="text-xs text-blue-600 text-center mt-1">Waiting for the student to send payment (₱{job.price_estimate}).</p>
                 </div>
             )}

             {/* Payment Verification Section */}
             {(job.status === 'payment_submitted') && (
                <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 animate-pulse">
                    <h3 className="font-bold text-orange-800 text-sm mb-2 flex items-center gap-2"><CheckCircle size={16}/> Payment Verification</h3>
                    {job.payment_proof_url ? (
                        <div>
                            <p className="text-xs text-orange-700 mb-2">Student has submitted payment. Please verify.</p>
                            <button onClick={() => setShowPaymentProof(true)} className="w-full bg-white border border-orange-200 text-orange-700 font-bold py-2 rounded-lg text-xs mb-2 hover:bg-orange-100">View Receipt</button>
                            <button onClick={confirmPayment} disabled={verifyingPayment} className="w-full bg-orange-600 text-white font-bold py-3 rounded-lg text-sm hover:bg-orange-700 btn-press">
                                {verifyingPayment ? 'Verifying...' : 'Confirm Payment Received'}
                            </button>
                            <button onClick={() => {
                                const reason = prompt("Enter reason for rejection:");
                                if (reason) api.verifyPayment(userId, job.id, false, reason);
                            }} className="w-full mt-2 bg-red-100 text-red-700 font-bold py-2 rounded-lg text-xs hover:bg-red-200">
                                Reject Payment
                            </button>
                        </div>
                    ) : (
                        <p className="text-xs text-orange-700">Waiting for payment proof...</p>
                    )}
                </div>
             )}

             <div className="grid grid-cols-1 gap-3 stagger-enter">
                <div className="bg-white p-3 rounded-xl border border-gray-100 flex gap-3 items-center">
                    <div className="bg-red-50 p-2 rounded-lg"><MapPin className="text-red-500" size={18}/></div>
                    <div><div className="text-[10px] font-bold text-gray-400 uppercase">Pickup</div><div className="font-bold text-sm text-gray-900 leading-tight">{job.pickup_address}</div></div>
                </div>
                <div className="bg-white p-3 rounded-xl border border-gray-100 flex gap-3 items-center">
                    <div className="bg-green-50 p-2 rounded-lg"><Navigation className="text-green-500" size={18}/></div>
                    <div><div className="text-[10px] font-bold text-gray-400 uppercase">Dropoff</div><div className="font-bold text-sm text-gray-900 leading-tight">{job.dropoff_address}</div></div>
                </div>
             </div>
             <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 stagger-enter shadow-sm"><div className="text-[10px] font-bold text-blue-500 uppercase mb-1">Instructions</div><p className="text-gray-800 text-sm">{job.details}</p></div>

             {proofUrl && (
                 <div className="bg-green-50 p-3 rounded-xl border border-green-100">
                     <p className="text-[10px] font-bold text-green-700 uppercase mb-2">Proof of Delivery Uploaded</p>
                     <img src={proofUrl} alt="Proof" className="w-full h-32 object-cover rounded-lg" />
                 </div>
             )}
          </div>

          <div className="p-4 border-t bg-white pb-safe-nav shrink-0">
             {job.status === 'payment_verified' && (
                  <div className="w-full bg-blue-100 text-blue-800 py-3 rounded-xl font-bold text-base flex items-center justify-center gap-2 text-center animate-pulse">Mission Loading...</div>
             )}
             {/* Main Active State */}
             {job.status === 'active_mission' && (
                 <button
                    disabled={updating}
                    onClick={() => setShowProofUpload(true)}
                    className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold text-base hover:bg-blue-700 flex items-center justify-center gap-2 btn-press shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                    {updating ? <Loader2 className="animate-spin"/> : <>Complete Mission <Camera size={18}/></>}
                 </button>
             )}

             {job.status === 'proof_submitted' && <div className="w-full bg-yellow-100 text-yellow-800 py-3 rounded-xl font-bold text-base flex items-center justify-center gap-2 text-center">Waiting for Confirmation</div>}
             {job.status === 'awaiting_student_confirmation' && <div className="w-full bg-yellow-100 text-yellow-800 py-3 rounded-xl font-bold text-base flex items-center justify-center gap-2 text-center">Student Reviewing Delivery</div>}

             {job.status === 'disputed' && <div className="w-full bg-red-100 text-red-800 py-3 rounded-xl font-bold text-base flex items-center justify-center gap-2 text-center animate-pulse">⚠️ Task Disputed. Contact Support.</div>}

             {job.status === 'completed' && (
                 <div className="space-y-2">
                     <div className="w-full bg-green-100 text-green-800 py-3 rounded-xl font-bold text-base flex items-center justify-center gap-2 text-center"><CheckCircle/> Job Completed!</div>
                     {!job.student_rating && onRateUser && (
                         <button onClick={() => onRateUser(job)} className="w-full bg-black text-white py-3 rounded-xl font-bold text-base hover:bg-gray-800 flex items-center justify-center gap-2 btn-press">
                             <Star size={18} className="text-yellow-400 fill-yellow-400"/> Rate Student
                         </button>
                     )}
                 </div>
             )}
          </div>
        </div>

        {/* Right Side: Chat Box */}
        <div className="flex-1 flex flex-col md:h-full border-t md:border-t-0 md:border-l h-[55vh] order-2 bg-gray-50">
           <div className="bg-white px-4 py-3 border-b flex items-center gap-3 shadow-sm z-10 shrink-0">
               <div className="bg-green-100 p-2 rounded-full"><MessageCircle className="text-green-600" size={20}/></div>
               <div><div className="font-bold text-gray-900 text-sm">Chat with {studentName}</div><div className="text-[10px] text-gray-500">Coordinate details here</div></div>
           </div>
           <div className="flex-1 relative overflow-hidden">
               <div className="absolute inset-0">
                   <ChatBox requestId={job.id} currentUserId={userId} embedded={true} />
               </div>
           </div>
        </div>

        {showPayment && (
          <div className="absolute inset-0 bg-black/80 z-[70] flex items-center justify-center p-6 pop-in">
             <div className="bg-white p-6 rounded-2xl w-full max-w-sm text-center">
                <h3 className="font-bold text-xl mb-2">Scan to Pay</h3>
                <div className="bg-gray-100 w-full aspect-square rounded-lg flex items-center justify-center mb-4 overflow-hidden">
                   {userProfile.payment_qr_url ? <img src={userProfile.payment_qr_url} alt="GCash QR" className="w-full h-full object-contain" /> : <div className="text-center"><QrCode size={64} className="text-gray-400 mx-auto mb-2"/><span className="text-xs text-gray-400">No QR Uploaded</span></div>}
                </div>
                <p className="text-xs text-gray-400 mb-4">Amount: ₱{job.price_estimate}</p>
                <button onClick={() => setShowPayment(false)} className="w-full bg-gray-200 py-3 rounded-lg font-bold hover:bg-gray-300 btn-press">Close</button>
             </div>
          </div>
        )}

        {showPaymentProof && job.payment_proof_url && (
             <div className="absolute inset-0 z-[75] bg-black flex items-center justify-center p-4" onClick={() => setShowPaymentProof(false)}>
                 <div className="relative max-w-full max-h-full">
                     <img src={job.payment_proof_url} alt="Payment Receipt" className="max-w-full max-h-[90vh] object-contain rounded-lg" />
                     {job.payment_ref && <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm font-mono">Ref: {job.payment_ref}</div>}
                     <button className="absolute -top-12 right-0 text-white p-2"><X/></button>
                 </div>
             </div>
        )}

        {showProofUpload && (
             <div className="absolute inset-0 z-[80] bg-black/50 flex items-center justify-center p-4">
                 <div className="bg-white p-6 rounded-2xl w-full max-w-sm">
                     <h3 className="font-bold text-lg mb-4">Complete Delivery</h3>
                     <ProofUpload onUpload={handleProofUpload} currentUrl={proofUrl || undefined} />
                     <div className="flex gap-2 mt-4">
                         <button onClick={() => setShowProofUpload(false)} className="flex-1 py-3 bg-gray-100 rounded-xl font-bold text-gray-600">Cancel</button>
                         <button onClick={submitDelivery} disabled={!proofUrl || updating} className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold disabled:opacity-50">Submit Proof</button>
                     </div>
                 </div>
             </div>
        )}
      </div>
    );
};

export default ActiveJobView;
