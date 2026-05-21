import React from "react";
import { useNavigate } from "react-router-dom";
import { 
  CaretLeft, DotsThreeVertical, Star, PencilSimpleLine,
  SuitcaseSimple, IdentificationCard, Wallet, FileText,
  Megaphone, ChatTeardropText, Gear, SignOut,
  House, CalendarDots, CaretRight, User
} from "@phosphor-icons/react";
import { useAuth } from "@/contexts/AuthContext";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import SplashScreen from "@/components/SplashScreen";
import { toast } from "sonner";
import { SafeImage } from "@/components/SafeImage";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

const VetProfile = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { user, profile: roleGuardProfile, isLoading: guardLoading, showSpinner } = useRoleGuard(["vet"], "/auth-vet", true);
  const [vetData, setVetData] = useState<any>(null);

  useEffect(() => {
    const fetchVetData = async () => {
      if (!user) return;
      const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      const { data: vetProfile } = await supabase.from("vet_profiles").select("*").eq("user_id", user.id).single();
      
      const photo = vetProfile?.profile_photo || profile?.profile_photo;
      let photoUrl = photo;
      if (photo && !photo.startsWith("http")) {
        photoUrl = supabase.storage.from("vet-documents").getPublicUrl(photo).data.publicUrl;
      }

      setVetData({
        name: profile?.full_name || profile?.name || "Doctor",
        specialty: vetProfile?.specializations?.[0] || "Specialist",
        rating: vetProfile?.average_rating || 5.0,
        reviews: 0,
        photo: photoUrl,
        isAdminApproved: profile?.is_admin_approved,
        approvedAt: profile?.created_at
      });
    };
    fetchVetData();
  }, [user]);

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success("Logged out successfully");
      navigate("/auth-vet");
    } catch (error) {
      toast.error("Failed to logout");
    }
  };

  const menuItems = [
    { icon: <SuitcaseSimple size={24} />, label: "My Services", path: "#" },
    { icon: <IdentificationCard size={24} />, label: "Contact Details", path: "#" },
    { icon: <Wallet size={24} />, label: "Wallet", path: "/vet/earnings" },
    { icon: <FileText size={24} />, label: "Documents", path: "#" },
    { icon: <Megaphone size={24} />, label: "Promote Profile", path: "#" },
    { icon: <ChatTeardropText size={24} />, label: "Recent Reviews", path: "#" },
    { icon: <Gear size={24} />, label: "Settings", path: "/profile-settings" },
  ];

  if (showSpinner) {
    return <SplashScreen message="Loading profile..." />;
  }

  const hasCache = localStorage.getItem("sruvo_user_role") === "vet";
  if (guardLoading && !hasCache) {
    return null;
  }

  return (
    <div className="bg-[#FDFBFF] min-h-screen pb-24 font-sans text-slate-900 selection:bg-purple-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md px-4 py-4 flex items-center justify-between border-b border-transparent">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 text-slate-700 hover:bg-slate-50 rounded-full transition-colors"
        >
          <CaretLeft size={24} weight="bold" />
        </button>
        <h1 className="text-xl font-bold text-slate-900">Profile</h1>
        <button className="p-2 text-slate-700 hover:bg-slate-50 rounded-full transition-colors">
          <DotsThreeVertical size={24} weight="bold" />
        </button>
      </header>

      <main className="max-w-md mx-auto px-5">
        {/* Profile Summary */}
        <section className="flex flex-col items-center mt-6 text-center" data-purpose="user-profile-header">
          <div className="relative w-32 h-32 mb-4">
            {/* Avatar Container */}
            <div className="w-full h-full rounded-full border-4 border-white shadow-lg overflow-hidden bg-muted">
              {vetData?.photo ? (
                <SafeImage 
                  src={vetData.photo}
                  alt={vetData.name}
                  className="w-full h-full" 
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-purple-100 text-purple-400">
                   <User size={64} weight="fill" />
                </div>
              )}
            </div>
            {/* Verified Badge */}
            <div className="absolute bottom-1 right-2">
              <img 
                alt="Verified Badge" 
                className="w-7 h-7" 
                src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAEvklEQVR4AexYXYgbVRQ+J9vtTtafFfVlBS1qoSoK2kItiLgFtX2o0naTbtIVfNDSKgrWhz6siiuyKGjBNwv2Tduk+emDRVr/Vld0RUQqlfpTxId9E3yqcZP9yVy/k+0m2ZnJzElyqxR2mJO599zvfvf77tyZmyRGV/ixauD/voGrdyDoDuSSlfXZZPlMJjH7F64GMZndWbk9CNttzvodyAzP3++SOQth25j5Blzl3EprzNlccn6zVGyGVQPHdlduY148A4FXI1aeTNdUafEj23fCmoFccu6eWMxMEvN1K5U3akx8I/WaT7O75u5sZLsrtWVARGaGKwcyifJ4U0xkE7OnXHLPMdM6hZxbaY37s/QBxwSiwQVumLtbwVGHqA1goLGayJh5F0JfbYoxzPqOOqO2wLwDHGOIBhe4Ye6nbHL2RS2NykA2MbcbA01oSbvH8eFMsvK4hkdlgLj6iobMJobJHNLw6QwQ36shs4zZqOFTGtBQWcYYcjSMOgOGjIbMJsZgDWn4dAaYWENmE4MBVdoiQXj332VTWDtcOXynisJHGqga94UoksvVjrGfjeIONYDNawLv/31RJO20r3uwh7Yf7qPtb/fR4H2hwxMzH4SG18P4AxnGycSyifIHzDQW1rndtvWP9tCW53tp4GamgVuYNj3VS4TFTiEHNLwsWkRTECwWlLwjWS6CeDSordOciN/0NAR3QsA0uiFZPhHU1Wcgm6w8R8Q7yXd0nmgl/tzxRdK+oJk4kU1U9ntV+AyQcbd5QWH1wY0xWl7Tsr692Fbifzi6QDPTVS88tG7YfdgL8BkwjV9RXqyvzui9ef/a+pqW9S2Cl4FSDlo2Iv73T9oTv8TJ1y9dG5+Q0KhIiYm/las2jFmJFMEiXELKK1uJOhdPeCzpa/IcPgOLpb7XgPkNEXkal+jH9xd8OBEu4W3oRjwm6tcYOW96OX0GnjjNF9055yF0OO8FB9VnvqnWZjWorTnXpfjzZt4Z2pPncjOnlH0GJLn3Q/6zh50tWB1TUo8KWc8isBVO2gTTqj0i/5loEU1BuEADAoTbUjofH0L5K0TkKQJFqBcoOWnz5lV1Q5+n8vFHREsrfEsDyx24SuOkPETo90cWyMXrXULKklN298GM6XnJl/QkIg2MnIx/4ekTWv1jskr5vZVaSDkUHNGYLq79LgJCkQZqBEa7X9bQtj5UG4XOADYHW6rUPEY3uToD6lEtApWTpjVwwaI0LdUvGqDWwEkNmU0MNtKChk9lAFu4/Cs3oyG0hLmAzesNDZfKgGwkV1Uc/KNsDmF3PoGYqoehabyj/tYM1oxB/4uY5Wlc61zgyZLhg9i8NmBM39eG5v7LZZUBAT92imdT+f630vl4CjFUj0L8gVQhfq1x+RngNIOWydA+9B9Ioy+udS7wpFMF5x3wqE+1gSjGdNE5QoaHMaNuCLbKLu9KFeJHQzBtNVkzIKOmCs5pcumAlAPD0JMjRefjwLYOk1YNiIZ0Mf4eNu5R3Il/pH4pSuyakVQhfuxS3drFugFRls73H6+WnJvwkG7FAEN4iw2OFPtz0mY7wG+bcolPfhjhIf1yTz4+hTdKaSlr//OyGbAvNZhx1UDwvPx32Sv+DvwLAAD//z2y0C0AAAAGSURBVAMAO0ibcC1x6lsAAAAASUVORK5CYII=" 
              />
            </div>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">{vetData?.name || "Loading..."}</h2>
          <p className="text-purple-600 font-semibold mt-1">{vetData?.specialty || "Senior Veterinarian"}</p>
          <div className="flex items-center justify-center gap-1 mt-2 text-slate-500">
            <Star size={18} weight="fill" className="text-yellow-400" />
            <span className="font-bold text-slate-900">{vetData?.rating?.toFixed(1) || "5.0"}</span>
            <span className="text-sm font-medium opacity-60">({vetData?.reviews || 0} reviews)</span>
          </div>
          <button 
            onClick={() => navigate("/profile-settings")}
            className="w-full mt-8 py-4 rounded-3xl bg-gradient-to-br from-[#B26BFF] to-[#8E2DE2] text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-purple-200 active:scale-95 transition-all"
            data-purpose="edit-profile-btn"
          >
            <PencilSimpleLine size={20} weight="bold" />
            Edit Profile
          </button>
        </section>

        {/* Visibility Status Card */}
        {vetData?.isAdminApproved ? (
          <section className="mt-8 relative overflow-hidden rounded-[2.5rem] p-6 flex flex-col items-start gap-2 border bg-emerald-50 border-emerald-200">
             <div className="flex items-center gap-2">
                 <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                 <h3 className="text-lg font-bold text-emerald-800">
                   Profile is Live
                 </h3>
             </div>
             <p className="text-sm font-medium text-emerald-700/80">
               Your profile is fully synchronized and visible to pet owners searching for vets in your area.
             </p>
          </section>
        ) : (
          <section className="mt-8 relative overflow-hidden rounded-[2.5rem] p-6 flex flex-col items-start gap-2 border bg-blue-50 border-blue-200">
             <div className="flex items-center gap-2">
                 <div className="w-3 h-3 rounded-full bg-blue-500" />
                 <h3 className="text-lg font-bold text-blue-800">
                   Pending Approval
                 </h3>
             </div>
             <p className="text-sm font-medium text-blue-700/80">
               Your profile is currently under review by our admin team. Once approved, it will undergo a synchronization process before becoming visible to users.
             </p>
          </section>
        )}

        {/* Premium Profile Card */}
        <section className="mt-8 relative overflow-hidden bg-[#F9F5FF] border border-[#E9D5FF] rounded-[2.5rem] p-6 flex items-center gap-5 shadow-[0_12px_40px_rgba(164,40,255,0.06)]" data-purpose="verified-qr-card">
          {/* QR Code container */}
          <div className="relative z-10 shrink-0 bg-white p-3.5 rounded-[2.2rem] shadow-[0_15px_35px_rgba(164,40,255,0.08)]">
            <div className="w-20 h-20 relative flex items-center justify-center">
              {/* Simplified QR Code SVG mapping the image */}
              <svg viewBox="0 0 100 100" className="w-14 h-14 text-[#9A3EF8]">
                {/* 4 Rounded Squares Grid */}
                <rect x="5" y="5" width="38" height="38" rx="12" fill="none" stroke="currentColor" strokeWidth="8" />
                <rect x="57" y="5" width="38" height="38" rx="12" fill="none" stroke="currentColor" strokeWidth="8" />
                <rect x="5" y="57" width="38" height="38" rx="12" fill="none" stroke="currentColor" strokeWidth="8" />
                <rect x="57" y="57" width="38" height="38" rx="12" fill="none" stroke="currentColor" strokeWidth="8" />
                {/* Tiny inner squares/dots inside the bigger ones */}
                <rect x="19" y="19" width="10" height="10" rx="3" fill="currentColor" />
                <rect x="71" y="19" width="10" height="10" rx="3" fill="currentColor" />
                <rect x="19" y="71" width="10" height="10" rx="3" fill="currentColor" />
                <rect x="71" y="71" width="10" height="10" rx="3" fill="currentColor" />
                {/* Center dot */}
                <circle cx="50" cy="50" r="4" fill="currentColor" />
              </svg>
            </div>
          </div>
          
          {/* Text content */}
          <div className="relative z-10 flex-1">
            <h3 className="text-[22px] font-bold text-[#131A2D] leading-tight">Premium Profile</h3>
            <p className="text-[#5a5a6a] text-[15px] mt-1.5 leading-snug font-medium">Verified & Trusted Professional</p>
          </div>

          {/* Right Chevron */}
          <div className="relative z-10 text-slate-400">
            <CaretRight size={24} weight="bold" />
          </div>
        </section>

        {/* Menu List */}
        <section className="mt-8 space-y-4" data-purpose="profile-navigation-links">
          {menuItems.map((item, idx) => (
            <div 
              key={idx}
              onClick={() => item.path !== "#" && navigate(item.path)}
              className="bg-white rounded-2xl p-4 flex items-center gap-4 shadow-[0_4px_20px_rgba(0,0,0,0.05)] cursor-pointer hover:bg-slate-50 transition-colors"
            >
              <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-500">
                {item.icon}
              </div>
              <span className="flex-1 font-bold text-slate-800">{item.label}</span>
              <CaretLeft size={20} className="text-slate-300 rotate-180" weight="bold" />
            </div>
          ))}

          {/* Logout */}
          <div 
            onClick={handleLogout}
            className="bg-white rounded-2xl p-4 flex items-center gap-4 shadow-[0_4px_20px_rgba(0,0,0,0.05)] cursor-pointer hover:bg-red-50 transition-colors"
          >
            <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-red-500">
              <SignOut size={24} weight="bold" />
            </div>
            <span className="flex-1 font-bold text-red-500">Logout</span>
            <CaretLeft size={20} className="text-slate-300 rotate-180" weight="bold" />
          </div>
        </section>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-sm flex justify-center z-50 border-t border-gray-50/50 pb-safe">
        <div className="w-full max-w-7xl flex justify-between px-6 pt-4 pb-7">
          <button className="flex flex-col items-center gap-1.5 text-[#b5b5c3] font-extrabold text-[9px] tracking-[0.5px] w-[60px]" onClick={() => navigate("/vet/home")}>
            <House size={24} weight="bold" />
            HOME
          </button>
          <button className="flex flex-col items-center gap-1.5 text-[#b5b5c3] font-extrabold text-[9px] tracking-[0.5px] w-[60px]" onClick={() => navigate("/vet/schedule")}>
            <CalendarDots size={24} weight="bold" />
            SCHEDULE
          </button>
          <button className="flex flex-col items-center gap-1.5 text-[#b5b5c3] font-extrabold text-[9px] tracking-[0.5px] w-[60px]" onClick={() => navigate("/vet/earnings")}>
            <Wallet size={24} weight="bold" />
            EARNINGS
          </button>
          <button className="flex flex-col items-center gap-1.5 text-[#a428ff] font-extrabold text-[9px] tracking-[0.5px] w-[60px]" onClick={() => navigate("/vet/profile")}>
            <User size={24} weight="fill" />
            PROFILE
          </button>
        </div>
      </nav>
    </div>
  );
};

export default VetProfile;
