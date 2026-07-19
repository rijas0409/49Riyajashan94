import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Lock, Shield, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

const PrivacySecurity = () => {
  const navigate = useNavigate();

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
            onClick={() => {
              if (window.history.length > 1) {
                navigate(-1);
              } else {
                navigate("/buyer/profile");
              }
            }}
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </Button>
          <div>
            <h1 className="text-lg font-bold bg-gradient-primary bg-clip-text text-transparent">Privacy & Security</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-lg space-y-6 relative">
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
                    checked={false} 
                    onCheckedChange={() => {
                      toast.info("Biometric Sign-In setup is coming soon in your area.");
                    }} 
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
