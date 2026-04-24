import { useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, MoreHorizontal, Star, Briefcase, ThumbsUp, Clock, Hospital, Home, MessageSquare, ArrowRight, CheckCircle2 } from "lucide-react";
import { format, addDays, startOfToday } from "date-fns";

const BookingDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { matchedVet } = location.state || {};
  const [visitType, setVisitType] = useState<"clinic" | "home">("clinic");

  const today = startOfToday();
  const dates = useMemo(() => Array.from({ length: 4 }, (_, i) => addDays(today, i)), []);
  const [selectedDate, setSelectedDate] = useState(dates[1]);
  const [selectedSlot, setSelectedSlot] = useState("10:30 AM");

  const allSlots = ["09:00 AM", "10:30 AM", "01:00 PM", "02:30 PM", "04:00 PM", "05:30 PM"];
  const disabledSlots = ["05:30 PM"];

  const vet = matchedVet || {};
  const clinicFee = vet.offlineFee || 800;
  const onlineFee = vet.onlineFee || 500;

  const fees = {
    clinic: { visit: clinicFee, service: 50 },
    home: { visit: clinicFee + 300, service: 50 },
  };
  const current = fees[visitType];
  const total = current.visit + current.service;

  const vetName = vet.name || "Doctor";
  const vetSpecialization = vet.specialization || "Veterinarian";
  const vetImage = vet.image || "";
  const vetRating = vet.rating || 0;
  const vetExperience = vet.experience || 0;

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <header className="flex-shrink-0 flex items-center justify-between px-4 py-4">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-lg font-bold text-foreground">Booking Details</h1>
        <button className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center">
          <MoreHorizontal className="w-5 h-5 text-foreground" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-5">
        <div className="flex justify-center">
          <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-green-50 text-green-600 text-xs font-bold tracking-wider uppercase">
            <span className="text-sm">✦</span> AI Recommended Specialist
          </span>
        </div>
        <p className="text-center text-sm text-muted-foreground -mt-2">
          Based on your pet's symptoms and history, we recommend this top-rated specialist.
        </p>

        {/* Doctor Card */}
        <div className="border border-border rounded-2xl p-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-teal-50 flex-shrink-0">
              {vetImage ? (
                <img src={vetImage} alt={vetName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center text-2xl font-bold text-pink-400">
                  {vetName.charAt(0)}
                </div>
              )}
              <div className="absolute bottom-0 right-0 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white">
                <CheckCircle2 className="w-3 h-3 text-white" />
              </div>
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">{vetName}</h2>
              <p className="text-sm font-semibold" style={{ color: '#22C55E' }}>{vetSpecialization}</p>
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> {vetRating}</span>
                <span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" /> {vetExperience}+ Years Exp.</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center border-t border-border pt-3">
            <div>
              <p className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase">Fee</p>
              <p className="text-sm font-bold text-foreground">₹{clinicFee}<span className="text-xs font-normal text-muted-foreground">/session</span></p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase">Experience</p>
              <p className="text-sm font-bold text-foreground">{vetExperience} Yrs</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase">Status</p>
              <p className="text-sm font-bold" style={{ color: '#22C55E' }}>AVAILABLE NOW</p>
            </div>
          </div>
        </div>

        {/* Badges */}
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
              <ThumbsUp className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Highly Experienced</p>
              <p className="text-xs text-muted-foreground">{vetExperience}+ years of veterinary experience.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Immediate Availability</p>
              <p className="text-xs text-muted-foreground">Available for Home Visit & Clinic Appointment.</p>
            </div>
          </div>
        </div>

        {/* Visit Type */}
        <div>
          <h3 className="text-base font-bold text-foreground mb-3">Select Visit Type</h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setVisitType("clinic")}
              className={`relative flex flex-col items-center gap-2 py-5 rounded-2xl border-2 transition-all ${visitType === "clinic" ? "border-pink-400 bg-pink-50/30" : "border-border bg-background"}`}
            >
              {visitType === "clinic" && (
                <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-pink-500 flex items-center justify-center">
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                </div>
              )}
              <Hospital className="w-6 h-6 text-pink-500" />
              <span className="text-sm font-bold text-foreground">Clinic Visit</span>
              <span className="text-xs font-semibold" style={{ color: '#FF4D6D' }}>₹{clinicFee}</span>
            </button>
            <button
              onClick={() => setVisitType("home")}
              className={`relative flex flex-col items-center gap-2 py-5 rounded-2xl border-2 transition-all ${visitType === "home" ? "border-pink-400 bg-pink-50/30" : "border-border bg-background"}`}
            >
              {visitType === "home" && (
                <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-pink-500 flex items-center justify-center">
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                </div>
              )}
              <Home className="w-6 h-6 text-muted-foreground" />
              <span className="text-sm font-bold text-foreground">Home Visit</span>
              <span className="text-xs font-semibold text-muted-foreground">₹{clinicFee + 300}</span>
            </button>
          </div>
        </div>

        {/* Booking Schedule */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-bold text-foreground">Select Date</h3>
            <span className="text-sm font-semibold" style={{ color: '#A78BFA' }}>{format(selectedDate, "MMMM yyyy")}</span>
          </div>
          <div className="grid grid-cols-4 gap-3 mb-5">
            {dates.map((date) => {
              const isSelected = format(date, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd");
              return (
                <button key={date.toISOString()} onClick={() => setSelectedDate(date)}
                  className="flex flex-col items-center gap-1 py-3 rounded-2xl border-2 transition-all"
                  style={isSelected ? { background: 'linear-gradient(135deg, #C084FC, #F472B6)', border: '2px solid transparent', color: 'white' } : { border: '2px solid hsl(var(--border))', background: 'hsl(var(--background))' }}>
                  <span className={`text-xs font-medium ${isSelected ? 'text-white/90' : 'text-muted-foreground'}`}>{format(date, "EEE")}</span>
                  <span className={`text-xl font-bold ${isSelected ? 'text-white' : 'text-foreground'}`}>{format(date, "d")}</span>
                </button>
              );
            })}
          </div>

          <h3 className="text-base font-bold text-foreground mb-3">Available Slots</h3>
          <div className="grid grid-cols-3 gap-3">
            {allSlots.map((slot) => {
              const isDisabled = disabledSlots.includes(slot);
              const isSelected = selectedSlot === slot && !isDisabled;
              return (
                <button key={slot} disabled={isDisabled} onClick={() => setSelectedSlot(slot)}
                  className="py-3 rounded-2xl text-sm font-semibold transition-all border-2"
                  style={isSelected ? { background: 'linear-gradient(135deg, #C084FC, #F472B6)', border: '2px solid transparent', color: 'white' } : isDisabled ? { border: '2px dashed hsl(var(--border))', color: 'hsl(var(--muted-foreground))', opacity: 0.5, textDecoration: 'line-through' } : { border: '2px solid hsl(var(--border))', color: 'hsl(var(--foreground))' }}>
                  {slot}
                </button>
              );
            })}
          </div>
        </div>

        {/* Summary */}
        <div>
          <h3 className="text-base font-bold text-foreground mb-3">Summary</h3>
          <div className="bg-muted/30 rounded-2xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{visitType === "clinic" ? "Clinic" : "Home"} Visit Fee</span>
              <span className="font-semibold text-foreground">₹{current.visit.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Booking Service</span>
              <span className="font-semibold text-foreground">₹{current.service.toFixed(2)}</span>
            </div>
            <div className="border-t border-border pt-2 flex justify-between">
              <span className="font-bold text-foreground">Total Amount</span>
              <span className="font-black text-lg" style={{ color: '#FF4D6D' }}>₹{total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 px-4 pb-4 pt-3 bg-gradient-to-t from-background via-background to-transparent">
        <div className="flex items-center gap-3">
          <button className="w-12 h-12 rounded-full border border-border flex items-center justify-center flex-shrink-0">
            <MessageSquare className="w-5 h-5 text-muted-foreground" />
          </button>
          <button
            onClick={() => navigate("/vet/consultation-plan", { state: { ...location.state, matchedVet: vet, selectedDate: format(selectedDate, "yyyy-MM-dd"), selectedSlot, visitType, totalAmount: total } })}
            className="flex-1 py-4 rounded-2xl font-bold text-white text-base flex items-center justify-center gap-2 shadow-lg"
            style={{ background: 'linear-gradient(90deg, #FF4D6D, #8B5CF6)' }}>
            Book Appointment
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingDetails;