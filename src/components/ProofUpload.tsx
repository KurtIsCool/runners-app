import { useState, useRef } from 'react';
import { Camera, X } from 'lucide-react';

interface ProofUploadProps {
    onUpload: (url: string) => void;
    currentUrl?: string;
    isUploading?: boolean;
}

export default function ProofUpload({ onUpload, currentUrl }: ProofUploadProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(currentUrl || null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                setPreview(result);
                // In a real app, you would upload this file to Supabase Storage here.
                // For this implementation, we will pass the Data URL directly
                // (or a mock URL if strictly simulating backend upload)
                // Since we can't easily setup Storage buckets here, we'll use the data URL as the "uploaded" URL.
                onUpload(result);
            };
            reader.readAsDataURL(file);
        }
    };

    const clearImage = () => {
        setPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Proof of Delivery</label>

            {preview ? (
                <div className="relative rounded-lg overflow-hidden border border-gray-200">
                    <img src={preview} alt="Proof of Delivery" className="w-full h-48 object-cover" />
                    <button
                        onClick={clearImage}
                        className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full hover:bg-black/70"
                    >
                        <X size={16} />
                    </button>
                </div>
            ) : (
                <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center text-gray-500 cursor-pointer hover:bg-gray-50 transition-colors"
                >
                    <Camera className="w-8 h-8 mb-2" />
                    <span className="text-sm">Tap to take photo or upload</span>
                </div>
            )}

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
                capture="environment" // prompt for camera on mobile
            />
        </div>
    );
}
