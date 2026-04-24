import cartPlusIcon from "@/assets/cart-plus-icon.png";

interface BottomCTAProps {
  price: number;
  onBuyNow: () => void;
  onAddToCart?: () => void;
}

const BottomCTA = ({ price, onBuyNow, onAddToCart }: BottomCTAProps) => {
  const emiPrice = Math.round(price / 6);
  const formatPrice = (p: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(p);

  return (
    <div className="fixed bottom-14 left-0 right-0 z-50 bg-white border-t border-[#ECECEC] px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] md:bottom-0">
      <div className="flex items-center gap-3 max-w-lg mx-auto">
        {/* Cart plus icon */}
        <button
          onClick={onAddToCart}
          className="w-[52px] h-[52px] rounded-xl bg-[#F5F5F7] flex items-center justify-center flex-shrink-0 overflow-visible relative active:scale-95 transition-transform"
        >
          <img src={cartPlusIcon} alt="Add to cart" className="w-[109px] h-[109px] object-contain absolute" style={{ imageRendering: 'crisp-edges' }} />
        </button>

        {/* EMI option - same height as Buy Now */}
        <div className="flex-1 h-[52px] rounded-2xl border border-[#ECECEC] bg-white flex flex-col items-center justify-center">
          <p className="text-[12px] font-bold text-[#151B32] leading-tight">Buy with EMI</p>
          <p className="text-[10px] text-[#888] leading-tight">from {formatPrice(emiPrice)}/mo</p>
        </div>

        {/* Buy Now - same height as EMI */}
        <button
          onClick={onBuyNow}
          className="h-[52px] px-6 rounded-2xl text-white font-bold text-[13px] text-center flex-shrink-0"
          style={{ background: "linear-gradient(90deg, #FF4D6D, #8B5CF6)" }}
        >
          Buy Now
        </button>
      </div>
    </div>
  );
};

export default BottomCTA;
