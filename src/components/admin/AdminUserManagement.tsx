import { AdminData } from "@/pages/AdminDashboard";
import { useState } from "react";
import { Search, CheckCircle2, XCircle, Users, Shield, ShoppingBag, Truck as TruckIcon, Stethoscope, Eye, X, FileText, Camera, MapPin, Phone, Mail, Building, Trash2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Props {
  data: AdminData;
  actions: any;
}

const roleLabels: Record<string, { label: string; color: string; icon: any }> = {
  buyer: { label: "Buyer", color: "hsl(220,60%,50%)", icon: Users },
  seller: { label: "Pet Seller", color: "hsl(25,80%,50%)", icon: Shield },
  product_seller: { label: "Product Seller", color: "hsl(270,60%,55%)", icon: ShoppingBag },
  delivery_partner: { label: "Delivery", color: "hsl(145,60%,40%)", icon: TruckIcon },
  vet: { label: "Veterinary", color: "hsl(345,70%,55%)", icon: Stethoscope },
  admin: { label: "Admin", color: "hsl(0,70%,50%)", icon: Shield },
};

const DocViewer = ({ label, url }: { label: string; url: string | null }) => {
  if (!url) return (
    <div className="flex items-center gap-2 p-3 bg-[hsl(0,50%,97%)] rounded-xl border border-[hsl(0,40%,90%)]">
      <FileText className="w-4 h-4 text-[hsl(0,50%,60%)]" />
      <span className="text-sm text-[hsl(0,50%,50%)]">{label}: Not uploaded</span>
    </div>
  );
  const isImage = url.match(/\.(jpg|jpeg|png|gif|webp)(\?|$)/i);
  return (
    <div className="rounded-xl border border-[hsl(220,20%,90%)] overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-[hsl(220,20%,97%)]">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-[hsl(220,80%,50%)]" />
          <span className="text-sm font-medium text-[hsl(220,20%,25%)]">{label}</span>
        </div>
        <a href={url} target="_blank" rel="noopener noreferrer" className="text-[11px] font-medium text-[hsl(220,80%,50%)] hover:underline">Open Full</a>
      </div>
      {isImage ? (
        <img src={url} alt={label} className="w-full max-h-[200px] object-contain bg-[hsl(220,20%,98%)]" />
      ) : (
        <div className="p-4 bg-[hsl(220,20%,98%)] text-center">
          <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-[hsl(220,80%,50%)] hover:underline">View Document ↗</a>
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

const AdminUserManagement = ({ data, actions }: Props) => {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedSeller, setSelectedSeller] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  const filtered = data.allUsers.filter((u: any) => {
    const matchSearch = !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const pendingApprovals = data.pendingSellers;

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
      actions.fetchData();
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

      {/* Detail Review Modal */}
      {selectedSeller && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50" onClick={() => setSelectedSeller(null)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-[hsl(220,20%,92%)] px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <div>
                <h2 className="text-lg font-bold text-[hsl(220,20%,15%)]">Seller Application Review</h2>
                <p className="text-[12px] text-[hsl(220,15%,55%)]">{selectedSeller.role?.replace("_", " ")} • Applied {new Date(selectedSeller.created_at).toLocaleDateString()}</p>
              </div>
              <button onClick={() => setSelectedSeller(null)} className="w-8 h-8 rounded-lg bg-[hsl(220,20%,96%)] flex items-center justify-center hover:bg-[hsl(220,20%,92%)]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Profile Photo / Selfie */}
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-[hsl(220,20%,94%)] border-2 border-[hsl(220,20%,88%)]">
                  {selectedSeller.selfie_file || selectedSeller.profile_photo ? (
                    <img src={selectedSeller.selfie_file || selectedSeller.profile_photo} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Camera className="w-8 h-8 text-[hsl(220,15%,70%)]" />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[hsl(220,20%,15%)]">{selectedSeller.full_name || selectedSeller.name}</h3>
                  <p className="text-sm text-[hsl(220,15%,55%)]">{selectedSeller.email}</p>
                  {selectedSeller.priority_fee_paid && (
                    <span className="inline-block mt-1 px-2.5 py-0.5 bg-[hsl(35,90%,90%)] text-[hsl(35,80%,35%)] text-[10px] font-bold rounded-md">PRIORITY VERIFICATION</span>
                  )}
                </div>
              </div>

              {/* Personal Information */}
              <div className="bg-[hsl(220,20%,97%)] rounded-xl p-4">
                <h4 className="text-sm font-bold text-[hsl(220,20%,15%)] mb-3">Personal Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                  <InfoRow icon={Users} label="Full Name" value={selectedSeller.full_name} />
                  <InfoRow icon={Users} label="Display Name" value={selectedSeller.name} />
                  <InfoRow icon={Mail} label="Email" value={selectedSeller.email} />
                  <InfoRow icon={Phone} label="Phone" value={selectedSeller.phone} />
                  <InfoRow icon={MapPin} label="Address" value={selectedSeller.address} />
                  {selectedSeller.business_name && <InfoRow icon={Building} label="Business Name" value={selectedSeller.business_name} />}
                  {selectedSeller.gst_number && <InfoRow icon={FileText} label="GST Number" value={selectedSeller.gst_number} />}
                </div>
              </div>

              {/* Documents */}
              <div>
                <h4 className="text-sm font-bold text-[hsl(220,20%,15%)] mb-3">Uploaded Documents</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <DocViewer label="Aadhaar Card" url={selectedSeller.aadhaar_file} />
                  <DocViewer label="PAN Card" url={selectedSeller.pan_card_file} />
                  <DocViewer label="Live Selfie" url={selectedSeller.selfie_file} />
                  <DocViewer label="Breeder License" url={selectedSeller.breeder_license} />
                </div>
              </div>
            </div>

            {/* Action Footer */}
            <div className="sticky bottom-0 bg-white border-t border-[hsl(220,20%,92%)] px-6 py-4 flex justify-end gap-3 rounded-b-2xl">
              <button onClick={() => { actions.rejectSeller(selectedSeller.id); setSelectedSeller(null); }} className="px-6 py-2.5 border border-[hsl(0,60%,70%)] text-[hsl(0,65%,50%)] text-sm font-medium rounded-xl hover:bg-[hsl(0,60%,97%)] flex items-center gap-2">
                <XCircle className="w-4 h-4" /> Reject Application
              </button>
              <button onClick={() => { actions.approveSeller(selectedSeller.id); setSelectedSeller(null); }} className="px-6 py-2.5 bg-[hsl(145,55%,42%)] text-white text-sm font-medium rounded-xl hover:bg-[hsl(145,55%,38%)] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Approve Seller
              </button>
            </div>
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
                    {seller.selfie_file || seller.profile_photo ? (
                      <img src={seller.selfie_file || seller.profile_photo} className="w-full h-full object-cover" />
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
                  <button onClick={() => setSelectedSeller(seller)} className="px-4 py-2 bg-white border border-[hsl(220,20%,85%)] text-[hsl(220,15%,40%)] text-[12px] font-medium rounded-lg hover:bg-[hsl(220,20%,96%)] flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5" /> Review
                  </button>
                  <button onClick={() => actions.approveSeller(seller.id)} className="px-4 py-2 bg-[hsl(220,80%,50%)] text-white text-[12px] font-medium rounded-lg hover:bg-[hsl(220,80%,45%)] flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                  </button>
                  <button onClick={() => actions.rejectSeller(seller.id)} className="px-4 py-2 border border-[hsl(0,60%,70%)] text-[hsl(0,65%,50%)] text-[12px] font-medium rounded-lg hover:bg-[hsl(0,60%,97%)] flex items-center gap-1.5">
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
                            {u.profile_photo || u.selfie_file ? (
                              <img src={u.profile_photo || u.selfie_file} className="w-full h-full object-cover" />
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
                        <span className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap ${u.is_admin_approved ? "bg-[hsl(145,50%,92%)] text-[hsl(145,60%,35%)]" : u.is_onboarding_complete ? "bg-[hsl(40,60%,92%)] text-[hsl(40,70%,35%)]" : "bg-[hsl(220,20%,94%)] text-[hsl(220,15%,55%)]"}`}>
                          {u.is_admin_approved ? "Approved" : u.is_onboarding_complete ? "Pending" : "Active"}
                        </span>
                      </td>
                      <td className="py-3.5 text-[hsl(220,15%,55%)] text-[13px]">{new Date(u.created_at).toLocaleDateString()}</td>
                      <td className="py-3.5 text-center">
                        {(u.role === "seller" || u.role === "product_seller") && u.is_onboarding_complete ? (
                          <button onClick={() => setSelectedSeller(u)} className="inline-flex items-center gap-1 px-3 py-1.5 text-[12px] text-[hsl(220,80%,50%)] font-medium rounded-lg border border-[hsl(220,80%,85%)] hover:bg-[hsl(220,80%,96%)] transition-colors">
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
