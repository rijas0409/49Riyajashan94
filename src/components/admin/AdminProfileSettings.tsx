import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Camera, Save, ArrowLeft, User, Mail, Phone, MapPin } from "lucide-react";

interface Props {
  user: any;
  onBack: () => void;
  onProfileUpdate: (photo: string | null) => void;
}

const AdminProfileSettings = ({ user, onBack, onProfileUpdate }: Props) => {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState({
    name: "",
    full_name: "",
    email: "",
    phone: "",
    address: "",
    profile_photo: null as string | null,
  });

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    if (!user?.id) return;
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
    if (data) {
      setProfile({
        name: data.name || "",
        full_name: data.full_name || "",
        email: data.email || user.email || "",
        phone: data.phone || "",
        address: data.address || "",
        profile_photo: data.profile_photo,
      });
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 5MB allowed", variant: "destructive" });
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `admin/${user.id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("seller-documents")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      toast({ title: "Upload failed", variant: "destructive" });
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("seller-documents").getPublicUrl(path);
    const photoUrl = urlData.publicUrl + "?t=" + Date.now();

    // Update profile in DB
    await supabase.from("profiles").update({ profile_photo: photoUrl }).eq("id", user.id);
    setProfile((p) => ({ ...p, profile_photo: photoUrl }));
    onProfileUpdate(photoUrl);
    toast({ title: "Photo updated!" });
    setUploading(false);
  };

  const handleSave = async () => {
    setLoading(true);
    const { error } = await supabase.from("profiles").update({
      name: profile.name,
      full_name: profile.full_name,
      phone: profile.phone,
      address: profile.address,
    }).eq("id", user.id);

    if (error) {
      toast({ title: "Error saving", variant: "destructive" });
    } else {
      toast({ title: "Profile updated successfully!" });
    }
    setLoading(false);
  };

  const initial = (profile.name || "A")[0]?.toUpperCase();

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button onClick={onBack} className="w-10 h-10 rounded-xl bg-[hsl(220,20%,97%)] flex items-center justify-center hover:bg-[hsl(220,20%,94%)] transition-colors">
          <ArrowLeft className="w-5 h-5 text-[hsl(220,15%,45%)]" />
        </button>
        <div>
          <h1 className="text-[24px] md:text-[28px] font-bold text-[hsl(220,20%,15%)]">Profile Settings</h1>
          <p className="text-sm text-[hsl(220,15%,55%)]">Manage your admin profile</p>
        </div>
      </div>

      {/* Photo Upload */}
      <div className="bg-white rounded-2xl border border-[hsl(220,20%,92%)] p-6 mb-6">
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-[hsl(220,80%,55%)] to-[hsl(250,70%,55%)] flex items-center justify-center shadow-lg">
              {profile.profile_photo ? (
                <img src={profile.profile_photo} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white font-bold text-3xl">{initial}</span>
              )}
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[hsl(220,80%,50%)] text-white flex items-center justify-center shadow-md hover:bg-[hsl(220,80%,45%)] transition-colors"
            >
              <Camera className="w-4 h-4" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
          </div>
          <div>
            <p className="text-lg font-bold text-[hsl(220,20%,15%)]">{profile.full_name || profile.name || "Admin"}</p>
            <p className="text-sm text-[hsl(220,15%,55%)]">{profile.email}</p>
            {uploading && <p className="text-[12px] text-[hsl(220,80%,50%)] mt-1 animate-pulse">Uploading photo...</p>}
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-2xl border border-[hsl(220,20%,92%)] p-6">
        <h3 className="text-base font-bold text-[hsl(220,20%,15%)] mb-5">Personal Information</h3>
        <div className="space-y-4">
          <FormField
            icon={<User className="w-4 h-4 text-[hsl(220,15%,55%)]" />}
            label="Display Name"
            value={profile.name}
            onChange={(v) => setProfile((p) => ({ ...p, name: v }))}
          />
          <FormField
            icon={<User className="w-4 h-4 text-[hsl(220,15%,55%)]" />}
            label="Full Name"
            value={profile.full_name}
            onChange={(v) => setProfile((p) => ({ ...p, full_name: v }))}
          />
          <FormField
            icon={<Mail className="w-4 h-4 text-[hsl(220,15%,55%)]" />}
            label="Email"
            value={profile.email}
            onChange={() => {}}
            disabled
          />
          <FormField
            icon={<Phone className="w-4 h-4 text-[hsl(220,15%,55%)]" />}
            label="Phone"
            value={profile.phone}
            onChange={(v) => setProfile((p) => ({ ...p, phone: v }))}
            placeholder="+91 XXXXX XXXXX"
          />
          <FormField
            icon={<MapPin className="w-4 h-4 text-[hsl(220,15%,55%)]" />}
            label="Address"
            value={profile.address}
            onChange={(v) => setProfile((p) => ({ ...p, address: v }))}
            placeholder="Office address"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={loading}
          className="mt-6 w-full flex items-center justify-center gap-2 px-6 py-3 bg-[hsl(220,80%,50%)] text-white text-sm font-semibold rounded-xl hover:bg-[hsl(220,80%,45%)] transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
};

const FormField = ({ icon, label, value, onChange, disabled, placeholder }: {
  icon: React.ReactNode; label: string; value: string; onChange: (v: string) => void; disabled?: boolean; placeholder?: string;
}) => (
  <div>
    <label className="text-[12px] font-semibold text-[hsl(220,15%,45%)] uppercase tracking-wide mb-1.5 block">{label}</label>
    <div className="relative">
      <div className="absolute left-3.5 top-1/2 -translate-y-1/2">{icon}</div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        className={`w-full pl-10 pr-4 py-3 bg-[hsl(220,20%,97%)] border border-[hsl(220,20%,92%)] rounded-xl text-sm text-[hsl(220,20%,15%)] placeholder:text-[hsl(220,15%,65%)] focus:outline-none focus:ring-2 focus:ring-[hsl(220,80%,50%)]/20 focus:border-[hsl(220,80%,50%)] ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
      />
    </div>
  </div>
);

export default AdminProfileSettings;
