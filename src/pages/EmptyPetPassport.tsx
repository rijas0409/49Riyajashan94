/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const EmptyPetPassport = () => {
  const navigate = useNavigate();
  const [passportCount, setPassportCount] = useState<number | null>(null);
  const [iframeSrc, setIframeSrc] = useState<string>("");
  const [isIframeActive, setIsIframeActive] = useState(false);
  const [isIframeLoading, setIsIframeLoading] = useState(true);
  const [userId, setUserId] = useState<string>("");

  // Trigger loading view on URL or view active state alterations
  useEffect(() => {
    setIsIframeLoading(true);
  }, [iframeSrc, isIframeActive]);

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const uid = session?.user?.id || "";
        setUserId(uid);
        
        const res = await fetch(`/api/pet-passport?userId=${uid}`);
        if (res.ok) {
          const data = await res.json();
          const count = Array.isArray(data) ? data.length : 0;
          setPassportCount(count);

          // If user has passports, they should immediately see the list (iframe)
          if (count > 0) {
            setIframeSrc(`/mypassport.html?userId=${uid}`);
            setIsIframeActive(true);
          } else {
            setIframeSrc(`/nopassportyet.html`);
          }
        } else {
          setPassportCount(0);
          setIframeSrc(`/nopassportyet.html`);
        }
      } catch (e) {
        console.error("Failed to check passports:", e);
        setPassportCount(0);
        setIframeSrc(`/nopassportyet.html`);
      }
    };
    init();
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data === "close_pet_passport_flow") {
        if (iframeSrc.includes("/rjpass.html")) {
          // Return from details/creation to main companion dashboard
          setIframeSrc(`/mypassport.html?userId=${userId}`);
          // Re-check count to see if we should stay in iframe or go to empty state
          fetch(`/api/pet-passport?userId=${userId}`)
            .then((res) => res.json())
            .then((data) => {
              if (Array.isArray(data) && data.length > 0) {
                setPassportCount(data.length);
                setIsIframeActive(true);
              } else {
                setPassportCount(0);
                setIsIframeActive(false);
                setIframeSrc(`/nopassportyet.html`);
              }
            });
        } else {
          // Exit passport flow to buyer profile
          navigate("/buyer/profile");
        }
      } else if (event.data === "create_new_passport") {
        setIframeSrc(`/rjpass.html?userId=${userId}`);
        setIsIframeActive(true);
      } else if (event.data && event.data.type === "open_passport") {
        const passportId = event.data.passportId;
        setIframeSrc(`/rjpass.html?id=${encodeURIComponent(passportId)}&userId=${userId}`);
        setIsIframeActive(true);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [iframeSrc, navigate, userId]);

  const showLoadingOverlay = passportCount === null || isIframeLoading;

  return (
    <div className="fixed inset-0 w-full h-full bg-[#fffbfe] z-[100] overflow-hidden">
      {/* Premium Branded Loading Overlay */}
      {showLoadingOverlay && (
        <div className="absolute inset-0 z-[110] bg-[#fffbfe] flex flex-col items-center justify-center p-6 text-center transition-all duration-300">
          <div className="relative w-20 h-20 mb-6 flex items-center justify-center">
            {/* Double rotating ring animation */}
            <div className="absolute inset-0 rounded-full border-4 border-[#fff0f5] border-t-[#d95191] animate-spin"></div>
            <div className="absolute inset-2 rounded-full border-4 border-[#fff0f5] border-b-[#853164] animate-spin [animation-direction:reverse] opacity-80"></div>
            <img 
              src="/IMG_20260606_213853.png" 
              alt="Paw" 
              className="w-10 h-10 object-contain drop-shadow-sm animate-pulse z-10"
            />
          </div>
          <h3 className="text-slate-800 font-extrabold text-sm tracking-wide mb-1">
            {passportCount === null ? "Verifying Passport Vault..." : "Unlocking Digital Passport..."}
          </h3>
          <p className="text-[#a08b96] font-mono text-[10px] uppercase tracking-[0.25em] animate-pulse">
            Sruvo Security Core Syncing
          </p>
        </div>
      )}

      {/* Render matching frame source in raw background silently */}
      {passportCount !== null && (
        <iframe
          key={iframeSrc}
          src={!isIframeActive && passportCount === 0 ? "/nopassportyet.html" : iframeSrc}
          className="w-full h-full border-none"
          allow="camera *; microphone *; autoplay *"
          title="Pet Passport Sync"
          onLoad={() => {
            // Once loaded, fade out loading protection
            setIsIframeLoading(false);
          }}
        />
      )}
    </div>
  );
};

export default EmptyPetPassport;
