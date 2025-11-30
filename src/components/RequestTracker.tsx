import { useState } from 'react';
import { Clock, CheckCircle, DollarSign, Navigation, Star, X, Package, Copy, MessageCircle, Phone, MapPin } from 'lucide-react';
import { type Request, type RequestStatus } from '../types';
import ChatBox from './ChatBox';
import { copyToClipboard } from '../lib/utils';
// import { supabase } from '../lib/supabase'; // Not used in this file but ChatBox uses it.

const RequestTracker = ({ requests, currentUserId, onRate }: { requests: Request[], currentUserId: string, onRate: (req: Request, rating: number) => void }) => {
    const [chatRequestId, setChatRequestId] = useState<string | null>(null);
    const getStatusBadge = (status: RequestStatus) => {
      const config = { requested: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Waiting' }, accepted: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle, label: 'Assigned' }, purchasing: { color: 'bg-purple-100 text-purple-800', icon: DollarSign, label: 'Buying' }, delivering: { color: 'bg-orange-100 text-orange-800', icon: Navigation, label: 'On the Way' }, completed: { color: 'bg-green-100 text-green-800', icon: Star, label: 'Completed' }, cancelled: { color: 'bg-red-100 text-red-800', icon: X, label: 'Cancelled' } }[status] || { color: 'bg-gray-100', icon: Clock, label: status };
      const Icon = config.icon;
      return <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${config.color}`}><Icon size={14} />{config.label}</div>;
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
              <div className="flex justify-between items-start mb-4"><div className="flex flex-col"><div className="flex items-center gap-2"><h3 className="font-bold text-xl capitalize text-gray-900 mb-1">{req.type} Errand</h3><button onClick={() => copyToClipboard(req.id)} className="text-gray-400 hover:text-blue-600 p-1"><Copy size={14}/></button></div><div className="text-gray-500 text-sm">{new Date(req.created_at).toLocaleString()}</div></div>{getStatusBadge(req.status)}</div>
              <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-3"><div className="flex gap-3"><div className="mt-1"><MapPin size={16} className="text-red-500"/></div><div><div className="text-xs font-bold text-gray-500 uppercase">Pickup</div><div className="text-sm font-medium">{req.pickup_address}</div></div></div><div className="flex gap-3"><div className="mt-1"><Navigation size={16} className="text-green-500"/></div><div><div className="text-xs font-bold text-gray-500 uppercase">Dropoff</div><div className="text-sm font-medium">{req.dropoff_address}</div></div></div><div className="pt-2 mt-2 border-t border-gray-200"><div className="text-xs font-bold text-gray-500 uppercase mb-1">Details</div><p className="text-sm text-gray-700">{req.details}</p></div></div>
              <div className="flex justify-between items-center"><div className="text-2xl font-bold text-gray-900">₱{req.price_estimate}</div>{req.status !== 'requested' && (<div className="flex gap-2"><button onClick={() => setChatRequestId(req.id)} className="flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-lg font-bold text-sm hover:bg-blue-200 btn-press"><MessageCircle size={18} /> Chat</button><button className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-bold text-sm hover:bg-gray-200 btn-press"><Phone size={18} /> Call</button></div>)}</div>
            </div>
            <div className="h-1.5 bg-gray-100 w-full"><div className={`h-full transition-all duration-1000 ${req.status === 'requested' ? 'w-1/5 bg-yellow-400' : req.status === 'accepted' ? 'w-2/5 bg-blue-500' : req.status === 'purchasing' ? 'w-3/5 bg-purple-500' : req.status === 'delivering' ? 'w-4/5 bg-orange-500' : 'w-full bg-green-500'}`} /></div>
          </div>
        ))}
        {pastRequests.length > 0 && <div className="pt-8 border-t stagger-enter" style={{animationDelay: '200ms'}}><h3 className="text-lg font-bold text-gray-600 mb-4">Past Errands</h3><div className="space-y-4">{pastRequests.map((req, i) => (<div key={req.id} style={{animationDelay: `${i*50}ms`}} className="stagger-enter bg-gray-50 rounded-xl p-4 flex justify-between items-center hover:bg-gray-100 transition-colors hover-lift"><div><div className="flex items-center gap-2"><span className="font-bold capitalize text-gray-900">{req.type}</span>{req.rating && <span className="flex items-center text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded font-bold"><Star size={10} className="fill-yellow-600 text-yellow-600 mr-1"/> {req.rating}</span>}</div><span className="text-gray-500 text-xs">{new Date(req.created_at).toLocaleDateString()}</span></div>{!req.rating && req.status === 'completed' ? <button onClick={() => onRate(req, 0)} className="text-xs bg-black text-white px-3 py-1.5 rounded-lg font-bold hover:bg-gray-800 btn-press">Rate Now</button> : <div className="text-sm font-medium text-green-700 bg-green-100 px-2 py-1 rounded">{req.status === 'cancelled' ? 'Cancelled' : 'Done'}</div>}</div>))}</div></div>}
        {chatRequestId && (<div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 pop-in"><div className="w-full max-w-md bg-white rounded-xl overflow-hidden relative"><button className="absolute top-2 right-2 text-white z-10" onClick={()=>setChatRequestId(null)}><X/></button><ChatBox requestId={chatRequestId} currentUserId={currentUserId} /></div></div>)}
      </div>
    );
};

export default RequestTracker;
