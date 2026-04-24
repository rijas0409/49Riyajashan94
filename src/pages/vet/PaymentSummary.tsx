import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronRight, CreditCard, Shield, BadgeCheck, Lock, Percent, Gift } from "lucide-react";

const PaymentSummary = () => {
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayNow = () => {
    setIsProcessing(true);
    // Simulate payment processing - randomly succeed or fail
    setTimeout(() => {
      const success = Math.random() > 0.3; // 70% success rate for demo
      if (success) {
        navigate("/vet/finding-vet");
      } else {
        navigate("/vet/payment-failed");
      }
      setIsProcessing(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg">
        <div className="flex items-center px-4 py-4">
          <button 
            onClick={() => navigate("/vet/consultation-plan")}
            className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="flex-1 text-center text-lg font-bold pr-10">Payment Summary</h1>
        </div>
      </header>

      <div className="px-4 space-y-5">
        {/* Bill Details */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-muted-foreground">BILL DETAILS</h2>
            <button className="text-sm font-medium text-teal-600">View Policy</button>
          </div>
          <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-foreground">Consultation Fee</span>
              <span className="font-semibold">₹400</span>
            </div>
            <div className="flex justify-between">
              <span className="text-foreground">Platform Fee</span>
              <span className="font-semibold">₹23</span>
            </div>
            <div className="flex justify-between">
              <span className="text-foreground">GST (18%)</span>
              <span className="font-semibold">₹76</span>
            </div>
            <div className="border-t border-border pt-3 flex justify-between">
              <span className="font-bold text-foreground">Total Payable</span>
              <span className="font-bold text-xl text-teal-600">₹499</span>
            </div>
          </div>
        </div>

        {/* Saving Corner */}
        <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-2xl p-4 border border-green-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <Gift className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">Saving Corner</h3>
              <p className="text-xs text-muted-foreground">Apply coupons & save more</p>
            </div>
          </div>
          <button className="w-full bg-white/80 backdrop-blur-sm border-2 border-dashed border-green-300 rounded-xl py-3 px-4 flex items-center justify-between hover:bg-white transition-colors">
            <div className="flex items-center gap-2">
              <Percent className="w-4 h-4 text-teal-600" />
              <span className="font-semibold text-teal-600">Apply Coupon</span>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Payment Method */}
        <div>
          <h2 className="text-sm font-bold text-muted-foreground mb-3">PAYMENT METHOD</h2>
          <div className="bg-card rounded-2xl border border-border p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">Apple Pay</h3>
                <p className="text-sm text-muted-foreground">Primary method</p>
              </div>
            </div>
            <button className="text-teal-600 font-semibold">Change</button>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-20 md:bottom-0 left-0 right-0 bg-background/95 backdrop-blur-lg border-t border-border p-4 space-y-4">
        <button 
          onClick={handlePayNow}
          disabled={isProcessing}
          className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white py-4 rounded-2xl font-bold text-base shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-70"
        >
          {isProcessing ? (
            <span className="animate-pulse">Processing...</span>
          ) : (
            <>
              <Lock className="w-5 h-5" />
              Pay Now
              <ChevronRight className="w-5 h-5" />
            </>
          )}
        </button>
        
        <div className="text-center space-y-2">
          <p className="text-xs text-muted-foreground">
            By continuing, you agree to the <span className="text-teal-600 font-medium">Terms of Service</span>.
          </p>
          <p className="text-xs text-muted-foreground">Please enable camera permissions on the next screen.</p>
        </div>

        <div className="flex items-center justify-center gap-4">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Shield className="w-3 h-3" />
            SECURE SSL
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <BadgeCheck className="w-3 h-3" />
            CERTIFIED VETS
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSummary;
