import { AdminData } from "@/pages/AdminDashboard";
import { useState } from "react";
import { Search, CheckCircle2, XCircle, Eye, Star, X, FileText, Phone, Mail, MapPin, Clock, Calendar, CreditCard, Stethoscope, Camera, GraduationCap, Building } from "lucide-react";

interface Props {
  data: AdminData;
  actions: any;
}

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

const AdminVets = ({ data, actions }: Props) => {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedVet, setSelectedVet] = useState<any>(null);

  const filtered = data.allVets.filter((v: any) => {
    const matchSearch = !search || v.profile?.name?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || v.verification_status === filter;
    return matchSearch && matchFilter;
  });

  const pendingVets = data.pendingVets;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[28px] font-bold text-[hsl(220,20%,15%)]">Veterinary Management</h1>
          <p className="text-sm text-[hsl(220,15%,55%)] mt-1">Manage all registered veterinary doctors</p>
        </div>
      </div>

      {/* Vet Detail Modal */}
      {selectedVet && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50" onClick={() => setSelectedVet(null)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-[hsl(220,20%,92%)] px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <div>
                <h2 className="text-lg font-bold text-[hsl(220,20%,15%)]">Vet Application Review</h2>
                <p className="text-[12px] text-[hsl(220,15%,55%)]">Applied {new Date(selectedVet.created_at).toLocaleDateString()}</p>
              </div>
              <button onClick={() => setSelectedVet(null)} className="w-8 h-8 rounded-lg bg-[hsl(220,20%,96%)] flex items-center justify-center hover:bg-[hsl(220,20%,92%)]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Profile Photo */}
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-[hsl(220,20%,94%)] border-2 border-[hsl(220,20%,88%)]">
                  {selectedVet.profile_photo || selectedVet.profile?.profile_photo ? (
                    <img src={selectedVet.profile_photo || selectedVet.profile?.profile_photo} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><Camera className="w-8 h-8 text-[hsl(220,15%,70%)]" /></div>
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[hsl(220,20%,15%)]">Dr. {selectedVet.profile?.name || "Doctor"}</h3>
                  <p className="text-sm text-[hsl(220,15%,55%)]">{selectedVet.profile?.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2.5 py-0.5 bg-[hsl(220,60%,95%)] text-[hsl(220,70%,45%)] text-[11px] font-bold rounded-md">{selectedVet.qualification}</span>
                    <span className="text-[12px] text-[hsl(220,15%,55%)]">{selectedVet.years_of_experience} yrs experience</span>
                  </div>
                </div>
              </div>

              {/* Professional Details */}
              <div className="bg-[hsl(220,20%,97%)] rounded-xl p-4">
                <h4 className="text-sm font-bold text-[hsl(220,20%,15%)] mb-3 flex items-center gap-2"><GraduationCap className="w-4 h-4" /> Professional Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                  <InfoRow icon={Stethoscope} label="Qualification" value={selectedVet.qualification} />
                  <InfoRow icon={FileText} label="Registration Number" value={selectedVet.registration_number} />
                  <InfoRow icon={Stethoscope} label="Specializations" value={selectedVet.specializations?.join(", ")} />
                  <InfoRow icon={Clock} label="Consultation Type" value={selectedVet.consultation_type} />
                  <InfoRow icon={MapPin} label="Clinic Address" value={selectedVet.clinic_address} />
                  <InfoRow icon={Phone} label="Phone" value={selectedVet.profile?.phone} />
                  <InfoRow icon={Mail} label="Email" value={selectedVet.profile?.email} />
                  <InfoRow icon={Calendar} label="Preferred Language" value={selectedVet.preferred_language} />
                </div>
              </div>

              {/* Availability & Fees */}
              <div className="bg-[hsl(145,30%,97%)] rounded-xl p-4">
                <h4 className="text-sm font-bold text-[hsl(220,20%,15%)] mb-3 flex items-center gap-2"><Calendar className="w-4 h-4" /> Availability & Fees</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                  <InfoRow icon={Calendar} label="Available Days" value={selectedVet.available_days?.join(", ")} />
                  <InfoRow icon={Clock} label="Morning Slots" value={selectedVet.morning_slots ? "Available" : "Not Available"} />
                  <InfoRow icon={Clock} label="Evening Slots" value={selectedVet.evening_slots ? "Available" : "Not Available"} />
                  <InfoRow icon={CreditCard} label="Online Fee" value={`₹${selectedVet.online_fee}`} />
                  <InfoRow icon={CreditCard} label="Offline Fee" value={`₹${selectedVet.offline_fee}`} />
                </div>
              </div>

              {/* Bank Details */}
              <div className="bg-[hsl(40,40%,97%)] rounded-xl p-4">
                <h4 className="text-sm font-bold text-[hsl(220,20%,15%)] mb-3 flex items-center gap-2"><CreditCard className="w-4 h-4" /> Bank Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                  <InfoRow icon={Building} label="Account Holder" value={selectedVet.bank_account_name} />
                  <InfoRow icon={Building} label="Bank Name" value={selectedVet.bank_name} />
                  <InfoRow icon={CreditCard} label="Account Number" value={selectedVet.bank_account_number} />
                  <InfoRow icon={FileText} label="IFSC Code" value={selectedVet.bank_ifsc} />
                </div>
              </div>

              {/* Documents */}
              <div>
                <h4 className="text-sm font-bold text-[hsl(220,20%,15%)] mb-3">Uploaded Documents</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <DocViewer label="Veterinary Degree" url={selectedVet.vet_degree_file} />
                  <DocViewer label="Government ID" url={selectedVet.govt_id_file} />
                  <DocViewer label="Clinic Registration" url={selectedVet.clinic_registration_file} />
                  <DocViewer label="Profile Photo" url={selectedVet.profile_photo || selectedVet.profile?.profile_photo} />
                </div>
              </div>
            </div>

            {/* Action Footer */}
            <div className="sticky bottom-0 bg-white border-t border-[hsl(220,20%,92%)] px-6 py-4 flex justify-end gap-3 rounded-b-2xl">
              <button onClick={() => { actions.rejectVet(selectedVet.user_id); setSelectedVet(null); }} className="px-6 py-2.5 border border-[hsl(0,60%,70%)] text-[hsl(0,65%,50%)] text-sm font-medium rounded-xl hover:bg-[hsl(0,60%,97%)] flex items-center gap-2">
                <XCircle className="w-4 h-4" /> Reject Application
              </button>
              <button onClick={() => { actions.approveVet(selectedVet.user_id); setSelectedVet(null); }} className="px-6 py-2.5 bg-[hsl(145,55%,42%)] text-white text-sm font-medium rounded-xl hover:bg-[hsl(145,55%,38%)] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Approve Vet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pending Vet Approvals */}
      {pendingVets.length > 0 && (
        <div className="bg-white rounded-2xl border border-[hsl(220,20%,92%)] p-6 mb-6">
          <h2 className="text-lg font-bold text-[hsl(220,20%,15%)] mb-4 flex items-center gap-2">
            Pending Verifications
            <span className="px-2.5 py-0.5 bg-[hsl(0,75%,55%)] text-white text-[11px] font-bold rounded-full">{pendingVets.length}</span>
          </h2>
          <div className="space-y-3">
            {pendingVets.map((vet: any) => (
              <div key={vet.id} className="flex items-center justify-between p-4 bg-[hsl(40,60%,97%)] rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-[hsl(220,20%,94%)]">
                    {vet.profile?.profile_photo || vet.profile_photo ? (
                      <img src={vet.profile?.profile_photo || vet.profile_photo} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[hsl(220,15%,55%)] font-bold">{(vet.profile?.name || "V")[0]}</div>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-[hsl(220,20%,15%)]">{vet.profile?.name || "Doctor"}</p>
                    <p className="text-[12px] text-[hsl(220,15%,55%)]">{vet.qualification} • {vet.years_of_experience} yrs exp</p>
                    <p className="text-[12px] text-[hsl(220,15%,55%)]">{vet.specializations?.join(", ")}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setSelectedVet(vet)} className="px-4 py-2 bg-white border border-[hsl(220,20%,85%)] text-[hsl(220,15%,40%)] text-[12px] font-medium rounded-lg hover:bg-[hsl(220,20%,96%)] flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5" /> Review
                  </button>
                  <button onClick={() => actions.approveVet(vet.user_id)} className="px-4 py-2 bg-[hsl(220,80%,50%)] text-white text-[12px] font-medium rounded-lg hover:bg-[hsl(220,80%,45%)] flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                  </button>
                  <button onClick={() => actions.rejectVet(vet.user_id)} className="px-4 py-2 border border-[hsl(0,60%,70%)] text-[hsl(0,65%,50%)] text-[12px] font-medium rounded-lg hover:bg-[hsl(0,60%,97%)] flex items-center gap-1.5">
                    <XCircle className="w-3.5 h-3.5" /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Vets Table */}
      <div className="bg-white rounded-2xl border border-[hsl(220,20%,92%)] p-6">
        <div className="flex items-center gap-4 mb-5">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(220,15%,60%)]" />
            <input type="text" placeholder="Search vets..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[hsl(220,20%,97%)] border border-[hsl(220,20%,92%)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(220,80%,50%)]/20"
            />
          </div>
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="px-4 py-2.5 border border-[hsl(220,20%,88%)] rounded-xl text-sm bg-white focus:outline-none">
            <option value="all">All Status</option>
            <option value="verified">Verified</option>
            <option value="pending">Pending</option>
            <option value="failed">Rejected</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[hsl(220,20%,92%)]">
                <th className="pb-3 text-left font-semibold text-[hsl(220,15%,55%)]">Doctor</th>
                <th className="pb-3 text-left font-semibold text-[hsl(220,15%,55%)]">Qualification</th>
                <th className="pb-3 text-left font-semibold text-[hsl(220,15%,55%)]">Specializations</th>
                <th className="pb-3 text-left font-semibold text-[hsl(220,15%,55%)]">Rating</th>
                <th className="pb-3 text-left font-semibold text-[hsl(220,15%,55%)]">Status</th>
                <th className="pb-3 text-left font-semibold text-[hsl(220,15%,55%)]">Fee</th>
                <th className="pb-3 text-left font-semibold text-[hsl(220,15%,55%)]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="py-8 text-center text-[hsl(220,15%,60%)]">No vets found</td></tr>
              ) : (
                filtered.map((v: any) => (
                  <tr key={v.id} className="border-b border-[hsl(220,20%,95%)] hover:bg-[hsl(220,20%,98%)]">
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[hsl(220,20%,94%)] flex items-center justify-center text-[12px] font-bold text-[hsl(220,15%,45%)] overflow-hidden">
                          {v.profile?.profile_photo || v.profile_photo ? (
                            <img src={v.profile?.profile_photo || v.profile_photo} className="w-full h-full object-cover" />
                          ) : (v.profile?.name || "V")[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-[hsl(220,20%,15%)]">{v.profile?.name || "Doctor"}</p>
                          <p className="text-[11px] text-[hsl(220,15%,60%)]">{v.years_of_experience} yrs exp</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-[hsl(220,15%,45%)]">{v.qualification}</td>
                    <td className="py-3 text-[hsl(220,15%,45%)]">{v.specializations?.slice(0, 2).join(", ") || "—"}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-[hsl(40,90%,50%)] text-[hsl(40,90%,50%)]" />
                        <span className="text-[hsl(220,20%,15%)] font-medium">{v.average_rating || "0"}</span>
                      </div>
                    </td>
                    <td className="py-3">
                      <span className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold ${
                        v.verification_status === "verified" ? "bg-[hsl(145,50%,92%)] text-[hsl(145,60%,35%)]" :
                        v.verification_status === "pending" ? "bg-[hsl(40,60%,92%)] text-[hsl(40,70%,35%)]" :
                        "bg-[hsl(0,50%,93%)] text-[hsl(0,65%,45%)]"
                      }`}>{v.verification_status}</span>
                    </td>
                    <td className="py-3 font-medium text-[hsl(220,20%,15%)]">₹{v.online_fee}</td>
                    <td className="py-3">
                      <button onClick={() => setSelectedVet(v)} className="text-[12px] text-[hsl(220,80%,50%)] font-medium hover:underline flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" /> View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminVets;
