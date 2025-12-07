import React, { useState } from 'react';
import { Loader2, X, MapPin, Navigation, Map, Info } from 'lucide-react';
import MapPicker from './MapPicker';
import { reverseGeocode } from '../lib/geocoding';

// Define the type for the form data
interface RequestFormData {
    type: string;
    pickup_address: string;
    dropoff_address: string;
    details: string;
    price_estimate: number;
    // New fields
    pickup_lat: number;
    pickup_lng: number;
    dropoff_lat: number;
    dropoff_lng: number;
    additional_cost_reason: string;
}

interface RequestFormProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onSubmit: (data: any) => Promise<void>;
    onCancel: () => void;
}

type LocationMode = 'pickup' | 'dropoff' | null;

const RequestForm = ({ onSubmit, onCancel }: RequestFormProps) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<RequestFormData & { item_cost: string, additional_cost: string }>({
      type: 'food',
      pickup_address: '',
      dropoff_address: '',
      details: '',
      price_estimate: 49,
      item_cost: '', // Input as string for better UX
      additional_cost: '',
      additional_cost_reason: 'Distance',
      pickup_lat: 0,
      pickup_lng: 0,
      dropoff_lat: 0,
      dropoff_lng: 0
    });

    const [locationMode, setLocationMode] = useState<LocationMode>(null);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);

      const itemCost = parseFloat(formData.item_cost) || 0;
      const additionalCost = parseFloat(formData.additional_cost) || 0;
      const fixedFee = 49;
      const total = itemCost + fixedFee + additionalCost;

      await onSubmit({
        ...formData,
        item_cost: itemCost,
        service_fee: fixedFee,
        additional_cost: additionalCost,
        additional_cost_reason: additionalCost > 0 ? formData.additional_cost_reason : null,
        price_estimate: total, // Total = Item + Fee + Additional
        lat: formData.pickup_lat,
        lng: formData.pickup_lng
      });
      setLoading(false);
    };

    const handleLocationSelect = async (lat: number, lng: number) => {
      // Optimistic update of coordinates
      if (locationMode === 'pickup') {
          setFormData(prev => ({ ...prev, pickup_lat: lat, pickup_lng: lng }));
      } else if (locationMode === 'dropoff') {
          setFormData(prev => ({ ...prev, dropoff_lat: lat, dropoff_lng: lng }));
      }

      // Fetch address
      const address = await reverseGeocode(lat, lng);

      if (address) {
          if (locationMode === 'pickup') {
            setFormData(prev => ({ ...prev, pickup_address: address }));
          } else if (locationMode === 'dropoff') {
            setFormData(prev => ({ ...prev, dropoff_address: address }));
          }
      }
    };

    const calculateTotal = () => {
        const item = parseFloat(formData.item_cost || '0');
        const additional = parseFloat(formData.additional_cost || '0');
        return (item + 49 + additional).toFixed(2);
    };

    return (
      <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4 backdrop-blur-sm pop-in">
        <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl scale-100 transition-all max-h-[90vh] overflow-y-auto no-scrollbar">
          <div className="bg-white border-b border-gray-100 px-5 py-4 flex justify-between items-center sticky top-0 z-10">
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
                  { id: 'transport', emoji: '📦', label: 'Parcel' },
                  { id: 'custom', emoji: '✨', label: 'Custom' }
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
                <div className="flex justify-between items-center mb-1">
                  <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-gray-400">
                    <MapPin size={12} className="text-red-500" /> Pickup Location
                  </label>
                  <button type="button" onClick={() => setLocationMode(locationMode === 'pickup' ? null : 'pickup')} className="text-[10px] flex items-center gap-1 text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-lg hover:bg-blue-100">
                    <Map size={10} /> {locationMode === 'pickup' ? 'Hide Map' : 'Set on Map'}
                  </button>
                </div>
                {locationMode === 'pickup' && (
                   <div className="mb-2">
                      <MapPicker
                        initialLat={formData.pickup_lat || undefined}
                        initialLng={formData.pickup_lng || undefined}
                        onLocationSelect={handleLocationSelect}
                      />
                   </div>
                )}
                <input required type="text" placeholder="e.g. Jollibee, Library" className="w-full bg-transparent text-sm font-medium text-gray-900 placeholder-gray-400 outline-none" value={formData.pickup_address} onChange={(e) => setFormData({...formData, pickup_address: e.target.value})}/>
              </div>

              <div className="bg-gray-50 px-3 py-2.5 rounded-xl border border-gray-100 focus-within:border-green-400 focus-within:ring-2 focus-within:ring-green-500/10 transition-all">
                <div className="flex justify-between items-center mb-1">
                  <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-gray-400">
                    <Navigation size={12} className="text-green-500" /> Dropoff Location
                  </label>
                  <button type="button" onClick={() => setLocationMode(locationMode === 'dropoff' ? null : 'dropoff')} className="text-[10px] flex items-center gap-1 text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded-lg hover:bg-green-100">
                    <Map size={10} /> {locationMode === 'dropoff' ? 'Hide Map' : 'Set on Map'}
                  </button>
                </div>
                 {locationMode === 'dropoff' && (
                   <div className="mb-2">
                      <MapPicker
                         initialLat={formData.dropoff_lat || undefined}
                         initialLng={formData.dropoff_lng || undefined}
                         onLocationSelect={handleLocationSelect}
                      />
                   </div>
                )}
                <input required type="text" placeholder="e.g. Dorm Room 305" className="w-full bg-transparent text-sm font-medium text-gray-900 placeholder-gray-400 outline-none" value={formData.dropoff_address} onChange={(e) => setFormData({...formData, dropoff_address: e.target.value})}/>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Instructions</label>
              <textarea required rows={2} placeholder="Add details (e.g. 'No pickles')..." className="w-full px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all text-sm font-medium text-gray-700 resize-none" value={formData.details} onChange={(e) => setFormData({...formData, details: e.target.value})}/>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Task Cost (Est.)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-500 font-bold text-sm">₱</span>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      required
                      className="w-full pl-7 pr-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:border-blue-400 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all text-sm font-bold text-gray-900"
                      value={formData.item_cost}
                      onChange={(e) => setFormData({...formData, item_cost: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Service Fee</label>
                  <div className="relative opacity-60">
                    <span className="absolute left-3 top-2.5 text-gray-500 font-bold text-sm">₱</span>
                    <input
                      type="number"
                      value="49"
                      disabled
                      className="w-full pl-7 pr-3 py-2.5 bg-gray-100 border border-gray-100 rounded-xl text-sm font-bold text-gray-500 cursor-not-allowed"
                    />
                  </div>
                </div>
            </div>

            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                 <div className="flex items-center gap-2 mb-2">
                     <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Optional: Additional Tip/Fee</span>
                     <div className="group relative">
                        <Info size={12} className="text-gray-400 cursor-help"/>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-black text-white text-[10px] rounded hidden group-hover:block z-20">
                            Add extra for heavy items, long distance, or rush orders.
                        </div>
                     </div>
                 </div>
                 <div className="flex gap-2">
                     <div className="relative flex-1">
                        <span className="absolute left-3 top-2.5 text-gray-500 font-bold text-sm">₱</span>
                        <input
                          type="number"
                          min="0"
                          placeholder="0"
                          className="w-full pl-7 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl focus:border-blue-400 outline-none text-sm font-bold text-gray-900"
                          value={formData.additional_cost}
                          onChange={(e) => setFormData({...formData, additional_cost: e.target.value})}
                        />
                     </div>
                     <select
                        className="flex-[1.5] px-3 py-2.5 bg-white border border-gray-200 rounded-xl focus:border-blue-400 outline-none text-xs font-medium text-gray-700"
                        value={formData.additional_cost_reason}
                        onChange={(e) => setFormData({...formData, additional_cost_reason: e.target.value})}
                     >
                         <option value="Distance">Long Distance</option>
                         <option value="Heavy">Heavy Items</option>
                         <option value="Rush">Rush Fee</option>
                         <option value="Tip">Tip</option>
                         <option value="Other">Other</option>
                     </select>
                 </div>
            </div>

            <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-4 rounded-xl shadow-lg shadow-blue-600/20 text-white">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-blue-100">Task Cost</span>
                <span className="font-bold">₱{parseFloat(formData.item_cost || '0').toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-blue-100">Service Fee</span>
                <span className="font-bold">₱49.00</span>
              </div>
              {parseFloat(formData.additional_cost || '0') > 0 && (
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-blue-100">Additional ({formData.additional_cost_reason})</span>
                    <span className="font-bold">₱{parseFloat(formData.additional_cost || '0').toFixed(2)}</span>
                  </div>
              )}
              <div className="my-2 border-b border-white/10"></div>
              <div className="flex justify-between items-center pt-1">
                 <div>
                    <span className="block text-xs font-bold text-blue-100 uppercase tracking-wide">Total Price</span>
                    <span className="text-[10px] text-blue-200">Pay to Runner</span>
                 </div>
                 <div className="flex items-center gap-0.5">
                    <span className="text-blue-200 font-bold text-lg">₱</span>
                    <span className="text-2xl font-black text-white">{calculateTotal()}</span>
                 </div>
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 transition-all btn-press shadow-xl shadow-blue-200 flex justify-center items-center gap-2 text-sm">
              {loading ? <Loader2 className="animate-spin" size={18} /> : 'Post Request'}
            </button>
          </form>
        </div>
      </div>
    );
};

export default RequestForm;
