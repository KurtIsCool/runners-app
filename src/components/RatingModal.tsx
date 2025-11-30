import { useState } from 'react';
import { Star } from 'lucide-react';

const RatingModal = ({ onSubmit }: { onSubmit: (rating: number) => Promise<void> }) => {
    const [rating, setRating] = useState(0);
    return (<div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 pop-in"><div className="bg-white rounded-2xl p-8 text-center w-full max-w-sm"><h2 className="text-2xl font-bold mb-4">Rate Runner</h2><div className="flex justify-center gap-2 mb-6">{[1,2,3,4,5].map(s => <button key={s} onClick={() => setRating(s)}><Star size={32} className={s <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} /></button>)}</div><button onClick={() => onSubmit(rating)} disabled={rating === 0} className="w-full bg-black text-white py-3 rounded-xl font-bold btn-press">Submit</button></div></div>);
};

export default RatingModal;
