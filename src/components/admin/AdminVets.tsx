import { AdminData } from "@/pages/AdminDashboard";
import { useState, useEffect } from "react";
import { Search, CheckCircle2, XCircle, Eye, Star, X, FileText, Phone, Mail, MapPin, Clock, Calendar, CreditCard, Stethoscope, Camera, GraduationCap, Building, ChevronRight, AlertCircle, Sunrise, Sun, Moon, Check, Video, HeartHandshake, ShieldCheck, User } from "lucide-react";
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

            <div className="p-6 space-y-6">
              {/* Profile Photo */}
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-[hsl(220,20%,94%)] border-2 border-[hsl(220,20%,88%)]">
                  {getVetPhotoUrl(selectedVet) ? (
                    <SafeImage src={getVetPhotoUrl(selectedVet)!} className="w-full h-full" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><Camera className="w-8 h-8 text-[hsl(220,15%,70%)]" /></div>
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[hsl(220,20%,15%)]">Dr. {selectedVet.profile?.name || "Doctor"}</h3>
                  <p className="text-sm text-[hsl(220,15%,55%)]">{selectedVet.profile?.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2.5 py-0.5 bg-[hsl(220,60%,95%)] text-[hsl(220,70%,45%)] text-[11px] font-bold rounded-md">{selectedVet.qualification}</span>
                    {isEditingDocs ? (
                      <input type="number" placeholder="Exp (Yrs)" value={editForm.years_of_experience || ''} onChange={e => setEditForm({...editForm, years_of_experience: e.target.value})} className="border rounded px-2 py-0.5 text-[12px] bg-white w-20" />
                    ) : (
                      <span className="text-[12px] text-[hsl(220,15%,55%)]">{selectedVet.years_of_experience} yrs experience</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Professional Details & Basic Info */}
              <div className="bg-[hsl(220,20%,97%)] rounded-xl p-4">
                <h4 className="text-sm font-bold text-[hsl(220,20%,15%)] mb-3 flex items-center gap-2"><GraduationCap className="w-4 h-4" /> Professional & Personal Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {isEditingDocs ? (
                    <div className="flex flex-col gap-1 py-1">
                      <label className="text-[11px] text-[hsl(220,15%,60%)] uppercase tracking-wide">Qualification</label>
                      <input type="text" value={editForm.qualification || ''} onChange={e => setEditForm({...editForm, qualification: e.target.value})} className="border rounded px-2 py-1 text-sm bg-white" />
                    </div>
                  ) : <InfoRow icon={Stethoscope} label="Qualification" value={selectedVet.qualification} />}
                  <InfoRow icon={FileText} label="Registration Number" value={selectedVet.registration_number} />
                  <InfoRow icon={Stethoscope} label="Specializations" value={selectedVet.specializations?.join(", ")} />
                  <InfoRow icon={Clock} label="Consultation Type" value={selectedVet.consultation_type} />
                  <InfoRow icon={MapPin} label="City" value={selectedVet.city || selectedVet.profile?.city || (selectedVet.profile?.address ? selectedVet.profile.address.split(',')[0]?.trim() : null)} />
                  <InfoRow icon={MapPin} label="State" value={selectedVet.state || selectedVet.profile?.state || (selectedVet.profile?.address ? selectedVet.profile.address.split(',')[1]?.trim() : null)} />
                  <InfoRow icon={Phone} label="Phone" value={selectedVet.profile?.phone} />
                  <InfoRow icon={Mail} label="Email" value={selectedVet.profile?.email} />
                  <InfoRow icon={Calendar} label="Date of Birth" value={selectedVet.profile?.birth_date} />
                  <InfoRow icon={User} label="Gender" value={selectedVet.profile?.gender} />
                  <InfoRow icon={Calendar} label="Preferred Language" value={selectedVet.preferred_language || (selectedVet.preferred_languages && selectedVet.preferred_languages.join(", "))} />
                </div>
              </div>

              {/* Detailed Education History (Step 3) */}
              {selectedVet.education_details && selectedVet.education_details.length > 0 && (
                <div className="bg-[hsl(260,30%,97%)] rounded-xl p-4 space-y-3">
                  <h4 className="text-sm font-bold text-[hsl(220,20%,15%)] flex items-center gap-2"><GraduationCap className="w-4 h-4" /> Detailed Education History</h4>
                  <div className="space-y-3">
                    {selectedVet.education_details.map((edu: any, idx: number) => (
                      <div key={idx} className="border-b border-[hsl(220,20%,90%)] last:border-0 pb-2.5 last:pb-0 text-xs text-[hsl(220,20%,25%)]">
                        <p className="font-extrabold text-sm text-[hsl(220,20%,15%)]">{edu.qualification}</p>
                        <p className="font-medium text-[hsl(220,15%,45%)]">{edu.institution} — Year: <span className="font-bold">{edu.year}</span></p>
                        {edu.certificate_url && (
                          <button 
                            onClick={() => {
                              const furl = edu.certificate_url.startsWith("http") ? edu.certificate_url : supabase.storage.from("vet-documents").getPublicUrl(edu.certificate_url).data.publicUrl;
                              setPreviewDoc({ label: `${edu.qualification} Certificate`, url: furl });
                            }} 
                            className="mt-1 text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1 bg-transparent border-0 p-0 cursor-pointer"
                          >
                            <FileText className="w-3 h-3" /> View Certificate ↗
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Practice & Location Details (Step 4) */}
              <div className="bg-[hsl(200,30%,97%)] rounded-xl p-4 space-y-3">
                <h4 className="text-sm font-bold text-[hsl(220,20%,15%)] flex items-center gap-2"><Building className="w-4 h-4" /> Practice & Location Details</h4>
                
                <div className="text-xs space-y-1 text-[hsl(220,15%,45%)] font-semibold">
                  <p><span className="font-bold text-[hsl(220,20%,25%)]">Selected Practice Type:</span> {selectedVet.practice_type?.join(", ") || (selectedVet.self_practice ? "Independent Clinic / Practice" : "Hospital / Organization")}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 border-t border-[hsl(220,20%,90%)]">
                  {/* Private Clinic Details */}
                  {(selectedVet.practice_type?.includes('Independent Clinic / Practice') || selectedVet.clinic_name || selectedVet.clinic_address) && (
                    <div className="space-y-1 bg-white p-3 rounded-lg border border-[hsl(220,20%,92%)]">
                      <p className="font-bold text-xs text-blue-800 uppercase tracking-tight flex items-center gap-1 border-b pb-1 mb-1.5"><Building className="w-3.5 h-3.5 text-blue-600" /> Private Clinic Details</p>
                      <p className="text-xs font-semibold text-[hsl(220,20%,15%)]"><span className="text-[hsl(220,15%,55%)] font-normal">Clinic Name:</span> {selectedVet.clinic_name || "N/A"}</p>
                      <p className="text-xs font-semibold text-[hsl(220,20%,15%)]"><span className="text-[hsl(220,15%,55%)] font-normal">Clinic Address:</span> {selectedVet.clinic_address || "N/A"}</p>
                      <p className="text-xs font-semibold text-[hsl(220,20%,15%)]"><span className="text-[hsl(220,15%,55%)] font-normal">Pincode:</span> {selectedVet.clinic_pincode || "N/A"}</p>
                      <p className="text-xs font-semibold text-[hsl(220,20%,15%)]"><span className="text-[hsl(220,15%,55%)] font-normal">Clinic GST ID:</span> {selectedVet.clinic_gst || "N/A"}</p>
                    </div>
                  )}
                  
                  {/* Hospital/Organization Details */}
                  {(selectedVet.practice_type?.includes('Hospital / Organization') || selectedVet.hospital_name || selectedVet.hospital_address) && (
                    <div className="space-y-1 bg-white p-3 rounded-lg border border-[hsl(220,20%,92%)]">
                      <p className="font-bold text-xs text-purple-800 uppercase tracking-tight flex items-center gap-1 border-b pb-1 mb-1.5"><Stethoscope className="w-3.5 h-3.5 text-purple-600" /> Hospital/Org Details</p>
                      <p className="text-xs font-semibold text-[hsl(220,20%,15%)]"><span className="text-[hsl(220,15%,55%)] font-normal">Hospital Name:</span> {selectedVet.hospital_name || "N/A"}</p>
                      <p className="text-xs font-semibold text-[hsl(220,20%,15%)]"><span className="text-[hsl(220,15%,55%)] font-normal">Designation/Role:</span> {selectedVet.hospital_role || "N/A"}</p>
                      <p className="text-xs font-semibold text-[hsl(220,20%,15%)]"><span className="text-[hsl(220,15%,55%)] font-normal">Address:</span> {selectedVet.hospital_address || "N/A"}</p>
                      <p className="text-xs font-semibold text-[hsl(220,20%,15%)]"><span className="text-[hsl(220,15%,55%)] font-normal">Pincode:</span> {selectedVet.hospital_pincode || "N/A"}</p>
                      <p className="text-xs font-semibold text-[hsl(220,20%,15%)]"><span className="text-[hsl(220,15%,55%)] font-normal">Employee ID:</span> {selectedVet.hospital_employee_id || "N/A"}</p>
                    </div>
                  )}
                </div>

                {/* Clinic Photos Array Preview */}
                {selectedVet.clinic_photos && selectedVet.clinic_photos.length > 0 && (
                  <div className="pt-2.5 border-t border-[hsl(220,20%,90%)]">
                    <p className="text-[11px] text-[hsl(220,15%,60%)] uppercase tracking-wide font-bold mb-1.5">Uploaded Practice Photos ({selectedVet.clinic_photos.length})</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedVet.clinic_photos.map((url: string, idx: number) => {
                        const fullUrl = url.startsWith("http") ? url : supabase.storage.from("vet-documents").getPublicUrl(url).data.publicUrl;
                        return (
                          <div key={idx} className="relative w-16 h-16 rounded-lg border border-[hsl(220,20%,85%)] overflow-hidden bg-slate-50 hover:border-slate-400 cursor-pointer" onClick={() => setPreviewDoc({ label: `Practice Photo #${idx+1}`, url: fullUrl })}>
                            <SafeImage src={fullUrl} className="w-full h-full object-cover" />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Availability & Fees & Interactive Schedule (Step 5) */}
              <div className="bg-[hsl(145,30%,97%)] rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-[hsl(220,20%,15%)] flex items-center gap-2"><Calendar className="w-4 h-4" /> Availability & Surcharges</h4>
                  <span className="text-xs text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-md font-bold">{selectedVet.consultation_type}</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {isEditingDocs ? (
                    <div className="flex flex-col gap-1 py-1">
                      <label className="text-[11px] text-[hsl(220,15%,60%)] uppercase tracking-wide">Online Fee</label>
                      <input type="number" value={editForm.online_fee || ''} onChange={e => setEditForm({...editForm, online_fee: e.target.value})} className="border rounded px-2 py-1 text-sm bg-white" />
                    </div>
                  ) : <InfoRow icon={CreditCard} label="Online Call Fee" value={`₹${selectedVet.online_fee}`} />}
                  {isEditingDocs ? (
                    <div className="flex flex-col gap-1 py-1">
                      <label className="text-[11px] text-[hsl(220,15%,60%)] uppercase tracking-wide">Offline Fee</label>
                      <input type="number" value={editForm.offline_fee || ''} onChange={e => setEditForm({...editForm, offline_fee: e.target.value})} className="border rounded px-2 py-1 text-sm bg-white" />
                    </div>
                  ) : <InfoRow icon={CreditCard} label="Physical Clinic Visit Fee" value={`₹${selectedVet.offline_fee}`} />}
                </div>

                {/* Day selector for weekly schedule parsing */}
                {selectedVet.weekly_availability && (
                  <div className="space-y-3 pt-2.5 border-t border-[hsl(145,30%,90%)]">
                    <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Configured Weekly Availability Slots ({selectedVet.available_days?.join(", ")})</p>
                    
                    <div className="flex flex-wrap gap-1 bg-white p-1 rounded-xl border border-[hsl(220,20%,91%)]">
                      {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d: string) => {
                        const isAvailable = selectedVet.available_days?.includes(d);
                        const isSelected = selectedAvailDay === d;
                        return (
                          <button
                            key={d}
                            type="button"
                            onClick={() => isAvailable && setSelectedAvailDay(d)}
                            className={`flex-1 min-w-[36px] py-1.5 rounded-lg text-xs font-bold transition-all ${
                              isSelected 
                                ? "bg-blue-600 text-white shadow-sm" 
                                : isAvailable 
                                  ? "bg-[hsl(145,40%,90%)] text-[hsl(145,70%,30%)] hover:bg-[hsl(145,40%,85%)]" 
                                  : "bg-slate-50 text-slate-400 opacity-40 cursor-not-allowed"
                            }`}
                            disabled={!isAvailable}
                          >
                            {d}
                          </button>
                        );
                      })}
                    </div>

                    {/* Render details of active period slots */}
                    {selectedVet.weekly_availability[selectedAvailDay] ? (
                      <div className="grid grid-cols-1 gap-2">
                        {(["morning", "afternoon", "evening", "night"] as const).map((periodKey) => {
                          const periodInfo = {
                            morning: { label: "Morning Session", icon: Sunrise, color: "bg-emerald-50 text-emerald-800 border-emerald-100" },
                            afternoon: { label: "Afternoon Session", icon: Sun, color: "bg-amber-50 text-amber-800 border-amber-100" },
                            evening: { label: "Evening Session", icon: Moon, color: "bg-indigo-50 text-indigo-800 border-indigo-150" },
                            night: { label: "Night Session", icon: Moon, color: "bg-rose-50 text-rose-800 border-rose-100" }
                          }[periodKey];

                          const dayConfig = selectedVet.weekly_availability[selectedAvailDay];
                          const periodConfig = dayConfig[periodKey];
                          const isEnabled = periodConfig?.enabled;
                          const slots = periodConfig?.slots || [];
                          const PIcon = periodInfo.icon;

                          return (
                            <div key={periodKey} className={`flex items-center justify-between p-2.5 border rounded-xl bg-white text-xs ${isEnabled ? "border-[hsl(220,15%,90%)]" : "border-slate-100 opacity-50 bg-slate-50"}`}>
                              <div className="flex items-center gap-2">
                                <PIcon className="w-3.5 h-3.5 text-slate-500" />
                                <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] border ${periodInfo.color}`}>{periodInfo.label}</span>
                              </div>
                              <div className="flex-1 flex flex-wrap gap-1 px-3 justify-end">
                                {isEnabled ? (
                                  slots.length > 0 ? (
                                    slots.map((s: string) => (
                                      <span key={s} className="bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded font-bold text-[10px] text-slate-700">{s}</span>
                                    ))
                                  ) : (
                                    <span className="text-slate-400 italic">No specific slots enabled</span>
                                  )
                                ) : (
                                  <span className="text-slate-400 italic text-[10px]">Disabled</span>
                                )}
                              </div>
                              <span className={`text-[10px] font-extrabold pb-0.5 uppercase tracking-wide px-2 py-0.5 rounded-full ${isEnabled ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-400"}`}>
                                {isEnabled ? "Active" : "Off"}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No daily schedule mapping available for {selectedAvailDay}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Emergency & Support Surcharges (Step 5) */}
              <div className="bg-[hsl(0,35%,97%)] rounded-xl p-4 space-y-3">
                <h4 className="text-sm font-bold text-[hsl(220,20%,15%)] flex items-center gap-2"><HeartHandshake className="w-4 h-4 text-rose-600" /> Emergency, Night, & Support Coverage</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-white p-3 rounded-xl border border-[hsl(220,20%,92%)]">
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Emergency Available</p>
                    <p className="font-extrabold text-xs text-[hsl(220,20%,15%)] flex items-center gap-1.5 mt-0.5">
                      <span className={`w-2 h-2 rounded-full ${(selectedVet.emergency_available === 'yes' || selectedVet.emergency_available === true) ? "bg-green-500" : "bg-slate-400"}`} />
                      {(selectedVet.emergency_available === 'yes' || selectedVet.emergency_available === true) ? "Yes (Available)" : "No"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Weekend Coverage</p>
                    <p className="font-extrabold text-xs text-[hsl(220,20%,15%)] flex items-center gap-1.5 mt-0.5">
                      <span className={`w-2 h-2 rounded-full ${(selectedVet.weekend_availability === 'yes' || selectedVet.weekend_availability === true) ? "bg-green-500" : "bg-slate-400"}`} />
                      {(selectedVet.weekend_availability === 'yes' || selectedVet.weekend_availability === true) ? "Yes (Working)" : "No"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">24x7 Night Cover</p>
                    <p className="font-extrabold text-xs text-[hsl(220,20%,15%)] flex items-center gap-1.5 mt-0.5">
                      <span className={`w-2 h-2 rounded-full ${(selectedVet.support_24x7 === 'yes' || selectedVet.support_24x7 === true) ? "bg-green-500" : "bg-slate-400"}`} />
                      {(selectedVet.support_24x7 === 'yes' || selectedVet.support_24x7 === true) ? "Yes (Supported)" : "No"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Bank Details */}
              <div className="bg-[hsl(40,40%,97%)] rounded-xl p-4">
                <h4 className="text-sm font-bold text-[hsl(220,20%,15%)] mb-3 flex items-center gap-2"><CreditCard className="w-4 h-4 text-amber-600" /> Settlement Bank Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  <InfoRow icon={Building} label="Account Holder" value={selectedVet.bank_account_name} />
                  <InfoRow icon={Building} label="Bank Name" value={selectedVet.bank_name} />
                  <InfoRow icon={CreditCard} label="Account Number" value={selectedVet.bank_account_number} />
                  <InfoRow icon={FileText} label="IFSC Code" value={selectedVet.bank_ifsc} />
                </div>
              </div>

              {/* Compliance & Consents (Step 6) */}
              <div className="bg-[hsl(35,50%,98%)] rounded-xl p-4 space-y-3">
                <h4 className="text-sm font-bold text-[hsl(220,20%,15%)] flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-amber-600" /> Onboarding Legal Compliance & Consents</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2 bg-white px-3 py-2.5 rounded-xl border border-[hsl(220,20%,93%)]">
                    <span className={`w-2 h-2 rounded-full ${selectedVet.vendor_agreement_accepted ? "bg-green-500" : "bg-red-500"}`} />
                    <p className="font-semibold text-slate-700">Vendor & Service Level Agreement: <span className="font-bold">{selectedVet.vendor_agreement_accepted ? "Accepted & Signed" : "Undetermined/Invalid"}</span></p>
                  </div>
                  <div className="flex items-center gap-2 bg-white px-3 py-2.5 rounded-xl border border-[hsl(220,20%,93%)]">
                    <span className={`w-2 h-2 rounded-full ${selectedVet.telemedicine_consent_accepted ? "bg-green-500" : "bg-red-500"}`} />
                    <p className="font-semibold text-slate-700">Telemedicine Consultation Consent: <span className="font-bold">{selectedVet.telemedicine_consent_accepted ? "Consent Granted" : "Consent Missing"}</span></p>
                  </div>
                  <div className="flex items-center gap-2 bg-white px-3 py-2.5 rounded-xl border border-[hsl(220,20%,93%)]">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    <p className="font-semibold text-slate-700">Accurate Declarations & Terms Confirmation: <span className="font-bold">Fully Certified & Verified</span></p>
                  </div>
                </div>
              </div>

              {/* Documents */}
              <div>
                <h4 className="text-sm font-bold text-[hsl(220,20%,15%)] mb-3">Verification Documents Vault ({
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
                } Documents)</h4>
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
