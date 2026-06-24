import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CaretLeft, Plus, Trash, SuitcaseSimple } from "@phosphor-icons/react";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import SplashScreen from "@/components/SplashScreen";

const MyServices = () => {
  const navigate = useNavigate();
  const { user, isLoading: guardLoading, showSpinner } = useRoleGuard(["vet"], "/auth/vet", true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [services, setServices] = useState<string[]>([]);
  const [newService, setNewService] = useState("");

  const fetchServices = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("vet_profiles")
        .select("specializations")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching services:", error);
        toast.error("Failed to load services");
      } else if (data) {
        setServices(data.specializations || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchServices();
    }
  }, [user]);

  const handleAddService = () => {
    const trimmed = newService.trim();
    if (!trimmed) return;
    if (services.includes(trimmed)) {
      toast.error("Service already added");
      return;
    }
    setServices([...services, trimmed]);
    setNewService("");
  };

  const handleRemoveService = (serviceToRemove: string) => {
    setServices(services.filter((s) => s !== serviceToRemove));
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("vet_profiles")
        .update({ specializations: services })
        .eq("user_id", user.id);

      if (error) {
        console.error("Error saving services:", error);
        toast.error("Failed to update services");
      } else {
        toast.success("Services updated successfully");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred");
    } finally {
      setSaving(false);
    }
  };

  if (showSpinner || guardLoading || loading) {
    return <SplashScreen message="Loading services..." />;
  }

  return (
    <div className="bg-[#FDFBFF] min-h-screen pb-24 font-sans text-slate-900 selection:bg-purple-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md px-4 py-4 flex items-center justify-between border-b border-slate-100">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 text-slate-700 hover:bg-slate-50 rounded-full transition-colors"
        >
          <CaretLeft size={24} weight="bold" />
        </button>
        <h1 className="text-xl font-bold text-slate-900">My Services</h1>
        <div className="w-10 h-10" /> {/* Spacer */}
      </header>

      <main className="max-w-md mx-auto px-5 py-6">
        {/* Intro */}
        <div className="bg-purple-50/50 rounded-2xl p-5 mb-6 border border-purple-100/40 flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 shrink-0">
            <SuitcaseSimple size={24} weight="fill" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-[15px]">Onboarded Services</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              These are the services you selected during onboarding. You can update your active services here.
            </p>
          </div>
        </div>

        {/* Add Service Section */}
        <div className="mb-8">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Add New Service</h2>
          <div className="flex gap-2">
            <input 
              type="text"
              value={newService}
              onChange={(e) => setNewService(e.target.value)}
              placeholder="e.g. Vaccination, Deworming, Surgery"
              className="flex-1 bg-white rounded-2xl border border-slate-100 px-4 py-3.5 text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 shadow-sm"
              onKeyDown={(e) => e.key === "Enter" && handleAddService()}
            />
            <button 
              onClick={handleAddService}
              className="w-12 h-12 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center shadow-md active:scale-95 transition-all shrink-0"
            >
              <Plus size={22} weight="bold" />
            </button>
          </div>
        </div>

        {/* Active Services List */}
        <div className="mb-8">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Active Services ({services.length})</h2>
          {services.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-8 text-center">
              <p className="text-sm font-medium text-slate-400">No services listed. Add some above.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {services.map((service, idx) => (
                <div 
                  key={idx}
                  className="bg-white rounded-2xl p-4 flex items-center justify-between border border-slate-100/60 shadow-[0_2px_12px_rgba(0,0,0,0.02)]"
                >
                  <span className="font-bold text-slate-800 text-[15px]">{service}</span>
                  <button 
                    onClick={() => handleRemoveService(service)}
                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors active:scale-95"
                  >
                    <Trash size={18} weight="bold" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Save Button */}
        <button 
          onClick={handleSave}
          disabled={saving}
          className="w-full py-4 rounded-3xl bg-gradient-to-br from-[#B26BFF] to-[#8E2DE2] text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-purple-200 active:scale-95 transition-all disabled:opacity-50"
        >
          {saving ? "Saving Changes..." : "Save Changes"}
        </button>
      </main>
    </div>
  );
};

export default MyServices;
