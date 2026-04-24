import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, HelpCircle, Star, BadgeCheck, ChevronRight, CreditCard, Shield, BadgeCheck as BadgeCheckIcon, Lock, Percent, Gift } from "lucide-react";
import { toast } from "sonner";

const ConsultationSummary = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { matchedVet, petName, selectedPet } = location.state || {};
  const [isProcessing, setIsProcessing] = useState(false);

  const vet = matchedVet || {
    name: "Doctor",
    specialization: "Veterinarian",
    image: "",
    rating: 0,
    experience: 0,
    fee: 499
  };

  const handlePayment = () => {
    setIsProcessing(true);
    // Simulate Razorpay payment - in production, integrate actual Razorpay
    setTimeout(() => {
      const success = Math.random() > 0.3; // 70% success rate for demo
      if (success) {
        toast.success("Payment successful!");
        navigate("/vet/instant-video-call", { state: { ...location.state, vet } });
      } else {
        navigate("/vet/payment-failed");
      }
      setIsProcessing(false);
    }, 2000);
  };

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg">
        <div className="flex items-center justify-between px-4 py-4">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold">Consultation Summary</h1>
          <button className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            <HelpCircle className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        {/* Doctor Card - Moved to top */}
        <div className="bg-card rounded-3xl p-6 border border-border shadow-lg">
          {/* Doctor Avatar */}
          <div className="flex flex-col items-center">
            <div className="relative mb-4">
              <div className="w-28 h-28 rounded-full overflow-hidden bg-gradient-to-br from-pink-100 to-purple-100 p-1">
                <img 
                  src={vet.image}
                  alt={vet.name}
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
              {/* Verified Badge */}
              <div className="absolute bottom-1 right-1 w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                <BadgeCheck className="w-4 h-4 text-white" />
              </div>
            </div>

            <h3 className="text-xl font-bold text-foreground mb-1">{vet.name}</h3>
            <p className="text-pink-500 font-semibold mb-3">{vet.specialization}</p>
            
            <div className="flex items-center gap-2 bg-muted/50 rounded-full px-4 py-2">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="font-semibold">{vet.rating}</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">{vet.experience}+ Years Exp.</span>
            </div>
          </div>

          {/* Patient Info */}
          {petName && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Patient</span>
                <span className="font-semibold text-foreground">{petName} – {selectedPet ? selectedPet.charAt(0).toUpperCase() + selectedPet.slice(1) : 'Pet'}</span>
              </div>
            </div>
          )}
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

        {/* Payment Method */}
        <div>
          <h2 className="text-sm font-bold text-muted-foreground mb-3">PAYMENT METHOD</h2>
          <div className="bg-card rounded-2xl border border-border p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">Razorpay</h3>
                <p className="text-sm text-muted-foreground">Cards, UPI, Net Banking</p>
              </div>
            </div>
            <button className="text-teal-600 font-semibold">Change</button>
          </div>
        </div>
      </div>

      {/* Fixed Bottom CTA */}
      <div className="flex-shrink-0 px-4 pb-4 pt-3 bg-gradient-to-t from-background via-background to-transparent">
        <button 
          onClick={handlePayment}
          disabled={isProcessing}
          className="w-full py-4 rounded-2xl font-bold text-white text-base shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-70"
          style={{ background: 'linear-gradient(90deg, #FF4D6D, #8B5CF6)' }}
        >
          {isProcessing ? (
            <span className="animate-pulse">Processing...</span>
          ) : (
            <>
              <Lock className="w-5 h-5" />
              Proceed to Payment
              <ChevronRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ConsultationSummary;
