import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface DynBanner {
  id: string;
  title: string;
  subtitle: string;
  image_url: string;
  gradient: string;
  cta_text: string;
  link_url: string;
  target_route: string;
  banner_style: string;
  custom_width: string;
  custom_height: string;
  placement: string;
  border_radius: string;
  position: number;
  cta_alignment: string;
}

const EXCLUDED_PREFIXES = ["/admin", "/auth", "/seller", "/products-", "/vet-", "/delivery"];

const matchRoute = (currentPath: string, targetRoute: string): boolean => {
  if (targetRoute === "*") return true;
  if (currentPath === targetRoute) return true;
  if (targetRoute.endsWith("*") && currentPath.startsWith(targetRoute.slice(0, -1))) return true;
  return false;
};

const BannerCard = ({ b, navigate }: { b: DynBanner; navigate: (path: string) => void }) => {
  const handleClick = () => {
    if (!b.link_url) return;
    b.link_url.startsWith("http") ? window.open(b.link_url, "_blank") : navigate(b.link_url);
  };

  return (
    <div
      onClick={b.link_url ? handleClick : undefined}
      className={`overflow-hidden mx-auto ${b.link_url ? "cursor-pointer active:scale-[0.98] transition-transform" : ""}`}
      style={{
        width: b.custom_width || "100%",
        maxWidth: "100%",
        height: b.custom_height || "auto",
        borderRadius: b.border_radius || "16px",
        background: b.gradient,
      }}
    >
      <div className="flex items-center h-full relative">
        {b.image_url && (
          <img src={b.image_url} alt={b.title}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ borderRadius: b.border_radius || "16px" }} />
        )}
        {b.image_url && (
          <div className="absolute inset-0"
            style={{ background: `${b.gradient.split(')')[0]}, 0.5)`, borderRadius: b.border_radius || "16px" }} />
        )}
        <div className={`relative z-10 flex items-center w-full h-full p-4 ${b.cta_alignment === "center" ? "justify-center text-center" : b.cta_alignment === "right" ? "justify-end text-right" : "justify-start text-left"}`}>
          <div className={b.cta_alignment === "center" ? "" : "flex-1 min-w-0"}>
            {b.title && <h3 className="text-white text-sm md:text-base font-bold leading-tight whitespace-pre-line">{b.title}</h3>}
            {b.subtitle && <p className="text-white/80 text-[11px] mt-0.5 whitespace-pre-line">{b.subtitle}</p>}
            {b.cta_text && <button className="mt-1.5 bg-white text-black text-[11px] font-semibold px-3 py-1 rounded-full">{b.cta_text}</button>}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Inline banners component - place inside any page for route-matched banners.
 * Automatically fetches banners matching the current route and specified placement.
 */
export const InlineBanners = ({ placement = "top" }: { placement?: "top" | "bottom" }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [banners, setBanners] = useState<DynBanner[]>([]);
  const currentPath = location.pathname;

  const isExcluded = EXCLUDED_PREFIXES.some(p => currentPath.startsWith(p)) || currentPath === "/";

  useEffect(() => {
    if (isExcluded) { setBanners([]); return; }

    const fetchBanners = async () => {
      const { data } = await supabase
        .from("banners")
        .select("*")
        .eq("is_active", true)
        .eq("placement", placement)
        .eq("location", "custom")
        .order("position");

      if (!data) { setBanners([]); return; }
      setBanners((data as DynBanner[]).filter(b => matchRoute(currentPath, b.target_route)));
    };
    fetchBanners();
  }, [currentPath, placement, isExcluded]);

  if (banners.length === 0) return null;

  return (
    <div className="px-4 py-2 space-y-2">
      {banners.map(b => <BannerCard key={b.id} b={b} navigate={navigate} />)}
    </div>
  );
};

export default InlineBanners;
