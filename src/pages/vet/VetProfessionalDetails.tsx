import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Building2, 
  Hospital, 
  Plus, 
  Check, 
  Loader2, 
  X, 
  Image as ImageIcon, 
  Video as VideoIcon, 
  Upload, 
  Sparkles,
  Info,
  Pencil,
  MapPin,
  User,
  FileText
} from "lucide-react";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import SplashScreen from "@/components/SplashScreen";
import { INDIA_STATES, INDIA_STATES_AND_CITIES } from "@/constants/indiaLocations";

interface VetProfileData {
  id: string;
  user_id: string;
  practice_type: string[] | null;
  self_practice: boolean;
  clinic_name: string | null;
  clinic_address: string | null;
  clinic_pincode: string | null;
  clinic_gst: string | null;
  hospital_name: string | null;
  hospital_role: string | null;
  hospital_address: string | null;
  hospital_pincode: string | null;
  hospital_employee_id: string | null;
  clinic_photos: string[] | null;
  clinic_videos: string[] | null;
  state: string | null;
  city: string | null;
  clinic_shop_license_file: string | null;
  hospital_joining_proof_file: string | null;
}

const VetProfessionalDetails = () => {
  const navigate = useNavigate();
  const { user, isLoading: guardLoading, showSpinner } = useRoleGuard(["vet"], "/auth/vet", true);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // States for practice configuration
  const [practiceType, setPracticeType] = useState<string[]>([]);
  
  // States for Hospital details
  const [hospitalName, setHospitalName] = useState("");
  const [hospitalRole, setHospitalRole] = useState("");
  const [hospitalAddress, setHospitalAddress] = useState("");
  const [hospitalPincode, setHospitalPincode] = useState("");
  const [hospitalEmployeeId, setHospitalEmployeeId] = useState("");
  const [hospitalJoiningProofFile, setHospitalJoiningProofFile] = useState("");

  // States for Clinic details
  const [clinicName, setClinicName] = useState("");
  const [clinicAddress, setClinicAddress] = useState("");
  const [clinicPincode, setClinicPincode] = useState("");
  const [clinicGst, setClinicGst] = useState("");
  const [clinicShopLicenseFile, setClinicShopLicenseFile] = useState("");

  // States for shared fields
  const [state, setState] = useState("");
  const [city, setCity] = useState("");

  // States for media
  const [clinicPhotos, setClinicPhotos] = useState<string[]>([]);
  const [clinicVideos, setClinicVideos] = useState<string[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState<Record<string, boolean>>({});

  const fetchVetData = useCallback(async () => {
    if (!user) return;
    try {
      const { data: vetProfile, error } = await supabase
        .from("vet_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching professional details:", error);
        toast.error("Failed to load professional details.");
      } else if (vetProfile) {
        const typedProfile = vetProfile as unknown as VetProfileData;
        setPracticeType(typedProfile.practice_type || []);
        
        setHospitalName(typedProfile.hospital_name || "");
        setHospitalRole(typedProfile.hospital_role || "");
        setHospitalAddress(typedProfile.hospital_address || "");
        setHospitalPincode(typedProfile.hospital_pincode || "");
        setHospitalEmployeeId(typedProfile.hospital_employee_id || "");
        setHospitalJoiningProofFile(typedProfile.hospital_joining_proof_file || "");

        setClinicName(typedProfile.clinic_name || "");
        setClinicAddress(typedProfile.clinic_address || "");
        setClinicPincode(typedProfile.clinic_pincode || "");
        setClinicGst(typedProfile.clinic_gst || "");
        setClinicShopLicenseFile(typedProfile.clinic_shop_license_file || "");

        setClinicPhotos(typedProfile.clinic_photos || []);
        setClinicVideos(typedProfile.clinic_videos || []);

        setState(typedProfile.state || "");
        setCity(typedProfile.city || "");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchVetData();
    }
  }, [user, fetchVetData]);

  // Helper to obtain full URL for images/videos/docs in Supabase
  const getFileUrl = (path: string) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    return supabase.storage.from("vet-documents").getPublicUrl(path).data.publicUrl;
  };

  const getFileName = (path: string) => {
    if (!path) return "";
    const parts = path.split("/");
    return parts[parts.length - 1];
  };

  // Instant Media Upload to vet-documents bucket
  const uploadClinicFile = async (e: React.ChangeEvent<HTMLInputElement>, mediaType: "photo" | "video") => {
    const files = e.target.files;
    if (!files || files.length === 0 || !user) return;

    if (mediaType === "photo") {
      if (clinicPhotos.length + files.length > 9) {
        toast.error("Limit exceeded: Max 9 total clinic photos allowed.");
        return;
      }
      setUploadingPhoto(true);
    } else {
      if (clinicVideos.length + files.length > 3) {
        toast.error("Limit exceeded: Max 3 total clinic videos allowed.");
        return;
      }
      setUploadingVideo(true);
    }

    try {
      const newPaths: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const ext = file.name.split('.').pop();
        const path = `${user.id}/clinic_${mediaType}_${Date.now()}_${i}.${ext}`;
        
        const { error: uploadError } = await supabase.storage
          .from('vet-documents')
          .upload(path, file, {
            contentType: file.type || undefined,
            upsert: true
          });

        if (uploadError) throw uploadError;
        newPaths.push(path);
      }

      const currentArray = mediaType === "photo" ? clinicPhotos : clinicVideos;
      const updatedArray = [...currentArray, ...newPaths];

      const updateObj = mediaType === "photo" 
        ? { clinic_photos: updatedArray }
        : { clinic_videos: updatedArray };

      const { error: dbError } = await supabase
        .from("vet_profiles")
        .update(updateObj)
        .eq("user_id", user.id);

      if (dbError) throw dbError;

      if (mediaType === "photo") {
        setClinicPhotos(updatedArray);
        toast.success("Clinic photo(s) uploaded successfully!");
      } else {
        setClinicVideos(updatedArray);
        toast.success("Clinic video(s) uploaded successfully!");
      }
      setIsDirty(true);
    } catch (err: unknown) {
      console.error("Error uploading clinic media:", err);
      toast.error(`Upload failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setUploadingPhoto(false);
      setUploadingVideo(false);
      e.target.value = "";
    }
  };

  // Instant Media Deletion from DB array & Storage
  const deleteClinicFile = async (pathToDelete: string, mediaType: "photo" | "video") => {
    if (!user) return;

    try {
      const currentArray = mediaType === "photo" ? clinicPhotos : clinicVideos;
      const updatedArray = currentArray.filter(path => path !== pathToDelete);

      const updateObj = mediaType === "photo" 
        ? { clinic_photos: updatedArray }
        : { clinic_videos: updatedArray };

      const { error: dbError } = await supabase
        .from("vet_profiles")
        .update(updateObj)
        .eq("user_id", user.id);

      if (dbError) throw dbError;

      if (mediaType === "photo") {
        setClinicPhotos(updatedArray);
        toast.success("Clinic photo removed successfully!");
      } else {
        setClinicVideos(updatedArray);
        toast.success("Clinic video removed successfully!");
      }
      setIsDirty(true);

      // Clean up from Supabase Storage
      await supabase.storage.from('vet-documents').remove([pathToDelete]);
    } catch (err: unknown) {
      console.error("Error removing clinic media:", err);
      toast.error(`Remove failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  // File upload for single documents (shop license & joining proof)
  const uploadDocFile = async (e: React.ChangeEvent<HTMLInputElement>, column: "clinic_shop_license_file" | "hospital_joining_proof_file") => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploadingDoc(prev => ({ ...prev, [column]: true }));
    try {
      const ext = file.name.split('.').pop();
      const path = `${user.id}/${column}_${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('vet-documents')
        .upload(path, file, {
          contentType: file.type || undefined,
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase
        .from("vet_profiles")
        .update({ [column]: path })
        .eq("user_id", user.id);

      if (dbError) throw dbError;

      if (column === "clinic_shop_license_file") {
        setClinicShopLicenseFile(path);
      } else {
        setHospitalJoiningProofFile(path);
      }
      setIsDirty(true);
      toast.success("Document uploaded successfully!");
    } catch (err: unknown) {
      console.error(`Error uploading ${column}:`, err);
      toast.error(`Upload failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setUploadingDoc(prev => ({ ...prev, [column]: false }));
      e.target.value = "";
    }
  };

  const deleteDocFile = async (column: "clinic_shop_license_file" | "hospital_joining_proof_file", pathToDelete: string) => {
    if (!user) return;

    try {
      const { error: dbError } = await supabase
        .from("vet_profiles")
        .update({ [column]: null })
        .eq("user_id", user.id);

      if (dbError) throw dbError;

      if (column === "clinic_shop_license_file") {
        setClinicShopLicenseFile("");
      } else {
        setHospitalJoiningProofFile("");
      }
      setIsDirty(true);
      toast.success("Document removed successfully!");

      // Clean up from Supabase Storage
      await supabase.storage.from('vet-documents').remove([pathToDelete]);
    } catch (err: unknown) {
      console.error(`Error removing ${column}:`, err);
      toast.error(`Remove failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  // Save textual and practice type changes
  const handleSaveAllDetails = async () => {
    if (!user) return;

    // Validation
    if (practiceType.length === 0) {
      toast.error("Please select at least one active practice environment.");
      return;
    }

    if (practiceType.includes("Hospital / Organization")) {
      if (!hospitalName.trim() || !hospitalRole.trim() || !hospitalAddress.trim() || !hospitalPincode.trim() || !hospitalEmployeeId.trim()) {
        toast.error("Please fill in all mandatory Hospital details.");
        return;
      }
      if (hospitalPincode.trim().length !== 6) {
        toast.error("Hospital Pincode must be exactly 6 digits.");
        return;
      }
    }

    if (practiceType.includes("Independent Clinic / Practice")) {
      if (!clinicName.trim() || !clinicAddress.trim() || !clinicPincode.trim()) {
        toast.error("Please fill in all mandatory Clinic details.");
        return;
      }
      if (clinicPincode.trim().length !== 6) {
        toast.error("Clinic Pincode must be exactly 6 digits.");
        return;
      }
    }

    if (!state) {
      toast.error("Please select a State.");
      return;
    }

    if (!city) {
      toast.error("Please select a City.");
      return;
    }

    setIsSaving(true);
    try {
      const updatePayload = {
        practice_type: practiceType,
        self_practice: practiceType.includes("Independent Clinic / Practice"),
        
        // Hospital details
        hospital_name: practiceType.includes("Hospital / Organization") ? hospitalName.trim() : null,
        hospital_role: practiceType.includes("Hospital / Organization") ? hospitalRole.trim() : null,
        hospital_address: practiceType.includes("Hospital / Organization") ? hospitalAddress.trim() : null,
        hospital_pincode: practiceType.includes("Hospital / Organization") ? hospitalPincode.trim() : null,
        hospital_employee_id: practiceType.includes("Hospital / Organization") ? hospitalEmployeeId.trim() : null,
        hospital_joining_proof_file: practiceType.includes("Hospital / Organization") ? (hospitalJoiningProofFile || null) : null,

        // Clinic details
        clinic_name: practiceType.includes("Independent Clinic / Practice") ? clinicName.trim() : null,
        clinic_address: practiceType.includes("Independent Clinic / Practice") ? clinicAddress.trim() : null,
        clinic_pincode: practiceType.includes("Independent Clinic / Practice") ? clinicPincode.trim() : null,
        clinic_gst: (practiceType.includes("Independent Clinic / Practice") && clinicGst.trim()) ? clinicGst.trim() : null,
        clinic_shop_license_file: practiceType.includes("Independent Clinic / Practice") ? (clinicShopLicenseFile || null) : null,

        // Shared location fields
        state: state || null,
        city: city || null,
      };

      const { error } = await supabase
        .from("vet_profiles")
        .update(updatePayload)
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success("Professional details updated successfully!");
      setIsDirty(false);
      setIsEditing(false);
      await fetchVetData();
    } catch (err: unknown) {
      console.error("Error saving professional details:", err);
      toast.error(err instanceof Error ? err.message : "Failed to save details.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEditing = () => {
    setIsEditing(false);
    setIsDirty(false);
    fetchVetData();
    toast.info("Changes discarded.");
  };

  if (showSpinner || guardLoading || loading) {
    return <SplashScreen message="Loading professional details..." />;
  }

  const hasHospital = practiceType.includes("Hospital / Organization");
  const hasClinic = practiceType.includes("Independent Clinic / Practice");

  // Helper to render interactive single doc uploads in Edit Mode
  const renderDocUpload = (
    label: string, 
    column: "clinic_shop_license_file" | "hospital_joining_proof_file", 
    currentPath: string
  ) => {
    const isUploading = uploadingDoc[column];
    return (
      <div className="space-y-1.5 w-full">
        <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
          <FileText size={14} className="text-primary" />
          {label}
        </label>
        {currentPath ? (
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
            <div className="flex items-center gap-2 min-w-0">
              <FileText className="w-5 h-5 text-indigo-500 shrink-0" />
              <span className="text-xs font-semibold text-slate-700 truncate max-w-[200px]" title={getFileName(currentPath)}>
                {getFileName(currentPath)}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <a 
                href={getFileUrl(currentPath)} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="px-2.5 py-1 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all text-xs font-bold"
              >
                View
              </a>
              <button
                type="button"
                onClick={() => deleteDocFile(column, currentPath)}
                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Remove File"
              >
                <X size={15} />
              </button>
            </div>
          </div>
        ) : (
          <label className="border-2 border-dashed border-slate-200 hover:border-indigo-500 rounded-xl p-4 flex flex-col items-center justify-center bg-slate-50/50 hover:bg-indigo-50/10 cursor-pointer transition-all">
            <input
              type="file"
              accept="image/*,application/pdf,.pdf"
              disabled={isUploading}
              onChange={(e) => uploadDocFile(e, column)}
              className="hidden"
            />
            {isUploading ? (
              <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
            ) : (
              <>
                <Upload size={20} className="text-slate-400" />
                <span className="text-xs font-bold text-slate-500 mt-1">Upload Document (Image/PDF)</span>
                <span className="text-[10px] text-slate-400 mt-0.5">Max size 5MB</span>
              </>
            )}
          </label>
        )}
      </div>
    );
  };

  return (
    <div className="bg-[#F9FAFC] min-h-screen pb-32 font-sans text-slate-900 selection:bg-indigo-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md px-4 py-4 flex items-center justify-between border-b border-slate-100 shadow-sm">
        <button 
          onClick={() => navigate("/vet/profile")}
          className="p-2 text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-bold text-slate-900">Professional Details</h1>
        
        <div>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
            >
              <Pencil size={12} />
              Edit
            </button>
          ) : (
            <button
              onClick={handleCancelEditing}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
            >
              Cancel
            </button>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-6 space-y-6">
        
        {/* ========================================== */}
        {/*             DISPLAY MODE (READ ONLY)        */}
        {/* ========================================== */}
        {!isEditing && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Banner Card */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-5 border border-indigo-100/60 flex items-start gap-4 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                <Sparkles size={24} className="animate-pulse" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-[15px]">Practice Profile</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed font-medium">
                  This details your clinics, organization affiliations, documents, and media. Customers view these verification parameters on your public card.
                </p>
              </div>
            </div>

            {/* Practice Types summary */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
              <h3 className="font-extrabold text-slate-800 text-xs sm:text-sm uppercase tracking-wider">Active Practices</h3>
              {practiceType.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No active environments selected. Click 'Edit' above to configure.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {practiceType.map((type, idx) => (
                    <span 
                      key={idx} 
                      className={`text-[11px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm ${
                        type.includes("Hospital") 
                          ? "bg-pink-50 text-pink-700 border border-pink-100" 
                          : "bg-indigo-50 text-indigo-700 border border-indigo-100"
                      }`}
                    >
                      {type.includes("Hospital") ? <Hospital size={12} /> : <Building2 size={12} />}
                      {type}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Hospital Read-only details */}
            {hasHospital && (
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
                  <div className="w-8 h-8 rounded-lg bg-pink-50 flex items-center justify-center text-pink-500 shrink-0">
                    <Hospital size={16} />
                  </div>
                  <h3 className="font-extrabold text-slate-800 text-sm">Hospital / Organization Details</h3>
                </div>

                <div className="space-y-3.5 text-xs sm:text-sm">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-0.5">Hospital Name</span>
                    <span className="font-semibold text-slate-800">{hospitalName || "Not specified"}</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-0.5">Your Role / Designation</span>
                    <span className="font-semibold text-slate-800">{hospitalRole || "Not specified"}</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-0.5">Hospital Address</span>
                    <span className="font-semibold text-slate-800 leading-relaxed block">{hospitalAddress || "Not specified"}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-0.5">State</span>
                      <span className="font-semibold text-slate-800">{state || "Not specified"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-0.5">City</span>
                      <span className="font-semibold text-slate-800">{city || "Not specified"}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-0.5">Pincode</span>
                      <span className="font-semibold text-slate-800 font-mono">{hospitalPincode || "Not specified"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-0.5">Employee ID</span>
                      <span className="font-semibold text-slate-800 font-mono">{hospitalEmployeeId || "Not specified"}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-50">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-1">Joining Proof / ID</span>
                    {hospitalJoiningProofFile ? (
                      <a 
                        href={getFileUrl(hospitalJoiningProofFile)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-2 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 text-indigo-600 font-bold text-xs transition-colors"
                      >
                        <FileText size={14} />
                        <span className="truncate max-w-[200px]">{getFileName(hospitalJoiningProofFile)}</span>
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400 italic font-medium">No document uploaded</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Independent Clinic Read-only details */}
            {hasClinic && (
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-5">
                <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500 shrink-0">
                    <Building2 size={16} />
                  </div>
                  <h3 className="font-extrabold text-slate-800 text-sm">Independent Clinic Details</h3>
                </div>

                <div className="space-y-4 text-xs sm:text-sm">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-0.5">Clinic Name</span>
                    <span className="font-semibold text-slate-800">{clinicName || "Not specified"}</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-0.5">Clinic Address</span>
                    <span className="font-semibold text-slate-800 leading-relaxed block">{clinicAddress || "Not specified"}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-0.5">State</span>
                      <span className="font-semibold text-slate-800">{state || "Not specified"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-0.5">City</span>
                      <span className="font-semibold text-slate-800">{city || "Not specified"}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-0.5">Pincode</span>
                      <span className="font-semibold text-slate-800 font-mono">{clinicPincode || "Not specified"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-0.5">GST Number</span>
                      <span className="font-semibold text-slate-800 font-mono uppercase">{clinicGst || "Not provided"}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-50">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-1">Shop & Establishment License</span>
                    {clinicShopLicenseFile ? (
                      <a 
                        href={getFileUrl(clinicShopLicenseFile)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-2 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 text-indigo-600 font-bold text-xs transition-colors"
                      >
                        <FileText size={14} />
                        <span className="truncate max-w-[200px]">{getFileName(clinicShopLicenseFile)}</span>
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400 italic font-medium">No document uploaded</span>
                    )}
                  </div>

                  {/* GALLERY NESTED INSIDE THE INDEPENDENT CLINIC DETAILS */}
                  <div className="pt-4 border-t border-slate-100 space-y-4">
                    <div>
                      <h4 className="font-bold text-slate-800 text-xs sm:text-sm flex items-center gap-1.5">
                        <ImageIcon size={14} className="text-indigo-500" />
                        Clinic Photos ({clinicPhotos.length})
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Interior/exterior images of your medical facility</p>
                    </div>

                    {clinicPhotos.length === 0 ? (
                      <p className="text-xs text-slate-400 italic bg-slate-50 p-4 rounded-xl text-center">No photos uploaded yet</p>
                    ) : (
                      <div className="grid grid-cols-3 gap-2 pt-1">
                        {clinicPhotos.map((path, idx) => (
                          <a 
                            key={`display-photo-${idx}`} 
                            href={getFileUrl(path)} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="aspect-square rounded-xl bg-slate-50 border border-slate-100 overflow-hidden shadow-sm hover:opacity-90 active:scale-95 transition-all block relative"
                          >
                            <img
                              src={getFileUrl(path)}
                              alt={`Clinic Tour ${idx + 1}`}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </a>
                        ))}
                      </div>
                    )}

                    <div className="pt-2 border-t border-slate-50 space-y-2">
                      <div>
                        <h4 className="font-bold text-slate-800 text-xs sm:text-sm flex items-center gap-1.5">
                          <VideoIcon size={14} className="text-emerald-500" />
                          Clinic Video Tours ({clinicVideos.length})
                        </h4>
                      </div>

                      {clinicVideos.length === 0 ? (
                        <p className="text-xs text-slate-400 italic bg-slate-50 p-4 rounded-xl text-center">No video tours uploaded yet</p>
                      ) : (
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          {clinicVideos.map((path, idx) => (
                            <div key={`display-vid-${idx}`} className="aspect-video rounded-xl bg-slate-900 border border-slate-200 overflow-hidden shadow-sm">
                              <video
                                src={getFileUrl(path)}
                                controls
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================== */}
        {/*               EDIT MODE (FORM INTERACTIVE) */}
        {/* ========================================== */}
        {isEditing && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
            {/* Elegant Selector */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] space-y-4">
              <div>
                <h3 className="font-extrabold text-slate-900 text-[15px]">Select Practice Type</h3>
                <p className="text-xs text-slate-400 font-medium">Choose environments where you consult currently</p>
              </div>
              
              <div className="space-y-3 pt-1">
                {/* Hospital Checkbox */}
                <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-150 hover:bg-slate-50/50 cursor-pointer transition-all select-none">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-pink-50 flex items-center justify-center text-pink-500">
                      <Hospital size={18} />
                    </div>
                    <div>
                      <span className="font-bold text-slate-800 text-xs sm:text-sm">Hospital / Organization</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5 font-medium">Staff affiliation or institutional consults</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={hasHospital}
                    onChange={(e) => {
                      setIsDirty(true);
                      if (e.target.checked) {
                        setPracticeType(prev => [...prev, "Hospital / Organization"]);
                      } else {
                        setPracticeType(prev => prev.filter(p => p !== "Hospital / Organization"));
                      }
                    }}
                    className="w-5 h-5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                  />
                </label>

                {/* Clinic Checkbox */}
                <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-150 hover:bg-slate-50/50 cursor-pointer transition-all select-none">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500">
                      <Building2 size={18} />
                    </div>
                    <div>
                      <span className="font-bold text-slate-800 text-xs sm:text-sm">Independent Clinic / Practice</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5 font-medium">Owner or practitioner at private facility</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={hasClinic}
                    onChange={(e) => {
                      setIsDirty(true);
                      if (e.target.checked) {
                        setPracticeType(prev => [...prev, "Independent Clinic / Practice"]);
                      } else {
                        setPracticeType(prev => prev.filter(p => p !== "Independent Clinic / Practice"));
                      }
                    }}
                    className="w-5 h-5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"
                  />
                </label>
              </div>
            </div>

            {/* Hospital Form fields */}
            {hasHospital && (
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <div className="w-7 h-7 rounded-lg bg-pink-50 flex items-center justify-center text-pink-500">
                    <Hospital size={15} />
                  </div>
                  <h3 className="font-extrabold text-slate-800 text-sm">Hospital / Organization Details</h3>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-extrabold text-slate-600">Hospital Name <span className="text-pink-500">*</span></label>
                    <input
                      type="text"
                      placeholder="Enter hospital name"
                      value={hospitalName}
                      onChange={e => { setHospitalName(e.target.value); setIsDirty(true); }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs sm:text-sm font-semibold focus:outline-none focus:border-indigo-500 focus:bg-white transition-all text-slate-800"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-extrabold text-slate-600">Your Role / Designation <span className="text-pink-500">*</span></label>
                    <input
                      type="text"
                      placeholder="e.g. Veterinarian, Consultant, Surgeon"
                      value={hospitalRole}
                      onChange={e => { setHospitalRole(e.target.value); setIsDirty(true); }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs sm:text-sm font-semibold focus:outline-none focus:border-indigo-500 focus:bg-white transition-all text-slate-800"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-extrabold text-slate-600">Hospital Address <span className="text-pink-500">*</span></label>
                    <textarea
                      rows={2}
                      placeholder="Enter hospital address"
                      value={hospitalAddress}
                      onChange={e => { setHospitalAddress(e.target.value); setIsDirty(true); }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs sm:text-sm font-semibold focus:outline-none focus:border-indigo-500 focus:bg-white transition-all text-slate-800"
                    />
                  </div>

                  {/* State & City selectors directly within Hospital card */}
                  <div className="grid grid-cols-2 gap-3.5">
                    {/* State */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600">State <span className="text-pink-500">*</span></label>
                      <select
                        value={state}
                        onChange={e => {
                          setState(e.target.value);
                          setCity(""); 
                          setIsDirty(true);
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs sm:text-sm font-semibold focus:outline-none focus:border-indigo-500 focus:bg-white transition-all text-slate-800"
                      >
                        <option value="">Select State</option>
                        {INDIA_STATES.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>

                    {/* City */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600">City <span className="text-pink-500">*</span></label>
                      <select
                        value={city}
                        onChange={e => {
                          setCity(e.target.value);
                          setIsDirty(true);
                        }}
                        disabled={!state}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs sm:text-sm font-semibold focus:outline-none focus:border-indigo-500 focus:bg-white transition-all text-slate-800 disabled:opacity-50"
                      >
                        <option value="">{state ? "Select City" : "Select State first"}</option>
                        {state && (INDIA_STATES_AND_CITIES[state as keyof typeof INDIA_STATES_AND_CITIES] || []).map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-extrabold text-slate-600">Pincode <span className="text-pink-500">*</span></label>
                      <input
                        type="text"
                        placeholder="6-digit pincode"
                        maxLength={6}
                        value={hospitalPincode}
                        onChange={e => { setHospitalPincode(e.target.value.replace(/\D/g, "")); setIsDirty(true); }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs sm:text-sm font-semibold focus:outline-none focus:border-indigo-500 focus:bg-white transition-all text-slate-800"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-extrabold text-slate-600">Employee ID / Job ID <span className="text-pink-500">*</span></label>
                      <input
                        type="text"
                        placeholder="Employee code / id"
                        value={hospitalEmployeeId}
                        onChange={e => { setHospitalEmployeeId(e.target.value); setIsDirty(true); }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs sm:text-sm font-semibold focus:outline-none focus:border-indigo-500 focus:bg-white transition-all text-slate-800"
                      />
                    </div>
                  </div>

                  {/* Joining proof upload */}
                  <div className="pt-2">
                    {renderDocUpload("Joining Proof / ID Document", "hospital_joining_proof_file", hospitalJoiningProofFile)}
                  </div>
                </div>
              </div>
            )}

            {/* Clinic Form fields */}
            {hasClinic && (
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500">
                    <Building2 size={15} />
                  </div>
                  <h3 className="font-extrabold text-slate-800 text-sm">Independent Clinic Details</h3>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-extrabold text-slate-600">Clinic / Practice Name <span className="text-pink-500">*</span></label>
                    <input
                      type="text"
                      placeholder="Enter clinic name"
                      value={clinicName}
                      onChange={e => { setClinicName(e.target.value); setIsDirty(true); }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs sm:text-sm font-semibold focus:outline-none focus:border-indigo-500 focus:bg-white transition-all text-slate-800"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-extrabold text-slate-600">Clinic Address <span className="text-pink-500">*</span></label>
                    <textarea
                      rows={2}
                      placeholder="Enter complete clinic address"
                      value={clinicAddress}
                      onChange={e => { setClinicAddress(e.target.value); setIsDirty(true); }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs sm:text-sm font-semibold focus:outline-none focus:border-indigo-500 focus:bg-white transition-all text-slate-800"
                    />
                  </div>

                  {/* State & City selectors directly within Clinic card */}
                  <div className="grid grid-cols-2 gap-3.5">
                    {/* State */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600">State <span className="text-pink-500">*</span></label>
                      <select
                        value={state}
                        onChange={e => {
                          setState(e.target.value);
                          setCity(""); 
                          setIsDirty(true);
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs sm:text-sm font-semibold focus:outline-none focus:border-indigo-500 focus:bg-white transition-all text-slate-800"
                      >
                        <option value="">Select State</option>
                        {INDIA_STATES.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>

                    {/* City */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600">City <span className="text-pink-500">*</span></label>
                      <select
                        value={city}
                        onChange={e => {
                          setCity(e.target.value);
                          setIsDirty(true);
                        }}
                        disabled={!state}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs sm:text-sm font-semibold focus:outline-none focus:border-indigo-500 focus:bg-white transition-all text-slate-800 disabled:opacity-50"
                      >
                        <option value="">{state ? "Select City" : "Select State first"}</option>
                        {state && (INDIA_STATES_AND_CITIES[state as keyof typeof INDIA_STATES_AND_CITIES] || []).map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-extrabold text-slate-600">Pincode <span className="text-pink-500">*</span></label>
                      <input
                        type="text"
                        placeholder="6-digit pincode"
                        maxLength={6}
                        value={clinicPincode}
                        onChange={e => { setClinicPincode(e.target.value.replace(/\D/g, "")); setIsDirty(true); }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs sm:text-sm font-semibold focus:outline-none focus:border-indigo-500 focus:bg-white transition-all text-slate-800"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-extrabold text-slate-600">GST Number (Optional)</label>
                      <input
                        type="text"
                        placeholder="GST No."
                        value={clinicGst}
                        onChange={e => { setClinicGst(e.target.value.toUpperCase()); setIsDirty(true); }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs sm:text-sm font-semibold focus:outline-none focus:border-indigo-500 focus:bg-white transition-all text-slate-800"
                      />
                    </div>
                  </div>

                  {/* Shop license upload */}
                  <div className="pt-2">
                    {renderDocUpload("Shop & Establishment License (Optional)", "clinic_shop_license_file", clinicShopLicenseFile)}
                  </div>

                  {/* CLINIC GALLERY MEDIA (NESTED INSIDE INDEPENDENT CLINIC IN EDIT MODE TOO) */}
                  <div className="pt-4 border-t border-slate-100 space-y-4">
                    <div>
                      <h4 className="font-bold text-slate-800 text-xs sm:text-sm flex items-center gap-1.5">
                        <ImageIcon size={14} className="text-indigo-500" />
                        Clinic Photos ({clinicPhotos.length} / 9)
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Upload images to showcase interior & exterior design</p>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {clinicPhotos.map((path, idx) => (
                        <div key={`photo-${idx}`} className="relative aspect-square rounded-xl bg-slate-50 border border-slate-200 overflow-hidden group shadow-sm">
                          <img
                            src={getFileUrl(path)}
                            alt={`Clinic Photo ${idx + 1}`}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <button
                            type="button"
                            onClick={() => deleteClinicFile(path, "photo")}
                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-md"
                            title="Remove Photo"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}

                      {clinicPhotos.length < 9 && (
                        <label className="aspect-square rounded-xl border border-dashed border-slate-200 hover:border-indigo-500 flex flex-col items-center justify-center bg-slate-50 hover:bg-indigo-50/10 cursor-pointer transition-all">
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            disabled={uploadingPhoto}
                            onChange={(e) => uploadClinicFile(e, "photo")}
                            className="hidden"
                          />
                          {uploadingPhoto ? (
                            <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
                          ) : (
                            <>
                              <Upload size={18} className="text-slate-400" />
                              <span className="text-[9px] font-extrabold text-slate-400 mt-1">Add Photo</span>
                            </>
                          )}
                        </label>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-100 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-slate-800 text-xs sm:text-sm flex items-center gap-1.5">
                          <VideoIcon size={14} className="text-emerald-500" />
                          Clinic Video Tour ({clinicVideos.length} / 3)
                        </h4>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {clinicVideos.map((path, idx) => (
                          <div key={`video-${idx}`} className="relative aspect-video rounded-xl bg-slate-900 border border-slate-250 overflow-hidden group shadow-sm flex items-center justify-center">
                            <video
                              src={getFileUrl(path)}
                              controls
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                            <button
                              type="button"
                              onClick={() => deleteClinicFile(path, "video")}
                              className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-md z-10"
                              title="Remove Video"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}

                        {clinicVideos.length < 3 && (
                          <label className="aspect-video rounded-xl border border-dashed border-slate-200 hover:border-indigo-500 flex flex-col items-center justify-center bg-slate-50 hover:bg-indigo-50/10 cursor-pointer transition-all">
                            <input
                              type="file"
                              accept="video/*"
                              multiple
                              disabled={uploadingVideo}
                              onChange={(e) => uploadClinicFile(e, "video")}
                              className="hidden"
                            />
                            {uploadingVideo ? (
                              <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
                            ) : (
                              <>
                                <VideoIcon size={18} className="text-slate-400" />
                                <span className="text-[9px] font-extrabold text-slate-400 mt-1">Add Video</span>
                              </>
                            )}
                          </label>
                        )}
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            )}
          </div>
        )}

      </main>

      {/* Floating Sticky Save/Discard Bar (Only shown in EDIT mode if modified or dirty) */}
      {isEditing && (
        <div className="fixed bottom-0 left-0 w-full bg-white border-t border-slate-200/80 p-4 shadow-[0_-8px_30px_rgba(0,0,0,0.06)] flex justify-center z-50 animate-in fade-in slide-in-from-bottom-4 duration-350">
          <div className="w-full max-w-2xl flex gap-3">
            <button
              onClick={handleCancelEditing}
              disabled={isSaving}
              className="flex-1 py-3.5 border border-slate-200 text-slate-600 font-extrabold rounded-2xl text-xs sm:text-sm hover:bg-slate-50 transition-colors active:scale-98 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveAllDetails}
              disabled={isSaving}
              className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-2xl text-xs sm:text-sm transition-all active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2 shadow-md shadow-indigo-200"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check size={16} />
              )}
              Save Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VetProfessionalDetails;
