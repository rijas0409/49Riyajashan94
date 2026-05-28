import React, { useEffect, useCallback } from "react";
import { SRUVO_LOGO_URL } from "@/constants/branding";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { 
  Heart, 
  Sparkles, 
  ShieldCheck, 
  Truck, 
  Fingerprint, 
  Stethoscope, 
  ArrowRight,
  Verified,
  Star
} from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const { user, profile, authReady } = useAuth();

  const navigateDashboard = useCallback((role: string) => {
    console.log("Navigating for role:", role);
    switch (role) {
      case "seller": navigate("/seller-dashboard", { replace: true }); break;
      case "admin": navigate("/admin", { replace: true }); break;
      case "delivery_partner": navigate("/delivery", { replace: true }); break;
      case "product_seller": navigate("/products-dashboard", { replace: true }); break;
      case "vet": navigate("/vet/home", { replace: true }); break;
      case "buyer": navigate("/buyer/home", { replace: true }); break;
      default: navigate("/buyer/home", { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    const cachedRole = localStorage.getItem("sruvo_user_role");
    
    if (authReady) {
      if (user && profile) {
        if (profile.role === 'vet') {
          // If profile status is undefined, it means fetchProfile hasn't finished yet.
          // In that case, we should wait instead of redirecting immediately.
          if (profile.vetStatus === undefined) {
            return;
          }

          if (profile.is_onboarding_complete === false) {
            navigate("/vet/onboarding", { replace: true });
            return;
          }

          if (profile.vetStatus !== 'verified' && profile.vetStatus !== 'approved' && profile.email !== 'gucci@123.com' && profile.email !== 'rijas@lv.com') {
            navigate("/vet-pending-approval", { replace: true });
            return;
          }
        }

        const role = profile.role;
        if (role) {
          localStorage.setItem("sruvo_user_role", role);
          navigateDashboard(role);
        } else {
          navigateDashboard("buyer");
        }
      }
    } else if (cachedRole) {
      const hasSession = localStorage.getItem("supabase.auth.token");
      if (hasSession) {
        navigateDashboard(cachedRole);
      }
    }
  }, [authReady, user, profile, navigateDashboard, navigate]);

  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7436c9]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f6fe] font-sans text-[#2d2e34] selection:bg-[#b789ff]/30 selection:text-[#310068]">
      {/* Texture Overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-[100] bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E')]"></div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl border-b border-[#acacb4]/10 shadow-[0_8px_32px_0_rgba(167,109,255,0.04)]">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
            <img src={SRUVO_LOGO_URL} alt="Sruvo" className="w-10 h-10 object-contain" />
            <span className="text-2xl font-bold bg-gradient-to-r from-[#FF6A88] to-[#A76DFF] bg-clip-text text-transparent tracking-tight font-headline">
              Sruvo
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <a href="#" className="text-[#7436c9] font-semibold border-b-2 border-[#7436c9] transition-all duration-300">Home</a>
            <a href="#" className="text-slate-600 hover:text-[#7436c9] font-medium transition-all duration-300">How It Works</a>
            <a href="#" className="text-slate-600 hover:text-[#7436c9] font-medium transition-all duration-300">Features</a>
            <a href="/vet" className="text-slate-600 hover:text-[#7436c9] font-medium transition-all duration-300">For Vets</a>
          </div>

          <Button 
            className="bg-gradient-to-r from-[#FF6A88] to-[#A76DFF] text-white rounded-full px-6 py-2.5 font-semibold hover:scale-105 transition-all duration-300 shadow-lg shadow-purple-500/20"
            onClick={() => navigate("/auth-buyer")}
          >
            Get Help
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 text-center lg:text-left animate-fade-in">
            <span className="inline-block py-1 px-4 rounded-full bg-[#b789ff]/10 text-[#7436c9] font-semibold text-sm mb-6 tracking-wide uppercase">
              Revolutionizing Pet Ownership
            </span>
            <h1 className="text-5xl lg:text-7xl font-extrabold leading-[1.1] mb-8 tracking-tighter text-[#2d2e34]">
              The Future of <br/>
              <span className="bg-gradient-to-r from-[#FF6A88] to-[#A76DFF] bg-clip-text text-transparent">Pet Care is Here.</span>
            </h1>
            <p className="text-lg text-slate-500 max-w-xl mx-auto lg:mx-0 mb-10 leading-relaxed">
              Sruvo is the ethereal sanctuary for modern pet parents. We combine advanced vet-verified credentials with a seamless digital ecosystem to ensure your furry friends live their best lives.
            </p>
            
            <div className="flex flex-col sm:flex-row flex-wrap items-center gap-4 justify-center lg:justify-start">
              <Button 
                size="xl"
                className="bg-gradient-to-r from-[#FF6A88] to-[#A76DFF] text-white px-8 py-7 rounded-full font-bold text-lg hover:scale-105 transition-all duration-300 shadow-xl shadow-purple-500/25 min-w-[200px]"
                onClick={() => navigate("/auth-buyer")}
              >
                Get Started
                <Sparkles className="ml-2 w-5 h-5" />
              </Button>
              <Button 
                variant="outline"
                className="bg-white border-2 border-slate-100 text-[#2d2e34] px-8 py-7 rounded-full font-bold text-lg hover:bg-slate-50 transition-all duration-300 min-w-[200px]"
                onClick={() => navigate("/auth-breeder")}
              >
                Become a Seller?
              </Button>
              <Button 
                variant="ghost"
                className="text-[#7436c9] font-bold hover:bg-[#b789ff]/10 rounded-full px-6"
                onClick={() => navigate("/auth-delivery")}
              >
                Delivery Partner?
              </Button>
            </div>

            <div className="mt-12 flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start opacity-80">
              <div className="flex -space-x-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-200 overflow-hidden shadow-sm">
                    <img 
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=User${i}`} 
                      alt="User" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
                <div className="w-10 h-10 rounded-full bg-[#ffc2c9] flex items-center justify-center text-xs font-bold text-[#8d1037] border-2 border-white shadow-sm">+1k</div>
              </div>
              <p className="text-slate-500 font-medium">Join 1,000+ early adopters already on Sruvo</p>
            </div>
          </div>

          <div className="flex-1 relative animate-fade-in [animation-delay:200ms]">
            <div className="absolute -top-10 -right-10 w-64 h-64 bg-[#A76DFF]/10 blur-[100px] rounded-full"></div>
            <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-[#FF6A88]/10 blur-[100px] rounded-full"></div>
            <div className="relative z-10 bg-white/80 backdrop-blur-xl p-4 rounded-[2.5rem] shadow-2xl border border-white/40">
              <div className="rounded-[2rem] w-full h-[500px] overflow-hidden">
                <img 
                  className="w-full h-full object-cover rounded-[2rem] hover:scale-105 transition-transform duration-700" 
                  src="https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=1000" 
                  alt="Pet Hero"
                />
              </div>
              <div className="absolute bottom-8 left-8 right-8 bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-white/50 shadow-lg translate-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold">Luna</h3>
                    <p className="text-slate-500 text-sm">Verified Goldie • 2 years</p>
                  </div>
                  <div className="flex items-center gap-1 bg-[#67fddf]/20 px-3 py-1 rounded-full text-[#005f51] text-xs font-bold ring-1 ring-[#005f51]/10">
                    <Verified className="w-4 h-4 fill-current" />
                    Health Verified
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Core Features */}
      <section className="py-24 bg-[#f0f0f9] relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-extrabold mb-4 tracking-tight">Ethereal Pet Management</h2>
            <p className="text-slate-500 max-w-2xl mx-auto leading-relaxed text-lg">Experience a new standard of care where every detail is handled with precision and empathy.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Fingerprint className="w-8 h-8" />}
              title="Verified Pets"
              description="Secure digital identity for your pets including health records, lineage, and behavioral assessments verified by experts."
              color="primary"
            />
            <FeatureCard 
              icon={<Stethoscope className="w-8 h-8" />}
              title="Vet Access"
              description="Instant connectivity to top-tier veterinary specialists. Real-time health monitoring and virtual consultations at your fingertips."
              color="tertiary"
            />
            <FeatureCard 
              icon={<Sparkles className="w-8 h-8" />}
              title="Care Simplified"
              description="An all-in-one ecosystem for scheduling, nutritional planning, and lifestyle management designed for busy pet owners."
              color="secondary"
            />
          </div>
        </div>
      </section>

      {/* Demo Pets Section */}
      <section className="py-24 max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
          <div>
            <h2 className="text-4xl font-extrabold tracking-tight mb-4">The Sruvo Family</h2>
            <p className="text-slate-500">Meet some of the beautiful souls currently on our platform.</p>
          </div>
          <Button variant="ghost" className="text-[#7436c9] font-bold group" onClick={() => navigate("/auth-buyer")}>
            View All Listings <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-2 transition-transform" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <PetListingCard 
            name="Milo" 
            breed="British Shorthair" 
            age="3 Years" 
            image="https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=600"
            tags={["Active", "Healthy"]}
          />
          <PetListingCard 
            name="Cooper" 
            breed="Golden Retriever" 
            age="1 Year" 
            image="https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=600"
            tags={["Friendly", "Vaccinated"]}
          />
          <PetListingCard 
            name="Ginger" 
            breed="Domestic Longhair" 
            age="5 Years" 
            image="https://images.unsplash.com/photo-1533738363-b7f9aef128ce?auto=format&fit=crop&q=80&w=600"
            tags={["Calm", "Indoor"]}
          />
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="bg-white/80 backdrop-blur-xl rounded-[3rem] p-12 md:p-20 relative overflow-hidden border border-white/40 shadow-2xl text-center">
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-[#b789ff]/10 blur-[100px] rounded-full"></div>
          <div className="relative z-10 flex flex-col items-center">
            <ShieldCheck className="w-16 h-16 text-[#7436c9] mb-8" />
            <h2 className="text-4xl md:text-5xl font-extrabold mb-8 tracking-tight max-w-3xl mx-auto leading-tight">Built on the Foundation of Responsible Sourcing</h2>
            <p className="text-slate-500 text-lg leading-relaxed max-w-2xl mx-auto mb-12">
              Every pet on Sruvo undergoes a rigorous verification process. We partner with ethical breeders and shelters to ensure transparency, health, and lifelong commitment to animal welfare.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 w-full border-t border-slate-100 pt-12 mt-4">
              <TrustStat value="100%" label="Vet Screened" />
              <TrustStat value="Safe" label="Encrypted Data" />
              <TrustStat value="24/7" label="Support" />
              <TrustStat value="Verified" label="Health Records" />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 py-16">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <img src={SRUVO_LOGO_URL} alt="Sruvo" className="w-8 h-8 object-contain" />
              <span className="text-2xl font-bold text-[#151B32]">Sruvo</span>
            </div>
            <p className="text-slate-500 max-w-sm mb-8 leading-relaxed">
              The ethereal sanctuary for pet parents and their beloved companions. Connecting hearts across India with transparency and love.
            </p>
            <div className="flex gap-4">
              {/* Social icons could go here */}
            </div>
          </div>
          <div>
            <h4 className="font-bold mb-6 text-[#151B32]">Company</h4>
            <ul className="space-y-4 text-slate-500">
              <li><a href="#" className="hover:text-[#7436c9] transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-[#7436c9] transition-colors">How It Works</a></li>
              <li><a href="#" className="hover:text-[#7436c9] transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-[#7436c9] transition-colors">Contact</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-6 text-[#151B32]">Legal</h4>
            <ul className="space-y-4 text-slate-500">
              <li><a href="#" className="hover:text-[#7436c9] transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-[#7436c9] transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-[#7436c9] transition-colors">Cookie Policy</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 pt-16 mt-16 border-t border-slate-50 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-400">
          <p>© 2024 Sruvo. All rights reserved.</p>
          <p>Made with love for pets across India.</p>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, description, color }: { icon: React.ReactNode, title: string, description: string, color: string }) => {
  const colorMap: Record<string, string> = {
    primary: "bg-[#b789ff]/10 text-[#7436c9]",
    tertiary: "bg-[#67fddf]/10 text-[#006858]",
    secondary: "bg-[#ffc2c9]/10 text-[#a9294a]"
  };

  return (
    <div className="group bg-white p-10 rounded-[2rem] hover:-translate-y-2 transition-all duration-500 shadow-sm hover:shadow-xl border border-slate-100/50">
      <div className={`w-16 h-16 rounded-2xl ${colorMap[color]} flex items-center justify-center mb-8 group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <h3 className="text-2xl font-bold mb-4">{title}</h3>
      <p className="text-slate-500 leading-relaxed">{description}</p>
    </div>
  );
};

const PetListingCard = ({ name, breed, age, image, tags }: { name: string, breed: string, age: string, image: string, tags: string[] }) => {
  const navigate = useNavigate();
  return (
    <div className="bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-500 group cursor-pointer" onClick={() => navigate("/auth-buyer")}>
      <div className="relative overflow-hidden h-80">
        <img className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" src={image} alt={name} />
        <div className="absolute top-4 left-4">
          <span className="bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm text-slate-500">Sample Listing</span>
        </div>
      </div>
      <div className="p-8">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-2xl font-bold tracking-tight">{name}</h4>
          <div className="bg-[#67fddf]/20 text-[#005f51] flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black">
            <Verified className="w-3 h-3 fill-current" /> VERIFIED
          </div>
        </div>
        <p className="text-slate-500 mb-6 font-medium">{breed} • {age} Old</p>
        <div className="flex gap-2">
          {tags.map(tag => (
            <span key={tag} className="px-3 py-1 bg-slate-50 rounded-full text-xs font-semibold text-slate-400">{tag}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

const TrustStat = ({ value, label }: { value: string, label: string }) => (
  <div className="flex flex-col items-center">
    <span className="text-3xl font-bold text-[#7436c9] mb-2">{value}</span>
    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{label}</span>
  </div>
);

export default Index;

