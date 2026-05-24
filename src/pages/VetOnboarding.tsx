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
  Loader2, Upload, FileText, CheckCircle, Shield, Stethoscope,
  Calendar, Banknote, User, Building2, ScrollText, Camera,
  CreditCard, GraduationCap, Plus, Trash2, ChevronLeft, ChevronRight, LogOut, MapPin
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

const EMPTY_EDU: EducationRow = { qualification: "", institution: "", year: "", certificateFile: null };

const VetOnboarding = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);

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
    // Step 5 – Bank
    bankAccountName: "", bankName: "", bankAccountNumber: "", bankIfsc: "",
    cancelledChequeFile: null as File | null,
    // Step 6 – Availability
    specializations: [] as string[], consultationTypes: [] as string[],
    availableDays: [] as string[], morningSlots: false, eveningSlots: false,
    onlineFee: "", offlineFee: "", yearsOfExperience: "",
    // Step 7 – Compliance
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

  const specializations = ["Dog", "Cat", "Bird", "Fish", "Exotic", "All"];
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
  const toggleDay = (d: string) => setFormData(prev => ({
    ...prev, availableDays: prev.availableDays.includes(d) ? prev.availableDays.filter(x => x !== d) : [...prev.availableDays, d],
  }));

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
    { n: 5, title: "Bank", icon: Banknote },
    { n: 6, title: "Availability", icon: Calendar },
    { n: 7, title: "Compliance", icon: ScrollText },
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
      case 5: return true;
      case 6: return (
        formData.availableDays.length > 0 && 
        formData.specializations.length > 0 && 
        formData.consultationTypes.length > 0 && 
        formData.yearsOfExperience !== "" && 
        (formData.morningSlots || formData.eveningSlots) && 
        formData.onlineFee !== "" && 
        formData.offlineFee !== "" && 
        (formData.profilePhoto !== null || !!filePreviews.profilePhoto)
      );
      default: return true;
    }
  };

  /* ─── file upload UI helper ─── */
  const FileUploadBox = ({ field, label, accept = "image/*,.pdf", icon: Icon = Upload }: { field: string; label: string; accept?: string; icon?: any }) => {
    const hasExistingFile = (formData as any)[field] === null && filePreviews[field];
    const isFileUploaded = (formData as any)[field] !== null || filePreviews[field];

    return (
      <div className="space-y-2">
        <Label className="flex items-center gap-2"><Icon className="w-4 h-4 text-primary" />{label}</Label>
        <div className="border-2 border-dashed border-border rounded-2xl p-4 text-center hover:border-primary/50 transition-colors">
          <input type="file" accept={accept} onChange={handleFileChange(field)} className="hidden" id={`file-${field}`} />
          <label htmlFor={`file-${field}`} className="cursor-pointer">
            {isFileUploaded ? (
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center justify-center gap-2 text-primary">
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">{hasExistingFile ? "Existing File Kept ✓" : "Uploaded ✓"}</span>
                </div>
                {filePreviews[field] && filePreviews[field].startsWith("http") && (
                   <span className="text-[10px] text-muted-foreground underline">View Current</span>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1">
                <Upload className="w-5 h-5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Upload (max 5MB)</span>
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
        <div className="container mx-auto px-4 py-4">
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

      <main className="container mx-auto px-4 py-6 max-w-2xl">
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
          {currentStep !== 1 && (
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
                        <span>Personal Identity</span>
                        <div className="w-[18px] h-[18px] rounded-full bg-pink-100 flex items-center justify-center shrink-0">
                          <svg className="w-3.5 h-3.5 text-[#EC4899]" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM10 12.5l-2-2 1.4-1.4 1.6 1.6 4.3-4.3 1.4 1.4-5.7 5.7z"/>
                          </svg>
                        </div>
                      </h2>
                      <p className="text-slate-500 text-xs sm:text-sm font-medium">Let's start with your basic information</p>
                    </div>
                    <div className="bg-pink-50/80 border border-pink-200/60 text-pink-600 px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold tracking-normal shrink-0 inline-flex items-center justify-center">
                      Step 1 of 7
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
                      <div className="space-y-1.5 relative">
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
                              className="fixed inset-0 bg-black/20 backdrop-blur-xs z-[100] md:fixed md:inset-0 md:bg-black/10 md:backdrop-blur-none"
                              onClick={() => setShowDobCalendar(false)}
                            />
                            <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 md:absolute md:top-full md:left-0 md:transform-none z-[101] md:z-50 mt-2 p-4 bg-card border border-border/85 rounded-2xl shadow-xl w-[300px] animate-in fade-in zoom-in-95 duration-100">
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
                <div className="space-y-4 animate-fade-in">
                  <div className="bg-accent/50 rounded-2xl p-3 mb-2">
                    <p className="text-xs text-accent-foreground font-medium">🪪 Upload clear scans/photos of your identity documents</p>
                  </div>
                  <FileUploadBox field="govtIdFile" label="Government ID (Aadhaar / Passport) *" icon={Shield} accept="image/png, image/jpeg, image/jpg" />
                  <FileUploadBox field="panCardFile" label="PAN Card *" icon={CreditCard} accept="image/png, image/jpeg, image/jpg" />
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2"><Camera className="w-4 h-4 text-primary" />Passport-size Photograph *</Label>
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
                <div className="space-y-4 animate-fade-in">
                  <div className="bg-accent/50 rounded-2xl p-3 mb-2">
                    <p className="text-xs text-accent-foreground font-medium">🎓 Professional credentials & educational background</p>
                  </div>

                  {/* Ordering as requested: Highest Qualification & Vet License Number on the same line */}
                  <div className="grid grid-cols-2 gap-3 items-end">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1.5 h-5 text-xs sm:text-sm font-semibold">Highest Qualification *</Label>
                      <Select value={formData.qualification} onValueChange={v => setFormData({ ...formData, qualification: v })}>
                        <SelectTrigger className="rounded-2xl h-10 text-xs sm:text-sm shadow-sm font-medium">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>{qualifications.map(q => <SelectItem key={q} value={q}>{q}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1.5 h-5 text-xs sm:text-sm font-semibold">Vet License Number</Label>
                      <Input value={formData.registrationNumber} disabled className="rounded-2xl bg-muted h-10 text-xs sm:text-sm shadow-none" placeholder="License Number" />
                    </div>
                  </div>

                  {/* Below it: Veterinary Council Registration Number * */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5 h-5 text-xs sm:text-sm font-semibold">Veterinary Council Registration Number *</Label>
                    <Input value={formData.registrationNumber} onChange={e => setFormData({ ...formData, registrationNumber: e.target.value })} placeholder="VET/MH/2024/1234" className="rounded-2xl h-10 text-xs sm:text-sm" />
                  </div>

                  {/* Below it: Veterinary Degree Certificate dynamically named BVSc/MVSc based on Highest Qualification selected */}
                  <FileUploadBox field="vetDegreeFile" label={`Veterinary Degree Certificate (${formData.qualification}) *`} icon={GraduationCap} />

                  {/* Education Table */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-semibold">Education Details</Label>
                      <Button type="button" variant="outline" size="sm" className="rounded-xl text-xs h-8" onClick={addEduRow}>
                        <Plus className="w-3 h-3 mr-1" />Add Row
                      </Button>
                    </div>

                    <div className="border border-border rounded-2xl overflow-hidden bg-background shadow-xs">
                      {/* Desktop View Column Header */}
                      <div className="hidden md:grid grid-cols-[1fr_1.2fr_80px_80px_45px] gap-2 px-3 py-2 bg-muted/60 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                        <span>Qualification</span><span>Institution</span><span>Year</span><span>Certificate</span><span></span>
                      </div>
                      {formData.educationRows.map((row, idx) => (
                        <div key={idx} className="border-t border-border first:border-t-0">
                          {/* Desktop Layout: shown only on md and larger */}
                          <div className="hidden md:grid grid-cols-[1fr_1.2fr_80px_80px_45px] gap-2 px-3 py-2 items-center font-sans">
                            {idx === 0 ? (
                              <Input value={row.qualification || formData.qualification} disabled className="h-8 rounded-xl text-xs bg-muted/70 text-muted-foreground cursor-not-allowed font-medium border-muted shadow-none" />
                            ) : (
                              <Input value={row.qualification} onChange={e => updateEduRow(idx, 'qualification', e.target.value)} placeholder="BVSc" className="h-8 rounded-xl text-xs" />
                            )}

                            <Input value={row.institution} onChange={e => updateEduRow(idx, 'institution', e.target.value)} placeholder="University" className="h-8 rounded-xl text-xs" />
                            <Select value={row.year} onValueChange={v => updateEduRow(idx, 'year', v)}>
                              <SelectTrigger className="h-8 rounded-xl text-xs px-2 shadow-sm">
                                <SelectValue placeholder="Year" />
                              </SelectTrigger>
                              <SelectContent>
                                {Array.from({length: 50}, (_, i) => new Date().getFullYear() - i).map(y => (
                                  <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            
                            <div>
                              {idx === 0 ? (
                                filePreviews.edu_0 ? (
                                  <div className="text-[10px] font-semibold text-primary flex items-center justify-center h-8 bg-primary/10 rounded-xl border border-primary/20">Synced ✓</div>
                                ) : (
                                  <div className="text-[9px] text-muted-foreground flex items-center justify-center h-8 bg-muted/40 rounded-xl border border-dashed border-border leading-tight text-center">Required above</div>
                                )
                              ) : (
                                <>
                                  <input type="file" accept="image/*,.pdf" onChange={handleEduFileChange(idx)} className="hidden" id={`edu-file-${idx}`} />
                                  <label htmlFor={`edu-file-${idx}`} className={`cursor-pointer flex items-center justify-center w-full h-8 rounded-xl border text-[10px] ${filePreviews[`edu_${idx}`] ? 'border-primary text-primary bg-accent/30' : 'border-dashed border-border text-muted-foreground hover:border-primary/50'}`}>
                                    {filePreviews[`edu_${idx}`] ? '✓' : <Upload className="w-3 h-3" />}
                                  </label>
                                </>
                              )}
                            </div>

                            <button type="button" onClick={() => removeEduRow(idx)} className="text-muted-foreground hover:text-destructive transition-colors flex justify-center" disabled={idx === 0}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Mobile Layout: shown on smaller screens */}
                          <div className="block md:hidden p-4 space-y-3 bg-muted/10 font-sans">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-muted-foreground">Row #{idx + 1} {idx === 0 && <span className="text-[10px] bg-primary/15 text-primary px-2 py-0.5 rounded-full font-normal">(Synced from above)</span>}</span>
                              {idx > 0 && (
                                <button type="button" onClick={() => removeEduRow(idx)} className="text-muted-foreground hover:text-destructive flex items-center gap-1 text-xs">
                                  <Trash2 className="w-3 h-3 text-destructive" /> <span className="text-destructive font-medium">Delete</span>
                                </button>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <span className="text-[10px] font-semibold text-muted-foreground">Qualification</span>
                                {idx === 0 ? (
                                  <Input value={row.qualification || formData.qualification} disabled className="h-8 rounded-xl text-xs bg-muted/70 text-muted-foreground cursor-not-allowed border-muted shadow-none font-medium" />
                                ) : (
                                  <Input value={row.qualification} onChange={e => updateEduRow(idx, 'qualification', e.target.value)} placeholder="BVSc/MVSc" className="h-8 rounded-xl text-xs" />
                                )}
                              </div>
                              <div className="space-y-1">
                                <span className="text-[10px] font-semibold text-muted-foreground">Year</span>
                                <Select value={row.year} onValueChange={v => updateEduRow(idx, 'year', v)}>
                                  <SelectTrigger className="h-8 rounded-xl text-xs px-2 shadow-sm">
                                    <SelectValue placeholder="Year" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Array.from({length: 50}, (_, i) => new Date().getFullYear() - i).map(y => (
                                      <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <span className="text-[10px] font-semibold text-muted-foreground">Institution</span>
                              <Input value={row.institution} onChange={e => updateEduRow(idx, 'institution', e.target.value)} placeholder="e.g. Veterinary College" className="h-8 rounded-xl text-xs" />
                            </div>

                            <div className="space-y-1">
                              <span className="text-[10px] font-semibold text-muted-foreground">Certificate File</span>
                              {idx === 0 ? (
                                filePreviews.edu_0 ? (
                                  <div className="text-[10px] font-semibold text-primary flex items-center justify-center h-8 bg-primary/15 rounded-xl border border-primary/20 w-full text-center py-1">Synced with Degree Upload Above ✓</div>
                                ) : (
                                  <div className="text-[10px] text-muted-foreground flex items-center justify-center h-8 bg-muted/40 rounded-xl border border-dashed border-border w-full text-center py-1">Please upload degree above to auto-sync</div>
                                )
                              ) : (
                                <>
                                  <input type="file" accept="image/*,.pdf" onChange={handleEduFileChange(idx)} className="hidden" id={`edu-file-mobile-${idx}`} />
                                  <label htmlFor={`edu-file-mobile-${idx}`} className={`cursor-pointer flex items-center justify-center w-full h-8 rounded-xl border text-[11px] font-medium gap-1.5 ${filePreviews[`edu_${idx}`] ? 'border-primary text-primary bg-accent/30' : 'border-dashed border-border text-muted-foreground hover:border-primary/50'}`}>
                                    <Upload className="w-3.5 h-3.5" /> {filePreviews[`edu_${idx}`] ? 'Uploaded ✓ (Tap to replace)' : 'Choose Certificate'}
                                  </label>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button type="button" variant="outline" className="flex-1 rounded-2xl" onClick={() => setCurrentStep(2)}>Back</Button>
                    <Button type="button" className="flex-1 rounded-2xl bg-gradient-primary" onClick={() => setCurrentStep(4)} disabled={!canProceed(3)}>Continue</Button>
                  </div>
                </div>
              )}

              {/* ══════ STEP 4 – Professional Practice ══════ */}
              {currentStep === 4 && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex flex-row justify-between items-center gap-4 pb-6 pt-2 border-b border-slate-100/80">
                    <div className="space-y-1">
                      <h2 className="text-xl sm:text-2xl font-bold font-sans text-[#0F172A] tracking-tight">Professional Practice</h2>
                      <p className="text-slate-500 text-xs sm:text-sm font-medium">Tell us where and how you practice veterinary medicine.</p>
                    </div>
                    <div className="bg-pink-50/80 border border-pink-200/60 text-pink-600 px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold tracking-normal shrink-0 inline-flex items-center justify-center">
                      Step 4 of 7
                    </div>
                  </div>

                  <div className="bg-pink-50 border border-pink-100 rounded-2xl p-4 flex gap-3 text-pink-700">
                    <div className="bg-pink-100 rounded-full w-8 h-8 flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-pink-600" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.87-3.13-7-7-7zm2.85 11.1l-.85.6V16h-4v-2.3l-.85-.6C7.57 12.11 7 10.61 7 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.61-.57 3.11-2.15 4.1zM11 18h2v2h-2z" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium">Select all that apply. You can add details for your clinic, hospital or <span className="font-bold">both</span>.</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-[#0F172A]">Where do you practice? <span className="text-slate-400 font-normal">(Select all that apply)</span></Label>
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                      {['Hospital / Organization', 'Independent Clinic / Practice'].map((type) => (
                        <div 
                          key={type} 
                          className={`border shadow-sm rounded-2xl p-3 sm:p-4 cursor-pointer relative flex flex-col sm:flex-row items-center sm:items-start gap-2.5 sm:gap-3 transition-all h-full ${
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
                          <div className={`absolute top-2 right-2 sm:top-3 sm:right-3 w-4 h-4 sm:w-5 sm:h-5 rounded-full border flex items-center justify-center transition-all ${
                            formData.practiceType.includes(type) ? 'bg-pink-500 border-pink-500' : 'border-slate-300'
                          }`}>
                            {formData.practiceType.includes(type) && <CheckCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />}
                          </div>
                          
                          <div className="bg-pink-100 rounded-xl sm:rounded-2xl w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center shrink-0">
                            {type.includes('Independent') ? <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-pink-600" /> : <Stethoscope className="w-5 h-5 sm:w-6 sm:h-6 text-pink-600" />}
                          </div>
                          
                          <div className="text-center sm:text-left flex-1 min-w-0 pr-0 sm:pr-4">
                            <h3 className="font-bold text-[#0F172A] text-[11px] sm:text-sm leading-tight">{type}</h3>
                            <p className="text-[10px] text-slate-500 mt-1 leading-normal hidden md:block">
                              {type.includes('Independent') 
                                ? 'Private clinic/practice' 
                                : 'Hospital/institution work'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Expanded Sections */}
                  {formData.practiceType.includes('Independent Clinic / Practice') && (
                    <div className="border border-pink-100 bg-pink-50/30 rounded-2xl p-6 space-y-4 shadow-sm animate-fade-in">
                      <div className="flex items-center justify-between">
                        <Label className="font-bold text-[#0F172A] flex items-center gap-2"><Building2 className="w-5 h-5 text-pink-600" /> Independent Clinic Details</Label>
                        <Button variant="ghost" size="sm" className="text-pink-600 text-xs font-semibold">Collapse</Button>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-1.5"><Label className="text-xs font-semibold text-slate-700">Clinic / Practice Name</Label>
                          <Input value={formData.clinicName} onChange={e => setFormData({...formData, clinicName: e.target.value})} placeholder="Enter clinic name" className="rounded-xl"/>
                        </div>
                        <div className="space-y-1.5"><Label className="text-xs font-semibold text-slate-700">Clinic Address</Label>
                          <Input value={formData.clinicAddress} onChange={e => setFormData({...formData, clinicAddress: e.target.value})} placeholder="Enter complete clinic address" className="rounded-xl"/>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold text-slate-700">State</Label>
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
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold text-slate-700">City</Label>
                          <Select 
                            value={formData.city} 
                            onValueChange={v => setFormData({ ...formData, city: v })}
                            disabled={!formData.state}
                          >
                            <SelectTrigger className="rounded-xl h-11 text-xs sm:text-sm shadow-none font-medium text-[#1E293B] border-[#E2E8F0] disabled:opacity-50">
                              <SelectValue placeholder={<span className="text-slate-400">{formData.state ? "Select City" : "Select State first"}</span>} />
                            </SelectTrigger>
                            <SelectContent className="max-h-[300px]">
                              {formData.state && (INDIA_STATES_AND_CITIES[formData.state as keyof typeof INDIA_STATES_AND_CITIES] || []).map(c => (
                                <SelectItem key={c} value={c}>{c}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5"><Label className="text-xs font-semibold text-slate-700">Pincode</Label>
                          <Input value={formData.clinicPincode} onChange={e => setFormData({...formData, clinicPincode: e.target.value})} placeholder="Enter pincode" className="rounded-xl"/>
                        </div>
                        <div className="space-y-1.5"><Label className="text-xs font-semibold text-slate-700">GST Number (Optional)</Label>
                          <Input placeholder="Enter GST number (if applicable)" className="rounded-xl"/>
                        </div>
                      </div>
                      {/* File uploads would go here - for brevity, applying basic structure */}
                      <FileUploadBox field="clinicShopLicenseFile" label="Shop & Establishment License (Optional)" icon={FileText} />
                    </div>
                  )}

                  {formData.practiceType.includes('Hospital / Organization') && (
                    <div className="border border-pink-100 bg-pink-50/30 rounded-2xl p-6 space-y-4 shadow-sm animate-fade-in">
                      <div className="flex items-center justify-between">
                        <Label className="font-bold text-[#0F172A] flex items-center gap-2"><Stethoscope className="w-5 h-5 text-pink-600" /> Hospital / Organization Details</Label>
                        <Button variant="ghost" size="sm" className="text-pink-600 text-xs font-semibold">Collapse</Button>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-1.5"><Label className="text-xs font-semibold text-slate-700">Hospital / Organization Name</Label>
                          <Input value={formData.hospitalName} onChange={e => setFormData({...formData, hospitalName: e.target.value})} placeholder="Enter hospital name" className="rounded-xl"/>
                        </div>
                        <div className="space-y-1.5"><Label className="text-xs font-semibold text-slate-700">Your Role / Designation</Label>
                          <Input value={formData.hospitalRole} onChange={e => setFormData({...formData, hospitalRole: e.target.value})} placeholder="e.g. Veterinarian, Consultant, Surgeon" className="rounded-xl"/>
                        </div>
                        <div className="md:col-span-2 space-y-1.5"><Label className="text-xs font-semibold text-slate-700">Hospital Address</Label>
                          <Input value={formData.hospitalAddress} onChange={e => setFormData({...formData, hospitalAddress: e.target.value})} placeholder="Enter hospital address" className="rounded-xl"/>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold text-slate-700">State</Label>
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
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold text-slate-700">City</Label>
                          <Select 
                            value={formData.city} 
                            onValueChange={v => setFormData({ ...formData, city: v })}
                            disabled={!formData.state}
                          >
                            <SelectTrigger className="rounded-xl h-11 text-xs sm:text-sm shadow-none font-medium text-[#1E293B] border-[#E2E8F0] disabled:opacity-50">
                              <SelectValue placeholder={<span className="text-slate-400">{formData.state ? "Select City" : "Select State first"}</span>} />
                            </SelectTrigger>
                            <SelectContent className="max-h-[300px]">
                              {formData.state && (INDIA_STATES_AND_CITIES[formData.state as keyof typeof INDIA_STATES_AND_CITIES] || []).map(c => (
                                <SelectItem key={c} value={c}>{c}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5"><Label className="text-xs font-semibold text-slate-700">Pincode</Label>
                          <Input value={formData.hospitalPincode} onChange={e => setFormData({...formData, hospitalPincode: e.target.value})} placeholder="Enter pincode" className="rounded-xl"/>
                        </div>
                      </div>
                      <FileUploadBox field="hospitalJoiningProofFile" label="Joining Proof / ID (Optional)" icon={FileText} />
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button type="button" variant="outline" className="flex-1 rounded-2xl" onClick={() => setCurrentStep(3)}>Back</Button>
                    <Button type="button" className="flex-1 rounded-2xl bg-gradient-primary" onClick={() => setCurrentStep(5)}>Continue</Button>
                  </div>
                </div>
              )}

              {/* ══════ STEP 5 – Bank & Payment ══════ */}
              {currentStep === 5 && (
                <div className="space-y-4 animate-fade-in">
                  <div className="bg-accent/50 rounded-2xl p-3 mb-2">
                    <p className="text-xs text-accent-foreground font-medium">🏦 Bank details for payouts</p>
                  </div>
                  <FileUploadBox field="cancelledChequeFile" label="Cancelled Cheque / Bank Passbook" icon={Banknote} />
                  <div className="space-y-2">
                    <Label>Account Holder Name</Label>
                    <Input value={formData.bankAccountName} onChange={e => setFormData({ ...formData, bankAccountName: e.target.value })} placeholder="Dr. Ananya Iyer" className="rounded-2xl" />
                  </div>
                  <div className="space-y-2">
                    <Label>Bank Name</Label>
                    <Input value={formData.bankName} onChange={e => setFormData({ ...formData, bankName: e.target.value })} placeholder="State Bank of India" className="rounded-2xl" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Account Number</Label>
                      <Input value={formData.bankAccountNumber} onChange={e => setFormData({ ...formData, bankAccountNumber: e.target.value })} placeholder="1234567890" className="rounded-2xl" />
                    </div>
                    <div className="space-y-2">
                      <Label>IFSC Code</Label>
                      <Input value={formData.bankIfsc} onChange={e => setFormData({ ...formData, bankIfsc: e.target.value })} placeholder="SBIN0001234" className="rounded-2xl" />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button type="button" variant="outline" className="flex-1 rounded-2xl" onClick={() => setCurrentStep(4)}>Back</Button>
                    <Button type="button" className="flex-1 rounded-2xl bg-gradient-primary" onClick={() => setCurrentStep(6)}>Continue</Button>
                  </div>
                </div>
              )}

              {/* ══════ STEP 6 – Availability & Fees ══════ */}
              {currentStep === 6 && (
                <div className="space-y-4 animate-fade-in">
                  <div className="space-y-2">
                    <Label>Specializations *</Label>
                    <div className="flex flex-wrap gap-2">
                      {specializations.map(s => (
                        <button key={s} type="button" onClick={() => toggleSpec(s)}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${formData.specializations.includes(s) ? "bg-gradient-primary text-white shadow-md" : "bg-muted text-muted-foreground"}`}>{s}</button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Consultation Type *</Label>
                    <div className="flex flex-wrap gap-2">
                      {consultationOptions.map(t => (
                        <button key={t} type="button" onClick={() => toggleConsultation(t)}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${formData.consultationTypes.includes(t) ? "bg-gradient-primary text-white shadow-md" : "bg-muted text-muted-foreground"}`}>{t}</button>
                      ))}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">Select one or more types of consultations you provide</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Experience (years) *</Label>
                    <Input type="number" value={formData.yearsOfExperience} onChange={e => setFormData({ ...formData, yearsOfExperience: e.target.value })} placeholder="e.g. 5" className="rounded-2xl" />
                  </div>
                  <div className="space-y-2">
                    <Label>Available Days *</Label>
                    <div className="flex flex-wrap gap-2">
                      {days.map(d => (
                        <button key={d} type="button" onClick={() => toggleDay(d)}
                          className={`w-12 h-12 rounded-xl text-sm font-medium transition-all ${formData.availableDays.includes(d) ? "bg-gradient-primary text-white shadow-md" : "bg-muted text-muted-foreground"}`}>{d}</button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label>Time Slots *</Label>
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-2xl">
                      <Checkbox id="slot-morning" checked={formData.morningSlots} onCheckedChange={c => setFormData({ ...formData, morningSlots: c as boolean })} />
                      <Label htmlFor="slot-morning" className="text-sm cursor-pointer">Morning (9 AM - 1 PM)</Label>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-2xl">
                      <Checkbox id="slot-evening" checked={formData.eveningSlots} onCheckedChange={c => setFormData({ ...formData, eveningSlots: c as boolean })} />
                      <Label htmlFor="slot-evening" className="text-sm cursor-pointer">Evening (4 PM - 8 PM)</Label>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Clinic visit fee (₹) *</Label>
                      <Input type="number" value={formData.onlineFee} onChange={e => setFormData({ ...formData, onlineFee: e.target.value })} placeholder="500" className="rounded-2xl" />
                    </div>
                    <div className="space-y-2">
                      <Label>Home visit fee (₹) *</Label>
                      <Input type="number" value={formData.offlineFee} onChange={e => setFormData({ ...formData, offlineFee: e.target.value })} placeholder="800" className="rounded-2xl" />
                    </div>
                  </div>

                  <FileUploadBox field="profilePhoto" label="Vet Profile Photo *" accept="image/*" icon={Camera} />

                  <div className="flex gap-3">
                    <Button type="button" variant="outline" className="flex-1 rounded-2xl" onClick={() => setCurrentStep(5)}>Back</Button>
                    <Button type="button" className="flex-1 rounded-2xl bg-gradient-primary" onClick={() => setCurrentStep(7)} disabled={!canProceed(6)}>Continue</Button>
                  </div>
                </div>
              )}

              {/* ══════ STEP 7 – Platform Compliance & Submit ══════ */}
              {currentStep === 7 && (
                <div className="space-y-4 animate-fade-in">
                  <div className="bg-accent/50 rounded-2xl p-3 mb-2">
                    <p className="text-xs text-accent-foreground font-medium">📋 Review agreements and submit</p>
                  </div>

                  {/* Summary */}
                  <div className="bg-muted/40 rounded-2xl p-4 space-y-2">
                    <h4 className="font-semibold text-sm">Profile Summary</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <span className="text-muted-foreground">Name:</span><span className="font-medium">{formData.fullName}</span>
                      <span className="text-muted-foreground">Practice:</span><span className="font-medium">{formData.isIndependentPractice ? "Independent Clinic" : "Regular Practice"}</span>
                      <span className="text-muted-foreground">Gender:</span><span className="font-medium capitalize">{formData.gender}</span>
                      <span className="text-muted-foreground">DOB:</span><span className="font-medium">{formData.dob}</span>
                      <span className="text-muted-foreground">Phone:</span><span className="font-medium">{formData.phone}</span>
                      <span className="text-muted-foreground">City:</span><span className="font-medium">{formData.city}, {formData.state}</span>
                      <span className="text-muted-foreground">Address:</span><span className="font-medium break-all">{formData.address || "N/A"}</span>
                      <span className="text-muted-foreground">Qualification:</span><span className="font-medium">{formData.qualification}</span>
                      <span className="text-muted-foreground">Experience:</span><span className="font-medium">{formData.yearsOfExperience} yrs</span>
                      <span className="text-muted-foreground">Specializations:</span><span className="font-medium">{formData.specializations.join(", ")}</span>
                      <span className="text-muted-foreground">Consultation:</span><span className="font-medium">{formData.consultationTypes.join(", ")}</span>
                      <span className="text-muted-foreground">Available:</span><span className="font-medium">{formData.availableDays.join(", ")}</span>
                      <span className="text-muted-foreground">Clinic Fee:</span><span className="font-medium">₹{formData.onlineFee}</span>
                      <span className="text-muted-foreground">Home Fee:</span><span className="font-medium">₹{formData.offlineFee}</span>
                    </div>
                  </div>

                  {/* Compliance checkboxes */}
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-2xl">
                      <Checkbox checked={formData.vendorAgreement} onCheckedChange={c => setFormData({ ...formData, vendorAgreement: c as boolean })} className="mt-0.5" />
                      <Label className="text-sm cursor-pointer">I accept the <span className="text-primary font-medium">Vendor / Service Agreement</span> *</Label>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-2xl">
                      <Checkbox checked={formData.termsAccepted} onCheckedChange={c => setFormData({ ...formData, termsAccepted: c as boolean })} className="mt-0.5" />
                      <Label className="text-sm cursor-pointer">I accept the <span className="text-primary font-medium">Terms & Conditions</span> and confirm all information is accurate *</Label>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-2xl">
                      <Checkbox checked={formData.telemedicineConsent} onCheckedChange={c => setFormData({ ...formData, telemedicineConsent: c as boolean })} className="mt-0.5" />
                      <Label className="text-sm cursor-pointer">I consent to provide <span className="text-primary font-medium">Telemedicine Consultations</span> via this platform</Label>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button type="button" variant="outline" className="flex-1 rounded-2xl" onClick={() => setCurrentStep(6)}>Back</Button>
                    <Button type="submit" className="flex-1 rounded-2xl bg-gradient-primary" disabled={isLoading || !formData.termsAccepted || !formData.vendorAgreement}>
                      {isLoading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Submitting...</>) : "Submit for Verification"}
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
