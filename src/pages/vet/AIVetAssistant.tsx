import { useNavigate } from "react-router-dom";
import { ArrowLeft, X, ChevronRight, PawPrint, FileText, Plus, ArrowRight } from "lucide-react";

const petImages = [
  { src: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=300&h=300&fit=crop", alt: "Dog", rotate: "-rotate-3" },
  { src: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=300&h=300&fit=crop", alt: "Cat", rotate: "rotate-2" },
  { src: "https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=300&h=300&fit=crop", alt: "Bird", rotate: "rotate-3" },
  { src: "https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=300&h=300&fit=crop", alt: "Hamster", rotate: "-rotate-2" },
];

const features = [
  {
    icon: <PawPrint className="w-6 h-6 text-white" />,
    iconBg: "bg-purple-500",
    title: "Profile Your Pet",
    subtitle: "Quick setup with breed and age.",
  },
  {
    icon: <FileText className="w-6 h-6 text-white" />,
    iconBg: "bg-pink-400",
    title: "Share Symptoms",
    subtitle: "Chat naturally about your concerns.",
  },
  {
    icon: <Plus className="w-6 h-6 text-white" />,
    iconBg: "bg-purple-400",
    title: "Expert Guidance",
    subtitle: "Instant advice & clinic matching.",
  },
];

const AIVetAssistant = () => {
  const navigate = useNavigate();

  return (
    <div className="h-screen bg-gradient-to-b from-pink-50/50 via-white to-white flex flex-col overflow-hidden">
      {/* Header - Fixed */}
      <header className="flex-shrink-0 flex items-center justify-between px-4 pt-6 pb-2">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="text-center">
          <p className="text-xs font-bold tracking-widest uppercase" style={{ color: '#FF4D6D' }}>PREMIUM CARE</p>
          <p className="text-sm font-bold text-foreground">AI Vet Assistant</p>
        </div>
        <button onClick={() => navigate("/vet")} className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center">
          <X className="w-5 h-5 text-foreground" />
        </button>
      </header>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Pet Image Collage */}
        <div className="px-8 py-6">
          <div className="grid grid-cols-2 gap-3 max-w-[280px] mx-auto">
            {petImages.map((pet, i) => (
              <div key={i} className={`rounded-2xl overflow-hidden aspect-square shadow-lg ${pet.rotate}`}>
                <img src={pet.src} alt={pet.alt} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>

        {/* Main Heading */}
        <div className="text-center px-6 mb-2">
          <h1 className="text-2xl font-bold text-foreground leading-tight">
            Smart Care for{" "}
            <span className="bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
              Your Best Friend
            </span>
          </h1>
        </div>
        <p className="text-center text-sm text-muted-foreground px-8 mb-6">
          Get instant veterinary guidance and book appointments with top-rated local experts.
        </p>

        {/* Feature Cards */}
        <div className="px-4 space-y-3 mb-6">
          {features.map((f, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-border flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl ${f.iconBg} flex items-center justify-center flex-shrink-0`}>
                {f.icon}
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-foreground text-sm">{f.title}</h4>
                <p className="text-xs text-muted-foreground">{f.subtitle}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            </div>
          ))}
        </div>
      </div>

      {/* Footer CTA - Fixed */}
      <div className="flex-shrink-0 px-4 pb-3 pt-3 bg-gradient-to-t from-white via-white to-transparent">
        <button
          onClick={() => navigate("/vet/ai-assessment")}
          className="w-full py-4 rounded-2xl font-bold text-white text-base flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-shadow"
          style={{ background: 'linear-gradient(90deg, #FF4D6D, #8B5CF6)' }}
        >
          Start AI Assessment
          <ArrowRight className="w-5 h-5" />
        </button>
        <button 
          onClick={() => navigate("/vet")}
          className="w-full py-3 text-sm font-bold text-muted-foreground tracking-widest uppercase mt-2"
        >
          SKIP TO VET LIST
        </button>
      </div>
    </div>
  );
};

export default AIVetAssistant;
