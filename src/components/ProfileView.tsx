import { User, BadgeCheck, QrCode, Settings, ChevronRight, LogOut, Camera } from 'lucide-react';
import { type UserProfile } from '../types';

const ProfileView = ({ userProfile, onEdit, onLogout }: { userProfile: UserProfile, onEdit: () => void, onLogout: () => void }) => {
    return (
      <div className="animate-slide-up max-w-xl mx-auto w-full">
         <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-6">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white text-center relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-full bg-white/5 backdrop-blur-sm"></div>
               <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl animate-blob"></div>

               <div className="relative z-10 flex flex-col items-center">
                 <div className="w-28 h-28 bg-white rounded-full p-1 shadow-xl mb-4 relative group cursor-pointer" onClick={onEdit}>
                    <div className="w-full h-full bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                      {userProfile.avatar_url ? (
                        <img src={userProfile.avatar_url} className="w-full h-full object-cover" alt="Profile" />
                      ) : (
                        <User size={40} className="text-gray-400" />
                      )}
                    </div>
                    <div className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full border-2 border-white shadow-sm"><Camera size={14}/></div>
                 </div>
                 <h1 className="text-2xl font-bold flex items-center gap-2">
                   {userProfile.name}
                   {userProfile.is_verified && <BadgeCheck className="text-blue-200 fill-blue-500" size={24}/>}
                 </h1>
                 <p className="text-blue-100 uppercase text-xs font-bold tracking-widest mt-1">{userProfile.role}</p>
               </div>
            </div>

            <div className="p-6">
               <div className="flex justify-between items-center py-3 border-b border-gray-50">
                  <span className="text-gray-500 text-sm">Phone Number</span>
                  <span className="font-medium">{userProfile.phone || 'Not set'}</span>
               </div>
               <div className="flex justify-between items-center py-3 border-b border-gray-50">
                  <span className="text-gray-500 text-sm">Status</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${userProfile.is_verified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                     {userProfile.is_verified ? 'Verified' : 'Pending Verification'}
                  </span>
               </div>
               {userProfile.role === 'runner' && (
                 <div className="flex justify-between items-center py-3 border-b border-gray-50">
                    <span className="text-gray-500 text-sm">Payment Method</span>
                    <span className="flex items-center gap-1 text-sm font-medium text-blue-600">
                       <QrCode size={14}/> {userProfile.payment_qr_url ? 'GCash Linked' : 'No QR'}
                    </span>
                 </div>
               )}
            </div>
         </div>

         <div className="grid grid-cols-1 gap-3">
            <button onClick={onEdit} className="w-full bg-white border border-gray-200 p-4 rounded-2xl flex items-center justify-between hover:bg-gray-50 btn-press shadow-sm">
               <div className="flex items-center gap-3">
                 <div className="bg-blue-50 p-2 rounded-full text-blue-600"><Settings size={20}/></div>
                 <span className="font-bold text-gray-700">Edit Profile & Avatar</span>
               </div>
               <ChevronRight size={20} className="text-gray-400"/>
            </button>

            <button onClick={onLogout} className="md:hidden w-full bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center justify-between hover:bg-red-100 btn-press shadow-sm text-red-600 mt-4">
               <div className="flex items-center gap-3">
                 <div className="bg-red-100 p-2 rounded-full"><LogOut size={20}/></div>
                 <span className="font-bold">Sign Out</span>
               </div>
            </button>
         </div>

          <div className="mt-6 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
             <div className="p-4 border-b border-gray-50 bg-gray-50/50"><h3 className="font-bold text-gray-900">More</h3></div>
             <div className="divide-y divide-gray-50">
                <button onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'about' }))} className="w-full text-left p-4 hover:bg-gray-50 flex justify-between items-center text-gray-600 text-sm font-medium">About Us <ChevronRight size={16} className="text-gray-300"/></button>
                <button onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'contact' }))} className="w-full text-left p-4 hover:bg-gray-50 flex justify-between items-center text-gray-600 text-sm font-medium">Contact Support <ChevronRight size={16} className="text-gray-300"/></button>
                <button onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'faqs' }))} className="w-full text-left p-4 hover:bg-gray-50 flex justify-between items-center text-gray-600 text-sm font-medium">FAQs <ChevronRight size={16} className="text-gray-300"/></button>
                <button onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'terms' }))} className="w-full text-left p-4 hover:bg-gray-50 flex justify-between items-center text-gray-600 text-sm font-medium">Terms & Conditions <ChevronRight size={16} className="text-gray-300"/></button>
                <button onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'privacy' }))} className="w-full text-left p-4 hover:bg-gray-50 flex justify-between items-center text-gray-600 text-sm font-medium">Privacy Policy <ChevronRight size={16} className="text-gray-300"/></button>
                <button onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'help' }))} className="w-full text-left p-4 hover:bg-gray-50 flex justify-between items-center text-gray-600 text-sm font-medium">Help Center <ChevronRight size={16} className="text-gray-300"/></button>
             </div>
          </div>
      </div>
    );
}

export default ProfileView;
