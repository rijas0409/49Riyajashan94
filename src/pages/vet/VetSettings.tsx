import React from "react";
import { useNavigate } from "react-router-dom";
import { CaretLeft, PencilSimpleLine, LockKey, BellRinging, ShieldCheck, Question, SignOut } from "@phosphor-icons/react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const VetSettings = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem("sruvo_user_role");
      toast.success("Logged out successfully");
      navigate("/auth/vet");
    } catch (error) {
      toast.error("Failed to logout");
    }
  };

  const settingsOptions = [
    {
      title: "Account",
      items: [
        { icon: <PencilSimpleLine size={24} />, label: "Edit Profile", path: "/vet/profile-settings" },
        { icon: <LockKey size={24} />, label: "Change Password", path: "#", onClick: () => toast.info("Password change coming soon") },
        { icon: <BellRinging size={24} />, label: "Notifications", path: "#", onClick: () => toast.info("Notification settings coming soon") },
      ]
    },
    {
      title: "Support & Legal",
      items: [
        { icon: <Question size={24} />, label: "Help & Support", path: "#", onClick: () => toast.info("Support center coming soon") },
        { icon: <ShieldCheck size={24} />, label: "Privacy Policy", path: "#", onClick: () => toast.info("Privacy Policy coming soon") },
      ]
    }
  ];

  return (
    <div className="bg-[#FDFBFF] min-h-screen pb-24 font-sans text-slate-900 selection:bg-purple-100">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md px-4 py-4 flex items-center border-b border-transparent">
        <button 
          onClick={() => navigate("/vet/profile")} 
          className="p-2 text-slate-700 hover:bg-slate-50 rounded-full transition-colors mr-4"
        >
          <CaretLeft size={24} weight="bold" />
        </button>
        <h1 className="text-xl font-bold text-slate-900">Settings</h1>
      </header>

      <main className="max-w-md mx-auto px-5 pt-6 space-y-8">
        {settingsOptions.map((section, idx) => (
          <div key={idx}>
            <h2 className="text-sm font-extrabold text-slate-400 uppercase tracking-wider mb-4 px-1">{section.title}</h2>
            <div className="bg-white rounded-[2rem] overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-100">
              {section.items.map((item, itemIdx) => (
                <div 
                  key={itemIdx}
                  onClick={() => {
                    if (item.path !== "#") {
                      navigate(item.path);
                    } else if (item.onClick) {
                      item.onClick();
                    }
                  }}
                  className={`flex items-center gap-4 p-4 cursor-pointer hover:bg-slate-50 transition-colors ${itemIdx !== section.items.length - 1 ? "border-b border-slate-50" : ""}`}
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500">
                    {item.icon}
                  </div>
                  <span className="flex-1 font-bold text-slate-700">{item.label}</span>
                  <CaretLeft size={20} className="text-slate-300 rotate-180" weight="bold" />
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="pt-4">
          <button 
            onClick={handleLogout}
            className="w-full bg-red-50 text-red-600 font-bold py-4 rounded-[2rem] shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2 border border-red-100 hover:bg-red-100"
          >
            <SignOut size={22} weight="bold" />
            Logout
          </button>
        </div>
      </main>
    </div>
  );
};

export default VetSettings;
