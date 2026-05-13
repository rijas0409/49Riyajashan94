import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import BottomNavigation from "@/components/BottomNavigation";
import ShopHomeScreen from "@/components/shop/ShopHomeScreen";
import PetShopScreen from "@/components/shop/PetShopScreen";
import ProductListingScreen from "@/components/shop/ProductListingScreen";
import { useCart } from "@/contexts/CartContext";
import shopDogsImg from "@/assets/shop-dogs.png";
import shopCatsImg from "@/assets/shop-cats.png";
import shopBirdsImg from "@/assets/shop-birds.png";
import shopFishImg from "@/assets/shop-fish.png";
import shopRabbitsImg from "@/assets/shop-rabbits.png";
import shopMouseImg from "@/assets/shop-mouse.png";
import shopHamstersImg from "@/assets/shop-hamsters.png";
import shopGuineapigsImg from "@/assets/shop-guineapigs.png";
import shopTurtleImg from "@/assets/shop-turtle.png";

const PET_SHOP_BANNERS: Record<string, string> = {
  dog: "/Dogs.png",
  cat: "/Cats.png",
  birds: "/Birds.png",
  fish: "/Fish.png",
  rabbit: "/Rabbits.png",
  "white-mouse": "/Mouse.png",
  hamster: "/Hamsters.png",
  "guinea-pig": "/Guineapigs.png",
  turtle: "/Turtle.png",
};

const Shop = () => {
  const navigate = useNavigate();
  const { petShopType } = useParams();
  const location = useLocation();
  const [selectedBreed, setSelectedBreed] = useState<string>("");
  const [initialSearchQuery, setInitialSearchQuery] = useState<string>("");
  const [initialCategory, setInitialCategory] = useState<string>("");
  const { addToCart: handleAddToCart } = useCart();

  // Determine current screen based on URL
  const isCatalog = location.pathname.endsWith("/catalog");
  const urlPetType = petShopType ? petShopType.replace("shop", "") : "";
  const petType = urlPetType === "mouse" ? "white-mouse" : urlPetType;
  
  let currentScreen: "home" | "pet-shop" | "product-listing" = "home";
  if (petShopType) {
    currentScreen = isCatalog ? "product-listing" : "pet-shop";
  }

  useEffect(() => {
    Object.values(PET_SHOP_BANNERS).forEach((src) => {
      const image = new Image();
      image.src = src;
      image.decoding = "async";
    });
  }, []);

  const handleSelectPet = (petId: string) => {
    const selectedBanner = PET_SHOP_BANNERS[petId];
    if (selectedBanner) {
      const image = new Image();
      image.src = selectedBanner;
      image.decoding = "sync";
    }

    const urlPetId = petId === "white-mouse" ? "mouse" : petId;
    navigate(`/buyer/shop/${urlPetId}shop`);
  };

  const handleBackFromPetShop = () => {
    navigate("/buyer/shop");
  };

  const handleViewAllProducts = (breed?: string) => {
    setSelectedBreed(breed || "");
    setInitialSearchQuery("");
    setInitialCategory("");
    navigate(`/buyer/shop/${petShopType}/catalog`);
  };

  const handleViewAllProductsWithCategory = (category: string) => {
    setSelectedBreed("");
    setInitialSearchQuery("");
    setInitialCategory(category);
    navigate(`/buyer/shop/${petShopType}/catalog`);
  };

  const handleSearchFromShop = (query: string, petTypeParam?: string) => {
    // If we're on home, we might need to navigate to a specific pet's catalog
    const targetPetType = petTypeParam || petType || "dog";
    const urlPetId = targetPetType === "white-mouse" ? "mouse" : targetPetType;
    setInitialSearchQuery(query);
    setSelectedBreed("");
    setInitialCategory("");
    navigate(`/buyer/shop/${urlPetId}shop/catalog`);
  };

  const handleBackFromProducts = () => {
    setSelectedBreed("");
    setInitialSearchQuery("");
    setInitialCategory("");
    navigate(`/buyer/shop/${petShopType}`);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {currentScreen === "home" && (
        <ShopHomeScreen
          onSelectPet={handleSelectPet}
          onAddToCart={handleAddToCart}
          onSearch={(query) => handleSearchFromShop(query, "dog")}
        />
      )}

      {currentScreen === "pet-shop" && (
        <PetShopScreen
          petType={petType}
          onBack={handleBackFromPetShop}
          onViewAllProducts={handleViewAllProducts}
          onViewAllProductsWithCategory={handleViewAllProductsWithCategory}
          onAddToCart={handleAddToCart}
          onSearch={(query) => handleSearchFromShop(query, petType)}
        />
      )}

      {currentScreen === "product-listing" && (
        <ProductListingScreen
          petType={petType}
          initialBreed={selectedBreed}
          initialSearch={initialSearchQuery}
          initialCategory={initialCategory}
          onBack={handleBackFromProducts}
          onAddToCart={handleAddToCart}
        />
      )}

      <BottomNavigation />
    </div>
  );
};

export default Shop;
