import { Star, CheckCircle } from 'lucide-react';
import { type Request } from '../types';

const RunnerDashboard = ({ requests, userId }: { requests: Request[], userId: string }) => {
    const completed = requests.filter(r => r.runner_id === userId && r.status === 'completed');
    const earnings = completed.reduce((sum, r) => sum + (r.price_estimate || 0), 0);
    const ratedJobs = completed.filter(r => r.rating);
    const avgRating = ratedJobs.length > 0 ? (ratedJobs.reduce((sum, r) => sum + (r.rating || 0), 0) / ratedJobs.length).toFixed(1) : 'New';

    return (
      <div className="space-y-6 pb-24 animate-slide-up">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-800 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden group hover-lift"><div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl animate-blob"></div><p className="text-blue-200 text-xs font-bold uppercase tracking-wider mb-1">Total Earnings</p><h3 className="text-3xl font-bold tracking-tight">₱{earnings.toFixed(2)}</h3></div>
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col justify-center hover-lift"><div className="flex items-center gap-2 mb-1"><Star className="text-yellow-400 fill-yellow-400" size={16} /><p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Rating</p></div><h3 className="text-3xl font-bold text-gray-900">{avgRating}</h3></div>
        </div>
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden stagger-enter" style={{animationDelay: '0.1s'}}>
          <div className="p-6 border-b border-gray-50 flex justify-between items-center"><h3 className="font-bold text-gray-800 text-lg">Work History</h3><span className="text-xs font-medium text-gray-400">{completed.length} Jobs</span></div>
          {completed.length === 0 ? <div className="p-12 text-center text-gray-500"><div className="bg-gray-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"><CheckCircle className="text-gray-300" /></div>No completed tasks yet.</div> : <div className="divide-y divide-gray-50">{completed.map((job, i) => (<div key={job.id} style={{animationDelay: `${i*50}ms`}} className="stagger-enter p-5 flex justify-between items-center hover:bg-gray-50 transition"><div><div className="flex items-center gap-2 mb-1"><p className="font-bold text-gray-900 capitalize">{job.type}</p>{job.rating && <span className="flex items-center text-[10px] bg-yellow-50 text-yellow-700 px-1.5 rounded font-bold border border-yellow-100">{job.rating} <Star size={8} className="ml-0.5 fill-yellow-500 text-yellow-500"/></span>}</div><p className="text-xs text-gray-500">{new Date(job.created_at).toLocaleDateString()}</p></div><span className="font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg text-sm">+₱{job.price_estimate}</span></div>))}</div>}
        </div>
      </div>
    );
};

export default RunnerDashboard;
