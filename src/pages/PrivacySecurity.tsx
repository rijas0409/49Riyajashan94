import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Lock, Eye, EyeOff, Shield, ShieldCheck, KeyRound } from "lucide-react";
import { toast } from "sonner";

const PrivacySecurity = () => {
  const navigate = useNavigate();
  const [biometric, setBiometric] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwords, setPasswords] = useState({ newPassword: "", confirmPassword: "" });

  const handleChangePassword = async () => {
    if (passwords.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long");
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
      toast.success("Security password updated successfully");
      setPasswords({ newPassword: "", confirmPassword: "" });
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8fc] pb-12 relative overflow-x-hidden">
      {/* Decorative Blur Blobs */}
      <div className="absolute top-0 right-0 w-[350px] h-[350px] bg-primary/5 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute top-40 left-0 w-[250px] h-[250px] bg-indigo-500/5 rounded-full blur-[60px] pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-purple-100/60 shadow-[0_2px_15px_-3px_rgba(155,81,224,0.03)]">
        <div className="container mx-auto px-4 py-3 flex items-center gap-4 max-w-4xl">
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full hover:bg-purple-50 transition-colors" 
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </Button>
          <div>
            <h1 className="text-lg font-bold bg-gradient-primary bg-clip-text text-transparent">Privacy & Security</h1>
            <p className="text-[10px] text-muted-foreground font-medium">Protect your Sruvo profile and account data</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-lg space-y-6 relative">
        {/* Change Password Card */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-gray-800">Change Password</h3>
          </div>
          <Card className="p-5 rounded-[24px] border border-purple-50 shadow-sm bg-white space-y-3.5">
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="New Password"
                value={passwords.newPassword}
                onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                className="rounded-xl border-purple-100 bg-white h-11 text-sm focus:ring-2 focus:ring-primary focus:border-transparent pr-11 font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
              >
                {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
              </button>
            </div>
            
            <Input
              type="password"
              placeholder="Confirm New Password"
              value={passwords.confirmPassword}
              onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
              className="rounded-xl border-purple-100 bg-white h-11 text-sm focus:ring-2 focus:ring-primary focus:border-transparent font-medium"
            />
            
            <Button 
              onClick={handleChangePassword} 
              className="w-full rounded-xl bg-primary hover:bg-primary/95 text-white font-bold h-11 text-xs shadow-sm"
            >
              Update Password
            </Button>
          </Card>
        </div>

        {/* Security Settings Cards */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-gray-800">Account Protection</h3>
          </div>
          
          <div className="space-y-3">
            <Card className="p-5 rounded-[22px] border border-purple-50 bg-white shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 bg-purple-50/70 rounded-xl flex items-center justify-center flex-shrink-0 border border-purple-100/40">
                  <Lock className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0 pr-1">
                  <h3 className="font-bold text-sm text-gray-800 leading-tight">Biometric Sign-In</h3>
                  <p className="text-[11px] text-gray-500 mt-1 font-medium leading-normal">Use Face ID or Touch ID for super fast secure checkouts</p>
                </div>
                <div className="flex-shrink-0">
                  <Switch 
                    checked={biometric} 
                    onCheckedChange={setBiometric} 
                    className="data-[state=checked]:bg-primary"
                  />
                </div>
              </div>
            </Card>

            <Card className="p-5 rounded-[22px] border border-purple-50 bg-white shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 bg-purple-50/70 rounded-xl flex items-center justify-center flex-shrink-0 border border-purple-100/40">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0 pr-1">
                  <h3 className="font-bold text-sm text-gray-800 leading-tight">Two-Factor Authentication</h3>
                  <p className="text-[11px] text-gray-500 mt-1 font-medium leading-normal">Safeguard with SMS or Email OTP verification on login</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="rounded-full border-purple-100/80 text-primary hover:bg-purple-50 text-[10px] font-bold h-8 px-3.5" 
                  onClick={() => toast.info("Two-factor setup is coming soon in your area.")}
                >
                  Setup
                </Button>
              </div>
            </Card>
          </div>
        </div>

        {/* Guard Ecosystem Info Line */}
        <div className="text-center pt-2">
          <p className="text-[11px] text-muted-foreground font-semibold flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Your account data is secure & protected in Sruvo ecosystem.
          </p>
        </div>
      </main>
    </div>
  );
};

export default PrivacySecurity;
