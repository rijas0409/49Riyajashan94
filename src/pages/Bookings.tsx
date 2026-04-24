import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ArrowLeft, Package, Loader2, MapPin, Truck, CheckCircle2,
  Clock, XCircle, ShoppingBag, Stethoscope, Video, Building2, Home as HomeIcon, Calendar as CalendarIcon
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import BottomNavigation from "@/components/BottomNavigation";

interface OrderWithPet {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  pet_id: string;
  pets: {
    name: string;
    breed: string;
    images: string[] | null;
    city: string;
    state: string;
    category: string;
  } | null;
}

interface VetAppointment {
  id: string;
  pet_name: string;
  pet_type: string;
  pet_breed: string | null;
  appointment_type: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  amount: number;
  created_at: string;
  vet_id: string;
  diagnosis: string | null;
  consultation_notes: string | null;
  medicines: string | null;
  care_instructions: string | null;
}

type BookingItem =
  | { type: "pet_order"; data: OrderWithPet; sortDate: string }
  | { type: "vet_appointment"; data: VetAppointment; sortDate: string };

const petStatusConfig: Record<string, { label: string; color: string; icon: any; bg: string }> = {
  pending: { label: "Order Placed", color: "text-amber-700", icon: Clock, bg: "bg-amber-50" },
  accepted: { label: "Accepted", color: "text-blue-700", icon: CheckCircle2, bg: "bg-blue-50" },
  preparing: { label: "Preparing", color: "text-purple-700", icon: Package, bg: "bg-purple-50" },
  ready: { label: "Ready for Pickup", color: "text-indigo-700", icon: Package, bg: "bg-indigo-50" },
  picked: { label: "In Transit", color: "text-orange-700", icon: Truck, bg: "bg-orange-50" },
  delivered: { label: "Delivered", color: "text-green-700", icon: CheckCircle2, bg: "bg-green-50" },
  cancelled: { label: "Cancelled", color: "text-red-600", icon: XCircle, bg: "bg-red-50" },
};

const vetStatusConfig: Record<string, { label: string; color: string; icon: any; bg: string }> = {
  pending: { label: "Pending", color: "text-amber-700", icon: Clock, bg: "bg-amber-50" },
  confirmed: { label: "Confirmed", color: "text-blue-700", icon: CheckCircle2, bg: "bg-blue-50" },
  in_progress: { label: "In Progress", color: "text-purple-700", icon: Video, bg: "bg-purple-50" },
  completed: { label: "Completed", color: "text-green-700", icon: CheckCircle2, bg: "bg-green-50" },
  cancelled: { label: "Cancelled", color: "text-red-600", icon: XCircle, bg: "bg-red-50" },
};

const petStatusSteps = ["pending", "accepted", "preparing", "ready", "picked", "delivered"];

const appointmentTypeIcons: Record<string, any> = {
  online: Video,
  offline: Building2,
  home_visit: HomeIcon,
};

type TabType = "all" | "pets" | "vet";

const Bookings = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderWithPet[]>([]);
  const [appointments, setAppointments] = useState<VetAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("all");

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { navigate("/auth"); return; }

      const [ordersRes, appointmentsRes] = await Promise.all([
        supabase
          .from("orders")
          .select("id, amount, status, created_at, pet_id, pets(name, breed, images, city, state, category)")
          .eq("buyer_id", session.user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("vet_appointments")
          .select("*")
          .eq("user_id", session.user.id)
          .order("created_at", { ascending: false }),
      ]);

      if (ordersRes.data) setOrders(ordersRes.data as unknown as OrderWithPet[]);
      if (appointmentsRes.data) setAppointments(appointmentsRes.data as unknown as VetAppointment[]);
    } catch {
      console.error("Failed to fetch bookings");
    } finally {
      setLoading(false);
    }
  };

  const allBookings: BookingItem[] = [
    ...orders.map((o): BookingItem => ({ type: "pet_order", data: o, sortDate: o.created_at })),
    ...appointments.map((a): BookingItem => ({ type: "vet_appointment", data: a, sortDate: a.created_at })),
  ].sort((a, b) => new Date(b.sortDate).getTime() - new Date(a.sortDate).getTime());

  const filteredBookings = activeTab === "all"
    ? allBookings
    : activeTab === "pets"
    ? allBookings.filter((b) => b.type === "pet_order")
    : allBookings.filter((b) => b.type === "vet_appointment");

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  const getStepIndex = (status: string) => {
    const idx = petStatusSteps.indexOf(status);
    return idx >= 0 ? idx : 0;
  };

  const tabs: { id: TabType; label: string; count: number }[] = [
    { id: "all", label: "All", count: allBookings.length },
    { id: "pets", label: "Pet Orders", count: orders.length },
    { id: "vet", label: "Vet Visits", count: appointments.length },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7] pb-24">
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold text-foreground">My Bookings</h1>
        </div>
      </header>

      {/* Tabs */}
      <div className="sticky top-[65px] z-40 bg-[#F5F5F7] px-4 pt-3 pb-1">
        <div className="flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-card text-muted-foreground border border-border"
              }`}
            >
              {tab.label} {tab.count > 0 && <span className="ml-1">({tab.count})</span>}
            </button>
          ))}
        </div>
      </div>

      <main className="container mx-auto px-4 py-4 max-w-lg space-y-4">
        {filteredBookings.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
              <ShoppingBag className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold mb-2 text-foreground">No bookings yet</h2>
            <p className="text-muted-foreground text-sm mb-6">
              {activeTab === "vet" ? "Your vet appointments will appear here" : "Your orders & appointments will appear here"}
            </p>
            <Button onClick={() => navigate(activeTab === "vet" ? "/vet" : "/buyer-dashboard")} className="rounded-2xl">
              {activeTab === "vet" ? "Book a Vet" : "Browse Pets"}
            </Button>
          </div>
        ) : (
          filteredBookings.map((booking) =>
            booking.type === "pet_order" ? (
              <PetOrderCard key={`pet-${booking.data.id}`} order={booking.data} formatDate={formatDate} getStepIndex={getStepIndex} navigate={navigate} />
            ) : (
              <VetAppointmentCard key={`vet-${booking.data.id}`} appointment={booking.data} formatDate={formatDate} navigate={navigate} />
            )
          )
        )}
      </main>
      <BottomNavigation variant="buyer" />
    </div>
  );
};

/* ─── Pet Order Card ─── */
const PetOrderCard = ({
  order, formatDate, getStepIndex, navigate,
}: {
  order: OrderWithPet;
  formatDate: (d: string) => string;
  getStepIndex: (s: string) => number;
  navigate: (path: string) => void;
}) => {
  const pet = order.pets;
  const config = petStatusConfig[order.status || "pending"] || petStatusConfig.pending;
  const StatusIcon = config.icon;
  const currentStep = getStepIndex(order.status || "pending");
  const isCancelled = order.status === "cancelled";
  const isDelivered = order.status === "delivered";
  const img = pet?.images?.[0] || "/placeholder.svg";

  return (
    <Card
      className="rounded-2xl border-0 shadow-sm overflow-hidden cursor-pointer active:scale-[0.99] transition-transform"
      onClick={() => navigate(`/pet/${order.pet_id}`)}
    >
      {/* Type badge */}
      <div className="px-4 pt-3 flex items-center gap-1.5">
        <Package className="w-3.5 h-3.5 text-primary" />
        <span className="text-[10px] font-semibold text-primary uppercase tracking-wide">Pet Order</span>
      </div>

      <div className="p-4 pt-2 flex gap-3">
        <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-muted">
          <img src={img} alt={pet?.breed || "Pet"} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-bold text-[15px] text-foreground truncate">
                {pet?.name} ({pet?.breed})
              </h3>
              <p className="text-xs text-muted-foreground capitalize mt-0.5">{pet?.category}</p>
            </div>
            <p className="font-bold text-primary text-sm">₹{order.amount.toLocaleString("en-IN")}</p>
          </div>
          <div className="flex items-center gap-1 mt-1">
            <MapPin className="w-3 h-3 text-muted-foreground" />
            <span className="text-[11px] text-muted-foreground">{pet?.city}, {pet?.state}</span>
          </div>
          <div className="flex items-center justify-between mt-2">
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${config.bg}`}>
              <StatusIcon className={`w-3 h-3 ${config.color}`} />
              <span className={`text-[11px] font-semibold ${config.color}`}>{config.label}</span>
            </div>
            <span className="text-[10px] text-muted-foreground">{formatDate(order.created_at)}</span>
          </div>
        </div>
      </div>

      {!isCancelled && (
        <div className="px-4 pb-4">
          <div className="flex items-center gap-1">
            {petStatusSteps.map((_, i) => (
              <div key={i} className="flex-1">
                <div
                  className={`h-1.5 w-full rounded-full transition-colors ${
                    i <= currentStep ? (isDelivered ? "bg-green-500" : "bg-primary") : "bg-muted"
                  }`}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-[9px] text-muted-foreground">Ordered</span>
            <span className="text-[9px] text-muted-foreground">Delivered</span>
          </div>
        </div>
      )}
    </Card>
  );
};

/* ─── Vet Appointment Card ─── */
const VetAppointmentCard = ({
  appointment, formatDate, navigate,
}: {
  appointment: VetAppointment;
  formatDate: (d: string) => string;
  navigate: (path: string) => void;
}) => {
  const config = vetStatusConfig[appointment.status] || vetStatusConfig.pending;
  const StatusIcon = config.icon;
  const TypeIcon = appointmentTypeIcons[appointment.appointment_type] || Video;

  const typeLabel =
    appointment.appointment_type === "online"
      ? "Video Call"
      : appointment.appointment_type === "offline"
      ? "Clinic Visit"
      : "Home Visit";

  return (
    <Card
      className="rounded-2xl border-0 shadow-sm overflow-hidden cursor-pointer active:scale-[0.99] transition-transform"
      onClick={() => navigate(`/vet/booking-details?id=${appointment.id}`)}
    >
      {/* Type badge */}
      <div className="px-4 pt-3 flex items-center gap-1.5">
        <Stethoscope className="w-3.5 h-3.5 text-[#7c3aed]" />
        <span className="text-[10px] font-semibold text-[#7c3aed] uppercase tracking-wide">Vet Appointment</span>
      </div>

      <div className="p-4 pt-2">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-[15px] text-foreground">
              {appointment.pet_name}
              {appointment.pet_breed && <span className="text-muted-foreground font-normal text-sm"> ({appointment.pet_breed})</span>}
            </h3>
            <p className="text-xs text-muted-foreground capitalize mt-0.5">{appointment.pet_type}</p>
          </div>
          <p className="font-bold text-primary text-sm">₹{appointment.amount.toLocaleString("en-IN")}</p>
        </div>

        {/* Appointment type & schedule */}
        <div className="flex items-center gap-4 mt-3">
          <div className="flex items-center gap-1.5 bg-[#7c3aed]/10 px-2.5 py-1 rounded-full">
            <TypeIcon className="w-3.5 h-3.5 text-[#7c3aed]" />
            <span className="text-[11px] font-semibold text-[#7c3aed]">{typeLabel}</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <CalendarIcon className="w-3 h-3" />
            <span className="text-[11px]">{formatDate(appointment.appointment_date)}</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span className="text-[11px]">{appointment.appointment_time}</span>
          </div>
        </div>

        {/* Status & date */}
        <div className="flex items-center justify-between mt-3">
          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${config.bg}`}>
            <StatusIcon className={`w-3 h-3 ${config.color}`} />
            <span className={`text-[11px] font-semibold ${config.color}`}>{config.label}</span>
          </div>
          <span className="text-[10px] text-muted-foreground">Booked on {formatDate(appointment.created_at)}</span>
        </div>

        {/* Diagnosis summary if completed */}
        {appointment.status === "completed" && appointment.diagnosis && (
          <div className="mt-3 p-3 bg-green-50 rounded-xl">
            <p className="text-[11px] font-semibold text-green-800 mb-1">Diagnosis</p>
            <p className="text-[11px] text-green-700 line-clamp-2">{appointment.diagnosis}</p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default Bookings;
