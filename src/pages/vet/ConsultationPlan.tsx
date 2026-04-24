import { useNavigate } from "react-router-dom";
import { ArrowLeft, HelpCircle, Check, Video, FileText, MessageSquare, Shield, ArrowRight, X } from "lucide-react";
import vetConsultationDoctor from "@/assets/vet-consultation-doctor.png";

const ConsultationPlan = () => {
  const navigate = useNavigate();

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Header - Fixed */}
      <header className="flex-shrink-0 flex items-center justify-between px-4 pt-6 pb-2">
        <button 
          onClick={() => navigate("/vet")}
          className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="text-center">
          <p className="text-xs font-bold tracking-widest uppercase" style={{ color: '#FF4D6D' }}>PREMIUM CARE</p>
          <p className="text-sm font-bold text-foreground">Consultation Plan</p>
        </div>
        <button 
          onClick={() => navigate("/vet")}
          className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center"
        >
          <X className="w-5 h-5 text-foreground" />
        </button>
      </header>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-4 space-y-6">
        {/* Hero Image Card */}
        <div className="relative rounded-3xl overflow-hidden bg-gray-100 p-1">
          <div className="rounded-3xl overflow-hidden bg-gray-50">
            <img 
              src={vetConsultationDoctor}
              alt="Vet with pet"
              className="w-full h-72 object-cover object-top"
            />
            {/* Overlay Badge */}
            <div className="absolute bottom-6 left-6 right-6">
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl py-3 px-4 flex items-center gap-3 shadow-lg">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <Check className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-xs text-green-600 font-semibold">AVAILABLE NOW</p>
                  <p className="text-sm font-bold text-foreground">24 Top-rated Vets Online</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Plan Title & Pricing */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground">Quick Connect</h2>
          <div className="flex items-center justify-center gap-3 mt-2">
            <span className="text-3xl font-bold text-pink-600">₹499</span>
            <span className="text-lg text-muted-foreground line-through">₹799</span>
            <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full">SAVINGS 35%</span>
          </div>
        </div>

        {/* Plan Inclusions */}
        <div className="bg-card rounded-3xl p-5 border border-border shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center">
              <Check className="w-4 h-4 text-white" />
            </div>
            <h3 className="font-bold text-foreground">Plan Inclusions</h3>
          </div>

          <div className="space-y-4">
            {/* Video Call */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-pink-100 flex items-center justify-center shrink-0">
                <Video className="w-6 h-6 text-pink-500" />
              </div>
              <div>
                <h4 className="font-bold text-foreground">15 Mins Video Call</h4>
                <p className="text-sm text-muted-foreground">Direct HD consultation with a specialist</p>
              </div>
            </div>

            {/* Digital Prescription */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-pink-100 flex items-center justify-center shrink-0">
                <FileText className="w-6 h-6 text-pink-500" />
              </div>
              <div>
                <h4 className="font-bold text-foreground">Instant Digital Prescription</h4>
                <p className="text-sm text-muted-foreground">Valid at all pharmacies nationwide</p>
              </div>
            </div>

            {/* Follow-up Chat */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-pink-100 flex items-center justify-center shrink-0">
                <MessageSquare className="w-6 h-6 text-pink-500" />
              </div>
              <div>
                <h4 className="font-bold text-foreground">24-Hour Follow-up Chat</h4>
                <p className="text-sm text-muted-foreground">Free follow-up messages for clarity</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-5 pt-4 border-t border-border">
            <Shield className="w-4 h-4 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">Secure & private end-to-end encrypted call.</p>
          </div>
        </div>
      </div>

      {/* Footer CTA - Fixed */}
      <div className="flex-shrink-0 px-4 pb-3 pt-3 bg-gradient-to-t from-white via-white to-transparent">
        <button 
          onClick={() => navigate("/vet/instant-assessment")}
          className="w-full py-4 rounded-2xl font-bold text-white text-base flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-shadow"
          style={{ background: 'linear-gradient(90deg, #FF4D6D, #8B5CF6)' }}
        >
          Start Vet Assessment
          <ArrowRight className="w-5 h-5" />
        </button>
        <button 
          onClick={() => navigate("/vet")}
          className="w-full py-3 text-sm font-bold text-muted-foreground tracking-widest uppercase mt-2"
        >
          SKIP TO VET LIST
        </button>
      </div>
    </div>
  );
};

export default ConsultationPlan;
