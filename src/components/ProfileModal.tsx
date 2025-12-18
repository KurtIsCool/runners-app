import React, { useState } from 'react';
import { Loader2, ImageIcon, Camera, QrCode } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { type UserProfile } from '../types';

interface ProfileModalProps {
    userProfile: UserProfile;
    onSave: (data: Partial<UserProfile>) => void;
    onClose: () => void;
}

const ProfileModal = ({ userProfile, onSave, onClose }: ProfileModalProps) => {
    const [name, setName] = useState(userProfile.name);
    const [phone, setPhone] = useState(userProfile.phone);
    const [uploading, setUploading] = useState(false);

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
         alert('Upload failed. Please try again.');
      } finally {
         setUploading(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm pop-in">
        <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6">
          <h2 className="text-xl font-bold mb-4">Edit Profile</h2>
          <form onSubmit={(e) => { e.preventDefault(); onSave({ name, phone }); onClose(); }} className="space-y-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Name</label><input className="w-full p-2 border rounded-lg" value={name} onChange={e => setName(e.target.value)} /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone</label><input className="w-full p-2 border rounded-lg" value={phone} onChange={e => setPhone(e.target.value)} /></div>

            <div className="p-3 bg-gray-50 rounded-lg border border-dashed border-gray-300 space-y-3">
               <label className="flex items-center gap-2 text-sm text-blue-600 cursor-pointer font-medium hover:bg-blue-50 p-2 rounded transition">
                  {uploading ? <Loader2 size={14} className="animate-spin"/> : <ImageIcon size={14}/>} Upload Profile Picture
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'avatar')} />
               </label>
               <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer hover:bg-gray-100 p-2 rounded transition">
                  {uploading ? <Loader2 size={14} className="animate-spin"/> : <Camera size={14}/>} Upload School ID
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'id')} />
               </label>
               {userProfile.role === 'runner' && (
                  <label className="flex items-center gap-2 text-sm text-green-600 cursor-pointer hover:bg-green-50 p-2 rounded transition">
                     {uploading ? <Loader2 size={14} className="animate-spin"/> : <QrCode size={14}/>} Upload GCash QR
                     <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'qr')} />
                  </label>
               )}
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white font-bold py-2 rounded-lg btn-press">Save Changes</button>
          </form>
        </div>
      </div>
    );
};

export default ProfileModal;
