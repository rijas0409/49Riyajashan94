import React from "react";
import { useNavigate } from "react-router-dom";
import { 
  MagnifyingGlass, Bell, House, 
  CalendarDots, Wallet, User,
  Clock, MapPin, Person,
  Timer, NavigationArrow,
  CaretRight, VideoCamera,
  Buildings
} from "@phosphor-icons/react";

const VetSchedule = () => {
  const navigate = useNavigate();

  // Generate 4 days before and 4 days after today
  const dates = React.useMemo(() => {
    const arr = [];
    for (let i = -4; i <= 4; i++) {
       const d = new Date();
       d.setDate(d.getDate() + i);
       arr.push({
         dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
         dayNumber: d.getDate(),
         fullDate: d,
         isToday: i === 0
       });
    }
    return arr;
  }, []);

  const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="bg-[#f9f9fb] min-h-screen pb-28 font-sans antialiased text-[#1a1a24] selection:bg-purple-100 overflow-x-hidden">
      {/* Header - Matching VetHome exactly */}
      <header className="flex items-center justify-between px-[22px] py-[24px] lg:px-10 lg:py-10 max-w-7xl mx-auto w-full">
        <h1 className="text-2xl font-extrabold tracking-tight">Schedule</h1>
        <div className="flex gap-2.5 flex-shrink-0">
          <button className="w-[42px] h-[42px] rounded-full bg-white flex items-center justify-center border-none shadow-[0_4px_15px_rgba(0,0,0,0.03)] cursor-pointer active:scale-95 transition-all">
            <MagnifyingGlass size={20} weight="bold" />
          </button>
          <button className="w-[42px] h-[42px] rounded-full bg-white flex items-center justify-center border-none shadow-[0_4px_15px_rgba(0,0,0,0.03)] cursor-pointer relative active:scale-95 transition-all">
            <Bell size={20} weight="fill" />
            <span className="absolute top-[10px] right-[12px] w-2 h-2 bg-[#ff4264] rounded-full border-2 border-white"></span>
          </button>
        </div>
      </header>

      {/* Horizontal Calendar Strip */}
      <div className="px-6 pb-4 pt-1 max-w-7xl mx-auto overflow-x-auto no-scrollbar scroll-smooth">
        <div className="flex flex-col items-center min-w-max md:min-w-0">
          <div className="mb-4 text-center">
            <span className="text-[10px] font-bold text-[#b5b5c3] uppercase tracking-[0.15em]">{currentMonth}</span>
          </div>
          <div className="flex gap-3 md:gap-4 w-full justify-start md:justify-center pb-2">
            {dates.map((item, idx) => (
              <div 
                key={idx}
                className={`flex flex-col items-center justify-center w-[58px] h-[78px] rounded-[22px] border transition-all flex-shrink-0 ${
                  item.isToday 
                    ? "bg-[#a428ff] text-white border-transparent shadow-[0_12px_24px_rgba(164,40,255,0.3)]" 
                    : "bg-white border-slate-100/60 shadow-sm text-slate-500"
                }`}
              >
                <span className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${item.isToday ? "opacity-80" : "text-[#b5b5c3]"}`}>{item.dayName}</span>
                <span className={`text-lg font-bold ${item.isToday ? "text-white" : "text-[#1a1a24]"}`}>{item.dayNumber}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Timeline Container */}
      <main className="max-w-7xl mx-auto relative px-6 mt-8">
        {/* Glowing Vertical Line */}
        <div className="absolute left-[35px] top-6 bottom-0 w-[2.5px] bg-gradient-to-b from-[#a428ff] via-[#a428ff]/50 to-[#a428ff]/10 shadow-[0_0_15px_rgba(164,40,255,0.4)]"></div>

        {/* Appointment 1: Active/Expanded */}
        <div className="relative flex gap-6 mb-10 group">
          <div className="z-10 mt-6 h-[18px] w-[18px] rounded-full bg-[#a428ff] border-[4px] border-[#f9f9fb] shadow-[0_0_15px_rgba(164,40,255,0.5)] ring-[6px] ring-[#a428ff]/10 flex-shrink-0"></div>
          <div className="flex-1 bg-white p-5 lg:p-7 rounded-[32px] border border-[#f0f0f5] shadow-[0_20px_40px_rgba(164,40,255,0.06)] relative overflow-hidden transition-all duration-300 hover:shadow-[0_25px_50px_rgba(164,40,255,0.1)]">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-[#a428ff]"></div>
            <div className="flex justify-between items-start mb-3">
              <span className="text-[9px] font-black uppercase tracking-widest text-[#a428ff] bg-[#a428ff]/10 px-3 py-1.5 rounded-full">Active Now</span>
              <div className="flex items-center gap-1.5 py-1 px-3 bg-green-500/10 rounded-full">
                <Timer size={16} className="text-green-600" weight="bold" />
                <span className="text-[11px] font-bold text-green-600">Expires 49m</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <House size={22} className="text-[#a428ff]" weight="fill" />
              <h3 className="text-[19px] font-bold text-[#1a1a24]">Home Visit</h3>
            </div>

            <p className="text-[#b5b5c3] text-sm flex items-center gap-1 mt-1">
              <Person size={18} weight="bold" />
              <span className="text-sm font-medium">Rajesh Kumar</span>
            </p>
            <p className="text-[#b5b5c3] text-sm flex items-center gap-1 mt-1">
              <Clock size={16} weight="bold" /> 10:00 AM - 11:30 AM
            </p>
            <p className="text-[#b5b5c3] text-sm flex items-center gap-1 mt-1">
              <MapPin size={16} weight="bold" /> 123 Premium Residency, Indiranagar
            </p>
            <div className="mt-4 pt-4 border-t border-[#a428ff]/10 flex gap-3">  
              <button 
                className="flex-1 bg-[#1a1a24] text-white text-sm font-bold py-3 lg:py-4 rounded-full active:scale-95 transition-all shadow-lg" 
                onClick={() => navigate("/vet/home-visit-details", { 
                  state: { 
                    visit: {
                      id: "HV-123",
                      petName: "Bella",
                      petBreed: "Golden Retriever • 3 Years",
                      ownerName: "Rajesh Kumar",
                      ownerPhone: "+1 (555) 987-6543",
                      address: "123 Premium Residency, Indiranagar",
                      time: "Today, 10:00 AM (In 49 mins)",
                      reason: "Vaccination & General Checkup",
                      image: "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=300&q=80",
                      distance: "1.2 MILES AWAY"
                    } 
                  } 
                })}
              >
                Details
              </button>
              <button className="flex-1 bg-[#a428ff] text-white text-[12px] font-bold py-3 lg:py-4 rounded-full flex items-center justify-center gap-2 shadow-lg shadow-[#a428ff]/20 active:scale-95 transition-all">  
                <NavigationArrow size={14} weight="fill" /> View Route 
              </button>  
            </div>
          </div>
        </div>

        {/* Appointment 2 */}
        <div className="relative flex gap-6 mb-10 group">
          <div className="z-10 mt-6 h-[14px] w-[14px] rounded-full bg-[#c4c4d4] border-[3px] border-[#f9f9fb] flex-shrink-0 ml-[2px]"></div>
          <div className="flex-1 bg-white/80 p-6 rounded-[28px] border border-[#f0f0f5] shadow-[0_10px_25px_rgba(0,0,0,0.02)] transition-all hover:shadow-[0_15px_35px_rgba(0,0,0,0.04)] hover:scale-[1.01]">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <Buildings size={20} className="text-[#a428ff]" weight="fill" />
                <h3 className="text-lg font-bold text-[#1a1a24]">Clinic Visit</h3>
              </div>
              <p className="font-black text-[#a428ff] text-lg">₹1,200</p>
            </div>
            <div className="space-y-1.5 mb-4">
              <div className="flex items-center gap-2 text-[#b5b5c3]">
                <Person size={18} weight="bold" />
                <span className="text-sm font-medium">Sarah Chen</span>
              </div>
              <div className="flex items-center gap-2 text-[#b5b5c3]">
                <Clock size={18} weight="bold" />
                <span className="text-sm font-medium">01:00 PM - 02:00 PM</span>
              </div>
            </div>
            <button 
              onClick={() => navigate("/vet/clinic-visit-details", { 
                state: { 
                  visit: {
                    id: "CV-124",
                    petName: "Luna",
                    petBreed: "Siamese Cat • 2 Years",
                    ownerName: "Sarah Chen",
                    ownerPhone: "+1 (555) 345-6789",
                    address: "HSR Paws Clinic, Sector 2",
                    time: "Today, 01:00 PM",
                    reason: "Routine Checkup",
                    image: "https://images.unsplash.com/photo-1513245530410-af097495b6a7?auto=format&fit=crop&w=300&q=80",
                    distance: ""
                  } 
                } 
              })}
              className="text-[#a428ff] text-xs font-bold flex items-center gap-1 bg-[#a428ff]/5 px-4 py-2 rounded-full w-fit hover:bg-[#a428ff]/10 active:scale-95 transition-all"
            >
              View Details <CaretRight size={16} weight="bold" />
            </button>
          </div>
        </div>

        {/* Appointment 3 */}
        <div className="relative flex gap-6 mb-10 group">
          <div className="z-10 mt-6 h-[14px] w-[14px] rounded-full bg-[#c4c4d4] border-[3px] border-[#f9f9fb] flex-shrink-0 ml-[2px]"></div>
          <div className="flex-1 bg-white/80 p-6 rounded-[28px] border border-[#f0f0f5] shadow-[0_10px_25px_rgba(0,0,0,0.02)] transition-all hover:shadow-[0_15px_35px_rgba(0,0,0,0.04)] hover:scale-[1.01]">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <House size={20} className="text-[#a428ff]" weight="fill" />
                <h3 className="text-lg font-bold text-[#1a1a24]">Home Visit</h3>
              </div>
              <p className="font-black text-[#a428ff] text-lg">₹850</p>
            </div>
            <div className="space-y-1.5 mb-4">
              <div className="flex items-center gap-2 text-[#b5b5c3]">
                <Person size={18} weight="bold" />
                <span className="text-sm font-medium">Amit Singh</span>
              </div>
              <div className="flex items-center gap-2 text-[#b5b5c3]">
                <Clock size={18} weight="bold" />
                <span className="text-sm font-medium">04:30 PM - 05:45 PM</span>
              </div>
            </div>
            <button 
              onClick={() => navigate("/vet/home-visit-details", { 
                state: { 
                  visit: {
                    id: "HV-124",
                    petName: "Max",
                    petBreed: "German Shepherd • 2 Years",
                    ownerName: "Amit Singh",
                    ownerPhone: "+1 (555) 123-4567",
                    address: "Sector 45, HSR Layout",
                    time: "Today, 04:30 PM",
                    reason: "Wound Dressing",
                    image: "https://images.unsplash.com/photo-1589944118318-c23147948331?auto=format&fit=crop&w=300&q=80",
                    distance: "4.8 MILES AWAY"
                  } 
                } 
              })}
              className="text-[#a428ff] text-xs font-bold flex items-center gap-1 bg-[#a428ff]/5 px-4 py-2 rounded-full w-fit hover:bg-[#a428ff]/10 active:scale-95 transition-all"
            >
              View Details <CaretRight size={16} weight="bold" />
            </button>
          </div>
        </div>
      </main>

      {/* Map Preview Card */}
      <div className="px-6 mb-8 max-w-7xl mx-auto">
        <div className="relative h-48 w-full rounded-[30px] overflow-hidden shadow-xl hover:scale-[1.005] transition-all">
          <div className="absolute inset-0 bg-slate-200 flex items-center justify-center">
            <img 
              className="w-full h-full object-cover opacity-60" 
              alt="Minimalist purple themed map showing delivery route" 
              src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=800&q=80" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#f9f9fb]/80 to-transparent"></div>
          </div>
          <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
            <div>
              <p className="text-[10px] font-black text-[#a428ff] uppercase tracking-wider">Next Destination</p>
              <p className="text-sm font-bold text-[#1a1a24]">Whitefield, Bangalore</p>
            </div>
            <div className="bg-[#a428ff] w-14 h-14 flex items-center justify-center rounded-full text-white shadow-xl shadow-[#a428ff]/40 hover:scale-110 transition-transform cursor-pointer">
              <NavigationArrow size={24} weight="fill" />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-sm flex justify-center z-50 border-t border-gray-50/50 pb-safe">
        <div className="w-full max-w-7xl flex justify-between px-6 pt-4 pb-7">
          <button className="flex flex-col items-center gap-1.5 text-[#b5b5c3] font-extrabold text-[9px] tracking-[0.5px] w-[60px]" onClick={() => navigate("/vet/home")}>
            <House size={24} weight="bold" />
            HOME
          </button>
          <button className="flex flex-col items-center gap-1.5 text-[#a428ff] font-extrabold text-[9px] tracking-[0.5px] w-[60px]">
            <CalendarDots size={24} weight="fill" />
            SCHEDULE
          </button>
          <button className="flex flex-col items-center gap-1.5 text-[#b5b5c3] font-extrabold text-[9px] tracking-[0.5px] w-[60px]" onClick={() => navigate("/vet/earnings")}>
            <Wallet size={24} weight="bold" />
            EARNINGS
          </button>
          <button className="flex flex-col items-center gap-1.5 text-[#b5b5c3] font-extrabold text-[9px] tracking-[0.5px] w-[60px]" onClick={() => navigate("/vet/profile")}>
            <User size={24} weight="bold" />
            PROFILE
          </button>
        </div>
      </nav>
    </div>
  );
};

export default VetSchedule;
