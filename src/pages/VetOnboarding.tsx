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
  CreditCard, GraduationCap, Plus, Trash2
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

  useEffect(() => {
    // Check if the user already has completed DB onboarding but was redirected here
    const checkStatus = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const uid = session.user.id;
        const { data: p } = await supabase.from('profiles').select('is_onboarding_complete, is_admin_approved, full_name, phone, email, city, state').eq('id', uid).single();
        
        // Fetch existing vet profile data to pre-fill
        const { data: vp } = await supabase.from('vet_profiles').select('*').eq('user_id', uid).maybeSingle();
        
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
            fullName: p?.full_name || "",
            email: p?.email || "",
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
            preferred_language: vp.preferred_language || "English",
            clinicAddress: vp.clinic_address || "",
            vendorAgreement: vp.vendor_agreement_accepted || false,
            telemedicineConsent: vp.telemedicine_consent_accepted || false,
            city: vp.city || (p as any)?.city || "",
            state: vp.state || (p as any)?.state || "",
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
          if (p?.is_onboarding_complete) {
             navigate("/vet-pending-approval", { replace: true });
          }
        }
      }
    };
    checkStatus();
  }, [navigate, profile]);

  /* ─── form state ─── */
  const [formData, setFormData] = useState({
    // Step 1 – Personal
    fullName: "", email: "", phone: "", city: "", state: "", preferredLanguage: "English",
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

  const specializations = ["Dog", "Cat", "Bird", "Fish", "Exotic", "All"];
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const qualifications = ["BVSc", "MVSc", "PhD", "Other"];
  const languages = ["English", "Hindi", "Tamil", "Telugu", "Kannada", "Malayalam", "Bengali", "Marathi", "Gujarati"];

  const consultationOptions = ["Video consultation", "Home visits", "Clinic visit"];

  /* ─── helpers ─── */
  const handleFileChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
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
        if (row.certificateFile) {
          certUrl = await uploadFile(row.certificateFile, uid, `edu_cert_${i}`);
        } else if (oldEdu[i]?.certificate_url) {
          certUrl = oldEdu[i].certificate_url;
        }
        eduDetails.push({ qualification: row.qualification, institution: row.institution, year: row.year, certificate_url: certUrl });
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
        address: `${formData.city}, ${formData.state}`,
        city: formData.city,
        state: formData.state,
        is_onboarding_complete: true,
        is_admin_approved: false,
        role: 'vet',
      } as any);

      if (profileError) throw profileError;

      // 4. Success feedback and routing
      toast.success("Professional profile submitted successfully!");
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
    { n: 4, title: "Clinic", icon: Building2, hidden: !formData.isIndependentPractice },
    { n: 5, title: "Bank", icon: Banknote },
    { n: 6, title: "Availability", icon: Calendar },
    { n: 7, title: "Compliance", icon: ScrollText },
  ];

  const visibleSteps = steps.filter(s => !s.hidden);
  const currentVisibleStepIndex = visibleSteps.findIndex(s => s.n === currentStep);

  const canProceed = (step: number) => {
    switch (step) {
      case 1: return formData.fullName && formData.email && formData.phone && formData.preferredLanguage && formData.dob && formData.gender && formData.city && formData.state;
      case 2: return formData.govtIdFile && formData.panCardFile && formData.passportPhotoFile;
      case 3: return formData.vetDegreeFile && formData.registrationNumber;
      case 4: return true;
      case 5: return true;
      case 6: return (
        formData.availableDays.length > 0 && 
        formData.specializations.length > 0 && 
        formData.consultationTypes.length > 0 && 
        formData.yearsOfExperience !== "" && 
        (formData.morningSlots || formData.eveningSlots) && 
        formData.onlineFee !== "" && 
        formData.offlineFee !== "" && 
        formData.profilePhoto !== null
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
      <header className="bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-1">
            <img src={SRUVO_LOGO_URL} alt="Sruvo" className="w-12 h-12 object-contain" referrerPolicy="no-referrer" />
            <div>
              <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">Sruvo</span>
              <p className="text-xs text-muted-foreground">Vet Doctor Verification</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Progress bar */}
        <div className="flex items-center justify-center mb-6 overflow-x-auto pb-2">
          {visibleSteps.map((step, i) => (
            <div key={step.n} className="flex items-center">
              <div className={`flex flex-col items-center ${currentStep >= step.n ? "text-primary" : "text-muted-foreground"}`}>
                <div className={`w-9 h-9 rounded-full flex items-center justify-center mb-1 transition-all ${
                  currentStep >= step.n ? "bg-gradient-primary text-white shadow-float" : "bg-muted"
                }`}>
                  <step.icon className="w-4 h-4" />
                </div>
                <span className="text-[9px] font-medium whitespace-nowrap">{step.title}</span>
              </div>
              {i < visibleSteps.length - 1 && (
                <div className={`w-5 h-0.5 mx-0.5 mb-4 rounded-full transition-all ${currentStep > visibleSteps[i].n ? "bg-primary" : "bg-muted"}`} />
              )}
            </div>
          ))}
        </div>

        <Card className="border-0 shadow-card animate-fade-in">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl">{steps.find(s => s.n === currentStep)?.title}</CardTitle>
            <CardDescription>Step {currentVisibleStepIndex + 1} of {visibleSteps.length}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* ══════ STEP 1 – Personal Info ══════ */}
              {currentStep === 1 && (
                <div className="space-y-4 animate-fade-in">
                  <div className="space-y-2">
                    <Label>Full Name *</Label>
                    <Input value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} placeholder="Dr. Ananya Iyer" className="rounded-2xl" />
                  </div>
                  <div className="space-y-2">
                    <Label>Email *</Label>
                    <Input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="doctor@example.com" className="rounded-2xl" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Date of Birth *</Label>
                      <Input type="date" value={formData.dob} onChange={e => setFormData({ ...formData, dob: e.target.value })} className="rounded-2xl" />
                    </div>
                    <div className="space-y-2">
                      <Label>Gender *</Label>
                      <Select value={formData.gender} onValueChange={v => setFormData({ ...formData, gender: v })}>
                        <SelectTrigger className="rounded-2xl"><SelectValue placeholder="Select Gender" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Phone *</Label>
                      <Input type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="+91 98765 43210" className="rounded-2xl" />
                    </div>
                    <div className="space-y-2">
                      <Label>Language *</Label>
                      <Select value={formData.preferredLanguage} onValueChange={v => setFormData({ ...formData, preferredLanguage: v })}>
                        <SelectTrigger className="rounded-2xl"><SelectValue /></SelectTrigger>
                        <SelectContent>{languages.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>State *</Label>
                      <Select 
                        value={formData.state} 
                        onValueChange={v => setFormData({ ...formData, state: v, city: "" })}
                      >
                        <SelectTrigger className="rounded-2xl">
                          <SelectValue placeholder="Select State" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          {ALLOWED_VET_STATES.map(s => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>City *</Label>
                      <Select 
                        value={formData.city} 
                        onValueChange={v => setFormData({ ...formData, city: v })}
                        disabled={!formData.state}
                      >
                        <SelectTrigger className="rounded-2xl">
                          <SelectValue placeholder={formData.state ? "Select City" : "Select State first"} />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          {formData.state && (INDIA_STATES_AND_CITIES[formData.state] || []).map(c => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="p-4 bg-muted/30 rounded-2xl border border-border/50 space-y-3">
                    <div className="flex items-start gap-3">
                      <Checkbox 
                        id="independent-practice" 
                        checked={formData.isIndependentPractice} 
                        onCheckedChange={c => setFormData({ ...formData, isIndependentPractice: c as boolean })} 
                      />
                      <div className="space-y-1">
                        <Label htmlFor="independent-practice" className="text-sm font-medium leading-none cursor-pointer">
                          I run an independent veterinary practice
                        </Label>
                        <p className="text-xs text-muted-foreground leading-tight">
                          Enable this if you personally operate a clinic or offer independent veterinary consultations.
                        </p>
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
                  <FileUploadBox field="govtIdFile" label="Government ID (Aadhaar / Passport) *" icon={Shield} />
                  <FileUploadBox field="panCardFile" label="PAN Card *" icon={CreditCard} />
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2"><Camera className="w-4 h-4 text-primary" />Passport-size Photograph *</Label>
                    <div className="border-2 border-dashed border-border rounded-2xl p-4 text-center hover:border-primary/50 transition-colors">
                      <input type="file" accept="image/*" capture="user" onChange={handleFileChange("passportPhotoFile")} className="hidden" id="file-passportPhotoFile" />
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

                  <FileUploadBox field="vetDegreeFile" label="Veterinary Degree Certificate (BVSc/MVSc) *" icon={GraduationCap} />

                  <div className="space-y-2">
                    <Label>Veterinary Council Registration Number *</Label>
                    <Input value={formData.registrationNumber} onChange={e => setFormData({ ...formData, registrationNumber: e.target.value })} placeholder="VET/MH/2024/1234" className="rounded-2xl" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Highest Qualification *</Label>
                      <Select value={formData.qualification} onValueChange={v => setFormData({ ...formData, qualification: v })}>
                        <SelectTrigger className="rounded-2xl"><SelectValue /></SelectTrigger>
                        <SelectContent>{qualifications.map(q => <SelectItem key={q} value={q}>{q}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Vet License Number</Label>
                      <Input value={formData.registrationNumber} disabled className="rounded-2xl bg-muted" />
                    </div>
                  </div>

                  {/* Education Table */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-semibold">Education Details</Label>
                      <Button type="button" variant="outline" size="sm" className="rounded-xl text-xs h-8" onClick={addEduRow}>
                        <Plus className="w-3 h-3 mr-1" />Add Row
                      </Button>
                    </div>

                    <div className="border border-border rounded-2xl overflow-hidden">
                      {/* Table header */}
                      <div className="grid grid-cols-[1fr_1fr_70px_70px_40px] gap-2 px-3 py-2 bg-muted/60 text-[10px] font-semibold text-muted-foreground uppercase">
                        <span>Qualification</span><span>Institution</span><span>Year</span><span>Certificate</span><span></span>
                      </div>
                      {formData.educationRows.map((row, idx) => (
                        <div key={idx} className="grid grid-cols-[1fr_1fr_70px_70px_40px] gap-2 px-3 py-2 border-t border-border items-center">
                          <Input value={row.qualification} onChange={e => updateEduRow(idx, 'qualification', e.target.value)} placeholder="BVSc" className="h-8 rounded-xl text-xs" />
                          <Input value={row.institution} onChange={e => updateEduRow(idx, 'institution', e.target.value)} placeholder="University" className="h-8 rounded-xl text-xs" />
                          <Input value={row.year} onChange={e => updateEduRow(idx, 'year', e.target.value)} placeholder="2020" className="h-8 rounded-xl text-xs" />
                          <div>
                            <input type="file" accept="image/*,.pdf" onChange={handleEduFileChange(idx)} className="hidden" id={`edu-file-${idx}`} />
                            <label htmlFor={`edu-file-${idx}`} className={`cursor-pointer flex items-center justify-center w-full h-8 rounded-xl border text-[10px] ${filePreviews[`edu_${idx}`] ? 'border-primary text-primary bg-accent/30' : 'border-dashed border-border text-muted-foreground hover:border-primary/50'}`}>
                              {filePreviews[`edu_${idx}`] ? '✓' : <Upload className="w-3 h-3" />}
                            </label>
                          </div>
                          <button type="button" onClick={() => removeEduRow(idx)} className="text-muted-foreground hover:text-destructive transition-colors" disabled={formData.educationRows.length <= 1}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button type="button" variant="outline" className="flex-1 rounded-2xl" onClick={() => setCurrentStep(2)}>Back</Button>
                    <Button type="button" className="flex-1 rounded-2xl bg-gradient-primary" onClick={() => setCurrentStep(formData.isIndependentPractice ? 4 : 5)} disabled={!canProceed(3)}>Continue</Button>
                  </div>
                </div>
              )}

              {/* ══════ STEP 4 – Clinic / Business Verification ══════ */}
              {currentStep === 4 && (
                <div className="space-y-4 animate-fade-in">
                  <div className="bg-accent/50 rounded-2xl p-3 mb-2">
                    <p className="text-xs text-accent-foreground font-medium">🏥 Clinic & business verification documents</p>
                  </div>
                  <FileUploadBox field="clinicRegistrationFile" label="Clinic Registration Certificate" icon={Building2} />
                  <FileUploadBox field="clinicShopLicenseFile" label="Shop & Establishment License" icon={FileText} />
                  <FileUploadBox field="gstCertificateFile" label="GST Registration Certificate" icon={FileText} />
                  <div className="space-y-2">
                    <Label>Clinic Address</Label>
                    <Input value={formData.clinicAddress} onChange={e => setFormData({ ...formData, clinicAddress: e.target.value })} placeholder="123, Vet Street, Mumbai" className="rounded-2xl" />
                  </div>
                  <FileUploadBox field="clinicAddressProofFile" label="Clinic Address Proof" icon={Shield} />

                  {/* Clinic Photos (Optional) */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2"><Camera className="w-4 h-4 text-primary" />Clinic Photos (Optional)</Label>
                    <div className="border-2 border-dashed border-border rounded-2xl p-4 text-center hover:border-primary/50 transition-colors">
                      <input type="file" accept="image/*" multiple onChange={(e) => {
                        const files = Array.from(e.target.files || []).filter(f => f.size <= 5 * 1024 * 1024);
                        setFormData(prev => ({ ...prev, clinicPhotos: [...prev.clinicPhotos, ...files] }));
                      }} className="hidden" id="clinic-photos" />
                      <label htmlFor="clinic-photos" className="cursor-pointer">
                        {formData.clinicPhotos.length > 0 ? (
                          <div className="flex items-center justify-center gap-2 text-primary">
                            <CheckCircle className="w-5 h-5" />
                            <span className="text-sm">{formData.clinicPhotos.length} photo(s) selected</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-1">
                            <Camera className="w-5 h-5 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">Upload clinic photos</span>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>

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
                    <Button type="button" variant="outline" className="flex-1 rounded-2xl" onClick={() => setCurrentStep(formData.isIndependentPractice ? 4 : 3)}>Back</Button>
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
