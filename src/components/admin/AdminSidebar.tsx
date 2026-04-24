import { LayoutDashboard, Users, Stethoscope, Package, DollarSign, Settings, Radio, PawPrint, Truck, Image, Megaphone, Wallet, ShoppingBag, Bell } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface AdminSidebarProps {
  activeSection: string;
  setActiveSection: (s: string) => void;
  isMobile?: boolean;
  collapsed?: boolean;
}

const navItems = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "buyers", label: "Buyers", icon: ShoppingBag },
  { id: "users", label: "User Management", icon: Users },
  { id: "vets", label: "Vets", icon: Stethoscope },
  { id: "listings", label: "Listings", icon: PawPrint },
  { id: "products", label: "Products", icon: Package },
  { id: "transport", label: "Transport", icon: Truck },
  { id: "banners", label: "Banners", icon: Image },
  { id: "advertisements", label: "Advertisements", icon: Megaphone },
  { id: "wallets", label: "Wallets", icon: Wallet },
  { id: "financials", label: "Financials", icon: DollarSign },
  { id: "notifications", label: "Notifications", icon: Bell },
];

const systemItems = [
  { id: "settings", label: "Settings", icon: Settings },
];

const AdminSidebar = ({ activeSection, setActiveSection, isMobile, collapsed }: AdminSidebarProps) => {
  const isCollapsed = !isMobile && collapsed;

  const renderNavButton = (item: typeof navItems[0]) => {
    const isActive = activeSection === item.id;
    const button = (
      <button
        key={item.id}
        onClick={() => setActiveSection(item.id)}
        className={`w-full flex items-center ${isCollapsed ? "justify-center" : ""} gap-3 ${isCollapsed ? "px-0 py-3" : "px-4 py-3"} rounded-xl text-[14px] font-medium transition-all ${
          isActive
            ? "bg-[hsl(220,80%,50%)] text-white shadow-lg shadow-[hsl(220,80%,50%)]/25"
            : "text-[hsl(220,15%,45%)] hover:bg-[hsl(220,20%,96%)]"
        }`}
      >
        <item.icon className="w-[18px] h-[18px] shrink-0" />
        {!isCollapsed && item.label}
      </button>
    );

    if (isCollapsed) {
      return (
        <Tooltip key={item.id}>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent side="right" sideOffset={8}>
            {item.label}
          </TooltipContent>
        </Tooltip>
      );
    }
    return button;
  };

  return (
    <TooltipProvider delayDuration={100}>
      <aside className={`${isMobile ? "relative w-full h-full" : "fixed left-0 top-0 bottom-0"} bg-white border-r border-[hsl(220,20%,92%)] flex flex-col z-50 transition-all duration-300 ease-in-out ${isCollapsed ? "w-[72px]" : "w-[260px]"}`}>
        {/* Logo */}
        <div className={`${isCollapsed ? "px-3" : "px-6"} py-6 flex items-center ${isCollapsed ? "justify-center" : "gap-3"}`}>
          <div className={`${isCollapsed ? "w-10 h-10" : "w-10 h-10"} bg-[hsl(220,80%,50%)] rounded-xl flex items-center justify-center shrink-0`}>
            {isCollapsed ? (
              <span className="text-white font-bold text-[15px]">S</span>
            ) : (
              <PawPrint className="w-5 h-5 text-white" />
            )}
          </div>
          {!isCollapsed && (
            <div>
              <h1 className="font-bold text-[15px] text-[hsl(220,20%,15%)]">Sruvo</h1>
              <p className="text-[11px] text-[hsl(220,15%,55%)] font-medium uppercase tracking-wider">Super Admin</p>
            </div>
          )}
        </div>

        {/* Main Nav */}
        <nav className="flex-1 px-3 mt-2 overflow-y-auto">
          <div className="space-y-1">
            {navItems.map(renderNavButton)}
          </div>

          {/* System Section */}
          <div className="mt-8">
            {!isCollapsed && (
              <p className="px-4 text-[11px] font-semibold text-[hsl(220,15%,60%)] uppercase tracking-wider mb-2">System</p>
            )}
            {isCollapsed && <div className="border-t border-[hsl(220,20%,92%)] my-3" />}
            {systemItems.map(renderNavButton)}
          </div>
        </nav>

        {/* Broadcast Button */}
        <div className="px-3 pb-6">
          {isCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="w-full flex items-center justify-center py-3 rounded-xl bg-[hsl(220,20%,96%)] text-[hsl(220,15%,45%)] hover:bg-[hsl(220,20%,93%)] transition-all">
                  <Radio className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={8}>Broadcast</TooltipContent>
            </Tooltip>
          ) : (
            <button className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[hsl(220,20%,96%)] text-[hsl(220,15%,45%)] text-[14px] font-medium hover:bg-[hsl(220,20%,93%)] transition-all">
              <Radio className="w-4 h-4" />
              Broadcast
            </button>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
};

export default AdminSidebar;
