import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Check, Upload, User, MapPin, Mail, Phone, Calendar, Pen, Info } from "lucide-react";
import { toast } from "sonner";
import { SafeImage } from "@/components/SafeImage";
import { INDIA_STATES_AND_CITIES } from "@/constants/indiaLocations";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const languagesList = ["English", "Hindi", "Punjabi", "Haryanvi", "Tamil", "Telugu", "Kannada", "Malayalam", "Bengali", "Marathi", "Gujarati"];

const VetProfileSettings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  const [profile, setProfile] = useState({
    name: "",
    full_name: "",
    email: "",
    phone: "",
    birth_date: "",
    gender: "",
    city: "",
    state: "",
    address: "",
    profile_photo: "",
  });
  
  const [vetProfile, setVetProfile] = useState<{ preferred_language: string[] }>({
    preferred_language: [],
  });
  
  const [emailStatus, setEmailStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [newEmail, setNewEmail] = useState("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate("/auth"); return; }

    const [pRes, vpRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", session.user.id).single(),
      supabase.from("vet_profiles").select("*").eq("user_id", session.user.id).single()
    ]);

    if (pRes.data || vpRes.data) {
      let photoUrl = vpRes.data?.profile_photo || pRes.data?.profile_photo || "";
      if (photoUrl && !photoUrl.startsWith("http")) {
        const publicUrlData = supabase.storage.from("vet-documents").getPublicUrl(photoUrl).data;
        if (publicUrlData) photoUrl = publicUrlData.publicUrl;
      }
      setProfile({
        name: pRes.data?.name || "",
        full_name: pRes.data?.full_name || "",
        email: pRes.data?.email || "",
        phone: pRes.data?.phone || "",
        birth_date: pRes.data?.birth_date || "",
        gender: pRes.data?.gender || "",
        city: pRes.data?.city || "",
        state: pRes.data?.state || "",
        address: pRes.data?.address || "",
        profile_photo: photoUrl,
      });
      setNewEmail(pRes.data?.email || "");
    }
    
    if (vpRes.data) {
      setVetProfile({
        preferred_language: vpRes.data.preferred_language ? vpRes.data.preferred_language.split(", ") : [],
      });
    }
    
    setLoading(false);
    } catch (err) {
      console.error("Failed to fetch vet profile data:", err);
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    setUploadingPhoto(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${session.user.id}/profile_photo_${Date.now()}.${ext}`;
      
      const { error: uploadError } = await supabase.storage.from('vet-documents').upload(path, file);
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from('vet-documents').getPublicUrl(path);
      const publicUrl = publicUrlData.publicUrl;

      // Update both profiles and vet_profiles
      const { error: pErr } = await supabase.from('profiles').update({ profile_photo: publicUrl }).eq('id', session.user.id);
      const { error: vpErr } = await supabase.from('vet_profiles').update({ profile_photo: publicUrl }).eq('user_id', session.user.id);
      
      if (pErr || vpErr) throw new Error("Failed to update profile record");

      setProfile(prev => ({ ...prev, profile_photo: publicUrl }));
      toast.success("Profile photo updated successfully!");
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Failed to upload photo");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleUpdateEmail = async () => {
    if (newEmail === profile.email) {
      toast.info("This is already your current email");
      return;
    }
    if (!newEmail.includes("@")) {
      toast.error("Please enter a valid email");
      return;
    }
    
    setEmailStatus("sending");
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    if (error) {
      toast.error(error.message);
      setEmailStatus("idle");
    } else {
      toast.success("Verification email sent! Please check both your old and new inbox.");
      setEmailStatus("sent");
    }
  };

  const updateProfileField = async (field: string, value: string) => {
    setProfile(p => ({ ...p, [field]: value }));
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    
    await supabase.from("profiles").update({ [field]: value }).eq("id", session.user.id);
    
    // Auto-sync city and state to vet_profiles
    if (field === "city" || field === "state") {
      await supabase.from("vet_profiles").update({ [field]: value }).eq("user_id", session.user.id);
    }
  };

  const updateVetProfileField = async (field: string, value: string | string[]) => {
    setVetProfile(p => ({ ...p, [field]: value }));
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    
    const dbValue = Array.isArray(value) ? value.join(", ") : value;
    await supabase.from("vet_profiles").update({ [field]: dbValue }).eq("user_id", session.user.id);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F8FC] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#9A3EF8] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F8FC] font-sans pb-24 text-[#1A1A2A]">
      <header className="flex items-center px-5 py-6 bg-white border-b border-gray-100 shadow-sm sticky top-0 z-40">
        <button 
          onClick={() => navigate(-1)}
          className="w-[42px] h-[42px] rounded-full bg-slate-50 flex items-center justify-center border-none cursor-pointer active:scale-95 transition-all shrink-0"
        >
          <ArrowLeft size={20} weight="bold" />
        </button>
        <h1 className="text-[18px] font-[800] text-[#1f1f2e] ml-4 flex-grow">
          Profile Settings
        </h1>
      </header>

      <main className="max-w-3xl mx-auto p-6 space-y-8">
        
        {/* Personal Info */}
        <section className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-6">
          <h2 className="text-[15px] font-extrabold flex items-center gap-2 mb-4">
            <User className="w-4 h-4 text-[#9A3EF8]" />
            Personal Details
          </h2>
          
          {/* Photo Section inside Personal Details */}
          <div className="flex flex-col items-center sm:items-start justify-center sm:justify-start gap-3 w-full border-b border-gray-50 pb-6">
            <input 
              type="file" 
              accept="image/*" 
              onChange={handlePhotoUpload} 
              className="hidden" 
              id="profile-photo-upload" 
            />
            <label htmlFor="profile-photo-upload" className="cursor-pointer group flex flex-col items-center">
              <div className="w-[100px] h-[100px] rounded-full overflow-hidden bg-purple-50 ring-4 ring-purple-50 flex items-center justify-center relative shadow-sm transition-all group-hover:ring-purple-100">
                {profile.profile_photo ? (
                  <SafeImage src={profile.profile_photo} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-10 h-10 text-[#9A3EF8]" />
                )}
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  {uploadingPhoto ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Pen className="w-5 h-5 text-white" />
                  )}
                </div>
              </div>
            </label>
            <p className="text-xs font-semibold text-gray-400 text-center sm:text-left mt-1">Tap photo to update</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-2">Full Name</label>
              <div className="bg-[#F7F8FC] px-4 py-3.5 rounded-2xl text-sm font-semibold text-gray-600 border border-gray-100 cursor-not-allowed">
                {profile.full_name || profile.name || "N/A"}
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-2">Phone Number</label>
              <div className="bg-[#F7F8FC] px-4 py-3.5 rounded-2xl text-sm font-semibold text-gray-600 border border-gray-100 cursor-not-allowed flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-400" />
                {profile.phone || "N/A"}
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-2">Date of Birth</label>
              <div className="bg-[#F7F8FC] px-4 py-3.5 rounded-2xl text-sm font-semibold text-gray-600 border border-gray-100 cursor-not-allowed flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                {profile.birth_date || "N/A"}
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-2">Gender</label>
              <div className="bg-[#F7F8FC] px-4 py-3.5 rounded-2xl text-sm font-semibold text-gray-600 border border-gray-100 cursor-not-allowed capitalize">
                {profile.gender || "N/A"}
              </div>
            </div>
          </div>
          <p className="text-[11px] font-medium text-gray-400 flex items-center gap-1.5 mt-2 bg-gray-50 p-2.5 rounded-xl">
            <Info className="w-3.5 h-3.5 shrink-0" />
            To change these details, please contact Sruvo support with your Govt ID.
          </p>
        </section>

        {/* Email Edit Section */}
        <section className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
          <h2 className="text-[15px] font-extrabold flex items-center gap-2">
            <Mail className="w-4 h-4 text-[#9A3EF8]" />
            Email Address
          </h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <input 
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="flex-1 bg-white border border-gray-200 outline-none px-4 py-3.5 rounded-2xl text-sm font-semibold text-[#1A1A2A] focus:border-[#9A3EF8] transition-colors"
            />
            <button 
              onClick={handleUpdateEmail}
              disabled={emailStatus !== "idle" || newEmail === profile.email}
              className="bg-[#9A3EF8] text-white font-bold text-sm px-6 py-3.5 rounded-2xl hover:bg-[#8E3EFE] transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {emailStatus === "sending" ? "Sending OTP..." : emailStatus === "sent" ? "Check Inbox" : "Update Email"}
            </button>
          </div>
          {emailStatus === "sent" && (
            <p className="text-xs font-medium text-green-600 bg-green-50 p-3 rounded-xl border border-green-100 flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              Verification link has been sent. Check the inbox of your new email to verify.
            </p>
          )}
        </section>

        {/* Editable Fields */}
        <section className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-5">
          <h2 className="text-[15px] font-extrabold flex items-center gap-2 mb-2">
            <MapPin className="w-4 h-4 text-[#9A3EF8]" />
            Location & Preferences
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-2">State</label>
              <Select value={profile.state} onValueChange={(val) => {
                updateProfileField("state", val);
                updateProfileField("city", ""); // Reset city when state changes
              }}>
                <SelectTrigger className="w-full h-[52px] rounded-2xl bg-white border-gray-200 text-sm font-semibold">
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px] rounded-2xl">
                  {Object.keys(INDIA_STATES_AND_CITIES).map((state) => (
                    <SelectItem key={state} value={state} className="rounded-xl">{state}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-2">City</label>
              <Select 
                value={profile.city} 
                onValueChange={(val) => updateProfileField("city", val)}
                disabled={!profile.state}
              >
                <SelectTrigger className="w-full h-[52px] rounded-2xl bg-white border-gray-200 text-sm font-semibold disabled:opacity-50">
                  <SelectValue placeholder={<span className="text-slate-400">{profile.state ? "Select City" : "Select State first"}</span>} />
                </SelectTrigger>
                <SelectContent className="max-h-[300px] rounded-2xl">
                  {profile.state && (INDIA_STATES_AND_CITIES[profile.state as keyof typeof INDIA_STATES_AND_CITIES] || []).map(c => (
                    <SelectItem key={c} value={c} className="rounded-xl">{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-2">Full Address</label>
              <input 
                type="text"
                value={profile.address}
                onChange={(e) => setProfile(p => ({ ...p, address: e.target.value }))}
                onBlur={() => updateProfileField("address", profile.address)}
                placeholder="House No, Street, Area"
                className="w-full bg-white border border-gray-200 outline-none px-4 py-3.5 rounded-2xl text-sm font-semibold focus:border-[#9A3EF8] transition-colors"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-2">Preferred Languages</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full h-[52px] justify-between rounded-2xl border-gray-200 bg-white hover:bg-slate-50 shadow-none font-semibold text-sm px-4">
                    <div className="flex flex-wrap gap-1 items-center overflow-hidden">
                      {vetProfile.preferred_language.length > 0 ? (
                        vetProfile.preferred_language.length <= 2 ? (
                          vetProfile.preferred_language.map(lang => (
                            <Badge key={lang} variant="secondary" className="rounded-lg font-bold text-[10px] bg-purple-50 text-[#9A3EF8] border-purple-100 px-1.5 py-0.5 h-auto">
                              {lang}
                            </Badge>
                          ))
                        ) : (
                          <>
                            {vetProfile.preferred_language.slice(0, 2).map(lang => (
                              <Badge key={lang} variant="secondary" className="rounded-lg font-bold text-[10px] bg-purple-50 text-[#9A3EF8] border-purple-100 px-1.5 py-0.5 h-auto">
                                {lang}
                              </Badge>
                            ))}
                            <Badge variant="secondary" className="rounded-lg font-bold text-[10px] bg-slate-100 text-slate-700 border-slate-200 px-1.5 py-0.5 h-auto">
                              +{vetProfile.preferred_language.length - 2}
                            </Badge>
                          </>
                        )
                      ) : (
                        <span className="text-slate-400">Select languages (Max 4)</span>
                      )}
                    </div>
                    <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search language..." className="h-9" />
                    <CommandList className="max-h-[300px]">
                      <CommandEmpty>No language found.</CommandEmpty>
                      <CommandGroup>
                        {languagesList.map((lang) => (
                          <CommandItem
                            key={lang}
                            value={lang}
                            onSelect={() => {
                              const current = vetProfile.preferred_language;
                              let updated = [];
                              if (current.includes(lang)) {
                                updated = current.filter((l) => l !== lang);
                              } else {
                                if (current.length >= 4) {
                                  toast.error("Maximum 4 languages allowed");
                                  return;
                                }
                                updated = [...current, lang];
                              }
                              updateVetProfileField("preferred_language", updated);
                            }}
                            className="text-xs sm:text-sm"
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4 text-[#9A3EF8]",
                                vetProfile.preferred_language.includes(lang) ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {lang}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
};

export default VetProfileSettings;
