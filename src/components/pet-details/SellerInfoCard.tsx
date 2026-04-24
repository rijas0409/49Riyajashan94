import { Star } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SellerInfoCardProps {
  seller: {
    id: string;
    name: string;
    profile_photo: string | null;
    rating: number;
    is_breeder_verified: boolean;
  } | null;
}

const SellerInfoCard = ({ seller }: SellerInfoCardProps) => {
  const navigate = useNavigate();
  if (!seller) return null;

  const rating = seller.rating > 0 ? seller.rating : 4.8;

  return (
    <div className="px-5 py-4">
      <h3 className="font-bold text-[17px] text-[#151B32] mb-3">Breeder Information</h3>
      <div className="flex items-center justify-between cursor-pointer active:bg-[#F9FAFB] rounded-xl -mx-2 px-2 py-1 transition-colors" onClick={() => navigate(`/seller/${seller.id}`)}>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-[#C4B5FD] flex items-center justify-center overflow-hidden">
            {seller.profile_photo ? (
              <img src={seller.profile_photo} alt={seller.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-base font-bold text-white">{seller.name?.[0]?.toUpperCase() || "S"}</span>
            )}
          </div>
          <div>
            <p className="font-bold text-[14px] text-[#151B32]">{seller.name}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className="text-[11px] text-[#888]">{rating.toFixed(1)} Seller Rating</span>
            </div>
          </div>
        </div>
        <button className="px-4 py-1.5 rounded-full border border-[#D8B4FE] text-[#A855F7] text-[12px] font-bold">
          View Profile
        </button>
      </div>
    </div>
  );
};

export default SellerInfoCard;
