import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Stethoscope, ShieldCheck, LogOut, CheckCircle, XCircle, AlertCircle, Edit3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface AccountReviewScreenProps {
  onLogout?: () => void;
  rejectionReason?: string | null;
  onEditProfile?: () => void;
  isRejected?: boolean;
}

export const AccountReviewScreen = ({ onLogout, rejectionReason, onEditProfile, isRejected }: AccountReviewScreenProps) => {
  const handleLogout = async () => { 
    if (onLogout) {
      onLogout();
    } else {
      try {
        await supabase.auth.signOut();
        window.location.reload(); 
      } catch (err) {
        console.error("Logout error:", err);
        window.location.reload();
      }
    }
  };

  if (rejectionReason || isRejected) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md border-0 shadow-2xl animate-fade-in text-center overflow-hidden bg-white/90 backdrop-blur-sm">
          <div className="h-2 w-full bg-destructive" />
          <CardHeader className="space-y-4 pt-8">
            <div className="w-20 h-20 mx-auto bg-destructive/10 rounded-full flex items-center justify-center animate-bounce-subtle">
              <XCircle className="w-10 h-10 text-destructive" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-2xl font-black text-destructive tracking-tight">
                Application Rejected
              </CardTitle>
              <CardDescription className="text-sm font-medium text-muted-foreground px-4">
                We've completed the review of your professional credentials.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pb-8">
            <div className="bg-destructive/[0.03] rounded-2xl p-6 border border-destructive/10 text-left relative overflow-hidden">
               <div className="absolute top-0 right-0 p-3 opacity-10">
                  <AlertCircle className="w-12 h-12 text-destructive" />
               </div>
               <p className="font-bold text-[10px] text-destructive uppercase tracking-widest mb-2 flex items-center gap-1.5">
                 <Shield className="w-3 h-3" />
                 Official Review Outcome
               </p>
               <p className="text-sm text-[hsl(220,20%,15%)] font-semibold leading-relaxed">
                 {rejectionReason || "Your application did not meet our verification criteria at this time. Common reasons include incomplete documentation or unverified medical registration."}
               </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60 text-[11px] text-slate-500 font-medium leading-relaxed">
              Don't worry! This isn't final. You can update your details, upload the correct certificates, and resubmit for another review.
            </div>
            
            <div className="flex flex-col gap-3">
              <Button 
                className="w-full rounded-xl bg-destructive hover:bg-destructive/90 text-white h-12 text-sm font-bold shadow-lg shadow-destructive/20 transition-all active:scale-[0.98]" 
                onClick={onEditProfile}
              >
                <Edit3 className="w-4 h-4 mr-2" />
                Edit & Resubmit Application
              </Button>

              <Button 
                variant="ghost" 
                className="w-full rounded-xl text-muted-foreground h-10 hover:bg-slate-100 font-bold text-xs" 
                onClick={handleLogout}
              >
                <LogOut className="w-3.5 h-3.5 mr-2" />
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-soft flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md border-0 shadow-card animate-fade-in text-center">
        <CardHeader className="space-y-4">
          <div className="w-24 h-24 mx-auto bg-teal-100 rounded-full flex items-center justify-center animate-pulse relative">
            <Stethoscope className="w-12 h-12 text-teal-600" />
            <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-sm">
              <Clock className="w-5 h-5 text-amber-500 animate-spin-slow" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Account Under Review
          </CardTitle>
          <CardDescription className="text-base text-muted-foreground max-w-sm mx-auto">
            Welcome to the Sruvo veterinary network! Our specialists are currently verifying your professional credentials.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted/40 rounded-3xl p-5 space-y-4 border border-border/50">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-success" />
              </div>
              <div className="text-left flex-1">
                <p className="font-semibold text-sm">Onboarding Complete</p>
                <p className="text-xs text-muted-foreground">Information & documents received</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center">
                <Clock className="w-5 h-5 text-teal-600" />
              </div>
              <div className="text-left flex-1">
                <p className="font-semibold text-sm">Credential Verification</p>
                <p className="text-xs text-muted-foreground">Verifying medical registration & degree</p>
              </div>
              <div className="animate-pulse flex space-x-1">
                <div className="h-1.5 w-1.5 bg-teal-600 rounded-full"></div>
                <div className="h-1.5 w-1.5 bg-teal-600 rounded-full"></div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-amber-600" />
              </div>
              <div className="text-left flex-1">
                <p className="font-semibold text-sm">Final Approval</p>
                <p className="text-xs text-muted-foreground">Admin confirmation & dashboard access</p>
              </div>
            </div>
          </div>

          <div className="px-4 py-3 bg-teal-50/50 rounded-2xl border border-teal-100">
            <p className="text-xs text-teal-800 font-medium leading-relaxed">
              Verification usually takes <strong>24-48 hours</strong>. You will receive an email once your portal is active.
            </p>
          </div>
          
          <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-1.5 italic">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
            </span>
            Auto-refreshing status...
          </p>
        </CardContent>
        <div className="px-6 pb-6 pt-0">
           <Button variant="outline" className="w-full rounded-2xl border-border/50 hover:bg-destructive/5 hover:text-destructive hover:border-destructive/20 transition-all group" onClick={handleLogout}>
             <LogOut className="w-4 h-4 mr-2 group-hover:translate-x-0.5 transition-transform" />
             Sign out
           </Button>
        </div>
      </Card>
    </div>
  );
};
