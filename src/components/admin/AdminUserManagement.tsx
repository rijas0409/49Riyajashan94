import { AdminData } from "@/pages/AdminDashboard";
import { useState, useCallback } from "react";
import { Search, CheckCircle2, XCircle, Users, Shield, ShoppingBag, Truck as TruckIcon, Stethoscope, Eye, X, FileText, Camera, MapPin, Phone, Mail, Building, Trash2, AlertTriangle, GraduationCap, Clock, Banknote, Calendar, User, Building2, CreditCard, ScrollText, ChevronLeft, ChevronRight, Globe, Activity, Briefcase, AlertCircle, Download, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Props {
  data: AdminData;
  actions: Record<string, any>;
}

const roleLabels: Record<string, { label: string; color: string; icon: any }> = {
  buyer: { label: "Buyer / Owner", color: "hsl(220,60%,50%)", icon: Users },
  seller: { label: "Breeder / Seller", color: "hsl(25,80%,50%)", icon: Shield },
  product_seller: { label: "Product Seller", color: "hsl(270,60%,55%)", icon: ShoppingBag },
  delivery_partner: { label: "Delivery", color: "hsl(145,60%,40%)", icon: TruckIcon },
  vet: { label: "Veterinary", color: "hsl(345,70%,55%)", icon: Stethoscope },
  admin: { label: "Admin", color: "hsl(0,70%,50%)", icon: Shield },
};

const InfoBox = ({ icon: Icon, label, value, capitalize = false, muted = false, isPill = false }: any) => (
  <div className="flex items-start gap-4">
    <div className="bg-[hsl(250,80%,96%)] text-[hsl(250,60%,60%)] p-3 rounded-2xl flex items-center justify-center shrink-0 w-11 h-11">
      <Icon className="w-5 h-5" />
    </div>
    <div className="block overflow-hidden w-full">
      <div className="text-[11px] font-bold text-[hsl(220,15%,60%)] uppercase tracking-wider mb-1">{label}</div>
      {isPill ? (
        <span className="inline-flex bg-[hsl(220,20%,96%)] text-[hsl(220,20%,40%)] px-2.5 py-1 rounded-md text-[13px] font-semibold mt-0.5">{value}</span>
      ) : (
        <div className={`text-[15px] font-medium leading-snug break-words ${muted ? 'text-[hsl(220,15%,60%)]' : 'text-[hsl(220,20%,15%)]'} ${capitalize ? 'capitalize' : ''}`}>
          {value || "—"}
        </div>
      )}
    </div>
  </div>
);

const DocViewer = ({ label, url, bucket = "vet-documents", onPreview }: { label: string; url: string | null; bucket?: string; onPreview?: (label: string, url: string) => void }) => {
  const getFullUrl = (u: string) => u.startsWith("http") ? u : supabase.storage.from(bucket).getPublicUrl(u).data.publicUrl;

  if (!url) return (
    <div className="flex items-center gap-2 p-3 bg-[hsl(0,50%,97%)] rounded-xl border border-[hsl(0,40%,90%)]">
      <FileText className="w-4 h-4 text-[hsl(0,50%,60%)]" />
      <span className="text-sm text-[hsl(0,50%,50%)]">{label}: Not uploaded</span>
    </div>
  );

  const urls = url.split('|').filter(Boolean);
  const fullUrls = urls.map(getFullUrl);
  
  // Determine type based on first file
  const isImage = (u: string) => !u.match(/\.(pdf|doc|docx|txt|rtf|xls|xlsx|ppt|pptx)(\?|$)/i);

  return (
    <div className="rounded-xl border border-[hsl(220,20%,90%)] overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-[hsl(220,20%,97%)]">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-[hsl(220,80%,50%)]" />
          <span className="text-[11px] font-medium text-[hsl(220,20%,25%)] truncate max-w-[150px]">{label}</span>
        </div>
        <div className="flex gap-2">
          {fullUrls.map((fu, idx) => (
             <div key={idx} className="flex gap-2">
               <button 
                onClick={() => onPreview?.(label, fu)}
                className="text-[11px] font-medium text-[hsl(220,80%,50%)] hover:underline shrink-0"
               >
                 Preview {fullUrls.length > 1 ? idx + 1 : ""}
               </button>
               <a href={fu} target="_blank" rel="noopener noreferrer" className="text-[11px] font-medium text-[hsl(220,15%,45%)] hover:underline shrink-0" referrerPolicy="no-referrer">
                 Full ↗
               </a>
             </div>
          ))}
        </div>
      </div>
      <div className="w-full bg-[hsl(220,20%,96%)] flex items-center justify-center p-2 gap-2 overflow-x-auto min-h-32">
        {fullUrls.map((fu, idx) => (
          isImage(fu) ? (
            <img 
              key={idx} 
              src={fu} 
              alt={`${label} ${idx + 1}`} 
              onClick={() => onPreview?.(label, fu)}
              className="max-w-full max-h-32 object-contain rounded-md shadow-sm shrink-0 cursor-zoom-in hover:opacity-90 transition-opacity" 
              referrerPolicy="no-referrer" 
            />
          ) : (
            <div key={idx} className="p-6 bg-[hsl(220,20%,98%)] text-center h-32 flex flex-col justify-center shrink-0 min-w-[150px]">
              <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <button 
                onClick={() => onPreview?.(label, fu)}
                className="text-[11px] font-medium text-[hsl(220,80%,50%)] hover:underline"
              >
                View PDF/Doc
              </button>
            </div>
          )
        ))}
      </div>
    </div>
  );
};

const InfoRow = ({ icon: Icon, label, value }: { icon: any; label: string; value: string | null | undefined }) => (
  <div className="flex items-start gap-3 py-2">
    <Icon className="w-4 h-4 text-[hsl(220,15%,55%)] mt-0.5 shrink-0" />
    <div>
      <p className="text-[11px] text-[hsl(220,15%,60%)] uppercase tracking-wide">{label}</p>
      <p className="text-sm font-medium text-[hsl(220,20%,15%)]">{value || "—"}</p>
    </div>
  </div>
);

const AdminUserManagement = ({ data, actions }: Props) => {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [rejectionTarget, setRejectionTarget] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [previewDoc, setPreviewDoc] = useState<{ label: string; url: string } | null>(null);

  const handleOpenPreview = useCallback((label: string, url: string) => {
    setPreviewDoc({ label, url });
  }, []);

  const handleClosePreview = useCallback(() => {
    setPreviewDoc(null);
  }, []);

  const getProfilePhotoUrl = (u: any) => {
    const photo = u.profile_photo || u.selfie_file || u.passport_photo_file;
    if (!photo) return null;
    if (photo.startsWith("http")) return photo;
    return supabase.storage.from(u.role === 'vet' ? 'vet-documents' : 'seller-documents').getPublicUrl(photo).data.publicUrl;
  };
  const [deleting, setDeleting] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [adminVetStep, setAdminVetStep] = useState(1);
  const { toast } = useToast();

  const handleStatusChange = async (user: any, newStatus: string, reason?: string) => {
    if (newStatus === "rejected" && !reason) {
      setRejectionTarget(user);
      return;
    }

    setUpdatingStatus(user.id);
    try {
      if (newStatus === "approved") {
        if (user.role === "vet") {
          await actions.approveVet(user.id);
          await actions.fetchData(); // Explicit extra fetch to be absolutely sure
          actions.setActiveSection("vets");
        } else if (user.role === "seller" || user.role === "product_seller") {
          await actions.approveSeller(user.id);
          await actions.fetchData();
        } else {
          const { error } = await supabase.from("profiles").update({ is_admin_approved: true, rejection_reason: null }).eq("id", user.id);
          if (error) throw error;
          toast({ title: "Approved" });
          await actions.fetchData(true);
        }
      } else if (newStatus === "rejected") {
        if (user.role === "vet") {
          const { error } = await supabase.from("vet_profiles").update({ 
            verification_status: "failed",
            rejection_reason: reason 
          }).eq("user_id", user.id);
          if (error) throw error;
          
          const { error: profileError } = await supabase.from("profiles").update({ 
            is_admin_approved: false, 
            is_onboarding_complete: true 
          }).eq("id", user.id);
          if (profileError) throw profileError;

          toast({ title: "Vet Rejected", description: "Reason: " + reason });
          await actions.fetchData(true);
        } else if (user.role === "seller" || user.role === "product_seller") {
          await actions.rejectSeller(user.id);
          if (reason) {
            await supabase.from("profiles").update({ rejection_reason: reason }).eq("id", user.id);
          }
          await actions.fetchData(true);
        } else {
          const { error } = await supabase.from("profiles").update({ 
            is_admin_approved: false, 
            is_onboarding_complete: false,
            rejection_reason: reason 
          }).eq("id", user.id);
          if (error) throw error;
          toast({ title: "Rejected" });
          await actions.fetchData(true);
        }
      } else if (newStatus === "pending") {
        const { error } = await supabase.from("profiles").update({ is_admin_approved: false, is_onboarding_complete: true, rejection_reason: null }).eq("id", user.id);
        if (error) throw error;
        toast({ title: "Set to Pending" });
        await actions.fetchData(true);
      }
    } catch (err: any) {
      toast({ title: "Update Failed", description: err.message, variant: "destructive" });
    } finally {
      setUpdatingStatus(null);
      setRejectionTarget(null);
      setRejectionReason("");
    }
  };

  const getStatusObj = (u: any) => {
    if (u.role === 'vet') {
       if (u.verification_status === "verified" || u.is_admin_approved) return { label: "Approved", value: "approved", cls: "bg-[hsl(145,50%,92%)] text-[hsl(145,60%,35%)]" };
       if (u.verification_status === "failed") return { label: "Rejected", value: "rejected", cls: "bg-[hsl(0,50%,92%)] text-[hsl(0,60%,35%)]" };
       if (u.verification_status === "pending" || u.is_onboarding_complete) return { label: "Pending", value: "pending", cls: "bg-[hsl(40,60%,92%)] text-[hsl(40,70%,35%)]" };
       return { label: "Active", value: "active", cls: "bg-[hsl(220,20%,94%)] text-[hsl(220,15%,55%)]" };
    }
    if (u.is_admin_approved) return { label: "Approved", value: "approved", cls: "bg-[hsl(145,50%,92%)] text-[hsl(145,60%,35%)]" };
    if (u.rejection_reason) return { label: "Rejected", value: "rejected", cls: "bg-[hsl(0,50%,92%)] text-[hsl(0,60%,35%)]" };
    if (u.is_onboarding_complete) return { label: "Pending", value: "pending", cls: "bg-[hsl(40,60%,92%)] text-[hsl(40,70%,35%)]" };
    return { label: "Active", value: "active", cls: "bg-[hsl(220,20%,94%)] text-[hsl(220,15%,55%)]" };
  };

  const filtered = data.allUsers.filter((u: any) => {
    const matchSearch = !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    const notVet = u.role !== 'vet'; // Explicitly filter out vets from this section
    return matchSearch && matchRole && notVet;
  }).map((u: any) => {
    return u;
  });

  const pendingApprovals = [
    ...(data.pendingSellers || []),
  ].sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

  const handleDeleteUser = async (userId: string, userName: string) => {
    setDeleting(true);
    try {
      const { data: result, error } = await supabase.functions.invoke("delete-user", {
        body: { user_id: userId },
      });
      if (error) throw error;
      if (result?.error) throw new Error(result.error);
      toast({ title: "User Deleted", description: `${userName} has been permanently removed from the platform.` });
      setDeleteTarget(null);
      actions.fetchData(true);
    } catch (err: any) {
      toast({ title: "Delete Failed", description: err.message || "Something went wrong", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50" onClick={() => !deleting && setDeleteTarget(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md m-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-[hsl(0,70%,95%)] flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-[hsl(0,70%,50%)]" />
              </div>
              <h3 className="text-lg font-bold text-[hsl(220,20%,15%)] mb-2">Permanently Delete User?</h3>
              <p className="text-sm text-[hsl(220,15%,50%)] mb-1">
                <span className="font-semibold text-[hsl(220,20%,25%)]">{deleteTarget.full_name || deleteTarget.name}</span>
              </p>
              <p className="text-[12px] text-[hsl(220,15%,60%)] mb-1">{deleteTarget.email} • {deleteTarget.role?.replace("_", " ")}</p>
              <div className="mt-4 p-3 bg-[hsl(0,60%,97%)] rounded-xl border border-[hsl(0,40%,90%)] text-left">
                <p className="text-[12px] text-[hsl(0,60%,45%)] font-medium">⚠ This action is irreversible:</p>
                <ul className="text-[11px] text-[hsl(0,50%,50%)] mt-1 space-y-0.5 list-disc list-inside">
                  <li>Account will be permanently deleted</li>
                  <li>User cannot login with this email again</li>
                  <li>All associated data (listings, orders, chats) will be removed</li>
                </ul>
              </div>
            </div>
            <div className="border-t border-[hsl(220,20%,92%)] px-6 py-4 flex justify-end gap-3">
              <button disabled={deleting} onClick={() => setDeleteTarget(null)} className="px-5 py-2.5 border border-[hsl(220,20%,85%)] text-[hsl(220,15%,40%)] text-sm font-medium rounded-xl hover:bg-[hsl(220,20%,96%)]">
                Cancel
              </button>
              <button disabled={deleting} onClick={() => handleDeleteUser(deleteTarget.id, deleteTarget.name)} className="px-5 py-2.5 bg-[hsl(0,70%,50%)] text-white text-sm font-medium rounded-xl hover:bg-[hsl(0,70%,45%)] flex items-center gap-2 disabled:opacity-50">
                <Trash2 className="w-4 h-4" />
                {deleting ? "Deleting..." : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[28px] font-bold text-[hsl(220,20%,15%)]">User Management</h1>
          <p className="text-sm text-[hsl(220,15%,55%)] mt-1">Manage all platform users and pending approvals</p>
        </div>
      </div>

      {/* Rejection Reason Modal */}
      {rejectionTarget && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50" onClick={() => setRejectionTarget(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md m-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <h3 className="text-lg font-bold text-[hsl(220,20%,15%)] mb-4">Reason for Rejection</h3>
              <p className="text-sm text-[hsl(220,15%,55%)] mb-4">Please provide a clear reason why this user's application is being rejected. The user will see this message.</p>
              <textarea 
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Documents are blurry, missing medical license number..."
                className="w-full min-h-[120px] p-4 bg-[hsl(220,20%,97%)] border border-[hsl(220,20%,92%)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(0,70%,50%)]/20"
              />
            </div>
            <div className="border-t border-[hsl(220,20%,92%)] px-6 py-4 flex justify-end gap-3">
              <button onClick={() => setRejectionTarget(null)} className="px-5 py-2.5 border border-[hsl(220,20%,85%)] text-[hsl(220,15%,40%)] text-sm font-medium rounded-xl">
                Cancel
              </button>
              <button 
                disabled={!rejectionReason.trim()}
                onClick={() => handleStatusChange(rejectionTarget, "rejected", rejectionReason)} 
                className="px-5 py-2.5 bg-[hsl(0,70%,50%)] text-white text-sm font-medium rounded-xl disabled:opacity-50"
              >
                Reject User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Review Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[hsl(220,50%,15%)]/40 p-4 sm:p-6 backdrop-blur-sm" onClick={() => setSelectedUser(null)}>
          <div className="bg-white rounded-[24px] w-full max-w-[1000px] flex flex-col md:flex-row shadow-2xl relative max-h-[90vh] md:h-[650px] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            
            <button onClick={() => setSelectedUser(null)} className="absolute top-6 right-6 w-8 h-8 rounded-full flex items-center justify-center text-[hsl(220,15%,60%)] hover:bg-[hsl(220,20%,96%)] hover:text-[hsl(220,20%,20%)] transition-colors z-[110]">
              <X className="w-5 h-5" />
            </button>

            {/* Sidebar */}
            <aside className="w-full md:w-[320px] bg-[hsl(220,50%,98%)] border-r border-[hsl(220,20%,92%)] p-6 sm:p-10 flex flex-col items-center overflow-y-auto shrink-0 hidden sm:flex">
              <div className="w-24 h-24 rounded-full bg-white border border-[hsl(220,20%,90%)] shadow-sm flex items-center justify-center relative mb-5 overflow-hidden text-[hsl(220,15%,70%)]">
                {selectedUser.profile_photo || selectedUser.selfie_file || selectedUser.passport_photo_file ? (
                  <img src={(selectedUser.profile_photo || selectedUser.selfie_file || selectedUser.passport_photo_file).startsWith("http") ? (selectedUser.profile_photo || selectedUser.selfie_file || selectedUser.passport_photo_file) : supabase.storage.from(selectedUser.role === 'vet' ? 'vet-documents' : 'seller-documents').getPublicUrl(selectedUser.profile_photo || selectedUser.selfie_file || selectedUser.passport_photo_file).data.publicUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <User className="w-10 h-10" />
                )}
                <div className="absolute bottom-1 right-1 w-4 h-4 bg-[hsl(40,90%,50%)] border-[3px] border-white rounded-full"></div>
              </div>
              <h2 className="text-xl font-bold text-[hsl(220,20%,15%)] mb-1 text-center">{selectedUser.full_name || selectedUser.name || "User"}</h2>
              <p className="text-sm text-[hsl(220,15%,55%)] mb-6 text-center">{selectedUser.email}</p>

              <div className="flex items-center justify-center gap-2 bg-white px-4 py-3 rounded-xl border border-[hsl(220,20%,90%)] shadow-sm mb-8 w-full">
                <div className="w-2 h-2 rounded-full bg-[hsl(40,90%,50%)]"></div>
                <span className="text-xs font-semibold uppercase tracking-wide text-[hsl(220,20%,30%)]">Pending Review</span>
              </div>

              <div className="mt-auto w-full pt-8 border-t border-[hsl(220,20%,90%)]">
                {getStatusObj(selectedUser).value === 'pending' ? (
                  <>
                    <p className="text-[11px] text-[hsl(220,15%,60%)] uppercase tracking-wider font-semibold text-center mb-4">Application Actions</p>
                    <button onClick={() => { handleStatusChange(selectedUser, "approved"); setSelectedUser(null); }} className="w-full flex items-center justify-center gap-2 bg-[hsl(150,80%,40%)] text-white p-3.5 rounded-xl font-semibold text-sm hover:bg-[hsl(150,80%,35%)] shadow-lg shadow-[hsl(150,80%,40%)]/20 transition-all mb-3">
                      <CheckCircle2 className="w-[18px] h-[18px]" /> Approve
                    </button>
                    <button onClick={() => { setRejectionTarget(selectedUser); setSelectedUser(null); }} className="w-full flex items-center justify-center gap-2 bg-white text-[hsl(340,80%,50%)] border border-[hsl(340,80%,90%)] p-3.5 rounded-xl font-semibold text-sm hover:bg-[hsl(340,80%,98%)] transition-all">
                      <AlertCircle className="w-[18px] h-[18px]" /> Reject with Reason
                    </button>
                  </>
                ) : (
                  <div className="text-center font-medium p-4 rounded-xl text-sm" style={{ backgroundColor: getStatusObj(selectedUser).cls.includes('bg-') ? getStatusObj(selectedUser).cls.split(' ')[0].replace('bg-', '') : 'rgba(0,0,0,0.05)', color: getStatusObj(selectedUser).cls.includes('text-') ? getStatusObj(selectedUser).cls.split(' ')[1].replace('text-', '') : 'inherit' }}>
                    Status: {getStatusObj(selectedUser).label}
                  </div>
                )}
              </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col bg-white overflow-hidden h-full">
              {/* Content Header & Progress */}
              <header className="px-6 sm:px-10 pt-8 sm:pt-10 pb-6 border-b border-[hsl(220,20%,92%)] bg-white shrink-0">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-[hsl(250,60%,60%)] uppercase tracking-wider">
                    {selectedUser.role === 'vet' ? `Step ${adminVetStep} of 7` : 'User Details'}
                  </span>
                  <span className="text-[13px] font-medium text-[hsl(220,15%,60%)]">Applied {new Date(selectedUser.created_at).toLocaleDateString()}</span>
                </div>
                <h1 className="text-2xl font-bold text-[hsl(220,20%,15%)] mb-6">
                  {selectedUser.role === 'vet' ? [
                    'Personal Info', 
                    'Identity', 
                    'Professional', 
                    'Clinic Docs', 
                    'Bank Details', 
                    'Availability', 
                    'Compliance'
                  ][adminVetStep - 1] : 'Application Info'}
                </h1>
                
                {selectedUser.role === 'vet' && (
                  <div className="flex gap-2 w-full">
                    {[1,2,3,4,5,6,7].map(n => (
                      <div key={n} className={`h-1.5 flex-1 rounded-full transition-colors ${n === adminVetStep ? 'bg-[hsl(250,60%,60%)]' : n < adminVetStep ? 'bg-[hsl(250,60%,90%)]' : 'bg-[hsl(220,20%,92%)]'}`}></div>
                    ))}
                  </div>
                )}
              </header>

              {/* Form Content Grid */}
              <div className="flex-1 p-6 sm:p-10 overflow-y-auto bg-white">
                {selectedUser.role === 'vet' ? (
                  <div className="animate-in fade-in zoom-in-95 duration-300">
                    {adminVetStep === 1 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                        <InfoBox icon={User} label="Full Name" value={selectedUser.full_name} />
                        <InfoBox icon={Mail} label="Email" value={selectedUser.email} />
                        <InfoBox icon={Phone} label="Phone" value={selectedUser.phone} />
                        <InfoBox icon={Calendar} label="Date of Birth" value={selectedUser.dob || selectedUser.birth_date} />
                        <InfoBox icon={User} label="Gender" value={selectedUser.gender} capitalize />
                        <InfoBox icon={Globe} label="Preferred Language" value={selectedUser.preferred_language || "—"} muted={!selectedUser.preferred_language} />
                        <InfoBox icon={MapPin} label="Address" value={selectedUser.address} />
                        <InfoBox icon={Briefcase} label="Independent Practice" value={selectedUser.self_practice ? "Yes" : "No"} isPill />
                      </div>
                    )}
                    
                    {adminVetStep === 2 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        <DocViewer label="Government ID" url={selectedUser.govt_id_file || selectedUser.aadhaar_file} bucket="vet-documents" />
                        <DocViewer label="PAN Card" url={selectedUser.pan_card_file} bucket="vet-documents" />
                        <DocViewer label="Passport Photo" url={selectedUser.passport_photo_file} bucket="vet-documents" />
                      </div>
                    )}

                    {adminVetStep === 3 && (
                      <div className="space-y-8">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                          <InfoBox icon={GraduationCap} label="Highest Qualification" value={selectedUser.qualification} />
                          <InfoBox icon={FileText} label="Vet License / Reg #" value={selectedUser.registration_number} />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          <DocViewer label="Vet Degree Certificate" url={selectedUser.vet_degree_file} bucket="vet-documents" />
                        </div>
                        {selectedUser.education_details && Array.isArray(selectedUser.education_details) && selectedUser.education_details.length > 0 && (
                          <div>
                            <span className="text-[11px] font-bold text-[hsl(220,15%,60%)] uppercase tracking-wider mb-4 block">Education Details List</span>
                            <div className="space-y-3">
                              {selectedUser.education_details.map((edu: any, i: number) => (
                                <div key={i} className="flex flex-wrap items-center gap-3 justify-between p-4 bg-[hsl(220,30%,98%)] rounded-xl border border-[hsl(220,20%,92%)]">
                                  <div>
                                    <p className="text-[15px] font-medium text-[hsl(220,20%,15%)] mb-1">{edu.qualification}</p>
                                    <p className="text-[13px] text-[hsl(220,15%,55%)]">{edu.institution} • {edu.year}</p>
                                  </div>
                                  {edu.certificate_url ? (
                                    <a href={edu.certificate_url.startsWith('http') ? edu.certificate_url : supabase.storage.from('vet-documents').getPublicUrl(edu.certificate_url).data.publicUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-[hsl(220,20%,90%)] rounded-lg text-[13px] font-medium text-[hsl(220,20%,30%)] hover:bg-[hsl(220,20%,96%)] transition-colors" referrerPolicy="no-referrer">
                                      <FileText className="w-4 h-4" /> View Certificate
                                    </a>
                                  ) : (
                                    <span className="text-[12px] font-medium px-2 py-1 bg-[hsl(0,50%,97%)] rounded border border-[hsl(0,50%,90%)] text-[hsl(0,50%,60%)]">No certificate</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {adminVetStep === 4 && (
                      <div className="space-y-8">
                        <div className="grid grid-cols-1">
                          <InfoBox icon={MapPin} label="Clinic Address" value={selectedUser.clinic_address} />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          <DocViewer label="Clinic Registration" url={selectedUser.clinic_registration_file} bucket="vet-documents" />
                          <DocViewer label="Shop License" url={selectedUser.clinic_shop_license_file} bucket="vet-documents" />
                          <DocViewer label="GST Certificate" url={selectedUser.gst_certificate_file} bucket="vet-documents" />
                          <DocViewer label="Address Proof" url={selectedUser.clinic_address_proof_file} bucket="vet-documents" />
                        </div>
                        {Array.isArray(selectedUser.clinic_photos) && selectedUser.clinic_photos.length > 0 && (
                          <div>
                            <span className="text-[11px] font-bold text-[hsl(220,15%,60%)] uppercase tracking-wider mb-4 block">Clinic Photos</span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                              {selectedUser.clinic_photos.map((photoUrl: string, idx: number) => (
                                <DocViewer key={idx} label={`Clinic Photo ${idx + 1}`} url={photoUrl} bucket="vet-documents" />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {adminVetStep === 5 && (
                      <div className="space-y-8">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                          <InfoBox icon={FileText} label="Bank Account Name" value={selectedUser.bank_account_name} />
                          <InfoBox icon={Briefcase} label="Bank Name" value={selectedUser.bank_name} />
                          <InfoBox icon={CreditCard} label="Bank Account Number" value={selectedUser.bank_account_number} />
                          <InfoBox icon={Globe} label="Bank IFSC" value={selectedUser.bank_ifsc} />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                          <DocViewer label="Cancelled Cheque" url={selectedUser.cancelled_cheque_file} bucket="vet-documents" />
                        </div>
                      </div>
                    )}

                    {adminVetStep === 6 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                        <InfoBox icon={Users} label="Specializations" value={Array.isArray(selectedUser.specializations) ? selectedUser.specializations.join(", ") : (selectedUser.specializations || "—")} />
                        <InfoBox icon={Activity} label="Consultation Type" value={selectedUser.consultation_type || "—"} />
                        <InfoBox icon={Clock} label="Years of Experience" value={selectedUser.years_of_experience !== undefined ? `${selectedUser.years_of_experience}` : "—"} />
                        <InfoBox icon={Calendar} label="Available Days" value={Array.isArray(selectedUser.available_days) ? selectedUser.available_days.join(", ") : (selectedUser.available_days || "—")} />
                        <InfoBox icon={Clock} label="Available Slots" value={`Morn: ${selectedUser.morning_slots ? 'Yes' : 'No'} | Eve: ${selectedUser.evening_slots ? 'Yes' : 'No'}`} />
                        <InfoBox icon={CreditCard} label="Clinic Visit Fee" value={selectedUser.online_fee ? `₹${selectedUser.online_fee}` : "—"} />
                        <InfoBox icon={CreditCard} label="Home Visit Fee" value={selectedUser.offline_fee ? `₹${selectedUser.offline_fee}` : "—"} />
                      </div>
                    )}

                    {adminVetStep === 7 && (
                      <div className="space-y-4 max-w-lg">
                        <div className="flex items-center justify-between p-5 bg-[hsl(220,30%,98%)] rounded-xl border border-[hsl(220,20%,92%)]">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${selectedUser.vendor_agreement_accepted ? 'bg-[hsl(150,80%,90%)] text-[hsl(150,80%,40%)]' : 'bg-[hsl(0,80%,90%)] text-[hsl(0,70%,50%)]'}`}>
                              {selectedUser.vendor_agreement_accepted ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                            </div>
                            <div>
                              <p className="font-medium text-[hsl(220,20%,15%)]">Vendor Agreement</p>
                              <p className="text-xs text-[hsl(220,15%,55%)]">{selectedUser.vendor_agreement_accepted ? "Accepted" : "Not accepted"}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-5 bg-[hsl(220,30%,98%)] rounded-xl border border-[hsl(220,20%,92%)]">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${(selectedUser.is_onboarding_complete || selectedUser.created_at) ? 'bg-[hsl(150,80%,90%)] text-[hsl(150,80%,40%)]' : 'bg-[hsl(0,80%,90%)] text-[hsl(0,70%,50%)]'}`}>
                              {(selectedUser.is_onboarding_complete || selectedUser.created_at) ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                            </div>
                            <div>
                              <p className="font-medium text-[hsl(220,20%,15%)]">Terms & Conditions</p>
                              <p className="text-xs text-[hsl(220,15%,55%)]">{(selectedUser.is_onboarding_complete || selectedUser.created_at) ? "Accepted" : "Not accepted"}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-5 bg-[hsl(220,30%,98%)] rounded-xl border border-[hsl(220,20%,92%)]">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${selectedUser.telemedicine_consent_accepted ? 'bg-[hsl(150,80%,90%)] text-[hsl(150,80%,40%)]' : 'bg-[hsl(220,20%,90%)] text-[hsl(220,15%,60%)]'}`}>
                              {selectedUser.telemedicine_consent_accepted ? <CheckCircle2 className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5 opacity-50" />}
                            </div>
                            <div>
                              <p className="font-medium text-[hsl(220,20%,15%)]">Telemedicine Consent</p>
                              <p className="text-xs text-[hsl(220,15%,55%)]">{selectedUser.telemedicine_consent_accepted ? "Accepted" : "Pending"}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-10 animate-in fade-in duration-300">
                    <div>
                      <span className="text-[11px] font-bold text-[hsl(220,15%,60%)] uppercase tracking-wider mb-6 block">Primary Details</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                        <InfoBox icon={User} label="Full Name" value={selectedUser.full_name} />
                        <InfoBox icon={User} label="Display Name" value={selectedUser.name} />
                        <InfoBox icon={Mail} label="Email" value={selectedUser.email} />
                        <InfoBox icon={Phone} label="Phone" value={selectedUser.phone} />
                        <InfoBox icon={MapPin} label="Address" value={selectedUser.address} />
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-[11px] font-bold text-[hsl(220,15%,60%)] uppercase tracking-wider mb-6 block">Verification Documents</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <DocViewer label="Government ID" url={selectedUser.aadhaar_file} bucket="seller-documents" />
                        <DocViewer label="PAN Card" url={selectedUser.pan_card_file} bucket="seller-documents" />
                        <DocViewer label="Live Selfie" url={selectedUser.selfie_file} bucket="seller-documents" />
                        <DocViewer label="Breeder License" url={selectedUser.breeder_license} bucket="seller-documents" />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Footer */}
              <footer className="px-6 py-5 border-t border-[hsl(220,20%,92%)] bg-[hsl(220,50%,99%)] flex items-center justify-between shrink-0 block sm:hidden">
                {getStatusObj(selectedUser).value === 'pending' ? (
                  selectedUser.role === 'vet' ? (
                    <>
                      <button 
                        onClick={() => setAdminVetStep(Math.max(1, adminVetStep - 1))} 
                        disabled={adminVetStep === 1}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm border border-transparent disabled:opacity-40 disabled:cursor-not-allowed text-[hsl(220,20%,30%)]"
                      >
                        <ChevronLeft className="w-4 h-4" /> Prev
                      </button>
                      {adminVetStep < 7 ? (
                        <button 
                          onClick={() => setAdminVetStep(Math.min(7, adminVetStep + 1))} 
                          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm bg-[hsl(220,20%,10%)] text-white shadow-md ml-auto"
                        >
                          Next <ChevronRight className="w-4 h-4" />
                        </button>
                      ) : (
                        <button 
                          onClick={() => { handleStatusChange(selectedUser, "approved"); setSelectedUser(null); }} 
                          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm bg-[hsl(150,80%,40%)] text-white shadow-md ml-auto"
                        >
                          Approve <CheckCircle2 className="w-4 h-4" />
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="flex w-full justify-between items-center gap-2">
                      <button onClick={() => { setRejectionTarget(selectedUser); setSelectedUser(null); }} className="flex-1 flex justify-center items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm border border-[hsl(340,80%,85%)] text-[hsl(340,80%,50%)] bg-white">
                        Reject
                      </button>
                      <button onClick={() => { handleStatusChange(selectedUser, "approved"); setSelectedUser(null); }} className="flex-1 flex justify-center items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm bg-[hsl(150,80%,40%)] text-white">
                        Approve
                      </button>
                    </div>
                  )
                ) : (
                    <>
                      {selectedUser.role === 'vet' ? (
                        <>
                          <button 
                            onClick={() => setAdminVetStep(Math.max(1, adminVetStep - 1))} 
                            disabled={adminVetStep === 1}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm border border-transparent disabled:opacity-40 disabled:cursor-not-allowed text-[hsl(220,20%,30%)]"
                          >
                            <ChevronLeft className="w-4 h-4" /> Prev
                          </button>
                          <button 
                            onClick={() => setAdminVetStep(Math.min(7, adminVetStep + 1))} 
                            disabled={adminVetStep === 7}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm bg-[hsl(220,20%,10%)] text-white shadow-md ml-auto disabled:opacity-40"
                          >
                            Next <ChevronRight className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <div className="text-center font-medium w-full text-sm" style={{ color: getStatusObj(selectedUser).cls.includes('text-') ? getStatusObj(selectedUser).cls.split(' ')[1].replace('text-', '') : 'inherit' }}>
                          Status: {getStatusObj(selectedUser).label}
                        </div>
                      )}
                    </>
                )}
              </footer>
            </main>
          </div>
        </div>
      )}

      {/* Pending Approvals */}
      {pendingApprovals.length > 0 && (
        <div className="bg-white rounded-2xl border border-[hsl(220,20%,92%)] p-6 mb-6">
          <h2 className="text-lg font-bold text-[hsl(220,20%,15%)] mb-4 flex items-center gap-2">
            Pending Approvals
            <span className="px-2.5 py-0.5 bg-[hsl(0,75%,55%)] text-white text-[11px] font-bold rounded-full">{pendingApprovals.length}</span>
          </h2>
          <div className="space-y-3">
            {pendingApprovals.map((seller: any) => (
              <div key={seller.id} className="flex items-center justify-between p-4 bg-[hsl(40,60%,97%)] rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-[hsl(40,60%,90%)]">
                    {seller.selfie_file || seller.profile_photo || seller.passport_photo_file ? (
                      <img src={(seller.selfie_file || seller.profile_photo || seller.passport_photo_file).startsWith("http") ? (seller.selfie_file || seller.profile_photo || seller.passport_photo_file) : supabase.storage.from(seller.role === 'vet' ? 'vet-documents' : 'seller-documents').getPublicUrl(seller.selfie_file || seller.profile_photo || seller.passport_photo_file).data.publicUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[hsl(40,70%,40%)] font-bold text-lg">{(seller.name || "U")[0].toUpperCase()}</div>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-[hsl(220,20%,15%)] text-sm">{seller.full_name || seller.name}</p>
                    <p className="text-[12px] text-[hsl(220,15%,55%)]">{seller.email} • {seller.role?.replace("_", " ")}</p>
                    {seller.business_name && <p className="text-[11px] text-[hsl(220,15%,60%)]">Business: {seller.business_name}</p>}
                    {seller.priority_fee_paid && <span className="inline-block mt-0.5 px-2 py-0.5 bg-[hsl(35,90%,90%)] text-[hsl(35,80%,35%)] text-[10px] font-bold rounded-md">PRIORITY</span>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setSelectedUser(seller)} className="px-4 py-2 bg-white border border-[hsl(220,20%,85%)] text-[hsl(220,15%,40%)] text-[12px] font-medium rounded-lg hover:bg-[hsl(220,20%,96%)] flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5" /> Review
                  </button>
                  <button onClick={() => handleStatusChange(seller, "approved")} className="px-4 py-2 bg-[hsl(220,80%,50%)] text-white text-[12px] font-medium rounded-lg hover:bg-[hsl(220,80%,45%)] flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                  </button>
                  <button onClick={() => setRejectionTarget(seller)} className="px-4 py-2 border border-[hsl(0,60%,70%)] text-[hsl(0,65%,50%)] text-[12px] font-medium rounded-lg hover:bg-[hsl(0,60%,97%)] flex items-center gap-1.5">
                    <XCircle className="w-3.5 h-3.5" /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Users */}
      <div className="bg-white rounded-2xl border border-[hsl(220,20%,92%)] p-6">
        <div className="flex items-center gap-4 mb-5">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(220,15%,60%)]" />
            <input type="text" placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[hsl(220,20%,97%)] border border-[hsl(220,20%,92%)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(220,80%,50%)]/20"
            />
          </div>
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="px-4 py-2.5 border border-[hsl(220,20%,88%)] rounded-xl text-sm bg-white focus:outline-none">
            <option value="all">All Roles</option>
            <option value="buyer">Buyers</option>
            <option value="seller">Pet Sellers</option>
            <option value="product_seller">Product Sellers</option>
            <option value="vet">Vets</option>
            <option value="delivery_partner">Delivery</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="border-b-2 border-[hsl(220,20%,90%)]">
                <th className="pb-3 pt-1 text-left font-semibold text-[hsl(220,15%,55%)]" style={{width:"28%"}}>User</th>
                <th className="pb-3 pt-1 text-left font-semibold text-[hsl(220,15%,55%)]" style={{width:"13%"}}>Role</th>
                <th className="pb-3 pt-1 text-left font-semibold text-[hsl(220,15%,55%)]" style={{width:"12%"}}>Status</th>
                <th className="pb-3 pt-1 text-left font-semibold text-[hsl(220,15%,55%)]" style={{width:"14%"}}>Joined</th>
                <th className="pb-3 pt-1 text-center font-semibold text-[hsl(220,15%,55%)]" style={{width:"13%"}}>View</th>
                <th className="pb-3 pt-1 text-center font-semibold text-[hsl(220,15%,55%)]" style={{width:"13%"}}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="py-8 text-center text-[hsl(220,15%,60%)]">No users found</td></tr>
              ) : (
                filtered.slice(0, 50).map((u: any, idx: number) => {
                  const rl = roleLabels[u.role] || roleLabels.buyer;
                  return (
                    <tr key={u.id} className={`border-b border-[hsl(220,20%,94%)] hover:bg-[hsl(220,30%,97%)] transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-[hsl(220,20%,99%)]"}`}>
                      <td className="py-3.5 pr-2">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[hsl(220,20%,94%)] flex items-center justify-center text-[12px] font-bold text-[hsl(220,15%,45%)] overflow-hidden shrink-0">
                            {u.profile_photo || u.selfie_file || u.passport_photo_file ? (
                              <img src={(u.profile_photo || u.selfie_file || u.passport_photo_file).startsWith("http") ? (u.profile_photo || u.selfie_file || u.passport_photo_file) : supabase.storage.from(u.role === 'vet' ? 'vet-documents' : 'seller-documents').getPublicUrl(u.profile_photo || u.selfie_file || u.passport_photo_file).data.publicUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (u.name || "U")[0].toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-[hsl(220,20%,15%)] truncate">{u.name}</p>
                            <p className="text-[11px] text-[hsl(220,15%,60%)] truncate">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5">
                        <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap" style={{ backgroundColor: `${rl.color}15`, color: rl.color }}>{rl.label}</span>
                      </td>
                      <td className="py-3.5">
                        <div className={`px-2.5 py-1 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 ${getStatusObj(u).cls}`}>
                          {getStatusObj(u).label.toUpperCase()}
                        </div>
                      </td>
                      <td className="py-3.5 text-[hsl(220,15%,55%)] text-[13px]">{new Date(u.created_at).toLocaleDateString()}</td>
                      <td className="py-3.5 text-center">
                        {(u.role === "seller" || u.role === "product_seller" || u.role === "vet") && u.is_onboarding_complete ? (
                          <button 
                            onClick={() => {
                              if (u.role === "vet") {
                                const vetDetail = data.allVets.find(v => v.user_id === u.id);
                                setSelectedUser(vetDetail ? { ...u, ...vetDetail } : u);
                              } else {
                                setSelectedUser(u);
                              }
                            }} 
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-[12px] text-[hsl(220,80%,50%)] font-medium rounded-lg border border-[hsl(220,80%,85%)] hover:bg-[hsl(220,80%,96%)] transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" /> View
                          </button>
                        ) : (
                          <span className="text-[12px] text-[hsl(220,15%,78%)]">—</span>
                        )}
                      </td>
                      <td className="py-3.5 text-center">
                        {u.role !== "admin" ? (
                          <button onClick={() => setDeleteTarget(u)} className="inline-flex items-center gap-1 px-3 py-1.5 text-[12px] text-[hsl(0,65%,50%)] font-medium rounded-lg border border-[hsl(0,50%,85%)] hover:bg-[hsl(0,60%,97%)] transition-colors">
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </button>
                        ) : (
                          <span className="text-[12px] text-[hsl(220,15%,78%)]">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminUserManagement;
