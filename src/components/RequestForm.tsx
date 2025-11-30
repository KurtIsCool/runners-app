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
        <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 flex justify-between items-center text-white">
            <div><h3 className="font-bold text-xl">New Errand</h3><p className="text-blue-100 text-sm">Fill in the details below</p></div>
            <button onClick={onCancel} className="bg-white/20 p-2 rounded-full hover:bg-white/30 transition-transform hover:rotate-90"><X size={20}/></button>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div><label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Errand Type</label><div className="grid grid-cols-2 gap-2">{['food', 'printing', 'groceries', 'transport'].map(type => (<button key={type} type="button" onClick={() => setFormData({...formData, type})} className={`p-3 rounded-lg border text-sm font-medium capitalize transition-all btn-press ${formData.type === type ? 'border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500' : 'border-gray-200 text-gray-600 hover:border-blue-200 hover:bg-gray-50'}`}>{type}</button>))}</div></div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Pickup Location</label>
                <div className="relative">
                  <MapPin size={18} className="absolute left-3 top-3 text-red-500" />
                  <input required type="text" placeholder="e.g. Jollibee" className="w-full pl-10 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all hover:border-gray-400" value={formData.pickup_address} onChange={(e) => setFormData({...formData, pickup_address: e.target.value})}/>
                </div>
              </div>
              <div className="relative"><Navigation size={18} className="absolute left-3 top-3 text-green-500" /><input required type="text" placeholder="Dropoff Location (e.g. Dorm)" className="w-full pl-10 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all hover:border-gray-400" value={formData.dropoff_address} onChange={(e) => setFormData({...formData, dropoff_address: e.target.value})}/></div>
            </div>
            <div><label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Details</label><textarea required rows={3} placeholder="What specifically do you need?" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all hover:border-gray-400" value={formData.details} onChange={(e) => setFormData({...formData, details: e.target.value})}/></div>
            <div className="bg-blue-50 p-4 rounded-xl flex items-center justify-between border border-blue-100"><div><span className="block text-sm font-bold text-blue-900">Offer Price</span><span className="text-xs text-blue-600">Include item cost + fee</span></div><div className="flex items-center gap-1 bg-white px-3 py-1 rounded-lg border border-blue-200 shadow-sm"><span className="text-gray-500 font-bold">₱</span><input type="number" className="w-20 p-1 text-right font-bold text-xl text-gray-900 outline-none" value={formData.price_estimate} onChange={(e) => setFormData({...formData, price_estimate: Number(e.target.value)})}/></div></div>
            <button type="submit" disabled={loading} className="w-full bg-black text-white font-bold py-4 rounded-xl hover:bg-gray-800 transition-all btn-press shadow-lg hover:shadow-xl">{loading ? <Loader2 className="animate-spin" /> : 'Post Request'}</button>
          </form>
        </div>
      </div>
    );
};

export default RequestForm;
