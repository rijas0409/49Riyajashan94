import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, MapPin, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useWishlist } from "@/hooks/useWishlist";

interface PetCardProps {
  pet: any;
}

const PetCard = ({ pet }: PetCardProps) => {
  const navigate = useNavigate();
  const { togglePetWishlist, isPetInWishlist } = useWishlist();

  const isFavorite = isPetInWishlist(pet.id);

  const handleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await togglePetWishlist(pet.id);
  };

  const handleView = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/pet/${pet.id}`);
  };

  const handleCardClick = () => {
    navigate(`/pet/${pet.id}`);
  };

  return (
    <Card 
      className="group overflow-hidden border-0 shadow-card hover:shadow-float transition-all duration-300 cursor-pointer animate-fade-in rounded-3xl"
      onClick={handleCardClick}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={pet.images?.[0] || "/placeholder.svg"}
          alt={pet.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <Button
          variant="ghost"
          size="icon"
          className={`absolute top-3 right-3 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white ${
            isFavorite ? "text-destructive" : "text-foreground"
          }`}
          onClick={handleFavorite}
        >
          <Heart className="w-5 h-5" fill={isFavorite ? "currentColor" : "none"} />
        </Button>
        {pet.verification_status === "verified" && (
          <Badge className="absolute top-3 left-3 bg-success text-white border-0 rounded-full">
            <ShieldCheck className="w-3 h-3 mr-1" />
            Verified
          </Badge>
        )}
        {pet.is_featured && (
          <Badge className="absolute bottom-3 left-3 bg-gradient-primary text-white border-0 rounded-full">
            Featured
          </Badge>
        )}
        {pet.priority_verification && (
          <Badge className="absolute bottom-3 right-3 bg-amber-500 text-white border-0 rounded-full">
            Priority
          </Badge>
        )}
      </div>

      <CardContent className="p-4 space-y-3">
        <div className="space-y-1">
          <div className="flex items-start justify-between">
            <h3 className="font-semibold text-lg line-clamp-1">{pet.breed}</h3>
            <span className="text-lg font-bold text-primary">₹{pet.price.toLocaleString()}</span>
          </div>
          <p className="text-sm text-muted-foreground capitalize">
            {pet.gender} • {Math.floor(pet.age_months / 12)}y {pet.age_months % 12}m
          </p>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="w-4 h-4" />
          <span className="line-clamp-1">{pet.city}, {pet.state}</span>
        </div>

        {pet.profiles && (
          <div className="pt-3 border-t border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-secondary flex items-center justify-center text-xs font-semibold overflow-hidden">
                {pet.profiles.profile_photo ? (
                  <img 
                    src={pet.profiles.profile_photo} 
                    alt={pet.profiles.name} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  pet.profiles.name?.[0]?.toUpperCase() || "S"
                )}
              </div>
              <div>
                <p className="text-sm font-medium">{pet.profiles.name}</p>
                {pet.profiles.rating > 0 && (
                  <p className="text-xs text-muted-foreground">⭐ {pet.profiles.rating.toFixed(1)}</p>
                )}
              </div>
            </div>
            <Button size="sm" className="rounded-full" onClick={handleView}>
              View
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PetCard;
