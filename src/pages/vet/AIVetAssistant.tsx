import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";

const petImages = [
  { src: "/smartmatch-dog.png", alt: "Dog", rotate: "-rotate-3" },
  { src: "/smartmatch-cat.png", alt: "Cat", rotate: "rotate-2" },
  { src: "/smartmatch-bird.png", alt: "Bird", rotate: "rotate-3" },
  { src: "/smartmatch-hamster.png", alt: "Hamster", rotate: "-rotate-2" },
];

const features = [
  {
    icon: (
      <img 
        src="/pawwithprofilecard.png" 
        alt="Profile Your Pet" 
        className="w-12 h-12 object-contain"
        referrerPolicy="no-referrer"
      />
    ),
    title: "Profile Your Pet",
    subtitle: "Quick setup with your pet's details.",
  },
  {
    icon: (
      <img 
        src="/messagewithsethoscope.png" 
        alt="Share Symptoms" 
        className="w-12 h-12 object-contain"
        referrerPolicy="no-referrer"
      />
    ),
    title: "Share Symptoms",
    subtitle: "Tell us what's concerning your pet Today.",
  },
  {
    icon: (
      <img 
        src="/shieldwithsethoscope.png" 
        alt="Expert Guidance" 
        className="w-12 h-12 object-contain"
        referrerPolicy="no-referrer"
      />
    ),
    title: "Expert Guidance",
    subtitle: "Personalised Care & Vet Matching",
  },
];

interface AIVetAssistantProps {
  onStartAssessment?: () => void;
  onClose?: () => void;
}

const AIVetAssistant = ({ onStartAssessment, onClose }: AIVetAssistantProps) => {
  const navigate = useNavigate();

  useEffect(() => {
    // Prefetch smartmatch.html and Tailwind CDN resources
    const prefetchHtml = document.createElement("link");
    prefetchHtml.rel = "prefetch";
    prefetchHtml.href = "/smartmatch.html";
    document.head.appendChild(prefetchHtml);

    const prefetchTailwind = document.createElement("link");
    prefetchTailwind.rel = "prefetch";
    prefetchTailwind.href = "https://cdn.tailwindcss.com?plugins=forms,container-queries";
    document.head.appendChild(prefetchTailwind);

    return () => {
      try {
        document.head.removeChild(prefetchHtml);
        document.head.removeChild(prefetchTailwind);
      } catch (e) {
        console.warn("Clean-up warning:", e);
      }
    };
  }, []);

  return (
    <div className="h-screen bg-gradient-to-b from-pink-50/50 via-white to-white flex flex-col overflow-hidden">
      {/* Background preloader to warm up smartmatch layout and eliminate click-to-load latency */}
      <iframe
        src="/smartmatch.html"
        title="smartmatch-preload"
        className="hidden pointer-events-none absolute w-0 h-0"
        style={{ display: "none", width: 0, height: 0, opacity: 0 }}
      />
      {/* Header - Fixed */}
      <header className="flex-shrink-0 flex items-center justify-between px-4 pt-6 pb-2">
        <button onClick={onClose || (() => navigate("/buyer/vet"))} className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="text-center">
          <p className="text-sm font-bold tracking-wider uppercase bg-gradient-to-r from-pink-600 to-purple-800 bg-clip-text text-transparent">
            SMART CARE MATCH
          </p>
        </div>
        <div className="w-10 h-10" />
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
          Tell us a little about your pet and we'll help you find the care that's right for them.
        </p>

        {/* Feature Cards */}
        <div className="px-4 space-y-3 mb-6">
          {features.map((f, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-border flex items-center gap-4">
              <div className="w-12 h-12 flex items-center justify-center flex-shrink-0">
                {f.icon}
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-foreground text-sm">{f.title}</h4>
                <p className="text-xs text-muted-foreground">{f.subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer CTA - Fixed */}
      <div className="flex-shrink-0 px-4 pb-3 pt-3 bg-gradient-to-t from-white via-white to-transparent">
        <button
          onClick={onStartAssessment || (() => navigate("/buyer/care-match"))}
          className="w-full py-4 rounded-2xl font-bold text-white text-base flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-shadow"
          style={{ background: 'linear-gradient(90deg, #FF4D6D, #8B5CF6)' }}
        >
          Get Personalised Match
          <ArrowRight className="w-5 h-5" />
        </button>
        <button 
          onClick={() => navigate("/vet/all-specialists")}
          className="w-full py-3 text-sm font-bold text-muted-foreground tracking-widest uppercase mt-2"
        >
          SKIP TO VET LIST
        </button>
      </div>
    </div>
  );
};

export default AIVetAssistant;
