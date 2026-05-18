import React, { useState } from 'react';
import { Camera, AlertCircle } from 'lucide-react';

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallback?: React.ReactNode;
}

export const SafeImage: React.FC<SafeImageProps> = ({ fallback, className, src, alt, ...props }) => {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  if (!src) {
    return <div className={`flex items-center justify-center bg-gray-100 ${className}`}>{fallback || <Camera className="w-1/4 h-1/4 text-gray-400" />}</div>;
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      )}
      {error ? (
        <div className="flex flex-col items-center justify-center h-full w-full bg-gray-100 text-gray-500 p-2">
          <AlertCircle className="w-6 h-6 mb-1" />
          <p className="text-xs">Error loading</p>
        </div>
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
