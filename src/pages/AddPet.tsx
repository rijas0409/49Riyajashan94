import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { 
  Heart, Loader2, Upload, ArrowLeft, ArrowRight, X, 
  Image as ImageIcon, FileText, Syringe, MapPin, IndianRupee,
  CheckCircle, Eye, Video, Camera, CalendarIcon
} from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import AddVaccineModal, { type VaccineEntry } from "@/components/pet-details/AddVaccineModal";
import VaccinationTable from "@/components/pet-details/VaccinationTable";

type PetCategory = Database["public"]["Enums"]["pet_category"];
type PetGender = Database["public"]["Enums"]["pet_gender"];

interface MediaFile {
  file: File;
  preview: string;
  type: 'image' | 'video';
}

const DOG_BLOODLINES = [
  "Champion Bloodline", "Grand Champion Bloodline", "Imported Bloodline",
  "Working Bloodline", "Show Bloodline", "Dual Bloodline",
  "Pet Quality Bloodline", "Local Bloodline", "Unknown Bloodline",
];

const CAT_BLOODLINES = [
  "Champion Bloodline", "Grand Champion Bloodline", "Show Bloodline",
  "Imported Bloodline", "Pet Quality Bloodline", "Local Bloodline", "Unknown Bloodline",
];

const DOG_REGISTRATIONS = [
  "KCI Registered", "INKC Registered", "IKG Registered",
  "FCI Registered", "AKC Registered", "UKC Registered", "Not Registered",
];

const CAT_REGISTRATIONS = [
  "TICA Registered", "CFA Registered", "WCF Registered",
  "FIFe Registered", "Not Registered",
];

const SIZE_OPTIONS = ["Small", "Medium", "Large", "Extra Large"];

const STEPS = [
  { id: 1, title: "Media", icon: ImageIcon, description: "Upload photos & videos" },
  { id: 2, title: "Basic Info", icon: FileText, description: "Pet details" },
  { id: 3, title: "Pricing", icon: IndianRupee, description: "Set your price" },
  { id: 4, title: "Location", icon: MapPin, description: "Where is your pet" },
  { id: 5, title: "Health", icon: Syringe, description: "Health information" },
  { id: 6, title: "Documents", icon: FileText, description: "Upload certificates" },
  { id: 7, title: "Preview", icon: Eye, description: "Review & submit" },
];

const AddPet = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [media, setMedia] = useState<MediaFile[]>([]);
  const [livePetPhoto, setLivePetPhoto] = useState<{ file: File; preview: string } | null>(null);
  const [documents, setDocuments] = useState<File[]>([]);
  const [vaccinationDocs, setVaccinationDocs] = useState<File[]>([]);
  const [vaccineEntries, setVaccineEntries] = useState<VaccineEntry[]>([]);
  const [showVaccineModal, setShowVaccineModal] = useState(false);
  const [bloodlineDocFiles, setBloodlineDocFiles] = useState<File[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    category: "" as PetCategory,
    breed: "",
    gender: "" as PetGender,
    ageMonths: "",
    color: "",
    price: "",
    originalPrice: "",
    description: "",
    location: "",
    city: "",
    state: "",
    vaccinated: false,
    microchip: "",
    medicalHistory: "",
    bloodline: "",
    registeredWith: "",
    ageType: "approximate" as "exact" | "approximate",
    birthDate: null as Date | null,
    size: "",
    weightKg: "",
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate("/auth"); return; }
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, is_onboarding_complete")
      .eq("id", session.user.id)
      .single();
    if (profile?.role !== "seller") { navigate("/buyer-dashboard"); return; }
    if (!profile?.is_onboarding_complete) { navigate("/seller-onboarding"); return; }
  };

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageCount = media.filter(m => m.type === 'image').length;
    const videoCount = media.filter(m => m.type === 'video').length;
    const newMedia: MediaFile[] = [];
    for (const file of files) {
      const isVideo = file.type.startsWith('video/');
      const isImage = file.type.startsWith('image/');
      if (!isVideo && !isImage) { toast.error(`${file.name} is not a valid image or video`); continue; }
      if (isImage && imageCount + newMedia.filter(m => m.type === 'image').length >= 20) { toast.error("Maximum 20 images allowed"); continue; }
      if (isVideo && videoCount + newMedia.filter(m => m.type === 'video').length >= 2) { toast.error("Maximum 2 videos allowed"); continue; }
      const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
      if (file.size > maxSize) { toast.error(`${file.name} is too large. Max ${isVideo ? '50MB' : '10MB'}`); continue; }
      const preview = URL.createObjectURL(file);
      newMedia.push({ file, preview, type: isVideo ? 'video' : 'image' });
    }
    setMedia(prev => [...prev, ...newMedia]);
  };

  const removeMedia = (index: number) => {
    setMedia(prev => {
      const item = prev[index];
      URL.revokeObjectURL(item.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      if (file.size > 10 * 1024 * 1024) { toast.error(`${file.name} is too large. Max 10MB per document.`); return false; }
      return true;
    });
    setDocuments(prev => [...prev, ...validFiles]);
  };

  const handleVaccinationDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      if (file.size > 10 * 1024 * 1024) { toast.error(`${file.name} is too large. Max 10MB per document.`); return false; }
      return true;
    });
    setVaccinationDocs(prev => [...prev, ...validFiles]);
  };

  const removeDocument = (index: number) => {
    setDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const removeVaccinationDoc = (index: number) => {
    setVaccinationDocs(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async (files: File[], userId: string, type: string) => {
    const paths: string[] = [];
    for (const file of files) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${type}_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const bucket = type === 'document' || type === 'vaccination' || type === 'bloodline' ? 'pet-documents' : 'pet-media';
      const { error } = await supabase.storage.from(bucket).upload(fileName, file);
      if (error) { console.error("Upload error:", error); throw error; }
      if (bucket === 'pet-documents') {
        paths.push(fileName);
      } else {
        const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(fileName);
        paths.push(urlData.publicUrl);
      }
    }
    return paths;
  };

  const getAgeMonths = (): number => {
    if (formData.ageType === "exact" && formData.birthDate) {
      const now = new Date();
      const birth = formData.birthDate;
      const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
      return Math.max(0, months);
    }
    return parseInt(formData.ageMonths) || 0;
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (media.filter(m => m.type === 'image').length === 0) { toast.error("Please upload at least one image"); return false; }
        if (!livePetPhoto) { toast.error("Please capture a live pet photo using your camera"); return false; }
        return true;
      case 2: {
        if (!formData.name || !formData.category || !formData.breed || !formData.gender) {
          toast.error("Please fill in all required fields");
          return false;
        }
        if ((formData.category === "dog" || formData.category === "cat") && (!formData.bloodline || !formData.registeredWith)) {
          toast.error("Please select bloodline and registration for this category");
          return false;
        }
        if (formData.ageType === "exact" && !formData.birthDate) {
          toast.error("Please select a birth date");
          return false;
        }
        if (formData.ageType === "approximate" && !formData.ageMonths) {
          toast.error("Please enter the approximate age");
          return false;
        }
        if (!formData.size) {
          toast.error("Please select a size");
          return false;
        }
        if (!formData.weightKg) {
          toast.error("Please enter the weight");
          return false;
        }
        return true;
      }
      case 3:
        if (!formData.price || parseFloat(formData.price) <= 0) { toast.error("Please enter a valid selling price"); return false; }
        return true;
      case 4:
        if (!formData.state || !formData.city || !formData.location) { toast.error("Please fill in all location fields"); return false; }
        return true;
      case 5:
        if (formData.vaccinated && vaccineEntries.length === 0) {
          toast.error("Please add at least one vaccination entry or uncheck 'Pet is vaccinated'");
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }
      const userId = session.user.id;

      const images = media.filter(m => m.type === 'image').map(m => m.file);
      const videos = media.filter(m => m.type === 'video').map(m => m.file);
      const imageUrls = await uploadFiles(images, userId, 'image');
      const videoUrls = videos.length > 0 ? await uploadFiles(videos, userId, 'video') : [];

      const ageMonths = getAgeMonths();

      const { data: pet, error: petError } = await supabase
        .from("pets")
        .insert({
          owner_id: userId,
          name: formData.name,
          category: formData.category,
          breed: formData.breed,
          gender: formData.gender,
          age_months: ageMonths,
          color: formData.color || null,
          price: parseFloat(formData.price),
          original_price: formData.originalPrice ? parseFloat(formData.originalPrice) : null,
          description: formData.description || null,
          location: formData.location,
          city: formData.city,
          state: formData.state,
          vaccinated: formData.vaccinated,
          microchip: formData.microchip || null,
          medical_history: formData.medicalHistory || null,
          images: imageUrls,
          videos: videoUrls,
          verification_status: 'pending' as const,
          is_available: true,
          bloodline: formData.bloodline || null,
          registered_with: formData.registeredWith || null,
          birth_date: formData.ageType === "exact" && formData.birthDate ? formData.birthDate.toISOString().split('T')[0] : null,
          age_type: formData.ageType,
          size: formData.size || null,
          weight_kg: formData.weightKg ? parseFloat(formData.weightKg) : null,
        } as any)
        .select()
        .single();

      if (petError) throw petError;

      if (documents.length > 0 && pet) {
        const docUrls = await uploadFiles(documents, userId, 'document');
        for (const url of docUrls) {
          await supabase.from("pet_documents").insert({
            pet_id: pet.id, document_type: 'medical_certificate', file_url: url, verified: false,
          });
        }
      }

      // Upload bloodline documents
      if (bloodlineDocFiles.length > 0 && pet) {
        const bloodlineUrls = await uploadFiles(bloodlineDocFiles, userId, 'bloodline');
        for (const url of bloodlineUrls) {
          await supabase.from("pet_documents").insert({
            pet_id: pet.id, document_type: 'bloodline_certificate', file_url: url, verified: false,
          });
        }
      }

      if (vaccineEntries.length > 0 && pet) {
        for (const entry of vaccineEntries) {
          let certUrl: string | null = null;
          if (entry.certificateFile) {
            const certPaths = await uploadFiles([entry.certificateFile], userId, 'vaccination');
            certUrl = certPaths[0] || null;
          }
          await (supabase as any).from("pet_vaccinations").insert({
            pet_id: pet.id,
            vaccine_type: entry.vaccineType,
            dose_number: entry.doseNumber,
            date_administered: entry.dateAdministered.toISOString().split('T')[0],
            next_due_date: entry.nextDueDate ? entry.nextDueDate.toISOString().split('T')[0] : null,
            certificate_url: certUrl,
            certificate_name: entry.certificateName,
          });
        }
      }

      if (vaccinationDocs.length > 0 && pet) {
        const vacDocUrls = await uploadFiles(vaccinationDocs, userId, 'vaccination');
        for (const url of vacDocUrls) {
          await supabase.from("pet_documents").insert({
            pet_id: pet.id, document_type: 'vaccination_certificate', file_url: url, verified: false,
          });
        }
      }

      toast.success("Pet listed successfully!");
      navigate("/seller-dashboard");
    } catch (error: any) {
      console.error("Error creating listing:", error);
      toast.error(error.message || "Failed to create listing");
    } finally {
      setIsLoading(false);
    }
  };

  const categories: { value: PetCategory; label: string }[] = [
    { value: "dog", label: "Dog" },
    { value: "cat", label: "Cat" },
    { value: "bird", label: "Bird" },
    { value: "rabbit", label: "Rabbit" },
    { value: "other", label: "Other" },
  ];

  const indianStates = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
    "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
    "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
    "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
    "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
    "Delhi", "Jammu and Kashmir", "Ladakh"
  ];

  const imageCount = media.filter(m => m.type === 'image').length;
  const videoCount = media.filter(m => m.type === 'video').length;

  const showBloodlineRegistration = formData.category === "dog" || formData.category === "cat";
  const bloodlineOptions = formData.category === "dog" ? DOG_BLOODLINES : CAT_BLOODLINES;
  const registrationOptions = formData.category === "dog" ? DOG_REGISTRATIONS : CAT_REGISTRATIONS;

  // Get registration board short name for bloodline doc upload label
  const getRegistrationShortName = () => {
    if (!formData.registeredWith) return "";
    return formData.registeredWith.replace(" Registered", "").replace("Not Registered", "");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => navigate("/seller-dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-primary rounded-2xl flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">Add New Pet</span>
              <p className="text-xs text-muted-foreground">Step {currentStep} of {STEPS.length}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-3xl">
        {/* Step Progress */}
        <div className="mb-8 overflow-x-auto">
          <div className="flex items-center gap-2 min-w-max px-2">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <button
                  onClick={() => currentStep > step.id && setCurrentStep(step.id)}
                  disabled={currentStep < step.id}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                    currentStep === step.id ? "bg-primary/10 text-primary"
                      : currentStep > step.id ? "text-success cursor-pointer hover:bg-success/10"
                        : "text-muted-foreground"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    currentStep === step.id ? "bg-gradient-primary text-white"
                      : currentStep > step.id ? "bg-success text-white" : "bg-muted"
                  }`}>
                    {currentStep > step.id ? <CheckCircle className="w-5 h-5" /> : <step.icon className="w-5 h-5" />}
                  </div>
                  <span className="text-xs font-medium whitespace-nowrap">{step.title}</span>
                </button>
                {index < STEPS.length - 1 && (
                  <div className={`w-8 h-0.5 mx-1 ${currentStep > step.id ? "bg-success" : "bg-muted"}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <Card className="border-0 shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {(() => { const StepIcon = STEPS[currentStep - 1].icon; return <StepIcon className="w-5 h-5 text-primary" />; })()}
              {STEPS[currentStep - 1].title}
            </CardTitle>
            <CardDescription>{STEPS[currentStep - 1].description}</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Step 1: Media Upload */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label className="flex items-center gap-2 text-base font-semibold">
                    <Camera className="w-5 h-5 text-primary" />
                    Live Pet Photo * <span className="text-xs font-normal text-destructive">(Required)</span>
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Take a live photo of your pet using your camera. This helps verify that the pet is real.
                  </p>
                  <div className="border-2 border-dashed border-primary/50 rounded-2xl p-6 text-center bg-primary/5">
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (!file.type.startsWith('image/')) { toast.error("Please capture an image"); return; }
                          if (file.size > 10 * 1024 * 1024) { toast.error("Image too large. Max 10MB"); return; }
                          const preview = URL.createObjectURL(file);
                          setLivePetPhoto({ file, preview });
                        }
                      }}
                      className="hidden"
                      id="live-pet-photo"
                    />
                    <label htmlFor="live-pet-photo" className="cursor-pointer">
                      {livePetPhoto ? (
                        <div className="space-y-3">
                          <img src={livePetPhoto.preview} alt="Live Pet" className="w-40 h-40 object-cover mx-auto rounded-2xl border-4 border-success shadow-lg" />
                          <div className="flex items-center justify-center gap-2 text-success">
                            <CheckCircle className="w-5 h-5" />
                            <span className="font-medium">Live photo captured!</span>
                          </div>
                          <Button type="button" variant="outline" size="sm" onClick={(e) => { e.preventDefault(); setLivePetPhoto(null); }} className="rounded-xl">
                            Retake Photo
                          </Button>
                        </div>
                      ) : (
                        <div className="py-4">
                          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Camera className="w-8 h-8 text-primary" />
                          </div>
                          <p className="text-sm font-medium text-primary mb-1">Tap to Open Camera</p>
                          <p className="text-xs text-muted-foreground">Click a live photo of your pet</p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-border"></div>
                  <span className="text-xs text-muted-foreground">Additional Photos & Videos</span>
                  <div className="flex-1 h-px bg-border"></div>
                </div>

                <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                  {media.map((item, index) => (
                    <div key={index} className="relative aspect-square rounded-2xl overflow-hidden group">
                      {item.type === 'image' ? (
                        <img src={item.preview} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <Video className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute top-1 left-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${item.type === 'video' ? 'bg-primary text-white' : 'bg-success text-white'}`}>
                          {item.type === 'video' ? 'Video' : 'Photo'}
                        </span>
                      </div>
                      <button type="button" onClick={() => removeMedia(index)} className="absolute top-1 right-1 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <label className="aspect-square border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors">
                    <input type="file" accept="image/*,video/*" multiple onChange={handleMediaUpload} className="hidden" />
                    <Upload className="w-6 h-6 text-muted-foreground mb-1" />
                    <span className="text-xs text-muted-foreground">Add</span>
                  </label>
                </div>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>{imageCount}/20 photos</span>
                  <span>{videoCount}/2 videos</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Upload up to 20 photos (max 10MB each) and 2 videos (max 50MB each)
                </p>
              </div>
            )}

            {/* Step 2: Basic Info - Restructured Layout (Task A) */}
            {currentStep === 2 && (
              <div className="space-y-4">
                {/* ROW 1: Pet Name + Category */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Pet Name *</Label>
                    <Input id="name" placeholder="Max" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="rounded-2xl" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select value={formData.category} onValueChange={(value: PetCategory) => setFormData({ ...formData, category: value, bloodline: "", registeredWith: "" })}>
                      <SelectTrigger className="rounded-2xl"><SelectValue placeholder="Select category" /></SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (<SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* ROW 2: Breed + Gender */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="breed">Breed *</Label>
                    <Input id="breed" placeholder="Golden Retriever" value={formData.breed} onChange={(e) => setFormData({ ...formData, breed: e.target.value })} className="rounded-2xl" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender *</Label>
                    <Select value={formData.gender} onValueChange={(value: PetGender) => setFormData({ ...formData, gender: value })}>
                      <SelectTrigger className="rounded-2xl"><SelectValue placeholder="Select gender" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Bloodline + Registered With (only for dog/cat) */}
                {showBloodlineRegistration && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Bloodline *</Label>
                      <Select value={formData.bloodline} onValueChange={(value) => setFormData({ ...formData, bloodline: value })}>
                        <SelectTrigger className="rounded-2xl"><SelectValue placeholder="Select bloodline" /></SelectTrigger>
                        <SelectContent>
                          {bloodlineOptions.map((b) => (<SelectItem key={b} value={b}>{b}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Registered With *</Label>
                      <Select value={formData.registeredWith} onValueChange={(value) => setFormData({ ...formData, registeredWith: value })}>
                        <SelectTrigger className="rounded-2xl"><SelectValue placeholder="Select registration" /></SelectTrigger>
                        <SelectContent>
                          {registrationOptions.map((r) => (<SelectItem key={r} value={r}>{r}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {/* ROW 3: Age + Size */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Age with toggle */}
                  <div className="space-y-3">
                    <Label>Age *</Label>
                    <div className="flex rounded-xl border border-border overflow-hidden w-fit">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, ageType: "exact", ageMonths: "" })}
                        className={cn(
                          "px-4 py-1.5 text-sm font-medium transition-all",
                          formData.ageType === "exact" ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"
                        )}
                      >
                        Exact Age
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, ageType: "approximate", birthDate: null })}
                        className={cn(
                          "px-4 py-1.5 text-sm font-medium transition-all",
                          formData.ageType === "approximate" ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"
                        )}
                      >
                        Approximate Age
                      </button>
                    </div>

                    {formData.ageType === "exact" ? (
                      <div className="space-y-2">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className={cn("w-full justify-start text-left font-normal rounded-2xl", !formData.birthDate && "text-muted-foreground")}>
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {formData.birthDate ? format(formData.birthDate, "PPP") : <span>Pick a date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={formData.birthDate || undefined}
                              onSelect={(date) => setFormData({ ...formData, birthDate: date || null })}
                              disabled={(date) => date > new Date() || date < new Date("2010-01-01")}
                              initialFocus
                              className={cn("p-3 pointer-events-auto")}
                            />
                          </PopoverContent>
                        </Popover>
                        {formData.birthDate && (
                          <p className="text-xs text-muted-foreground">
                            Born: {format(formData.birthDate, "dd MMM yyyy")}
                          </p>
                        )}
                      </div>
                    ) : (
                      <Input
                        type="number"
                        placeholder="9"
                        value={formData.ageMonths}
                        onChange={(e) => setFormData({ ...formData, ageMonths: e.target.value })}
                        className="rounded-2xl"
                      />
                    )}
                  </div>

                  {/* Size */}
                  <div className="space-y-2">
                    <Label>Size *</Label>
                    <Select value={formData.size} onValueChange={(value) => setFormData({ ...formData, size: value })}>
                      <SelectTrigger className="rounded-2xl"><SelectValue placeholder="Select size" /></SelectTrigger>
                      <SelectContent>
                        {SIZE_OPTIONS.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* ROW 4: Weight + Color */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="weight">Weight (kg) *</Label>
                    <Input
                      id="weight"
                      type="number"
                      step="0.1"
                      placeholder="2.5"
                      value={formData.weightKg}
                      onChange={(e) => setFormData({ ...formData, weightKg: e.target.value })}
                      className="rounded-2xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="color">Color</Label>
                    <Input id="color" placeholder="Golden" value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })} className="rounded-2xl" />
                  </div>
                </div>

                {/* ROW 5: Description (full width) */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" placeholder="Tell buyers about your pet's personality, habits, and any special traits..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={4} className="rounded-2xl" />
                </div>
              </div>
            )}

            {/* Step 3: Pricing - Task H: Split into Original + Selling Price */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="originalPrice">Original Price (₹)</Label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="originalPrice" type="number" placeholder="20000" value={formData.originalPrice} onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })} className="rounded-2xl pl-10" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price">Selling Price (₹) *</Label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="price" type="number" placeholder="15000" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} className="rounded-2xl pl-10" />
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Set a competitive price based on breed, age, and market rates</p>
              </div>
            )}

            {/* Step 4: Location */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="state">State *</Label>
                  <Select value={formData.state} onValueChange={(value) => setFormData({ ...formData, state: value })}>
                    <SelectTrigger className="rounded-2xl"><SelectValue placeholder="Select state" /></SelectTrigger>
                    <SelectContent>{indianStates.map((state) => (<SelectItem key={state} value={state}>{state}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input id="city" placeholder="Mumbai" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} className="rounded-2xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Full Address *</Label>
                  <Textarea id="location" placeholder="House/Flat No., Street, Area, Landmark..." value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} rows={3} className="rounded-2xl" />
                </div>
              </div>
            )}

            {/* Step 5: Health - Task C: Add Bloodline Documents */}
            {currentStep === 5 && (
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-4 bg-muted/50 rounded-2xl">
                  <Checkbox
                    id="vaccinated"
                    checked={formData.vaccinated}
                    onCheckedChange={(checked) => {
                      setFormData({ ...formData, vaccinated: checked as boolean });
                      if (!checked) { setVaccinationDocs([]); setVaccineEntries([]); }
                    }}
                  />
                  <div className="flex-1">
                    <Label htmlFor="vaccinated" className="cursor-pointer font-medium">Pet is vaccinated</Label>
                    <p className="text-xs text-muted-foreground">Check this if your pet has received vaccinations</p>
                  </div>
                  <Syringe className="w-5 h-5 text-primary" />
                </div>

                {formData.vaccinated && (
                  <>
                    <VaccinationTable entries={vaccineEntries} onAddClick={() => setShowVaccineModal(true)} />
                    <AddVaccineModal open={showVaccineModal} onOpenChange={setShowVaccineModal} onAdd={(entry) => setVaccineEntries((prev) => [...prev, entry])} />
                  </>
                )}

                {/* Bloodline Documents - only for dog/cat with registration */}
                {showBloodlineRegistration && formData.registeredWith && formData.registeredWith !== "Not Registered" && (
                  <div className="space-y-2 animate-fade-in">
                    <Label className="flex items-center gap-2 text-base font-semibold">
                      <FileText className="w-4 h-4 text-primary" />
                      Bloodline Documents
                    </Label>
                    <div className="border-2 border-dashed border-border rounded-2xl p-4">
                      <input type="file" accept="image/*,.pdf" multiple onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        const valid = files.filter(f => { if (f.size > 10 * 1024 * 1024) { toast.error(`${f.name} too large`); return false; } return true; });
                        setBloodlineDocFiles(prev => [...prev, ...valid]);
                      }} className="hidden" id="bloodline-doc-upload" />
                      <label htmlFor="bloodline-doc-upload" className="cursor-pointer block text-center">
                        <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Click to upload {getRegistrationShortName()} certificates</p>
                      </label>
                    </div>
                    {bloodlineDocFiles.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {bloodlineDocFiles.map((doc, i) => (
                          <div key={i} className="flex items-center gap-2 bg-muted rounded-xl px-3 py-2">
                            <FileText className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm truncate max-w-[150px]">{doc.name}</span>
                            <button type="button" onClick={() => setBloodlineDocFiles(prev => prev.filter((_, idx) => idx !== i))} className="w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="microchip">Microchip ID (Optional)</Label>
                  <Input id="microchip" placeholder="Enter microchip ID if available" value={formData.microchip} onChange={(e) => setFormData({ ...formData, microchip: e.target.value })} className="rounded-2xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="medicalHistory">Medical History</Label>
                  <Textarea id="medicalHistory" placeholder="Any known health conditions, allergies, or medical history..." value={formData.medicalHistory} onChange={(e) => setFormData({ ...formData, medicalHistory: e.target.value })} rows={3} className="rounded-2xl" />
                </div>
              </div>
            )}

            {/* Step 6: Documents */}
            {currentStep === 6 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    Other Documents (Optional)
                  </Label>
                  <p className="text-xs text-muted-foreground">Upload pedigree papers, health certificates, or other relevant documents</p>
                  <div className="border-2 border-dashed border-border rounded-2xl p-4">
                    <input type="file" accept="image/*,.pdf" multiple onChange={handleDocumentUpload} className="hidden" id="document-upload" />
                    <label htmlFor="document-upload" className="cursor-pointer block text-center">
                      <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Click to upload documents</p>
                    </label>
                  </div>
                  {documents.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {documents.map((doc, index) => (
                        <div key={index} className="flex items-center gap-2 bg-muted rounded-xl px-3 py-2">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm truncate max-w-[150px]">{doc.name}</span>
                          <button type="button" onClick={() => removeDocument(index)} className="w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 7: Preview */}
            {currentStep === 7 && (
              <div className="space-y-6">
                <div className="grid grid-cols-4 gap-2">
                  {media.slice(0, 4).map((item, index) => (
                    <div key={index} className="aspect-square rounded-xl overflow-hidden">
                      {item.type === 'image' ? (
                        <img src={item.preview} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <Video className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="space-y-3 bg-muted/50 rounded-2xl p-4">
                  <h3 className="font-semibold text-lg">{formData.name}</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-muted-foreground">Category:</span><span className="ml-2 font-medium capitalize">{formData.category}</span></div>
                    <div><span className="text-muted-foreground">Breed:</span><span className="ml-2 font-medium">{formData.breed}</span></div>
                    <div><span className="text-muted-foreground">Gender:</span><span className="ml-2 font-medium capitalize">{formData.gender}</span></div>
                    <div>
                      <span className="text-muted-foreground">Age:</span>
                      <span className="ml-2 font-medium">
                        {formData.ageType === "exact" && formData.birthDate
                          ? `Born ${format(formData.birthDate, "dd MMM yyyy")}`
                          : `${formData.ageMonths} months`
                        }
                      </span>
                    </div>
                    <div><span className="text-muted-foreground">Size:</span><span className="ml-2 font-medium">{formData.size}</span></div>
                    <div><span className="text-muted-foreground">Weight:</span><span className="ml-2 font-medium">{formData.weightKg} kg</span></div>
                    <div><span className="text-muted-foreground">Selling Price:</span><span className="ml-2 font-medium text-primary">₹{parseInt(formData.price).toLocaleString('en-IN')}</span></div>
                    {formData.originalPrice && (
                      <div><span className="text-muted-foreground">Original Price:</span><span className="ml-2 font-medium">₹{parseInt(formData.originalPrice).toLocaleString('en-IN')}</span></div>
                    )}
                    <div><span className="text-muted-foreground">Location:</span><span className="ml-2 font-medium">{formData.city}, {formData.state}</span></div>
                    <div><span className="text-muted-foreground">Vaccinated:</span><span className="ml-2 font-medium">{formData.vaccinated ? 'Yes' : 'No'}</span></div>
                    <div><span className="text-muted-foreground">Media:</span><span className="ml-2 font-medium">{imageCount} photos, {videoCount} videos</span></div>
                    {showBloodlineRegistration && formData.bloodline && (
                      <div><span className="text-muted-foreground">Bloodline:</span><span className="ml-2 font-medium">{formData.bloodline}</span></div>
                    )}
                    {showBloodlineRegistration && formData.registeredWith && (
                      <div><span className="text-muted-foreground">Registration:</span><span className="ml-2 font-medium">{formData.registeredWith}</span></div>
                    )}
                  </div>
                  {formData.description && (
                    <div><span className="text-muted-foreground text-sm">Description:</span><p className="mt-1 text-sm">{formData.description}</p></div>
                  )}
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-3 mt-6">
              {currentStep > 1 && (
                <Button type="button" variant="outline" className="flex-1 rounded-2xl" onClick={handleBack}>
                  <ArrowLeft className="w-4 h-4 mr-2" />Back
                </Button>
              )}
              {currentStep < STEPS.length ? (
                <Button type="button" className="flex-1 rounded-2xl bg-gradient-primary hover:opacity-90" onClick={handleNext}>
                  Next<ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button type="button" className="flex-1 rounded-2xl bg-gradient-primary hover:opacity-90" onClick={handleSubmit} disabled={isLoading}>
                  {isLoading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Publishing...</>) : (<><CheckCircle className="w-4 h-4 mr-2" />Publish Listing</>)}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AddPet;
