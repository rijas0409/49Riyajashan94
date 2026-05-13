import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, HelpCircle, Star, BadgeCheck, ChevronRight, CreditCard, Shield, BadgeCheck as BadgeCheckIcon, Lock, Percent, Gift, X, CheckCircle2, Ticket } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { motion } from "motion/react";

const COUPONS = [
  { code: "RJ49", value: 49, description: "Flat ₹49 off for first time users", type: "fixed" },
  { code: "SRUVO10", value: 25, description: "Save ₹25 on your first consultation", type: "fixed" },
  { code: "WELCOMEDOC", value: 30, description: "Special welcome discount of ₹30", type: "fixed" }
];

interface Coupon {
  code: string;
  value: number;
  description: string;
  type: string;
}

const ConsultationSummary = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { matchedVet, petName, selectedPet } = location.state || {};
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [showCoupons, setShowCoupons] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState(249);

  const DURATIONS = [
    { time: "10 Minutes", amount: 249, description: "Quick consultation & guidance", badge: "Recommended", badgeColor: "text-pink-500" },
    { time: "20 Minutes", amount: 399, description: "Detailed consultation session", badge: "Save 10%", badgeColor: "text-green-500 font-bold" },
    { time: "30 Minutes", amount: 549, description: "In-depth consultation & follow-up", badge: "Best Value", badgeColor: "text-green-500 font-bold" },
  ];

  const consultationFee = selectedDuration;
  const platformFee = Math.round(consultationFee * 0.26);
  const discount = selectedCoupon ? selectedCoupon.value : 0;
  const totalPayable = consultationFee + platformFee - discount;

  const vet = matchedVet || {
    name: "Doctor",
    specialization: "Veterinarian",
    image: "",
    rating: 0,
    experience: 0,
    fee: 249
  };

  const handlePayment = async () => {
    setIsProcessing(true);
    
    try {
      console.log("Starting payment flow...");
      const { data: authData, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error("Auth error:", authError);
        toast.error(`Auth error: ${authError.message}`);
        setIsProcessing(false);
        return;
      }

      const user = authData?.user;
      
      if (!user) {
        toast.error("Please login to continue");
        navigate("/auth");
        return;
      }

      const isBypassUser = user.email === 'jas@sruvo.com';

      if (isBypassUser) {
        toast.success("Special Access: Bypassing Payment & Confirmation");
        
        // Create the appointment record directly and navigate to video call
        try {
          const { data: appointment, error } = await supabase
            .from('vet_appointments')
            .insert({
              user_id: user.id,
              vet_id: vet.userId || user.id, // Fallback to current user if system vet not found for bypass
              pet_name: petName || 'Pet',
              pet_type: selectedPet || 'Dog',
              appointment_date: new Date().toISOString().split('T')[0],
              appointment_time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
              amount: 0,
              status: 'confirmed', // Set to confirmed to bypass waiting
              appointment_type: 'instant'
            })
            .select()
            .single();

          if (error) {
            console.error("Bypass insert error:", error);
            toast.error(`Appointment error: ${error.message || 'Unknown error'}`);
            setIsProcessing(false);
            return;
          }

          // Navigate directly to video call for this specific user
          navigate("/vet/instant-video-call", { 
            state: { 
              ...location.state, 
              vet, 
              paymentId: "bypass_" + Date.now(),
              appointmentId: appointment?.id 
            } 
          });
          return;
        } catch (insertErr) {
          console.error("Critical bypass insert catch:", insertErr);
          toast.error(`System error: ${insertErr instanceof Error ? insertErr.message : 'Failed to connect'}`);
          setIsProcessing(false);
          return;
        }
      }

      // Normal Simulation for other users
      setTimeout(async () => {
        const paymentId = "pay_fake_" + Date.now();
        
        try {
          // Create the appointment record
          const { data: appointment, error } = await supabase
            .from('vet_appointments')
            .insert({
              user_id: user.id,
              vet_id: vet.userId || '00000000-0000-0000-0000-000000000000', // Use a dummy UUID if no vet id
              pet_name: petName || 'Pet',
              pet_type: selectedPet || 'Dog',
              appointment_date: new Date().toISOString().split('T')[0],
              appointment_time: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
              amount: totalPayable,
              status: 'pending',
              appointment_type: 'instant'
            })
            .select()
            .single();

          if (error) {
            console.error("Appointment insert error:", error);
            toast.error(`Failed to create appointment: ${error.message || 'Check connection'}`);
            setIsProcessing(false);
            return;
          }

          toast.success("Payment Received Successfully!");
          navigate("/vet/consultation-confirmation", { 
            state: { 
              ...location.state, 
              vet, 
              paymentId,
              appointmentId: appointment?.id 
            } 
          });
        } catch (innerErr) {
          console.error("Error inside timeout:", innerErr);
          toast.error(`Processing error: ${innerErr instanceof Error ? innerErr.message : 'Connection failed'}`);
          setIsProcessing(false);
        }
      }, 2000);
    } catch (err) {
      console.error("Error in payment flow top-level:", err);
      toast.error(`Error: ${err instanceof Error ? err.message : 'Failed to fetch – Check your internet'}`);
      setIsProcessing(false);
    }
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

        {/* Select Duration Section */}
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-[14px] font-extrabold tracking-wide text-gray-500 uppercase">
              Select Duration
            </h3>
            <p className="text-sm font-semibold text-pink-500">
              Flexible Timing
            </p>
          </div>

          <div className="space-y-3">
            {DURATIONS.map((dur) => (
              <button
                key={dur.amount}
                onClick={() => setSelectedDuration(dur.amount)}
                className={`w-full rounded-[24px] border-2 p-4 transition-all duration-200 relative overflow-hidden ${
                  selectedDuration === dur.amount 
                    ? "border-fuchsia-600 shadow-[0_8px_30px_rgb(192,38,211,0.12)] scale-[1.02]" 
                    : "border-transparent bg-white shadow-[0_4px_20px_rgba(0,0,0,0.04)]"
                }`}
                style={selectedDuration === dur.amount ? {
                  background: 'linear-gradient(135deg, rgba(236,72,153,0.08), rgba(168,85,247,0.08))'
                } : {}}
              >
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-4">
                    {/* Radio Indicator */}
                    <div className={`min-w-[24px] min-h-[24px] w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                      selectedDuration === dur.amount ? 'border-fuchsia-500' : 'border-gray-300'
                    }`}>
                      {selectedDuration === dur.amount && (
                        <motion.div 
                          initial={{ scale: 0.5, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="w-3 h-3 rounded-full bg-fuchsia-500" 
                        />
                      )}
                    </div>

                    <div className="text-left">
                      <h4 className={`text-[17px] font-extrabold transition-colors ${
                        selectedDuration === dur.amount ? 'text-gray-900' : 'text-gray-700'
                      }`}>
                        {dur.time}
                      </h4>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {dur.description}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <h3 className={`text-[24px] font-black transition-colors ${
                      selectedDuration === dur.amount ? 'text-fuchsia-600' : 'text-gray-700'
                    }`}>
                      ₹{dur.amount}
                    </h3>
                    <p className={`text-[11px] mt-0.5 ${dur.badgeColor}`}>
                      {dur.badge}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Saving Corner */}
        <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-2xl p-4 border border-green-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                <Gift className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">Saving Corner</h3>
                <p className="text-xs text-muted-foreground">Apply coupons & save more</p>
              </div>
            </div>
            {selectedCoupon && (
              <button 
                onClick={() => setSelectedCoupon(null)}
                className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-1 rounded-md"
              >
                REMOVE
              </button>
            )}
          </div>
          
          <Dialog open={showCoupons} onOpenChange={setShowCoupons}>
            <DialogTrigger asChild>
              <button className="w-full bg-white/80 backdrop-blur-sm border-2 border-dashed border-green-300 rounded-xl py-3 px-4 flex items-center justify-between hover:bg-white transition-colors group">
                <div className="flex items-center gap-2">
                  <Percent className="w-4 h-4 text-teal-600" />
                  <span className="font-semibold text-teal-600">
                    {selectedCoupon ? (
                      <span className="flex items-center gap-2">
                        Coupon Applied: <span className="bg-teal-100 px-2 py-0.5 rounded text-xs font-bold outline-dashed outline-1 outline-teal-300">{selectedCoupon.code}</span>
                      </span>
                    ) : "Apply Coupon"}
                  </span>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-[90vw] rounded-3xl p-6">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  <Ticket className="w-5 h-5 text-teal-600" />
                  Available Coupons
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                {COUPONS.map((coupon) => (
                  <div 
                    key={coupon.code}
                    onClick={() => {
                      setSelectedCoupon(coupon);
                      setShowCoupons(false);
                      toast.success(`Coupon ${coupon.code} applied!`);
                    }}
                    className={`relative p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                      selectedCoupon?.code === coupon.code 
                        ? "border-teal-500 bg-teal-50/50" 
                        : "border-muted hover:border-teal-200"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-black text-[#151B32] text-sm tracking-wider bg-muted px-2 py-0.5 rounded border border-border">
                            {coupon.code}
                          </span>
                          {selectedCoupon?.code === coupon.code && (
                            <CheckCircle2 className="w-4 h-4 text-teal-600" />
                          )}
                        </div>
                        <p className="text-[13px] font-bold text-teal-700">Save ₹{coupon.value}</p>
                        <p className="text-[11px] text-muted-foreground mt-1">{coupon.description}</p>
                      </div>
                      <button className="text-xs font-bold text-teal-600">APPLY</button>
                    </div>
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Bill Details */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-muted-foreground">BILL DETAILS</h2>
            <button className="text-sm font-medium text-teal-600">View Policy</button>
          </div>
          <div className="bg-card rounded-2xl border border-border p-4 space-y-3 shadow-sm">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Consultation Fee</span>
              <span className="font-semibold text-foreground">₹{consultationFee}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Platform Fee (26%)</span>
              <span className="font-semibold text-foreground">₹{platformFee}</span>
            </div>
            
            {selectedCoupon && (
              <div className="flex justify-between text-sm text-green-600">
                <span className="flex items-center gap-1">
                  <Ticket className="w-3.5 h-3.5" />
                  Coupon Discount ({selectedCoupon.code})
                </span>
                <span className="font-bold">- ₹{discount}</span>
              </div>
            )}

            <div className="border-t border-dashed border-border pt-3 flex justify-between items-center">
              <div>
                <span className="font-bold text-foreground text-base">Total Payable</span>
                <p className="text-[10px] text-muted-foreground font-medium">All taxes included</p>
              </div>
              <span className="font-black text-2xl text-teal-600">₹{totalPayable}</span>
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
