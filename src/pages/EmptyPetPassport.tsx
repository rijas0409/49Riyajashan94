/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PawPrint, Plus, ShieldCheck, ArrowLeft, Loader2 } from "lucide-react";

const EmptyPetPassport = () => {
  const navigate = useNavigate();
  const [passportCount, setPassportCount] = useState<number | null>(null);
  const [iframeSrc, setIframeSrc] = useState<string>("/mypassport.html");
  const [isIframeActive, setIsIframeActive] = useState(false);

  useEffect(() => {
    const checkPassports = async () => {
      try {
        const res = await fetch("/api/pet-passport");
        if (res.ok) {
          const data = await res.json();
          const count = Array.isArray(data) ? data.length : 0;
          setPassportCount(count);

          // If user has passports, they should immediately see the list (iframe)
          if (count > 0) {
            setIsIframeActive(true);
          }
        } else {
          setPassportCount(0);
        }
      } catch (e) {
        console.error("Failed to check passports:", e);
        setPassportCount(0);
      }
    };
    checkPassports();
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data === "close_pet_passport_flow") {
        if (iframeSrc.includes("/rjpass.html")) {
          // Return from details/creation to main companion dashboard
          setIframeSrc("/mypassport.html");
          // Re-check count to see if we should stay in iframe or go to empty state
          fetch("/api/pet-passport")
            .then((res) => res.json())
            .then((data) => {
              if (Array.isArray(data) && data.length > 0) {
                setPassportCount(data.length);
                setIsIframeActive(true);
              } else {
                setPassportCount(0);
                setIsIframeActive(false);
              }
            });
        } else {
          // Exit passport flow to buyer profile
          navigate("/buyer/profile");
        }
      } else if (event.data === "create_new_passport") {
        setIframeSrc("/rjpass.html");
        setIsIframeActive(true);
      } else if (event.data && event.data.type === "open_passport") {
        const passportId = event.data.passportId;
        setIframeSrc(`/rjpass.html?id=${encodeURIComponent(passportId)}`);
        setIsIframeActive(true);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [iframeSrc, navigate]);

  const handleCreateFirst = () => {
    setIframeSrc("/rjpass.html");
    setIsIframeActive(true);
  };

  // Loading state
  if (passportCount === null) {
    return (
      <div className="min-h-screen bg-[#fffbfe] flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-10 h-10 text-[#d95191] animate-spin mb-4" />
        <p className="text-[#7c6872] font-semibold font-mono text-sm uppercase tracking-widest">
          Checking Identities...
        </p>
      </div>
    );
  }

  // Case A: No passports yet (Serving uploaded HTML via iframe)
  if (!isIframeActive && passportCount === 0) {
    return (
      <div className="fixed inset-0 w-full h-full bg-[#fffbfe] z-[100]">
        <iframe
          src="/nopassportyet.html"
          className="w-full h-full border-none"
          title="No Passport Yet"
        />
      </div>
    );
  }

  // Case B: Has passports or explicit flow active (Iframe Screen)
  return (
    <div className="fixed inset-0 w-full h-full bg-[#fffbfe] z-[100]">
      <iframe
        key={iframeSrc}
        src={iframeSrc}
        className="w-full h-full border-none"
        allow="camera *; microphone *; autoplay *"
        title="Pet Passport Flow"
      />
    </div>
  );
};

export default EmptyPetPassport;
