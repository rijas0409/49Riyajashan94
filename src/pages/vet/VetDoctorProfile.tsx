import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Heart, Share2, Star, BadgeCheck, ChevronRight, MapPin,
  Stethoscope, Syringe, Scissors, Shield, Clock,
  Dog, Cat, Bird, Rabbit, Fish, Loader2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import useBuyerActivityTracker from "@/hooks/useBuyerActivityTracker";
import { format, addDays } from "date-fns";
import { VerifiedBadge } from "@/components/VerifiedBadge";

// Map specialization strings to service icon types
const specToServiceIcon = (spec: string): string => {
  const lower = spec.toLowerCase();
  if (lower.includes("surgery") || lower.includes("orthop")) return "surgery";
  if (lower.includes("vaccin")) return "vaccination";
  if (lower.includes("dental") || lower.includes("skin") || lower.includes("derma")) return "dental";
  return "checkup";
};

const HamsterIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    {/* Body/Head outline */}
    <rect x="5" y="8" width="14" height="12" rx="6" />
    {/* Ears */}
    <path d="M7 8V5a2 2 0 1 1 4 0v3" />
    <path d="M13 8V5a2 2 0 1 1 4 0v3" />
    {/* Eyes */}
    <circle cx="9.5" cy="13.5" r="1.2" fill="currentColor" />
    <circle cx="14.5" cy="13.5" r="1.2" fill="currentColor" />
    {/* Nose and mouth detail */}
    <path d="M12 15.5 M11.5 15.5h1" />
    {/* Little Whiskers */}
    <path d="M3 13.5h2" />
    <path d="M21 13.5h-2" />
  </svg>
);

// Derive animals from specializations
const deriveAnimals = (specializations: string[]): { icon: string; label: string }[] => {
  const animalMap: Record<string, { icon: string; label: string }> = {
    dog: { icon: "dog", label: "Dog" },
    cat: { icon: "cat", label: "Cat" },
    bird: { icon: "bird", label: "Bird" },
    rabbit: { icon: "rabbit", label: "Rabbit" },
    fish: { icon: "fish", label: "Fish" },
    hamster: { icon: "hamster", label: "Hamster" },
  };

  const results: { icon: string; label: string }[] = [];
  specializations.forEach((spec) => {
    const sLower = spec.toLowerCase();
    if (animalMap[sLower]) {
      results.push(animalMap[sLower]);
    } else {
      results.push({ icon: "dog", label: spec });
    }
  });

  if (results.length === 0) {
    return [animalMap.dog, animalMap.cat, animalMap.bird];
  }

  return results;
};

const parseTimeToMins = (str: string) => {
  const clean = str.trim().toUpperCase();
  const match = clean.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/);
  if (!match) return 0;
  let hours = Number(match[1]);
  const minutes = match[2] ? Number(match[2]) : 0;
  const modifier = match[3];
  if (modifier === "PM" && hours !== 12) hours += 12;
  if (modifier === "AM" && hours === 12) hours = 0;
  return hours * 60 + minutes;
};

const formatMinsToTime = (mins: number) => {
  let h = Math.floor(mins / 60);
  const m = mins % 60;
  const modifier = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")} ${modifier}`;
};

const extractRawSlots = (dayData: unknown) => {
  if (!dayData) return [];
  const results: { timeVal: string }[] = [];
  const periods = ["morning", "afternoon", "evening", "night"] as const;
  const data = dayData as Record<string, { enabled?: boolean; slots?: (string | { time?: string })[] }>;
  periods.forEach(p => {
    const period = data[p];
    if (period && period.enabled && period.slots) {
      period.slots.forEach((s) => {
        if (!s) return;
        const timeValue = typeof s === "string" ? s : s.time;
        if (!timeValue) return;
        const parts = timeValue.split(/\s*(?:–|—|-)\s*/);
        if (parts.length === 2) {
          const startStr = parts[0];
          const endStr = parts[1];
          let start = parseTimeToMins(startStr);
          const end = parseTimeToMins(endStr);
          while (start < end) {
            results.push({ timeVal: formatMinsToTime(start) });
            start += 30; // 30 minutes interval
          }
        } else {
          results.push({ timeVal: timeValue });
        }
      });
    }
  });
  return results;
};

const getAvailabilityStatus = (weeklyAvailability: unknown) => {
  const now = new Date();
  const currentMins = now.getHours() * 60 + now.getMinutes();
  const availability = weeklyAvailability as Record<string, unknown> | null;

  // Try checking up to 7 days ahead
  for (let i = 0; i < 7; i++) {
    const targetDate = addDays(now, i);
    const dayName = format(targetDate, "EEE"); // "Mon", "Tue", etc.
    
    let slots: string[] = [];
    if (availability && availability[dayName]) {
      const raw = extractRawSlots(availability[dayName]);
      slots = raw.map(r => r.timeVal);
    } else if (!availability) {
      // Fallback default slots for every day
      slots = [
        "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM",
        "01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM",
        "04:00 PM", "04:30 PM", "05:00 PM", "05:30 PM", "06:00 PM", "06:30 PM", "07:00 PM", "07:30 PM",
        "08:00 PM", "08:30 PM", "09:00 PM", "09:30 PM", "10:00 PM", "10:30 PM", "11:00 PM", "11:30 PM"
      ];
    }

    // Sort slots by time
    slots.sort((a, b) => parseTimeToMins(a) - parseTimeToMins(b));

    if (i === 0) {
      // Check for remaining slots today
      const futureSlots = slots.filter(slot => parseTimeToMins(slot) > currentMins);
      if (futureSlots.length > 0) {
        return {
          isOnline: true,
          headline: "Available Today",
          subline: `Next Slot: ${futureSlots[0]}`
        };
      }
    } else {
      // Find the first slot on a subsequent day
      if (slots.length > 0) {
        const localizedDayInfo = i === 1 ? "tomorrow" : `on ${format(targetDate, "EEEE")}`;
        return {
          isOnline: false,
          headline: "offline",
          subline: `Available ${localizedDayInfo} at ${slots[0]}`
        };
      }
    }
  }

  return {
    isOnline: false,
    headline: "offline",
    subline: "No slots available"
  };
};

const ServiceIcon = ({ type }: { type: string }) => {
  const iconClass = "w-5 h-5";
  const color = "#E8599C";
  switch (type) {
    case "checkup": return <Stethoscope className={iconClass} style={{ color }} />;
    case "vaccination": return <Syringe className={iconClass} style={{ color }} />;
    case "surgery": return <Scissors className={iconClass} style={{ color }} />;
    case "dental": return <Shield className={iconClass} style={{ color }} />;
    default: return <Stethoscope className={iconClass} style={{ color }} />;
  }
};

const AnimalIcon = ({ type }: { type: string }) => {
  const iconClass = "w-5 h-5";
  const color = "#9B6FE8";
  switch (type) {
    case "dog": return <Dog className={iconClass} style={{ color }} />;
    case "cat": return <Cat className={iconClass} style={{ color }} />;
    case "bird": return <Bird className={iconClass} style={{ color }} />;
    case "rabbit": return <Rabbit className={iconClass} style={{ color }} />;
    case "fish": return <Fish className={iconClass} style={{ color }} />;
    case "hamster": return <HamsterIcon className={iconClass} style={{ color }} />;
    default: return <Dog className={iconClass} style={{ color }} />;
  }
};

interface VetData {
  name: string;
  title: string;
  clinic: string;
  rating: number;
  yearsExp: number;
  totalConsultations: number;
  specializations: string[];
  services: { icon: string; label: string }[];
  animals: { icon: string; label: string }[];
  qualification: string;
  profileImage: string;
  verified: boolean;
  onlineFee: number;
  offlineFee: number;
  consultationType: string;
  vetProfileId: string;
  weekly_availability?: unknown;
}

const VetDoctorProfile = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isFavorite, setIsFavorite] = useState(false);
  const [doctor, setDoctor] = useState<VetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiBio, setAiBio] = useState<string>("");
  const [generatingBio, setGeneratingBio] = useState<boolean>(false);

  const status = useMemo(() => {
    if (!doctor) return { isOnline: false, headline: 'offline', subline: 'No slots available' };
    return getAvailabilityStatus(doctor.weekly_availability);
  }, [doctor]);

  useBuyerActivityTracker({
    entityType: "vet",
    entityId: id,
    entityName: doctor?.name || undefined,
    entityImage: doctor?.profileImage || undefined,
  });
  useEffect(() => {
    const fetchVetProfile = async () => {
      if (!id) return;
      setLoading(true);

      try {
        // Fetch vet_profiles with the given id
        const { data: vetProfile, error: vetError } = await supabase
          .from("vet_profiles")
          .select("*, weekly_availability")
          .eq("id", id)
          .single();

        if (vetError || !vetProfile) {
          console.error("Vet profile not found:", vetError);
          setLoading(false);
          return;
        }

        // Fetch the associated user profile for name and approval status
        const { data: userProfile } = await supabase
          .from("profiles")
          .select("name, full_name, profile_photo, is_admin_approved")
          .eq("id", vetProfile.user_id)
          .single();

        const isApproved = userProfile ? userProfile.is_admin_approved !== false : true;
        const isVerified = vetProfile.verification_status === "verified" || vetProfile.verification_status === "approved";

        if (!isVerified || !isApproved) {
           setDoctor(null);
           setLoading(false);
           return;
        }

        const name = userProfile?.full_name || userProfile?.name || "Doctor";
        const specializations = vetProfile.specializations || [];
        const qualification = vetProfile.qualification || "BVSc";

        // Build title from first specialization or qualification
        const title = specializations.length > 0
          ? specializations[0]
          : qualification;

        // Build services from specializations
        const services = specializations.length > 0
          ? specializations.map((spec: string) => ({
              icon: specToServiceIcon(spec),
              label: spec,
            }))
          : [{ icon: "checkup", label: "General Checkup" }];

        // Derive animals treated
        const animals = deriveAnimals(specializations);

        let profilePhoto = vetProfile.profile_photo || userProfile?.profile_photo || "";
        if (profilePhoto && !profilePhoto.startsWith("http")) {
          profilePhoto = supabase.storage.from("vet-documents").getPublicUrl(profilePhoto).data.publicUrl;
        }

        const weeklyAvailability = vetProfile.weekly_availability as Record<string, unknown> | null;
        if (weeklyAvailability && typeof weeklyAvailability === "object" && "ai_description" in weeklyAvailability) {
          setAiBio((weeklyAvailability as Record<string, string>).ai_description || "");
        } else {
          setAiBio("");
        }

        setDoctor({
          name: `Dr. ${name}`,
          title,
          clinic: vetProfile.clinic_address || "Clinic address not provided",
          rating: vetProfile.average_rating || 0,
          yearsExp: vetProfile.years_of_experience || 0,
          totalConsultations: vetProfile.total_consultations || 0,
          specializations,
          services,
          animals,
          qualification,
          profileImage: profilePhoto,
          verified: vetProfile.verification_status === "verified",
          onlineFee: vetProfile.online_fee || 500,
          offlineFee: vetProfile.offline_fee || 800,
          consultationType: vetProfile.consultation_type || "both",
          vetProfileId: vetProfile.id,
          weekly_availability: vetProfile.weekly_availability,
        });
      } catch (err) {
        console.error("Error fetching vet profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchVetProfile();
    if (id) {
      sessionStorage.setItem("last_viewed_vet_id", id);
    }
  }, [id]);

  useEffect(() => {
    if (!doctor || aiBio || loading) return;

    const hasDescription = doctor.weekly_availability && typeof doctor.weekly_availability === "object" && "ai_description" in doctor.weekly_availability;
    const cached = hasDescription ? (doctor.weekly_availability as Record<string, string>).ai_description : undefined;
    if (cached) {
      setAiBio(cached);
      return;
    }

    const generateBio = async () => {
      setGeneratingBio(true);
      try {
        const response = await fetch("/api/generate-vet-bio", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            vetId: doctor.vetProfileId,
            name: doctor.name,
            qualification: doctor.qualification,
            yearsExp: doctor.yearsExp,
            specializations: doctor.specializations,
            consultationType: doctor.consultationType,
            clinic: doctor.clinic,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.description) {
            setAiBio(data.description);
          }
        }
      } catch (err) {
        console.error("Failed to generate doctor description:", err);
      } finally {
        setGeneratingBio(false);
      }
    };

    generateBio();
  }, [doctor, aiBio, loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-muted-foreground text-center">Doctor profile not found</p>
        <button onClick={() => navigate(-1)} className="text-sm font-medium" style={{ color: "#8E7CFF" }}>
          Go Back
        </button>
      </div>
    );
  }

  const coverImage = "https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=800&h=400&fit=crop";

  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      {/* Top bar - fixed on top of everything and slightly lowered */}
      <div className="fixed top-6 sm:top-12 left-4 right-4 flex justify-between z-50">
        <button 
          onClick={() => navigate("/vet")} 
          className="w-10 h-10 rounded-full bg-[#F3F0F9] flex items-center justify-center shadow-md active:scale-95 transition-all"
        >
          <ArrowLeft className="w-5 h-5 text-[#6B7280]" />
        </button>
        <div className="flex gap-2.5">
          <button 
            onClick={() => setIsFavorite(!isFavorite)} 
            className="w-10 h-10 rounded-full bg-[#F3F0F9] flex items-center justify-center shadow-md active:scale-95 transition-all"
          >
            <Heart className={`w-5 h-5 ${isFavorite ? "fill-[#A855F7] text-[#A855F7]" : "text-[#6B7280]"}`} />
          </button>
          <button 
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: doctor.name,
                  text: `Check out ${doctor.name} on Sruvo`,
                  url: window.location.href,
                }).catch(() => {});
              } else {
                navigator.clipboard.writeText(window.location.href);
                toast.success("Link copied!");
              }
            }}
            className="w-10 h-10 rounded-full bg-[#F3F0F9] flex items-center justify-center shadow-md active:scale-95 transition-all"
          >
            <Share2 className="w-5 h-5 text-[#6B7280]" />
          </button>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto pb-28">
        {/* Cover Image */}
        <div className="relative h-[260px]">
          <img
            src={coverImage}
            alt="Clinic"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        </div>

        {/* Doctor Profile Card */}
        <div className="px-4 -mt-16 relative z-10">
          <div className="bg-card rounded-3xl p-4 shadow-lg border border-border">
            <div className="flex items-start gap-4">
              <div className="relative flex-shrink-0">
                <div className="w-[72px] h-[72px] rounded-2xl overflow-hidden border-[3px] border-white shadow-md bg-muted">
                  {doctor.profileImage ? (
                    <img
                      src={doctor.profileImage}
                      alt={doctor.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-muted-foreground">
                      {doctor.name.charAt(4)}
                    </div>
                  )}
                </div>
                {doctor.verified && (
                  <VerifiedBadge className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white border-2 border-white" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-bold text-foreground">{doctor.name}</h1>
                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                  {status.isOnline ? (
                    <span className="flex items-center gap-1.5 bg-green-500/10 text-green-600 px-2 py-0.5 rounded-full border border-green-500/20 text-[11px] font-bold tracking-wide">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                      </span>
                      Available Today
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full border border-red-500/20 text-[11px] font-bold tracking-wide">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                      </span>
                      offline
                    </span>
                  )}
                  <span className="text-[11px] font-semibold text-muted-foreground">
                    • {status.subline}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="px-4 mt-4">
          <div className="bg-card rounded-2xl p-4 shadow-sm border border-border flex items-center">
            <div className="flex-1 text-center">
              <p className="text-lg font-bold text-foreground">{doctor.yearsExp}+</p>
              <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Years Exp</p>
            </div>
            <div className="w-px h-10 bg-border" />
            <div className="flex-1 text-center">
              <p className="text-lg font-bold text-foreground">{doctor.totalConsultations}+</p>
              <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Patients</p>
            </div>
            <div className="w-px h-10 bg-border" />
            <div className="flex-1 text-center">
              <div className="flex items-center justify-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <p className="text-lg font-bold text-foreground">{doctor.rating > 0 ? doctor.rating : "New"}</p>
              </div>
              <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Rating</p>
            </div>
          </div>
        </div>

        <div className="px-4 mt-5 space-y-5">
          {/* About Doctor */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-base font-bold text-foreground">About Doctor</h2>
              {doctor.verified && (
                <span className="bg-blue-50 text-blue-600 text-[10px] font-semibold px-2.5 py-0.5 rounded-full">
                  VERIFIED PROVIDER
                </span>
              )}
            </div>
            {generatingBio ? (
              <div className="space-y-2.5 animate-pulse py-1">
                <div className="h-3.5 bg-muted rounded w-full"></div>
                <div className="h-3.5 bg-muted rounded w-11/12"></div>
                <div className="h-3.5 bg-muted rounded w-9/12"></div>
              </div>
            ) : aiBio ? (
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line font-medium">
                {aiBio}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                {doctor.name} is a qualified veterinary professional with {doctor.yearsExp}+ years of experience specializing in {doctor.specializations.join(", ") || "general veterinary care"}. 
                {doctor.consultationType === "both" 
                  ? " Available for both online and offline consultations."
                  : doctor.consultationType === "online"
                  ? " Available for online consultations."
                  : " Available for clinic visits."}
              </p>
            )}
          </section>

          {/* Animals Treated/Specializations */}
          {doctor.animals.length > 0 && (
            <section>
              <h2 className="text-base font-bold text-foreground mb-3">Specializations</h2>
              <div className="flex gap-4">
                {doctor.animals.map((animal) => (
                  <div key={animal.label} className="flex flex-col items-center gap-1.5">
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: "#F3F0FF" }}
                    >
                      <AnimalIcon type={animal.icon} />
                    </div>
                    <span className="text-[11px] font-semibold text-muted-foreground">{animal.label}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Professional Qualifications */}
          <section>
            <h2 className="text-base font-bold text-foreground mb-3">Professional Qualifications</h2>
            <div className="space-y-3">
              <div className="bg-card rounded-2xl p-4 shadow-sm border border-border flex items-start gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: "#F3F0FF" }}
                >
                  <BadgeCheck className="w-5 h-5" style={{ color: "#8E7CFF" }} />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">{doctor.qualification}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Qualified Veterinary Professional</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Sticky Bottom Booking Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-4 py-4 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <button
          onClick={() => navigate("/vet/booking-details", { 
            state: { 
              matchedVet: doctor ? { 
                id: doctor.vetProfileId, 
                name: doctor.name, 
                specialization: doctor.title, 
                image: doctor.profileImage, 
                rating: doctor.rating, 
                experience: doctor.yearsExp, 
                fee: doctor.offlineFee, 
                onlineFee: doctor.onlineFee, 
                offlineFee: doctor.offlineFee, 
                qualification: doctor.qualification, 
                clinicAddress: doctor.clinic,
                weekly_availability: doctor.weekly_availability
              } : undefined,
              isDirectBooking: true
            } 
          })}
          className="w-full py-4 rounded-2xl text-white font-semibold text-base shadow-lg"
          style={{ background: "linear-gradient(135deg, #FF4D6D, #8B5CF6)" }}
        >
          Book Appointment
        </button>
      </div>
    </div>
  );
};

export default VetDoctorProfile;
