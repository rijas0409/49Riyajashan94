import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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

type ShopScreen = "home" | "pet-shop" | "product-listing";

const PET_SHOP_BANNERS: Record<string, string> = {
  dog: shopDogsImg,
  cat: shopCatsImg,
  birds: shopBirdsImg,
  fish: shopFishImg,
  rabbit: shopRabbitsImg,
  "white-mouse": shopMouseImg,
  hamster: shopHamstersImg,
  "guinea-pig": shopGuineapigsImg,
  turtle: shopTurtleImg,
};

const Shop = () => {
  const navigate = useNavigate();
  const [currentScreen, setCurrentScreen] = useState<ShopScreen>("home");
  const [selectedPet, setSelectedPet] = useState<string>("");
  const [selectedBreed, setSelectedBreed] = useState<string>("");
  const [initialSearchQuery, setInitialSearchQuery] = useState<string>("");
  const [initialCategory, setInitialCategory] = useState<string>("");
  const { addToCart: handleAddToCart } = useCart();

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

    setSelectedPet(petId);
    setCurrentScreen("pet-shop");
  };

  const handleBackFromPetShop = () => {
    setCurrentScreen("home");
    setSelectedPet("");
  };

  const handleViewAllProducts = (breed?: string) => {
    setSelectedBreed(breed || "");
    setInitialSearchQuery("");
    setInitialCategory("");
    setCurrentScreen("product-listing");
  };

  const handleViewAllProductsWithCategory = (category: string) => {
    setSelectedBreed("");
    setInitialSearchQuery("");
    setInitialCategory(category);
    setCurrentScreen("product-listing");
  };

  const handleSearchFromShop = (query: string, petType?: string) => {
    if (petType) setSelectedPet(petType);
    setSelectedBreed("");
    setInitialSearchQuery(query);
    setCurrentScreen("product-listing");
  };

  const handleBackFromProducts = () => {
    setSelectedBreed("");
    setInitialSearchQuery("");
    setInitialCategory("");
    setCurrentScreen("pet-shop");
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
          petType={selectedPet}
          onBack={handleBackFromPetShop}
          onViewAllProducts={handleViewAllProducts}
          onViewAllProductsWithCategory={handleViewAllProductsWithCategory}
          onAddToCart={handleAddToCart}
          onSearch={(query) => handleSearchFromShop(query, selectedPet)}
        />
      )}

      {currentScreen === "product-listing" && (
        <ProductListingScreen
          petType={selectedPet}
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
