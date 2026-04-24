import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Share2, Star, ShoppingCart, FileText, Calendar, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const medicines = [
  {
    id: "1",
    name: "Pet-O-Boost",
    description: "Multivitamin Supplement",
    price: 540,
    quantity: "1 Pack (30 Tablets)",
    inStock: true,
    image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=100&h=100&fit=crop"
  },
  {
    id: "2",
    name: "K-9 Calmer",
    description: "Anti-anxiety Oral Drops",
    price: 320,
    quantity: "30ml Bottle",
    inStock: true,
    image: "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=100&h=100&fit=crop"
  }
];

const labTests = [
  {
    id: "1",
    name: "Complete Blood Count (CBC)",
    note: "8-hour fasting required"
  },
  {
    id: "2",
    name: "Urinalysis Panel",
    note: "Next-day results available"
  }
];

const DigitalPrescription = () => {
  const navigate = useNavigate();
  const [rating, setRating] = useState(4);
  const [review, setReview] = useState("");

  const handleSubmitRating = () => {
    toast.success("Thank you for your feedback!");
    navigate("/vet");
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="flex items-center justify-between px-4 py-4">
          <button 
            onClick={() => navigate("/vet")}
            className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold">Digital Prescription</h1>
          <button className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors">
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="px-4 py-4 space-y-6">
        {/* Doctor Info */}
        <div className="flex items-center gap-4 bg-card rounded-2xl p-4 border border-border">
          <div className="w-14 h-14 rounded-full overflow-hidden">
            <img 
              src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=100&h=100&fit=crop"
              alt="Dr. Vikram Malhotra"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-foreground">Dr. Vikram Malhotra</h3>
            <p className="text-sm text-muted-foreground">Senior Veterinarian</p>
            <p className="text-xs text-muted-foreground">⊙ REG ID: VET-88291</p>
          </div>
        </div>

        {/* Prescription For */}
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-foreground">Prescription for Luna</h3>
          <span className="bg-muted text-muted-foreground text-xs px-3 py-1 rounded-full">Persian Cat</span>
        </div>

        {/* Prescribed Medicines */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-muted-foreground tracking-wider">PRESCRIBED MEDICINES</h3>
            <button className="text-sm text-teal-600 font-medium flex items-center gap-1">
              <ShoppingCart className="w-4 h-4" />
              SHOP
            </button>
          </div>
          <div className="space-y-4">
            {medicines.map((med) => (
              <div key={med.id} className="bg-card rounded-2xl p-4 border border-border">
                <div className="flex gap-4">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted">
                    <img 
                      src={med.image} 
                      alt={med.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <h4 className="font-bold text-foreground">{med.name}</h4>
                      <span className="font-bold text-foreground">₹{med.price}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{med.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-semibold text-green-600">IN STOCK</span>
                      <span className="text-xs text-muted-foreground">{med.quantity}</span>
                    </div>
                  </div>
                </div>
                <button className="w-full mt-3 bg-teal-500 text-white py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2">
                  <ShoppingCart className="w-4 h-4" />
                  Order Now
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Recommended Lab Tests */}
        <div>
          <h3 className="font-bold text-foreground mb-3">Recommended Lab Tests</h3>
          <div className="space-y-3">
            {labTests.map((test) => (
              <div key={test.id} className="bg-card rounded-xl p-4 border border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-teal-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground text-sm">{test.name}</h4>
                    <p className="text-xs text-muted-foreground">{test.note}</p>
                  </div>
                </div>
                <button className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-semibold">
                  Book Home
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Administration Notes */}
        <div className="bg-teal-50 rounded-2xl p-4 border border-teal-100">
          <div className="flex items-center gap-2 mb-3">
            <ClipboardList className="w-5 h-5 text-teal-600" />
            <h3 className="font-bold text-foreground">ADMINISTRATION NOTES</h3>
          </div>
          <div className="space-y-3">
            <div className="flex gap-3">
              <span className="w-5 h-5 rounded-full bg-teal-600 text-white text-xs flex items-center justify-center shrink-0">1</span>
              <p className="text-sm text-foreground">
                Administer 1 tablet of <span className="font-bold">Pet-O-Boost</span> once daily mixed with morning meal.
              </p>
            </div>
            <div className="flex gap-3">
              <span className="w-5 h-5 rounded-full bg-teal-600 text-white text-xs flex items-center justify-center shrink-0">2</span>
              <p className="text-sm text-foreground">
                Give 0.5ml of <span className="font-bold">K-9 Calmer</span> drops directly in the mouth during high stress periods or before travel.
              </p>
            </div>
            <div className="flex gap-3">
              <span className="w-5 h-5 rounded-full bg-teal-600 text-white text-xs flex items-center justify-center shrink-0">3</span>
              <p className="text-sm text-foreground">
                Observe for any unusual behavior or gastrointestinal sensitivity during the first 3 days.
              </p>
            </div>
          </div>
        </div>

        {/* Rate Experience */}
        <div className="bg-card rounded-2xl p-5 border border-border text-center">
          <h3 className="text-xs font-bold text-muted-foreground tracking-wider mb-4">RATE YOUR EXPERIENCE</h3>
          <div className="flex justify-center gap-2 mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className="p-1"
              >
                <Star 
                  className={cn(
                    "w-8 h-8 transition-colors",
                    star <= rating 
                      ? "fill-yellow-400 text-yellow-400" 
                      : "text-muted-foreground"
                  )} 
                />
              </button>
            ))}
          </div>
          <textarea
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder="Write a review (optional)"
            className="w-full p-3 bg-muted/50 rounded-xl text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <button 
            onClick={handleSubmitRating}
            className="w-full mt-4 bg-foreground text-background py-3 rounded-xl font-semibold"
          >
            Submit Rating
          </button>
        </div>

        {/* Next Appointment Banner */}
        <div className="bg-gradient-to-r from-teal-600 to-teal-500 rounded-2xl p-5 text-white flex items-center justify-between">
          <div>
            <p className="text-xs text-white/80 font-semibold tracking-wider mb-1">NEXT APPOINTMENT</p>
            <p className="text-xl font-bold">November 15, 2023</p>
            <p className="text-sm text-white/80">Follow-up Checkup</p>
          </div>
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <Calendar className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DigitalPrescription;
