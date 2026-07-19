import React, { useState, useEffect } from 'react';
import { Camera, AlertCircle } from 'lucide-react';

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallback?: React.ReactNode;
}

export const SafeImage: React.FC<SafeImageProps> = ({ fallback, className, src, alt, ...props }) => {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  // Reset state when source image changes to allow reloading new images
  useEffect(() => {
    setError(false);
    setLoading(true);
  }, [src]);

  if (!src) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className}`}>
        {fallback || <Camera className="w-1/4 h-1/4 text-gray-400" />}
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      )}
      {error ? (
        fallback || (
          <div className="flex flex-col items-center justify-center h-full w-full bg-gray-100 text-gray-400 p-2 text-center">
            <Camera className="w-1/3 h-1/3 opacity-60 mb-1" />
            <span className="text-[10px] font-medium">Not Available</span>
          </div>
        )
      ) : (
        <img
          src={src}
          alt={alt}
          className={`w-full h-full object-cover transition-opacity duration-300 ${loading ? 'opacity-0' : 'opacity-100'}`}
          onLoad={() => setLoading(false)}
          onError={() => { setError(true); setLoading(false); }}
          referrerPolicy="no-referrer"
          {...props}
        />
      )}
    </div>
  );
};
