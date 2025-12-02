import React, { useState } from 'react';
import { Loader2, X, MapPin, Navigation } from 'lucide-react';

// Define the type for the form data
interface RequestFormData {
    type: string;
    pickup_address: string;
    dropoff_address: string;
    details: string;
    price_estimate: number;
    lat: number;
    lng: number;
}

interface RequestFormProps {
    onSubmit: (data: RequestFormData) => Promise<void>;
    onCancel: () => void;
}

const RequestForm = ({ onSubmit, onCancel }: RequestFormProps) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<RequestFormData>({ type: 'food', pickup_address: '', dropoff_address: '', details: '', price_estimate: 50, lat: 0, lng: 0 });
    const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); setLoading(true); await onSubmit(formData); setLoading(false); };

    return (
      <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4 backdrop-blur-sm pop-in">
        <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl scale-100 transition-all">
          <div className="bg-white border-b border-gray-100 px-5 py-4 flex justify-between items-center">
            <div><h3 className="font-bold text-lg text-gray-900">Create Request</h3><p className="text-gray-500 text-xs mt-0.5">What do you need help with?</p></div>
            <button onClick={onCancel} className="bg-gray-100 p-2 rounded-full hover:bg-gray-200 transition-all hover:rotate-90 text-gray-600"><X size={18}/></button>
          </div>
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Service Type</label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'food', emoji: '🍔', label: 'Food' },
                  { id: 'printing', emoji: '🖨️', label: 'Print' },
                  { id: 'groceries', emoji: '🛒', label: 'Shop' },
                  { id: 'transport', emoji: '📦', label: 'Parcel' }
                ].map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFormData({...formData, type: item.id})}
                    className={`p-2 rounded-xl border text-center transition-all btn-press group relative overflow-hidden flex flex-col items-center justify-center h-20 ${formData.type === item.id ? 'border-blue-600 bg-blue-50' : 'border-gray-100 bg-gray-50 hover:border-gray-300'}`}
                  >
                    <span className="text-xl mb-1 block group-hover:scale-110 transition-transform">{item.emoji}</span>
                    <span className={`font-bold text-[10px] ${formData.type === item.id ? 'text-blue-700' : 'text-gray-600'}`}>{item.label}</span>
                    {formData.type === item.id && <div className="absolute top-1.5 right-1.5 h-1.5 w-1.5 bg-blue-600 rounded-full"></div>}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="bg-gray-50 px-3 py-2.5 rounded-xl border border-gray-100 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-500/10 transition-all">
                <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-gray-400 mb-1">
                  <MapPin size={12} className="text-red-500" /> Pickup
                </label>
                <input required type="text" placeholder="e.g. Jollibee, Library" className="w-full bg-transparent text-sm font-medium text-gray-900 placeholder-gray-400 outline-none" value={formData.pickup_address} onChange={(e) => setFormData({...formData, pickup_address: e.target.value})}/>
              </div>

              <div className="bg-gray-50 px-3 py-2.5 rounded-xl border border-gray-100 focus-within:border-green-400 focus-within:ring-2 focus-within:ring-green-500/10 transition-all">
                <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-gray-400 mb-1">
                  <Navigation size={12} className="text-green-500" /> Dropoff
                </label>
                <input required type="text" placeholder="e.g. Dorm Room 305" className="w-full bg-transparent text-sm font-medium text-gray-900 placeholder-gray-400 outline-none" value={formData.dropoff_address} onChange={(e) => setFormData({...formData, dropoff_address: e.target.value})}/>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Instructions</label>
              <textarea required rows={2} placeholder="Add details (e.g. 'No pickles')..." className="w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all text-sm font-medium text-gray-700 resize-none" value={formData.details} onChange={(e) => setFormData({...formData, details: e.target.value})}/>
            </div>

            <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-4 rounded-xl flex items-center justify-between shadow-lg shadow-blue-600/20 text-white">
              <div>
                <span className="block text-xs font-bold text-blue-100">Total Offer</span>
                <span className="text-[10px] text-blue-200">Fee & item cost</span>
              </div>
              <div className="flex items-center gap-1 bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-md border border-white/20">
                <span className="text-blue-100 font-bold text-sm">₱</span>
                <input type="number" className="w-16 bg-transparent text-right font-black text-xl text-white outline-none placeholder-blue-300/50" value={formData.price_estimate} onChange={(e) => setFormData({...formData, price_estimate: Number(e.target.value)})}/>
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full bg-gray-900 text-white font-bold py-3.5 rounded-xl hover:bg-black transition-all btn-press shadow-xl flex justify-center items-center gap-2 text-sm">
              {loading ? <Loader2 className="animate-spin" size={18} /> : 'Post Request'}
            </button>
          </form>
        </div>
      </div>
    );
};

export default RequestForm;
