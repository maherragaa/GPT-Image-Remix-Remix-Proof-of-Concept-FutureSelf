import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, RefreshCw, Check, Upload } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (image: string) => void;
  initialImage?: string | null;
  gender?: string;
}

const PRESET_AVATARS: Record<string, string[]> = {
  Male: [
    "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&h=300&fit=crop",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop"
  ],
  Female: [
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&h=300&fit=crop",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=300&fit=crop",
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop"
  ],
  Other: [
    "https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?w=300&h=300&fit=crop",
    "https://images.unsplash.com/photo-1531891437562-4301cf35b7e4?w=300&h=300&fit=crop",
    "https://images.unsplash.com/photo-1488161628813-04466f872507?w=300&h=300&fit=crop"
  ]
};

export function CameraCapture({ onCapture, initialImage, gender = "Other" }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(initialImage || null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const compressImage = (dataUrl: string, maxWidth: number, maxHeight: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        } else {
          reject('Could not get canvas context');
        }
      };
      img.onerror = reject;
      img.src = dataUrl;
    });
  };

  const startCamera = async () => {
    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Could not access camera. Please check your browser permissions.");
    }
  };

  const capture = async () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
      const rawImage = canvas.toDataURL('image/jpeg');
      stopCamera();
      
      try {
        const compressedImage = await compressImage(rawImage, 800, 800);
        setCapturedImage(compressedImage);
        onCapture(compressedImage);
      } catch (err) {
        console.error("Failed to compress capture", err);
        setCapturedImage(rawImage);
        onCapture(rawImage);
      }
    }
  };

  const stopCamera = () => {
    stream?.getTracks().forEach(track => track.stop());
    setStream(null);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const rawString = reader.result as string;
        try {
          const compressedImage = await compressImage(rawString, 800, 800);
          setCapturedImage(compressedImage);
          onCapture(compressedImage);
        } catch (err) {
          console.error("Failed to compress upload", err);
          setCapturedImage(rawString);
          onCapture(rawString);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePresetSelect = (url: string) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = async () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        const rawString = canvas.toDataURL('image/jpeg', 0.8);
        try {
          const compressedImage = await compressImage(rawString, 800, 800);
          setCapturedImage(compressedImage);
          onCapture(compressedImage);
        } catch (err) {
          console.error("Failed to compress preset", err);
          setCapturedImage(rawString);
          onCapture(rawString);
        }
      }
    };
    img.onerror = () => {
      console.error("Failed to load preset avatar image");
    };
    img.src = url;
  };

  const triggerFileInput = (isNativeCamera: boolean = false) => {
    if (isNativeCamera) {
      document.getElementById('native-camera-input')?.click();
    } else {
      fileInputRef.current?.click();
    }
  };

  const presets = PRESET_AVATARS[gender] || PRESET_AVATARS["Other"];

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
      {!capturedImage ? (
        <div className="space-y-4">
          {!stream ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button onClick={startCamera} className="w-full hidden sm:flex">
                  <Camera className="mr-2 w-4 h-4" /> Start Camera
                </Button>
                <Button onClick={() => triggerFileInput(true)} className="w-full sm:hidden">
                  <Camera className="mr-2 w-4 h-4" /> Take Selfie
                </Button>
                <Button onClick={() => triggerFileInput(false)} variant="outline" className="w-full">
                  <Upload className="mr-2 w-4 h-4" /> Upload Photo
                </Button>
              </div>
              <input 
                type="file" 
                accept="image/*" 
                capture="user"
                id="native-camera-input"
                className="hidden" 
                onChange={handleFileUpload} 
                onClick={(e) => { (e.target as HTMLInputElement).value = '' }}
              />
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                onClick={(e) => { (e.target as HTMLInputElement).value = '' }}
              />

              <div className="pt-2 border-t border-slate-200">
                <p className="text-sm font-medium text-slate-500 mb-3 text-center">Or select a ready-made avatar</p>
                <div className="flex justify-center gap-4">
                  {presets.map((url, idx) => (
                    <button 
                      key={idx} 
                      onClick={() => handlePresetSelect(url)}
                      className="relative rounded-full overflow-hidden w-16 h-16 border-2 border-transparent hover:border-[#9081B1] hover:scale-105 transition-all focus:outline-none focus:ring-2 focus:ring-[#9081B1]"
                      title="Select this avatar"
                    >
                      <img src={url || undefined} alt={`Preset avatar ${idx + 1}`} className="w-full h-full object-cover" crossOrigin="anonymous"/>
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <video ref={videoRef} autoPlay playsInline className="w-full rounded-lg" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button onClick={capture} className="w-full">
                  <Camera className="mr-2 w-4 h-4" /> Capture Face
                </Button>
                <Button onClick={stopCamera} variant="outline" className="w-full">
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <img src={capturedImage || undefined} alt="Captured" className="w-full rounded-lg" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button onClick={() => { setCapturedImage(null); startCamera(); }} variant="outline" className="w-full hidden sm:flex">
              <RefreshCw className="mr-2 w-4 h-4" /> Retake
            </Button>
            <Button onClick={() => { setCapturedImage(null); triggerFileInput(true); }} variant="outline" className="w-full sm:hidden">
              <RefreshCw className="mr-2 w-4 h-4" /> Retake
            </Button>
            <Button onClick={() => { setCapturedImage(null); triggerFileInput(false); }} variant="outline" className="w-full">
              <Upload className="mr-2 w-4 h-4" /> Upload New
            </Button>
          </div>
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            onClick={(e) => { (e.target as HTMLInputElement).value = '' }}
          />
        </div>
      )}
    </div>
  );
}
