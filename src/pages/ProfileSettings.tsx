import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "@/contexts/LocationContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { 
  ArrowLeft, Camera, User, Phone, Mail, Sparkles, Check, 
  Upload, Heart, ShieldCheck, Compass, Lock, PawPrint,
  Dog, Cat, Bird, MapPin, Plus, Trash2, Home, Briefcase
} from "lucide-react";
import { toast } from "sonner";
import { SafeImage } from "@/components/SafeImage";
import { motion, AnimatePresence } from "motion/react";

import dogAvatar1 from '@/assets/images/dog_avatar_1_1783701749330.jpg';
import dogAvatar2 from '@/assets/images/dog_avatar_2_1783701760930.jpg';
import dogAvatar3 from '@/assets/images/dog_avatar_3_1783701771466.jpg';
import catAvatar1 from '@/assets/images/cat_avatar_1_1783701781407.jpg';
import catAvatar2 from '@/assets/images/cat_avatar_2_1783701792687.jpg';
import birdAvatar1 from '@/assets/images/bird_avatar_1_1783701806124.jpg';
import birdAvatar2 from '@/assets/images/bird_avatar_2_1783701816738.jpg';
import hamsterAvatar1 from '@/assets/images/hamster_avatar_1_1783701827694.jpg';
import hamsterAvatar2 from '@/assets/images/hamster_avatar_2_1783701840456.jpg';

const PRESET_AVATARS = [
  { id: "dog1", url: dogAvatar1, label: "Golden Retriever" },
  { id: "dog2", url: dogAvatar2, label: "Pug" },
  { id: "dog3", url: dogAvatar3, label: "Husky" },
  { id: "cat1", url: catAvatar1, label: "Ginger Cat" },
  { id: "cat2", url: catAvatar2, label: "Tuxedo Cat" },
  { id: "bird1", url: birdAvatar1, label: "Parrot" },
  { id: "bird2", url: birdAvatar2, label: "Canary" },
  { id: "hamster1", url: hamsterAvatar1, label: "Brown Hamster" },
  { id: "hamster2", url: hamsterAvatar2, label: "Grey Hamster" }
];

const FAVORITE_PETS = [
  { id: "dog", label: "Dog", icon: Dog },
  { id: "cat", label: "Cat", icon: Cat },
  { id: "bird", label: "Bird", icon: Bird },
  { id: "hamster", label: "Hamster", icon: PawPrint }
];

const ProfileSettings = () => {
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
  const { city, setCity, cities } = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "preferences">("details");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uniqueStates = Array.from(new Set(cities.map(c => c.state))).sort();
  const initialUserState = cities.find(c => c.name === city)?.state || "";
  const [selectedState, setSelectedState] = useState(initialUserState);

  const [profile, setProfile] = useState({
    username: "",
    name: "",
    email: "",
    phone: "",
    full_name: "",
    profile_photo: "",
  });

  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");

  // Local-only preferences stored per user
  const [preferences, setPreferences] = useState({
    bio: "",
    favPets: [] as string[],
    badgeTheme: "royal",
    receiveReminders: true,
    whatsappUpdates: true,
  });

  // Saved addresses states
  const [addresses, setAddresses] = useState<any[]>([]);
  const [fetchingAddresses, setFetchingAddresses] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState({ address_line: "", city: "", state: "", pincode: "" });

  useEffect(() => {
    fetchProfileAndPrefs();
  }, []);

  useEffect(() => {
    if (activeTab === "addresses") {
      fetchAddresses();
    }
  }, [activeTab]);

  useEffect(() => {
    if (!profile.username || profile.username === profile.name) {
      setUsernameStatus("idle");
      return;
    }
    const checkUsername = async () => {
      setUsernameStatus("checking");
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        
        const { data, error } = await supabase
          .from("profiles")
          .select("id")
          .eq("username", profile.username.toLowerCase())
          .neq("id", session.user.id)
          .maybeSingle();
          
        if (error && error.code !== "PGRST204") {
          console.error("Username check error:", error);
          setUsernameStatus("idle");
          return;
        }
        if (data) {
          setUsernameStatus("taken");
        } else {
          setUsernameStatus("available");
        }
      } catch (err) {
        console.error(err);
        setUsernameStatus("idle");
      }
    };
    
    const timeoutId = setTimeout(checkUsername, 500);
    return () => clearTimeout(timeoutId);
  }, [profile.username, profile.name]);

  useEffect(() => {
    if (city) {
      const stateForCity = cities.find(c => c.name === city)?.state;
      if (stateForCity) setSelectedState(stateForCity);
    }
  }, [city, cities]);

  const fetchAddresses = async () => {
    setFetchingAddresses(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data } = await supabase
        .from("addresses")
        .select("*")
        .eq("user_id", session.user.id)
        .order("is_default", { ascending: false });

      setAddresses(data || []);
    } catch (err) {
      console.error("Failed to fetch addresses:", err);
    } finally {
      setFetchingAddresses(false);
    }
  };

  const handleAddAddress = async () => {
    if (!addressForm.address_line || !addressForm.city || !addressForm.state || !addressForm.pincode) {
      toast.error("Please fill all fields");
      return;
    }
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { error } = await supabase.from("addresses").insert({
      ...addressForm,
      user_id: session.user.id,
      is_default: addresses.length === 0,
    });

    if (error) {
      toast.error("Failed to add address");
    } else {
      toast.success("Address added successfully");
      setAddressForm({ address_line: "", city: "", state: "", pincode: "" });
      setShowAddressForm(false);
      fetchAddresses();
    }
  };

  const handleDeleteAddress = async (id: string) => {
    const { error } = await supabase.from("addresses").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete address");
    } else {
      toast.success("Address deleted successfully");
      fetchAddresses();
    }
  };

  const handleSetDefaultAddress = async (id: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    
    await supabase.from("addresses").update({ is_default: false }).eq("user_id", session.user.id);
    await supabase.from("addresses").update({ is_default: true }).eq("id", id);
    
    toast.success("Default address updated");
    fetchAddresses();
  };

  const fetchProfileAndPrefs = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { 
        navigate("/auth/buyer"); 
        return; 
      }

      // 1. Fetch DB profile
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
      }

      if (data) {
        let photoUrl = data.profile_photo || "";
        if (photoUrl && !photoUrl.startsWith("http")) {
          const { data: pubData } = supabase.storage.from("seller-documents").getPublicUrl(photoUrl);
          photoUrl = pubData?.publicUrl || "";
        }
        setProfile({
          username: data.username || data.name || "",
          name: data.name || "",
          email: data.email || session.user.email || "",
          phone: data.phone || "",
          full_name: data.full_name || "",
          profile_photo: photoUrl,
        });
      } else {
        setProfile(prev => ({
          ...prev,
          email: session.user.email || "",
        }));
      }

      // 2. Fetch local storage preferences
      const storedPrefs = localStorage.getItem(`sruvo_prefs_${session.user.id}`);
      if (storedPrefs) {
        try {
          const parsed = JSON.parse(storedPrefs);
          // Map legacy sharePassport to whatsappUpdates if present, to be safe
          if (parsed.sharePassport !== undefined && parsed.whatsappUpdates === undefined) {
            parsed.whatsappUpdates = !parsed.sharePassport;
          }
          setPreferences(prev => ({ ...prev, ...parsed }));
        } catch (e) {
          console.error("Failed to parse preferences", e);
        }
      }

      // Fetch addresses too
      fetchAddresses();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // 1. Save core details to Supabase database
      if (usernameStatus === "taken") {
        toast.error("Username is already taken");
        setSaving(false);
        return;
      }
      const { error } = await supabase
        .from("profiles")
        .update({
          username: profile.username.toLowerCase(),
          name: profile.name,
          phone: profile.phone,
          full_name: profile.full_name,
        })
        .eq("id", session.user.id);

      if (error) throw error;

      // 2. Save preferences to LocalStorage
      localStorage.setItem(`sruvo_prefs_${session.user.id}`, JSON.stringify(preferences));

      // 3. Refresh context caches immediately
      await refreshProfile();

      toast.success("Profile & Preferences updated successfully!", {
        description: "Your Sruvo dashboard is now updated.",
        duration: 3500,
      });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to update profile settings.");
    } finally {
      setSaving(false);
    }
  };

  // Profile picture upload function
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload a valid image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image file is too large. Max size is 5MB");
      return;
    }

    setUploading(true);
    setUploadProgress(15);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      setUploadProgress(40);
      const fileExt = file.name.split('.').pop();
      const fileName = `${session.user.id}-${Date.now()}.${fileExt}`;
      const filePath = `profiles/${fileName}`;

      setUploadProgress(65);
      const { error: uploadError } = await supabase.storage
        .from('seller-documents')
        .upload(filePath, file, { cacheControl: '3600', upsert: true });

      if (uploadError) throw uploadError;

      setUploadProgress(85);
      const { data: { publicUrl } } = supabase.storage
        .from('seller-documents')
        .getPublicUrl(filePath);

      // Save to Database instantly
      const { error: dbError } = await supabase
        .from("profiles")
        .update({ profile_photo: filePath })
        .eq("id", session.user.id);

      if (dbError) {
        // Fallback storing absolute URL
        await supabase
          .from("profiles")
          .update({ profile_photo: publicUrl })
          .eq("id", session.user.id);
      }

      setProfile(prev => ({ ...prev, profile_photo: publicUrl }));
      setUploadProgress(100);
      
      await refreshProfile();
      toast.success("New profile photo set successfully!");
    } catch (error: any) {
      console.error("Error uploading profile photo:", error);
      toast.error(error.message || "Failed to upload photo");
    } finally {
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
      }, 500);
    }
  };

  const selectPresetAvatar = async (avatarUrl: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Update in profiles database
      const { error: dbError } = await supabase
        .from("profiles")
        .update({ profile_photo: avatarUrl })
        .eq("id", session.user.id);

      if (dbError) throw dbError;

      setProfile(prev => ({ ...prev, profile_photo: avatarUrl }));
      await refreshProfile();
      toast.success("Avatar selected successfully!");
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to update avatar.");
    }
  };

  const toggleFavoritePet = (petId: string) => {
    setPreferences(prev => {
      const isSelected = prev.favPets.includes(petId);
      const updated = isSelected 
        ? prev.favPets.filter(id => id !== petId)
        : [...prev.favPets, petId];
      return { ...prev, favPets: updated };
    });
  };

  const getInitial = () => profile.name?.[0]?.toUpperCase() || "U";

  return (
    <div className="min-h-screen bg-[#faf8fc] pb-12">
      {/* Dynamic Background Blob Decorations */}
      <div className="absolute top-0 right-0 w-[350px] h-[350px] bg-primary/5 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute top-40 left-0 w-[250px] h-[250px] bg-indigo-500/5 rounded-full blur-[60px] pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-purple-100/60 shadow-[0_2px_15px_-3px_rgba(155,81,224,0.03)]">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between max-w-4xl">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-full hover:bg-purple-50 transition-colors" 
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </Button>
            <div>
              <h1 className="text-lg font-bold bg-gradient-primary bg-clip-text text-transparent">Profile Settings</h1>
            </div>
          </div>
          <Button 
            onClick={handleSave} 
            disabled={saving} 
            size="sm"
            className="rounded-full bg-gradient-primary hover:opacity-95 text-white font-semibold text-xs px-4 h-9 shadow-md shadow-primary/20 active:scale-95 transition-all"
          >
            {saving ? (
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                Save Changes
              </span>
            )}
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-4xl space-y-6 relative">
        
        {/* Navigation Tabs */}
        <div className="flex bg-purple-50/50 p-1 rounded-2xl border border-purple-100 max-w-md mx-auto">
          <button
            onClick={() => setActiveTab("details")}
            className={`flex-1 py-3 text-center rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
              activeTab === "details"
                ? "bg-white text-primary shadow-sm"
                : "text-muted-foreground hover:text-gray-700"
            }`}
          >
            <User className="w-4 h-4" />
            Basic Details
          </button>
          <button
            onClick={() => setActiveTab("preferences")}
            className={`flex-1 py-3 text-center rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
              activeTab === "preferences"
                ? "bg-white text-primary shadow-sm"
                : "text-muted-foreground hover:text-gray-700"
            }`}
          >
            <Heart className="w-4 h-4" />
            Pet Preferences
          </button>
        </div>

        {/* Tab Content Box */}
        <AnimatePresence mode="wait">
          {activeTab === "details" ? (
            <motion.div
              key="details-tab"
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 15 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Photo Upload Section */}
              <Card className="p-6 rounded-[24px] border border-purple-50 shadow-[0_4px_20px_-4px_rgba(155,81,224,0.04)] bg-white space-y-6">
                <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                  <Camera className="w-4 h-4 text-primary" />
                  Profile Photo
                </h3>

                <div className="flex flex-col items-center justify-center py-4 bg-purple-50/25 rounded-2xl border border-dashed border-purple-100/80">
                  <div 
                    className="relative cursor-pointer group"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="w-24 h-24 rounded-full overflow-hidden bg-purple-50 border-4 border-white flex items-center justify-center shadow-lg relative transition-all group-hover:scale-105">
                      {profile.profile_photo ? (
                        <SafeImage src={profile.profile_photo} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-primary flex items-center justify-center text-white text-3xl font-bold">
                          {getInitial()}
                        </div>
                      )}

                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-semibold">
                        <Camera className="w-5 h-5 mb-1" />
                        Change
                      </div>

                      {/* Upload Loading Spinner */}
                      {uploading && (
                        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white">
                          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mb-1" />
                          <span className="text-[9px] font-bold">{uploadProgress}%</span>
                        </div>
                      )}
                    </div>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileUpload} 
                      accept="image/*" 
                      className="hidden" 
                    />
                  </div>
                  
                  <p className="text-xs font-bold text-gray-700 mt-4">Click photo to browse your files</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Supports JPG or PNG format</p>
                </div>

                {/* Swipeable Preset Cute Avatars */}
                <div className="pt-4 border-t border-purple-50">
                  <p className="text-[11px] font-bold text-muted-foreground mb-3 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-[#f22c83]" />
                    OR CHOOSE ADORABLE PET PARENT AVATARS
                  </p>
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x">
                    {PRESET_AVATARS.map((avatar) => {
                      const isSelected = profile.profile_photo === avatar.url;
                      return (
                        <button
                          key={avatar.id}
                          type="button"
                          onClick={() => selectPresetAvatar(avatar.url)}
                          className="relative rounded-xl overflow-hidden border-2 transition-all hover:scale-105 active:scale-95 flex items-center justify-center group bg-purple-50 shadow-sm w-[49px] h-[49px] flex-shrink-0 snap-center"
                          style={{
                            borderColor: isSelected ? "#a428f0" : "transparent"
                          }}
                          title={avatar.label}
                        >
                          <img src={avatar.url} alt={avatar.label} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                          {isSelected && (
                            <div className="absolute inset-0 bg-primary/20 backdrop-blur-[1px] flex items-center justify-center">
                              <Check className="w-4 h-4 text-white drop-shadow" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </Card>

              {/* Form Input Card */}
              <Card className="p-6 rounded-[24px] border border-purple-50 shadow-[0_4px_20px_-4px_rgba(155,81,224,0.04)] bg-white space-y-6">
                <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 border-b border-purple-50 pb-3">
                  <User className="w-4 h-4 text-primary" />
                  Personal Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Username Input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        Username
                        <span className="text-red-500">*</span>
                      </span>
                      {usernameStatus === "checking" && <span className="text-[10px] text-muted-foreground animate-pulse">Checking...</span>}
                      {usernameStatus === "available" && <span className="text-[10px] text-green-600 font-bold">Available</span>}
                      {usernameStatus === "taken" && <span className="text-[10px] text-red-600 font-bold">Taken</span>}
                    </label>
                    <div className="relative rounded-xl overflow-hidden">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Sparkles className="h-4 w-4 text-purple-400" />
                      </div>
                      <Input
                        value={profile.username}
                        onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                        placeholder="e.g. rijaspabla"
                        className={`rounded-xl pl-9 h-11 text-gray-800 font-medium transition-colors ${
                          usernameStatus === "taken" ? "border-red-400 focus-visible:ring-red-400" : "border-purple-100 focus-visible:ring-primary focus-visible:border-primary"
                        }`}
                      />
                    </div>
                  </div>

                  {/* Full Name Input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Full Name</label>
                    <div className="relative rounded-xl overflow-hidden">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-4 w-4 text-purple-400" />
                      </div>
                      <Input
                        value={profile.full_name}
                        onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                        placeholder="e.g. Rijas Pabla"
                        className="rounded-xl pl-9 border-purple-100 focus-visible:ring-primary focus-visible:border-primary text-gray-800 h-11"
                      />
                    </div>
                  </div>

                  {/* Email (Disabled Account ID) */}
                  <div className="space-y-1.5 relative">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide flex justify-between items-center">
                      <span>Email Address</span>
                      <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                        <Check className="w-3 h-3" /> VERIFIED ID
                      </span>
                    </label>
                    <div className="relative rounded-xl overflow-hidden">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-4 w-4 text-gray-400" />
                      </div>
                      <Input 
                        value={profile.email} 
                        disabled 
                        className="rounded-xl pl-9 border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed h-11" 
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <Lock className="h-3.5 w-3.5 text-gray-400" />
                      </div>
                    </div>
                  </div>

                  {/* Phone Input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Phone Number</label>
                    <div className="relative rounded-xl overflow-hidden">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone className="h-4 w-4 text-purple-400" />
                      </div>
                      <Input
                        value={profile.phone}
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                        placeholder="+91 XXXXX XXXXX"
                        className="rounded-xl pl-9 border-purple-100 focus-visible:ring-primary focus-visible:border-primary text-gray-800 h-11"
                      />
                    </div>
                  </div>

                  {/* Location Selection */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">State</label>
                      <div className="relative">
                        <select
                          value={selectedState}
                          onChange={(e) => setSelectedState(e.target.value)}
                          className="w-full rounded-xl border border-purple-100 bg-white h-11 px-3 text-xs focus:ring-2 focus:ring-primary focus:border-transparent appearance-none font-medium cursor-pointer"
                        >
                          <option value="">Select State</option>
                          {uniqueStates.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-400">
                          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">City</label>
                      <div className="relative">
                        <select
                          value={city}
                          disabled={!selectedState}
                          onChange={(e) => {
                            setCity(e.target.value);
                            toast.success(`Location synchronized to ${e.target.value}`);
                          }}
                          className="w-full rounded-xl border border-purple-100 bg-white h-11 px-3 text-xs focus:ring-2 focus:ring-primary focus:border-transparent appearance-none font-medium disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed cursor-pointer"
                        >
                          <option value="">
                            {selectedState ? "Select City" : "Select State First"}
                          </option>
                          {cities
                            .filter((c) => c.state === selectedState)
                            .map((c) => (
                              <option key={c.id} value={c.name}>
                                {c.name}
                              </option>
                            ))}
                        </select>
                        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-400">
                          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ) : activeTab === "preferences" ? (
            <motion.div
              key="preferences-tab"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Pet Preferences Card */}
              <Card className="p-6 rounded-[24px] border border-purple-50 shadow-[0_4px_20px_-4px_rgba(155,81,224,0.04)] bg-white space-y-5">
                <div>
                  <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                    <Heart className="w-4 h-4 text-primary animate-pulse" />
                    My Favorite Pet Types
                  </h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Select the pets you love. We customize your Sruvo shop & vet listings based on this.</p>
                </div>

                {/* Clickable Multi-Select Grid - Fully Responsive */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                  {FAVORITE_PETS.map((pet) => {
                    const isSelected = preferences.favPets.includes(pet.id);
                    const IconComponent = pet.icon;
                    return (
                      <button
                        key={pet.id}
                        type="button"
                        onClick={() => toggleFavoritePet(pet.id)}
                        className={`py-4 px-3 rounded-2xl border text-xs font-bold transition-all text-center flex flex-col items-center justify-center gap-2 active:scale-95 relative ${
                          isSelected
                            ? "bg-purple-50 border-primary text-primary shadow-sm"
                            : "bg-white border-purple-100/60 text-gray-600 hover:bg-purple-50/20"
                        }`}
                      >
                        <IconComponent className={`w-5 h-5 ${isSelected ? "text-primary" : "text-gray-400"}`} />
                        <span>{pet.label}</span>
                        {isSelected && (
                          <span className="absolute top-2 right-2 w-4 h-4 bg-primary text-white rounded-full flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Pet Parent Bio */}
                <div className="space-y-1.5 pt-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Pet Parent Bio / Story</label>
                  <textarea
                    value={preferences.bio}
                    onChange={(e) => setPreferences({ ...preferences, bio: e.target.value })}
                    placeholder="Tell us about yourself and your furry friends! For example: Proud Husky dad who loves weekend hikes."
                    rows={4}
                    className="w-full rounded-xl border border-purple-100 p-3 text-sm text-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-transparent placeholder:text-gray-400"
                  />
                </div>
              </Card>

              {/* Safety, Settings & Privacy Options */}
              <Card className="p-6 rounded-[24px] border border-purple-50 shadow-[0_4px_20px_-4px_rgba(155,81,224,0.04)] bg-white space-y-4">
                <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 border-b border-purple-50 pb-3">
                  <Compass className="w-4 h-4 text-primary" />
                  Account Settings
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                  {/* Reminder Option */}
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-purple-50/25 border border-purple-100/40">
                    <div className="space-y-0.5 pr-4">
                      <p className="text-xs font-bold text-gray-800">Receive Vet Reminders</p>
                      <p className="text-[10px] text-muted-foreground">Receive push notification checkups and vaccination alerts</p>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setPreferences(prev => ({ ...prev, receiveReminders: !prev.receiveReminders }))}
                      className={`w-10 h-6 rounded-full transition-colors relative flex items-center flex-shrink-0 ${
                        preferences.receiveReminders ? "bg-primary" : "bg-gray-200"
                      }`}
                    >
                      <div className={`w-4 bg-white aspect-square rounded-full shadow-sm transition-all absolute ${
                        preferences.receiveReminders ? "right-1" : "left-1"
                      }`} />
                    </button>
                  </div>

                  {/* WhatsApp Order Updates Option */}
                  <div className="flex items-center justify-between p-4 rounded-2xl bg-purple-50/25 border border-purple-100/40">
                    <div className="space-y-0.5 pr-4">
                      <p className="text-xs font-bold text-gray-800">WhatsApp Updates</p>
                      <p className="text-[10px] text-muted-foreground">Get real-time order tracking and appointment updates on WhatsApp</p>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setPreferences(prev => ({ ...prev, whatsappUpdates: !prev.whatsappUpdates }))}
                      className={`w-10 h-6 rounded-full transition-colors relative flex items-center flex-shrink-0 ${
                        preferences.whatsappUpdates ? "bg-primary" : "bg-gray-200"
                      }`}
                    >
                      <div className={`w-4 bg-white aspect-square rounded-full shadow-sm transition-all absolute ${
                        preferences.whatsappUpdates ? "right-1" : "left-1"
                      }`} />
                    </button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* Action Button at bottom */}
        <div className="flex justify-center mt-6">
          <Button 
            onClick={handleSave} 
            disabled={saving || usernameStatus === "taken"} 
            className="w-full max-w-xs rounded-[20px] h-13 text-base font-bold bg-gradient-primary hover:opacity-95 text-white shadow-lg shadow-purple-500/10 active:scale-[0.99] transition-all"
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Applying settings...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Save Profile & Preferences
              </span>
            )}
          </Button>
        </div>
        
        {/* Support note */}
        <div className="text-center pt-3">
          <p className="text-xs text-muted-foreground font-medium flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Your account data is secure and protected in Sruvo ecosystem.
          </p>
        </div>

      </main>
    </div>
  );
};

export default ProfileSettings;

