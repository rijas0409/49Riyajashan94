import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Send, Trash2, Users, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";

interface Notification {
  id: string;
  title: string;
  message: string;
  target_role: string;
  created_at: string;
}

const ROLE_OPTIONS = [
  { value: "all", label: "All Users", color: "hsl(220,80%,50%)" },
  { value: "buyer", label: "Buyers", color: "hsl(145,60%,45%)" },
  { value: "seller", label: "Breeders / Pet Sellers", color: "hsl(35,90%,50%)" },
  { value: "product_seller", label: "Product Sellers", color: "hsl(270,60%,55%)" },
  { value: "vet", label: "Vets", color: "hsl(0,70%,55%)" },
  { value: "delivery_partner", label: "Transport / Delivery", color: "hsl(190,70%,45%)" },
];

const getRoleLabel = (role: string) => ROLE_OPTIONS.find(r => r.value === role)?.label || role;
const getRoleColor = (role: string) => ROLE_OPTIONS.find(r => r.value === role)?.color || "hsl(220,15%,55%)";

const AdminNotifications = () => {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [targetRole, setTargetRole] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => { fetchNotifications(); }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("admin_notifications")
      .select("*")
      .order("created_at", { ascending: false });
    setNotifications((data as Notification[]) || []);
    setLoading(false);
  };

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      toast({ title: "Title and message are required", variant: "destructive" });
      return;
    }
    setSending(true);
    const { data: { session } } = await supabase.auth.getSession();
    const { error } = await supabase.from("admin_notifications").insert({
      sent_by: session?.user.id,
      target_role: targetRole,
      title: title.trim(),
      message: message.trim(),
    } as any);
    setSending(false);
    if (error) {
      toast({ title: "Failed to send", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Notification sent!", description: `Sent to ${getRoleLabel(targetRole)}` });
      setTitle("");
      setMessage("");
      setTargetRole("all");
      fetchNotifications();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("admin_notifications").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", variant: "destructive" });
    } else {
      toast({ title: "Notification deleted" });
      fetchNotifications();
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-[28px] font-bold text-[hsl(220,20%,15%)]">Notifications</h1>
        <p className="text-sm text-[hsl(220,15%,55%)] mt-1">Send custom notifications to any user panel</p>
      </div>

      {/* Compose Section */}
      <Card className="p-6 rounded-2xl border-[hsl(220,20%,92%)] mb-8">
        <h2 className="text-lg font-bold text-[hsl(220,20%,15%)] mb-4 flex items-center gap-2">
          <Send className="w-5 h-5 text-[hsl(220,80%,50%)]" />
          Compose Notification
        </h2>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-[hsl(220,20%,25%)] mb-1 block">Target Audience</label>
            <Select value={targetRole} onValueChange={setTargetRole}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map(r => (
                  <SelectItem key={r.value} value={r.value}>
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: r.color }} />
                      {r.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium text-[hsl(220,20%,25%)] mb-1 block">Title</label>
            <Input
              placeholder="e.g. New Feature Update!"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="rounded-xl"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-[hsl(220,20%,25%)] mb-1 block">Message</label>
            <Textarea
              placeholder="Type notification message..."
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={4}
              className="rounded-xl resize-none"
            />
          </div>
          <Button
            onClick={handleSend}
            disabled={sending || !title.trim() || !message.trim()}
            className="rounded-xl bg-[hsl(220,80%,50%)] hover:bg-[hsl(220,80%,45%)] text-white px-6"
          >
            {sending ? "Sending..." : "Send Notification"}
            <Send className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </Card>

      {/* History */}
      <div className="mb-4">
        <h2 className="text-lg font-bold text-[hsl(220,20%,15%)] flex items-center gap-2">
          <Clock className="w-5 h-5 text-[hsl(220,15%,55%)]" />
          Sent Notifications
          <span className="text-sm font-normal text-[hsl(220,15%,55%)]">({notifications.length})</span>
        </h2>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(220,80%,50%)]" />
        </div>
      ) : notifications.length === 0 ? (
        <Card className="p-12 rounded-2xl border-[hsl(220,20%,92%)] text-center">
          <Bell className="w-12 h-12 mx-auto text-[hsl(220,15%,75%)] mb-3" />
          <p className="text-[hsl(220,15%,55%)]">No notifications sent yet</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map(n => (
            <Card key={n.id} className="rounded-2xl border-[hsl(220,20%,92%)] overflow-hidden">
              <div
                className="p-4 flex items-center gap-4 cursor-pointer hover:bg-[hsl(220,20%,98%)] transition-colors"
                onClick={() => setExpandedId(expandedId === n.id ? null : n.id)}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${getRoleColor(n.target_role)}15` }}>
                  <Users className="w-5 h-5" style={{ color: getRoleColor(n.target_role) }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-[hsl(220,20%,15%)] truncate">{n.title}</h3>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0"
                      style={{ backgroundColor: `${getRoleColor(n.target_role)}15`, color: getRoleColor(n.target_role) }}>
                      {getRoleLabel(n.target_role)}
                    </span>
                  </div>
                  <p className="text-xs text-[hsl(220,15%,55%)]">{format(new Date(n.created_at), "dd MMM yyyy, hh:mm a")}</p>
                </div>
                <Button variant="ghost" size="icon" className="shrink-0 text-[hsl(0,70%,55%)] hover:bg-[hsl(0,70%,95%)]"
                  onClick={e => { e.stopPropagation(); handleDelete(n.id); }}>
                  <Trash2 className="w-4 h-4" />
                </Button>
                {expandedId === n.id ? <ChevronUp className="w-4 h-4 text-[hsl(220,15%,55%)]" /> : <ChevronDown className="w-4 h-4 text-[hsl(220,15%,55%)]" />}
              </div>
              {expandedId === n.id && (
                <div className="px-4 pb-4 pt-0 border-t border-[hsl(220,20%,94%)]">
                  <p className="text-sm text-[hsl(220,20%,30%)] whitespace-pre-wrap mt-3">{n.message}</p>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminNotifications;
