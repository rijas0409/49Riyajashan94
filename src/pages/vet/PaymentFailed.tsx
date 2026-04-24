import { useNavigate } from "react-router-dom";
import { ArrowLeft, HelpCircle, X, Info } from "lucide-react";

const PaymentFailed = () => {
  const navigate = useNavigate();

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg">
        <div className="flex items-center justify-between px-4 py-4">
          <button 
            onClick={() => navigate("/vet")}
            className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold">Payment Status</h1>
          <button className="w-10 h-10 rounded-full border border-pink-200 bg-pink-50 flex items-center justify-center">
            <HelpCircle className="w-5 h-5 text-pink-500" />
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-8 flex flex-col items-center">
        {/* Failed Icon */}
        <div className="relative mb-6">
          <div className="w-28 h-28 rounded-full bg-pink-100 flex items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center shadow-lg">
              <X className="w-10 h-10 text-white" strokeWidth={3} />
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-foreground mb-2">Payment Failed</h1>
        <p className="text-muted-foreground text-center mb-8">
          Something went wrong with your transaction. Please try again.
        </p>

        {/* Error Details Card */}
        <div className="w-full bg-card rounded-2xl border border-pink-200 p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-pink-600">Bank Server Error</h3>
              <p className="text-sm text-muted-foreground">Veterinary Consultation Fee</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-pink-500">₹499</p>
              <p className="text-xs font-semibold text-pink-400">FAILED</p>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="w-full bg-pink-50 rounded-2xl p-4 border border-pink-100 flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-pink-200 flex items-center justify-center shrink-0 mt-0.5">
            <Info className="w-4 h-4 text-pink-600" />
          </div>
          <p className="text-sm text-pink-700">
            Don't worry, if any amount was deducted, it will be refunded to your source account within 5-7 business days.
          </p>
        </div>
      </div>

      {/* Fixed Bottom CTAs */}
      <div className="flex-shrink-0 px-4 pb-4 pt-3 bg-gradient-to-t from-background via-background to-transparent space-y-3">
        <button 
          onClick={() => navigate("/vet/consultation-summary")}
          className="w-full py-4 rounded-2xl font-bold text-white text-base shadow-lg hover:shadow-xl transition-all"
          style={{ background: 'linear-gradient(90deg, #FF4D6D, #8B5CF6)' }}
        >
          Retry Payment
        </button>
        <button 
          onClick={() => navigate("/vet/consultation-summary")}
          className="w-full text-pink-500 font-semibold py-3"
        >
          Try Another Method
        </button>
      </div>
    </div>
  );
};

export default PaymentFailed;
