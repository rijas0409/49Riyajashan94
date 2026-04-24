import { useNavigate, useLocation } from "react-router-dom";
import { Home, ShoppingBag, Stethoscope, User } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { id: "home", icon: Home, label: "Home", path: "/buyer-dashboard" },
  { id: "shop", icon: ShoppingBag, label: "Shop", path: "/shop" },
  { id: "vet", icon: Stethoscope, label: "Vet", path: "/vet" },
  { id: "profile", icon: User, label: "Profile", path: "/profile-menu" },
];

interface BottomNavigationProps {
  variant?: "buyer" | "seller";
}

const BottomNavigation = ({ variant = "buyer" }: BottomNavigationProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavClick = (path: string, id: string) => {
    if (id === "home" && variant === "seller") {
      navigate("/seller-dashboard");
    } else {
      navigate(path);
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border py-2 z-50 md:hidden">
      <div className="container mx-auto px-4 flex justify-around">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || 
            (item.id === "home" && (location.pathname === "/buyer-dashboard" || location.pathname === "/seller-dashboard"));
          
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.path, item.id)}
              className={cn(
                "flex flex-col items-center gap-1 py-1 px-4 rounded-2xl transition-all",
                isActive 
                  ? "text-primary bg-primary/10" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavigation;
