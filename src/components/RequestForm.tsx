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
        <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl scale-100 transition-all">
          <div className="bg-white border-b border-gray-100 p-6 flex justify-between items-center">
            <div><h3 className="font-black text-2xl text-gray-900">Create Request</h3><p className="text-gray-500 text-sm mt-1">What do you need help with today?</p></div>
            <button onClick={onCancel} className="bg-gray-100 p-2.5 rounded-full hover:bg-gray-200 transition-all hover:rotate-90 text-gray-600"><X size={20}/></button>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Service Type</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'food', emoji: '🍔', label: 'Food' },
                  { id: 'printing', emoji: '🖨️', label: 'Printing' },
                  { id: 'groceries', emoji: '🛒', label: 'Shop' },
                  { id: 'transport', emoji: '📦', label: 'Parcel' }
                ].map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFormData({...formData, type: item.id})}
                    className={`p-4 rounded-2xl border-2 text-left transition-all btn-press group relative overflow-hidden ${formData.type === item.id ? 'border-blue-600 bg-blue-50' : 'border-gray-100 bg-gray-50 hover:border-gray-300'}`}
                  >
                    <span className="text-2xl mb-1 block group-hover:scale-110 transition-transform">{item.emoji}</span>
                    <span className={`font-bold text-sm ${formData.type === item.id ? 'text-blue-700' : 'text-gray-600'}`}>{item.label}</span>
                    {formData.type === item.id && <div className="absolute top-3 right-3 h-2 w-2 bg-blue-600 rounded-full"></div>}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
                <label className="flex items-center gap-2 text-xs font-bold uppercase text-gray-400 mb-2">
                  <MapPin size={14} className="text-red-500" /> Pickup
                </label>
                <input required type="text" placeholder="e.g. Jollibee, Library, etc." className="w-full bg-transparent font-medium text-gray-900 placeholder-gray-400 outline-none" value={formData.pickup_address} onChange={(e) => setFormData({...formData, pickup_address: e.target.value})}/>
              </div>

              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 focus-within:border-green-400 focus-within:ring-4 focus-within:ring-green-500/10 transition-all">
                <label className="flex items-center gap-2 text-xs font-bold uppercase text-gray-400 mb-2">
                  <Navigation size={14} className="text-green-500" /> Dropoff
                </label>
                <input required type="text" placeholder="e.g. Dorm Room 305" className="w-full bg-transparent font-medium text-gray-900 placeholder-gray-400 outline-none" value={formData.dropoff_address} onChange={(e) => setFormData({...formData, dropoff_address: e.target.value})}/>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Instructions</label>
              <textarea required rows={3} placeholder="Add specific details (e.g. 'No pickles', 'Black and white print')..." className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium text-gray-700 resize-none" value={formData.details} onChange={(e) => setFormData({...formData, details: e.target.value})}/>
            </div>

            <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-5 rounded-2xl flex items-center justify-between shadow-lg shadow-blue-600/20 text-white">
              <div>
                <span className="block text-sm font-bold text-blue-100 mb-0.5">Total Offer</span>
                <span className="text-xs text-blue-200">Includes fee & item cost</span>
              </div>
              <div className="flex items-center gap-1 bg-white/10 px-4 py-2 rounded-xl backdrop-blur-md border border-white/20">
                <span className="text-blue-100 font-bold text-lg">₱</span>
                <input type="number" className="w-24 bg-transparent text-right font-black text-3xl text-white outline-none placeholder-blue-300/50" value={formData.price_estimate} onChange={(e) => setFormData({...formData, price_estimate: Number(e.target.value)})}/>
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full bg-gray-900 text-white font-bold py-4 rounded-2xl hover:bg-black transition-all btn-press shadow-xl flex justify-center items-center gap-2">
              {loading ? <Loader2 className="animate-spin" /> : 'Post Request'}
            </button>
          </form>
        </div>
      </div>
    );
};

export default RequestForm;
