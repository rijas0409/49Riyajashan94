import ShopCarousel from "./ShopCarousel";

interface PetOption {
  id: string;
  name: string;
  image: string;
  gradient: string;
}

const PET_OPTIONS: PetOption[] = [
  { id: "dog", name: "Dog", image: "https://images.unsplash.com/photo-1552053831-71594a27632d?w=400", gradient: "from-pink-400 to-purple-400" },
  { id: "cat", name: "Cat", image: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400", gradient: "from-purple-400 to-pink-400" },
  { id: "birds", name: "Birds", image: "https://images.unsplash.com/photo-1452570053594-1b985d6ea890?w=400", gradient: "from-teal-400 to-emerald-400" },
  { id: "fish", name: "Fish", image: "https://images.unsplash.com/photo-1524704654690-b56c05c78a00?w=400", gradient: "from-rose-400 to-pink-400" },
  { id: "rabbit", name: "Rabbit", image: "https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=400", gradient: "from-violet-400 to-purple-400" },
  { id: "guinea-pig", name: "Guinea Pig", image: "https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=400", gradient: "from-emerald-400 to-teal-400" },
  { id: "turtle", name: "Turtle", image: "https://images.unsplash.com/photo-1437622368342-7a3d73a34c8f?w=400", gradient: "from-cyan-400 to-teal-400" },
  { id: "hamster", name: "Hamster", image: "https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=400", gradient: "from-pink-400 to-rose-400" },
  { id: "white-mouse", name: "Mouse", image: "https://images.unsplash.com/photo-1548802673-380ab8ebc7b7?w=400", gradient: "from-purple-400 to-violet-400" },
];

interface PetSelectionScreenProps {
  onSelectPet: (petId: string) => void;
}

const PetSelectionScreen = ({ onSelectPet }: PetSelectionScreenProps) => {
  return (
    <div className="min-h-screen bg-background">
      {/* Carousel Banner */}
      <ShopCarousel />
      
      {/* Heading */}
      <h1 className="text-xl font-bold text-center text-foreground px-4 mb-6">
        Who are you shopping for?
      </h1>
      
      {/* Pet Selection Grid */}
      <div className="grid grid-cols-3 gap-3 px-4 max-w-md mx-auto pb-6">
        {PET_OPTIONS.map((pet) => (
          <button
            key={pet.id}
            onClick={() => onSelectPet(pet.id)}
            className="group flex flex-col items-center"
          >
            <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-muted shadow-md hover:shadow-lg transition-all duration-300 group-hover:scale-[1.02]">
              <img
                src={pet.image}
                alt={pet.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className={`mt-2 px-4 py-1.5 rounded-full bg-gradient-to-r ${pet.gradient} text-white text-sm font-medium shadow-sm flex items-center gap-1.5`}>
              <span className="text-xs">🐾</span>
              {pet.name}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default PetSelectionScreen;
