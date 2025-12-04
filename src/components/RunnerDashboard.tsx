import { Star, CheckCircle, User as UserIcon } from 'lucide-react';
import { type Request } from '../types';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const StudentInfo = ({ studentId, onClick }: { studentId: string, onClick?: (id: string) => void }) => {
    const [name, setName] = useState<string>('Student');
    useEffect(() => {
        const fetchName = async () => {
            const { data } = await supabase.from('users').select('name').eq('id', studentId).single();
            if (data) setName(data.name);
        };
        fetchName();
    }, [studentId]);
    return (
        <button
            onClick={() => onClick && onClick(studentId)}
            className="flex items-center gap-1 text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-bold w-fit mt-1 hover:bg-gray-200 transition-colors"
        >
            <UserIcon size={10}/> {name}
        </button>
    );
}

const RunnerDashboard = ({ requests, userId, onViewProfile }: { requests: Request[], userId: string, onViewProfile?: (userId: string) => void }) => {
    const completed = requests.filter(r => r.runner_id === userId && r.status === 'completed');
    const disputed = requests.filter(r => r.runner_id === userId && r.status === 'disputed');

    const earnings = completed.reduce((sum, r) => sum + (r.price_estimate || 0), 0);
    // Use runner_rating if available, fallback to legacy rating
    const ratedJobs = completed.filter(r => r.runner_rating || r.rating);
    const avgRating = ratedJobs.length > 0 ? (ratedJobs.reduce((sum, r) => sum + (r.runner_rating || r.rating || 0), 0) / ratedJobs.length).toFixed(1) : 'New';

    return (
      <div className="space-y-6 pb-24 animate-slide-up">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-800 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden group hover-lift"><div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl animate-blob"></div><p className="text-blue-200 text-xs font-bold uppercase tracking-wider mb-1">Total Earnings</p><h3 className="text-3xl font-bold tracking-tight">₱{earnings.toFixed(2)}</h3></div>
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col justify-center hover-lift"><div className="flex items-center gap-2 mb-1"><Star className="text-yellow-400 fill-yellow-400" size={16} /><p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Rating</p></div><h3 className="text-3xl font-bold text-gray-900">{avgRating}</h3></div>
        </div>

        {disputed.length > 0 && (
          <div className="bg-red-50 rounded-3xl shadow-sm border border-red-100 overflow-hidden stagger-enter">
            <div className="p-6 border-b border-red-100 flex justify-between items-center"><h3 className="font-bold text-red-800 text-lg">Action Required / Disputed</h3><span className="text-xs font-medium text-red-500">{disputed.length} Jobs</span></div>
            <div className="p-4 space-y-3">
              {disputed.map((job, i) => (
                <div key={job.id} style={{animationDelay: `${i*50}ms`}} className="stagger-enter bg-white p-4 rounded-2xl shadow-sm border border-red-200 hover:shadow-md transition-all">
                   <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                         <div className="p-2.5 rounded-xl bg-red-100 text-red-600">⚠️</div>
                         <div>
                            <h4 className="font-bold text-gray-900 capitalize">{job.type} - Disputed</h4>
                            <p className="text-xs text-gray-500 mb-1">{new Date(job.created_at).toLocaleDateString()}</p>
                            <StudentInfo studentId={job.student_id} onClick={onViewProfile} />
                         </div>
                      </div>
                      <span className="font-black text-gray-400 bg-gray-100 px-3 py-1 rounded-lg text-sm">₱{job.price_estimate}</span>
                   </div>
                   <div className="bg-red-50 p-2 rounded text-red-800 text-xs mb-2">
                     <strong>Status:</strong> Student marked as Disputed. Please contact support or the student.
                   </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden stagger-enter" style={{animationDelay: '0.1s'}}>
          <div className="p-6 border-b border-gray-50 flex justify-between items-center"><h3 className="font-bold text-gray-800 text-lg">Work History</h3><span className="text-xs font-medium text-gray-400">{completed.length} Jobs</span></div>
          {completed.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <div className="bg-gray-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"><CheckCircle className="text-gray-300" /></div>
              No completed tasks yet.
            </div>
          ) : (
            <div className="p-4 space-y-3 bg-gray-50/50">
              {completed.map((job, i) => (
                <div key={job.id} style={{animationDelay: `${i*50}ms`}} className="stagger-enter bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all group">
                   <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                         <div className={`p-2.5 rounded-xl ${job.type === 'food' ? 'bg-orange-100 text-orange-600' : job.type === 'printing' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                           {job.type === 'food' ? '🍔' : job.type === 'printing' ? '🖨️' : '📦'}
                         </div>
                         <div>
                            <h4 className="font-bold text-gray-900 capitalize">{job.type} Delivery</h4>
                            <p className="text-xs text-gray-500 mb-1">{new Date(job.created_at).toLocaleDateString()} • {new Date(job.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                            <StudentInfo studentId={job.student_id} onClick={onViewProfile} />
                         </div>
                      </div>
                      <span className="font-black text-green-600 bg-green-50 px-3 py-1 rounded-lg text-sm">+₱{job.price_estimate}</span>
                   </div>

                   <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${job.status === 'completed' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-500">{job.status}</span>
                      </div>

                      {(job.runner_rating || job.rating) ? (
                        <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-lg border border-yellow-100">
                          <span className="font-bold text-yellow-700 text-xs">{(job.runner_rating || job.rating)}.0</span>
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} size={10} className={`${i < (job.runner_rating || job.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                            ))}
                          </div>
                        </div>
                      ) : (
                         <span className="text-xs text-gray-400 italic">No rating</span>
                      )}
                   </div>
                   {/* Show Proof thumbnail if exists */}
                   {job.proof_url && (
                     <div className="mt-2 pt-2 border-t border-gray-50">
                       <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Proof of Delivery</p>
                       <img src={job.proof_url} alt="Proof" className="h-12 w-12 rounded object-cover border border-gray-200" />
                     </div>
                   )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
};

export default RunnerDashboard;
