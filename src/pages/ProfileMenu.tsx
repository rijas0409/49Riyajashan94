import { useNavigate } from "react-router-dom";
import { SRUVO_LOGO_URL } from "@/constants/branding";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  User, MapPin, Wallet, Calendar, CreditCard, Bell, 
  Shield, LogOut, ArrowLeft, ChevronRight, Heart, ShoppingBag,
  Camera
} from "lucide-react";
import { toast } from "sonner";

const MENU_ITEMS = [
  {
    id: "profile",
    icon: User,
    title: "Profile",
    description: "Manage your personal information",
    path: "/profile-settings",
  },
  {
    id: "addresses",
    icon: MapPin,
    title: "Addresses",
    description: "Manage your saved addresses",
    path: "/addresses",
  },
  {
    id: "wallet",
    icon: Wallet,
    title: "Wallet",
    description: "View balance and transactions",
    path: "/wallet",
  },
  {
    id: "bookings",
    icon: Calendar,
    title: "Bookings",
    description: "View your booking history",
    path: "/bookings",
  },
  {
    id: "orders",
    icon: ShoppingBag,
    title: "Orders",
    description: "Track your product orders",
    path: "/product-orders",
  },
  {
    id: "notifications",
    icon: Bell,
    title: "Notifications",
    description: "Notification preferences",
    path: "/notifications",
  },
  {
    id: "privacy",
    icon: Shield,
    title: "Privacy & Security",
    description: "Manage your privacy settings",
    path: "/privacy",
  },
];

const ProfileMenu = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();

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
          <div className="flex items-center gap-1 flex-1">
            <img src={SRUVO_LOGO_URL} alt="Sruvo" className="w-10 h-10 object-contain" referrerPolicy="no-referrer" />
            <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              My Profile
            </span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 pb-24 max-w-lg">
        {/* User Card */}
        <div className="mb-8 relative">
          <div className="bg-gradient-primary rounded-[32px] p-6 text-white overflow-hidden relative shadow-lg">
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full -ml-12 -mb-12 blur-xl" />
            
            <div className="flex items-center gap-5 relative z-10">
              <div className="relative">
                <div className="w-20 h-20 rounded-full border-4 border-white/30 overflow-hidden bg-white/20 backdrop-blur-md flex items-center justify-center">
                  {profile?.profile_photo ? (
                    <img src={profile.profile_photo} alt={profile.name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-10 h-10 text-white" />
                  )}
                </div>
                <button className="absolute bottom-0 right-0 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-md">
                  <Camera className="w-4 h-4 text-primary" />
                </button>
              </div>
              
              <div className="flex-1">
                <h2 className="text-2xl font-bold">{profile?.name || "User Name"}</h2>
                <p className="text-white/80 text-sm">{profile?.role === 'seller' ? 'Pet Seller' : 'Pet Lover'}</p>
                <div className="flex items-center gap-3 mt-3">
                  <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    {profile?.points || 0} Points
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    Level 1
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <Card
                key={item.id}
                className="p-4 cursor-pointer hover:shadow-card transition-all rounded-[24px] border-0 shadow-sm bg-card/50"
                onClick={() => navigate(item.path)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-[15px]">{item.title}</h3>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground/50" />
                </div>
              </Card>
            );
          })}

          {/* Sign Out Button */}
          <Card
            className="p-4 cursor-pointer hover:shadow-card transition-all rounded-[24px] border-border shadow-sm mt-6 border border-dashed hover:border-destructive/50"
            onClick={handleLogout}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-destructive/10 rounded-2xl flex items-center justify-center">
                <LogOut className="w-5 h-5 text-destructive" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-[15px] text-destructive">Logout</h3>
                <p className="text-xs text-muted-foreground">Log out from your account</p>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default ProfileMenu;
