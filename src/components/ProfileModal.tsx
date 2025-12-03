import React, { useState } from 'react';
import { Loader2, ImageIcon, Camera, QrCode, Star, Package } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { type UserProfile } from '../types';
import AppLogo from './AppLogo';

interface ProfileModalProps {
    userProfile: UserProfile;
    onSave: (data: Partial<UserProfile>) => void;
    onClose: () => void;
    readOnly?: boolean;
}

const ProfileModal = ({ userProfile, onSave, onClose, readOnly = false }: ProfileModalProps) => {
    const [name, setName] = useState(userProfile.name);
    const [phone, setPhone] = useState(userProfile.phone);
    const [uploading, setUploading] = useState(false);
    // If readOnly, start on 'stats' tab
    const [activeTab, setActiveTab] = useState<'info' | 'stats'>(readOnly ? 'stats' : 'info');

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
      if (!e.target.files?.length) return;
      setUploading(true);
      const file = e.target.files[0];
      const filePath = `${userProfile.id}/${type}_${Date.now()}.${file.name.split('.').pop()}`;
      try {
         await supabase.storage.from('runners-assets').upload(filePath, file);
         const { data } = supabase.storage.from('runners-assets').getPublicUrl(filePath);

         let updateData = {};
         if (type === 'id') updateData = { school_id_url: data.publicUrl, is_verified: true };
         else if (type === 'qr') updateData = { payment_qr_url: data.publicUrl };
         else if (type === 'avatar') updateData = { avatar_url: data.publicUrl };

         onSave(updateData);
         alert('Uploaded successfully!');
      } catch {
         // In development environment without storage setup this will fail,
         // so we simulate success for demo if it fails (optional, but good for UX in broken envs)
         console.error('Storage bucket might be missing.');
         alert('Upload failed (Storage bucket might be missing).');
      } finally {
         setUploading(false);
      }
    };

    // Determine stats labels based on role
    const isStudent = userProfile.role === 'student';
    // Use role specific rating if available, else overall
    const ratingValue = isStudent ? userProfile.student_rating : (userProfile.runner_rating || userProfile.rating);
    const historyLabel = isStudent ? "Requests Made" : "Tasks Completed";
    const HistoryIcon = isStudent ? Package : () => <AppLogo className="h-6 w-6 text-blue-500" />;

    return (
      <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm pop-in">
        <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

          <div className="flex border-b">
             {!readOnly && <button onClick={() => setActiveTab('info')} className={`flex-1 p-3 text-sm font-bold ${activeTab === 'info' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}>Edit Profile</button>}
             <button onClick={() => setActiveTab('stats')} className={`flex-1 p-3 text-sm font-bold ${activeTab === 'stats' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}>Stats & History</button>
          </div>

          <div className="p-6 overflow-y-auto">
            {activeTab === 'info' && !readOnly ? (
                <>
                  <h2 className="text-xl font-bold mb-4">Profile Details</h2>
                  <form onSubmit={(e) => { e.preventDefault(); onSave({ name, phone }); onClose(); }} className="space-y-4">
                    <div className="flex items-center justify-center mb-4">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden border-2 border-gray-100 relative group cursor-pointer">
                            {userProfile.avatar_url ? <img src={userProfile.avatar_url} className="w-full h-full object-cover"/> : <ImageIcon className="text-gray-400"/>}
                            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={(e) => handleFileUpload(e, 'avatar')} />
                        </div>
                    </div>
                    <div><label className="block text-xs font-bold uppercase text-gray-500 mb-1">Name</label><input className="w-full p-3 bg-gray-50 border-transparent focus:bg-white border focus:border-blue-500 rounded-xl outline-none font-medium" value={name} onChange={e => setName(e.target.value)} /></div>
                    <div><label className="block text-xs font-bold uppercase text-gray-500 mb-1">Phone</label><input className="w-full p-3 bg-gray-50 border-transparent focus:bg-white border focus:border-blue-500 rounded-xl outline-none font-medium" value={phone} onChange={e => setPhone(e.target.value)} /></div>

                    <div className="p-3 bg-gray-50 rounded-xl border border-dashed border-gray-300 space-y-3">
                    <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer hover:bg-white p-2 rounded-lg transition border border-transparent hover:border-gray-200 hover:shadow-sm">
                        {uploading ? <Loader2 size={16} className="animate-spin text-blue-500"/> : <Camera size={16} className="text-blue-500"/>}
                        <span className="font-medium">Upload Government/School ID</span>
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'id')} />
                    </label>
                    {userProfile.role === 'runner' && (
                        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer hover:bg-white p-2 rounded-lg transition border border-transparent hover:border-gray-200 hover:shadow-sm">
                            {uploading ? <Loader2 size={16} className="animate-spin text-green-500"/> : <QrCode size={16} className="text-green-500"/>}
                            <span className="font-medium">Upload GCash QR</span>
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'qr')} />
                        </label>
                    )}
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 bg-gray-100 text-gray-600 font-bold py-3 rounded-xl btn-press">Cancel</button>
                        <button type="submit" className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl btn-press shadow-lg shadow-blue-200">Save Changes</button>
                    </div>
                  </form>
                </>
            ) : (
                <div className="space-y-6">
                    <div className="text-center">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden border-2 border-gray-100 mx-auto mb-3">
                            {userProfile.avatar_url ? <img src={userProfile.avatar_url} className="w-full h-full object-cover"/> : <ImageIcon className="text-gray-400"/>}
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">{userProfile.name}</h3>
                        <p className="text-xs text-gray-500 uppercase tracking-widest">{userProfile.role}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-yellow-50 p-4 rounded-2xl border border-yellow-100 text-center">
                            <div className="flex justify-center mb-2"><Star className="fill-yellow-400 text-yellow-400" size={24}/></div>
                            <div className="text-2xl font-black text-gray-900">{ratingValue?.toFixed(1) || 'N/A'}</div>
                            <div className="text-xs font-bold text-yellow-700 uppercase tracking-wide">Rating</div>
                            <div className="text-[10px] text-gray-400 mt-1">{userProfile.total_reviews || 0} reviews</div>
                        </div>
                        <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 text-center">
                             <div className="flex justify-center mb-2"><HistoryIcon className="text-blue-500" size={24}/></div>
                             <div className="text-2xl font-black text-gray-900">{userProfile.history?.length || 0}</div>
                             <div className="text-xs font-bold text-blue-700 uppercase tracking-wide">{historyLabel}</div>
                        </div>
                    </div>

                    {/* Simple list of recent feedback or history if available */}
                    <div className="bg-gray-50 rounded-xl p-4">
                        <h4 className="font-bold text-sm text-gray-700 mb-3">Recent Activity</h4>
                        <div className="text-center text-sm text-gray-400 py-4">
                            Detailed history is available in the Tracker/Dashboard view.
                        </div>
                    </div>

                    <button type="button" onClick={onClose} className="w-full bg-gray-100 text-gray-600 font-bold py-3 rounded-xl btn-press">Close</button>
                </div>
            )}
          </div>
        </div>
      </div>
    );
};

export default ProfileModal;
