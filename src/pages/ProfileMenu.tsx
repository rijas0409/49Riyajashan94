import { useNavigate } from "react-router-dom";
import sruvoLogo from "@/assets/sruvo-logo.png";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  User, MapPin, Wallet, Calendar, CreditCard, Bell, 
  Shield, LogOut, ArrowLeft, ChevronRight, Heart, ShoppingBag
} from "lucide-react";
import { toast } from "sonner";

const MENU_ITEMS = [
  {
    id: "profile",
    icon: User,
    title: "Profile",
    description: "Manage your personal information",
    path: "/profile/settings",
  },
  {
    id: "addresses",
    icon: MapPin,
    title: "Addresses",
    description: "Manage your saved addresses",
    path: "/profile/addresses",
  },
  {
    id: "wallet",
    icon: Wallet,
    title: "Wallet",
    description: "View balance and transactions",
    path: "/profile/wallet",
  },
  {
    id: "bookings",
    icon: Calendar,
    title: "Bookings",
    description: "View your booking history",
    path: "/profile/bookings",
  },
  {
    id: "orders",
    icon: ShoppingBag,
    title: "Orders",
    description: "Track your product orders",
    path: "/profile/orders",
  },
  {
    id: "subscriptions",
    icon: CreditCard,
    title: "Subscriptions",
    description: "Manage your subscriptions",
    path: "/profile/subscriptions",
  },
  {
    id: "notifications",
    icon: Bell,
    title: "Notifications",
    description: "Notification preferences",
    path: "/profile/notifications",
  },
  {
    id: "privacy",
    icon: Shield,
    title: "Privacy & Security",
    description: "Manage your privacy settings",
    path: "/profile/privacy",
  },
];

const ProfileMenu = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-1">
            <img src={sruvoLogo} alt="Sruvo" className="w-12 h-12 object-contain" />
            <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Profile
            </span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 pb-24 max-w-lg">
        <div className="space-y-3">
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <Card
                key={item.id}
                className="p-4 cursor-pointer hover:shadow-card transition-all rounded-2xl border-0 shadow-sm"
                onClick={() => navigate(item.path)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </Card>
            );
          })}

          {/* Sign Out Button */}
          <Card
            className="p-4 cursor-pointer hover:shadow-card transition-all rounded-2xl border-2 border-destructive/20 shadow-sm mt-6"
            onClick={handleLogout}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-destructive/10 rounded-2xl flex items-center justify-center">
                <LogOut className="w-6 h-6 text-destructive" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-destructive">Sign Out</h3>
                <p className="text-sm text-muted-foreground">Log out from your account</p>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default ProfileMenu;
