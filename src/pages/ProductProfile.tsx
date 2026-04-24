import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useWishlist } from "@/hooks/useWishlist";
import { useCart } from "@/contexts/CartContext";
import BottomNavigation from "@/components/BottomNavigation";
import {
  ArrowLeft, Heart, Share2, Star, ChevronDown, ChevronUp,
  Shield, Truck, Loader2, ChevronRight, Plus, Minus, ShoppingCart,
  Play, Pause, Volume2, VolumeX, Maximize
} from "lucide-react";
import rjStar from "@/assets/rj-star.png";
import miniCartImage from "@/assets/mini-cart.png";
import useBuyerActivityTracker from "@/hooks/useBuyerActivityTracker";

interface Product {
  id: string; name: string; brand: string; description: string | null;
  price: number; original_price: number | null; discount: number | null;
  images: string[] | null; videos: string[] | null; pet_type: string;
  category: string; weight: string | null; unit: string | null; stock: number;
  highlights: string[] | null; ingredients: string[] | null;
  feeding_guide: any[] | null; variants: any[] | null;
  country_of_origin: string | null; breed_applicable: string[] | null;
  shipping_free: boolean | null; delivery_scope: string | null;
  dispatch_city: string | null; handling_time: string | null;
  return_policy: string | null; warranty: string | null;
  storage_instructions: string | null; expiry_date: string | null;
  seller_id: string; views: number | null; total_sold: number | null;
}

const FREE_DELIVERY_THRESHOLD = 499;
const BUY_NOW_GRADIENT = "linear-gradient(90deg, #FF4D6D, #8B5CF6)";
const STEPPER_MORPH_MS = 200;
const MINI_APPEAR_DELAY_MS = 200;
const MINI_POP_MS = 250;
const MINI_BOUNCE_MS = 140;
const MINI_VISIBLE_EXTRA_MS = 510; // extra hold so mini cart is visible ~900ms total
const CART_EXPAND_MS = 300;
const CART_COLLAPSE_MS = 500;

const ProductProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<"quick" | "deep">("quick");
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({ highlights: true, description: true });
  const [similarProducts, setSimilarProducts] = useState<any[]>([]);
  const [aiInsights, setAiInsights] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const { toggleProductWishlist, isProductInWishlist } = useWishlist();
  const { addToCart, cartItems, updateQuantity, cartCount } = useCart();

  // Video state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showVideoControls, setShowVideoControls] = useState(true);
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoDuration, setVideoDuration] = useState("");
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cart animation state
  const [cartPhase, setCartPhase] = useState<'hidden' | 'mini' | 'expanding' | 'full' | 'collapsing'>('hidden');
  const prevCartCount = useRef(0);
  const cartAnimationTimersRef = useRef<number[]>([]);
  const [thumbnailPop, setThumbnailPop] = useState(0);

  // Fly-to-cart refs
  const productImageRef = useRef<HTMLImageElement>(null);
  const cartTargetRef = useRef<HTMLDivElement>(null);

  const clearCartAnimationTimers = useCallback(() => {
    cartAnimationTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
    cartAnimationTimersRef.current = [];
  }, []);

  // Swipe refs
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const swiping = useRef(false);

  const isWishlisted = isProductInWishlist(id || "");

  useBuyerActivityTracker({
    entityType: "product",
    entityId: id,
    entityName: product ? `${product.name} (${product.brand})` : undefined,
    entityImage: product?.images?.[0] || undefined,
  });

  useEffect(() => { fetchProduct(); }, [id]);

  // Preload images for smoother first paint
  useEffect(() => {
    const mini = new Image();
    mini.src = miniCartImage;

    if (product?.images) {
      product.images.forEach(src => {
        const img = new Image();
        img.src = src;
      });
    }
  }, [product?.images]);

  // Auto-pause video when swiping to another slide
  useEffect(() => {
    setVideoError(false);
    setVideoProgress(0);
    setShowVideoControls(true);

    if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, [currentImageIndex]);

  // Cart animation logic
  useEffect(() => {
    if (cartCount > 0 && prevCartCount.current === 0) {
      clearCartAnimationTimers();
      setCartPhase("hidden");

      cartAnimationTimersRef.current.push(
        window.setTimeout(() => setCartPhase("mini"), MINI_APPEAR_DELAY_MS),
      );
      cartAnimationTimersRef.current.push(
        window.setTimeout(() => setCartPhase("expanding"), MINI_APPEAR_DELAY_MS + MINI_POP_MS + MINI_BOUNCE_MS + MINI_VISIBLE_EXTRA_MS),
      );
      cartAnimationTimersRef.current.push(
        window.setTimeout(() => setCartPhase("full"), MINI_APPEAR_DELAY_MS + MINI_POP_MS + MINI_BOUNCE_MS + MINI_VISIBLE_EXTRA_MS + CART_EXPAND_MS),
      );
    } else if (cartCount === 0 && prevCartCount.current > 0) {
      clearCartAnimationTimers();
      setCartPhase("collapsing");

      cartAnimationTimersRef.current.push(
        window.setTimeout(() => setCartPhase("hidden"), CART_COLLAPSE_MS),
      );
    } else if (cartCount > 0 && prevCartCount.current > 0 && cartCount !== prevCartCount.current) {
      // Item added/removed while bar is visible — trigger thumbnail pop
      setThumbnailPop(Date.now());
    }

    prevCartCount.current = cartCount;
  }, [cartCount, clearCartAnimationTimers]);

  useEffect(() => {
    return () => {
      clearCartAnimationTimers();
      if (controlsTimeout.current) {
        clearTimeout(controlsTimeout.current);
      }
    };
  }, [clearCartAnimationTimers]);

  const resetControlsTimer = useCallback(() => {
    setShowVideoControls(true);
    if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
    controlsTimeout.current = setTimeout(() => {
      if (isPlaying) setShowVideoControls(false);
    }, 3000);
  }, [isPlaying]);

  const fetchProduct = async () => {
    if (!id) return;
    try {
      const { data, error } = await supabase.from("shop_products").select("*").eq("id", id).single();
      if (error) throw error;
      setProduct(data as any);
      setCurrentImageIndex(0);
      setSelectedVariant(0);
      await supabase.from("shop_products").update({ views: ((data as any).views || 0) + 1 }).eq("id", id);
      fetchSimilar(data.pet_type, data.category, id);
      fetchAiInsights(data as any);
    } catch {
      toast.error("Product not found");
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const fetchSimilar = async (petType: string, category: string, excludeId: string) => {
    const { data } = await supabase
      .from("shop_products")
      .select("id, name, price, original_price, discount, images, pet_type, handling_time")
      .eq("pet_type", petType)
      .eq("category", category)
      .eq("is_active", true)
      .eq("verification_status", "verified")
      .neq("id", excludeId)
      .limit(6);
    if (data && data.length >= 2) {
      setSimilarProducts(data);
    } else {
      const { data: fallback } = await supabase
        .from("shop_products")
        .select("id, name, price, original_price, discount, images, pet_type, handling_time")
        .eq("pet_type", petType)
        .eq("is_active", true)
        .eq("verification_status", "verified")
        .neq("id", excludeId)
        .limit(6);
      setSimilarProducts(fallback || data || []);
    }
  };

  const fetchAiInsights = async (prod: Product) => {
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("pet-ai-insights", {
        body: {
          breed: prod.brand,
          category: prod.pet_type,
          ageMonths: 12,
          gender: "unknown",
          isProduct: true,
          productName: prod.name,
          productCategory: prod.category,
          productIngredients: prod.ingredients,
          productHighlights: prod.highlights,
        },
      });
      if (!error) setAiInsights(data);
    } catch { /* silent */ } finally { setAiLoading(false); }
  };

  const toggleSection = (key: string) => setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));

  const handleShare = async () => {
    try { await navigator.share({ title: product?.name, url: window.location.href }); }
    catch { navigator.clipboard.writeText(window.location.href); toast.success("Link copied!"); }
  };

  const handleWishlist = async () => {
    if (!product) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { toast.info("Please login"); navigate("/auth"); return; }
    await toggleProductWishlist({ id: product.id, name: product.name, price: product.price, image: product.images?.[0] || "", petType: product.pet_type });
  };

  // Fly-to-cart animation — waits for mini cart to be visible, then drops product into it
  const triggerFlyToCart = useCallback((delayMs: number) => {
    setTimeout(() => {
      const imgEl = productImageRef.current;
      if (!imgEl) return;

      // Target: the mini cart element if visible, else fallback position
      let targetX = window.innerWidth / 2;
      let targetY = window.innerHeight - (56 + 54 + 29) - 32;

      if (cartTargetRef.current) {
        const targetRect = cartTargetRef.current.getBoundingClientRect();
        targetX = targetRect.left + targetRect.width / 2;
        // Land slightly above center so it visually goes "inside" mini cart, never below it
        targetY = targetRect.top + targetRect.height * 0.42;
      }

      // Clone: small thumbnail, starts just above the mini cart
      const CLONE_SIZE = 40;
      const startX = targetX - CLONE_SIZE / 2;
      const startY = targetY - 72;

      // Center-corrected travel so final frame aligns inside cart (not below)
      const dy = targetY - (startY + CLONE_SIZE / 2);

      const clone = document.createElement("img");
      clone.src = imgEl.src;
      clone.style.cssText = `
        position:fixed; z-index:9999;
        top:${startY}px; left:${startX}px;
        width:${CLONE_SIZE}px; height:${CLONE_SIZE}px;
        object-fit:cover; pointer-events:none;
        border-radius:10px;
        box-shadow:0 3px 12px rgba(0,0,0,0.15);
        will-change:transform,opacity;
      `;
      document.body.appendChild(clone);

      clone.animate(
        [
          { transform: "translateY(0) scale(1)", opacity: 1, offset: 0 },
          { transform: `translateY(${dy * 0.62}px) scale(0.65)`, opacity: 1, offset: 0.56 },
          { transform: `translateY(${dy}px) scale(0.32)`, opacity: 0.82, offset: 0.9 },
          { transform: `translateY(${dy}px) scale(0.15)`, opacity: 0, offset: 1 },
        ],
        { duration: 450, easing: "cubic-bezier(0.4, 0, 0.2, 1)", fill: "forwards" }
      ).onfinish = () => {
        clone.remove();
        if (cartTargetRef.current) {
          cartTargetRef.current.animate(
            [
              { transform: "scale(1)" },
              { transform: "scale(1.15)" },
              { transform: "scale(0.95)" },
              { transform: "scale(1)" },
            ],
            { duration: 300, easing: "ease-out" }
          );
        }
      };
    }, delayMs);
  }, []);

  const handleAddToCart = () => {
    if (!product) return;
    // If cart is empty (mini cart not yet visible), wait for mini cart to pop first
    const isFirstAdd = cartCount === 0;
    const flyDelay = isFirstAdd ? MINI_APPEAR_DELAY_MS + MINI_POP_MS + 50 : 0;
    addToCart({ id: product.id, name: product.name, price: product.price, image: product.images?.[0] || "" });
    triggerFlyToCart(flyDelay);
  };

  const handleRemoveFromCart = () => {
    if (!product) return;
    updateQuantity(product.id, -1);
  };

  const productInCart = product ? cartItems.find(item => item.id === product.id) : null;
  const productQty = productInCart?.quantity || 0;

  const handleBuyNow = async () => {
    if (!product) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { toast.info("Please login to purchase"); navigate("/auth"); return; }
    try {
      const { error } = await supabase.from("product_orders").insert({
        buyer_id: session.user.id,
        product_id: product.id,
        product_name: product.name,
        product_image: product.images?.[0] || null,
        product_price: product.price,
        quantity: Math.max(productQty, 1),
        total_amount: product.price * Math.max(productQty, 1),
        status: "pending",
      });
      if (error) throw error;
      toast.success("Order placed successfully!");
      navigate("/profile/orders");
    } catch {
      toast.error("Failed to place order");
    }
  };

  // Video controls
  const togglePlay = async (event?: React.MouseEvent) => {
    event?.stopPropagation();
    if (!videoRef.current || videoError) return;

    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
      setShowVideoControls(true);
      return;
    }

    try {
      await videoRef.current.play();
      setIsPlaying(true);
      resetControlsTimer();
    } catch {
      setIsPlaying(false);
      setShowVideoControls(true);
    }
  };

  const toggleMute = (event?: React.MouseEvent) => {
    event?.stopPropagation();
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleFullscreen = async (event?: React.MouseEvent) => {
    event?.stopPropagation();
    if (!videoRef.current) return;

    try {
      if (videoRef.current.requestFullscreen) {
        await videoRef.current.requestFullscreen();
      }
    } catch {
      // silent fallback
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current || !Number.isFinite(videoRef.current.duration) || videoRef.current.duration <= 0) return;
    setVideoProgress((videoRef.current.currentTime / videoRef.current.duration) * 100);
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current || !Number.isFinite(videoRef.current.duration)) return;
    const dur = videoRef.current.duration;
    setVideoDuration(`${Math.floor(dur / 60)}:${Math.floor(dur % 60).toString().padStart(2, "0")}`);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!videoRef.current || !Number.isFinite(videoRef.current.duration) || videoRef.current.duration <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    videoRef.current.currentTime = ((e.clientX - rect.left) / rect.width) * videoRef.current.duration;
  };

  const getVideoMimeType = (videoUrl: string) => {
    const lowerUrl = videoUrl.toLowerCase();
    if (lowerUrl.endsWith(".webm")) return "video/webm";
    if (lowerUrl.endsWith(".ogg")) return "video/ogg";
    if (lowerUrl.endsWith(".m3u8")) return "application/x-mpegURL";
    if (lowerUrl.endsWith(".ts")) return "video/mp2t";
    return "video/mp4";
  };

  // Touch swipe handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    swiping.current = true;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!swiping.current || !product) return;
    swiping.current = false;
    const diff = touchStartX.current - touchEndX.current;
    const threshold = 50;
    if (Math.abs(diff) < threshold) return;
    const total = allMedia.length;
    if (total <= 1) return;
    if (diff > 0) {
      setCurrentImageIndex(prev => (prev + 1) % total);
    } else {
      setCurrentImageIndex(prev => (prev - 1 + total) % total);
    }
  }, [product]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!product) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Product not found</div>;

  const images = (product.images || []).filter((url): url is string => typeof url === "string" && url.trim().length > 0);
  const videos = (product.videos || []).filter((url): url is string => typeof url === "string" && url.trim().length > 0);

  // Ordered media: first image, first video, remaining videos, remaining images.
  const allMedia: { type: "image" | "video"; url: string }[] = [];

  if (images.length === 0) {
    videos.forEach((videoUrl) => allMedia.push({ type: "video", url: videoUrl }));
  } else {
    allMedia.push({ type: "image", url: images[0] });

    if (videos.length > 0) {
      allMedia.push({ type: "video", url: videos[0] });
      videos.slice(1).forEach((videoUrl) => allMedia.push({ type: "video", url: videoUrl }));
    }

    images.slice(1).forEach((imageUrl) => allMedia.push({ type: "image", url: imageUrl }));
  }

  const productUnit = product.unit || "";
  const rawVariants: any[] = Array.isArray(product.variants) ? product.variants.filter((v: any) => v && (v.label || v.packSize)) : [];
  const hasInventoryVariants = rawVariants.length > 0;
  const baseLabel = product.weight ? `${product.weight}${productUnit ? ` ${productUnit}` : ""}` : product.name;
  const baseVariant = hasInventoryVariants ? {
    label: baseLabel,
    packSize: "",
    price: product.price,
    originalPrice: product.original_price,
    discount: product.discount && product.discount > 0 ? `${product.discount}% OFF` : null,
    stock: product.stock,
  } : null;
  const variantList: any[] = baseVariant ? [baseVariant, ...rawVariants] : [];
  const ingredientsList = product.ingredients || [];
  const feedingGuide: any[] = Array.isArray(product.feeding_guide) ? product.feeding_guide : [];

  const highlightPairs: { label: string; value: string }[] = [];
  (product.highlights || []).forEach(h => {
    const sep = h.indexOf(":");
    if (sep > 0) {
      highlightPairs.push({ label: h.slice(0, sep).trim(), value: h.slice(sep + 1).trim() });
    } else {
      highlightPairs.push({ label: "Feature", value: h });
    }
  });

  const cartTotal = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const deliveryProgress = Math.min(100, (cartTotal / FREE_DELIVERY_THRESHOLD) * 100);
  const deliveryUnlocked = cartTotal >= FREE_DELIVERY_THRESHOLD;

  const currentMedia = allMedia[currentImageIndex];
  const isCurrentVideo = currentMedia?.type === 'video';

  return (
    <div className="min-h-screen bg-white pb-36">
      {/* ── 1) Image Section with Swipe + Video Support ── */}
      <div className="relative bg-[#F8F7FC]" style={{ paddingTop: "90%" }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="absolute inset-0 flex items-center justify-center p-6">
          {allMedia.length > 0 ? (
            isCurrentVideo && !videoError ? (
              <div className="w-full h-full relative flex items-center justify-center" onClick={resetControlsTimer}>
                <video
                  ref={videoRef}
                  className="max-w-full max-h-full object-contain rounded-lg"
                  playsInline
                  preload="metadata"
                  muted={isMuted}
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onEnded={() => { setIsPlaying(false); setShowVideoControls(true); }}
                  onError={() => setVideoError(true)}
                >
                  <source src={currentMedia.url} type={getVideoMimeType(currentMedia.url)} />
                </video>
                {/* Duration badge */}
                {videoDuration && !isPlaying && (
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/50 text-white text-[11px] font-medium z-10">
                    {videoDuration}
                  </div>
                )}
                {/* Bottom gradient */}
                <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/30 to-transparent pointer-events-none rounded-b-lg" />
                {/* Play button */}
                {!isPlaying && (
                  <button onClick={(event) => { void togglePlay(event); }} className="absolute inset-0 flex items-center justify-center z-10">
                    <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg" style={{ boxShadow: "0 0 20px rgba(244,114,182,0.3)" }}>
                      <Play className="w-7 h-7 text-[#333] ml-1" fill="#333" />
                    </div>
                  </button>
                )}
                {/* Controls */}
                {isPlaying && showVideoControls && (
                  <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2 z-10" style={{ animation: "fadeIn 0.15s ease-out" }}>
                    <button onClick={(event) => { void togglePlay(event); }} className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center">
                      <Pause className="w-4 h-4 text-white" />
                    </button>
                    <div className="flex-1 h-[3px] bg-white/30 rounded-full cursor-pointer" onClick={handleSeek}>
                      <div className="h-full bg-white rounded-full transition-all" style={{ width: `${videoProgress}%` }} />
                    </div>
                    <button onClick={(event) => toggleMute(event)} className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center">
                      {isMuted ? <VolumeX className="w-4 h-4 text-white" /> : <Volume2 className="w-4 h-4 text-white" />}
                    </button>
                    <button onClick={(event) => { void handleFullscreen(event); }} className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center">
                      <Maximize className="w-4 h-4 text-white" />
                    </button>
                  </div>
                )}
              </div>
            ) : isCurrentVideo && videoError ? (
              <div className="w-full h-full flex items-center justify-center bg-[#E5E7EB] rounded-lg">
                <div className="w-16 h-16 rounded-full bg-white/60 flex items-center justify-center">
                  <Play className="w-7 h-7 text-[#999] ml-1" />
                </div>
              </div>
            ) : (
              <img
                key={currentImageIndex}
                ref={productImageRef}
                src={currentMedia?.url}
                alt={product.name}
                className="max-w-full max-h-full object-contain"
                loading="eager"
                decoding="async"
                style={{ animation: "fadeIn 0.15s ease-out" }}
              />
            )
          ) : (
            <div className="text-6xl">📦</div>
          )}
        </div>
        {/* Image counter */}
        {allMedia.length > 1 && (
          <div className="absolute top-14 right-4 px-2.5 py-1 rounded-full bg-black/40 text-white text-[11px] font-semibold z-10">
            {currentImageIndex + 1}/{allMedia.length}
          </div>
        )}
        {/* Dots */}
        {allMedia.length > 1 && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
            {allMedia.map((m, i) => (
              <button key={i} onClick={() => setCurrentImageIndex(i)}
                className={`h-[6px] rounded-full transition-all duration-200 ${i === currentImageIndex ? "w-5 bg-[#A855F7]" : "w-[6px] bg-[#D1D5DB]"}`} />
            ))}
          </div>
        )}
        {/* Top bar */}
        <div className="absolute top-10 left-4 right-4 flex justify-between z-10">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-[#F3F0F9] flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-[#6B7280]" />
          </button>
          <div className="flex gap-2.5">
            <button onClick={handleWishlist} className="w-10 h-10 rounded-full bg-[#F3F0F9] flex items-center justify-center">
              <Heart className={`w-5 h-5 ${isWishlisted ? "fill-[#A855F7] text-[#A855F7]" : "text-[#6B7280]"}`} />
            </button>
            <button onClick={handleShare} className="w-10 h-10 rounded-full bg-[#F3F0F9] flex items-center justify-center">
              <Share2 className="w-5 h-5 text-[#6B7280]" />
            </button>
          </div>
        </div>
      </div>

      {/* ── 2) Product Info ── */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex gap-2 mb-4">
          <span className="px-3 py-1 rounded-md text-[11px] font-bold border border-[#D8B4FE] text-[#9333EA] tracking-wide">PREMIUM GRADE</span>
          <span className="px-3 py-1 rounded-md text-[11px] font-bold border border-[#D8B4FE] text-[#9333EA] tracking-wide">VET RECOMMENDED</span>
        </div>
        <h1 className="text-[22px] font-bold text-[#111827] leading-tight">{product.name}</h1>
        <div className="flex items-center gap-1.5 mt-1.5">
          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
          <span className="text-[14px] font-bold text-[#111827]">4.6</span>
          <span className="text-[13px] text-[#9CA3AF]">(4.9k)</span>
        </div>
        {/* Dynamic price based on selected variant */}
        {(() => {
          const sv = variantList.length > 0 ? variantList[selectedVariant] : null;
          const displayPrice = sv?.price ? Number(sv.price) : product.price;
          const displayOriginal = sv?.originalPrice ? Number(sv.originalPrice) : product.original_price;
          const calcDiscount = (price: number, orig: number) => {
            if (orig > 0 && price > 0 && orig > price) return `${Math.round(((orig - price) / orig) * 100)}% OFF`;
            return null;
          };
          const rawDiscount = calcDiscount(displayPrice, Number(displayOriginal || 0))
            || (product.discount && product.discount > 0 ? `${product.discount}% OFF` : null);
          const displayDiscount = rawDiscount === "0% OFF" ? null : rawDiscount;
          return (
            <div className="flex items-baseline gap-2.5 mt-3">
              <span className="text-[26px] font-extrabold text-[#111827]">₹{displayPrice}</span>
              {displayOriginal && Number(displayOriginal) > displayPrice && (
                <span className="text-[15px] text-[#9CA3AF] line-through">₹{displayOriginal}</span>
              )}
              {displayDiscount && (
                <span className="text-[13px] font-bold text-[#9333EA]">{displayDiscount}</span>
              )}
            </div>
          );
        })()}
        {product.weight && <p className="text-[14px] text-[#6B7280] mt-1">Quantity: {product.weight}</p>}

        {/* ── A) Pack/Variant Cards ── */}
        {variantList.length > 0 && (
          <div className="flex gap-3 mt-4 overflow-x-auto scrollbar-hide pb-1">
            {variantList.map((v: any, i: number) => {
              const isSelected = i === selectedVariant;
              const rawLabel = v.label || v.value || v.type || "";
              const packSize = v.packSize || "";
              const appendUnit = (lbl: string) => {
                if (!productUnit || lbl.toLowerCase().includes(productUnit.toLowerCase())) return lbl;
                return `${lbl} ${productUnit}`;
              };
              const displayLabel = appendUnit(packSize || rawLabel);
              const vPrice = v.price ? Number(v.price) : null;
              const vOriginal = v.originalPrice ? Number(v.originalPrice) : null;
              const discountPct = (vOriginal && vPrice && vOriginal > vPrice)
                ? Math.round(((vOriginal - vPrice) / vOriginal) * 100)
                : 0;
              const discountText = discountPct > 0 ? `${discountPct}% OFF` : "";
              const vStock = v.stock ? Number(v.stock) : null;
              const showLowStock = vStock !== null && vStock > 0 && vStock < 10;

              return (
                <button key={i} onClick={() => setSelectedVariant(i)}
                  className="flex-shrink-0 text-left transition-all"
                  style={{
                    minWidth: 145,
                    borderRadius: 12,
                    border: isSelected ? "2.5px solid #1A6DFF" : "1.5px dashed #C4C4C4",
                    background: "#FFFFFF",
                    padding: "14px 16px 12px",
                    boxShadow: isSelected ? "0 2px 10px rgba(26,109,255,0.10)" : "none",
                  }}>
                  <p style={{ fontSize: 15, fontWeight: 700, color: "#374151", marginBottom: 4 }}>{displayLabel}</p>
                  {discountText && (
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#16A34A", marginBottom: 6 }}>{discountText}</p>
                  )}
                  {vPrice !== null && (
                    <p style={{ fontSize: 17, fontWeight: 800, color: "#111827", lineHeight: "1.2" }}>
                      ₹{vPrice}{" "}
                      {vOriginal && vOriginal > vPrice && (
                        <span style={{ fontSize: 13, fontWeight: 400, color: "#9CA3AF", textDecoration: "line-through" }}>₹{vOriginal}</span>
                      )}
                    </p>
                  )}
                  {showLowStock && (
                    <p style={{ fontSize: 12, fontWeight: 600, color: "#1A6DFF", marginTop: 4 }}>{vStock} left</p>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── 3) Sruvo AI Insights ── */}
      <div className="px-5 py-4">
        <div className="rounded-3xl overflow-hidden" style={{
          border: "1.5px solid transparent",
          backgroundImage: "linear-gradient(#F9FAFB, #F9FAFB), linear-gradient(135deg, #C4B5FD, #F9A8D4, #C4B5FD)",
          backgroundOrigin: "border-box",
          backgroundClip: "padding-box, border-box",
          boxShadow: "0 4px 24px -4px rgba(139,92,246,0.08)",
        }}>
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <div className="flex items-center gap-2">
              <img src={rjStar} alt="" className="w-[49px] h-[49px] object-contain" style={{ filter: "drop-shadow(0 0 6px rgba(139,92,246,0.3))" }} />
              <div className="flex flex-col leading-snug">
                <span className="font-semibold text-[18px] text-[#151B32] tracking-tight">Sruvo AI</span>
                <span className="font-extrabold text-[20px] text-[#151B32] tracking-tight -mt-0.5">Insights</span>
              </div>
            </div>
            <div className="flex bg-[#F3F4F6] rounded-full p-0.5">
              <button onClick={() => setActiveTab("quick")}
                className={`px-3.5 py-1.5 text-[11px] font-semibold rounded-full transition-all ${activeTab === "quick" ? "bg-white text-[#111827] shadow-sm" : "text-[#9CA3AF]"}`}>
                Quick<br/>Facts
              </button>
              <button onClick={() => setActiveTab("deep")}
                className={`px-3.5 py-1.5 text-[11px] font-semibold rounded-full transition-all ${activeTab === "deep" ? "bg-white text-[#111827] shadow-sm" : "text-[#9CA3AF]"}`}>
                Deep<br/>Dive
              </button>
            </div>
          </div>
          <div className="px-5 pb-5">
            {aiLoading ? (
              <div className="space-y-5 py-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex gap-4 animate-pulse">
                    <div className="w-12 h-12 rounded-full bg-[#E5E7EB] flex-shrink-0" />
                    <div className="flex-1 space-y-2 pt-1">
                      <div className="h-4 bg-[#E5E7EB] rounded w-1/3" />
                      <div className="h-3 bg-[#E5E7EB] rounded w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : aiInsights ? (
              activeTab === "quick" ? (
                <div className="space-y-5 py-2" style={{ animation: "fadeIn 0.3s ease-in-out" }}>
                  {[
                    { icon: "🍗", title: aiInsights.quick?.nutrition?.title, desc: aiInsights.quick?.nutrition?.text, bg: "#F3EEFF", color: "#7C3AED" },
                    { icon: "⚡", title: aiInsights.quick?.activity?.title, desc: aiInsights.quick?.activity?.text, bg: "#EEF4FF", color: "#3B82F6" },
                    { icon: "💚", title: aiInsights.quick?.lifespan?.title, desc: aiInsights.quick?.lifespan?.text, bg: "#FFF1F2", color: "#F43F5E" },
                  ].map((item, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 text-lg" style={{ backgroundColor: item.bg }}>
                        {item.icon}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-[15px] text-[#151B32] mb-1">{item.title}</p>
                        <p className="text-[13px] text-[#6B7280] leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-5 py-2" style={{ animation: "fadeIn 0.3s ease-in-out" }}>
                  {[aiInsights.deep?.health, aiInsights.deep?.training, aiInsights.deep?.grooming].filter(Boolean).map((d: any, i: number) => (
                    <div key={i}>
                      <p className="font-bold text-[14px] text-[#111827]">{d.title}</p>
                      <p className="text-[13px] text-[#6B7280] leading-relaxed mt-1">{d.text}</p>
                    </div>
                  ))}
                </div>
              )
            ) : (
              <div className="flex gap-2.5">
                {["NUTRITION", "ENERGY", "WELLNESS"].map((label, i) => (
                  <div key={i} className="flex-1 rounded-2xl py-3 px-2 text-center bg-[#F3F4F6]">
                    <p className="text-[8px] font-bold text-[#9CA3AF] uppercase tracking-widest">{label}</p>
                    <p className="text-[12px] font-bold mt-1 text-[#D1D5DB]">—</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── 4) Highlights ── */}
      {highlightPairs.length > 0 && (
        <div className="px-5 py-4 border-t border-[#F3F4F6]">
          <button onClick={() => toggleSection("highlights")} className="flex items-center justify-between w-full">
            <h3 className="text-[16px] font-bold text-[#111827]">Highlights</h3>
            {expandedSections.highlights ? <ChevronUp className="w-5 h-5 text-[#9CA3AF]" /> : <ChevronDown className="w-5 h-5 text-[#9CA3AF]" />}
          </button>
          {expandedSections.highlights && (
            <div className="mt-3 space-y-3">
              {highlightPairs.map((pair, i) => (
                <div key={i} className="flex">
                  <span className="text-[13px] text-[#9CA3AF] w-28 flex-shrink-0">{pair.label}</span>
                  <span className="text-[13px] text-[#374151] font-medium">{pair.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── 5) Description ── */}
      {product.description && (
        <div className="px-5 py-4 border-t border-[#F3F4F6]">
          <button onClick={() => toggleSection("description")} className="flex items-center justify-between w-full">
            <h3 className="text-[16px] font-bold text-[#111827]">Description</h3>
            {expandedSections.description ? <ChevronUp className="w-5 h-5 text-[#9CA3AF]" /> : <ChevronDown className="w-5 h-5 text-[#9CA3AF]" />}
          </button>
          {expandedSections.description && (
          <div className="mt-3" style={{
            padding: 16,
            background: "#FFFFFF",
            borderRadius: 14,
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
          }}>
            {product.description.split(/\n/).map((line, li) => {
              const trimmed = line.trim();
              if (!trimmed) return <div key={li} style={{ height: 14 }} />;
              const isHeading = /^[A-Z\s\d&/,.-]{4,}$/.test(trimmed) || /:\s*$/.test(trimmed);
              const bulletMatch = trimmed.match(/^([•\-\*])\s*(.*)/);
              if (bulletMatch) {
                return (
                  <div key={li} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                    <span style={{ color: "#6B7280", fontSize: 14, lineHeight: 1.6 }}>•</span>
                    <span style={{ fontSize: 14, lineHeight: 1.6, color: "#2C2C2C" }}>{bulletMatch[2]}</span>
                  </div>
                );
              }
              return (
                <p key={li} style={{
                  fontSize: 14,
                  lineHeight: 1.6,
                  color: "#2C2C2C",
                  fontWeight: isHeading ? 600 : 400,
                  marginBottom: 12,
                  textAlign: "left",
                }}>{trimmed}</p>
              );
            })}
          </div>
          )}
        </div>
      )}

      {/* ── 6) Ingredients ── */}
      {ingredientsList.length > 0 && (
        <div className="px-5 py-4 border-t border-[#F3F4F6]">
          <button onClick={() => toggleSection("ingredients")} className="flex items-center justify-between w-full">
            <h3 className="text-[16px] font-bold text-[#111827]">Ingredients</h3>
            {expandedSections.ingredients ? <ChevronUp className="w-5 h-5 text-[#9CA3AF]" /> : <ChevronDown className="w-5 h-5 text-[#9CA3AF]" />}
          </button>
          {expandedSections.ingredients && (
            <div className="mt-3 space-y-2.5">
              {ingredientsList.map((ing, i) => {
                const icons = ["🍗", "🌾", "🐟", "🥚", "🥕", "🫘"];
                return (
                  <div key={i} className="flex items-center gap-2.5">
                    <span className="text-[14px]">{icons[i % icons.length]}</span>
                    <span className="text-[13px] text-[#374151]">{ing}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── 7) Feeding Guide ── */}
      {feedingGuide.length > 0 && (
        <div className="px-5 py-4 border-t border-[#F3F4F6]">
          <button onClick={() => toggleSection("feeding")} className="flex items-center justify-between w-full">
            <h3 className="text-[16px] font-bold text-[#111827]">How to Make (Feeding Guide)</h3>
            {expandedSections.feeding ? <ChevronUp className="w-5 h-5 text-[#9CA3AF]" /> : <ChevronDown className="w-5 h-5 text-[#9CA3AF]" />}
          </button>
          {expandedSections.feeding && (
            <div className="mt-3">
              <div className="flex justify-between text-[12px] font-semibold text-[#9CA3AF] mb-2">
                <span>Puppy Weight</span><span>Daily Serving</span>
              </div>
              {feedingGuide.map((row: any, i: number) => (
                <div key={i} className="flex justify-between text-[13px] text-[#374151] py-2.5 border-t border-[#F3F4F6]">
                  <span>{row.weight}</span><span>{row.serving}</span>
                </div>
              ))}
              <p className="text-[11px] text-[#9CA3AF] mt-2 italic">*Adjust servings based on activity level and age</p>
            </div>
          )}
        </div>
      )}

      {/* ── 8) Trust Badges ── */}
      <div className="px-5 py-4 border-t border-[#F3F4F6] space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#ECFDF5] flex items-center justify-center">
            <Shield className="w-4 h-4 text-[#10B981]" />
          </div>
          <div>
            <p className="text-[14px] font-semibold text-[#111827]">Health Guaranteed</p>
            <p className="text-[12px] text-[#9CA3AF]">100% natural ingredients only</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#F5F3FF] flex items-center justify-center">
            <Truck className="w-4 h-4 text-[#A855F7]" />
          </div>
          <div>
            <p className="text-[14px] font-semibold text-[#111827]">{product.shipping_free ? "Free Express Delivery" : "Express Delivery"}</p>
            <p className="text-[12px] text-[#9CA3AF]">Ships within 24 hours</p>
          </div>
        </div>
      </div>

      {/* ── 9) Pet Compatibility ── */}
      <div className="px-5 py-4 border-t border-[#F3F4F6]">
        <div className="rounded-2xl border border-[#E5E7EB] p-4 flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-[#F5F3FF] flex items-center justify-center text-xl">
            {product.pet_type === "dog" ? "🐕" : product.pet_type === "cat" ? "🐱" : product.pet_type === "bird" ? "🐦" : product.pet_type === "fish" ? "🐠" : "🐾"}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <p className="text-[14px] font-bold text-[#111827]">Pet Compatibility</p>
              <span className="text-[12px] font-bold text-[#9333EA] bg-[#F5F3FF] px-2.5 py-1 rounded-full">99% Match</span>
            </div>
            <p className="text-[12px] text-[#9CA3AF] mt-0.5">Perfect for your pet's current growth stage and energy level.</p>
          </div>
        </div>
      </div>

      {/* ── 10) Similar Products ── */}
      {similarProducts.length > 0 && (
        <div className="px-5 py-4 border-t border-[#F3F4F6]">
          <h3 className="text-[16px] font-bold text-[#111827] mb-3">Similar Products</h3>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {similarProducts.map((sp) => (
              <div key={sp.id} onClick={() => { navigate(`/product/${sp.id}`); window.scrollTo(0, 0); }}
                className="flex-shrink-0 w-[160px] rounded-2xl border border-[#E5E7EB] overflow-hidden bg-white cursor-pointer">
                <div className="relative bg-[#F9FAFB] aspect-square flex items-center justify-center p-3">
                  {sp.images?.[0] ? <img src={sp.images[0]} className="max-w-full max-h-full object-contain" loading="lazy" /> : <div className="text-3xl">📦</div>}
                  <button className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/80 flex items-center justify-center shadow-sm"
                    onClick={(e) => { e.stopPropagation(); addToCart({ id: sp.id, name: sp.name, price: sp.price, image: sp.images?.[0] || "" }); toast.success("Added!"); }}>
                    <Plus className="w-3.5 h-3.5 text-[#6B7280]" />
                  </button>
                </div>
                <div className="p-2.5">
                  {sp.handling_time && <p className="text-[10px] text-[#9CA3AF] mb-0.5">{sp.handling_time}</p>}
                  <p className="text-[12px] font-medium text-[#111827] line-clamp-2 leading-tight">{sp.name}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span className="text-[11px] font-semibold text-[#111827]">4.7</span>
                    <span className="text-[10px] text-[#9CA3AF]">(1.7k)</span>
                  </div>
                  {sp.discount > 0 && <p className="text-[10px] font-semibold text-[#9333EA] mt-0.5">{sp.discount}% OFF</p>}
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-[14px] font-bold text-[#111827]">₹{sp.price}</span>
                    {sp.original_price && sp.original_price > sp.price && <span className="text-[11px] text-[#9CA3AF] line-through">₹{sp.original_price}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 11) Brand Strip ── */}
      <div className="px-5 py-4 border-t border-[#F3F4F6] cursor-pointer active:bg-[#F9FAFB] transition-colors"
        onClick={() => navigate(`/brand/${encodeURIComponent(product.brand)}`)}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#F5F3FF] flex items-center justify-center">
            <span className="text-[#9333EA] font-bold text-[14px]">{product.brand?.charAt(0)}</span>
          </div>
          <div className="flex-1">
            <p className="text-[14px] font-semibold text-[#111827]">{product.brand}</p>
            <p className="text-[12px] text-[#9CA3AF]">Explore all products</p>
          </div>
          <ChevronRight className="w-5 h-5 text-[#9CA3AF]" />
        </div>
      </div>

      {/* ── Floating Cart Bar with Animation Phases ── */}
      {cartPhase !== 'hidden' && (
        <div
          className="fixed left-0 right-0 z-50 flex justify-center pointer-events-none"
          style={{ bottom: "calc(56px + 54px + 29px)" }}
        >
          {/* Mini cart phase */}
          {cartPhase === 'mini' && (
            <div
              ref={cartPhase === 'mini' ? cartTargetRef : undefined}
              className="pointer-events-auto"
              style={{
                width: 64,
                height: 64,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                animation: `miniCartPopBounce ${MINI_POP_MS + MINI_BOUNCE_MS}ms ease-out forwards`,
                transformOrigin: "center",
              }}
            >
              <img
                src={miniCartImage}
                alt="Mini cart"
                className="w-full h-full object-contain select-none pointer-events-none"
                loading="eager"
                fetchPriority="high"
                draggable={false}
              />
            </div>
          )}

          {/* Expanding phase */}
          {cartPhase === 'expanding' && (
            <div className="pointer-events-auto mx-3" style={{
              width: "92%", maxWidth: 500, height: 64, borderRadius: 22,
              background: BUY_NOW_GRADIENT,
              boxShadow: "0 6px 24px rgba(139,92,246,0.35)",
              animation: "expandCart 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards",
              opacity: 0,
            }} />
          )}

          {/* Full floating cart bar */}
          {cartPhase === 'full' && (
            <div
              className="pointer-events-auto mx-3 cursor-pointer"
              onClick={() => navigate("/cart")}
              style={{
                width: "92%", maxWidth: 500, height: 64, borderRadius: 22,
                background: BUY_NOW_GRADIENT,
                boxShadow: "0 6px 24px rgba(139,92,246,0.35)",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "0 16px",
                animation: "fadeIn 0.2s ease-out",
              }}
            >
              <div className="flex flex-col flex-1 mr-2">
                <p className="text-white text-[12px] font-bold leading-tight">
                  {deliveryUnlocked ? (
                    <span className="text-[#A5F3AB]">🎉 FREE DELIVERY UNLOCKED</span>
                  ) : (
                    <>Add ₹{Math.max(0, FREE_DELIVERY_THRESHOLD - cartTotal)} more to unlock <span className="uppercase">FREE DELIVERY</span></>
                  )}
                </p>
                <div className="h-[7px] rounded-full mt-1.5 overflow-hidden relative" style={{ background: "rgba(255,255,255,0.25)", width: "100%" }}>
                  <div
                    className="h-full rounded-full relative overflow-hidden"
                    style={{
                      width: `${deliveryProgress}%`,
                      background: "rgba(255,255,255,0.95)",
                      transition: "width 700ms ease-out",
                      boxShadow: deliveryProgress > 0 ? "0 0 8px rgba(255,255,255,0.8), 0 0 16px rgba(255,255,255,0.4)" : "none",
                    }}
                  >
                    {deliveryProgress > 0 && (
                      <span
                        className="absolute inset-0"
                        style={{
                          background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,1) 50%, transparent 100%)",
                          backgroundSize: "200% 100%",
                          animation: "cart-shimmer 2s ease-in-out infinite",
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0 pl-1">
                <div className="flex flex-col items-end mr-0.5">
                  <span className="text-white text-[13px] font-extrabold leading-tight">CART</span>
                  <span className="text-white/90 text-[10px] font-semibold leading-tight">{cartCount} {cartCount === 1 ? "ITEM" : "ITEMS"}</span>
                </div>
                {/* Stacked vertical rectangle cards — right to left stack, max 3 */}
                <div className="relative" ref={cartTargetRef} style={{ width: 50, height: 44 }}>
                  {(() => {
                    const stackedItems = cartItems
                      .flatMap((item) => Array.from({ length: item.quantity }, () => item))
                      .slice(-3);
                    const total = stackedItems.length;
                    return stackedItems.map((item, idx) => (
                      <div
                        key={`${item.id}-${idx}-${thumbnailPop}`}
                        className="absolute top-0 overflow-hidden flex items-center justify-center"
                        style={{
                          width: 28,
                          height: 38,
                          borderRadius: 6,
                          right: idx * 7,
                          zIndex: idx + 1,
                          border: "1.5px solid rgba(255,255,255,0.5)",
                          boxShadow: "0 1px 4px rgba(0,0,0,0.25)",
                          animation: idx === total - 1 && thumbnailPop ? "thumbnailPop 500ms ease-out" : "none",
                        }}
                      >
                        {item.image ? (
                          <img src={item.image} alt="" className="w-full h-full object-cover" style={{ borderRadius: 5 }} />
                        ) : (
                          <ShoppingCart className="w-4 h-4 text-white" />
                        )}
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* Collapsing phase */}
          {cartPhase === 'collapsing' && (
            <div className="pointer-events-auto" style={{
              width: 64, height: 64,
              display: "flex", alignItems: "center", justifyContent: "center",
              animation: "collapseCart 0.4s ease-in forwards",
            }}>
              <img
                src={miniCartImage}
                alt="Mini cart"
                className="w-full h-full object-contain select-none pointer-events-none"
                loading="eager"
                fetchPriority="high"
                draggable={false}
              />
            </div>
          )}
        </div>
      )}

      {/* ── 12) Sticky Bottom Bar ── */}
      <div className="fixed bottom-14 left-0 right-0 z-50 bg-white border-t border-[#E5E7EB] px-5 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] md:bottom-0">
        <div className="flex gap-3 max-w-lg mx-auto">
          {/* Add to Cart / Quantity Counter */}
          {productQty === 0 ? (
            <button onClick={handleAddToCart}
              className="flex-1 h-[48px] rounded-2xl border-2 border-[#A855F7] text-[#A855F7] font-bold text-[14px] flex items-center justify-center"
              style={{ transition: `all ${STEPPER_MORPH_MS}ms ease` }}>
              Add to Cart
            </button>
          ) : (
            <div className="flex-1 h-[48px] rounded-2xl flex items-center justify-between overflow-hidden"
              style={{
                background: "linear-gradient(90deg, #A855F7, #7C3AED)",
                animation: `morphButton ${STEPPER_MORPH_MS}ms ease-out`,
                transform: "scale(1)",
              }}>
              <button onClick={handleRemoveFromCart}
                className="h-full px-4 flex items-center justify-center">
                <Minus className="w-5 h-5 text-white" />
              </button>
              <span className="text-white font-bold text-[16px]">{productQty}</span>
              <button onClick={handleAddToCart}
                className="h-full px-4 flex items-center justify-center">
                <Plus className="w-5 h-5 text-white" />
              </button>
            </div>
          )}
          <button onClick={handleBuyNow}
            className="flex-1 h-[48px] rounded-2xl text-white font-bold text-[14px] flex items-center justify-center"
            style={{ background: BUY_NOW_GRADIENT }}>
            Buy Now
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes miniCartPopBounce {
          0% { transform: scale(0.5) translateY(25px); opacity: 0; }
          64.1% { transform: scale(1) translateY(0); opacity: 1; }
          82% { transform: scale(1) translateY(-5px); opacity: 1; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes expandCart {
          from { opacity: 0; transform: scaleX(0.15) scaleY(0.85); border-radius: 28px; }
          to { opacity: 1; transform: scaleX(1) scaleY(1); border-radius: 22px; }
        }
        @keyframes collapseCart {
          0% { width: 92%; border-radius: 22px; opacity: 1; transform: translateY(0); }
          50% { width: 56px; border-radius: 28px; opacity: 0.8; transform: translateY(0); }
          100% { width: 56px; border-radius: 28px; opacity: 0; transform: translateY(16px); }
        }
        @keyframes morphButton {
          from { transform: scale(0.95); }
          to { transform: scale(1); }
        }
      `}</style>

      <BottomNavigation variant="buyer" />
    </div>
  );
};

export default ProductProfile;
