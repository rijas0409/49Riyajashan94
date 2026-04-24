import { Settings, Shield, Bell, Globe } from "lucide-react";

const AdminSettings = () => {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-[28px] font-bold text-[hsl(220,20%,15%)]">Settings</h1>
        <p className="text-sm text-[hsl(220,15%,55%)] mt-1">System configuration and preferences</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {[
          { icon: Shield, title: "Security", desc: "Manage admin access codes, 2FA settings, and session policies.", color: "hsl(220,80%,50%)" },
          { icon: Bell, title: "Notifications", desc: "Configure email and push notification preferences for admin alerts.", color: "hsl(35,90%,50%)" },
          { icon: Globe, title: "Platform", desc: "App-wide settings including commission rates, verification policies.", color: "hsl(145,60%,45%)" },
          { icon: Settings, title: "General", desc: "Branding, default values, and maintenance mode controls.", color: "hsl(270,60%,55%)" },
        ].map((item, i) => (
          <div key={i} className="bg-white rounded-2xl border border-[hsl(220,20%,92%)] p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center gap-4 mb-3">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${item.color}15` }}>
                <item.icon className="w-5 h-5" style={{ color: item.color }} />
              </div>
              <h3 className="text-lg font-bold text-[hsl(220,20%,15%)]">{item.title}</h3>
            </div>
            <p className="text-sm text-[hsl(220,15%,55%)]">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminSettings;
