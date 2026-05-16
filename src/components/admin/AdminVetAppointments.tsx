import { useState } from "react";
import { AdminData } from "@/pages/AdminDashboard";
import { Search, Calendar, Clock, User, Phone, Mail, FileText, CheckCircle2, XCircle, MapPin, Eye, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface Props {
  data: AdminData;
  actions: any;
}

export default function AdminVetAppointments({ data, actions }: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedApt, setSelectedApt] = useState<any>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const { toast } = useToast();

  const handleStatusChange = async (id: string, newStatus: string) => {
    setUpdating(id);
    try {
      const { error } = await supabase.from("vet_appointments").update({ status: newStatus }).eq("id", id);
      if (error) throw error;
      toast({ title: "Appointment Status Updated" });
      actions.fetchData();
    } catch (err: any) {
      toast({ title: "Failed to update", description: err.message, variant: "destructive" });
    } finally {
      setUpdating(null);
    }
  };

  const filtered = (data.vetAppointments || []).filter(a => {
    const searchMatch = !search || 
      a.pet_name?.toLowerCase().includes(search.toLowerCase()) ||
      a.vet?.name?.toLowerCase().includes(search.toLowerCase()) || 
      a.user?.name?.toLowerCase().includes(search.toLowerCase());
    const statusMatch = statusFilter === "all" || a.status === statusFilter;
    return searchMatch && statusMatch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return "bg-green-100 text-green-700";
      case 'completed': return "bg-blue-100 text-blue-700";
      case 'cancelled': return "bg-red-100 text-red-700";
      default: return "bg-yellow-100 text-yellow-700";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[hsl(220,20%,15%)]">Vet Appointments</h1>
          <p className="text-[hsl(220,15%,55%)] text-sm">Manage all veterinary appointments</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[hsl(220,20%,92%)] p-6">
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-5">
          <div className="relative flex-1 w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(220,15%,60%)]" />
            <input type="text" placeholder="Search appointments..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[hsl(220,20%,97%)] border border-[hsl(220,20%,92%)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(220,80%,50%)]/20"
            />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full sm:w-auto px-4 py-2.5 border border-[hsl(220,20%,88%)] rounded-xl text-sm bg-white focus:outline-none">
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="border-b-2 border-[hsl(220,20%,90%)]">
                <th className="pb-3 pt-1 text-left font-semibold text-[hsl(220,15%,55%)]">Pet / User</th>
                <th className="pb-3 pt-1 text-left font-semibold text-[hsl(220,15%,55%)]">Vet</th>
                <th className="pb-3 pt-1 text-left font-semibold text-[hsl(220,15%,55%)]">Date & Time</th>
                <th className="pb-3 pt-1 text-left font-semibold text-[hsl(220,15%,55%)]">Type</th>
                <th className="pb-3 pt-1 text-left font-semibold text-[hsl(220,15%,55%)]">Status</th>
                <th className="pb-3 pt-1 text-center font-semibold text-[hsl(220,15%,55%)]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="py-8 text-center text-[hsl(220,15%,60%)]">No appointments found</td></tr>
              ) : (
                filtered.map((a: any) => (
                  <tr key={a.id} className="border-b border-[hsl(220,20%,94%)] hover:bg-[hsl(220,30%,97%)] transition-colors">
                    <td className="py-3.5 pr-2">
                      <p className="font-medium text-[hsl(220,20%,15%)] truncate">{a.pet_name} ({a.pet_type})</p>
                      <p className="text-[11px] text-[hsl(220,15%,60%)] truncate">By: {a.user?.name}</p>
                    </td>
                    <td className="py-3.5 pr-2">
                      <p className="font-medium text-[hsl(220,20%,15%)] truncate">Dr. {a.vet?.name}</p>
                    </td>
                    <td className="py-3.5 pr-2">
                      <p className="font-medium text-[hsl(220,20%,15%)] truncate">{new Date(a.appointment_date).toLocaleDateString()}</p>
                      <p className="text-[11px] text-[hsl(220,15%,60%)] truncate">{a.appointment_time}</p>
                    </td>
                    <td className="py-3.5 pr-2">
                      <span className="capitalize text-[11px] font-semibold text-[hsl(220,20%,30%)] bg-[hsl(220,20%,94%)] px-2 py-1 rounded-md">{a.appointment_type}</span>
                    </td>
                    <td className="py-3.5 pr-2">
                      <div className="relative inline-block w-min">
                        <select 
                          value={a.status}
                          disabled={updating === a.id}
                          onChange={(e) => handleStatusChange(a.id, e.target.value)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer outline-none border-none pr-8 appearance-none capitalize
                            ${getStatusColor(a.status)}
                            ${updating === a.id ? "opacity-50 animate-pulse" : "hover:brightness-95"}`}
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                    </td>
                    <td className="py-3.5 text-center">
                      <button onClick={() => setSelectedApt(a)} className="px-3 py-1.5 bg-white border border-[hsl(220,20%,85%)] text-[hsl(220,15%,40%)] text-[12px] font-medium rounded-lg hover:bg-[hsl(220,20%,96%)] inline-flex items-center gap-1.5">
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

      {selectedApt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden flex flex-col relative my-auto">
            <div className="p-6 border-b border-[hsl(220,20%,92%)] flex justify-between items-center bg-[hsl(220,50%,99%)]">
              <h2 className="font-bold text-[18px] text-[hsl(220,20%,15%)]">Appointment Details</h2>
              <button onClick={() => setSelectedApt(null)} className="p-1.5 text-[hsl(220,15%,60%)] hover:bg-[hsl(220,20%,90%)] hover:text-[hsl(220,20%,15%)] rounded-xl transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 pb-8">
              <div>
                <p className="text-[11px] font-bold text-[hsl(220,15%,60%)] uppercase tracking-wider mb-2">Pet Details</p>
                <div className="space-y-2">
                  <p><span className="text-[hsl(220,15%,40%)] font-medium">Name:</span> {selectedApt.pet_name}</p>
                  <p><span className="text-[hsl(220,15%,40%)] font-medium">Type:</span> <span className="capitalize">{selectedApt.pet_type}</span></p>
                  <p><span className="text-[hsl(220,15%,40%)] font-medium">Breed:</span> {selectedApt.pet_breed || "N/A"}</p>
                </div>
              </div>
              <div>
                <p className="text-[11px] font-bold text-[hsl(220,15%,60%)] uppercase tracking-wider mb-2">Appointment</p>
                <div className="space-y-2">
                  <p><span className="text-[hsl(220,15%,40%)] font-medium">Date:</span> {new Date(selectedApt.appointment_date).toLocaleDateString()}</p>
                  <p><span className="text-[hsl(220,15%,40%)] font-medium">Time:</span> {selectedApt.appointment_time}</p>
                  <p><span className="text-[hsl(220,15%,40%)] font-medium">Type:</span> <span className="capitalize">{selectedApt.appointment_type}</span></p>
                  <p><span className="text-[hsl(220,15%,40%)] font-medium">Status:</span> <span className={`capitalize px-2 py-0.5 rounded text-[10px] font-bold ${getStatusColor(selectedApt.status)}`}>{selectedApt.status}</span></p>
                </div>
              </div>
              <div>
                <p className="text-[11px] font-bold text-[hsl(220,15%,60%)] uppercase tracking-wider mb-2">User Details</p>
                <div className="space-y-2 text-sm">
                  <p className="font-semibold">{selectedApt.user?.name}</p>
                  <p className="flex items-center gap-2 text-[hsl(220,15%,40%)]"><Mail className="w-3.5 h-3.5" /> {selectedApt.user?.email}</p>
                  <p className="flex items-center gap-2 text-[hsl(220,15%,40%)]"><Phone className="w-3.5 h-3.5" /> {selectedApt.user?.phone || 'N/A'}</p>
                </div>
              </div>
              <div>
                <p className="text-[11px] font-bold text-[hsl(220,15%,60%)] uppercase tracking-wider mb-2">Vet Details</p>
                <div className="space-y-2 text-sm">
                  <p className="font-semibold">Dr. {selectedApt.vet?.name}</p>
                  <p className="flex items-center gap-2 text-[hsl(220,15%,40%)]"><Mail className="w-3.5 h-3.5" /> {selectedApt.vet?.email}</p>
                  <p className="flex items-center gap-2 text-[hsl(220,15%,40%)]"><Phone className="w-3.5 h-3.5" /> {selectedApt.vet?.phone || 'N/A'}</p>
                </div>
              </div>
            </div>
            <div className="p-6 bg-[hsl(220,20%,98%)] border-t border-[hsl(220,20%,92%)] flex justify-end gap-3 rounded-b-2xl">
              <button onClick={() => setSelectedApt(null)} className="px-5 py-2.5 bg-white border border-[hsl(220,20%,85%)] text-[hsl(220,15%,40%)] text-sm font-medium rounded-xl hover:bg-[hsl(220,20%,96%)]">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
