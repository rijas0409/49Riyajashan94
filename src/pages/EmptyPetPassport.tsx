/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const EmptyPetPassport = () => {
  const navigate = useNavigate();
  const [iframeSrc, setIframeSrc] = useState<string>("/mypassport.html");

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data === 'close_pet_passport_flow') {
        if (iframeSrc.includes('/rjpass.html')) {
          // Return from details/creation to main companion dashboard
          setIframeSrc("/mypassport.html");
        } else {
          // Exit passport flow to buyer profile
          navigate('/buyer/profile');
        }
      } else if (event.data === 'create_new_passport') {
        setIframeSrc("/rjpass.html");
      } else if (event.data && event.data.type === 'open_passport') {
        const passportId = event.data.passportId;
        setIframeSrc(`/rjpass.html?id=${encodeURIComponent(passportId)}`);
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [iframeSrc, navigate]);

  return (
    <div className="fixed inset-0 w-full h-full bg-[#fffbfe]">
      <iframe 
        key={iframeSrc}
        src={iframeSrc} 
        className="w-full h-full border-0" 
        allow="camera *; microphone *; autoplay *"
        title="Pet Passport Flow"
      />
    </div>
  );
};

export default EmptyPetPassport;
