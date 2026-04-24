import { useState, useEffect } from "react";
import sruvoLogo from "@/assets/sruvo-logo.png";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Heart, Clock, Shield, LogOut, Zap, CheckCircle, Loader2 } from "lucide-react";

const ProductsPendingApproval = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isPriorityModalOpen, setIsPriorityModalOpen] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [hasPriorityVerification, setHasPriorityVerification] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth-products"); return; }

      const { data: roleData } = await supabase.rpc("get_user_role", { _user_id: session.user.id });
      if (roleData !== "product_seller") { navigate("/"); return; }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .maybeSingle();

      if (error) {
        toast.error("Failed to load your profile");
        setIsLoading(false);
        return;
      }

      if (!profile) {
        // Should not happen after initialization, but keep UI resilient
        toast.error("Profile not found. Please try logging in again.");
        setIsLoading(false);
        return;
      }

      if (!profile?.is_onboarding_complete) { navigate("/products-onboarding"); return; }
      if (profile?.is_admin_approved) { navigate("/products-dashboard"); return; }

      setHasPriorityVerification(profile.priority_fee_paid === true);
      setIsLoading(false);
    };
    checkStatus();
  }, [navigate]);

  const handleLogout = async () => { await supabase.auth.signOut(); navigate("/auth-products"); };

  const handlePriorityPayment = async () => {
    setIsProcessingPayment(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await supabase.from("profiles").update({ priority_fee_paid: true } as any).eq("id", session.user.id);
        toast.success("Payment successful! Your verification is now prioritized.");
        setHasPriorityVerification(true);
        setIsPriorityModalOpen(false);
      }
    } catch { toast.error("Payment failed. Please try again."); }
    finally { setIsProcessingPayment(false); }
  };

  if (isLoading) return (
    <div className="min-h-screen bg-gradient-soft flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-soft">
      <header className="bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <img src={sruvoLogo} alt="Sruvo" className="w-12 h-12 object-contain" />
            <div>
              <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">Sruvo</span>
              <p className="text-xs text-muted-foreground">Product Seller Portal</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout}><LogOut className="w-5 h-5" /></Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-lg">
        <Card className="border-0 shadow-card">
          <CardHeader className="text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-amber-100 flex items-center justify-center">
              <Clock className="w-10 h-10 text-amber-600" />
            </div>
            <CardTitle className="text-2xl">Account Under Review</CardTitle>
            <CardDescription className="text-base">
              {hasPriorityVerification
                ? "Your product seller account will be reviewed within 3–4 hours."
                : "Your product seller account will be reviewed within 24–48 hours."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted/50 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium">Documents Submitted</span>
                <CheckCircle className="w-4 h-4 text-emerald-500 ml-auto" />
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-amber-500" />
                <span className="text-sm font-medium">Verification In Progress</span>
              </div>
            </div>

            {!hasPriorityVerification && (
              <div className="border-t border-border pt-6">
                <Button variant="outline" className="w-full rounded-2xl h-auto py-4 flex flex-col items-center gap-2 border-amber-300 hover:bg-amber-50"
                  onClick={() => setIsPriorityModalOpen(true)}>
                  <div className="flex items-center gap-2"><Zap className="w-5 h-5 text-amber-500" /><span className="font-semibold">Priority Verification</span></div>
                  <span className="text-xs text-muted-foreground">Get verified within 3–4 hours for ₹599</span>
                </Button>
              </div>
            )}

            {hasPriorityVerification && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
                <div className="flex items-center justify-center gap-2 text-amber-700">
                  <Zap className="w-5 h-5" /><span className="font-semibold">Priority Verification Active</span>
                </div>
                <p className="text-sm text-amber-600 mt-1">Your account will be reviewed within 3–4 hours</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <Dialog open={isPriorityModalOpen} onOpenChange={setIsPriorityModalOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl"><Zap className="w-6 h-6 text-amber-500" />Priority Verification</DialogTitle>
            <DialogDescription>Skip the wait and get verified faster</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="bg-amber-50 rounded-2xl p-4 space-y-3">
              {["Verification within 3–4 hours", "Priority support", "Start selling faster"].map(t => (
                <div key={t} className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-amber-600" /><span className="text-sm">{t}</span></div>
              ))}
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-foreground">₹599</p>
              <p className="text-sm text-muted-foreground">One-time payment</p>
            </div>
            <Button className="w-full rounded-2xl bg-gradient-primary hover:opacity-90" onClick={handlePriorityPayment} disabled={isProcessingPayment}>
              {isProcessingPayment ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing...</>) : "Pay ₹599 & Get Priority"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductsPendingApproval;
