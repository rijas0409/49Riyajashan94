import { AdminData } from "@/pages/AdminDashboard";
import { useState, useEffect } from "react";
import { Search, CheckCircle2, XCircle, Eye, Star, X, FileText, Phone, Mail, MapPin, Clock, Calendar, CreditCard, Stethoscope, HeartPulse, Camera, GraduationCap, Building, ChevronRight, AlertCircle, Sunrise, Sun, Moon, Check, Video, HeartHandshake, ShieldCheck, User, Briefcase, Home, Dog, Cat, Bird } from "lucide-react";

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
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SafeImage } from "../SafeImage";

interface Props {
  data: AdminData;
  actions: any;
}

const DocViewer = ({ label, url, onOpenPreview }: { label: string; url: string | null; onOpenPreview: (label: string, url: string) => void }) => {
  const getFullUrl = (u: string) => {
    if (!u) return "";
    if (u.startsWith("http")) return u;
    return supabase.storage.from("vet-documents").getPublicUrl(u).data.publicUrl;
  };

  if (!url) return (
    <div className="flex items-center gap-2 p-3 bg-[hsl(0,50%,97%)] rounded-xl border border-[hsl(0,40%,90%)]">
      <FileText className="w-4 h-4 text-[hsl(0,50%,60%)]" />
      <span className="text-sm text-[hsl(0,50%,50%)]">{label}: Not uploaded</span>
    </div>
  );
  
  const fullUrl = getFullUrl(url);
  const isImage = fullUrl.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i);
  
  return (
    <div className="rounded-xl border border-[hsl(220,20%,90%)] overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-[hsl(220,20%,97%)]">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-[hsl(220,80%,50%)]" />
          <span className="text-sm font-medium text-[hsl(220,20%,25%)]">{label}</span>
        </div>
        <button onClick={() => onOpenPreview(label, fullUrl)} className="text-[11px] font-medium text-[hsl(220,80%,50%)] hover:underline">Open Full</button>
      </div>
      {isImage ? (
        <SafeImage src={fullUrl} alt={label} onClick={() => onOpenPreview(label, fullUrl)} className="w-full max-h-[200px] cursor-pointer hover:opacity-90" />
      ) : (
        <div className="p-4 bg-[hsl(220,20%,98%)] text-center">
          <button onClick={() => onOpenPreview(label, fullUrl)} className="text-sm text-[hsl(220,80%,50%)] hover:underline">View Document ↗</button>
        </div>
      )}
    </div>
  );
};

const InfoRow = ({ icon: Icon, label, value }: { icon: any; label: string; value: string | null | undefined }) => (
  <div className="flex items-start gap-3 py-2">
    <Icon className="w-4 h-4 text-[hsl(220,15%,55%)] mt-0.5 shrink-0" />
    <div>
      <p className="text-[11px] text-[hsl(220,15%,60%)] uppercase tracking-wide">{label}</p>
      <p className="text-sm font-medium text-[hsl(220,20%,15%)]">{value || "Not provided"}</p>
    </div>
  </div>
);

const DetailItem = ({ label, value }: { label: string; value: string | null | undefined }) => (
  <div className="space-y-0.5">
    <p className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider">{label}</p>
    <p className="text-xs sm:text-sm font-extrabold text-[#1E293B] truncate">{value || "—"}</p>
  </div>
);

const AdminVets = ({ data, actions }: Props) => {
  const [activeTab, setActiveTab] = useState<"all" | "pending">("all");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedVet, setSelectedVet] = useState<any>(null);
  const [rejectionTarget, setRejectionTarget] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [isEditingDocs, setIsEditingDocs] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [previewDoc, setPreviewDoc] = useState<{label: string, url: string} | null>(null);
  const { toast } = useToast();
  const [selectedAvailDay, setSelectedAvailDay] = useState<string>("Mon");

  const renderReviewFile = (url: string | null, label: string) => {
    return (
      <DocViewer 
        label={label} 
        url={url} 
        onOpenPreview={(lbl, u) => setPreviewDoc({ label: lbl, url: u })} 
      />
    );
  };

  useEffect(() => {
    if (selectedVet?.available_days?.length > 0) {
      setSelectedAvailDay(selectedVet.available_days[0]);
    } else {
      setSelectedAvailDay("Mon");
    }
  }, [selectedVet]);

  const filtered = data.allVets.filter((v: any) => {
    const displayName = v.profile?.name || v.profile?.full_name || "Doctor";
    const matchSearch = !search || displayName.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || v.verification_status === filter;
    return matchSearch && matchFilter;
  });

  const pendingVets = data.pendingVets;

  const handleStatusChange = async (vet: any, newStatus: string, reason?: string) => {
    if (newStatus === "failed" && !reason) {
      setRejectionTarget(vet);
      return;
    }

    setUpdatingStatus(vet.user_id);
    try {
      if (newStatus === "verified") {
        await actions.approveVet(vet.user_id);
      } else if (newStatus === "failed") {
        await actions.rejectVet(vet.user_id, reason);
      } else {
        // Handle other status changes (suspended, pending)
        const { error: error1 } = await supabase.from("profiles").update({ 
          is_admin_approved: false 
        }).eq("id", vet.user_id);

        const { error: error2 } = await supabase.from("vet_profiles").update({ 
          verification_status: newStatus as any,
          is_active: newStatus === "verified"
        }).eq("user_id", vet.user_id);
        
        if (error1 || error2) throw error1 || error2;
        toast({ title: `Status Updated to ${newStatus}` });
        // Let the realtime listener handle the refresh or call it explicitly
      }
      
      setSelectedVet(null);
      setRejectionTarget(null);
    } catch (err: any) {
      toast({ title: "Update Failed", description: err.message, variant: "destructive" });
    } finally {
      setUpdatingStatus(null);
      setRejectionReason("");
    }
  };

  const getVetPhotoUrl = (v: any) => {
    const photo = v.profile_photo || v.profile?.profile_photo;
    if (!photo) return null;
    if (photo.startsWith("http")) return photo;
    return supabase.storage.from("vet-documents").getPublicUrl(photo).data.publicUrl;
  };

  const handleEditSave = async () => {
    try {
      setUpdatingStatus(selectedVet.user_id);
      const { error } = await supabase.from('vet_profiles').update({
        qualification: editForm.qualification,
        online_fee: editForm.online_fee,
        offline_fee: editForm.offline_fee,
        years_of_experience: editForm.years_of_experience,
      }).eq('id', selectedVet.id);
      
      if (error) throw error;
      toast({ title: "Vet Details Updated" });
      setIsEditingDocs(false);
      setSelectedVet({ ...selectedVet, ...editForm });
      actions.fetchData(true);
    } catch (err: any) {
      toast({ title: "Save Failed", description: err.message, variant: "destructive" });
    } finally {
      setUpdatingStatus(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[28px] font-bold text-[hsl(220,20%,15%)]">Veterinary Management</h1>
          <p className="text-sm text-[hsl(220,15%,55%)] mt-1">Manage all registered veterinary doctors</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-[hsl(220,20%,94%)] p-1 rounded-xl w-fit mb-8">
        <button 
          onClick={() => setActiveTab("all")}
          className={`px-6 py-2 text-sm font-semibold rounded-lg transition-all ${
            activeTab === 'all' 
              ? 'bg-white text-[hsl(220,80%,50%)] shadow-sm' 
              : 'text-[hsl(220,15%,50%)] hover:text-[hsl(220,20%,15%)]'
          }`}
        >
          All Veterinarians
        </button>
        <button 
          onClick={() => setActiveTab("pending")}
          className={`px-6 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${
            activeTab === 'pending' 
              ? 'bg-white text-[hsl(220,80%,50%)] shadow-sm' 
              : 'text-[hsl(220,15%,50%)] hover:text-[hsl(220,20%,15%)]'
          }`}
        >
          Pending Verification
          {pendingVets.length > 0 && (
            <span className="px-1.5 py-0.5 bg-[hsl(0,75%,55%)] text-white text-[10px] rounded-full">
              {pendingVets.length}
            </span>
          )}
        </button>
      </div>

      {/* Overview Stats (Optional, could add here) */}

      {/* Rejection Reason Modal */}
      {rejectionTarget && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50" onClick={() => setRejectionTarget(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md m-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <h3 className="text-lg font-bold text-[hsl(220,20%,15%)] mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-destructive" />
                Reason for Rejection
              </h3>
              <p className="text-sm text-[hsl(220,15%,55%)] mb-4">Please provide a clear reason why Dr. {rejectionTarget.profile?.name}'s application is being rejected.</p>
              <textarea 
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Medical license is expired, Registration number invalid..."
                className="w-full min-h-[120px] p-4 bg-[hsl(220,20%,97%)] border border-[hsl(220,20%,92%)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(0,70%,50%)]/20"
              />
            </div>
            <div className="border-t border-[hsl(220,20%,92%)] px-6 py-4 flex justify-end gap-3">
              <button onClick={() => setRejectionTarget(null)} className="px-5 py-2.5 border border-[hsl(220,20%,85%)] text-[hsl(220,15%,40%)] text-sm font-medium rounded-xl hover:bg-[hsl(220,20%,96%)] transition-colors">
                Cancel
              </button>
              <button 
                disabled={!rejectionReason.trim()}
                onClick={() => handleStatusChange(rejectionTarget, "failed", rejectionReason)} 
                className="px-5 py-2.5 bg-destructive text-white text-sm font-medium rounded-xl hover:bg-destructive/90 transition-colors disabled:opacity-50"
              >
                Reject Doctor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Vet Detail Modal */}
      {selectedVet && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50" onClick={() => setSelectedVet(null)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-[hsl(220,20%,92%)] px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <div>
                <h2 className="text-lg font-bold text-[hsl(220,20%,15%)]">Vet Application Review</h2>
                <p className="text-[12px] text-[hsl(220,15%,55%)]">Applied {new Date(selectedVet.created_at).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-2">
                {isEditingDocs ? (
                  <button onClick={handleEditSave} disabled={!!updatingStatus} className="px-3 py-1 bg-green-500 text-white rounded font-medium text-sm hover:bg-green-600 disabled:opacity-50">
                    {updatingStatus === selectedVet?.user_id ? "Saving..." : "Save"}
                  </button>
                ) : (
                  <button onClick={() => { setIsEditingDocs(true); setEditForm(selectedVet); }} className="px-3 py-1 bg-blue-500 text-white rounded font-medium text-sm hover:bg-blue-600">
                    Edit Info
                  </button>
                )}
                <button onClick={() => setSelectedVet(null)} className="w-8 h-8 rounded-lg bg-[hsl(220,20%,96%)] flex items-center justify-center hover:bg-[hsl(220,20%,92%)]">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6 font-sans">
              {isEditingDocs && (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-2 text-xs text-amber-800 animate-fade-in shadow-3xs">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-amber-600" />
                  <div>
                    <p className="font-extrabold uppercase tracking-wide text-[10px]">Easy Edit Mode Enabled</p>
                    <p className="font-semibold text-[11px] opacity-90 mt-0.5">As an Administrator, you can adjust the basic qualification, experience years, and base consultation fees. Other sections are locked for accurate auditing.</p>
                  </div>
                </div>
              )}

              {/* Personal Info */}
              <div className="bg-white border border-[#F1F5F9] p-4 sm:p-5 rounded-3xl shadow-xs transition-colors hover:border-[#E4E8F0]">
                <div className="flex items-center gap-3 pb-3.5 border-b border-slate-100/60">
                  <div className="w-10 h-10 rounded-xl bg-pink-50/80 border border-pink-100 flex items-center justify-center shrink-0">
                    <User className="w-5 h-5 text-pink-600" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm sm:text-base text-[#1E293B] tracking-tight">Personal Info</h3>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Primary Profile Details</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-col sm:flex-row gap-5 items-start">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden bg-[hsl(220,20%,94%)] border border-[hsl(220,20%,88%)] shrink-0 shadow-3xs self-center sm:self-start">
                    {getVetPhotoUrl(selectedVet) ? (
                      <SafeImage src={getVetPhotoUrl(selectedVet)!} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><Camera className="w-8 h-8 text-[hsl(220,15%,70%)]" /></div>
                    )}
                  </div>
                  <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-3.5 w-full">
                    <DetailItem label="Profile Photo" value={getVetPhotoUrl(selectedVet) ? "Uploaded" : "No photo uploaded"} />
                    <DetailItem label="Full Name" value={selectedVet.profile?.name || "Doctor"} />
                    <DetailItem label="Email ID" value={selectedVet.profile?.email} />
                    <DetailItem label="Phone Number" value={selectedVet.profile?.phone} />
                    <DetailItem label="Date of Birth" value={selectedVet.profile?.birth_date} />
                    <DetailItem label="Gender" value={selectedVet.profile?.gender} />
                    <DetailItem label="Language" value={selectedVet.preferred_language || (selectedVet.preferred_languages && selectedVet.preferred_languages.join(", "))} />
                    <div />
                    <div className="col-span-2">
                      <DetailItem label="Home / Profile Address" value={selectedVet.profile?.address || selectedVet.clinic_address || selectedVet.hospital_address} />
                    </div>
                    <DetailItem label="City" value={selectedVet.city || selectedVet.profile?.city} />
                    <DetailItem label="State" value={selectedVet.state || selectedVet.profile?.state} />
                  </div>
                </div>
              </div>

              {/* Identity Verification */}
              <div className="bg-white border border-[#F1F5F9] p-4 sm:p-5 rounded-3xl shadow-xs transition-colors hover:border-[#E4E8F0]">
                <div className="flex items-center gap-3 pb-3.5 border-b border-slate-100/60">
                  <div className="w-10 h-10 rounded-xl bg-teal-50/80 border border-teal-100 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm sm:text-base text-[#1E293B] tracking-tight">Identity Verification</h3>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Government IDs & Verification Media</p>
                  </div>
                </div>
                <div className="mt-4 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-tight block">Aadhaar Card (Front)</span>
                      {renderReviewFile(selectedVet.govt_id_file, "Aadhaar Card (Front)")}
                    </div>
                    <div className="space-y-1.5">
                      <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-tight block">Aadhaar Card (Back)</span>
                      {renderReviewFile(selectedVet.pan_card_file, "Aadhaar Card (Back)")}
                    </div>
                  </div>
                  <div className="space-y-1.5 border-t border-slate-100/50 pt-3.5">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-tight block">Live Photo</span>
                    {renderReviewFile(selectedVet.passport_photo_file, "Live Photo image")}
                  </div>
                </div>
              </div>

              {/* Professional Qualification */}
              <div className="bg-white border border-[#F1F5F9] p-4 sm:p-5 rounded-3xl shadow-xs transition-colors hover:border-[#E4E8F0]">
                <div className="flex items-center gap-3 pb-3.5 border-b border-slate-100/60">
                  <div className="w-10 h-10 rounded-xl bg-violet-50/80 border border-violet-100 flex items-center justify-center shrink-0">
                    <GraduationCap className="w-5 h-5 text-violet-600" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm sm:text-base text-[#1E293B] tracking-tight">Professional Qualification</h3>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Certifications & Licensing details</p>
                  </div>
                </div>
                <div className="mt-4 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {isEditingDocs ? (
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide">Highest Qualification</span>
                        <input 
                          type="text" 
                          value={editForm.qualification || ''} 
                          onChange={e => setEditForm({...editForm, qualification: e.target.value})} 
                          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm bg-white font-extrabold text-[#1E293B]" 
                        />
                      </div>
                    ) : (
                      <DetailItem label="Highest Qualification" value={selectedVet.qualification} />
                    )}
                    <DetailItem label="Vet License / Council Registration Number" value={selectedVet.registration_number || "Not uploaded"} />
                    <DetailItem label="Veterinary Degree Certificate" value={selectedVet.vet_degree_file ? "Attached Below" : "N/A"} />
                  </div>
                  
                  <div className="space-y-1.5 border-t border-slate-100/50 pt-3.5">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-tight block">Veterinary Degree Certificate</span>
                    {renderReviewFile(selectedVet.vet_degree_file, `Degree Certificate (${selectedVet.qualification})`)}
                  </div>

                  {/* Primary Qualification */}
                  <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/40 space-y-3 mt-1 shadow-3xs">
                    <h4 className="text-xs font-black text-violet-700 uppercase tracking-wider">Primary Qualification</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <DetailItem label="Qualification" value={selectedVet.education_details?.[0]?.qualification || selectedVet.qualification} />
                      <DetailItem label="Passing Year" value={selectedVet.education_details?.[0]?.year || "N/A"} />
                      <DetailItem label="Institution/University" value={selectedVet.education_details?.[0]?.institution || "N/A"} />
                    </div>
                    {selectedVet.education_details?.[0]?.certificate_url && (
                      <div className="space-y-1.5 border-t border-slate-150/55 pt-3 mt-2">
                        <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-tight block">Certificate File</span>
                        {renderReviewFile(selectedVet.education_details[0].certificate_url, "Primary Qualification Certificate")}
                      </div>
                    )}
                  </div>

                  {/* Additional Qualification */}
                  {selectedVet.education_details && selectedVet.education_details.length > 1 && (
                    selectedVet.education_details.slice(1).map((edu: any, idx: number) => (
                      <div key={idx} className="border border-slate-110 rounded-2xl p-4 bg-slate-50/40 space-y-3 mt-1 shadow-3xs">
                        <h4 className="text-xs font-black text-violet-700 uppercase tracking-wider">Additional Qualification #{idx + 1}</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <DetailItem label="Qualification" value={edu.qualification} />
                          <DetailItem label="Passing Year" value={edu.year || "N/A"} />
                          <DetailItem label="Institution/University" value={edu.institution || "N/A"} />
                        </div>
                        {edu.certificate_url && (
                          <div className="space-y-1.5 border-t border-slate-150/55 pt-3 mt-2">
                            <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-tight block">Certificate File</span>
                            {renderReviewFile(edu.certificate_url, `Additional Qualification #${idx + 1} Certificate`)}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Professional Practice */}
              {(() => {
                const parsedPracticeTypes = selectedVet.practice_type || [];
                const hasClinic = parsedPracticeTypes.some((t: string) => t.toLowerCase().includes('clinic') || t.toLowerCase().includes('practice') || t.toLowerCase().includes('private')) || !!selectedVet.clinic_name || !!selectedVet.self_practice;
                const hasHospital = parsedPracticeTypes.some((t: string) => t.toLowerCase().includes('hospital') || t.toLowerCase().includes('organization') || t.toLowerCase().includes('work')) || !!selectedVet.hospital_name;

                return (
                  <div className="bg-white border border-[#F1F5F9] p-4 sm:p-5 rounded-3xl shadow-xs transition-all">
                    <div className="flex items-center gap-3 pb-3.5 border-b border-slate-100/60">
                      <div className="w-10 h-10 rounded-xl bg-blue-50/80 border border-blue-100 flex items-center justify-center shrink-0">
                        <Building className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-sm sm:text-base text-[#1E293B] tracking-tight">Professional Practice</h3>
                        <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Active medical practice centers</p>
                      </div>
                    </div>
                    <div className="mt-4 space-y-5">
                      <div className="space-y-1.5">
                        <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Where do you practice?</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-1.5 font-sans">
                      <div className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center gap-2.5 transition-all shadow-3xs ${
                        hasHospital 
                          ? "border-pink-350 bg-pink-50/45 text-pink-950 ring-1 ring-pink-100" 
                          : "border-slate-100 bg-slate-50/40 text-slate-400 opacity-60"
                      }`}>
                        <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${hasHospital ? 'border-pink-500 bg-pink-100' : 'border-slate-200 bg-white'}`}>
                          {hasHospital && <div className="w-1.5 h-1.5 rounded-full bg-pink-500" />}
                        </div>
                        <span>Hospital / Organization (Hospital/work)</span>
                      </div>
                      <div className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center gap-2.5 transition-all shadow-3xs ${
                        hasClinic 
                          ? "border-blue-200 bg-blue-50/45 text-blue-950 ring-1 ring-blue-100" 
                          : "border-slate-100 bg-slate-50/40 text-slate-400 opacity-60"
                      }`}>
                        <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${hasClinic ? 'border-blue-500 bg-blue-100' : 'border-slate-200 bg-white'}`}>
                          {hasClinic && <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                        </div>
                        <span>Independent Clinic / Practice (Private clinic)</span>
                      </div>
                    </div>
                      </div>

                      {/* Independent Clinic details */}
                      {hasClinic && (
                        <div className="space-y-3.5 bg-slate-50/40 p-4 rounded-2xl border border-slate-100/70 shadow-3xs">
                          <h4 className="text-xs font-extrabold text-blue-800 uppercase tracking-wider border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
                            <Building className="w-4 h-4 text-blue-600" />
                            <span>A) Independent Clinic Details</span>
                          </h4>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                            <DetailItem label="Clinic/Practice Name" value={selectedVet.clinic_name} />
                            <DetailItem label="State" value={selectedVet.state || selectedVet.profile?.state} />
                            <DetailItem label="City" value={selectedVet.city || selectedVet.profile?.city} />
                            <DetailItem label="Pincode" value={selectedVet.clinic_pincode} />
                            <DetailItem label="GST Number (Optional)" value={selectedVet.clinic_gst} />
                            <div className="col-span-2">
                              <DetailItem label="Clinic Address" value={selectedVet.clinic_address} />
                            </div>
                          </div>

                          {/* Clinic Photos Array Preview */}
                          {selectedVet.clinic_photos && selectedVet.clinic_photos.length > 0 && (
                            <div className="pt-3.5 border-t border-slate-100/60 mt-1">
                              <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wide block mb-2">Practice Photos & Videos</p>
                              <div className="flex flex-wrap gap-2">
                                {selectedVet.clinic_photos.map((url: string, idx: number) => {
                                  const fullUrl = url.startsWith("http") ? url : supabase.storage.from("vet-documents").getPublicUrl(url).data.publicUrl;
                                  return (
                                    <div key={idx} className="relative w-16 h-16 rounded-xl border border-slate-200 overflow-hidden bg-white hover:border-slate-400 cursor-pointer shadow-3xs" onClick={() => setPreviewDoc({ label: `Practice Photo #${idx+1}`, url: fullUrl })}>
                                      <SafeImage src={fullUrl} className="w-full h-full object-cover" />
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Shop License document */}
                          {selectedVet.clinic_shop_license_file && (
                            <div className="space-y-1.5 border-t border-slate-100/60 pt-3.5 mt-1.5">
                              <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-tight block">Shop & Establishment License</p>
                              {renderReviewFile(selectedVet.clinic_shop_license_file, "Shop & Establishment License Certificate")}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Hospital details */}
                      {hasHospital && (
                        <div className="space-y-3.5 bg-slate-50/40 p-4 rounded-2xl border border-slate-100/70 shadow-3xs">
                          <h4 className="text-xs font-extrabold text-pink-800 uppercase tracking-wider border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
                            <Stethoscope className="w-4 h-4 text-pink-600" />
                            <span>B) Hospital/Organization Details</span>
                          </h4>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                            <DetailItem label="Hospital / Organization Name" value={selectedVet.hospital_name} />
                            <DetailItem label="Your Role / Designation" value={selectedVet.hospital_role} />
                            <DetailItem label="State" value={selectedVet.state || selectedVet.profile?.state} />
                            <DetailItem label="City" value={selectedVet.city || selectedVet.profile?.city} />
                            <DetailItem label="Pincode" value={selectedVet.hospital_pincode} />
                            <DetailItem label="Employee ID" value={selectedVet.hospital_employee_id} />
                            <div className="col-span-2">
                              <DetailItem label="Hospital Address" value={selectedVet.hospital_address} />
                            </div>
                          </div>

                          {/* Joining Proof Document */}
                          {selectedVet.hospital_joining_proof_file && (
                            <div className="space-y-1.5 border-t border-slate-100/60 pt-3.5 mt-1.5">
                              <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-tight block">Joining Proof/ID Document</p>
                              {renderReviewFile(selectedVet.hospital_joining_proof_file, "Hospital ID Card / Office Joining Proof")}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Availability & Fees */}
              {(() => {
                // Surcharge parameters calculation
                const surchargeParams = (() => {
                  const parsedClinicFee = parseFloat(isEditingDocs ? editForm.online_fee : selectedVet.online_fee) || 0;
                  const parsedHomeFee = parseFloat(isEditingDocs ? editForm.offline_fee : selectedVet.offline_fee) || 0;
                  const isCityTier1 = ["mumbai", "delhi", "bangalore", "pune", "hyderabad", "chennai", "kolkata"].some(c => (selectedVet.city || selectedVet.profile?.city || "").toLowerCase().includes(c));
                  const weeklyAvailability = selectedVet.weekly_availability || {};
                  const dDays = selectedVet.available_days || [];
                  const daysCount = dDays.length || 1;
                  const activeNightSlots = Object.values(weeklyAvailability).reduce((acc: number, d: any) => acc + (d?.night?.slots?.length || 0), 0);
                  
                  const getPct = (type: 'clinic' | 'home') => {
                    let pct = 9; // baseline 9%
                    if (daysCount <= 2) pct += 3;
                    else if (daysCount <= 4) pct += 1.5;
                    
                    if (activeNightSlots > 2) pct += 1;
                    if (type === 'home') pct += 1.5;
                    if (isCityTier1) pct += 1;
                    return Math.min(14, Math.max(9, Math.round(pct)));
                  };

                  const dynamicClinicSurchargePct = getPct('clinic');
                  const dynamicHomeSurchargePct = getPct('home');

                  const calculatedClinicSurchargeAmt = Math.round((parsedClinicFee * dynamicClinicSurchargePct) / 100);
                  const calculatedHomeSurchargeAmt = Math.round((parsedHomeFee * dynamicHomeSurchargePct) / 100);
                  const calculatedClinicTotal = parsedClinicFee + calculatedClinicSurchargeAmt;
                  const calculatedHomeTotal = parsedHomeFee + calculatedHomeSurchargeAmt;
                  const isNightSlotEnabled = Object.values(weeklyAvailability).some((d: any) => d?.night?.enabled);

                  return {
                    parsedClinicFee,
                    parsedHomeFee,
                    calculatedClinicSurchargeAmt,
                    calculatedHomeSurchargeAmt,
                    calculatedClinicTotal,
                    calculatedHomeTotal,
                    isNightSlotEnabled
                  };
                })();

                const selectedSpecs = selectedVet.specializations || [];
                const isSpecSelected = (name: string) => {
                  return selectedSpecs.some((s: string) => s.toLowerCase() === name.toLowerCase()) || selectedSpecs.includes(name);
                };

                const rawConsultTypes = selectedVet.consultation_type || selectedVet.consultation_types || '';
                const parsedConsultTypes = Array.isArray(rawConsultTypes) 
                  ? rawConsultTypes 
                  : (typeof rawConsultTypes === 'string' ? rawConsultTypes.split(',').map((s: string) => s.trim()) : []);
                const isConsultTypeSelected = (name: string) => {
                  return parsedConsultTypes.some((s: string) => s.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(s.toLowerCase()));
                };

                return (
                  <div className="bg-white border border-[#F1F5F9] p-4 sm:p-5 rounded-3xl shadow-xs transition-all space-y-6">
                    <div className="flex items-center gap-3 pb-3.5 border-b border-slate-100/60">
                      <div className="w-10 h-10 rounded-xl bg-orange-50/80 border border-orange-100 flex items-center justify-center shrink-0">
                        <Calendar className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-sm sm:text-base text-[#1E293B] tracking-tight">Availability & Fees</h3>
                        <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Weekly coverage & pricing details</p>
                      </div>
                    </div>

                    {/* A) Specializations */}
                    <div className="space-y-2">
                      <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider font-sans block">A) Specializations</span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {[
                          { name: "Dog", icon: Dog },
                          { name: "Cat", icon: Cat },
                          { name: "Bird", icon: Bird },
                          { name: "Hamster", icon: HamsterIcon }
                        ].map(({ name, icon: Icon }) => {
                          const isSelected = isSpecSelected(name);
                          return (
                            <div
                              key={name}
                              className={`flex items-center gap-2 px-3 py-2.5 rounded-2xl border text-xs font-bold transition-all shadow-3xs ${
                                isSelected 
                                  ? "border-pink-350 bg-pink-50/45 text-pink-950 font-extrabold" 
                                  : "border-slate-100 bg-slate-50/40 text-slate-400 opacity-60"
                              }`}
                            >
                              <Icon className={`w-4 h-4 ${isSelected ? "text-pink-500" : "text-slate-300"}`} />
                              <span>{name}</span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-pink-600 ml-auto stroke-[2.5]" />}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* A.1) Medical Specializations */}
                    {(() => {
                      const medSpecs = selectedVet.medical_specializations as Record<string, { primary?: string; secondary?: string[] }> | null;
                      if (!medSpecs || typeof medSpecs !== "object") return null;
                      
                      const specs = Object.keys(medSpecs).filter(k => {
                        const item = medSpecs[k];
                        return item && item.primary;
                      });
                      
                      if (specs.length === 0) return null;
                      
                      return (
                        <div className="space-y-3 pt-1">
                          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider font-sans block">A.1) Medical Specializations</span>
                          <div className="space-y-2">
                            {specs.map(spec => {
                              const med = medSpecs[spec];
                              if (!med || !med.primary) return null;
                              return (
                                <div key={spec} className="bg-slate-50/60 rounded-2xl p-3 border border-slate-100 space-y-1.5">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-extrabold text-[#8A1550]">{spec} Specialization:</span>
                                  </div>
                                  <div className="flex flex-wrap gap-2 pt-1">
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-pink-300 bg-pink-50 text-pink-700 text-xs font-bold">
                                      <span className="w-1.5 h-1.5 rounded-full bg-pink-500"></span>
                                      <span>{med.primary} (Primary)</span>
                                    </div>
                                    {(med.secondary || []).map((sec: string) => (
                                      <div key={sec} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-slate-200 bg-white text-slate-600 text-xs font-semibold">
                                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                                        <span>{sec} (Secondary)</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}

                    {/* A.2) Clinical Expertise */}
                    {(selectedVet.clinical_expertise || []).length > 0 && (
                      <div className="space-y-2 pt-1">
                        <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider font-sans block">A.2) Clinical Expertise</span>
                        <div className="flex flex-wrap gap-2">
                          {(selectedVet.clinical_expertise || []).map((tag: string) => (
                            <div
                              key={tag}
                              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-pink-200 bg-pink-50/50 text-pink-900 text-xs font-bold transition-all shadow-2xs font-sans"
                            >
                              <span>{tag}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* B) Consultation types */}
                    <div className="space-y-2 pt-1">
                      <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider font-sans block">B) Consultation Types</span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        {[
                          { name: "In-clinic Visit", icon: Briefcase },
                          { name: "Home Visit", icon: Home },
                          { name: "Video Consultation", icon: Video }
                        ].filter(({ name }) => isConsultTypeSelected(name))
                        .map(({ name, icon: Icon }) => (
                            <div
                              key={name}
                              className="flex items-center gap-2 px-3 py-2.5 rounded-2xl border text-xs font-bold transition-all shadow-3xs border-blue-200 bg-blue-50/45 text-blue-950 font-extrabold"
                            >
                              <Icon className="w-4 h-4 text-blue-500" />
                              <span>{name}</span>
                              <Check className="w-3.5 h-3.5 text-blue-600 ml-auto stroke-[2.5]" />
                            </div>
                        ))}
                      </div>
                    </div>

                    {/* C) Years of Practice */}
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider font-sans block">C) Years of Practice</span>
                      <div className="inline-flex items-center gap-2 bg-[#FAF9FF]/80 px-3.5 py-2 rounded-2xl border border-slate-150/60 font-sans shadow-3xs text-xs">
                        <GraduationCap className="w-4.5 h-4.5 text-[#8A1550]" strokeWidth={2.5} />
                        <span className="font-extrabold text-[#8A1550]/80">Practice Experience:</span>
                        {isEditingDocs ? (
                          <input 
                            type="number" 
                            value={editForm.years_of_experience || ''} 
                            onChange={e => setEditForm({...editForm, years_of_experience: e.target.value})} 
                            className="border border-slate-200 rounded px-2 py-0.5 bg-white text-xs w-16" 
                          />
                        ) : (
                          <span className="font-black text-[#1E293B]">{selectedVet.years_of_experience || "None"} Years of Active Practice</span>
                        )}
                      </div>
                    </div>

                    {/* D) Availability & Shifts */}
                    {selectedVet.weekly_availability ? (
                      <div className="space-y-3 pt-1">
                        <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider font-sans block">D) Availability & Shifts</span>
                        <div className="border border-slate-100 bg-[#FAF9FF]/80 p-1.5 rounded-2xl flex flex-wrap gap-1.5 font-sans">
                          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => {
                            const isChosen = selectedAvailDay === d;
                            const isAvailable = selectedVet.available_days?.includes(d);
                            const isSunday = d === "Sun";
                            
                            return (
                              <button
                                key={d}
                                type="button"
                                onClick={() => setSelectedAvailDay(d)}
                                className={`flex-1 min-w-[50px] py-2 rounded-xl font-bold text-xs text-center transition-all flex flex-col items-center gap-0.5 relative ${
                                  isChosen 
                                    ? "bg-[#8A1550] text-white shadow-3xs" 
                                    : isAvailable
                                      ? isSunday 
                                        ? "bg-rose-50 text-rose-600 hover:bg-rose-100/90 border border-rose-200/40"
                                        : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/50"
                                      : isSunday
                                        ? "bg-rose-50/30 text-rose-300 border border-dashed border-rose-100/30"
                                        : "bg-slate-50/50 text-slate-400 border border-dashed border-slate-200/60"
                                }`}
                              >
                                <span>{d}</span>
                                {isAvailable && !isChosen && (
                                  <div className="w-1 h-1 rounded-full bg-emerald-400" />
                                )}
                              </button>
                            );
                          })}
                        </div>

                        {/* Shifts Details */}
                        <div className="space-y-3 font-sans">
                          {(["morning", "afternoon", "evening", "night"] as const).map(periodKey => {
                            const periodInfo = {
                              morning: { label: "Morning", hours: "09:00 AM - 01:00 PM", bg: "bg-emerald-50/45 border-emerald-100 text-emerald-800", icon: <Sunrise className="w-4 h-4 text-emerald-600" strokeWidth={2.5} /> },
                              afternoon: { label: "Afternoon", hours: "01:00 PM - 04:00 PM", bg: "bg-amber-50/45 border-amber-100 text-amber-850", icon: <Sun className="w-4 h-4 text-amber-600" strokeWidth={2.5} /> },
                              evening: { label: "Evening", hours: "04:00 PM - 08:00 PM", bg: "bg-indigo-50/45 border-[#E2E1FF] text-indigo-950", icon: <Moon className="w-4 h-4 text-indigo-600" strokeWidth={2.5} /> },
                              night: { label: "Night", hours: "08:00 PM - 12:00 AM", bg: "bg-pink-50/45 border-pink-100 text-pink-950", icon: <Moon className="w-4 h-4 text-pink-600" strokeWidth={2.5} /> }
                            }[periodKey];

                            const dayData = selectedVet.weekly_availability[selectedAvailDay];
                            const periodAvailability = dayData ? dayData[periodKey] : { enabled: false, slots: [] };
                            const isEnabled = periodAvailability?.enabled;

                            return (
                              <div 
                                key={periodKey} 
                                className={`flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3.5 p-3 border rounded-2xl transition-all ${
                                  isEnabled 
                                    ? "border-slate-110 bg-[#FAFAFC] shadow-3xs" 
                                    : "border-slate-100 bg-slate-50/30 opacity-60"
                                }`}
                              >
                                <div className={`flex items-center gap-2 py-1.5 px-3 rounded-xl border w-full md:w-[145px] shrink-0 ${periodInfo.bg}`}>
                                  <div className="shrink-0 font-bold">{periodInfo.icon}</div>
                                  <div className="flex flex-col min-w-0">
                                    <span className="font-extrabold text-[#1E293B] text-xs tracking-tight truncate">{periodInfo.label}</span>
                                    {isEnabled && (
                                      <span className="text-[9px] font-semibold opacity-75 truncate leading-tight block text-slate-500 font-sans">
                                        {periodInfo.hours}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="flex-1 flex flex-row flex-wrap items-center gap-2 min-w-0 px-1">
                                  {isEnabled && periodAvailability.slots && periodAvailability.slots.map((slot: any, sIdx: number) => {
                                    const time = typeof slot === 'string' ? slot : slot.time;
                                    const location = typeof slot === 'object' ? slot.location : null;
                                    
                                    return (
                                      <div 
                                        key={`${time}-${sIdx}`} 
                                        className="flex flex-col gap-0.5 bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-[10px] font-bold text-slate-700 shadow-3xs shrink-0"
                                      >
                                        <span>{time}</span>
                                        {location && (
                                          <span className="text-[8px] text-[#EC4899] font-black uppercase tracking-tight">{location}</span>
                                        )}
                                      </div>
                                    );
                                  })}
                                  {isEnabled && (!periodAvailability.slots || periodAvailability.slots.length === 0) && (
                                    <span className="text-slate-400 font-semibold text-xs italic">No specific slots created</span>
                                  )}
                                  {!isEnabled && (
                                    <span className="text-slate-400 font-semibold text-xs italic">Disabled for {selectedAvailDay}</span>
                                  )}
                                </div>

                                <div className="shrink-0 flex items-center pr-2">
                                  <span className={`text-[10px] font-extrabold uppercase tracking-wide px-2.5 py-1 rounded-full ${
                                    isEnabled ? "bg-emerald-50 text-emerald-800 border border-emerald-100/60 font-extrabold" : "bg-slate-100 text-slate-400"
                                  }`}>
                                    {isEnabled ? "Active" : "Inactive"}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider font-sans block">Availability & Shifts</span>
                        <p className="text-slate-400 text-xs italic">No weekly schedule configuration specified.</p>
                      </div>
                    )}

                    {/* E) Consultation Fees */}
                    <div className="space-y-3.5 pt-3.5 border-t border-slate-100 mt-1">
                      <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider font-sans block">E) Consultation Fees (₹)</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-3.5 rounded-2xl border border-slate-100 bg-[#FBFBFE]/80 flex items-center justify-between shadow-3xs">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center">
                              <Briefcase className="w-4 h-4 text-purple-600" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-slate-800 font-sans">In-clinic Visit Fee</span>
                              <span className="text-[9px] text-slate-400 font-medium">At your clinic</span>
                            </div>
                          </div>
                          {isEditingDocs ? (
                            <input 
                              type="number" 
                              value={editForm.online_fee || ''} 
                              onChange={e => setEditForm({...editForm, online_fee: e.target.value})} 
                              className="border border-slate-200 rounded px-2 py-1 text-center bg-white text-xs font-extrabold w-16" 
                            />
                          ) : (
                            <span className="text-[#1E293B] font-black text-sm sm:text-base">₹{surchargeParams.parsedClinicFee}</span>
                          )}
                        </div>

                        <div className="p-3.5 rounded-2xl border border-slate-100 bg-[#FFFDFE]/80 flex items-center justify-between shadow-3xs">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-pink-50 flex items-center justify-center">
                              <Home className="w-4 h-4 text-[#EC4899]" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-slate-800 font-sans">Home Visit Fee</span>
                              <span className="text-[9px] text-slate-400 font-medium">At pet parent's home</span>
                            </div>
                          </div>
                          {isEditingDocs ? (
                            <input 
                              type="number" 
                              value={editForm.offline_fee || ''} 
                              onChange={e => setEditForm({...editForm, offline_fee: e.target.value})} 
                              className="border border-slate-200 rounded px-2 py-1 text-center bg-white text-xs font-extrabold w-16" 
                            />
                          ) : (
                            <span className="text-[#1E293B] font-black text-sm sm:text-base">₹{surchargeParams.parsedHomeFee}</span>
                          )}
                        </div>
                      </div>

                      {/* Night Surcharge Rate indicator removed per requirement */}
                    </div>

                    {/* F) Emergency & Support Services */}
                    <div className="space-y-2 pt-3.5 border-t border-slate-100 mt-1">
                      <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider font-sans block">F) Emergency & Support Services</span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <div className={`p-3 rounded-2xl border font-sans text-xs flex flex-col justify-between h-20 shadow-3xs ${
                          (selectedVet.emergency_available === 'yes' || selectedVet.emergency_available === true) ? "border-emerald-200 bg-emerald-50/20" : "border-slate-100 bg-slate-50/50"
                        }`}>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Emergency Readiness</span>
                          <div className="flex items-center gap-1.5 mt-2">
                            {(selectedVet.emergency_available === 'yes' || selectedVet.emergency_available === true) ? (
                              <><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /><span className="font-extrabold text-emerald-950">Available</span></>
                            ) : (
                              <><CheckCircle2 className="w-4 h-4 text-slate-300 shrink-0" /><span className="font-extrabold text-slate-400">Not Available</span></>
                            )}
                          </div>
                        </div>

                        <div className={`p-3 rounded-2xl border font-sans text-xs flex flex-col justify-between h-20 shadow-3xs ${
                          (selectedVet.weekend_availability === 'yes' || selectedVet.weekend_availability === true) ? "border-pink-200 bg-pink-50/20" : "border-slate-100 bg-slate-50/50"
                        }`}>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Weekend Availability</span>
                          <div className="flex items-center gap-1.5 mt-2">
                            {(selectedVet.weekend_availability === 'yes' || selectedVet.weekend_availability === true) ? (
                              <><CheckCircle2 className="w-4 h-4 text-[#EC4899] shrink-0" /><span className="font-extrabold text-[#8A1550]">Active</span></>
                            ) : (
                              <><CheckCircle2 className="w-4 h-4 text-slate-300 shrink-0" /><span className="font-extrabold text-slate-400">Offline</span></>
                            )}
                          </div>
                        </div>

                        <div className={`p-3 rounded-2xl border font-sans text-xs flex flex-col justify-between h-20 shadow-3xs ${
                          (selectedVet.support_24x7 === 'yes' || selectedVet.support_24x7 === true) ? "border-purple-200 bg-purple-50/20" : "border-slate-100 bg-slate-50/50"
                        }`}>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">24x7 Support</span>
                          <div className="flex items-center gap-1.5 mt-2">
                            {(selectedVet.support_24x7 === 'yes' || selectedVet.support_24x7 === true) ? (
                              <><CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" /><span className="font-extrabold text-purple-950 font-sans">Active</span></>
                            ) : (
                              <><CheckCircle2 className="w-4 h-4 text-slate-300 shrink-0" /><span className="font-extrabold text-slate-400 font-sans">Standard hours</span></>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Review Profile (Agreements & Consent) */}
              <div className="bg-white border border-[#F1F5F9] p-4 sm:p-5 rounded-3xl shadow-xs transition-colors hover:border-[#E4E8F0]">
                <div className="flex items-center gap-3 pb-3.5 border-b border-slate-100/60">
                  <div className="w-10 h-10 rounded-xl bg-amber-50/80 border border-amber-100 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm sm:text-base text-[#1E293B] tracking-tight">Review Profile</h3>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Onboarding terms & signed certifications</p>
                  </div>
                </div>
                <div className="mt-4 space-y-4">
                  <div>
                    <h4 className="text-xs font-black text-amber-700 uppercase tracking-widest leading-wide">Agreements & Consent</h4>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-4 bg-[#F8F9FC]/80 border border-slate-100 rounded-2xl shadow-3xs">
                      <Check className="w-4 h-4 text-emerald-600 stroke-[2.5] mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-black text-slate-800 leading-tight">Vendor Agreement</p>
                        <p className="text-[10px] text-slate-400 font-semibold mt-1">I accept the Vendor/Service Agreement</p>
                        <span className="inline-flex items-center gap-1 mt-1.5 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-extrabold rounded-lg border border-emerald-100/60">Accepted & Signed</span>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3 p-4 bg-[#F8F9FC]/80 border border-slate-100 rounded-2xl shadow-3xs">
                      <Check className="w-4 h-4 text-emerald-600 stroke-[2.5] mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-black text-slate-800 leading-tight">Terms & Conditions</p>
                        <p className="text-[10px] text-slate-400 font-semibold mt-1">I accept the Terms & Conditions and confirm all information is accurate</p>
                        <span className="inline-flex items-center gap-1 mt-1.5 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-extrabold rounded-lg border border-emerald-100/60">Confirmed</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-4 bg-[#F8F9FC]/80 border border-slate-100 rounded-2xl shadow-3xs">
                      <Check className="w-4 h-4 text-emerald-600 stroke-[2.5] mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-black text-slate-800 leading-tight">Telemedicine Consultation Consent</p>
                        <p className="text-[10px] text-slate-400 font-semibold mt-1">I consent to provide Telemedicine Consultations via this platform</p>
                        <span className="inline-flex items-center gap-1 mt-1.5 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-extrabold rounded-lg border border-emerald-100/60 font-sans">Consent Granted</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Master Documents Vault */}
              <div className="bg-white border border-[#F1F5F9] p-4 sm:p-5 rounded-3xl shadow-xs transition-colors hover:border-[#E4E8F0]">
                <div className="flex items-center gap-3 pb-3.5 border-b border-slate-100/60 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-50/80 border border-slate-100 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-slate-600" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm sm:text-base text-[#1E293B] tracking-tight">Verification Documents Vault</h3>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{
                      [
                        selectedVet.vet_degree_file,
                        selectedVet.govt_id_file,
                        selectedVet.pan_card_file,
                        selectedVet.passport_photo_file,
                        selectedVet.clinic_registration_file,
                        selectedVet.clinic_shop_license_file,
                        selectedVet.gst_certificate_file,
                        selectedVet.clinic_address_proof_file,
                        selectedVet.cancelled_cheque_file,
                        selectedVet.hospital_joining_proof_file,
                        selectedVet.profile_photo || selectedVet.profile?.profile_photo
                      ].filter(Boolean).length
                    } Document certificates uploaded</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { label: "Veterinary Degree Certificate (Step 3)", url: selectedVet.vet_degree_file },
                    { label: "Aadhaar Card (Front Side) (Step 2)", url: selectedVet.govt_id_file },
                    { label: "Aadhaar Card (Back) / PAN (Step 2)", url: selectedVet.pan_card_file },
                    { label: "Verification Live Photo (Step 2)", url: selectedVet.passport_photo_file },
                    { label: "Clinic Registration Certificate (Step 4)", url: selectedVet.clinic_registration_file },
                    { label: "Shop & Establishment License (Step 4)", url: selectedVet.clinic_shop_license_file },
                    { label: "GST Certificate File (Step 4)", url: selectedVet.gst_certificate_file },
                    { label: "Clinic Address Proof Document (Step 4)", url: selectedVet.clinic_address_proof_file },
                    { label: "Settlement Cancelled Cheque (Step 4)", url: selectedVet.cancelled_cheque_file },
                    { label: "Hospital ID Card / Proof (Step 4)", url: selectedVet.hospital_joining_proof_file },
                    { label: "Doctor Portfolio Photo (Primary)", url: selectedVet.profile_photo || selectedVet.profile?.profile_photo }
                  ].filter(doc => !!doc.url).map((doc, idx) => (
                    <DocViewer key={idx} label={doc.label} url={doc.url} onOpenPreview={(label, url) => setPreviewDoc({label, url})} />
                  ))}
                </div>
              </div>
            </div>

            {/* Action Footer */}
            {selectedVet.verification_status === "pending" && (
              <div className="sticky bottom-0 bg-white border-t border-[hsl(220,20%,92%)] px-6 py-4 flex justify-end gap-3 rounded-b-2xl">
                <button onClick={() => handleStatusChange(selectedVet, "failed")} className="px-6 py-2.5 border border-[hsl(0,60%,70%)] text-[hsl(0,65%,50%)] text-sm font-medium rounded-xl hover:bg-[hsl(0,60%,97%)] flex items-center gap-2">
                  <XCircle className="w-4 h-4" /> Reject Application
                </button>
                <button onClick={() => handleStatusChange(selectedVet, "verified")} className="px-6 py-2.5 bg-[hsl(145,55%,42%)] text-white text-sm font-medium rounded-xl hover:bg-[hsl(145,55%,38%)] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Approve Vet
                </button>
              </div>
            )}
            {selectedVet.verification_status !== "pending" && (
              <div className="sticky bottom-0 bg-white border-t border-[hsl(220,20%,92%)] px-6 py-4 flex justify-end gap-3 rounded-b-2xl">
                <div className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 ${
                  selectedVet.verification_status === 'verified' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {selectedVet.verification_status === 'verified' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                  Status: {selectedVet.verification_status.toUpperCase()}
                </div>
                <button onClick={() => setSelectedVet(null)} className="px-6 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50">
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4" onClick={() => setPreviewDoc(null)}>
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-[hsl(220,20%,92%)]">
              <h3 className="font-bold text-[hsl(220,20%,15%)]">{previewDoc.label}</h3>
              <button onClick={() => setPreviewDoc(null)} className="w-8 h-8 rounded-lg bg-[hsl(220,20%,96%)] flex items-center justify-center hover:bg-[hsl(220,20%,92%)]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-auto bg-gray-100 flex items-center justify-center p-4">
              {previewDoc.url.match(/\.(jpg|jpeg|png|gif|webp)(\?|$)/i) ? (
                <SafeImage src={previewDoc.url} alt={previewDoc.label} className="max-w-full max-h-full" />
              ) : (
                <iframe src={previewDoc.url} className="w-full h-full min-h-[60vh]" title={previewDoc.label} referrerPolicy="no-referrer" />
              )}
            </div>
          </div>
        </div>
      )}
      {activeTab === "pending" ? (
        <div className="space-y-6">
          {pendingVets.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[hsl(220,20%,92%)] p-12 text-center">
              <div className="w-16 h-16 bg-[hsl(145,50%,95%)] rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-[hsl(145,55%,45%)]" />
              </div>
              <h3 className="text-lg font-bold text-[hsl(220,20%,15%)]">No Pending Verifications</h3>
              <p className="text-sm text-[hsl(220,15%,55%)] mt-1">All veterinary doctor applications have been processed.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {pendingVets.map((vet: any) => (
                <div key={vet.id} className="bg-white rounded-2xl border border-[hsl(220,20%,92%)] p-5 flex flex-col md:flex-row items-center justify-between gap-6 hover:shadow-md transition-all">
                  <div className="flex items-center gap-5 flex-1 w-full">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden bg-[hsl(220,20%,94%)] border border-[hsl(220,20%,90%)] shrink-0">
                      {getVetPhotoUrl(vet) ? (
                        <SafeImage src={getVetPhotoUrl(vet)!} className="w-full h-full" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl font-bold text-[hsl(220,15%,50%)]">{(vet.profile?.name || "V")[0]}</div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-lg font-bold text-[hsl(220,20%,15%)]">{vet.profile?.name || "Doctor"}</p>
                        {vet.profile?.priority_fee_paid && (
                          <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-[10px] font-bold rounded-md uppercase tracking-wider">Priority</span>
                        )}
                      </div>
                      <p className="text-sm text-[hsl(220,15%,45%)] font-medium mb-1">
                        {vet.qualification} • {vet.years_of_experience} years exp • Location: {vet.profile?.address || (vet.profile?.city && vet.profile?.state ? `${vet.profile.city}, ${vet.profile.state}` : null) || (vet.city && vet.state ? `${vet.city}, ${vet.state}` : null) || "Not provided"}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {vet.specializations?.map((s: string, idx: number) => (
                          <span key={idx} className="px-2 py-0.5 bg-[hsl(220,40%,96%)] text-[hsl(220,15%,45%)] text-[11px] rounded-md font-medium">{s}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <button onClick={() => setSelectedVet(vet)} className="flex-1 md:flex-none px-5 py-2.5 bg-white border border-[hsl(220,20%,88%)] text-[hsl(220,20%,25%)] text-sm font-semibold rounded-xl hover:bg-[hsl(220,20%,97%)] flex items-center justify-center gap-2 transition-all">
                      <Eye className="w-4 h-4" /> Review Profile
                    </button>
                    <button onClick={() => handleStatusChange(vet, "verified")} className="flex-1 md:flex-none px-5 py-2.5 bg-[hsl(145,55%,42%)] text-white text-sm font-semibold rounded-xl hover:bg-[hsl(145,55%,38%)] shadow-sm shadow-[hsl(145,55%,42%)]/20 flex items-center justify-center gap-2 transition-all">
                      <CheckCircle2 className="w-4 h-4" /> Approve
                    </button>
                    <button onClick={() => handleStatusChange(vet, "failed")} className="flex-1 md:flex-none px-5 py-2.5 border border-[hsl(0,60%,85%)] text-[hsl(0,65%,50%)] text-sm font-semibold rounded-xl hover:bg-[hsl(0,60%,98%)] flex items-center justify-center gap-2 transition-all">
                      <XCircle className="w-4 h-4" /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[hsl(220,20%,92%)] p-6">
          <div className="flex flex-col md:flex-row items-center gap-4 mb-6">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(220,15%,60%)]" />
              <input type="text" placeholder="Search by name, qualification..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[hsl(220,20%,97%)] border border-[hsl(220,20%,92%)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(220,80%,50%)]/20 transition-all"
              />
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <p className="text-sm font-medium text-[hsl(220,15%,50%)] whitespace-nowrap">Filter Status:</p>
              <select value={filter} onChange={(e) => setFilter(e.target.value)} className="w-full md:w-[160px] px-4 py-2.5 border border-[hsl(220,20%,88%)] rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[hsl(220,80%,50%)]/20 cursor-pointer">
                <option value="all">All Status</option>
                <option value="verified">Verified</option>
                <option value="pending">Pending</option>
                <option value="failed">Rejected</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[hsl(220,20%,92%)]">
                  <th className="pb-4 text-left font-bold text-[hsl(220,15%,55%)] uppercase tracking-wider text-[11px]">Doctor</th>
                  <th className="pb-4 text-left font-bold text-[hsl(220,15%,55%)] uppercase tracking-wider text-[11px]">Experience</th>
                  <th className="pb-4 text-left font-bold text-[hsl(220,15%,55%)] uppercase tracking-wider text-[11px]">Location</th>
                  <th className="pb-4 text-left font-bold text-[hsl(220,15%,55%)] uppercase tracking-wider text-[11px]">Specializations</th>
                  <th className="pb-4 text-left font-bold text-[hsl(220,15%,55%)] uppercase tracking-wider text-[11px]">Status</th>
                  <th className="pb-4 text-left font-bold text-[hsl(220,15%,55%)] uppercase tracking-wider text-[11px]">Rating</th>
                  <th className="pb-4 text-left font-bold text-[hsl(220,15%,55%)] uppercase tracking-wider text-[11px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[hsl(220,20%,96%)]">
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="py-12 text-center text-[hsl(220,15%,60%)] bg-[hsl(220,20%,99%)] rounded-b-2xl">No veterinarians found matching your search</td></tr>
                ) : (
                  filtered.map((v: any) => (
                    <tr key={v.id} className="hover:bg-[hsl(220,20%,98%)] transition-colors group">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[hsl(220,20%,94%)] flex items-center justify-center text-[12px] font-bold text-[hsl(220,15%,45%)] overflow-hidden shrink-0 border border-[hsl(220,20%,90%)]">
                            {getVetPhotoUrl(v) ? (
                              <SafeImage src={getVetPhotoUrl(v)!} className="w-full h-full" />
                            ) : (v.profile?.name || "V")[0].toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-[hsl(220,20%,15%)] truncate">Dr. {v.profile?.name || v.profile?.full_name || "Doctor"}</p>
                            <p className="text-[11px] text-[hsl(220,15%,60%)] font-medium">{v.qualification}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 font-medium text-[hsl(220,15%,45%)]">{v.years_of_experience} yrs</td>
                      <td className="py-4 font-medium text-[hsl(220,15%,45%)]">
                        {v.profile?.address || (v.profile?.city && v.profile?.state ? `${v.profile.city}, ${v.profile.state}` : null) || (v.city && v.state ? `${v.city}, ${v.state}` : null) || "Not provided"}
                      </td>
                      <td className="py-4">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {v.specializations?.slice(0, 2).map((s: string, idx: number) => (
                            <span key={idx} className="px-1.5 py-0.5 bg-[hsl(220,20%,94%)] text-[hsl(220,15%,40%)] text-[10px] rounded font-medium">{s}</span>
                          ))}
                          {v.specializations?.length > 2 && <span className="text-[10px] text-[hsl(220,15%,60%)]">+{v.specializations.length - 2}</span>}
                        </div>
                      </td>
                      <td className="py-4">
                        <div className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold inline-flex items-center gap-1.5 tracking-wide
                          ${v.verification_status === "verified" ? "bg-[hsl(145,50%,92%)] text-[hsl(145,60%,35%)]" :
                            v.verification_status === "pending" ? "bg-[hsl(40,60%,92%)] text-[hsl(40,70%,35%)]" :
                            v.verification_status === "suspended" ? "bg-[hsl(0,0%,90%)] text-[hsl(0,0%,40%)]" :
                            "bg-[hsl(0,50%,93%)] text-[hsl(0,65%,45%)]"}
                          ${updatingStatus === v.user_id ? "opacity-50 animate-pulse" : ""}`}
                        >
                          {updatingStatus === v.user_id ? (
                            <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <>
                              {v.verification_status === "verified" && <CheckCircle2 className="w-3.5 h-3.5" />}
                              {v.verification_status === "failed" && <XCircle className="w-3.5 h-3.5" />}
                              {v.verification_status === "pending" && <Clock className="w-3.5 h-3.5" />}
                            </>
                          )}
                          {v.verification_status === "verified" ? "APPROVED" : v.verification_status === "failed" ? "REJECTED" : (v.verification_status || "Pending").toUpperCase()}
                        </div>
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-1.5">
                          <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                          <span className="text-[hsl(220,20%,15%)] font-bold">{v.average_rating || "0.0"}</span>
                        </div>
                      </td>
                      <td className="py-4">
                        <button onClick={() => setSelectedVet(v)} className="px-3 py-1.5 bg-[hsl(220,20%,97%)] text-[hsl(220,80%,50%)] font-bold text-[11px] rounded-lg hover:bg-[hsl(220,80%,50%)] hover:text-white transition-all flex items-center gap-1.5">
                          <Eye className="w-3.5 h-3.5" /> DETAILS
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminVets;
