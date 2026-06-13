import { useNavigate } from "react-router-dom";
import { SRUVO_LOGO_URL } from "@/constants/branding";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  User, MapPin, Wallet, Calendar, CreditCard, Bell, 
  Shield, LogOut, ArrowLeft, ChevronRight, Heart, ShoppingBag,
  Camera, PawPrint, Check, QrCode, ShieldCheck
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
        {/* SVG Gradients */}
        <svg width="0" height="0" className="absolute pointer-events-none">
          <linearGradient id="paw-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop stopColor="#f55d9d" offset="0%" />
            <stop stopColor="#a428f0" offset="100%" />
          </linearGradient>
        </svg>

        {/* User Card */}
        <div className="mb-8 relative">
          <div className="bg-gradient-primary rounded-[32px] p-6 text-white overflow-hidden relative shadow-lg min-h-[128px]">
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full -ml-12 -mb-12 blur-xl" />
            
            {!profile ? (
              <div className="flex items-center gap-5 relative z-10 animate-pulse">
                <div className="w-20 h-20 rounded-full bg-white/20 flex-shrink-0"></div>
                <div className="flex-1 space-y-3">
                  <div className="h-6 bg-white/20 rounded w-32"></div>
                  <div className="h-4 bg-white/20 rounded w-24"></div>
                  <div className="flex gap-2">
                    <div className="h-5 w-16 bg-white/20 rounded-full"></div>
                    <div className="h-5 w-16 bg-white/20 rounded-full"></div>
                  </div>
                </div>
              </div>
            ) : (
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
                  <h2 className="text-2xl font-bold">{profile?.name}</h2>
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
            )}
          </div>
        </div>

        {/* Pet Passport Card */}
        <div 
          onClick={() => navigate('/buyer/pet-passport')}
          className="mb-6 active:scale-[0.98] transition-transform cursor-pointer"
        >
          <div className="bg-[#fffcfd] rounded-[24px] md:rounded-[36px] p-3 md:p-4 pr-3 md:pr-5 flex items-center gap-3 md:gap-[18px] shadow-[0_12px_40px_rgba(236,72,153,0.06)] border border-[#fce8f4] overflow-hidden">
            
            {/* Left Icon Badge */}
            <div className="relative flex-shrink-0">
              <div className="w-[56px] h-[56px] md:w-[72px] md:h-[72px] rounded-full bg-gradient-to-br from-[#fcf0f5] to-[#fce7f3] flex items-center justify-center shadow-inner overflow-hidden">
                <img src="/IMG_20260606_213853.png" alt="Paw" loading="eager" className="w-[36px] h-[36px] md:w-[46px] md:h-[46px] object-contain drop-shadow-sm" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 flex justify-center items-center drop-shadow-sm">
                <svg width="22" height="22" className="md:w-[26px] md:h-[26px]" viewBox="0 0 24 24" fill="url(#paw-gradient)" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  <path d="m9 12 2 2 4-4" stroke="white" strokeWidth="3" fill="none"></path>
                </svg>
              </div>
            </div>

            {/* Middle Content */}
            <div className="flex-1 py-1 min-w-0">
              <h3 className="text-[17px] md:text-[20px] font-bold text-[#111827] tracking-tight leading-tight mb-0.5 md:mb-1 truncate">Pet Passport</h3>
              <p className="text-[11px] md:text-[13px] font-medium text-[#64748b] tracking-wide mb-1 md:mb-1.5 truncate">
                Digital ID, Health & Ownership Records
              </p>
              <div className="flex items-center gap-1 md:gap-1.5">
                <ShieldCheck className="w-[14px] h-[14px] md:w-[16px] md:h-[16px] text-[#059669]" strokeWidth={2.5} />
                <span className="text-[12px] md:text-[13px] font-[700] text-[#059669] tracking-wide truncate">Verified</span>
              </div>
            </div>

            {/* Right Divider & QR */}
            <div className="flex items-center gap-3 md:gap-5 flex-shrink-0">
              <div className="w-[1px] h-10 md:h-14 bg-[#fce7f3]"></div>
              <div className="flex items-center gap-2 md:gap-3">
                <div className="w-[44px] h-[44px] md:w-[52px] md:h-[52px] bg-[#f4ebff] rounded-[14px] md:rounded-[18px] flex items-center justify-center shadow-sm border border-[#ede3f5]">
                  <img src="/IMG_20260606_213808.png" alt="QR Code" loading="eager" className="w-[28px] h-[28px] md:w-[34px] md:h-[34px] object-contain rounded-[4px]" />
                </div>
                <ChevronRight className="w-[20px] h-[20px] md:w-[22px] md:h-[22px] text-[#cbd5e1]" strokeWidth={3} />
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
