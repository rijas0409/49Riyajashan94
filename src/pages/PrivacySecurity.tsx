import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Lock, Eye, Shield, Trash2 } from "lucide-react";
import { toast } from "sonner";

const PrivacySecurity = () => {
  const navigate = useNavigate();
  const [biometric, setBiometric] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwords, setPasswords] = useState({ newPassword: "", confirmPassword: "" });

  const handleChangePassword = async () => {
    if (passwords.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: passwords.newPassword });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password updated successfully");
      setPasswords({ newPassword: "", confirmPassword: "" });
    }
  };

  const handleDeleteAccount = () => {
    toast.info("Please contact support to delete your account");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">Privacy & Security</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-lg space-y-6">
        {/* Change Password */}
        <div>
          <h3 className="font-semibold mb-3">Change Password</h3>
          <Card className="p-5 rounded-2xl border-0 shadow-sm space-y-3">
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="New Password"
                value={passwords.newPassword}
                onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                className="rounded-xl pr-10"
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                <Eye className="w-4 h-4" />
              </button>
            </div>
            <Input
              type="password"
              placeholder="Confirm Password"
              value={passwords.confirmPassword}
              onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
              className="rounded-xl"
            />
            <Button onClick={handleChangePassword} className="w-full rounded-xl">
              Update Password
            </Button>
          </Card>
        </div>

        {/* Security Settings */}
        <div>
          <h3 className="font-semibold mb-3">Security</h3>
          <div className="space-y-3">
            <Card className="p-4 rounded-2xl border-0 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <Lock className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">Biometric Login</h3>
                  <p className="text-sm text-muted-foreground">Use fingerprint or face ID</p>
                </div>
                <Switch checked={biometric} onCheckedChange={setBiometric} />
              </div>
            </Card>

            <Card className="p-4 rounded-2xl border-0 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">Two-Factor Authentication</h3>
                  <p className="text-sm text-muted-foreground">Add extra layer of security</p>
                </div>
                <Button variant="outline" size="sm" className="rounded-xl" onClick={() => toast.info("Coming soon")}>
                  Setup
                </Button>
              </div>
            </Card>
          </div>
        </div>

        {/* Danger Zone */}
        <div>
          <h3 className="font-semibold mb-3 text-destructive">Danger Zone</h3>
          <Card
            className="p-4 rounded-2xl border-2 border-destructive/20 shadow-sm cursor-pointer hover:shadow-md transition-all"
            onClick={handleDeleteAccount}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-destructive/10 rounded-2xl flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-destructive" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-destructive">Delete Account</h3>
                <p className="text-sm text-muted-foreground">Permanently delete your account and data</p>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default PrivacySecurity;
