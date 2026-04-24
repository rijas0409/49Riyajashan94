import { Search, Bell, LayoutGrid, LogOut, Menu, Settings } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface AdminTopBarProps {
  user: any;
  profilePhoto: string | null;
  onLogout: () => void;
  onMenuToggle?: () => void;
  onProfileSettings?: () => void;
}

const AdminTopBar = ({ user, profilePhoto, onLogout, onMenuToggle, onProfileSettings }: AdminTopBarProps) => {
  const [search, setSearch] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const adminName = user?.user_metadata?.name || "Admin";
  const initial = adminName[0]?.toUpperCase() || "A";

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-[hsl(220,20%,92%)]">
      <div className="flex items-center gap-3 px-4 py-3 md:px-8 md:py-4">
        <button onClick={onMenuToggle} className="w-10 h-10 rounded-xl bg-[hsl(220,20%,97%)] flex items-center justify-center hover:bg-[hsl(220,20%,94%)] transition-colors shrink-0">
          <Menu className="w-5 h-5 text-[hsl(220,15%,45%)]" />
        </button>

        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(220,15%,60%)]" />
          <input
            type="text"
            placeholder="Search users, vets, products, listings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[hsl(220,20%,97%)] border border-[hsl(220,20%,92%)] rounded-xl text-sm text-[hsl(220,20%,20%)] placeholder:text-[hsl(220,15%,60%)] focus:outline-none focus:ring-2 focus:ring-[hsl(220,80%,50%)]/20 focus:border-[hsl(220,80%,50%)]"
          />
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <button className="w-10 h-10 rounded-xl bg-[hsl(220,20%,97%)] flex items-center justify-center hover:bg-[hsl(220,20%,94%)] transition-colors relative">
            <Bell className="w-[18px] h-[18px] text-[hsl(220,15%,45%)]" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-[hsl(0,75%,55%)] rounded-full"></span>
          </button>
          <div className="hidden md:flex">
            <button className="w-10 h-10 rounded-xl bg-[hsl(220,20%,97%)] flex items-center justify-center hover:bg-[hsl(220,20%,94%)] transition-colors">
              <LayoutGrid className="w-[18px] h-[18px] text-[hsl(220,15%,45%)]" />
            </button>
          </div>
          <div className="hidden md:block h-8 w-px bg-[hsl(220,20%,90%)]" />

          <div className="relative" ref={dropdownRef}>
            <div className="flex items-center gap-2 md:gap-3">
              <div className="hidden md:block text-right">
                <p className="text-sm font-semibold text-[hsl(220,20%,15%)]">{adminName}</p>
                <p className="text-[11px] text-[hsl(220,15%,55%)]">System Administrator</p>
              </div>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-[hsl(220,80%,55%)] to-[hsl(250,70%,55%)] flex items-center justify-center text-white font-bold text-sm shadow-md hover:shadow-lg transition-all"
              >
                {profilePhoto ? (
                  <img src={profilePhoto} alt="Admin" className="w-full h-full object-cover" />
                ) : (
                  initial
                )}
              </button>
            </div>

            {profileOpen && (
              <div className="absolute right-0 top-[calc(100%+8px)] w-56 bg-white rounded-2xl shadow-xl border border-[hsl(220,20%,92%)] overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-4 py-3 border-b border-[hsl(220,20%,94%)] bg-[hsl(220,20%,98%)] flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-[hsl(220,80%,55%)] to-[hsl(250,70%,55%)] flex items-center justify-center shrink-0">
                    {profilePhoto ? (
                      <img src={profilePhoto} alt="Admin" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white font-bold text-sm">{initial}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[hsl(220,20%,15%)] truncate">{adminName}</p>
                    <p className="text-[11px] text-[hsl(220,15%,55%)] truncate">{user?.email || "admin@sruvo.com"}</p>
                  </div>
                </div>
                <div className="py-1.5">
                  <button
                    onClick={() => { setProfileOpen(false); onProfileSettings?.(); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[hsl(220,20%,20%)] hover:bg-[hsl(220,20%,97%)] transition-colors"
                  >
                    <Settings className="w-4 h-4 text-[hsl(220,15%,55%)]" />
                    Profile Settings
                  </button>
                  <button
                    onClick={() => { setProfileOpen(false); onLogout(); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[hsl(0,65%,50%)] hover:bg-[hsl(0,60%,98%)] transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Log Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminTopBar;
