/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const PublicPetPassport: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [iframeSrc, setIframeSrc] = useState<string>('');

  useEffect(() => {
    if (id) {
      setIframeSrc(`/rjpass.html?id=${encodeURIComponent(id)}&visitor=true`);
    } else {
      setIframeSrc('/mypassport.html');
    }
  }, [id]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data === 'close_pet_passport_flow') {
        // Redirection on closing public passport view
        navigate('/buyer/home');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [navigate]);

  if (!iframeSrc) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#fffbfe]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
          <span className="text-sm font-semibold text-on-surface-variant font-mono">Loading Passport...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 w-full h-full bg-[#fffbfe] z-50">
      <iframe
        key={iframeSrc}
        src={iframeSrc}
        className="w-full h-full border-0"
        allow="camera *; microphone *; autoplay *"
        title="Public Pet Passport"
      />
    </div>
  );
};

export default PublicPetPassport;
