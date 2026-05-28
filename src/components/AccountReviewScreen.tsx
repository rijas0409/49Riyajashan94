import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Stethoscope, ShieldCheck, LogOut, CheckCircle, XCircle, AlertCircle, Edit3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface AccountReviewScreenProps {
  onLogout?: () => void;
  rejectionReason?: string | null;
  onEditProfile?: () => void;
}

export const AccountReviewScreen = ({ onLogout, rejectionReason, onEditProfile }: AccountReviewScreenProps) => {
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

  if (rejectionReason) {
    return (
      <div className="min-h-screen bg-gradient-soft flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md border-0 shadow-card animate-fade-in text-center border-t-4 border-destructive">
          <CardHeader className="space-y-4">
            <div className="w-20 h-20 mx-auto bg-destructive/10 rounded-full flex items-center justify-center">
              <XCircle className="w-10 h-10 text-destructive" />
            </div>
            <CardTitle className="text-2xl font-bold text-destructive">
              Application Rejected
            </CardTitle>
            <CardDescription className="text-base text-muted-foreground max-w-sm mx-auto">
              Unfortunately, your veterinary application was not approved at this time.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-destructive/5 rounded-3xl p-5 space-y-4 border border-destructive/10 text-left">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-sm text-destructive uppercase tracking-wide">Reason for Rejection</p>
                  <p className="text-sm text-[hsl(220,20%,15%)] font-medium leading-relaxed mt-1">
                    {rejectionReason}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-muted/40 rounded-2xl border border-border/50 text-xs text-muted-foreground leading-relaxed">
              Don't worry! You can appeal this decision by editing your information and resubmitting your application for another review.
            </div>
            
            <Button 
              className="w-full rounded-2xl bg-gradient-primary h-12 text-sm font-bold shadow-lg" 
              onClick={onEditProfile}
            >
              <Edit3 className="w-4 h-4 mr-2" />
              Edit & Resubmit Application
            </Button>

            <Button variant="ghost" className="w-full rounded-2xl text-muted-foreground py-0 h-auto" onClick={handleLogout}>
              <LogOut className="w-3 h-3 mr-1.5" />
              Sign out
            </Button>
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
