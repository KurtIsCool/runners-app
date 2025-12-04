import { useState, useRef } from 'react';
import { Camera, X, Upload } from 'lucide-react';

interface PaymentUploadProps {
    onUpload: (url: string) => void;
    currentUrl?: string;
}

export default function PaymentUpload({ onUpload, currentUrl }: PaymentUploadProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(currentUrl || null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                setPreview(result);
                // In a real app, upload to storage here. Using Data URL for prototype.
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
            <label className="block text-xs font-bold uppercase text-gray-500">Attach Payment Receipt</label>

            {preview ? (
                <div className="relative rounded-lg overflow-hidden border border-gray-200">
                    <img src={preview} alt="Payment Receipt" className="w-full h-40 object-cover" />
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
                    className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center text-gray-500 cursor-pointer hover:bg-gray-50 transition-colors bg-white"
                >
                    <Upload className="w-6 h-6 mb-2 text-blue-500" />
                    <span className="text-xs font-medium">Upload GCash Screenshot</span>
                </div>
            )}

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
            />
        </div>
    );
}
