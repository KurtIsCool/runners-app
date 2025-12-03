import { useState, useEffect } from 'react';
import { Minimize2, QrCode, CheckCircle, ShoppingBag, Star, MapPin, Navigation, ArrowRight, Loader2, MessageCircle, Camera } from 'lucide-react';
import AppLogo from './AppLogo';
import { type Request, type UserProfile, type RequestStatus } from '../types';
import ChatBox from './ChatBox';
import MapViewer from './MapViewer';
import ProofUpload from './ProofUpload';
import { supabase } from '../lib/supabase';

const ActiveJobView = ({ job, userId, onUpdateStatus, userProfile, onClose }: { job: Request, userId: string, onUpdateStatus: (id: string, status: RequestStatus) => void, userProfile: UserProfile, onClose: () => void }) => {
    const [updating, setUpdating] = useState(false);
    const [showPayment, setShowPayment] = useState(false);
    const [studentName, setStudentName] = useState<string>('Student');
    const [proofUrl, setProofUrl] = useState<string | null>(job.proof_url || null);
    const [showProofUpload, setShowProofUpload] = useState(false);

    useEffect(() => {
        const fetchStudentName = async () => {
            if (job.student_id) {
                const { data } = await supabase.from('users').select('name').eq('id', job.student_id).single();
                if (data) setStudentName(data.name);
            }
        };
        fetchStudentName();
    }, [job.student_id]);

    const handleStatusUpdate = async (status: RequestStatus) => {
        setUpdating(true);
        try {
            await onUpdateStatus(job.id, status);
        } catch {
            alert("Failed to update status.");
        } finally {
            setUpdating(false);
        }
    };

    const handleProofUpload = async (url: string) => {
        setProofUrl(url);
        // Save proof url to supabase
        const { error } = await supabase.from('requests').update({ proof_url: url }).eq('id', job.id);
        if (error) {
            alert('Failed to save proof image');
        } else {
             // After upload, maybe move status to delivered?
             // Or let user click "Mark Delivered" manually.
             // But usually proof is part of delivery.
        }
    };

    const submitDelivery = async () => {
        if (!proofUrl) {
            alert("Please upload a proof of delivery first.");
            return;
        }
        setUpdating(true);
        // Update status to 'delivered' so student can confirm
        await onUpdateStatus(job.id, 'delivered');
        setShowProofUpload(false);
        setUpdating(false);
    };

    return (
      <div className="fixed inset-0 bg-gray-100 z-[60] flex flex-col md:flex-row pop-in">
        {/* Left Side: Job Details */}
        <div className="w-full md:w-1/2 lg:w-1/3 bg-white flex flex-col border-r shadow-xl z-10 md:h-full order-1 h-[45vh]">
          <div className="bg-blue-900 text-white p-6 pb-6 relative overflow-hidden shrink-0">
             {/* BACK BUTTON */}
             <div className="absolute top-4 right-4 z-20">
               <button onClick={onClose} className="bg-white/20 hover:bg-white/30 p-2 rounded-full backdrop-blur-sm transition-all">
                 <Minimize2 size={20} className="text-white"/>
               </button>
             </div>

             <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-2xl animate-blob"></div>
             <div className="relative z-10 mt-4">
               <div className="flex justify-between items-center mb-1">
                   <span className="bg-blue-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-widest animate-pulse">Active Mission</span>
                   <div className="font-bold text-xl">₱{job.price_estimate}</div>
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
                   {[{s: 'accepted', icon: CheckCircle, label: 'Accepted'},{s: 'purchasing', icon: ShoppingBag, label: 'Buying'},{s: 'delivering', icon: () => <AppLogo className="h-3 w-3" />, label: 'Delivery'},{s: 'delivered', icon: Camera, label: 'Delivered'}, {s: 'completed', icon: Star, label: 'Done'}].map((step, idx) => {
                      const isActive = step.s === job.status;
                      const isPast = ['accepted', 'purchasing', 'delivering', 'delivered', 'completed'].indexOf(job.status) >= idx;
                      const Icon = step.icon;
                      return (
                        <div key={step.s} className="flex flex-col items-center">
                           <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${isActive ? 'bg-blue-600 border-blue-600 text-white scale-125 shadow-lg' : isPast ? 'bg-blue-100 border-blue-600 text-blue-600' : 'bg-white border-gray-200 text-gray-200'}`}><Icon size={12} /></div>
                           <span className={`text-[9px] mt-1 font-bold ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>{step.label}</span>
                        </div>
                      )
                   })}
                </div>
             </div>

             {/* Map View */}
             {(job.pickup_lat || job.dropoff_lat) && (
                 <div className="mb-2">
                      <MapViewer
                         pickup={job.pickup_lat ? { lat: job.pickup_lat, lng: job.pickup_lng! } : undefined}
                         dropoff={job.dropoff_lat ? { lat: job.dropoff_lat, lng: job.dropoff_lng! } : undefined}
                      />
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

             {/* Show proof if exists */}
             {proofUrl && (
                 <div className="bg-green-50 p-3 rounded-xl border border-green-100">
                     <p className="text-[10px] font-bold text-green-700 uppercase mb-2">Proof of Delivery Uploaded</p>
                     <img src={proofUrl} alt="Proof" className="w-full h-32 object-cover rounded-lg" />
                 </div>
             )}
          </div>

          <div className="p-4 border-t bg-white pb-safe-nav shrink-0">
             {job.status === 'accepted' && <button disabled={updating} onClick={() => handleStatusUpdate('purchasing')} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold text-base hover:bg-blue-700 flex items-center justify-center gap-2 btn-press shadow-lg shadow-blue-200">{updating ? <Loader2 className="animate-spin"/> : <>Start Purchasing <ArrowRight size={18}/></>}</button>}
             {job.status === 'purchasing' && <button disabled={updating} onClick={() => handleStatusUpdate('delivering')} className="w-full bg-purple-600 text-white py-3 rounded-xl font-bold text-base hover:bg-purple-700 flex items-center justify-center gap-2 btn-press shadow-lg shadow-purple-200">{updating ? <Loader2 className="animate-spin"/> : <>Start Delivering <AppLogo className="h-5 w-5 text-white" /></>}</button>}
             {job.status === 'delivering' && <button disabled={updating} onClick={() => setShowProofUpload(true)} className="w-full bg-green-600 text-white py-3 rounded-xl font-bold text-base hover:bg-green-700 flex items-center justify-center gap-2 btn-press shadow-lg shadow-green-200">{updating ? <Loader2 className="animate-spin"/> : <>Upload Proof & Finish <Camera size={18}/></>}</button>}
             {job.status === 'delivered' && <div className="w-full bg-yellow-100 text-yellow-800 py-3 rounded-xl font-bold text-base flex items-center justify-center gap-2 text-center">Waiting for Student Confirmation</div>}
             {job.status === 'completed' && <div className="w-full bg-green-100 text-green-800 py-3 rounded-xl font-bold text-base flex items-center justify-center gap-2 text-center"><CheckCircle/> Job Completed!</div>}
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
