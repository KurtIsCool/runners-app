import { useState, useRef } from 'react';
import { Camera, X, Loader2 } from 'lucide-react';

interface ProofUploadProps {
    onUpload: (url: string) => void;
    currentUrl?: string;
    isUploading?: boolean;
}

export default function ProofUpload({ onUpload, currentUrl }: ProofUploadProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(currentUrl || null);
    const [processing, setProcessing] = useState(false);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setProcessing(true);
            try {
                const compressedUrl = await compressImage(file);
                setPreview(compressedUrl);
                onUpload(compressedUrl);
            } catch (error) {
                console.error("Image processing failed:", error);
                alert("Failed to process image. Please try again.");
            } finally {
                setProcessing(false);
            }
        }
    };

    const compressImage = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    if (!ctx) {
                        reject(new Error("Canvas context not available"));
                        return;
                    }

                    // Calculate new dimensions (max 1024px)
                    const MAX_WIDTH = 1024;
                    const MAX_HEIGHT = 1024;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    ctx.drawImage(img, 0, 0, width, height);

                    // Compress to JPEG with 0.7 quality
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                    resolve(dataUrl);
                };
                img.onerror = (err) => reject(err);
            };
            reader.onerror = (err) => reject(err);
        });
    };

    const clearImage = () => {
        setPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Proof of Delivery</label>

            {processing ? (
                <div className="border border-gray-200 rounded-lg p-6 flex flex-col items-center justify-center text-gray-500 h-48">
                    <Loader2 className="w-8 h-8 animate-spin mb-2" />
                    <span className="text-sm">Processing image...</span>
                </div>
            ) : preview ? (
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
