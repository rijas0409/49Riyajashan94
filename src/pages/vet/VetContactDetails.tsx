import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CaretLeft, EnvelopeSimple, Phone, MapPin } from "@phosphor-icons/react";
import { supabase } from "@/integrations/supabase/client";

const VetContactDetails = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<{
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
  } | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        setProfile(data);
      } catch (err) {
        console.error("Failed to fetch profile in VetContactDetails:", err);
      }
    };
    fetchProfile();
  }, []);

  return (
    <div className="bg-[#FDFBFF] min-h-screen pb-24 font-sans text-slate-900 selection:bg-purple-100">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md px-4 py-4 flex items-center border-b border-transparent">
        <button onClick={() => navigate(-1)} className="p-2 text-slate-700 hover:bg-slate-50 rounded-full transition-colors mr-4">
          <CaretLeft size={24} weight="bold" />
        </button>
        <h1 className="text-xl font-bold text-slate-900">Contact Details</h1>
      </header>

      <main className="max-w-md mx-auto px-5 pt-6 space-y-4">
        <div className="bg-white rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-slate-100">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-500 shrink-0">
              <EnvelopeSimple size={24} weight="bold" />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm text-slate-500 font-semibold uppercase tracking-wider">Email Address</p>
              <p className="text-base font-bold text-slate-900 truncate">{profile?.email || "Loading..."}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-500 shrink-0">
              <Phone size={24} weight="bold" />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm text-slate-500 font-semibold uppercase tracking-wider">Phone Number</p>
              <p className="text-base font-bold text-slate-900 truncate">{profile?.phone || "Loading..."}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-500 shrink-0">
              <MapPin size={24} weight="bold" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-slate-500 font-semibold uppercase tracking-wider">Address</p>
              <p className="text-base font-bold text-slate-900 leading-snug">
                {profile?.address ? `${profile.address}, ${profile.city}, ${profile.state}` : "Loading..."}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default VetContactDetails;
