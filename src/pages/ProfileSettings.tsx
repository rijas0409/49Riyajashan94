import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Camera } from "lucide-react";
import { toast } from "sonner";

const ProfileSettings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    full_name: "",
    profile_photo: "",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate("/auth"); return; }

    const { data } = await supabase
      .from("profiles")
      .select("name, email, phone, full_name, profile_photo")
      .eq("id", session.user.id)
      .single();

    if (data) {
      setProfile({
        name: data.name || "",
        email: data.email || "",
        phone: data.phone || "",
        full_name: data.full_name || "",
        profile_photo: data.profile_photo || "",
      });
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { error } = await supabase
      .from("profiles")
      .update({
        name: profile.name,
        phone: profile.phone,
        full_name: profile.full_name,
      })
      .eq("id", session.user.id);

    if (error) {
      toast.error("Failed to update profile");
    } else {
      toast.success("Profile updated successfully");
    }
    setSaving(false);
  };

  const getInitial = () => profile.name?.[0]?.toUpperCase() || "U";

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">Profile Settings</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-lg space-y-6">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-primary/10">
              {profile.profile_photo ? (
                <img src={profile.profile_photo} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-primary flex items-center justify-center text-white text-3xl font-bold">
                  {getInitial()}
                </div>
              )}
            </div>
            <button className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground">
              <Camera className="w-4 h-4" />
            </button>
          </div>
        </div>

        <Card className="p-5 rounded-2xl border-0 shadow-sm space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Display Name</label>
            <Input
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              className="rounded-xl"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Full Name</label>
            <Input
              value={profile.full_name}
              onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
              className="rounded-xl"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Email</label>
            <Input value={profile.email} disabled className="rounded-xl bg-muted" />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Phone</label>
            <Input
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              placeholder="+91 XXXXX XXXXX"
              className="rounded-xl"
            />
          </div>
        </Card>

        <Button onClick={handleSave} disabled={saving} className="w-full rounded-2xl h-12 text-base font-semibold">
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </main>
    </div>
  );
};

export default ProfileSettings;
