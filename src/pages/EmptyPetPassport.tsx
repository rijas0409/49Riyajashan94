import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Fingerprint, QrCode, Shield, PlusCircle, ShieldCheck } from 'lucide-react';

const EmptyPetPassport = () => {
  const navigate = useNavigate();
  const [showFlow, setShowFlow] = useState(false);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data === 'close_pet_passport_flow') {
        setShowFlow(false);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <>
      {/* Background iframe to avoid load latency, shown when showFlow is true */}
      <div className={`fixed inset-0 z-[9999] bg-[#fffbfe] transition-opacity duration-300 ${showFlow ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <iframe 
          src="/rjpass.html" 
          className="w-full h-full border-0" 
          allow="camera *; microphone *; autoplay *"
          title="Pet Passport Flow"
        />
      </div>

      <div className="bg-[#fffbfe] text-[#412b36] antialiased selection:bg-[#fcebf3] font-['Inter',_sans-serif] overflow-x-hidden min-h-screen">
        <main className="min-h-[100dvh] flex items-center justify-center px-4 py-8">
            <div className="w-full max-w-md mx-auto text-center space-y-10">
                
                {/* Back button */}
                <div className="absolute top-6 left-6 text-left w-full max-w-md">
                    <button onClick={() => navigate('/buyer/profile')} className="w-10 h-10 flex items-center justify-center bg-white shadow-sm border border-[#fcebf3] rounded-full text-[#7c6872] hover:text-[#d95191] transition-all">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                </div>

                <div className="relative flex justify-center mt-12">
                    <div className="absolute inset-0 bg-[#d95191]/10 blur-3xl -z-10 rounded-full scale-125"></div>
                    
                    <div className="relative w-48 h-64 sm:w-56 sm:h-72">
                        <div className="absolute top-3 left-3 w-full h-full bg-[#fbe7f0] rounded-xl rotate-3"></div>
                        
                        <div className="absolute inset-0 bg-white/85 backdrop-blur-[20px] border border-white/60 shadow-xl rounded-xl flex flex-col p-5 overflow-hidden transition-all duration-500">
                            <div className="flex justify-between items-start mb-6">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#d95191] to-[#f381b8] flex items-center justify-center text-white shadow-sm">
                                    <Fingerprint className="w-6 h-6" />
                                </div>
                                <div className="bg-[#f8daf0]/60 px-2.5 py-0.5 rounded-full border border-[#d95191]/10 flex items-center">
                                    <span className="text-[8px] font-bold tracking-widest text-[#853164] uppercase">Sruvo ID</span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="h-1.5 w-3/4 bg-[#f7d3e3] rounded-full"></div>
                                <div className="h-1.5 w-1/2 bg-[#f7d3e3] rounded-full"></div>
                                <div className="pt-4 grid grid-cols-2 gap-3">
                                    <div className="h-8 bg-[#fdf4f8] rounded-md border border-[#fbe7f0]"></div>
                                    <div className="h-8 bg-[#fdf4f8] rounded-md border border-[#fbe7f0]"></div>
                                </div>
                            </div>

                            <div className="mt-auto self-end w-12 h-12 bg-[#fdf4f8] rounded-lg p-1.5 flex items-center justify-center border border-[#fbe7f0]">
                                <QrCode className="w-8 h-8 text-[#d95191]/40" />
                            </div>
                        </div>

                        <div className="absolute -bottom-4 -right-4 w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center z-10 border border-[#fcebf3]">
                            <div className="w-12 h-12 rounded-full bg-[#fcebf3] flex items-center justify-center">
                                <span className="material-symbols-outlined text-[#d95191] text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>shield_with_heart</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-3 px-2">
                    <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#412b36]">
                        No Pet Passport Yet
                    </h1>
                    <p className="text-base sm:text-lg text-[#7c6872] leading-relaxed">
                        Create a secure digital identity for your pet to manage health records and travel docs in one space.
                    </p>
                </div>

                <div className="flex flex-col items-center gap-5">
                    <button onClick={() => setShowFlow(true)} className="w-full sm:w-auto group relative flex items-center justify-center gap-3 px-10 py-4 bg-gradient-to-r from-[#d95191] to-[#e56ba4] text-white rounded-full font-bold text-lg shadow-[0_10px_25px_rgba(217,81,145,0.3)] active:scale-95 transition-all">
                        <PlusCircle className="w-6 h-6" />
                        Add Your First Pet
                    </button>
                    
                    <div className="flex items-center gap-2 px-4 py-2 bg-[#fdf4f8] rounded-full border border-[#fcebf3]/30">
                        <ShieldCheck className="w-4 h-4 text-[#d95191]" />
                        <span className="text-[10px] font-bold text-[#7c6872] tracking-wider uppercase">Secure Storage</span>
                    </div>
                </div>
            </div>
        </main>

        <div className="fixed top-0 left-0 w-full h-full -z-20 pointer-events-none">
            <div className="absolute top-1/4 -left-20 w-72 h-72 bg-[#d95191]/5 rounded-full blur-[80px]"></div>
            <div className="absolute bottom-1/4 -right-20 w-72 h-72 bg-[#d95191]/10 rounded-full blur-[80px]"></div>
        </div>

      </div>
    </>
  );
};

export default EmptyPetPassport;
