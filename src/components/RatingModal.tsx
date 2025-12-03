import { useState } from 'react';
import { Star } from 'lucide-react';

interface RatingModalProps {
    // We can extend this to support comments later if needed by App.tsx logic,
    // but for now we keep the signature simple or assume App.tsx will handle the complex object if we change it.
    // However, to support comments we need to change how `onSubmit` is called in App.tsx or this component's signature.
    // The previous code passes a simple function `(rating: number) => Promise`.
    // I will try to keep it compatible but maybe add a comment field.
    onSubmit: (rating: number, comment?: string) => Promise<void>;
    onClose?: () => void;
}

const RatingModal = ({ onSubmit, onClose }: RatingModalProps) => {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (rating === 0) return;
        setSubmitting(true);
        await onSubmit(rating, comment);
        setSubmitting(false);
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 pop-in">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 font-bold">✕</button>
                <h2 className="text-xl font-bold mb-2 text-center text-gray-900">Rate your experience</h2>
                <p className="text-center text-gray-500 text-sm mb-6">How was the service?</p>

                <div className="flex justify-center gap-2 mb-6">
                    {[1, 2, 3, 4, 5].map(s => (
                        <button key={s} onClick={() => setRating(s)} className="transition-transform hover:scale-110 focus:outline-none">
                            <Star size={36} className={`${s <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`} />
                        </button>
                    ))}
                </div>

                <textarea
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm mb-4 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                    rows={3}
                    placeholder="Write a comment (optional)..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                />

                <button
                    onClick={handleSubmit}
                    disabled={rating === 0 || submitting}
                    className="w-full bg-black text-white py-3.5 rounded-xl font-bold btn-press disabled:opacity-50 hover:bg-gray-800 transition-colors"
                >
                    {submitting ? 'Submitting...' : 'Submit Rating'}
                </button>
            </div>
        </div>
    );
};

export default RatingModal;
