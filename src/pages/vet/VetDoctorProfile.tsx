import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Heart, Share2, Star, BadgeCheck, ChevronRight, MapPin,
  Stethoscope, Syringe, Scissors, Shield, Clock,
  Dog, Cat, Bird, Rabbit, Fish, Loader2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import useBuyerActivityTracker from "@/hooks/useBuyerActivityTracker";

// Map specialization strings to service icon types
const specToServiceIcon = (spec: string): string => {
  const lower = spec.toLowerCase();
  if (lower.includes("surgery") || lower.includes("orthop")) return "surgery";
  if (lower.includes("vaccin")) return "vaccination";
  if (lower.includes("dental") || lower.includes("skin") || lower.includes("derma")) return "dental";
  return "checkup";
};

// Derive animals from specializations
const deriveAnimals = (specializations: string[]): { icon: string; label: string }[] => {
  const animalMap: Record<string, { icon: string; label: string }> = {
    dog: { icon: "dog", label: "Dog" },
    cat: { icon: "cat", label: "Cat" },
    bird: { icon: "bird", label: "Bird" },
    rabbit: { icon: "rabbit", label: "Rabbit" },
    fish: { icon: "fish", label: "Fish" },
  };

  const found = new Set<string>();
  const specStr = specializations.join(" ").toLowerCase();

  for (const [key] of Object.entries(animalMap)) {
    if (specStr.includes(key)) found.add(key);
  }

  // If specializations mention "all" or "general" or nothing specific, show common animals
  if (found.size === 0 || specStr.includes("all") || specStr.includes("general")) {
    return [animalMap.dog, animalMap.cat, animalMap.bird, animalMap.rabbit];
  }

  return Array.from(found).map((key) => animalMap[key]);
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
}

const VetDoctorProfile = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isFavorite, setIsFavorite] = useState(false);
  const [doctor, setDoctor] = useState<VetData | null>(null);
  const [loading, setLoading] = useState(true);

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
          .select("*")
          .eq("id", id)
          .single();

        if (vetError || !vetProfile) {
          console.error("Vet profile not found:", vetError);
          setLoading(false);
          return;
        }

        // Fetch the associated user profile for name
        const { data: userProfile } = await supabase
          .from("profiles")
          .select("name, full_name, profile_photo")
          .eq("id", vetProfile.user_id)
          .single();

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

        const profilePhoto = vetProfile.profile_photo || userProfile?.profile_photo || "";

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
        });
      } catch (err) {
        console.error("Error fetching vet profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchVetProfile();
  }, [id]);

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
    <div className="min-h-screen bg-background flex flex-col">
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

          {/* Top bar - same as ProductProfile */}
          <div className="absolute top-10 left-4 right-4 flex justify-between z-10">
            <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-[#F3F0F9] flex items-center justify-center">
              <ArrowLeft className="w-5 h-5 text-[#6B7280]" />
            </button>
            <div className="flex gap-2.5">
              <button 
                onClick={() => setIsFavorite(!isFavorite)} 
                className="w-10 h-10 rounded-full bg-[#F3F0F9] flex items-center justify-center"
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
                className="w-10 h-10 rounded-full bg-[#F3F0F9] flex items-center justify-center"
              >
                <Share2 className="w-5 h-5 text-[#6B7280]" />
              </button>
            </div>
          </div>
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
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white">
                    <BadgeCheck className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-bold text-foreground">{doctor.name}</h1>
                <p className="text-sm font-medium" style={{ color: "#8E7CFF" }}>{doctor.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {doctor.clinic}
                </p>
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
            <p className="text-sm text-muted-foreground leading-relaxed">
              {doctor.name} is a qualified veterinary professional with {doctor.yearsExp}+ years of experience specializing in {doctor.specializations.join(", ") || "general veterinary care"}. 
              {doctor.consultationType === "both" 
                ? " Available for both online and offline consultations."
                : doctor.consultationType === "online"
                ? " Available for online consultations."
                : " Available for clinic visits."}
            </p>
          </section>

          {/* Specializations */}
          {doctor.specializations.length > 0 && (
            <section>
              <h2 className="text-base font-bold text-foreground mb-3">Specializations</h2>
              <div className="flex flex-wrap gap-2">
                {doctor.specializations.map((spec) => (
                  <span
                    key={spec}
                    className="px-3.5 py-1.5 rounded-full text-xs font-medium"
                    style={{ backgroundColor: "#FDE7EC", color: "#E8599C" }}
                  >
                    {spec}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Services Offered */}
          {doctor.services.length > 0 && (
            <section>
              <h2 className="text-base font-bold text-foreground mb-3">Services Offered</h2>
              <div className="grid grid-cols-2 gap-3">
                {doctor.services.map((service) => (
                  <div
                    key={service.label}
                    className="bg-card rounded-2xl p-4 shadow-sm border border-border flex items-center gap-3"
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: "#FDE7EC" }}
                    >
                      <ServiceIcon type={service.icon} />
                    </div>
                    <span className="text-xs font-semibold text-foreground">{service.label}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Animals Treated */}
          {doctor.animals.length > 0 && (
            <section>
              <h2 className="text-base font-bold text-foreground mb-3">Animals Treated</h2>
              <div className="flex gap-4">
                {doctor.animals.map((animal) => (
                  <div key={animal.label} className="flex flex-col items-center gap-1.5">
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: "#F3F0FF" }}
                    >
                      <AnimalIcon type={animal.icon} />
                    </div>
                    <span className="text-[11px] font-medium text-muted-foreground">{animal.label}</span>
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

          {/* Consultation Fees */}
          <section>
            <h2 className="text-base font-bold text-foreground mb-3">Consultation Fees</h2>
            <div className="grid grid-cols-2 gap-3">
              {(doctor.consultationType === "online" || doctor.consultationType === "both") && (
                <div className="bg-card rounded-2xl p-4 shadow-sm border border-border text-center">
                  <p className="text-xs text-muted-foreground mb-1">Online</p>
                  <p className="text-lg font-bold text-foreground">₹{doctor.onlineFee}</p>
                </div>
              )}
              {(doctor.consultationType === "offline" || doctor.consultationType === "both") && (
                <div className="bg-card rounded-2xl p-4 shadow-sm border border-border text-center">
                  <p className="text-xs text-muted-foreground mb-1">Clinic Visit</p>
                  <p className="text-lg font-bold text-foreground">₹{doctor.offlineFee}</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Sticky Bottom Booking Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-4 py-4 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <button
          onClick={() => navigate("/vet/booking-details", { state: { matchedVet: doctor ? { id: doctor.vetProfileId, name: doctor.name, specialization: doctor.title, image: doctor.profileImage, rating: doctor.rating, experience: doctor.yearsExp, fee: doctor.offlineFee, onlineFee: doctor.onlineFee, offlineFee: doctor.offlineFee, qualification: doctor.qualification, clinicAddress: doctor.clinic } : undefined } })}
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
