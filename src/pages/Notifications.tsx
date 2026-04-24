import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Bell, ShoppingBag, Stethoscope, Tag, MessageCircle } from "lucide-react";

const NOTIFICATION_SETTINGS = [
  { id: "orders", icon: ShoppingBag, title: "Order Updates", description: "Get notified about order status changes" },
  { id: "promotions", icon: Tag, title: "Promotions & Offers", description: "Receive deals and discount notifications" },
  { id: "vet", icon: Stethoscope, title: "Vet Reminders", description: "Appointment and vaccination reminders" },
  { id: "messages", icon: MessageCircle, title: "Messages", description: "Chat message notifications" },
  { id: "general", icon: Bell, title: "General Updates", description: "App updates and announcements" },
];

const Notifications = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<Record<string, boolean>>({
    orders: true,
    promotions: true,
    vet: true,
    messages: true,
    general: false,
  });

  const toggle = (id: string) => {
    setSettings((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">Notifications</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-lg space-y-3">
        {NOTIFICATION_SETTINGS.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.id} className="p-4 rounded-2xl border-0 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
                <Switch checked={settings[item.id]} onCheckedChange={() => toggle(item.id)} />
              </div>
            </Card>
          );
        })}
      </main>
    </div>
  );
};

export default Notifications;
