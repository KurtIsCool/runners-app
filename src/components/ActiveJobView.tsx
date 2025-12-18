import { useState } from 'react';
import { Minimize2, QrCode, CheckCircle, ShoppingBag, Bike, Star, MapPin, Navigation, ArrowRight, Loader2, MessageCircle } from 'lucide-react';
import { type Request, type UserProfile, type RequestStatus } from '../types';
import ChatBox from './ChatBox';

const ActiveJobView = ({ job, userId, onUpdateStatus, userProfile, onClose }: { job: Request, userId: string, onUpdateStatus: (id: string, status: RequestStatus) => void, userProfile: UserProfile, onClose: () => void }) => {
    const [updating, setUpdating] = useState(false);
    const [showPayment, setShowPayment] = useState(false);
    const handleStatusUpdate = async (status: RequestStatus) => { setUpdating(true); try { await onUpdateStatus(job.id, status); } catch { alert("Failed to update status."); } finally { setUpdating(false); } };

    return (
      <div className="fixed inset-0 bg-gray-100 z-[60] flex flex-col md:flex-row pop-in">
        <div className="w-full md:w-1/2 lg:w-1/3 bg-white flex flex-col border-r shadow-xl z-10">
          <div className="bg-blue-900 text-white p-6 pb-8 relative overflow-hidden">
             {/* BACK BUTTON */}
             <div className="absolute top-4 right-4 z-20">
               <button onClick={onClose} className="bg-white/20 hover:bg-white/30 p-2 rounded-full backdrop-blur-sm transition-all">
                 <Minimize2 size={20} className="text-white"/>
               </button>
             </div>

             <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-2xl animate-blob"></div>
             <div className="relative z-10 mt-6">
               <div className="flex justify-between items-center mb-2"><span className="bg-blue-800 text-xs font-bold px-2 py-1 rounded uppercase tracking-widest animate-pulse">Active Mission</span><div className="font-bold text-2xl">₱{job.price_estimate}</div></div>
               <h2 className="text-2xl font-bold capitalize mb-1">{job.type}</h2>
               <div className="flex items-center gap-2 text-blue-200 text-sm"><span>ID: {job.id.slice(0,8)}</span><button onClick={() => setShowPayment(true)} className="ml-2 flex items-center gap-1 bg-blue-800 hover:bg-blue-700 px-2 py-0.5 rounded text-xs text-white btn-press"><QrCode size={12} /> GCash</button></div>
             </div>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
             <div className="bg-gray-50 rounded-xl p-4 border">
                <div className="text-xs font-bold text-gray-500 uppercase mb-4 tracking-wide">Current Status</div>
                <div className="flex items-center justify-between relative">
                   <div className="absolute top-3 left-0 w-full h-0.5 bg-gray-200 -z-10"></div>
                   {[{s: 'accepted', icon: CheckCircle, label: 'Accepted'},{s: 'purchasing', icon: ShoppingBag, label: 'Buying'},{s: 'delivering', icon: Bike, label: 'Delivery'},{s: 'completed', icon: Star, label: 'Done'}].map((step, idx) => {
                      const isActive = step.s === job.status;
                      const isPast = ['accepted', 'purchasing', 'delivering', 'completed'].indexOf(job.status) >= idx;
                      const Icon = step.icon;
                      return (
                        <div key={step.s} className="flex flex-col items-center bg-gray-50 px-1">
                           <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${isActive ? 'bg-blue-600 border-blue-600 text-white scale-125 shadow-lg' : isPast ? 'bg-blue-100 border-blue-600 text-blue-600' : 'bg-white border-gray-300 text-gray-300'}`}><Icon size={14} /></div>
                           <span className={`text-[10px] mt-1 font-bold ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>{step.label}</span>
                        </div>
                      )
                   })}
                </div>
             </div>
             <div className="space-y-4 stagger-enter">
                <div className="flex gap-3"><div className="mt-1"><MapPin className="text-red-500" size={20}/></div><div><div className="text-xs font-bold text-gray-500 uppercase">Pickup</div><div className="font-medium text-lg text-gray-900">{job.pickup_address}</div></div></div>
                <div className="flex gap-3"><div className="mt-1"><Navigation className="text-green-500" size={20}/></div><div><div className="text-xs font-bold text-gray-500 uppercase">Dropoff</div><div className="font-medium text-lg text-gray-900">{job.dropoff_address}</div></div></div>
             </div>
             <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 stagger-enter"><div className="text-xs font-bold text-blue-500 uppercase mb-1">Instructions</div><p className="text-gray-800">{job.details}</p></div>
          </div>
          <div className="p-4 border-t bg-white pb-safe-nav">
             {job.status === 'accepted' && <button disabled={updating} onClick={() => handleStatusUpdate('purchasing')} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 flex items-center justify-center gap-2 btn-press">{updating ? <Loader2 className="animate-spin"/> : <>Start Purchasing <ArrowRight/></>}</button>}
             {job.status === 'purchasing' && <button disabled={updating} onClick={() => handleStatusUpdate('delivering')} className="w-full bg-purple-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-purple-700 flex items-center justify-center gap-2 btn-press">{updating ? <Loader2 className="animate-spin"/> : <>Start Delivering <Bike/></>}</button>}
             {job.status === 'delivering' && <button disabled={updating} onClick={() => handleStatusUpdate('completed')} className="w-full bg-green-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-green-700 flex items-center justify-center gap-2 btn-press">{updating ? <Loader2 className="animate-spin"/> : <>Mark Completed <CheckCircle/></>}</button>}
          </div>
        </div>
        <div className="flex-1 flex flex-col h-[50vh] md:h-full border-t md:border-t-0 md:border-l">
           <div className="bg-white p-4 border-b flex items-center gap-2 shadow-sm z-10"><div className="bg-green-100 p-2 rounded-full"><MessageCircle className="text-green-600" size={18}/></div><div><div className="font-bold text-gray-900">Direct Chat</div><div className="text-xs text-gray-500">Communicate with student</div></div></div>
           <div className="flex-1 relative"><div className="absolute inset-0"><ChatBox requestId={job.id} currentUserId={userId} embedded={true} /></div></div>
        </div>
        {showPayment && (
          <div className="absolute inset-0 bg-black/80 z-[60] flex items-center justify-center p-6 pop-in">
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
      </div>
    );
};

export default ActiveJobView;
