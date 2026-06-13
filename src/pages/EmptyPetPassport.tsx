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
    const timeout = setTimeout(() => {
      setIsIframeLoading(false);
    }, 800); // Safety fallback so the UI never hangs while heavy resources load (like TFJS in the iframe)
    return () => clearTimeout(timeout);
  }, [iframeSrc, isIframeActive]);

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const uid = user?.id || "";
        setUserId(uid);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);

        try {
          const res = await fetch(`/api/pet-passport?userId=${uid}&_t=${Date.now()}`, { signal: controller.signal });
          clearTimeout(timeoutId);
          if (res.ok) {
            const data = await res.json();
            const count = Array.isArray(data) ? data.length : 0;
            setPassportCount(count);

            const urlParams = new URLSearchParams(window.location.search);
            const checkCreate = urlParams.get("create") === "true";

            if (checkCreate) {
              setIframeSrc(`/rjpass.html?userId=${uid}`);
              setIsIframeActive(true);
            } else if (count > 0) {
              setIframeSrc(`/mypassport.html?userId=${uid}`);
              setIsIframeActive(true);
            } else {
              setIframeSrc(`/nopassportyet.html`);
            }
          } else {
            setPassportCount(0);
            setIframeSrc(`/nopassportyet.html`);
          }
        } catch (fetchErr: any) {
           clearTimeout(timeoutId);
           console.error("Failed to check passports fetch:", fetchErr);
           setPassportCount(0);
           setIframeSrc(`/nopassportyet.html`);
        }
      } catch (e) {
        console.error("Failed to check passports overall:", e);
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
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 12000);
          fetch(`/api/pet-passport?userId=${userId}&_t=${Date.now()}`, { signal: controller.signal })
            .then((res) => {
              clearTimeout(timeoutId);
              return res.json();
            })
            .then((data) => {
              if (Array.isArray(data) && data.length > 0) {
                setPassportCount(data.length);
                setIsIframeActive(true);
              } else {
                setPassportCount(0);
                setIsIframeActive(false);
                setIframeSrc(`/nopassportyet.html`);
              }
            })
            .catch(err => {
               clearTimeout(timeoutId);
               console.error("fetch passports via message error:", err);
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
      {/* Lightweight inline loader if needed */}
      {showLoadingOverlay && (
        <div className="absolute top-4 right-4 z-[110] bg-white shadow-sm border border-slate-100 rounded-full px-3 py-1.5 flex items-center gap-2 animate-pulse">
           <div className="w-3 h-3 rounded-full border-2 border-primary/20 border-t-primary animate-spin"></div>
           <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Syncing</span>
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
