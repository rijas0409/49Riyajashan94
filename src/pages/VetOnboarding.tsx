import { useState, useEffect } from "react";
import { SRUVO_LOGO_URL } from "@/constants/branding";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Loader2, Upload, FileText, CheckCircle, Shield, ShieldCheck, Stethoscope,
  Calendar, Banknote, User, Building2, ScrollText, Camera, Home, Video, Briefcase,
  CreditCard, GraduationCap, Plus, Trash2, ChevronLeft, ChevronRight, LogOut, MapPin,
  Dog, Cat, Bird, Sparkles, Sunrise, Sun, Moon, Copy, Check, X, Clock, CheckSquare, Info,
  ChevronDown, ChevronUp, ExternalLink
} from "lucide-react";
import { AccountReviewScreen } from "@/components/AccountReviewScreen";
import { INDIA_STATES, INDIA_STATES_AND_CITIES } from "@/constants/indiaLocations";

const ALLOWED_VET_STATES = ["Delhi", "Haryana", "Madhya Pradesh", "Punjab"];

/* ─── types ─── */
interface EducationRow {
  qualification: string;
  institution: string;
  year: string;
  certificateFile: File | null;
}

interface AvailabilityPeriod {
  enabled: boolean;
  slots: string[];
}

interface DayAvailability {
  morning: AvailabilityPeriod;
  afternoon: AvailabilityPeriod;
  evening: AvailabilityPeriod;
  night: AvailabilityPeriod;
}

const EMPTY_EDU: EducationRow = { qualification: "", institution: "", year: "", certificateFile: null };

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

const VetOnboarding = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);

  /* ─── review toggle state ─── */
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    personal: false,
    identity: false,
    professional: false,
    practice: false,
    availability: false,
    fees: false,
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  /* ─── form state ─── */
  const [formData, setFormData] = useState({
    // Step 1 – Personal
    fullName: "", email: "", phone: "", city: "", state: "", address: "", preferredLanguage: "",
    dob: "", gender: "",
    isIndependentPractice: false,
    // Step 2 – Identity
    govtIdFile: null as File | null, panCardFile: null as File | null, passportPhotoFile: null as File | null,
    // Step 3 – Professional
    qualification: "BVSc", registrationNumber: "", vetDegreeFile: null as File | null,
    educationRows: [{ ...EMPTY_EDU }] as EducationRow[],
    // Step 4 – Clinic
    clinicRegistrationFile: null as File | null, clinicShopLicenseFile: null as File | null,
    gstCertificateFile: null as File | null, clinicAddress: "", clinicAddressProofFile: null as File | null,
    // Step 4 – Clinic/Hospital Expansion
    practiceType: ["Hospital / Organization"] as string[],
    clinicName: "", clinicPincode: "",
    hospitalName: "", hospitalRole: "", hospitalAddress: "", hospitalPincode: "", hospitalJoiningProofFile: null as File | null,
    // Bank info (Optional/Internal)
    bankAccountName: "", bankName: "", bankAccountNumber: "", bankIfsc: "",
    cancelledChequeFile: null as File | null,
    // Step 5 – Availability
    specializations: [] as string[], consultationTypes: [] as string[],
    availableDays: [] as string[], morningSlots: false, eveningSlots: false,
    onlineFee: "500", offlineFee: "800", yearsOfExperience: "",
    emergencyAvailable: true,
    support24x7: "yes",
    weekendAvailability: "yes",
    // Step 6 – Compliance
    vendorAgreement: false, termsAccepted: false, telemedicineConsent: false,
    // Mandatory Profile Photo
    profilePhoto: null as File | null, clinicPhotos: [] as File[],
  });

  const [filePreviews, setFilePreviews] = useState<Record<string, string>>({});
  
  // Auto-save draft effect
  useEffect(() => {
    const saveFormData = () => {
      const { 
        govtIdFile, panCardFile, passportPhotoFile, vetDegreeFile, 
        clinicRegistrationFile, clinicShopLicenseFile, gstCertificateFile, 
        clinicAddressProofFile, cancelledChequeFile, profilePhoto, educationRows, ...rest 
      } = formData;
      localStorage.setItem(`vet-onboarding-draft-${profile?.id}`, JSON.stringify(rest));
    };
    
    // Simple debounce to avoid too many writes
    const timer = setTimeout(saveFormData, 1000);
    return () => clearTimeout(timer);
  }, [formData, profile?.id]);

  // Load draft effect
  useEffect(() => {
    if (profile?.id) {
      const draft = localStorage.getItem(`vet-onboarding-draft-${profile.id}`);
      if (draft) {
        try {
          const parsedDraft = JSON.parse(draft);
          setFormData(prev => ({ ...prev, ...parsedDraft }));
        } catch (e) {
          console.error("Failed to load draft:", e);
        }
      }
    }
  }, [profile?.id]);

  const [selectedDay, setSelectedDay] = useState<string>("Mon");
  const [sameTimingAllDays, setSameTimingAllDays] = useState<boolean>(false);
  const [weeklyAvailability, setWeeklyAvailability] = useState<Record<string, DayAvailability>>({
    Mon: {
      morning: { enabled: true, slots: ["09:00 AM – 11:00 AM", "11:30 AM – 01:00 PM"] },
      afternoon: { enabled: true, slots: ["01:30 PM – 03:30 PM"] },
      evening: { enabled: true, slots: ["04:30 PM – 06:30 PM", "07:00 PM – 08:00 PM"] },
      night: { enabled: false, slots: [] }
    },
    Tue: {
      morning: { enabled: true, slots: ["09:00 AM – 11:00 AM"] },
      afternoon: { enabled: true, slots: ["01:30 PM – 03:30 PM"] },
      evening: { enabled: true, slots: ["04:30 PM – 06:30 PM"] },
      night: { enabled: false, slots: [] }
    },
    Wed: {
      morning: { enabled: true, slots: ["09:00 AM – 11:00 AM"] },
      afternoon: { enabled: true, slots: ["01:30 PM – 03:30 PM"] },
      evening: { enabled: true, slots: ["04:30 PM – 06:30 PM"] },
      night: { enabled: false, slots: [] }
    },
    Thu: {
      morning: { enabled: true, slots: ["09:00 AM – 11:00 AM"] },
      afternoon: { enabled: true, slots: ["01:30 PM – 03:30 PM"] },
      evening: { enabled: true, slots: ["04:30 PM – 06:30 PM"] },
      night: { enabled: false, slots: [] }
    },
    Fri: {
      morning: { enabled: true, slots: ["09:00 AM – 11:00 AM"] },
      afternoon: { enabled: true, slots: ["01:30 PM – 03:30 PM"] },
      evening: { enabled: true, slots: ["04:30 PM – 06:30 PM"] },
      night: { enabled: false, slots: [] }
    },
    Sat: {
      morning: { enabled: false, slots: [] },
      afternoon: { enabled: false, slots: [] },
      evening: { enabled: false, slots: [] },
      night: { enabled: false, slots: [] }
    },
    Sun: {
      morning: { enabled: false, slots: [] },
      afternoon: { enabled: false, slots: [] },
      evening: { enabled: false, slots: [] },
      night: { enabled: false, slots: [] }
    }
  });

  // Load draft parser for weekly availability
  useEffect(() => {
    if (profile?.id) {
      const draft = localStorage.getItem(`vet-onboarding-draft-${profile.id}`);
      if (draft) {
        try {
          const parsed = JSON.parse(draft);
          if (parsed.weeklyAvailability) {
            setWeeklyAvailability(parsed.weeklyAvailability);
          }
        } catch (e) {
          console.error("Failed to parse draft weeklyAvailability:", e);
        }
      }
    }
  }, [profile?.id]);

  // Sync draft or preloaded weeklyAvailability structure into standard fields
  useEffect(() => {
    const activeDays = Object.keys(weeklyAvailability).filter(day => {
      const d = weeklyAvailability[day];
      return d.morning.enabled || d.afternoon.enabled || d.evening.enabled || d.night.enabled;
    });

    const hasMorning = Object.values(weeklyAvailability).some(d => d.morning.enabled && d.morning.slots.length > 0);
    const hasEvening = Object.values(weeklyAvailability).some(d => d.evening.enabled && d.evening.slots.length > 0);

    setFormData(prev => ({
      ...prev,
      availableDays: activeDays,
      morningSlots: hasMorning,
      eveningSlots: hasEvening,
      // Store full weekly availability securely
      weeklyAvailability: weeklyAvailability as unknown
    }));
  }, [weeklyAvailability]);

  // Adjust selectedDay so it always points to a valid selected day
  useEffect(() => {
    if (formData.availableDays && formData.availableDays.length > 0) {
      if (!formData.availableDays.includes(selectedDay)) {
        setSelectedDay(formData.availableDays[0]);
      }
    } else {
      setSelectedDay("");
    }
  }, [formData.availableDays, selectedDay]);

  const [specializationOptions, setSpecializationOptions] = useState<string[]>(["Dog", "Cat", "Bird", "Hamster"]);
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [customSpecName, setCustomSpecName] = useState("");

  // Sync draft or preloaded values with custom options list
  useEffect(() => {
    if (formData.specializations && formData.specializations.length > 0) {
      setSpecializationOptions(prev => {
        const next = [...prev];
        let changed = false;
        formData.specializations.forEach(s => {
          if (!next.includes(s)) {
            next.push(s);
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    }
  }, [formData.specializations]);

  const saveCustomSpec = () => {
    const trimmed = customSpecName.trim();
    if (trimmed) {
      const formatted = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
      if (!specializationOptions.includes(formatted)) {
        setSpecializationOptions(prev => [...prev, formatted]);
      }
      if (!formData.specializations.includes(formatted)) {
        setFormData(prev => ({
          ...prev,
          specializations: [...prev.specializations, formatted]
        }));
      }
      setCustomSpecName("");
      setIsAddingCustom(false);
      toast.success(`"${formatted}" added as specialization`);
    } else {
      setIsAddingCustom(false);
    }
  };

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const qualifications = ["BVSc", "MVSc", "PhD", "Other"];
  const languages = ["English", "Hindi", "Tamil", "Telugu", "Kannada", "Malayalam", "Bengali", "Marathi", "Gujarati"];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 80 }, (_, i) => (currentYear - i).toString());

  const consultationOptions = ["Video consultation", "Home visits", "Clinic visit"];

  const [showDobCalendar, setShowDobCalendar] = useState(false);
  const today = new Date();
  const [workingMonth, setWorkingMonth] = useState(today.getMonth());
  const [workingYear, setWorkingYear] = useState(today.getFullYear() - 25);

  const openDobCalendar = () => {
    if (formData.dob) {
      const parts = formData.dob.split("-");
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        if (!isNaN(y) && !isNaN(m)) {
          setWorkingYear(y);
          setWorkingMonth(m);
        }
      }
    } else {
      setWorkingYear(new Date().getFullYear());
      setWorkingMonth(new Date().getMonth());
    }
    setShowDobCalendar(true);
  };

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return "Select Date of Birth";
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      const months = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
      ];
      if (months[m]) {
        return `${d} ${months[m]} ${y}`;
      }
    }
    return dateStr;
  };

  const getDisplayPhone = (rawPhone: string) => {
    if (!rawPhone) return "";
    let clean = rawPhone.trim();
    if (clean.startsWith("+91")) {
      clean = clean.slice(3).trim();
    } else if (clean.startsWith("91") && clean.length > 10) {
      clean = clean.slice(2).trim();
    }
    return clean;
  };

  const handlePhoneChange = (val: string) => {
    const clean = val.replace(/[^\d]/g, "").slice(0, 10);
    setFormData(prev => ({
      ...prev,
      phone: clean
    }));
  };

  useEffect(() => {
    // Check if the user already has completed DB onboarding but was redirected here
    const checkStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const uid = session.user.id;
          const { data: p } = await supabase.from('profiles').select('is_onboarding_complete, is_admin_approved, name, phone, email, city, state, address, birth_date, gender').eq('id', uid).maybeSingle();
          
          // Fetch existing vet profile data to pre-fill
          const { data: vp } = await supabase.from('vet_profiles').select('*').eq('user_id', uid).maybeSingle();
          
          const defaultName = p?.name || session.user.user_metadata?.name || "";
          const defaultEmail = p?.email || session.user.email || "";

          if (vp) {
            // Check if they should be seeing the pending screen
            // If they are rejected, we let them STAY here to edit
            if (p?.is_onboarding_complete && p?.is_admin_approved) {
              navigate("/vet/home", { replace: true });
              return;
            } else if (p?.is_onboarding_complete && !p?.is_admin_approved && vp.verification_status !== 'failed') {
              navigate("/vet-pending-approval", { replace: true });
              return;
            }

            // Pre-fill form
            setFormData(prev => ({
              ...prev,
              fullName: p?.name || vp.fullName || defaultName,
              email: defaultEmail,
              phone: p?.phone || "",
              qualification: vp.qualification || "BVSc",
              registrationNumber: vp.registration_number || "",
              isIndependentPractice: vp.self_practice || false,
              yearsOfExperience: vp.years_of_experience?.toString() || "",
              specializations: vp.specializations || [],
              consultationTypes: vp.consultation_type?.split(", ") || [],
              availableDays: vp.available_days || [],
              morningSlots: vp.morning_slots || false,
              eveningSlots: vp.evening_slots || false,
              onlineFee: vp.online_fee?.toString() || "500",
              offlineFee: vp.offline_fee?.toString() || "800",
              bankAccountName: vp.bank_account_name || "",
              bankName: vp.bank_name || "",
              bankAccountNumber: vp.bank_account_number || "",
              bankIfsc: vp.bank_ifsc || "",
              preferredLanguage: vp.preferred_language || "",
              clinicAddress: vp.clinic_address || "",
              vendorAgreement: vp.vendor_agreement_accepted || false,
              telemedicineConsent: vp.telemedicine_consent_accepted || false,
              city: vp.city || p?.city || "",
              state: vp.state || p?.state || "",
              address: p?.address || "",
              dob: p?.birth_date || "",
              gender: p?.gender || "",
            }));
            
            // Pre-fill file previews for existing documents
            const getUrl = (path: string | null) => {
              if (!path) return null;
              if (path.startsWith("http")) return path;
              return supabase.storage.from("vet-documents").getPublicUrl(path).data.publicUrl;
            };

            setFilePreviews({
              govtIdFile: getUrl(vp.govt_id_file) || "",
              panCardFile: getUrl(vp.pan_card_file) || "",
              passportPhotoFile: getUrl(vp.passport_photo_file) || "",
              vetDegreeFile: getUrl(vp.vet_degree_file) || "",
              clinicRegistrationFile: getUrl(vp.clinic_registration_file) || "",
              clinicShopLicenseFile: getUrl(vp.clinic_shop_license_file) || "",
              gstCertificateFile: getUrl(vp.gst_certificate_file) || "",
              clinicAddressProofFile: getUrl(vp.clinic_address_proof_file) || "",
              cancelledChequeFile: getUrl(vp.cancelled_cheque_file) || "",
              profilePhoto: getUrl(vp.profile_photo) || "",
            });

            // Handle special cases like education rows
            if (vp.education_details && Array.isArray(vp.education_details)) {
              setFormData(prev => ({
                ...prev,
                educationRows: vp.education_details.map((edu: any, idx: number) => {
                  if (edu.certificate_url) {
                    setFilePreviews(prevPrevs => ({
                      ...prevPrevs,
                      [`edu_${idx}`]: getUrl(edu.certificate_url) || ""
                    }));
                  }
                  return {
                    qualification: edu.qualification,
                    institution: edu.institution,
                    year: edu.year,
                    certificateFile: null
                  };
                })
              }));
            }
          } else {
            // Pre-fill even if no vet profile exists yet!
            setFormData(prev => ({
              ...prev,
              fullName: defaultName,
              email: defaultEmail,
              phone: p?.phone || "",
              city: p?.city || "",
              state: p?.state || "",
              address: p?.address || "",
              dob: p?.birth_date || "",
              gender: p?.gender || "",
            }));
            if (p?.is_onboarding_complete) {
               navigate("/vet-pending-approval", { replace: true });
            }
          }
        }
      } catch (err) {
        console.error("Status check failed:", err);
      }
    };
    checkStatus();
  }, [navigate, profile]);

  // Sync the first row of education automatic feed as requested
  useEffect(() => {
    setFormData(prev => {
      if (prev.educationRows.length > 0) {
        const firstRow = prev.educationRows[0];
        if (
          firstRow.qualification !== prev.qualification ||
          firstRow.certificateFile !== prev.vetDegreeFile
        ) {
          const updatedRows = [...prev.educationRows];
          updatedRows[0] = {
            ...updatedRows[0],
            qualification: prev.qualification,
            certificateFile: prev.vetDegreeFile
          };
          return { ...prev, educationRows: updatedRows };
        }
      }
      return prev;
    });
  }, [formData.qualification, formData.vetDegreeFile]);

  useEffect(() => {
    if (filePreviews.vetDegreeFile) {
      setFilePreviews(prev => {
        if (prev.edu_0 !== prev.vetDegreeFile) {
          return { ...prev, edu_0: prev.vetDegreeFile };
        }
        return prev;
      });
    } else {
      setFilePreviews(prev => {
        if (prev.edu_0) {
          const { edu_0, ...rest } = prev;
          return rest;
        }
        return prev;
      });
    }
  }, [filePreviews.vetDegreeFile]);

  /* State and constant lists moved to the top of component to prevent Temporal Dead Zone (TDZ) reference errors */

  /* ─── helpers ─── */
  const handleFileChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check identity step fields
    const isIdentityField = ["govtIdFile", "panCardFile", "passportPhotoFile"].includes(field);
    if (isIdentityField) {
      const fileNameLower = file.name.toLowerCase();
      const validExtensions = [".png", ".jpg", ".jpeg"];
      const hasValidExt = validExtensions.some(ext => fileNameLower.endsWith(ext));
      const hasValidMime = file.type === "image/png" || file.type === "image/jpeg" || file.type === "image/jpg" || file.type.startsWith("image/");
      
      if (!hasValidExt && !hasValidMime) {
        toast.error("Please upload images only (supported formats: PNG, JPG, JPEG).");
        return;
      }
    }

    if (file.size > 5 * 1024 * 1024) { toast.error("File must be < 5 MB"); return; }
    setFormData(prev => ({ ...prev, [field]: file }));
    const reader = new FileReader();
    reader.onload = (ev) => setFilePreviews(prev => ({ ...prev, [field]: ev.target?.result as string }));
    reader.readAsDataURL(file);
  };

  const handleEduFileChange = (idx: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("File must be < 5 MB"); return; }
    setFormData(prev => {
      const rows = [...prev.educationRows];
      rows[idx] = { ...rows[idx], certificateFile: file };
      return { ...prev, educationRows: rows };
    });
    const reader = new FileReader();
    reader.onload = (ev) => setFilePreviews(prev => ({ ...prev, [`edu_${idx}`]: ev.target?.result as string }));
    reader.readAsDataURL(file);
  };

  const updateEduRow = (idx: number, field: keyof EducationRow, value: string) => {
    setFormData(prev => {
      const rows = [...prev.educationRows];
      rows[idx] = { ...rows[idx], [field]: value };
      return { ...prev, educationRows: rows };
    });
  };

  const addEduRow = () => setFormData(prev => ({ ...prev, educationRows: [...prev.educationRows, { ...EMPTY_EDU }] }));
  const removeEduRow = (idx: number) => {
    if (formData.educationRows.length <= 1) return;
    setFormData(prev => ({ ...prev, educationRows: prev.educationRows.filter((_, i) => i !== idx) }));
  };

  const toggleSpec = (s: string) => setFormData(prev => ({
    ...prev, specializations: prev.specializations.includes(s) ? prev.specializations.filter(x => x !== s) : [...prev.specializations, s],
  }));
  const toggleConsultation = (t: string) => setFormData(prev => ({
    ...prev, consultationTypes: prev.consultationTypes.includes(t) ? prev.consultationTypes.filter(x => x !== t) : [...prev.consultationTypes, t],
  }));
  const toggleDay = (day: string) => {
    setWeeklyAvailability(prev => {
      const currentDayData = prev[day];
      const isCurrentlyEnabled = currentDayData && (currentDayData.morning.enabled || currentDayData.afternoon.enabled || currentDayData.evening.enabled || currentDayData.night.enabled);

      const next = { ...prev };
      if (isCurrentlyEnabled) {
        // Disable everything for this day
        next[day] = {
          morning: { enabled: false, slots: [] },
          afternoon: { enabled: false, slots: [] },
          evening: { enabled: false, slots: [] },
          night: { enabled: false, slots: [] }
        };
      } else {
        // If sameTimingAllDays is true, copy selectedDay's schedule
        if (sameTimingAllDays && selectedDay && prev[selectedDay]) {
          next[day] = JSON.parse(JSON.stringify(prev[selectedDay]));
        } else {
          // Enable with sensible defaults so it is not blank
          next[day] = {
            morning: { enabled: true, slots: ["09:00 AM – 11:00 AM", "11:30 AM – 01:00 PM"] },
            afternoon: { enabled: true, slots: ["01:30 PM – 03:30 PM"] },
            evening: { enabled: true, slots: ["04:30 PM – 06:30 PM", "07:00 PM – 08:00 PM"] },
            night: { enabled: false, slots: [] }
          };
        }
      }
      return next;
    });

    toast.success(`Updated ${day}'s availability status!`);
  };

  const [addingSlotRow, setAddingSlotRow] = useState<string | null>(null);
  const [newSlotStart, setNewSlotStart] = useState<string>("09:00");
  const [newSlotEnd, setNewSlotEnd] = useState<string>("11:00");

  const convertTimeTo12Hr = (time24: string): string => {
    if (!time24) return "";
    const [hourStr, minStr] = time24.split(":");
    let hour = parseInt(hourStr, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12;
    hour = hour ? hour : 12;
    const hrStr = hour < 10 ? `0${hour}` : `${hour}`;
    return `${hrStr}:${minStr} ${ampm}`;
  };

  const handleOpenAddSlot = (period: "morning" | "afternoon" | "evening" | "night") => {
    setAddingSlotRow(period);
    if (period === "morning") {
      setNewSlotStart("09:00");
      setNewSlotEnd("11:00");
    } else if (period === "afternoon") {
      setNewSlotStart("13:30");
      setNewSlotEnd("15:30");
    } else if (period === "evening") {
      setNewSlotStart("16:30");
      setNewSlotEnd("18:30");
    } else {
      setNewSlotStart("20:00");
      setNewSlotEnd("22:00");
    }
  };

  const handleSaveSlot = (period: "morning" | "afternoon" | "evening" | "night") => {
    if (!newSlotStart || !newSlotEnd) {
      toast.error("Please select a valid start and end time");
      return;
    }
    const formattedStart = convertTimeTo12Hr(newSlotStart);
    const formattedEnd = convertTimeTo12Hr(newSlotEnd);
    const newSlotStr = `${formattedStart} – ${formattedEnd}`;

    setWeeklyAvailability(prev => {
      const currentDayData = prev[selectedDay];
      const periodData = currentDayData[period];
      
      if (periodData.slots.includes(newSlotStr)) {
        toast.error("Time slot already exists");
        return prev;
      }

      const updatedSlots = [...periodData.slots, newSlotStr];
      updatedSlots.sort();

      const next = {
        ...prev,
        [selectedDay]: {
          ...currentDayData,
          [period]: {
            ...periodData,
            enabled: true,
            slots: updatedSlots
          }
        }
      };

      if (sameTimingAllDays) {
        const sourceDayData = next[selectedDay];
        Object.keys(next).forEach(day => {
          if (day !== selectedDay) {
            const isDayActive = next[day] && (next[day].morning.enabled || next[day].afternoon.enabled || next[day].evening.enabled || next[day].night.enabled);
            if (isDayActive) {
              next[day] = JSON.parse(JSON.stringify(sourceDayData));
            }
          }
        });
      }

      return next;
    });

    setAddingSlotRow(null);
    toast.success("Time slot added");
  };

  const handleRemoveSlot = (period: "morning" | "afternoon" | "evening" | "night", index: number) => {
    setWeeklyAvailability(prev => {
      const currentDayData = prev[selectedDay];
      const periodData = currentDayData[period];
      const updatedSlots = periodData.slots.filter((_, i) => i !== index);
      
      const next = {
        ...prev,
        [selectedDay]: {
          ...currentDayData,
          [period]: {
            ...periodData,
            slots: updatedSlots
          }
        }
      };

      if (sameTimingAllDays) {
        const sourceDayData = next[selectedDay];
        Object.keys(next).forEach(day => {
          if (day !== selectedDay) {
            const isDayActive = next[day] && (next[day].morning.enabled || next[day].afternoon.enabled || next[day].evening.enabled || next[day].night.enabled);
            if (isDayActive) {
              next[day] = JSON.parse(JSON.stringify(sourceDayData));
            }
          }
        });
      }

      return next;
    });
    toast.success("Time slot removed");
  };

  const handleTogglePeriod = (period: "morning" | "afternoon" | "evening" | "night") => {
    setWeeklyAvailability(prev => {
      const currentDayData = prev[selectedDay];
      const periodData = currentDayData[period];
      const nextEnabled = !periodData.enabled;
      
      let nextSlots = [...periodData.slots];
      if (nextEnabled && nextSlots.length === 0) {
        if (period === "morning") nextSlots = ["09:00 AM – 11:00 AM"];
        if (period === "afternoon") nextSlots = ["01:30 PM – 03:30 PM"];
        if (period === "evening") nextSlots = ["04:30 PM – 06:30 PM"];
        if (period === "night") nextSlots = ["08:00 PM – 10:00 PM"];
      }

      const next = {
        ...prev,
        [selectedDay]: {
          ...currentDayData,
          [period]: {
            ...periodData,
            enabled: nextEnabled,
            slots: nextSlots
          }
        }
      };

      if (sameTimingAllDays) {
        const sourceDayData = next[selectedDay];
        Object.keys(next).forEach(day => {
          if (day !== selectedDay) {
            const isDayActive = next[day] && (next[day].morning.enabled || next[day].afternoon.enabled || next[day].evening.enabled || next[day].night.enabled);
            if (isDayActive) {
              next[day] = JSON.parse(JSON.stringify(sourceDayData));
            }
          }
        });
      }

      return next;
    });
  };

  const handleToggleSameTiming = (checked: boolean) => {
    setSameTimingAllDays(checked);
    if (checked && selectedDay) {
      setWeeklyAvailability(prev => {
        const currentDayData = prev[selectedDay];
        const updated = { ...prev };
        Object.keys(updated).forEach(day => {
          if (day !== selectedDay) {
            const isDayActive = updated[day] && (updated[day].morning.enabled || updated[day].afternoon.enabled || updated[day].evening.enabled || updated[day].night.enabled);
            if (isDayActive) {
              updated[day] = JSON.parse(JSON.stringify(currentDayData));
            }
          }
        });
        return updated;
      });
      toast.success("Synchronized timing for all selected days!");
    }
  };

  const uploadFile = async (file: File, userId: string, type: string) => {
    const ext = file.name.split('.').pop();
    const path = `${userId}/${type}_${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('vet-documents').upload(path, file);
    if (error) throw error;
    return path;
  };

  /* ─── submit ─── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.termsAccepted || !formData.vendorAgreement) { toast.error("Please accept all required agreements"); return; }
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth-vet"); return; }
      const uid = session.user.id;
      const { data: existingVp } = await supabase.from('vet_profiles').select('*').eq('user_id', uid).maybeSingle();

      // Helper to handle new upload or preserve existing
      const handleFile = async (file: File | null, type: string, existingPath: string | null) => {
        if (file) return await uploadFile(file, uid, type);
        return existingPath;
      };

      const [
        govtIdUrl, panUrl, passportUrl, vetDegreeUrl, clinicRegUrl, 
        shopLicUrl, gstUrl, clinicAddrProofUrl, chequeUrl, profilePhotoUrl
      ] = await Promise.all([
        handleFile(formData.govtIdFile, 'govt_id', existingVp?.govt_id_file),
        handleFile(formData.panCardFile, 'pan_card', existingVp?.pan_card_file),
        handleFile(formData.passportPhotoFile, 'passport_photo', existingVp?.passport_photo_file),
        handleFile(formData.vetDegreeFile, 'vet_degree', existingVp?.vet_degree_file),
        handleFile(formData.clinicRegistrationFile, 'clinic_reg', existingVp?.clinic_registration_file),
        handleFile(formData.clinicShopLicenseFile, 'shop_license', existingVp?.clinic_shop_license_file),
        handleFile(formData.gstCertificateFile, 'gst_cert', existingVp?.gst_certificate_file),
        handleFile(formData.clinicAddressProofFile, 'clinic_addr_proof', existingVp?.clinic_address_proof_file),
        handleFile(formData.cancelledChequeFile, 'cancelled_cheque', existingVp?.cancelled_cheque_file),
        handleFile(formData.profilePhoto, 'profile_photo', existingVp?.profile_photo),
      ]);

      // Upload education certificates
      const eduDetails = [];
      const oldEdu = existingVp?.education_details || [];
      for (let i = 0; i < formData.educationRows.length; i++) {
        const row = formData.educationRows[i];
        let certUrl = null;
        if (i === 0) {
          certUrl = vetDegreeUrl;
        } else if (row.certificateFile) {
          certUrl = await uploadFile(row.certificateFile, uid, `edu_cert_${i}`);
        } else if (oldEdu[i]?.certificate_url) {
          certUrl = oldEdu[i].certificate_url;
        }
        eduDetails.push({ qualification: row.qualification || formData.qualification, institution: row.institution, year: row.year, certificate_url: certUrl });
      }

      // Upload clinic photos
      let clinicPhotoUrls: string[] = existingVp?.clinic_photos || [];
      if (formData.clinicPhotos.length > 0) {
        const newPhotos = [];
        for (const photo of formData.clinicPhotos) {
          newPhotos.push(await uploadFile(photo, uid, 'clinic_photo'));
        }
        clinicPhotoUrls = [...clinicPhotoUrls, ...newPhotos];
      }

      // 2. Insert or Update Profile
      const existingVet = existingVp;

      const upsertData = {
        user_id: uid,
        qualification: formData.qualification,
        self_practice: formData.isIndependentPractice,
        years_of_experience: parseInt(formData.yearsOfExperience) || 0,
        specializations: formData.specializations,
        consultation_type: formData.consultationTypes.join(", "),
        vet_degree_file: vetDegreeUrl,
        registration_number: formData.registrationNumber,
        govt_id_file: govtIdUrl,
        clinic_registration_file: clinicRegUrl,
        profile_photo: profilePhotoUrl,
        available_days: formData.availableDays,
        morning_slots: formData.morningSlots,
        evening_slots: formData.eveningSlots,
        online_fee: parseFloat(formData.onlineFee) || 500,
        offline_fee: parseFloat(formData.offlineFee) || 800,
        bank_account_name: formData.bankAccountName,
        bank_name: formData.bankName,
        bank_account_number: formData.bankAccountNumber,
        bank_ifsc: formData.bankIfsc,
        preferred_language: formData.preferredLanguage,
        clinic_address: formData.clinicAddress,
        pan_card_file: panUrl,
        passport_photo_file: passportUrl,
        clinic_shop_license_file: shopLicUrl,
        gst_certificate_file: gstUrl,
        clinic_address_proof_file: clinicAddrProofUrl,
        cancelled_cheque_file: chequeUrl,
        vendor_agreement_accepted: formData.vendorAgreement,
        telemedicine_consent_accepted: formData.telemedicineConsent,
        clinic_photos: clinicPhotoUrls,
        education_details: eduDetails,
        verification_status: "pending", 
        rejection_reason: null as string | null, 
        reviewed_at: null as string | null,
        reviewed_by: null as string | null,
        appeal_requested: false,
        is_active: true,
        city: formData.city,
        state: formData.state,
      };

      if (existingVet) {
        let { error: vetError } = await supabase.from("vet_profiles").update(upsertData).eq("id", existingVet.id);
        if (vetError && (vetError.message?.includes("Could not find the") || vetError.message?.includes("column"))) {
           const fallbackData = { ...upsertData };
           delete (fallbackData as any).rejection_reason;
           delete (fallbackData as any).reviewed_at;
           delete (fallbackData as any).reviewed_by;
           delete (fallbackData as any).appeal_requested;
           delete (fallbackData as any).self_practice;
           delete (fallbackData as any).city;
           delete (fallbackData as any).state;
           const fallback = await supabase.from("vet_profiles").update(fallbackData).eq("id", existingVet.id);
           vetError = fallback.error;
        }
        if (vetError) throw vetError;
      } else {
        let { error: vetError } = await supabase.from("vet_profiles").insert([upsertData]);
        if (vetError && (vetError.message?.includes("Could not find the") || vetError.message?.includes("column"))) {
           const fallbackData = { ...upsertData };
           delete (fallbackData as any).rejection_reason;
           delete (fallbackData as any).reviewed_at;
           delete (fallbackData as any).reviewed_by;
           delete (fallbackData as any).appeal_requested;
           delete (fallbackData as any).self_practice;
           delete (fallbackData as any).city;
           delete (fallbackData as any).state;
           const fallback = await supabase.from("vet_profiles").insert([fallbackData]);
           vetError = fallback.error;
        }
        if (vetError) throw vetError;
      }

      // 3. Update Profile
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: uid,
        name: formData.fullName,
        full_name: formData.fullName,
        phone: formData.phone,
        email: formData.email,
        gender: formData.gender,
        birth_date: formData.dob || null,
        address: formData.address || `${formData.city}, ${formData.state}`,
        city: formData.city,
        state: formData.state,
        is_onboarding_complete: true,
        is_admin_approved: false,
        role: 'vet',
      } as any);

      if (profileError) throw profileError;

      // 4. Success feedback and routing
      toast.success("Professional profile submitted successfully!");
      localStorage.removeItem(`vet-onboarding-draft-${uid}`);
      navigate("/vet-pending-approval", { replace: true });
    } catch (error: any) {
      console.error("Submission error:", error);
      toast.error(error.message || "Failed to submit application. Please try again.");
    } finally { 
      setIsLoading(false); 
    }
  };

  /* ─── steps config ─── */
  const steps = [
    { n: 1, title: "Personal Info", icon: User },
    { n: 2, title: "Identity", icon: Shield },
    { n: 3, title: "Professional", icon: GraduationCap },
    { n: 4, title: "Professional Practice", icon: Building2 },
    { n: 5, title: "Availability", icon: Calendar },
    { n: 6, title: "Compliance", icon: ScrollText },
  ];

  const visibleSteps = steps.filter(s => !s.hidden);
  const currentVisibleStepIndex = visibleSteps.findIndex(s => s.n === currentStep);

  const canProceed = (step: number) => {
    switch (step) {
      case 1: {
        const hasProfilePhoto = formData.profilePhoto !== null || !!filePreviews.profilePhoto;
        return formData.fullName && formData.email && formData.phone && formData.preferredLanguage && formData.dob && formData.gender && formData.city && formData.state && formData.address && hasProfilePhoto;
      }
      case 2: {
        const hasGovt = formData.govtIdFile !== null || !!filePreviews.govtIdFile;
        const hasPan = formData.panCardFile !== null || !!filePreviews.panCardFile;
        const hasPassport = formData.passportPhotoFile !== null || !!filePreviews.passportPhotoFile;
        return hasGovt && hasPan && hasPassport;
      }
      case 3: {
        const hasVetDegree = formData.vetDegreeFile !== null || !!filePreviews.vetDegreeFile;
        const edu1 = formData.educationRows[0];
        const isEdu1Valid = edu1.institution && edu1.year;
        return hasVetDegree && formData.registrationNumber && isEdu1Valid;
      }
      case 4: {
        return true;
      }
      case 5: return (
        formData.availableDays.length > 0 && 
        formData.specializations.length > 0 && 
        formData.consultationTypes.length > 0 && 
        formData.yearsOfExperience !== "" && 
        formData.onlineFee !== "" && 
        formData.offlineFee !== ""
      );
      default: return true;
    }
  };

  /* ─── file upload UI helper ─── */
  const FileUploadBox = ({ field, label, accept = "image/*,.pdf", icon: Icon = Upload }: { field: string; label: string; accept?: string; icon?: any }) => {
    const hasExistingFile = (formData as any)[field] === null && filePreviews[field];
    const isFileUploaded = (formData as any)[field] !== null || filePreviews[field];

    return (
      <div className="space-y-1.5">
        <Label className="flex items-center gap-1 sm:gap-2 text-[10px] xs:text-xs sm:text-sm font-semibold text-[#334155]"><Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary shrink-0" />{label}</Label>
        <div className="border-2 border-dashed border-border rounded-xl sm:rounded-2xl p-2.5 sm:p-4 text-center hover:border-primary/50 transition-colors">
          <input type="file" accept={accept} onChange={handleFileChange(field)} className="hidden" id={`file-${field}`} />
          <label htmlFor={`file-${field}`} className="cursor-pointer select-none">
            {isFileUploaded ? (
              <div className="flex flex-col items-center gap-1 sm:gap-2">
                <div className="flex items-center justify-center gap-1.5 text-primary">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-[11px] sm:text-sm font-semibold">{hasExistingFile ? "Existing ✓" : "Uploaded ✓"}</span>
                </div>
                {filePreviews[field] && filePreviews[field].startsWith("http") && (
                   <span className="text-[9px] sm:text-[10px] text-muted-foreground underline truncate max-w-full">View Current</span>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1">
                <Upload className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                <span className="text-[10px] sm:text-xs text-muted-foreground">Upload (max 5MB)</span>
              </div>
            )}
          </label>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-soft">
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 py-4 max-w-3xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <img src={SRUVO_LOGO_URL} alt="Sruvo" className="w-12 h-12 object-contain" referrerPolicy="no-referrer" />
              <div>
                <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">Sruvo</span>
                <p className="text-xs text-muted-foreground">Vet Doctor Verification</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={async () => {
                 await supabase.auth.signOut();
                 navigate("/auth-vet");
               }}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-3xl">
        {/* Progress bar */}
        <div className="sticky top-[88px] z-40 flex items-center justify-between md:justify-center gap-1 md:gap-3 mb-6 bg-card p-3 rounded-2xl border border-border/60 shadow-sm overflow-x-auto scrollbar-none">
          {visibleSteps.map((step, i) => {
            const isCompleted = currentStep > step.n;
            const isActive = currentStep === step.n;
            return (
              <div key={step.n} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all ${
                    isCompleted || isActive 
                      ? "bg-gradient-primary text-white shadow-float" 
                      : "bg-muted text-muted-foreground"
                  }`}>
                    <step.icon className="w-4 h-4" />
                  </div>
                  <span className="hidden sm:block text-[9px] font-semibold mt-1 whitespace-nowrap">{step.title}</span>
                </div>
                {i < visibleSteps.length - 1 && (
                  <div className={`h-0.5 flex-1 min-w-[8px] sm:min-w-[16px] md:min-w-[24px] rounded-full mx-1 transition-all ${
                    isCompleted ? "bg-primary" : "bg-muted"
                  }`} />
                )}
              </div>
            );
          })}
        </div>

        <Card className="border-0 shadow-card animate-fade-in">
          {currentStep !== 1 && currentStep !== 2 && currentStep !== 3 && currentStep !== 4 && currentStep !== 5 && currentStep !== 6 && (
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-xl">{steps.find(s => s.n === currentStep)?.title}</CardTitle>
              <CardDescription>Step {currentVisibleStepIndex + 1} of {visibleSteps.length}</CardDescription>
            </CardHeader>
          )}
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* ══════ STEP 1 – Personal Info ══════ */}
              {currentStep === 1 && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex flex-row justify-between items-center gap-4 pb-6 pt-2 border-b border-slate-100/80">
                    <div className="space-y-1">
                      <h2 className="text-xl sm:text-2xl font-bold font-sans text-[#0F172A] tracking-tight flex items-center gap-2">
                        <span>Personal Info</span>
                        <div className="w-[18px] h-[18px] rounded-full bg-pink-100 flex items-center justify-center shrink-0">
                          <User className="w-2.5 h-2.5 text-[#EC4899]" strokeWidth={2.5} />
                        </div>
                      </h2>
                      <p className="text-slate-500 text-xs sm:text-sm font-medium">Let's start with your basic information</p>
                    </div>
                    <div className="bg-pink-50/80 border border-pink-200/60 text-pink-600 px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold tracking-normal shrink-0 inline-flex items-center justify-center">
                      Step 1 of 6
                    </div>
                  </div>
                                    <div className="flex flex-row w-full gap-[9px] pt-[94px] md:pt-[98px] mb-4">
                    {/* Full Name */}
                    <div className="w-[64%] md:w-[80%] space-y-1.5">
                      <Label className="flex items-center gap-2 text-[#334155] font-semibold text-xs sm:text-sm">
                        <User className="w-4 h-4 text-primary shrink-0" />
                        Full Name
                      </Label>
                      <Input 
                        value={formData.fullName} 
                        onChange={e => setFormData({ ...formData, fullName: e.target.value })} 
                        placeholder="RJ" 
                        className="rounded-xl border border-[#E2E8F0] px-3.5 text-[#1E293B] font-medium h-11 text-xs sm:text-sm bg-white focus:ring-2 focus:ring-primary/20 focus:border-slate-300 shadow-none" 
                      />
                    </div>

                    {/* Photo Upload Card */}
                    <div className="w-[29%] md:w-[20%] flex flex-col items-center justify-center shrink-0 -mt-[82px] md:-mt-[86px] ml-auto md:ml-0">
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleFileChange("profilePhoto")} 
                        className="hidden" 
                        id="file-profilePhoto" 
                      />
                      <label htmlFor="file-profilePhoto" className="cursor-pointer group flex flex-col items-center">
                        <div className="relative w-[109px] h-[109px] rounded-full bg-pink-50 hover:bg-pink-100/60 border-2 border-dotted border-pink-300 flex items-center justify-center transition-all shadow-inner overflow-hidden">
                          {filePreviews.profilePhoto ? (
                            <img 
                              src={filePreviews.profilePhoto} 
                              alt="Profile Preview" 
                              className="w-full h-full object-cover animate-fade-in" 
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <svg className="w-7 h-7 text-[#475569] group-hover:scale-105 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                              <circle cx="12" cy="13" r="4" />
                            </svg>
                          )}
                        </div>
                        <span className="text-xs sm:text-sm font-semibold text-[#1E293B] mt-2 group-hover:text-primary transition-colors text-center">Upload Photo</span>
                        <span className="text-[10px] text-slate-400 font-medium tracking-tight text-center">JPG, PNG (Max 2MB)</span>
                      </label>
                    </div>
                  </div>

                    {/* Email */}
                    <div className="space-y-1.5">
                      <Label className="flex items-center gap-2 text-[#334155] font-semibold text-xs sm:text-sm">
                        <svg className="w-4 h-4 text-primary shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                          <polyline points="22,6 12,13 2,6" />
                        </svg>
                        Email Address
                      </Label>
                      <div className="relative">
                        <Input 
                          type="email" 
                          value={formData.email} 
                          disabled 
                          className="w-full rounded-xl bg-white border border-[#E2E8F0] pr-28 text-[#1E293B] font-medium h-11 text-xs sm:text-sm shadow-none" 
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full select-none">
                          <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-500 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Verified
                        </div>
                      </div>
                    </div>

                    {/* DOB & Gender Grid */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* Date of Birth */}
                      <div className="space-y-1.5 relative md:z-[20]">
                        <Label className="flex items-center gap-2 text-[#334155] font-semibold text-xs sm:text-sm">
                          <Calendar className="w-4 h-4 text-primary shrink-0" />
                          Date of Birth
                        </Label>
                        <button
                          type="button"
                          onClick={openDobCalendar}
                          className="w-full text-left flex items-center justify-between rounded-xl border border-[#E2E8F0] px-3.5 py-2 text-xs sm:text-sm bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-[#1E293B] font-medium h-11 shadow-none"
                        >
                          <span className={formData.dob ? "text-[#1E293B] font-medium" : "text-slate-400"}>
                            {formatDisplayDate(formData.dob)}
                          </span>
                          <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                        </button>

                        {showDobCalendar && (
                          <>
                            <div 
                              className="fixed inset-0 bg-black/20 backdrop-blur-xs z-[100] md:fixed md:inset-0 md:bg-transparent md:z-[10] md:backdrop-blur-none"
                              onClick={() => setShowDobCalendar(false)}
                            />
                            <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 md:absolute md:top-full md:left-0 md:transform-none z-[101] md:z-[30] mt-2 p-4 bg-card border border-border/85 rounded-2xl shadow-xl w-[300px] animate-in fade-in zoom-in-95 duration-100">
                              <div className="flex items-center justify-between mb-3 gap-1.5 font-sans">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (workingMonth === 0) {
                                      setWorkingMonth(11);
                                      setWorkingYear(prev => Math.max(1940, prev - 1));
                                    } else {
                                      setWorkingMonth(prev => prev - 1);
                                    }
                                  }}
                                  className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
                                >
                                  <ChevronLeft className="w-4 h-4" />
                                </button>

                                <div className="flex items-center gap-1 flex-1 justify-center">
                                  <select
                                    value={workingMonth}
                                    onChange={(e) => {
                                      const m = parseInt(e.target.value, 10);
                                      const now = new Date();
                                      if (workingYear === now.getFullYear() && m > now.getMonth()) {
                                        return;
                                      }
                                      setWorkingMonth(m);
                                    }}
                                    className="text-xs font-semibold bg-muted hover:bg-muted/80 text-foreground rounded-lg px-2 py-1 outline-none border-none cursor-pointer duration-100"
                                  >
                                    {[
                                      "January", "February", "March", "April", "May", "June",
                                      "July", "August", "September", "October", "November", "December"
                                    ].map((m, i) => {
                                      const now = new Date();
                                      const disabled = workingYear === now.getFullYear() && i > now.getMonth();
                                      return (
                                        <option key={m} value={i} disabled={disabled}>
                                          {m}
                                        </option>
                                      );
                                    })}
                                  </select>

                                  <select
                                    value={workingYear}
                                    onChange={(e) => {
                                      const y = parseInt(e.target.value, 10);
                                      const now = new Date();
                                      setWorkingYear(y);
                                      if (y === now.getFullYear() && workingMonth > now.getMonth()) {
                                        setWorkingMonth(now.getMonth());
                                      }
                                    }}
                                    className="text-xs font-semibold bg-muted hover:bg-muted/80 text-foreground rounded-lg px-2 py-1 outline-none border-none cursor-pointer duration-100"
                                  >
                                    {Array.from({ length: new Date().getFullYear() - 1940 + 1 }, (_, i) => new Date().getFullYear() - i).map(y => (
                                      <option key={y} value={y}>
                                        {y}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => {
                                    const now = new Date();
                                    if (workingYear === now.getFullYear() && workingMonth === now.getMonth()) {
                                      return;
                                    }
                                    if (workingMonth === 11) {
                                      setWorkingMonth(0);
                                      setWorkingYear(prev => Math.min(now.getFullYear(), prev + 1));
                                    } else {
                                      setWorkingMonth(prev => prev + 1);
                                    }
                                  }}
                                  disabled={workingYear === today.getFullYear() && workingMonth === today.getMonth()}
                                  className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                  <ChevronRight className="w-4 h-4" />
                                </button>
                              </div>

                              <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-muted-foreground mb-1.5 uppercase tracking-wider font-mono">
                                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => (
                                  <div key={d} className="py-0.5">{d}</div>
                                ))}
                              </div>

                              <div className="grid grid-cols-7 gap-1">
                                {(() => {
                                  const daysInMonth = new Date(workingYear, workingMonth + 1, 0).getDate();
                                  const firstDayIndex = new Date(workingYear, workingMonth, 1).getDay();
                                  const blanks = Array(firstDayIndex).fill(null);
                                  const dayNumbers = Array.from({ length: daysInMonth }, (_, i) => i + 1);
                                  const allCells = [...blanks, ...dayNumbers];

                                  return allCells.map((cell, idx) => {
                                    if (cell === null) {
                                      return <div key={`blank-${idx}`} className="h-8 w-8" />;
                                    }

                                    const isDayFuture = workingYear === today.getFullYear() && workingMonth === today.getMonth() && cell > today.getDate();
                                    const isOverallFuture = workingYear > today.getFullYear() || (workingYear === today.getFullYear() && workingMonth > today.getMonth());
                                    const disabled = isDayFuture || isOverallFuture;

                                    const pad = (n: number) => String(n).padStart(2, '0');
                                    const cellDateStr = `${workingYear}-${pad(workingMonth + 1)}-${pad(cell)}`;
                                    const isSelected = formData.dob === cellDateStr;
                                    const isToday = today.getFullYear() === workingYear && today.getMonth() === workingMonth && today.getDate() === cell;

                                    return (
                                      <button
                                        key={`day-${cell}`}
                                        type="button"
                                        disabled={disabled}
                                        onClick={() => {
                                          const dobValue = `${workingYear}-${pad(workingMonth + 1)}-${pad(cell)}`;
                                          setFormData(prev => ({ ...prev, dob: dobValue }));
                                          setShowDobCalendar(false);
                                        }}
                                        className={`h-8 w-8 text-xs rounded-full flex items-center justify-center transition-all ${
                                          isSelected
                                            ? "bg-primary text-primary-foreground font-semibold shadow"
                                            : disabled
                                              ? "text-muted-foreground/30 cursor-not-allowed"
                                              : isToday
                                                ? "border border-primary text-primary font-semibold hover:bg-primary/10"
                                                : "text-foreground hover:bg-muted font-medium font-mono"
                                        }`}
                                      >
                                        {cell}
                                      </button>
                                    );
                                  });
                                })()}
                              </div>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Gender */}
                      <div className="space-y-1.5">
                        <Label className="flex items-center gap-2 text-[#334155] font-semibold text-xs sm:text-sm">
                          <svg className="w-4 h-4 text-primary shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="9" cy="15" r="4" stroke="currentColor" strokeWidth="2"/>
                            <line x1="9" y1="19" x2="9" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            <line x1="7" y1="21" x2="11" y2="21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                            <circle cx="15" cy="9" r="4" stroke="currentColor" strokeWidth="2"/>
                            <path d="M19 5H23V9M19 9L23 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          Gender
                        </Label>
                        <Select value={formData.gender} onValueChange={v => setFormData({ ...formData, gender: v })}>
                          <SelectTrigger className="rounded-xl h-11 text-xs sm:text-sm shadow-none font-medium text-[#1E293B] border-[#E2E8F0]">
                            <SelectValue placeholder={<span className="text-slate-400">Gender</span>} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Phone & Language Grid */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* Phone Number */}
                      <div className="space-y-1.5">
                        <Label className="flex items-center gap-2 text-[#334155] font-semibold text-xs sm:text-sm">
                        <svg className="w-4 h-4 text-primary shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                          </svg>
                          <span className="truncate">Phone Number</span>
                        </Label>
                        <div className="flex items-center rounded-xl border border-[#E2E8F0] overflow-hidden focus-within:ring-2 focus-within:ring-primary/20 bg-white h-11">
                          <div className="bg-[#F8FAFC] border-r border-[#E2E8F0] text-[#475569] font-medium text-[11px] sm:text-sm px-2 sm:px-4 h-full flex items-center justify-center select-none shrink-0 min-w-[44px] sm:min-w-[56px]">
                            +91
                          </div>
                          <input
                            type="tel"
                            value={getDisplayPhone(formData.phone)}
                            onChange={e => handlePhoneChange(e.target.value)}
                            placeholder="98765 43210"
                            className="w-full px-3.5 text-[#1E293B] font-medium text-xs sm:text-sm bg-transparent border-none outline-none focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Language */}
                      <div className="space-y-1.5">
                        <Label className="flex items-center gap-2 text-[#334155] font-semibold text-xs sm:text-sm">
                          <svg className="w-4 h-4 text-primary shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="2" y1="12" x2="22" y2="12" />
                            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                          </svg>
                          Language
                        </Label>
                        <Select value={formData.preferredLanguage} onValueChange={v => setFormData({ ...formData, preferredLanguage: v })}>
                          <SelectTrigger className="rounded-xl h-11 text-xs sm:text-sm shadow-none font-medium text-[#1E293B] border-[#E2E8F0]">
                            <SelectValue placeholder={<span className="text-slate-400">Language</span>} />
                          </SelectTrigger>
                          <SelectContent>{languages.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Address Section Title with partition line */}
                    <div className="space-y-4 pt-2">
                    {/* Full Address */}
                    <div className="space-y-1.5">
                      <Label className="flex items-center gap-2 text-[#334155] font-semibold text-xs sm:text-sm">
                        <svg className="w-4 h-4 text-primary shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                        Full Address
                      </Label>
                      <Input 
                        value={formData.address} 
                        onChange={e => setFormData({ ...formData, address: e.target.value })} 
                        placeholder="123, Green Park, Near City Hospital, Andheri West" 
                        className="rounded-xl border border-[#E2E8F0] px-3.5 text-[#1E293B] font-medium h-11 text-xs sm:text-sm bg-white focus:ring-2 focus:ring-primary/20 focus:border-slate-300 shadow-none" 
                      />
                    </div>

                        {/* State & City Grid */}
                        <div className="grid grid-cols-2 gap-4">
                          {/* State */}
                          <div className="space-y-1.5">
                            <Label className="flex items-center gap-2 text-[#334155] font-semibold text-xs sm:text-sm">
                              State
                            </Label>
                            <Select 
                              value={formData.state} 
                              onValueChange={v => setFormData({ ...formData, state: v, city: "" })}
                            >
                              <SelectTrigger className="rounded-xl h-11 text-xs sm:text-sm shadow-none font-medium text-[#1E293B] border-[#E2E8F0]">
                                <SelectValue placeholder={<span className="text-slate-400">Select State</span>} />
                              </SelectTrigger>
                              <SelectContent className="max-h-[300px]">
                                {["Delhi", "Haryana", "Madhya Pradesh", "Punjab"].map(s => (
                                  <SelectItem key={s} value={s}>{s}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* City */}
                          <div className="space-y-1.5">
                            <Label className="flex items-center gap-2 text-[#334155] font-semibold text-xs sm:text-sm">
                              City
                            </Label>
                            <Select 
                              value={formData.city} 
                              onValueChange={v => setFormData({ ...formData, city: v })}
                              disabled={!formData.state}
                            >
                              <SelectTrigger className="rounded-xl h-11 text-xs sm:text-sm shadow-none font-medium text-[#1E293B] border-[#E2E8F0] disabled:opacity-50">
                                <SelectValue placeholder={<span className="text-slate-400">{formData.state ? "Select City" : "Select State first"}</span>} />
                              </SelectTrigger>
                              <SelectContent className="max-h-[300px]">
                                {formData.state && (INDIA_STATES_AND_CITIES[formData.state] || []).map(c => (
                                  <SelectItem key={c} value={c}>{c}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                  <Button type="button" className="w-full rounded-2xl bg-gradient-primary" onClick={() => setCurrentStep(2)} disabled={!canProceed(1)}>Continue</Button>
                </div>
              )}

              {/* ══════ STEP 2 – Identity Verification ══════ */}
              {currentStep === 2 && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex flex-row justify-between items-center gap-4 pb-6 pt-2 border-b border-slate-100/80">
                    <div className="space-y-1">
                      <h2 className="text-xl sm:text-2xl font-bold font-sans text-[#0F172A] tracking-tight flex items-center gap-2">
                        <span>Identity Verification</span>
                        <div className="w-[18px] h-[18px] rounded-full bg-pink-100 flex items-center justify-center shrink-0">
                          <ShieldCheck className="w-2.5 h-2.5 text-[#EC4899]" strokeWidth={2.5} />
                        </div>
                      </h2>
                      <p className="text-slate-500 text-xs sm:text-sm font-medium">Upload your identity proof documents</p>
                    </div>
                    <div className="bg-pink-50/80 border border-pink-200/60 text-pink-600 px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold tracking-normal shrink-0 inline-flex items-center justify-center">
                      Step 2 of 6
                    </div>
                  </div>

                  <div className="bg-pink-50 border border-pink-100 rounded-2xl p-4 flex gap-3 text-pink-700">
                    <div className="bg-pink-100 rounded-full w-8 h-8 flex items-center justify-center shrink-0">
                      <Shield className="w-4 h-4 text-pink-600" />
                    </div>
                    <p className="text-sm font-medium">Please upload clear scanned copies or photographs of your Aadhaar card (both front and back sides) and a live photo.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <FileUploadBox field="govtIdFile" label="Aadhaar Card (Front) *" icon={Shield} accept="image/png, image/jpeg, image/jpg" />
                    <FileUploadBox field="panCardFile" label="Aadhaar Card (Back) *" icon={Shield} accept="image/png, image/jpeg, image/jpg" />
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2"><Camera className="w-4 h-4 text-primary" />Live Photo *</Label>
                    <div className="border-2 border-dashed border-border rounded-2xl p-4 text-center hover:border-primary/50 transition-colors">
                      <input type="file" accept="image/png, image/jpeg, image/jpg" capture="user" onChange={handleFileChange("passportPhotoFile")} className="hidden" id="file-passportPhotoFile" />
                      <label htmlFor="file-passportPhotoFile" className="cursor-pointer">
                        {filePreviews.passportPhotoFile ? (
                          <div className="space-y-2">
                            <img src={filePreviews.passportPhotoFile} alt="Photo" className="w-24 h-24 object-cover mx-auto rounded-xl" />
                            <div className="flex items-center justify-center gap-2 text-primary">
                              <CheckCircle className="w-4 h-4" /><span className="text-xs">Uploaded ✓</span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-1">
                            <Camera className="w-6 h-6 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">Take / Upload Photo</span>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button type="button" variant="outline" className="flex-1 rounded-2xl" onClick={() => setCurrentStep(1)}>Back</Button>
                    <Button type="button" className="flex-1 rounded-2xl bg-gradient-primary" onClick={() => setCurrentStep(3)} disabled={!canProceed(2)}>Continue</Button>
                  </div>
                </div>
              )}

              {/* ══════ STEP 3 – Professional Qualification ══════ */}
              {currentStep === 3 && (
                <div className="space-y-6 animate-fade-in">
                  {/* Step Header exactly matching Step 1 */}
                  <div className="flex flex-row justify-between items-center gap-4 pb-6 pt-2 border-b border-slate-100/80 mb-2">
                    <div className="space-y-1">
                      <h2 className="text-xl sm:text-2xl font-bold font-sans text-[#0F172A] tracking-tight flex items-center gap-2">
                        <span>Professional Qualification</span>
                        <div className="w-[18px] h-[18px] rounded-full bg-pink-100 flex items-center justify-center shrink-0">
                          <GraduationCap className="w-2.5 h-2.5 text-[#EC4899]" strokeWidth={2.5} />
                        </div>
                      </h2>
                      <p className="text-slate-500 text-xs sm:text-sm font-medium">Verify your professional credentials and educational background</p>
                    </div>
                    <div className="bg-pink-50/80 border border-pink-200/60 text-pink-600 px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold tracking-normal shrink-0 inline-flex items-center justify-center">
                      Step 3 of 6
                    </div>
                  </div>

                  {/* Elegant Info Banner like Step 2 */}
                  <div className="bg-pink-50 border border-pink-100 rounded-2xl p-4 flex gap-3 text-pink-700">
                    <div className="bg-pink-100 rounded-full w-8 h-8 flex items-center justify-center shrink-0">
                      <GraduationCap className="w-4 h-4 text-pink-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#1E293B]">Credentials & Qualifications</p>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                        Please provide your highest qualification, council registration details, and veterinary certificates. Adding additional degrees helps establish credibility with pet parents.
                      </p>
                    </div>
                  </div>

                  {/* Ordering as requested: Highest Qualification & Vet License Number on the same line */}
                  <div className="grid grid-cols-2 gap-3 sm:gap-4 items-end">
                    <div className="space-y-1.5">
                      <Label className="flex items-center gap-2 text-[#334155] font-semibold text-xs sm:text-sm">
                        <GraduationCap className="w-4 h-4 text-primary shrink-0" />
                        Highest Qualification *
                      </Label>
                      <Select value={formData.qualification} onValueChange={v => setFormData({ ...formData, qualification: v })}>
                        <SelectTrigger className="rounded-xl h-11 text-xs sm:text-sm shadow-none font-medium text-[#1E293B] border-[#E2E8F0] bg-white focus:ring-2 focus:ring-primary/20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {qualifications.map(q => <SelectItem key={q} value={q}>{q}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="flex items-center gap-2 text-[#334155] font-semibold text-xs sm:text-sm">
                        <Briefcase className="w-4 h-4 text-primary shrink-0" />
                        Vet License Number
                      </Label>
                      <Input 
                        value={formData.registrationNumber} 
                        disabled 
                        className="rounded-xl bg-[#F8FAFC] border-[#E2E8F0] h-11 text-xs sm:text-sm font-medium text-slate-400 cursor-not-allowed shadow-none" 
                        placeholder="License Number" 
                      />
                    </div>
                  </div>

                  {/* Below it: Veterinary Council Registration Number * */}
                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-2 text-[#334155] font-semibold text-xs sm:text-sm">
                      <Shield className="w-4 h-4 text-primary shrink-0" />
                      Veterinary Council Registration Number *
                    </Label>
                    <Input 
                      value={formData.registrationNumber} 
                      onChange={e => setFormData({ ...formData, registrationNumber: e.target.value })} 
                      placeholder="e.g., VET/MH/2024/1234" 
                      className="rounded-xl border-[#E2E8F0] h-11 text-xs sm:text-sm font-medium text-[#1E293B] bg-white focus:ring-2 focus:ring-primary/20 focus:border-slate-300 shadow-none" 
                    />
                  </div>

                  {/* Below it: Veterinary Degree Certificate dynamically named BVSc/MVSc based on Highest Qualification selected */}
                  <FileUploadBox field="vetDegreeFile" label={`Veterinary Degree Certificate (${formData.qualification}) *`} icon={GraduationCap} />

                  {/* Education details list */}
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between border-b border-dashed border-slate-100 pb-2">
                      <Label className="flex items-center gap-2 text-sm font-bold text-[#1E293B]">
                        <Briefcase className="w-4 h-4 text-primary shrink-0" />
                        Education Details / Clinical History
                      </Label>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        className="rounded-xl text-xs h-9 border-[#8A1550]/20 hover:bg-pink-50/50 text-[#8A1550] hover:text-[#8A1550] font-bold" 
                        onClick={addEduRow}
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" /> Add Education Row
                      </Button>
                    </div>

                    <div className="space-y-4">
                      {formData.educationRows.map((row, idx) => (
                        <div key={idx} className="bg-slate-50/30 border border-slate-200/60 rounded-2xl p-4 sm:p-5 space-y-4 relative transition-all hover:bg-slate-50/60 shadow-xs font-sans">
                          {/* Row Header */}
                          <div className="flex items-center justify-between border-b border-slate-100/60 pb-3">
                            <span className="text-xs font-bold text-[#334155] flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-[#8A1550]/10 text-[#8A1550] flex items-center justify-center text-[10px] font-extrabold">{idx + 1}</span>
                              {idx === 0 ? "Primary Qualification (Auto-Synced)" : "Additional Degree / Qualification"}
                            </span>
                            {idx > 0 ? (
                              <button 
                                type="button" 
                                onClick={() => removeEduRow(idx)} 
                                className="text-slate-400 hover:text-red-500 transition-colors flex items-center gap-1 text-xs font-semibold"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-slate-400 hover:text-red-500" />
                                <span className="hidden sm:inline">Delete Row</span>
                              </button>
                            ) : (
                              <span className="text-[10px] bg-emerald-50 text-emerald-600 border border-emerald-100/60 px-2 py-0.5 rounded-full font-bold">
                                Synced with Top
                              </span>
                            )}
                          </div>

                          {/* Fields inside custom row card */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Qualification input */}
                            <div className="space-y-1.5">
                              <Label className="text-xs font-bold text-slate-500">Qualification</Label>
                              {idx === 0 ? (
                                <Input 
                                  value={row.qualification || formData.qualification} 
                                  disabled 
                                  className="h-11 rounded-xl text-xs sm:text-sm bg-[#F8FAFC] text-slate-400 cursor-not-allowed border-slate-200 shadow-none font-bold select-none" 
                                />
                              ) : (
                                <Input 
                                  value={row.qualification} 
                                  onChange={e => updateEduRow(idx, 'qualification', e.target.value)} 
                                  placeholder="e.g., MVSc, PhD" 
                                  className="h-11 rounded-xl text-xs sm:text-sm bg-white border-[#E2E8F0] shadow-none text-[#1E293B] font-medium focus:ring-2 focus:ring-primary/20 focus:border-slate-300" 
                                />
                              )}
                            </div>

                            {/* Passing Year select */}
                            <div className="space-y-1.5">
                              <Label className="text-xs font-bold text-slate-500">Passing Year *</Label>
                              <Select value={row.year} onValueChange={v => updateEduRow(idx, 'year', v)}>
                                <SelectTrigger className="rounded-xl h-11 text-xs sm:text-sm shadow-none font-medium text-[#1E293B] border-[#E2E8F0] bg-white focus:ring-2 focus:ring-primary/20">
                                  <SelectValue placeholder="Select Year" />
                                </SelectTrigger>
                                <SelectContent>
                                  {Array.from({length: 50}, (_, i) => new Date().getFullYear() - i).map(y => (
                                    <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Institution / University input */}
                            <div className="space-y-1.5">
                              <Label className="text-xs font-bold text-slate-500">Institution / University *</Label>
                              <Input 
                                value={row.institution} 
                                onChange={e => updateEduRow(idx, 'institution', e.target.value)} 
                                placeholder="e.g., Veterinary College, Mumbai" 
                                className="h-11 rounded-xl text-xs sm:text-sm bg-white border-[#E2E8F0] shadow-none text-[#1E293B] font-medium focus:ring-2 focus:ring-primary/20 focus:border-slate-300" 
                              />
                            </div>

                            {/* Certificate File upload component inside Card */}
                            <div className="space-y-1.5">
                              <Label className="text-xs font-bold text-slate-500">Certificate File</Label>
                              {idx === 0 ? (
                                filePreviews.edu_0 ? (
                                  <div className="flex items-center gap-2 h-11 rounded-xl border border-emerald-100 bg-emerald-50/50 px-3 text-[11px] font-bold text-emerald-600">
                                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                                    <span>Synced with degree certificate above</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 h-11 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 text-[11px] font-bold text-slate-400">
                                    <svg className="w-4 h-4 text-slate-300 animate-pulse shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    <span>Upload degree above to link</span>
                                  </div>
                                )
                              ) : (
                                <div>
                                  <input type="file" accept="image/*,.pdf" onChange={handleEduFileChange(idx)} className="hidden" id={`edu-file-${idx}`} />
                                  <label htmlFor={`edu-file-${idx}`} className={`cursor-pointer flex items-center justify-between w-full h-11 rounded-xl border px-3.5 text-xs font-bold transition-all ${filePreviews[`edu_${idx}`] ? 'border-primary/20 text-[#8a1550] bg-[#8a1550]/5' : 'border-[#E2E8F0] border-dashed text-slate-400 bg-white hover:border-primary/40'}`}>
                                    <div className="flex items-center gap-2 overflow-hidden mr-1">
                                      {filePreviews[`edu_${idx}`] ? (
                                        <>
                                          <CheckCircle className="w-4 h-4 text-[#8a1550] shrink-0" />
                                          <span className="truncate">Uploaded ✓</span>
                                        </>
                                      ) : (
                                        <>
                                          <Upload className="w-4 h-4 text-slate-300 shrink-0" />
                                          <span className="truncate">Upload document copy</span>
                                        </>
                                      )}
                                    </div>
                                    <span className="text-[10px] text-slate-400 font-medium shrink-0">PDF/IMG</span>
                                  </label>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Navigation Buttons exactly matching Steps 1, 2, 4, 5, 6 */}
                  <div className="flex gap-3 pt-2">
                    <Button type="button" variant="outline" className="flex-1 rounded-2xl h-11 font-bold text-slate-600 border-slate-200" onClick={() => setCurrentStep(2)}>Back</Button>
                    <Button type="button" className="flex-1 rounded-2xl h-11 bg-gradient-primary font-bold text-white shadow-sm" onClick={() => setCurrentStep(4)} disabled={!canProceed(3)}>Continue</Button>
                  </div>
                </div>
              )}

              {/* ══════ STEP 4 – Professional Practice ══════ */}
              {currentStep === 4 && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex flex-row justify-between items-center gap-4 pb-6 pt-2 border-b border-slate-100/80">
                    <div className="space-y-1">
                      <h2 className="text-xl sm:text-2xl font-bold font-sans text-[#0F172A] tracking-tight flex items-center gap-2">
                        <span>Professional Practice</span>
                        <div className="w-[18px] h-[18px] rounded-full bg-pink-100 flex items-center justify-center shrink-0">
                          <Briefcase className="w-2.5 h-2.5 text-[#EC4899]" strokeWidth={2.5} />
                        </div>
                      </h2>
                      <p className="text-slate-500 text-xs sm:text-sm font-medium">Select your practice type and details</p>
                    </div>
                    <div className="bg-pink-50/80 border border-pink-200/60 text-pink-600 px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold tracking-normal shrink-0 inline-flex items-center justify-center">
                      Step 4 of 6
                    </div>
                  </div>

                  {/* Elegant Info Banner like Step 2/3 */}
                  <div className="bg-pink-50 border border-pink-100 rounded-2xl p-4 flex gap-3 text-pink-700">
                    <div className="bg-pink-100 rounded-full w-8 h-8 flex items-center justify-center shrink-0">
                      <Briefcase className="w-4 h-4 text-pink-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#1E293B]">Practice Details</p>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                        Select all that apply. You can add details for your clinic, hospital or <span className="font-bold">both</span>.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-[#334155] font-semibold text-xs sm:text-sm">
                      <Building2 className="w-4 h-4 text-primary shrink-0" />
                      Where do you practice? <span className="text-slate-400 font-normal text-[11px] sm:text-xs">(Select all that apply)</span>
                    </Label>
                    <div className="grid grid-cols-2 gap-2 sm:gap-4">
                      {['Hospital / Organization', 'Independent Clinic / Practice'].map((type) => (
                        <div 
                          key={type} 
                          className={`border shadow-sm rounded-2xl p-2.5 sm:p-4 cursor-pointer relative flex flex-col sm:flex-row items-center gap-2 sm:gap-3.5 transition-all w-full min-h-[110px] sm:min-h-[76px] ${
                            formData.practiceType.includes(type) 
                              ? 'border-pink-500 bg-pink-50/40 ring-1 ring-pink-500' 
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`} 
                          onClick={() => {
                            setFormData(prev => {
                              const newPracticeType = prev.practiceType.includes(type)
                                ? prev.practiceType.filter(t => t !== type)
                                : [...prev.practiceType, type];
                              return {
                                ...prev,
                                practiceType: newPracticeType,
                                isIndependentPractice: newPracticeType.includes('Independent Clinic / Practice')
                              };
                            });
                          }}
                        >
                          <div className={`shrink-0 bg-pink-100 rounded-xl sm:rounded-2xl w-8 h-8 sm:w-12 sm:h-12 flex items-center justify-center`}>
                            {type.includes('Independent') ? <Building2 className="w-4 h-4 sm:w-6 sm:h-6 text-pink-600" /> : <Stethoscope className="w-4 h-4 sm:w-6 sm:h-6 text-pink-600" />}
                          </div>
                          
                          <div className="text-center sm:text-left flex-1 min-w-0 sm:pr-8">
                            <h3 className="font-bold text-[#0F172A] text-[10px] xs:text-xs sm:text-sm leading-tight">{type}</h3>
                            <p className="text-[9px] sm:text-xs text-slate-500 mt-0.5 leading-normal">
                              {type.includes('Independent') 
                                ? 'Private clinic' 
                                : 'Hospital/work'}
                            </p>
                          </div>

                          <div className={`absolute top-2 right-2 sm:top-1/2 sm:-translate-y-1/2 sm:right-4 w-4 h-4 sm:w-5 sm:h-5 rounded-full border flex items-center justify-center transition-all ${
                            formData.practiceType.includes(type) ? 'bg-pink-500 border-pink-500' : 'border-slate-300'
                          }`}>
                            {formData.practiceType.includes(type) && <CheckCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Expanded Sections */}
                  {formData.practiceType.includes('Independent Clinic / Practice') && (
                    <div className="bg-white border border-[#F1F5F9] p-5 sm:p-6 rounded-3xl shadow-sm/50 space-y-4 animate-fade-in">
                      <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-[30px] h-[30px] rounded-full border border-pink-200 bg-pink-50 flex items-center justify-center shrink-0">
                            <Building2 className="w-4 h-4 text-[#EC4899]" strokeWidth={2.5} />
                          </div>
                          <span className="text-[#6366F1] font-bold text-base sm:text-lg font-sans">Independent Clinic Details</span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                        {/* Clinic / Practice Name */}
                        <div className="space-y-1.5">
                          <Label className="flex items-center gap-2 text-[#334155] font-semibold text-xs sm:text-sm">
                            <Building2 className="w-4 h-4 text-primary shrink-0" />
                            Clinic / Practice Name *
                          </Label>
                          <Input 
                            value={formData.clinicName} 
                            onChange={e => setFormData({ ...formData, clinicName: e.target.value })} 
                            placeholder="Enter clinic name" 
                            className="rounded-xl border border-[#E2E8F0] px-3.5 text-[#1E293B] font-medium h-11 text-xs sm:text-sm bg-white focus:ring-2 focus:ring-primary/20 focus:border-slate-300 shadow-none" 
                          />
                        </div>

                        {/* Clinic Address */}
                        <div className="space-y-1.5">
                          <Label className="flex items-center gap-2 text-[#334155] font-semibold text-xs sm:text-sm">
                            <MapPin className="w-4 h-4 text-primary shrink-0" />
                            Clinic Address *
                          </Label>
                          <Input 
                            value={formData.clinicAddress} 
                            onChange={e => setFormData({ ...formData, clinicAddress: e.target.value })} 
                            placeholder="Enter complete clinic address" 
                            className="rounded-xl border border-[#E2E8F0] px-3.5 text-[#1E293B] font-medium h-11 text-xs sm:text-sm bg-white focus:ring-2 focus:ring-primary/20 focus:border-slate-300 shadow-none" 
                          />
                        </div>

                        {/* State */}
                        <div className="space-y-1.5">
                          <Label className="flex items-center gap-2 text-[#334155] font-semibold text-xs sm:text-sm">
                            <MapPin className="w-4 h-4 text-primary shrink-0" />
                            State *
                          </Label>
                          <Select 
                            value={formData.state} 
                            onValueChange={v => setFormData({ ...formData, state: v, city: "" })}
                          >
                            <SelectTrigger className="rounded-xl h-11 text-xs sm:text-sm shadow-none font-medium text-[#1E293B] border-[#E2E8F0] bg-white focus:ring-2 focus:ring-primary/20">
                              <SelectValue placeholder={<span className="text-slate-400">Select State</span>} />
                            </SelectTrigger>
                            <SelectContent className="max-h-[300px]">
                              {["Delhi", "Haryana", "Madhya Pradesh", "Punjab"].map(s => (
                                <SelectItem key={s} value={s}>{s}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* City */}
                        <div className="space-y-1.5">
                          <Label className="flex items-center gap-2 text-[#334155] font-semibold text-xs sm:text-sm">
                            <MapPin className="w-4 h-4 text-primary shrink-0" />
                            City *
                          </Label>
                          <Select 
                            value={formData.city} 
                            onValueChange={v => setFormData({ ...formData, city: v })}
                            disabled={!formData.state}
                          >
                            <SelectTrigger className="rounded-xl h-11 text-xs sm:text-sm shadow-none font-medium text-[#1E293B] border-[#E2E8F0] disabled:opacity-50 bg-white focus:ring-2 focus:ring-primary/20">
                              <SelectValue placeholder={<span className="text-slate-400">{formData.state ? "Select City" : "Select State first"}</span>} />
                            </SelectTrigger>
                            <SelectContent className="max-h-[300px]">
                              {formData.state && (INDIA_STATES_AND_CITIES[formData.state as keyof typeof INDIA_STATES_AND_CITIES] || []).map(c => (
                                <SelectItem key={c} value={c}>{c}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Pincode */}
                        <div className="space-y-1.5">
                          <Label className="flex items-center gap-2 text-[#334155] font-semibold text-xs sm:text-sm">
                            <MapPin className="w-4 h-4 text-primary shrink-0" />
                            Pincode *
                          </Label>
                          <Input 
                            value={formData.clinicPincode} 
                            onChange={e => setFormData({ ...formData, clinicPincode: e.target.value })} 
                            placeholder="Enter pincode" 
                            className="rounded-xl border border-[#E2E8F0] px-3.5 text-[#1E293B] font-medium h-11 text-xs sm:text-sm bg-white focus:ring-2 focus:ring-primary/20 focus:border-slate-300 shadow-none" 
                          />
                        </div>

                        {/* GST Number (Optional) */}
                        <div className="space-y-1.5">
                          <Label className="flex items-center gap-2 text-[#334155] font-semibold text-xs sm:text-sm">
                            <FileText className="w-4 h-4 text-primary shrink-0" />
                            GST Number (Optional)
                          </Label>
                          <Input 
                            placeholder="Enter GST number (if applicable)" 
                            className="rounded-xl border border-[#E2E8F0] px-3.5 text-[#1E293B] font-medium h-11 text-xs sm:text-sm bg-white focus:ring-2 focus:ring-primary/20 focus:border-slate-300 shadow-none" 
                          />
                        </div>
                      </div>
                      
                      {/* File uploads */}
                      <FileUploadBox field="clinicShopLicenseFile" label="Shop & Establishment License (Optional)" icon={FileText} />
                    </div>
                  )}

                  {formData.practiceType.includes('Hospital / Organization') && (
                    <div className="bg-white border border-[#F1F5F9] p-5 sm:p-6 rounded-3xl shadow-sm/50 space-y-4 animate-fade-in">
                      <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-[30px] h-[30px] rounded-full border border-pink-200 bg-pink-50 flex items-center justify-center shrink-0">
                            <Stethoscope className="w-4 h-4 text-[#EC4899]" strokeWidth={2.5} />
                          </div>
                          <span className="text-[#6366F1] font-bold text-base sm:text-lg font-sans">Hospital / Organization Details</span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                        {/* Hospital / Organization Name */}
                        <div className="space-y-1.5">
                          <Label className="flex items-center gap-2 text-[#334155] font-semibold text-xs sm:text-sm">
                            <Building2 className="w-4 h-4 text-primary shrink-0" />
                            Hospital / Organization Name *
                          </Label>
                          <Input 
                            value={formData.hospitalName} 
                            onChange={e => setFormData({ ...formData, hospitalName: e.target.value })} 
                            placeholder="Enter hospital name" 
                            className="rounded-xl border border-[#E2E8F0] px-3.5 text-[#1E293B] font-medium h-11 text-xs sm:text-sm bg-white focus:ring-2 focus:ring-primary/20 focus:border-slate-300 shadow-none" 
                          />
                        </div>

                        {/* Your Role / Designation */}
                        <div className="space-y-1.5">
                          <Label className="flex items-center gap-2 text-[#334155] font-semibold text-xs sm:text-sm">
                            <User className="w-4 h-4 text-primary shrink-0" />
                            Your Role / Designation *
                          </Label>
                          <Input 
                            value={formData.hospitalRole} 
                            onChange={e => setFormData({ ...formData, hospitalRole: e.target.value })} 
                            placeholder="e.g. Veterinarian, Consultant, Surgeon" 
                            className="rounded-xl border border-[#E2E8F0] px-3.5 text-[#1E293B] font-medium h-11 text-xs sm:text-sm bg-white focus:ring-2 focus:ring-primary/20 focus:border-slate-300 shadow-none" 
                          />
                        </div>

                        {/* Hospital Address */}
                        <div className="md:col-span-2 space-y-1.5">
                          <Label className="flex items-center gap-2 text-[#334155] font-semibold text-xs sm:text-sm">
                            <MapPin className="w-4 h-4 text-primary shrink-0" />
                            Hospital Address *
                          </Label>
                          <Input 
                            value={formData.hospitalAddress} 
                            onChange={e => setFormData({ ...formData, hospitalAddress: e.target.value })} 
                            placeholder="Enter hospital address" 
                            className="rounded-xl border border-[#E2E8F0] px-3.5 text-[#1E293B] font-medium h-11 text-xs sm:text-sm bg-white focus:ring-2 focus:ring-primary/20 focus:border-slate-300 shadow-none" 
                          />
                        </div>

                        {/* State */}
                        <div className="space-y-1.5">
                          <Label className="flex items-center gap-2 text-[#334155] font-semibold text-xs sm:text-sm">
                            <MapPin className="w-4 h-4 text-primary shrink-0" />
                            State *
                          </Label>
                          <Select 
                            value={formData.state} 
                            onValueChange={v => setFormData({ ...formData, state: v, city: "" })}
                          >
                            <SelectTrigger className="rounded-xl h-11 text-xs sm:text-sm shadow-none font-medium text-[#1E293B] border-[#E2E8F0] bg-white focus:ring-2 focus:ring-primary/20">
                              <SelectValue placeholder={<span className="text-slate-400">Select State</span>} />
                            </SelectTrigger>
                            <SelectContent className="max-h-[300px]">
                              {["Delhi", "Haryana", "Madhya Pradesh", "Punjab"].map(s => (
                                <SelectItem key={s} value={s}>{s}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* City */}
                        <div className="space-y-1.5">
                          <Label className="flex items-center gap-2 text-[#334155] font-semibold text-xs sm:text-sm">
                            <MapPin className="w-4 h-4 text-primary shrink-0" />
                            City *
                          </Label>
                          <Select 
                            value={formData.city} 
                            onValueChange={v => setFormData({ ...formData, city: v })}
                            disabled={!formData.state}
                          >
                            <SelectTrigger className="rounded-xl h-11 text-xs sm:text-sm shadow-none font-medium text-[#1E293B] border-[#E2E8F0] disabled:opacity-50 bg-white focus:ring-2 focus:ring-primary/20">
                              <SelectValue placeholder={<span className="text-slate-400">{formData.state ? "Select City" : "Select State first"}</span>} />
                            </SelectTrigger>
                            <SelectContent className="max-h-[300px]">
                              {formData.state && (INDIA_STATES_AND_CITIES[formData.state as keyof typeof INDIA_STATES_AND_CITIES] || []).map(c => (
                                <SelectItem key={c} value={c}>{c}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Pincode */}
                        <div className="md:col-span-2 space-y-1.5">
                          <Label className="flex items-center gap-2 text-[#334155] font-semibold text-xs sm:text-sm">
                            <MapPin className="w-4 h-4 text-primary shrink-0" />
                            Pincode *
                          </Label>
                          <Input 
                            value={formData.hospitalPincode} 
                            onChange={e => setFormData({ ...formData, hospitalPincode: e.target.value })} 
                            placeholder="Enter pincode" 
                            className="rounded-xl border border-[#E2E8F0] px-3.5 text-[#1E293B] font-medium h-11 text-xs sm:text-sm bg-white focus:ring-2 focus:ring-primary/20 focus:border-slate-300 shadow-none" 
                          />
                        </div>
                      </div>
                      
                      <FileUploadBox field="hospitalJoiningProofFile" label="Joining Proof / ID (Optional)" icon={FileText} />
                    </div>
                  )}

                  {/* Navigation Buttons exactly matching Steps 1, 2, 3, 5, 6 */}
                  <div className="flex gap-3 pt-2">
                    <Button type="button" variant="outline" className="flex-1 rounded-2xl h-11 font-bold text-slate-600 border-slate-200" onClick={() => setCurrentStep(3)}>Back</Button>
                    <Button type="button" className="flex-1 rounded-2xl h-11 bg-gradient-primary font-bold text-white shadow-sm" onClick={() => setCurrentStep(5)} disabled={!canProceed(4)}>Continue</Button>
                  </div>
                </div>
              )}

              {/* ══════ STEP 5 – Availability & Fees ══════ */}
              {currentStep === 5 && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex flex-row justify-between items-center gap-4 pb-6 pt-2 border-b border-slate-100/80">
                    <div className="space-y-1">
                      <h2 className="text-xl sm:text-2xl font-bold font-sans text-[#0F172A] tracking-tight flex items-center gap-2">
                        <span>Availability & Fees</span>
                        <div className="w-[18px] h-[18px] rounded-full bg-pink-100 flex items-center justify-center shrink-0">
                          <Calendar className="w-2.5 h-2.5 text-[#EC4899]" strokeWidth={2.5} />
                        </div>
                      </h2>
                      <p className="text-slate-500 text-xs sm:text-sm font-medium">Set your availability times and consultation fees</p>
                    </div>
                    <div className="bg-pink-50/80 border border-pink-200/60 text-pink-600 px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold tracking-normal shrink-0 inline-flex items-center justify-center">
                      Step 5 of 6
                    </div>
                  </div>
                  {/* Specializations visual card layout matching screenshot styling */}
                  <div className="space-y-4 bg-white border border-[#F1F5F9] p-5 rounded-3xl shadow-sm/50">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-[30px] h-[30px] rounded-full border border-pink-200 bg-pink-50 flex items-center justify-center shrink-0">
                          <svg className="w-4 h-4 text-[#EC4899]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.907c.961 0 1.36 1.253.588 1.832l-3.97 2.883a1 1 0 00-.364 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.971-2.883a1 1 0 00-1.18 0l-3.97 2.883c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.364-1.118L2.49 10.123c-.773-.58-.372-1.832.589-1.832h4.907a1 1 0 00.95-.69L11.05 2.927z" />
                          </svg>
                        </div>
                        <span className="text-[#6366F1] font-bold text-base sm:text-lg font-sans">Specializations</span>
                      </div>
                      <p className="text-slate-400 text-xs sm:text-sm font-medium ml-1">Select all that apply</p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4 pt-2">
                      {specializationOptions.map(s => {
                        const isSelected = formData.specializations.includes(s);
                        const getSpecIcon = (name: string) => {
                          const iconClass = `w-5 h-5 shrink-0 transition-colors ${
                            isSelected ? "text-[#EC4899]" : "text-slate-400 group-hover:text-slate-500"
                          }`;
                          switch (name.toLowerCase()) {
                            case "dog": return <Dog className={iconClass} strokeWidth={2.2} />;
                            case "cat": return <Cat className={iconClass} strokeWidth={2.2} />;
                            case "bird": return <Bird className={iconClass} strokeWidth={2.2} />;
                            case "hamster": return <HamsterIcon className={iconClass} strokeWidth={2.2} />;
                            default: return <Sparkles className={iconClass} strokeWidth={2.2} />;
                          }
                        };
                        return (
                          <button
                            key={s}
                            type="button"
                            onClick={() => toggleSpec(s)}
                            className={`flex items-center justify-center gap-1.5 sm:gap-2.5 rounded-2xl py-2.5 px-3 border text-xs sm:text-sm font-bold transition-all relative group select-none whitespace-nowrap min-w-0 ${
                              isSelected 
                                ? "border-[#EC4899] bg-[#FFF5F7] text-[#EC4899] font-extrabold shadow-sm" 
                                : "border-slate-200 bg-white text-[#1E293B] hover:shadow-xs hover:border-slate-350"
                            }`}
                          >
                            {getSpecIcon(s)}
                            <span className="truncate">{s}</span>
                            {isSelected && (
                              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#EC4899] text-white flex items-center justify-center border-2 border-white shadow-sm shrink-0">
                                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  {/* Two Column Grid for Consultation Types and Years of Practice */}
                  <div className="grid grid-cols-1 md:grid-cols-10 gap-4 sm:gap-6 pt-2">
                    {/* Left Panel: Consultation Types (60% on Desktop) */}
                    <div className="md:col-span-6 space-y-4 bg-white border border-[#F1F5F9] p-4 sm:p-5 rounded-3xl shadow-sm/50 flex flex-col justify-between">
                      <div className="space-y-4">
                        <div className="flex flex-col gap-1 border-b border-slate-50 pb-2">
                          <div className="flex items-center gap-1.5 matches-step">
                            <div className="w-[28px] h-[28px] rounded-full border border-pink-200 bg-pink-50 flex items-center justify-center shrink-0">
                              <Stethoscope className="w-3.5 h-3.5 text-[#EC4899]" strokeWidth={2.5} />
                            </div>
                            <span className="text-[#6366F1] font-bold text-sm sm:text-base font-sans">Consultation Types</span>
                            <span className="text-pink-500 font-sans font-bold">*</span>
                            <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 cursor-help" />
                          </div>
                          <p className="text-slate-450 text-[11px] sm:text-xs font-semibold leading-tight">Select the types of consultations you provide</p>
                        </div>
                        
                        {/* 3 Grid Cards Layout - styled compactly to fit perfectly in 60% width */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                          {[
                            {
                              id: "Clinic visit",
                              label: "In-clinic Visit",
                              desc: "At your clinic",
                              icon: <Briefcase className="w-4 h-4 sm:w-4.5 sm:h-4.5" strokeWidth={2.2} />,
                              color: "indigo"
                            },
                            {
                              id: "Home visits",
                              label: "Home Visit",
                              desc: "At pet's home",
                              icon: <Home className="w-4 h-4 sm:w-4.5 sm:h-4.5" strokeWidth={2.2} />,
                              color: "pink"
                            },
                            {
                              id: "Video consultation",
                              label: "Video Consultation",
                              desc: "Online video",
                              icon: <Video className="w-4 h-4 sm:w-4.5 sm:h-4.5" strokeWidth={2.2} />,
                              color: "indigo"
                            }
                          ].map(opt => {
                            const isSelected = formData.consultationTypes.includes(opt.id);
                            return (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => toggleConsultation(opt.id)}
                                className={`flex flex-col items-center justify-center text-center p-2.5 sm:p-3 rounded-2xl border transition-all relative group select-none cursor-pointer w-full min-w-0 ${
                                  isSelected
                                    ? "border-[#EC4899] bg-[#FFF5F7] text-[#EC4899] font-extrabold shadow-sm ring-1 ring-[#EC4899]"
                                    : "border-slate-100 bg-white text-[#1E293B] hover:shadow-xs hover:border-slate-300"
                                }`}
                              >
                                {/* Rounded Icon Container with soft background */}
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mb-1.5 transition-colors ${
                                  isSelected
                                    ? "bg-pink-100/60 text-[#EC4899]"
                                    : opt.color === "pink"
                                      ? "bg-pink-50/50 text-pink-500 group-hover:bg-pink-50"
                                      : "bg-indigo-50/50 text-indigo-500 group-hover:bg-indigo-50"
                                }`}>
                                  {opt.icon}
                                </div>
                                
                                <span className="font-bold font-sans text-[11px] sm:text-xs text-[#333333] tracking-tight block w-full truncate">
                                  {opt.label}
                                </span>
                                <span className="text-slate-400 text-[9px] sm:text-[10px] block mt-0.5 w-full truncate">
                                  {opt.desc}
                                </span>

                                {/* Absolute check at top-right if selected */}
                                {isSelected && (
                                  <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#EC4899] text-white flex items-center justify-center shadow-xs shrink-0">
                                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Right Panel: Years of Practice (40% on Desktop) */}
                    <div className="md:col-span-4 space-y-4 bg-white border border-[#F1F5F9] p-4 sm:p-5 rounded-3xl shadow-sm/50 flex flex-col justify-between">
                      <div className="space-y-4">
                        <div className="flex flex-col gap-1 border-b border-slate-50 pb-2">
                          <div className="flex items-center gap-1.5">
                            <div className="w-[28px] h-[28px] rounded-full border border-pink-200 bg-pink-50 flex items-center justify-center shrink-0">
                              <GraduationCap className="w-3.5 h-3.5 text-[#EC4899]" strokeWidth={2.5} />
                            </div>
                            <span className="text-[#6366F1] font-bold text-sm sm:text-base font-sans">Years of Practice</span>
                            <span className="text-pink-500 font-sans font-bold">*</span>
                            <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 cursor-help" />
                          </div>
                          <p className="text-slate-450 text-[11px] sm:text-xs font-semibold leading-tight">Your practice experience builds patient trust</p>
                        </div>

                        {/* Interactive Plus/Minus Counter Styled exactly like the image - adjusted for beautiful 40% spacing */}
                        <div className="pt-1">
                          <div className="flex items-center justify-center gap-3 py-3 px-3 border border-slate-100 rounded-2xl bg-[#FAFDFD]/30 w-full">
                            <button
                              type="button"
                              onClick={() => {
                                const currentVal = parseInt(formData.yearsOfExperience) || 0;
                                if (currentVal > 0) {
                                  setFormData({ ...formData, yearsOfExperience: (currentVal - 1).toString() });
                                }
                              }}
                              className="w-9 h-9 rounded-full bg-[#FFF5F7] text-[#EC4899] hover:bg-pink-100/80 transition-all flex items-center justify-center font-bold text-lg border border-pink-100/35 select-none active:scale-90 cursor-pointer shadow-xs shrink-0"
                            >
                              <span className="leading-none select-none">&#8722;</span>
                            </button>
                            
                            <div className="min-w-[40px] text-center">
                              <span className="text-xl sm:text-2xl font-extrabold text-[#1E293B] tracking-tight font-sans">
                                {formData.yearsOfExperience || 0}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                const currentVal = parseInt(formData.yearsOfExperience) || 0;
                                setFormData({ ...formData, yearsOfExperience: (currentVal + 1).toString() });
                              }}
                              className="w-9 h-9 rounded-full bg-[#FFF5F7] text-[#EC4899] hover:bg-pink-100/80 transition-all flex items-center justify-center font-bold text-lg border border-pink-100/35 select-none active:scale-90 cursor-pointer shadow-xs shrink-0"
                            >
                              <span className="leading-none select-none">&#43;</span>
                            </button>

                            <span className="text-slate-500 font-sans font-bold text-xs sm:text-sm selection:bg-transparent">
                              years
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Trust badge with shield icon */}
                      <div className="flex items-center gap-1.5 py-0.5 select-none text-[11px] sm:text-xs font-semibold text-slate-500 leading-tight">
                        <div className="w-6 h-6 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" strokeWidth={2.5} />
                        </div>
                        <span className="truncate">
                          Your experience builds trust
                        </span>
                      </div>
                    </div>
                  </div>
                   {/* Core Interactive Weekly Availability Planner */}
                  <div className="space-y-6 bg-white border border-[#F1F5F9] p-4 sm:p-6 rounded-3xl shadow-sm">
                    <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-[30px] h-[30px] rounded-full border border-pink-200 bg-pink-50 flex items-center justify-center shrink-0">
                          <Calendar className="w-4 h-4 text-[#EC4899]" strokeWidth={2.5} />
                        </div>
                        <span className="text-[#6366F1] font-bold text-base sm:text-lg font-sans">Availability</span>
                        <span className="text-pink-500 font-sans font-bold">*</span>
                      </div>

                      {/* Same timing for all selected days toggle */}
                      {formData.availableDays.length > 0 && selectedDay && (
                        <div className="flex items-center gap-2 select-none shrink-0 sm:gap-2.5">
                          <span className="text-slate-500 font-sans font-semibold text-[11px] sm:text-xs md:text-sm tracking-tight">
                            Same timing for all selected days
                          </span>
                          <label className="relative inline-flex items-center cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={sameTimingAllDays}
                              onChange={(e) => handleToggleSameTiming(e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-[#CBD5E1] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-[16px] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#EC4899] peer-checked:after:border-[#EC4899]"></div>
                          </label>
                        </div>
                      )}
                    </div>

                    {/* Highly-polished Available Days Toggle Selection */}
                    <div className="space-y-3 bg-[#FAFDFD]/40 p-4 border border-[#FAF9FF] rounded-2xl">
                      <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 sm:gap-2.5">
                        {days.map(d => {
                          const dayData = weeklyAvailability[d];
                          const isEnabled = dayData && (dayData.morning.enabled || dayData.afternoon.enabled || dayData.evening.enabled || dayData.night.enabled);
                          
                          return (
                            <button
                              key={d}
                              type="button"
                              onClick={() => toggleDay(d)}
                              className={`flex items-center gap-1 sm:gap-1.5 px-1.5 py-2.5 sm:px-2.5 sm:py-3 rounded-xl border transition-all text-left relative active:scale-95 select-none min-w-0 w-full justify-center sm:justify-start ${
                                isEnabled
                                  ? "border-pink-300 bg-[#FFF5F7] text-pink-950 shadow-sm"
                                  : "border-slate-100 bg-white text-slate-400 hover:bg-slate-50 hover:border-slate-200"
                              }`}
                              style={{ borderWidth: isEnabled ? '1.5px' : '1px' }}
                            >
                              {/* Left check icon/checkbox inside card */}
                              <div className="shrink-0 flex items-center justify-center">
                                {isEnabled ? (
                                  <CheckSquare className="w-3.5 h-3.5 text-[#EC4899] fill-[#EC4899]/10" />
                                ) : (
                                  <div className="w-3.5 h-3.5 border border-slate-300 rounded bg-slate-50" />
                                )}
                              </div>
                              
                              <span className={`font-extrabold font-sans text-[11px] sm:text-xs xl:text-sm whitespace-nowrap ${isEnabled ? "text-[#333333]" : "text-slate-400"}`}>
                                {d}
                              </span>

                              {/* Signature pink top-right badge if enabled */}
                              {isEnabled && (
                                <div className="bg-[#EC4899] text-white rounded-full p-0.5 w-4 h-4 flex items-center justify-center absolute -top-1.5 -right-1 shadow-sm transform scale-100 transition-transform">
                                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Day selector tabs - dynamically filtered to only reflect the user-selected days */}
                    {formData.availableDays.length > 0 ? (
                      <div className="space-y-4 pt-1 animate-fade-in">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-sans">Select Day to Customize Slots</span>
                        </div>
                        <div className="border border-slate-100 bg-[#FAF9FF]/80 p-1 rounded-2xl flex flex-wrap gap-1.5">
                          {days.filter(d => formData.availableDays.includes(d)).map(d => {
                            const isChosen = selectedDay === d;
                            const isSunday = d === "Sun";
                            
                            return (
                              <button
                                key={d}
                                type="button"
                                onClick={() => setSelectedDay(d)}
                                className={`flex-1 min-w-[70px] py-2.5 rounded-xl font-bold text-xs sm:text-sm text-center transition-all flex flex-col items-center gap-0.5 relative ${
                                  isChosen 
                                    ? "bg-gradient-primary text-white shadow-sm" 
                                    : isSunday
                                      ? "text-rose-500 hover:bg-slate-100"
                                      : "text-slate-500 hover:bg-slate-50"
                                }`}
                              >
                                <span>{d}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-10 px-4 border border-dashed border-slate-200 rounded-3xl bg-slate-50/40">
                        <p className="text-slate-400 font-bold text-sm sm:text-base font-sans">
                          No days selected. Please select your available days from the cards above to configure times.
                        </p>
                      </div>
                    )}

                    {/* Periods lists */}
                    <div className="space-y-4 pt-2">
                      {(["morning", "afternoon", "evening", "night"] as const).map(periodKey => {
                        const periodInfo = {
                          morning: { label: "Morning", hours: "9 AM - 1 PM", bg: "bg-emerald-50/45 border-emerald-100 text-emerald-800", icon: <Sunrise className="w-4 h-4 text-emerald-600" strokeWidth={2.5} /> },
                          afternoon: { label: "Afternoon", hours: "1 PM - 4 PM", bg: "bg-amber-50/45 border-amber-100 text-amber-850", icon: <Sun className="w-4 h-4 text-amber-600" strokeWidth={2.5} /> },
                          evening: { label: "Evening", hours: "4 PM - 8 PM", bg: "bg-indigo-50/45 border-indigo-100 text-indigo-900", icon: <Moon className="w-4 h-4 text-indigo-600" strokeWidth={2.5} /> },
                          night: { label: "Night", hours: "8 PM - 12 AM", bg: "bg-pink-50/45 border-pink-100 text-pink-900", icon: <Moon className="w-4 h-4 text-pink-600" strokeWidth={2.5} /> }
                        }[periodKey];

                        const dayData = weeklyAvailability[selectedDay];
                        const periodAvailability = dayData ? dayData[periodKey] : { enabled: false, slots: [] };
                        const isEnabled = periodAvailability.enabled;

                        return (
                          <div 
                            key={periodKey} 
                            className={`flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-3 border rounded-2xl transition-all ${
                              isEnabled 
                                ? "border-slate-100 bg-[#FAFAFC] shadow-sm/35" 
                                : "border-slate-100 bg-slate-50/40 opacity-70"
                            }`}
                          >
                            {/* Left Period Metadata visual card layout */}
                            <div className={`flex items-center gap-2 py-1.5 px-3 rounded-xl border w-full md:w-[145px] shrink-0 ${periodInfo.bg}`}>
                              <div className="shrink-0">
                                {periodInfo.icon}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="font-bold text-xs sm:text-sm tracking-tight truncate">{periodInfo.label}</span>
                                <span className="text-[9px] sm:text-[11px] font-semibold opacity-75 whitespace-nowrap">{periodInfo.hours}</span>
                              </div>
                            </div>

                            {/* Center Slots list with responsive overflow */}
                            <div className="flex-1 flex flex-wrap items-center gap-2 min-w-0 px-1">
                              {isEnabled && periodAvailability.slots.map((slot, sIdx) => (
                                <div 
                                  key={slot} 
                                  className="flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold text-slate-700 shadow-xs transition hover:border-slate-300"
                                >
                                  <span>{slot}</span>
                                  <button 
                                    type="button" 
                                    onClick={() => handleRemoveSlot(periodKey, sIdx)}
                                    className="text-slate-400 hover:text-[#EC4899] transition-colors p-0.5 rounded-full hover:bg-slate-50 shrink-0"
                                  >
                                    <X className="w-3 h-3 stroke-[2.5]" />
                                  </button>
                                </div>
                              ))}

                              {/* Inline adder state representation */}
                              {isEnabled && addingSlotRow === periodKey ? (
                                <div className="flex items-center gap-1.5 p-1 px-1.5 border border-pink-200 rounded-xl bg-[#FFFDFE] shadow-sm animate-fade-in z-20 shrink-0">
                                  <input 
                                    type="time" 
                                    value={newSlotStart} 
                                    onChange={e => setNewSlotStart(e.target.value)} 
                                    className="px-1 py-0.5 text-xs font-sans font-bold border border-slate-200 rounded-lg bg-white text-slate-700 w-[72px] h-7 focus:ring-1 focus:ring-[#EC4899] focus:outline-none"
                                  />
                                  <span className="text-slate-400 font-bold text-xs">–</span>
                                  <input 
                                    type="time" 
                                    value={newSlotEnd} 
                                    onChange={e => setNewSlotEnd(e.target.value)} 
                                    className="px-1 py-0.5 text-xs font-sans font-bold border border-slate-200 rounded-lg bg-white text-slate-700 w-[72px] h-7 focus:ring-1 focus:ring-[#EC4899] focus:outline-none"
                                  />
                                  <div className="flex gap-1 pl-0.5 shrink-0">
                                    <button 
                                      type="button"
                                      onClick={() => handleSaveSlot(periodKey)} 
                                      className="bg-emerald-500 hover:bg-emerald-600 text-white rounded p-1 transition"
                                    >
                                      <Check className="w-3 h-3 stroke-[3]" />
                                    </button>
                                    <button 
                                      type="button"
                                      onClick={() => setAddingSlotRow(null)} 
                                      className="bg-slate-100 hover:bg-slate-200 text-slate-500 rounded p-1 transition"
                                    >
                                      <X className="w-3 h-3 stroke-[2.5]" />
                                    </button>
                                  </div>
                                </div>
                              ) : isEnabled ? (
                                <button
                                  type="button"
                                  onClick={() => handleOpenAddSlot(periodKey)}
                                  className="flex items-center justify-center gap-1.5 py-1.5 px-3.5 rounded-xl border border-dashed border-pink-200 text-[#EC4899] bg-[#FFFDFE] hover:bg-[#FFF5F7] hover:border-pink-300 font-bold text-xs transition active:scale-[0.98] shrink-0"
                                >
                                  <Plus className="w-3.5 h-3.5 text-pink-500 stroke-[2.5]" />
                                  <span>Add slot</span>
                                </button>
                              ) : (
                                <span className="text-slate-400 font-medium text-xs py-1 italic">Disabled for {selectedDay}</span>
                              )}
                            </div>

                            {/* Right toggle switch matching custom switcher representation */}
                            <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
                              <span className="text-[10px] sm:text-xs font-semibold text-slate-400 hidden sm:inline">
                                {isEnabled ? "Active" : "Inactive"}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleTogglePeriod(periodKey)}
                                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                  isEnabled ? "bg-[#EC4899]" : "bg-slate-200"
                                }`}
                              >
                                <span
                                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                    isEnabled ? "translate-x-5" : "translate-x-0"
                                  }`}
                                />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Local timezone prompt */}
                    <div className="flex items-center justify-center gap-1.5 pt-3 border-t border-slate-100 text-slate-400 text-xs sm:text-sm font-medium">
                      <Clock className="w-4 h-4 shrink-0 text-slate-400 animate-pulse" />
                      <span>Timings are shown to pet parents in your local time zone.</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mt-4">
                    {/* Left Card: Consultation Fees */}
                    <div className="bg-white border border-[#F1F5F9] p-5 sm:p-6 rounded-3xl shadow-sm/50 flex flex-col justify-between space-y-5">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 border-b border-slate-50 pb-2">
                          <span className="text-[#1E293B] font-extrabold text-base sm:text-lg font-sans">Consultation Fees (₹)</span>
                          <Info className="w-4 h-4 text-slate-400 shrink-0 cursor-help" />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* In-clinic Visit Section */}
                          <div className="space-y-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-[38px] h-[38px] rounded-xl bg-purple-50/70 border border-purple-100 flex items-center justify-center shrink-0 shadow-xs">
                                <Briefcase className="w-5 h-5 text-purple-600" strokeWidth={2.2} />
                              </div>
                              <div className="flex flex-col">
                                <span className="font-extrabold text-xs sm:text-sm text-[#1E293B] tracking-tight">In-clinic Visit</span>
                                <span className="text-[10px] sm:text-xs text-slate-400 font-semibold opacity-90">At your clinic</span>
                              </div>
                            </div>
                            <div className="relative flex items-center h-12.5 px-4 rounded-2xl bg-[#F5F3FF]/50 border border-[#E4E0FF] focus-within:border-[#EC4899] transition-all shadow-xs/5">
                              <input 
                                type="number" 
                                value={formData.onlineFee} 
                                onChange={e => setFormData({ ...formData, onlineFee: e.target.value })} 
                                placeholder="500"
                                className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-[#1E293B] font-extrabold text-lg sm:text-xl tracking-tight [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                              <span className="text-slate-400 font-bold text-lg select-none pl-2 pr-1">₹</span>
                            </div>
                          </div>

                          {/* Home Visit Section */}
                          <div className="space-y-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-[38px] h-[38px] rounded-xl bg-pink-50/70 border border-pink-100 flex items-center justify-center shrink-0 shadow-xs">
                                <Home className="w-5 h-5 text-[#EC4899]" strokeWidth={2.2} />
                              </div>
                              <div className="flex flex-col">
                                <span className="font-extrabold text-xs sm:text-sm text-[#1E293B] tracking-tight">Home Visit</span>
                                <span className="text-[10px] sm:text-xs text-slate-400 font-semibold opacity-90">At pet parent's home</span>
                              </div>
                            </div>
                            <div className="relative flex items-center h-12.5 px-4 rounded-2xl bg-[#FFF3F7]/50 border border-[#FFE0ED] focus-within:border-[#EC4899] transition-all shadow-xs/5">
                              <input 
                                type="number" 
                                value={formData.offlineFee} 
                                onChange={e => setFormData({ ...formData, offlineFee: e.target.value })} 
                                placeholder="800"
                                className="w-full bg-transparent border-none focus:outline-none focus:ring-0 text-[#1E293B] font-extrabold text-lg sm:text-xl tracking-tight [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                              <span className="text-slate-400 font-bold text-lg select-none pl-2 pr-1">₹</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Card: Emergency Services */}
                    <div className="bg-white border border-[#F1F5F9] p-5 sm:p-6 rounded-3xl shadow-sm/50 flex flex-col justify-between space-y-4">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[#1E293B] font-extrabold text-base sm:text-lg font-sans">Emergency Services</span>
                            <Info className="w-4 h-4 text-slate-400 shrink-0 cursor-help" />
                          </div>
                        </div>

                        {/* Available Toggle */}
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, emergencyAvailable: !(formData.emergencyAvailable ?? true) })}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              (formData.emergencyAvailable ?? true) ? "bg-[#8A1550]" : "bg-slate-200"
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                (formData.emergencyAvailable ?? true) ? "translate-x-5" : "translate-x-0"
                              }`}
                            />
                          </button>
                          <span className="text-sm font-bold text-slate-700">Available for emergency</span>
                        </div>

                        {/* Grid with 2 items inside */}
                        <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 transition-all duration-300 ${(formData.emergencyAvailable ?? true) ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                          {/* 24x7 Support Container */}
                          <div className="p-3 border border-slate-100 rounded-2xl bg-[#FAFAFC]/65 space-y-3.5 shadow-xs">
                            <div className="flex items-center gap-2">
                              <div className="w-[34px] h-[34px] rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center shrink-0">
                                <Clock className="w-4 h-4 text-purple-600" />
                              </div>
                              <span className="font-extrabold text-xs sm:text-sm text-[#1E293B] tracking-tight">24x7 Support</span>
                            </div>
                            
                            {/* Custom Circular Radio Selection */}
                            <div className="flex items-center gap-4 pl-1">
                              <button
                                type="button"
                                onClick={() => setFormData({ ...formData, support24x7: 'yes' })}
                                className="flex items-center gap-2 cursor-pointer select-none group"
                              >
                                <span className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                                  (formData.support24x7 ?? 'yes') === 'yes'
                                    ? "border-purple-600 bg-white"
                                    : "border-slate-300 bg-white group-hover:border-purple-400"
                                }`}>
                                  {(formData.support24x7 ?? 'yes') === 'yes' && (
                                    <span className="w-2 h-2 rounded-full bg-purple-600" />
                                  )}
                                </span>
                                <span className="text-xs font-bold text-slate-700">Yes</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setFormData({ ...formData, support24x7: 'no' })}
                                className="flex items-center gap-2 cursor-pointer select-none group"
                              >
                                <span className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                                  (formData.support24x7 ?? 'yes') === 'no'
                                    ? "border-purple-600 bg-white"
                                    : "border-slate-300 bg-white group-hover:border-purple-400"
                                }`}>
                                  {(formData.support24x7 ?? 'yes') === 'no' && (
                                    <span className="w-2 h-2 rounded-full bg-purple-600" />
                                  )}
                                </span>
                                <span className="text-xs font-bold text-slate-700">No</span>
                              </button>
                            </div>
                          </div>

                          {/* Weekend Availability Container */}
                          <div className="p-3 border border-slate-100 rounded-2xl bg-[#FAFAFC]/65 space-y-3.5 shadow-xs">
                            <div className="flex items-center gap-2">
                              <div className="w-[34px] h-[34px] rounded-xl bg-pink-50 border border-pink-100 flex items-center justify-center shrink-0">
                                <Calendar className="w-4 h-4 text-[#EC4899]" />
                              </div>
                              <span className="font-extrabold text-xs sm:text-sm text-[#1E293B] tracking-tight">Weekend Availability</span>
                            </div>
                            
                            {/* Custom Circular Radio Selection */}
                            <div className="flex items-center gap-4 pl-1">
                              <button
                                type="button"
                                onClick={() => setFormData({ ...formData, weekendAvailability: 'yes' })}
                                className="flex items-center gap-2 cursor-pointer select-none group"
                              >
                                <span className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                                  (formData.weekendAvailability ?? 'yes') === 'yes'
                                    ? "border-[#EC4899] bg-white"
                                    : "border-slate-300 bg-white group-hover:border-pink-400"
                                }`}>
                                  {(formData.weekendAvailability ?? 'yes') === 'yes' && (
                                    <span className="w-2 h-2 rounded-full bg-[#EC4899]" />
                                  )}
                                </span>
                                <span className="text-xs font-bold text-slate-700">Yes</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setFormData({ ...formData, weekendAvailability: 'no' })}
                                className="flex items-center gap-2 cursor-pointer select-none group"
                              >
                                <span className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                                  (formData.weekendAvailability ?? 'yes') === 'no'
                                    ? "border-[#EC4899] bg-white"
                                    : "border-slate-300 bg-white group-hover:border-pink-400"
                                }`}>
                                  {(formData.weekendAvailability ?? 'yes') === 'no' && (
                                    <span className="w-2 h-2 rounded-full bg-[#EC4899]" />
                                  )}
                                </span>
                                <span className="text-xs font-bold text-slate-700">No</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button type="button" variant="outline" className="flex-1 rounded-2xl" onClick={() => setCurrentStep(4)}>Back</Button>
                    <Button type="button" className="flex-1 rounded-2xl bg-gradient-primary" onClick={() => setCurrentStep(6)} disabled={!canProceed(5)}>Continue</Button>
                  </div>
                </div>
              )}

              {/* ══════ STEP 6 – Platform Compliance & Submit ══════ */}
              {currentStep === 6 && (
                <div className="space-y-6 animate-fade-in">
                  {/* Step Header exactly matching Step 1 */}
                  <div className="flex flex-row justify-between items-center gap-4 pb-6 pt-2 border-b border-slate-100/80">
                    <div className="space-y-1">
                      <h2 className="text-xl sm:text-2xl font-bold font-sans text-[#0F172A] tracking-tight flex items-center gap-2">
                        <span>Review Profile</span>
                        <div className="w-[18px] h-[18px] rounded-full bg-pink-100 flex items-center justify-center shrink-0">
                          <ScrollText className="w-2.5 h-2.5 text-[#EC4899]" strokeWidth={2.5} />
                        </div>
                      </h2>
                      <p className="text-slate-500 text-xs sm:text-sm font-medium">Verify your details and accept agreements to submit</p>
                    </div>
                    <div className="bg-pink-50/80 border border-pink-200/60 text-pink-600 px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold tracking-normal shrink-0 inline-flex items-center justify-center">
                      Step 6 of 6
                    </div>
                  </div>

                  {/* Local review helper */}
                  {(() => {
                    const renderReviewFilePreview = (fieldName: string, label: string) => {
                      const preview = filePreviews[fieldName];
                      const file = (formData as Record<string, unknown>)[fieldName] as File | null;
                      
                      if (!preview && !file) {
                        return (
                          <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center text-xs text-slate-400 font-semibold">
                            No {label} uploaded
                          </div>
                        );
                      }
                      
                      return (
                        <div className="bg-slate-50/80 border border-slate-200/60 rounded-xl p-3 flex items-center justify-between gap-3 shadow-xs font-sans">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            {preview ? (
                              <div className="w-12 h-12 rounded-lg border border-slate-200 overflow-hidden bg-white shrink-0">
                                <img src={preview} alt={label} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              </div>
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-pink-100 flex items-center justify-center shrink-0 border border-pink-200 text-[#EC4899]">
                                <FileText className="w-6 h-6" />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-slate-700 truncate">{label}</p>
                              <p className="text-[10px] text-slate-400 font-medium font-mono truncate">
                                {file ? `${(file.size / 1024).toFixed(0)} KB • ${file.name}` : "Uploaded document"}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    };

                    return (
                      <div className="space-y-4">
                        
                        {/* CARD 1: Personal Information */}
                        <div className="bg-white border border-[#F1F5F9] p-4 sm:p-5 rounded-3xl shadow-xs transition-all">
                          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100/60">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-pink-50/80 border border-pink-100 flex items-center justify-center shrink-0">
                                <User className="w-5 h-5 text-pink-600" />
                              </div>
                              <div>
                                <h3 className="font-extrabold text-sm sm:text-base text-[#1E293B] tracking-tight">Personal Information</h3>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button 
                                type="button" 
                                onClick={() => setCurrentStep(1)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-[#8A1550] transition-all shrink-0"
                              >
                                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                  <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z" />
                                </svg>
                                Edit
                              </button>
                              <button 
                                type="button"
                                onClick={() => toggleSection("personal")}
                                className="w-8 h-8 rounded-lg hover:bg-slate-50 border border-slate-100 text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center"
                              >
                                {expandedSections.personal ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>

                          {/* Collapsed grid */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 text-xs sm:text-sm">
                            <div className="space-y-0.5">
                              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-tight">Name</span>
                              <p className="font-bold text-[#1E293B]">{formData.fullName || "N/A"}</p>
                            </div>
                            <div className="space-y-0.5">
                              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-tight">Phone</span>
                              <p className="font-bold text-[#1E293B]">{formData.phone ? `+91 ${formData.phone}` : "N/A"}</p>
                            </div>
                            <div className="space-y-0.5">
                              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-tight">City</span>
                              <p className="font-bold text-[#1E293B]">{formData.city ? `${formData.city}, ${formData.state}` : "N/A"}</p>
                            </div>
                          </div>

                          {/* Expanded views */}
                          {expandedSections.personal && (
                            <div className="mt-4 pt-4 border-t border-slate-100/50 space-y-4 animate-fade-in text-xs sm:text-sm">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-0.5">
                                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-tight">Email Address</span>
                                  <p className="font-bold text-[#1E293B] break-all">{formData.email || "N/A"}</p>
                                </div>
                                <div className="space-y-0.5">
                                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-tight">Date of Birth</span>
                                  <p className="font-bold text-[#1E293B]">{formData.dob ? formatDisplayDate(formData.dob) : "N/A"}</p>
                                </div>
                                <div className="space-y-0.5">
                                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-tight">Gender</span>
                                  <p className="font-bold text-[#1E293B] capitalize">{formData.gender || "N/A"}</p>
                                </div>
                                <div className="space-y-0.5">
                                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-tight">Address</span>
                                  <p className="font-bold text-[#1E293B] break-words">{formData.address || "N/A"}</p>
                                </div>
                                <div className="space-y-0.5">
                                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-tight">Preferred Language</span>
                                  <p className="font-bold text-[#1E293B] capitalize">{formData.preferredLanguage || "N/A"}</p>
                                </div>
                              </div>
                              {/* Profile photo layout */}
                              <div className="space-y-1.5 pt-2">
                                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-tight block">Profile Photo</span>
                                {renderReviewFilePreview("profilePhoto", "Profile Photograph")}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* CARD 2: Identity Verification */}
                        <div className="bg-white border border-[#F1F5F9] p-4 sm:p-5 rounded-3xl shadow-xs transition-all">
                          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100/60">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-purple-50/80 border border-purple-100 flex items-center justify-center shrink-0">
                                <Shield className="w-5 h-5 text-purple-600" />
                              </div>
                              <div>
                                <h3 className="font-extrabold text-sm sm:text-base text-[#1E293B] tracking-tight">Identity Verification</h3>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button 
                                type="button" 
                                onClick={() => setCurrentStep(2)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-[#8A1550] transition-all shrink-0"
                              >
                                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                  <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z" />
                                </svg>
                                Edit
                              </button>
                              <button 
                                type="button"
                                onClick={() => toggleSection("identity")}
                                className="w-8 h-8 rounded-lg hover:bg-slate-50 border border-slate-100 text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center"
                              >
                                {expandedSections.identity ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>

                          {/* Collapsed grid */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 text-xs sm:text-sm">
                            <div className="space-y-0.5">
                              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-tight">Aadhar Card Verification</span>
                              <p className="font-bold text-emerald-600 flex items-center gap-1.5">
                                <Check className="w-4 h-4" /> Done
                              </p>
                            </div>
                            <div className="space-y-0.5">
                              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-tight">Live Photo</span>
                              <p className={`font-bold ${formData.passportPhotoFile || filePreviews.passportPhotoFile ? "text-emerald-600" : "text-amber-500"}`}>
                                {formData.passportPhotoFile || filePreviews.passportPhotoFile ? "✓ Uploaded" : "Pending Upload"}
                              </p>
                            </div>
                            <div className="space-y-0.5">
                              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-tight">ID Verification Status</span>
                              <p className="font-bold text-emerald-600">Pending Review</p>
                            </div>
                          </div>

                          {/* Expanded views */}
                          {expandedSections.identity && (
                            <div className="mt-4 pt-4 border-t border-slate-100/50 space-y-4 animate-fade-in">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {renderReviewFilePreview("govtIdFile", "Aadhaar Card (Front)")}
                                {renderReviewFilePreview("panCardFile", "Aadhaar Card (Back)")}
                              </div>
                              <div className="space-y-1.5">
                                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-tight block">Live Photo / Passport Photo</span>
                                {renderReviewFilePreview("passportPhotoFile", "Live Photo / Passport Image")}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* CARD 3: Professional Details */}
                        <div className="bg-white border border-[#F1F5F9] p-4 sm:p-5 rounded-3xl shadow-xs transition-all">
                          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100/60">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-violet-50/80 border border-violet-100 flex items-center justify-center shrink-0">
                                <GraduationCap className="w-5 h-5 text-violet-600" />
                              </div>
                              <div>
                                <h3 className="font-extrabold text-sm sm:text-base text-[#1E293B] tracking-tight">Professional Details</h3>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button 
                                type="button" 
                                onClick={() => setCurrentStep(3)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-[#8A1550] transition-all shrink-0"
                              >
                                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                  <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z" />
                                </svg>
                                Edit
                              </button>
                              <button 
                                type="button"
                                onClick={() => toggleSection("professional")}
                                className="w-8 h-8 rounded-lg hover:bg-slate-50 border border-slate-100 text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center"
                              >
                                {expandedSections.professional ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>

                          {/* Collapsed grid */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 text-xs sm:text-sm">
                            <div className="space-y-0.5">
                              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-tight">Qualification</span>
                              <p className="font-bold text-[#1E293B]">{formData.qualification || "N/A"}</p>
                            </div>
                            <div className="space-y-0.5">
                              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-tight">Experience</span>
                              <p className="font-bold text-[#1E293B]">{formData.yearsOfExperience ? `${formData.yearsOfExperience} Years` : "N/A"}</p>
                            </div>
                            <div className="space-y-0.5">
                              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-tight">Registration No.</span>
                              <p className="font-bold text-[#1E293B]">{formData.registrationNumber || "N/A"}</p>
                            </div>
                          </div>

                          {/* Expanded views */}
                          {expandedSections.professional && (
                            <div className="mt-4 pt-4 border-t border-slate-100/50 space-y-4 animate-fade-in text-xs sm:text-sm">
                              <div className="space-y-1.5">
                                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-tight block">Veterinary Degree Certificate</span>
                                {renderReviewFilePreview("vetDegreeFile", `Degree Certificate (${formData.qualification})`)}
                              </div>
                              
                              {formData.educationRows && formData.educationRows.length > 0 && (
                                <div className="space-y-2">
                                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-tight block">Additional Credentials / Medical History</span>
                                  <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/55 space-y-2.5">
                                    {formData.educationRows.map((row, index) => (
                                      <div key={index} className="flex justify-between items-center text-xs border-b border-dashed border-slate-200/50 pb-2 last:border-none last:pb-0">
                                        <div>
                                          <p className="font-bold text-[#1E293B]">{row.degree || "Degree Detail"}</p>
                                          <p className="text-slate-400 font-medium text-[10px]">{row.college || "Veterinary College / University"}</p>
                                        </div>
                                        <span className="bg-slate-200/50 text-[#1E293B] font-bold px-2 py-0.5 rounded-lg text-[10px]">{row.year || "Year"}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* CARD 4: Clinic / Practice Details */}
                        <div className="bg-white border border-[#F1F5F9] p-4 sm:p-5 rounded-3xl shadow-xs transition-all">
                          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100/60">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-blue-50/80 border border-blue-100 flex items-center justify-center shrink-0">
                                <Building2 className="w-5 h-5 text-blue-600" />
                              </div>
                              <div>
                                <h3 className="font-extrabold text-sm sm:text-base text-[#1E293B] tracking-tight">Clinic / Practice Details</h3>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button 
                                type="button" 
                                onClick={() => setCurrentStep(4)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-[#8A1550] transition-all shrink-0"
                              >
                                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                  <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z" />
                                </svg>
                                Edit
                              </button>
                              <button 
                                type="button"
                                onClick={() => toggleSection("practice")}
                                className="w-8 h-8 rounded-lg hover:bg-slate-50 border border-slate-100 text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center"
                              >
                                {expandedSections.practice ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>

                          {/* Collapsed grid */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 text-xs sm:text-sm">
                            <div className="space-y-0.5">
                              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-tight">Practice Type</span>
                              <p className="font-bold text-[#1E293B]">
                                {formData.isIndependentPractice ? "Independent Clinic" : "Hospital / Corporate Practice"}
                              </p>
                            </div>
                            <div className="space-y-0.5">
                              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-tight">Clinic Name</span>
                              <p className="font-bold text-[#1E293B]">
                                {formData.clinicName || formData.hospitalName || "N/A"}
                              </p>
                            </div>
                            <div className="space-y-0.5">
                              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-tight">City</span>
                              <p className="font-bold text-[#1E293B]">{formData.city || "N/A"}</p>
                            </div>
                          </div>

                          {/* Expanded views */}
                          {expandedSections.practice && (
                            <div className="mt-4 pt-4 border-t border-slate-100/50 space-y-4 animate-fade-in text-xs sm:text-sm">
                              {formData.isIndependentPractice ? (
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-0.5">
                                    <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-tight">Clinic Name</span>
                                    <p className="font-bold text-[#1E293B]">{formData.clinicName || "N/A"}</p>
                                  </div>
                                  <div className="space-y-0.5">
                                    <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-tight">Clinic Address</span>
                                    <p className="font-bold text-[#1E293B] tracking-tight">{formData.clinicAddress || "N/A"}</p>
                                  </div>
                                  <div className="space-y-0.5">
                                    <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-tight">Clinic Pincode</span>
                                    <p className="font-bold text-[#1E293B]">{formData.clinicPincode || "N/A"}</p>
                                  </div>
                                </div>
                              ) : (
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-0.5">
                                    <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-tight">Hospital Name</span>
                                    <p className="font-bold text-[#1E293B]">{formData.hospitalName || "N/A"}</p>
                                  </div>
                                  <div className="space-y-0.5">
                                    <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-tight">Role / Designation</span>
                                    <p className="font-bold text-[#1E293B]">{formData.hospitalRole || "N/A"}</p>
                                  </div>
                                  <div className="space-y-0.5 col-span-full">
                                    <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-tight">Hospital Address</span>
                                    <p className="font-bold text-[#1E293B]">{formData.hospitalAddress || "N/A"}</p>
                                  </div>
                                </div>
                              )}

                              {/* Documents in Expand */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                                {formData.isIndependentPractice ? (
                                  <>
                                    {renderReviewFilePreview("clinicRegistrationFile", "Clinic Practice Registration")}
                                    {renderReviewFilePreview("clinicShopLicenseFile", "Shop & Establishment License")}
                                  </>
                                ) : (
                                  renderReviewFilePreview("hospitalJoiningProofFile", "Hospital ID / Joining Proof Document")
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* CARD 5: Availability */}
                        <div className="bg-white border border-[#F1F5F9] p-4 sm:p-5 rounded-3xl shadow-xs transition-all">
                          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100/60">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-orange-50/80 border border-orange-100 flex items-center justify-center shrink-0">
                                <Calendar className="w-5 h-5 text-orange-600" />
                              </div>
                              <div>
                                <h3 className="font-extrabold text-sm sm:text-base text-[#1E293B] tracking-tight">Availability</h3>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button 
                                type="button" 
                                onClick={() => setCurrentStep(5)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-[#8A1550] transition-all shrink-0"
                              >
                                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                  <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z" />
                                </svg>
                                Edit
                              </button>
                              <button 
                                type="button"
                                onClick={() => toggleSection("availability")}
                                className="w-8 h-8 rounded-lg hover:bg-slate-50 border border-slate-100 text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center"
                              >
                                {expandedSections.availability ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>

                          {/* Collapsed grid */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 text-xs sm:text-sm">
                            <div className="space-y-0.5">
                              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-tight">Available Days</span>
                              <p className="font-bold text-[#1E293B] truncate">
                                {formData.availableDays.length > 0 ? formData.availableDays.join(", ") : "None chosen"}
                              </p>
                            </div>
                            <div className="space-y-0.5">
                              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-tight">Time Sessions</span>
                              <p className="font-bold text-[#1E293B]">
                                {[
                                  formData.morningSlots && "09:00 AM - 01:00 PM",
                                  formData.eveningSlots && "04:00 PM - 08:00 PM"
                                ].filter(Boolean).join(" & ") || "No Sessions Specified"}
                              </p>
                            </div>
                            <div className="space-y-0.5">
                              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-tight">Consultation Types</span>
                              <p className="font-bold text-[#1E293B] truncate">
                                {formData.consultationTypes.length > 0 ? formData.consultationTypes.join(", ") : "N/A"}
                              </p>
                            </div>
                          </div>

                          {/* Expanded views */}
                          {expandedSections.availability && (
                            <div className="mt-4 pt-4 border-t border-slate-100/50 space-y-3 animate-fade-in text-xs sm:text-sm">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-0.5">
                                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-tight">Specializations</span>
                                  <p className="font-bold text-[#1E293B]">{formData.specializations.join(", ") || "None selected"}</p>
                                </div>
                                <div className="space-y-0.5">
                                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-tight">Morning Shift (9am-1pm)</span>
                                  <p className="font-bold text-[#1E293B]">{formData.morningSlots ? "Enabled ✓" : "Disabled ✗"}</p>
                                </div>
                                <div className="space-y-0.5">
                                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-tight">Evening Shift (4pm-8pm)</span>
                                  <p className="font-bold text-[#1E293B]">{formData.eveningSlots ? "Enabled ✓" : "Disabled ✗"}</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* CARD 6: Consultation Fees */}
                        <div className="bg-white border border-[#F1F5F9] p-4 sm:p-5 rounded-3xl shadow-xs transition-all">
                          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100/60">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-pink-50/80 border border-pink-100 flex items-center justify-center shrink-0">
                                <Banknote className="w-5 h-5 text-pink-600" />
                              </div>
                              <div>
                                <h3 className="font-extrabold text-sm sm:text-base text-[#1E293B] tracking-tight">Consultation Fees</h3>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button 
                                type="button" 
                                onClick={() => setCurrentStep(5)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-[#8A1550] transition-all shrink-0"
                              >
                                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                  <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z" />
                                </svg>
                                Edit
                              </button>
                              <button 
                                type="button"
                                onClick={() => toggleSection("fees")}
                                className="w-8 h-8 rounded-lg hover:bg-slate-50 border border-slate-100 text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center"
                              >
                                {expandedSections.fees ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>

                          {/* Collapsed grid */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 text-xs sm:text-sm">
                            <div className="space-y-0.5">
                              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-tight">In-clinic Consultation</span>
                              <p className="font-bold text-[#1E293B]">₹{formData.onlineFee || "None"}</p>
                            </div>
                            <div className="space-y-0.5">
                              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-tight">Home Consultation</span>
                              <p className="font-bold text-[#1E293B]">₹{formData.offlineFee || "None"}</p>
                            </div>
                            <div className="space-y-0.5">
                              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-tight">Emergency Visit</span>
                              <p className={`font-bold ${formData.emergencyAvailable ? "text-emerald-600" : "text-slate-400"}`}>
                                {formData.emergencyAvailable ? "Available" : "Not Available"}
                              </p>
                            </div>
                          </div>

                          {/* Expanded views */}
                          {expandedSections.fees && (
                            <div className="mt-4 pt-4 border-t border-slate-100/50 space-y-3 animate-fade-in text-xs sm:text-sm">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-0.5">
                                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-tight">24x7 Support</span>
                                  <p className="font-bold text-[#1E293B] uppercase">{formData.support24x7 || "Yes"}</p>
                                </div>
                                <div className="space-y-0.5">
                                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-tight">Weekend Availability</span>
                                  <p className="font-bold text-[#1E293B] uppercase">{formData.weekendAvailability || "Yes"}</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                      </div>
                    );
                  })()}

                  {/* Gorgeous Agreements & Consent card block */}
                  <div className="space-y-4 pt-4 pb-2">
                    <div>
                      <h3 className="text-base sm:text-lg font-extrabold text-[#1E293B] font-sans">Agreements & Consent</h3>
                      <p className="text-[11px] sm:text-xs text-slate-400 font-semibold">Please read and accept all agreements to continue</p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3 p-4 bg-[#F8F9FC]/80 border border-slate-100 rounded-2xl shadow-xs transition-colors hover:border-[#E4E8F0]">
                        <div className="flex items-start gap-3">
                          <Checkbox 
                            id="vendor-agreement"
                            checked={formData.vendorAgreement} 
                            onCheckedChange={c => setFormData({ ...formData, vendorAgreement: c as boolean })} 
                            className="mt-1 border-slate-300 data-[state=checked]:bg-[#8a1550] data-[state=checked]:border-[#8a1550]" 
                          />
                          <Label htmlFor="vendor-agreement" className="text-xs sm:text-sm cursor-pointer text-[#1E293B] font-bold select-none leading-none pt-0.5">
                            I accept the <span className="text-[#8A1550] underline">Vendor / Service Agreement</span> *
                            <p className="text-[10px] text-slate-400 font-semibold mt-1 font-sans">Read the full service agreement below</p>
                          </Label>
                        </div>
                        <a href="#" className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-[#8A1550] transition-colors shrink-0">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>

                      <div className="flex items-start justify-between gap-3 p-4 bg-[#F8F9FC]/80 border border-slate-100 rounded-2xl shadow-xs transition-colors hover:border-[#E4E8F0]">
                        <div className="flex items-start gap-3">
                          <Checkbox 
                            id="terms-conditions"
                            checked={formData.termsAccepted} 
                            onCheckedChange={c => setFormData({ ...formData, termsAccepted: c as boolean })} 
                            className="mt-1 border-slate-300 data-[state=checked]:bg-[#8a1550] data-[state=checked]:border-[#8a1550]" 
                          />
                          <Label htmlFor="terms-conditions" className="text-xs sm:text-sm cursor-pointer text-[#1E293B] font-bold select-none leading-none pt-0.5">
                            I accept the <span className="text-[#8A1550] underline">Terms & Conditions</span> and confirm all information is accurate *
                            <p className="text-[10px] text-slate-400 font-semibold mt-1 font-sans">Read the terms & conditions of onboarding</p>
                          </Label>
                        </div>
                        <a href="#" className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-[#8A1550] transition-colors shrink-0">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>

                      <div className="flex items-start justify-between gap-3 p-4 bg-[#F8F9FC]/80 border border-slate-100 rounded-2xl shadow-xs transition-colors hover:border-[#E4E8F0]">
                        <div className="flex items-start gap-3">
                          <Checkbox 
                            id="telemedicine-consent"
                            checked={formData.telemedicineConsent} 
                            onCheckedChange={c => setFormData({ ...formData, telemedicineConsent: c as boolean })} 
                            className="mt-1 border-slate-300 data-[state=checked]:bg-[#8a1550] data-[state=checked]:border-[#8a1550]" 
                          />
                          <Label htmlFor="telemedicine-consent" className="text-xs sm:text-sm cursor-pointer text-[#1E293B] font-bold select-none leading-none pt-0.5">
                            I consent to provide <span className="text-[#8A1550] underline">Telemedicine Consultations</span> via this platform
                            <p className="text-[10px] text-slate-400 font-semibold mt-1 font-sans">Learn more about our telemedicine policies</p>
                          </Label>
                        </div>
                        <a href="#" className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-[#8A1550] transition-colors shrink-0">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Submission and back buttons exactly formatted */}
                  <div className="flex gap-3 pt-3">
                    <Button type="button" variant="outline" className="flex-1 rounded-2xl" onClick={() => setCurrentStep(5)}>Back</Button>
                    <Button type="submit" className="flex-1 rounded-2xl bg-gradient-primary" disabled={isLoading || !formData.termsAccepted || !formData.vendorAgreement}>
                      {isLoading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" strokeWidth={2.5} />Submitting...</>) : "Submit for Verification"}
                    </Button>
                  </div>
                </div>
              )}

            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default VetOnboarding;
