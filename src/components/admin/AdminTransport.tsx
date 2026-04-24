import { AdminData } from "@/pages/AdminDashboard";
import { useState } from "react";
import { Search, UserPlus, MapPin, Truck, Package } from "lucide-react";

interface Props {
  data: AdminData;
  actions: any;
}

const AdminTransport = ({ data, actions }: Props) => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [assignDialog, setAssignDialog] = useState<{ open: boolean; requestId: string | null }>({ open: false, requestId: null });
  const [selectedPartner, setSelectedPartner] = useState("");

  const filtered = data.requests.filter((r: any) => {
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    const matchSearch = !search || r.pet?.name?.toLowerCase().includes(search.toLowerCase()) || r.seller?.name?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      requested: "bg-[hsl(40,60%,92%)] text-[hsl(40,70%,35%)]",
      assigned: "bg-[hsl(220,40%,93%)] text-[hsl(220,60%,40%)]",
      picked: "bg-[hsl(270,40%,93%)] text-[hsl(270,60%,45%)]",
      delivered: "bg-[hsl(145,50%,92%)] text-[hsl(145,60%,35%)]",
      completed: "bg-[hsl(145,50%,92%)] text-[hsl(145,60%,35%)]",
      cancelled: "bg-[hsl(0,50%,93%)] text-[hsl(0,65%,45%)]",
    };
    return <span className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold ${map[status] || map.requested}`}>{status}</span>;
  };

  const handleAssign = () => {
    if (assignDialog.requestId && selectedPartner) {
      actions.assignPartner(assignDialog.requestId, selectedPartner);
      setAssignDialog({ open: false, requestId: null });
      setSelectedPartner("");
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-[28px] font-bold text-[hsl(220,20%,15%)]">Transport Management</h1>
        <p className="text-sm text-[hsl(220,15%,55%)] mt-1">Manage delivery requests and assign partners</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-6 mb-6">
        {[
          { label: "Total Requests", value: data.requests.length, color: "hsl(220,80%,50%)" },
          { label: "Pending", value: data.requests.filter((r: any) => r.status === "requested").length, color: "hsl(35,90%,50%)" },
          { label: "In Transit", value: data.requests.filter((r: any) => ["assigned", "picked"].includes(r.status)).length, color: "hsl(270,60%,55%)" },
          { label: "Delivered", value: data.requests.filter((r: any) => ["delivered", "completed"].includes(r.status)).length, color: "hsl(145,60%,45%)" },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-2xl border border-[hsl(220,20%,92%)] p-5">
            <p className="text-[13px] text-[hsl(220,15%,55%)] font-medium">{s.label}</p>
            <p className="text-[28px] font-bold text-[hsl(220,20%,15%)] mt-1">{s.value}</p>
            <div className="mt-3 h-1 rounded-full bg-[hsl(220,20%,94%)]"><div className="h-full rounded-full w-1/2" style={{ backgroundColor: s.color }} /></div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(220,15%,60%)]" />
          <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[hsl(220,20%,97%)] border border-[hsl(220,20%,92%)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(220,80%,50%)]/20"
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2.5 border border-[hsl(220,20%,88%)] rounded-xl text-sm bg-white focus:outline-none">
          <option value="all">All Status</option>
          <option value="requested">Requested</option>
          <option value="assigned">Assigned</option>
          <option value="picked">Picked</option>
          <option value="delivered">Delivered</option>
        </select>
      </div>

      {/* Requests */}
      <div className="bg-white rounded-2xl border border-[hsl(220,20%,92%)] p-6">
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <Truck className="w-12 h-12 mx-auto text-[hsl(220,15%,80%)] mb-3" />
            <p className="text-[hsl(220,15%,60%)]">No transport requests found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((r: any) => (
              <div key={r.id} className="flex items-center justify-between p-4 bg-[hsl(220,20%,97%)] rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-[hsl(220,20%,92%)]">
                    {r.pet?.images?.[0] ? <img src={r.pet.images[0]} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Package className="w-5 h-5 text-[hsl(220,15%,60%)]" /></div>}
                  </div>
                  <div>
                    <p className="font-semibold text-[hsl(220,20%,15%)] text-sm">{r.pet?.name || "Pet"}</p>
                    <div className="flex items-center gap-3 text-[12px] text-[hsl(220,15%,55%)]">
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-[hsl(145,60%,45%)]" />{r.pickup_address?.split(",")[0]}</span>
                      <span>→</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-[hsl(220,80%,50%)]" />{r.delivery_address?.split(",")[0]}</span>
                    </div>
                    <p className="text-[12px] font-medium text-[hsl(220,80%,50%)] mt-0.5">{fmt(r.fee)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {statusBadge(r.status)}
                  {r.partner && <span className="text-[12px] text-[hsl(220,15%,50%)]">{r.partner.name}</span>}
                  {r.status === "requested" && (
                    <button onClick={() => setAssignDialog({ open: true, requestId: r.id })} className="px-4 py-2 bg-[hsl(220,80%,50%)] text-white text-[12px] font-medium rounded-lg hover:bg-[hsl(220,80%,45%)] flex items-center gap-1.5">
                      <UserPlus className="w-3.5 h-3.5" /> Assign
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Assign Dialog */}
      {assignDialog.open && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setAssignDialog({ open: false, requestId: null })}>
          <div className="bg-white rounded-2xl p-6 w-[420px] shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-[hsl(220,20%,15%)] mb-4">Assign Delivery Partner</h3>
            <select value={selectedPartner} onChange={(e) => setSelectedPartner(e.target.value)} className="w-full px-4 py-2.5 border border-[hsl(220,20%,88%)] rounded-xl text-sm bg-white focus:outline-none mb-4">
              <option value="">Select partner...</option>
              {data.partners.map((p: any) => <option key={p.id} value={p.id}>{p.name} - {p.phone || p.email}</option>)}
            </select>
            <div className="flex gap-3">
              <button onClick={() => setAssignDialog({ open: false, requestId: null })} className="flex-1 px-4 py-2.5 border border-[hsl(220,20%,88%)] rounded-xl text-sm font-medium text-[hsl(220,15%,45%)]">Cancel</button>
              <button onClick={handleAssign} disabled={!selectedPartner} className="flex-1 px-4 py-2.5 bg-[hsl(220,80%,50%)] text-white rounded-xl text-sm font-medium disabled:opacity-50">Assign</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTransport;
