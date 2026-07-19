import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  ArrowLeft, Bell, ShoppingBag, Stethoscope, Clock, CheckCircle2, 
  Trash2, Eye, Compass, Video, Building2, Home as HomeIcon, ShieldCheck
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";

interface OrderNotification {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  pet_name: string;
  breed: string;
}

interface AppointmentNotification {
  id: string;
  pet_name: string;
  pet_type: string;
  appointment_type: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  created_at: string;
}

interface NotificationItem {
  id: string;
  type: "order" | "appointment" | "promo";
  title: string;
  description: string;
  created_at: string;
  status?: string;
  isRead: boolean;
  actionUrl: string;
  icon: any;
  colorClass: string;
  bgClass: string;
}

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [readIds, setReadIds] = useState<string[]>([]);
  const [clearedIds, setClearedIds] = useState<string[]>([]);

  // Load read and cleared states from localstorage to persist read/unread status
  useEffect(() => {
    const savedRead = localStorage.getItem("sruvo_notifications_read");
    const savedCleared = localStorage.getItem("sruvo_notifications_cleared");
    if (savedRead) setReadIds(JSON.parse(savedRead));
    if (savedCleared) setClearedIds(JSON.parse(savedCleared));
    
    fetchLiveNotifications();

    // Setup real-time listeners for updates
    let sessionUserId = "";
    let apptChannel: any = null;
    let orderChannel: any = null;

    const setupRealtime = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      sessionUserId = session.user.id;

      apptChannel = supabase
        .channel(`rt-notifications-appt-${sessionUserId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "vet_appointments",
            filter: `user_id=eq.${sessionUserId}`
          },
          () => {
            console.log("Realtime notification appt update");
            fetchLiveNotifications();
          }
        )
        .subscribe();

      orderChannel = supabase
        .channel(`rt-notifications-order-${sessionUserId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "orders",
            filter: `buyer_id=eq.${sessionUserId}`
          },
          () => {
            console.log("Realtime notification order update");
            fetchLiveNotifications();
          }
        )
        .subscribe();
    };

    setupRealtime();

    return () => {
      if (apptChannel) supabase.removeChannel(apptChannel);
      if (orderChannel) supabase.removeChannel(orderChannel);
    };
  }, []);

  const fetchLiveNotifications = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setLoading(false);
        return;
      }

      // Fetch latest orders and appointments
      const [ordersRes, apptsRes] = await Promise.all([
        supabase
          .from("orders")
          .select("id, amount, status, created_at, pets(name, breed)")
          .eq("buyer_id", session.user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("vet_appointments")
          .select("id, pet_name, pet_type, appointment_type, appointment_date, appointment_time, status, created_at")
          .eq("user_id", session.user.id)
          .order("created_at", { ascending: false })
      ]);

      const items: NotificationItem[] = [];

      // Process Orders into Notification items
      if (ordersRes.data) {
        ordersRes.data.forEach((o: any) => {
          const petName = o.pets?.name || "Premium Pet";
          const breed = o.pets?.breed || "";
          const status = o.status || "pending";
          
          let title = "Order Placed Successfully";
          let description = `Your order for ${petName} (${breed}) has been registered. Our expert breeders are preparing the puppy!`;
          let colorClass = "text-amber-700";
          let bgClass = "bg-amber-50 border-amber-100/60";

          if (status === "accepted") {
            title = "Order Accepted";
            description = `Great news! The breeder has accepted your request for ${petName}.`;
            colorClass = "text-blue-700";
            bgClass = "bg-blue-50 border-blue-100/60";
          } else if (status === "preparing") {
            title = "Breeder Preparing Documents";
            description = `${petName}'s medical files, passport, and vaccination certificates are being finalized.`;
            colorClass = "text-purple-700";
            bgClass = "bg-purple-50 border-purple-100/60";
          } else if (status === "ready") {
            title = "Ready for Transport / Handover";
            description = `Sruvo pickup coordinates are established. ${petName} is ready to meet you!`;
            colorClass = "text-indigo-700";
            bgClass = "bg-indigo-50 border-indigo-100/60";
          } else if (status === "picked") {
            title = "In Transit 🚚";
            description = `Our specialized animal transport helper is carrying ${petName} to your address securely.`;
            colorClass = "text-orange-700";
            bgClass = "bg-orange-50 border-orange-100/60";
          } else if (status === "delivered") {
            title = "Welcome Home! Delivered 🎉";
            description = `Congratulations! ${petName} has been safely delivered to your location. Give them lots of cuddles!`;
            colorClass = "text-green-700";
            bgClass = "bg-green-50 border-green-100/60";
          } else if (status === "cancelled") {
            title = "Order Cancelled";
            description = `The order request for ${petName} was cancelled. Any processed payment has been credited to your Wallet.`;
            colorClass = "text-red-600";
            bgClass = "bg-red-50 border-red-100/60";
          }

          items.push({
            id: `order-${o.id}-${status}`,
            type: "order",
            title,
            description,
            created_at: o.created_at,
            status,
            isRead: false, // will handle via state mapping
            actionUrl: "/buyer/bookings",
            icon: ShoppingBag,
            colorClass,
            bgClass
          });
        });
      }

      // Process Vet Appointments into Notification items
      if (apptsRes.data) {
        apptsRes.data.forEach((a: any) => {
          const status = (a.status || "pending").toLowerCase();
          const petName = a.pet_name;
          const typeLabel = a.appointment_type === "video" || a.appointment_type === "online" ? "Video Consultation" : "Clinic Visit";
          
          let title = "Appointment Requested";
          let description = `A professional ${typeLabel} request is registered for ${petName} on ${a.appointment_date} at ${a.appointment_time}.`;
          let colorClass = "text-amber-700";
          let bgClass = "bg-amber-50 border-amber-100/60";

          if (status === "confirmed" || status === "accepted" || status === "approved") {
            title = "Vet Appointment Confirmed! 🩺";
            description = `Your ${typeLabel} with our professional Vet for ${petName} is approved for ${a.appointment_date} at ${a.appointment_time}.`;
            colorClass = "text-blue-700";
            bgClass = "bg-blue-50 border-blue-100/60";
          } else if (status === "in_progress") {
            title = "Consultation Active Now 🎥";
            description = `The Vet has initiated the digital room. Click here to join your consultation for ${petName}!`;
            colorClass = "text-purple-700";
            bgClass = "bg-purple-50 border-purple-100/60";
          } else if (status === "completed" || status === "generated") {
            title = "Consultation Finished ✅";
            description = `The Vet session for ${petName} is complete. Your premium prescription and vaccine guidelines are ready!`;
            colorClass = "text-green-700";
            bgClass = "bg-green-50 border-green-100/60";
          } else if (status === "cancelled" || status === "rejected" || status === "failed") {
            title = "Appointment Cancelled";
            description = `The Vet session for ${petName} could not be completed or was cancelled.`;
            colorClass = "text-red-600";
            bgClass = "bg-red-50 border-red-100/60";
          }

          items.push({
            id: `appt-${a.id}-${status}`,
            type: "appointment",
            title,
            description,
            created_at: a.created_at,
            status,
            isRead: false,
            actionUrl: "/buyer/bookings",
            icon: Stethoscope,
            colorClass,
            bgClass
          });
        });
      }

      // Add a couple of beautiful static introductory Welcome notifications
      items.push({
        id: "promo-welcome-club",
        type: "promo",
        title: "Welcome to Sruvo Elite Pet Club! 🐾",
        description: "Explore qualified vets, premium certified bloodline puppies, active vaccine tracking, and the digital Pet Passport.",
        created_at: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago
        isRead: false,
        actionUrl: "/buyer/home",
        icon: Bell,
        colorClass: "text-primary",
        bgClass: "bg-purple-50/50 border-purple-100/60"
      });

      // Filter cleared notifications and sort by date
      const savedRead = JSON.parse(localStorage.getItem("sruvo_notifications_read") || "[]");
      const savedCleared = JSON.parse(localStorage.getItem("sruvo_notifications_cleared") || "[]");

      const finalNotifications = items
        .filter(item => !savedCleared.includes(item.id))
        .map(item => ({
          ...item,
          isRead: savedRead.includes(item.id)
        }))
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setNotifications(finalNotifications);
    } catch (err) {
      console.error("Failed to load notifications", err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = () => {
    const newRead = [...new Set([...readIds, ...notifications.map(n => n.id)])];
    setReadIds(newRead);
    localStorage.setItem("sruvo_notifications_read", JSON.stringify(newRead));
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    toast.success("All notifications marked as read!");
  };

  const handleClearAll = () => {
    const newCleared = [...new Set([...clearedIds, ...notifications.map(n => n.id)])];
    setClearedIds(newCleared);
    localStorage.setItem("sruvo_notifications_cleared", JSON.stringify(newCleared));
    setNotifications([]);
    toast.success("Notification inbox cleared!");
  };

  const handleMarkItemRead = (id: string, actionUrl: string) => {
    if (!readIds.includes(id)) {
      const newRead = [...readIds, id];
      setReadIds(newRead);
      localStorage.setItem("sruvo_notifications_read", JSON.stringify(newRead));
    }
    navigate(actionUrl);
  };

  const formatTimeAgo = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf8fc] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="min-h-screen bg-[#faf8fc] pb-12 relative overflow-x-hidden">
      {/* Decorative Blob Backgrounds */}
      <div className="absolute top-0 right-0 w-[350px] h-[350px] bg-primary/5 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute top-40 left-0 w-[250px] h-[250px] bg-indigo-500/5 rounded-full blur-[60px] pointer-events-none" />

      {/* Modern Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-purple-100/60 shadow-[0_2px_15px_-3px_rgba(155,81,224,0.03)]">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between max-w-4xl">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-full hover:bg-purple-50 transition-colors" 
              onClick={() => {
                if (window.history.length > 1) {
                  navigate(-1);
                } else {
                  navigate("/buyer/profile");
                }
              }}
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold bg-gradient-primary bg-clip-text text-transparent">Notifications</h1>
                {unreadCount > 0 && (
                  <span className="bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {unreadCount} New
                  </span>
                )}
              </div>
            </div>
          </div>
          {notifications.length > 0 && (
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handleMarkAllRead}
                className="text-gray-500 hover:text-primary rounded-full hover:bg-purple-50"
                title="Mark all as read"
              >
                <Eye className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handleClearAll}
                className="text-gray-500 hover:text-red-500 rounded-full hover:bg-red-50"
                title="Clear all"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-5 max-w-lg space-y-4 relative">
        <AnimatePresence mode="popLayout">
          {notifications.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center py-16 text-center bg-white rounded-3xl border border-purple-100/60 p-6 shadow-sm"
            >
              <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mb-4 border border-purple-100/40">
                <Bell className="w-7 h-7 text-primary animate-bounce" />
              </div>
              <h2 className="text-base font-bold text-gray-800">Your inbox is clear</h2>
              <p className="text-xs text-muted-foreground mt-1.5 mb-6 max-w-xs">
                Real-time updates regarding your active pet orders and vet consultations will be displayed here as they happen.
              </p>
              <Button 
                onClick={() => navigate("/buyer/home")} 
                className="rounded-full bg-gradient-primary hover:opacity-95 text-white text-xs font-bold px-6 shadow-md shadow-primary/20 h-10"
              >
                Browse Cute Pets
              </Button>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {notifications.map((item) => {
                const IconComponent = item.icon;
                return (
                  <motion.div
                    key={item.id}
                    layoutId={item.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  >
                    <Card
                      onClick={() => handleMarkItemRead(item.id, item.actionUrl)}
                      className={`p-4 rounded-[22px] border cursor-pointer hover:shadow-md hover:border-purple-200 transition-all relative flex gap-4 ${
                        item.isRead ? "bg-white border-purple-100/30" : `${item.bgClass} shadow-sm ring-1 ring-primary/5`
                      }`}
                    >
                      {/* Unread circle */}
                      {!item.isRead && (
                        <span className="absolute top-4 right-4 w-2.5 h-2.5 bg-primary rounded-full animate-ping" />
                      )}

                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 border ${
                        item.isRead ? "bg-gray-50 border-gray-100" : "bg-white/90 border-transparent"
                      }`}>
                        <IconComponent className={`w-5 h-5 ${item.colorClass}`} />
                      </div>

                      <div className="flex-1 min-w-0 pr-2">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className={`text-xs font-bold truncate leading-tight ${
                            item.isRead ? "text-gray-700" : "text-gray-900"
                          }`}>
                            {item.title}
                          </h4>
                          <span className="text-[10px] text-muted-foreground flex-shrink-0 font-medium">
                            {formatTimeAgo(item.created_at)}
                          </span>
                        </div>
                        <p className={`text-[11px] mt-1 leading-relaxed font-medium ${
                          item.isRead ? "text-gray-500" : "text-gray-700"
                        }`}>
                          {item.description}
                        </p>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </AnimatePresence>

        {/* Support Note */}
        <div className="text-center pt-2">
          <p className="text-[11px] text-muted-foreground font-semibold flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Your real-time notifications are synced securely via Supabase.
          </p>
        </div>
      </main>
    </div>
  );
}
