import { useEffect, useState, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { supabase } from "@/integrations/supabase/client";

const FALLBACK_SLIDES = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800",
    gradient: "from-pink-400/80 to-purple-500/80",
    title: "Premium Pet Food",
    subtitle: "Up to 40% Off",
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800",
    gradient: "from-teal-400/80 to-emerald-500/80",
    title: "Cat Essentials",
    subtitle: "Free Delivery",
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=800",
    gradient: "from-orange-400/80 to-rose-500/80",
    title: "New Arrivals",
    subtitle: "Shop Now",
  },
  {
    id: 4,
    image: "https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=800",
    gradient: "from-violet-400/80 to-indigo-500/80",
    title: "Pet Healthcare",
    subtitle: "Best Deals",
  },
];

const ShopCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [slides, setSlides] = useState<any[]>([]);
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true },
    [Autoplay({ delay: 4000, stopOnInteraction: false })]
  );

  useEffect(() => {
    const fetchBanners = async () => {
      const { data } = await supabase
        .from("banners")
        .select("*")
        .eq("location", "buyer_home")
        .eq("is_active", true)
        .order("position");
      if (data && data.length > 0) {
        setSlides(data.map((b: any) => ({
          id: b.id, image: b.image_url, gradient: b.gradient,
          title: b.title, subtitle: b.subtitle, useCustomGradient: true,
        })));
      } else {
        setSlides(FALLBACK_SLIDES);
      }
    };
    fetchBanners();
  }, []);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCurrentIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    onSelect();
  }, [emblaApi, onSelect]);

  if (slides.length === 0) return null;

  return (
    <div className="w-full px-4 py-4">
      <div className="relative overflow-hidden rounded-2xl" ref={emblaRef}>
        <div className="flex">
          {slides.map((slide) => (
            <div key={slide.id} className="flex-[0_0_100%] min-w-0">
              <div className="relative h-40 rounded-2xl overflow-hidden">
                {slide.image && (
                  <img src={slide.image} alt={slide.title} className="w-full h-full object-cover" />
                )}
                {slide.useCustomGradient ? (
                  <div className="absolute inset-0" style={{ background: slide.gradient }} />
                ) : (
                  <div className={`absolute inset-0 bg-gradient-to-r ${slide.gradient}`} />
                )}
                <div className="absolute inset-0 flex flex-col justify-center px-6">
                  <h3 className="text-white text-xl font-bold">{slide.title}</h3>
                  <p className="text-white/90 text-sm mt-1">{slide.subtitle}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="flex justify-center gap-2 mt-3">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => emblaApi?.scrollTo(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentIndex ? "bg-primary w-6" : "bg-muted-foreground/30"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default ShopCarousel;
