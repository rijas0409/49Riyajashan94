// Pet-specific categories
export const PET_CATEGORIES: Record<string, { id: string; name: string; icon: string }[]> = {
  dog: [
    { id: "food", name: "Food", icon: "🍖" },
    { id: "treats", name: "Treats", icon: "🦴" },
    { id: "pharmacy", name: "Pharmacy", icon: "💊" },
    { id: "toys", name: "Toys", icon: "🎾" },
    { id: "prescription-diet", name: "Prescription Diet", icon: "🥗" },
    { id: "clothing", name: "Clothing & Fashion", icon: "👕" },
    { id: "grooming", name: "Grooming Supplies", icon: "✂️" },
    { id: "walking", name: "Walking & Travel Gear", icon: "🦮" },
    { id: "bedding", name: "Comfort & Bedding", icon: "🛏️" },
  ],
  cat: [
    { id: "food", name: "Food", icon: "🐟" },
    { id: "treats", name: "Treats", icon: "🍬" },
    { id: "pharmacy", name: "Pharmacy", icon: "💊" },
    { id: "toys", name: "Toys", icon: "🧶" },
    { id: "prescription-diet", name: "Prescription Diet", icon: "🥗" },
    { id: "clothing", name: "Clothing & Fashion", icon: "👕" },
    { id: "grooming", name: "Grooming Supplies", icon: "✂️" },
    { id: "walking", name: "Walking & Travel Gear", icon: "🐱" },
    { id: "bedding", name: "Comfort & Bedding", icon: "🛏️" },
  ],
  birds: [
    { id: "food", name: "Food", icon: "🌾" },
    { id: "treats", name: "Treats & Millets", icon: "🌰" },
    { id: "health", name: "Health & Wellness", icon: "💊" },
    { id: "toys", name: "Interactive Toys", icon: "🪶" },
    { id: "cages", name: "Cages & Stands", icon: "🏠" },
    { id: "perches", name: "Perches & Bowls", icon: "🪵" },
    { id: "hygiene", name: "Hygiene & Care", icon: "🧴" },
    { id: "travel", name: "Travel & Carriers", icon: "🧳" },
    { id: "nesting", name: "Nesting & Breeding", icon: "🪺" },
  ],
  fish: [
    { id: "food", name: "Food", icon: "🐠" },
    { id: "aquariums", name: "Aquariums", icon: "🐡" },
    { id: "pharmacy", name: "Pharmacy", icon: "💊" },
    { id: "essentials", name: "Essentials", icon: "🧪" },
    { id: "decor", name: "Decor & Plants", icon: "🌿" },
    { id: "lighting", name: "Lighting", icon: "💡" },
    { id: "cleaning", name: "Cleaning Tools", icon: "🧽" },
    { id: "accessories", name: "Tank Accessories", icon: "⚙️" },
    { id: "water-care", name: "Water Testing & Care", icon: "💧" },
  ],
  rabbit: [
    { id: "hay", name: "Hay & Grass", icon: "🌾" },
    { id: "food", name: "Food & Treats", icon: "🥕" },
    { id: "pharmacy", name: "Health & Pharmacy", icon: "💊" },
    { id: "toys", name: "Chew Toys", icon: "🧸" },
    { id: "litter", name: "Litter & Hygiene", icon: "🧹" },
    { id: "hutches", name: "Hutches & Playpens", icon: "🏠" },
    { id: "grooming", name: "Grooming & Care", icon: "✂️" },
    { id: "feeders", name: "Feeders & Bowls", icon: "🥣" },
    { id: "bedding", name: "Bedding & Hideouts", icon: "🛏️" },
  ],
  "guinea-pig": [
    { id: "hay", name: "Hay & Forage", icon: "🌾" },
    { id: "food", name: "Food & Treats", icon: "🥬" },
    { id: "pharmacy", name: "Pharmacy", icon: "💊" },
    { id: "bedding", name: "Bedding & Liners", icon: "🛏️" },
    { id: "hideouts", name: "Hideouts & Tunnels", icon: "🏠" },
    { id: "cages", name: "C&C Cages & Pens", icon: "🏡" },
    { id: "toys", name: "Chew Toys", icon: "🧸" },
    { id: "feeders", name: "Feeding Accessories", icon: "🥣" },
    { id: "grooming", name: "Grooming & Hygiene", icon: "✂️" },
  ],
  turtle: [
    { id: "food", name: "Food & Nutrition", icon: "🐢" },
    { id: "pharmacy", name: "Pharmacy & Water Care", icon: "💊" },
    { id: "filtration", name: "Filtration Systems", icon: "🔄" },
    { id: "basking", name: "Basking Platforms & Docks", icon: "☀️" },
    { id: "lighting", name: "Lighting", icon: "💡" },
    { id: "heating", name: "Water Heating & Thermometers", icon: "🌡️" },
    { id: "tanks", name: "Tanks & Habitats", icon: "🏠" },
    { id: "decor", name: "Tank Decor & Gravel", icon: "🪨" },
    { id: "cleaning", name: "Cleaning & Maintenance", icon: "🧽" },
  ],
  hamster: [
    { id: "food", name: "Seeds & Nutrition", icon: "🌻" },
    { id: "treats", name: "Treats & Snacks", icon: "🍬" },
    { id: "pharmacy", name: "Pharmacy & Vitamins", icon: "💊" },
    { id: "bedding", name: "Bedding & Substrate", icon: "🛏️" },
    { id: "wheels", name: "Wheels & Exercise", icon: "🎡" },
    { id: "heating", name: "Water Heating & Thermometers", icon: "🌡️" },
    { id: "tanks", name: "Tanks & Habitats", icon: "🏠" },
    { id: "decor", name: "Tank Decor & Gravel", icon: "🪨" },
    { id: "cleaning", name: "Cleaning & Maintenance", icon: "🧽" },
  ],
  "white-mouse": [
    { id: "food", name: "Seeds & Nutrition", icon: "🌻" },
    { id: "treats", name: "Treats & Snacks", icon: "🧀" },
    { id: "pharmacy", name: "Pharmacy & Vitamins", icon: "💊" },
    { id: "bedding", name: "Bedding & Substrate", icon: "🛏️" },
    { id: "wheels", name: "Wheels & Exercise", icon: "🎡" },
    { id: "hideouts", name: "Hideouts & Tunnels", icon: "🏠" },
    { id: "cages", name: "Cages & Habitats", icon: "🏡" },
    { id: "feeders", name: "Feeders & Bottles", icon: "🍼" },
    { id: "cleaning", name: "Cleaning & Hygiene", icon: "🧽" },
  ],
};

export const PET_NAMES: Record<string, string> = {
  dog: "Dog",
  cat: "Cat",
  birds: "Bird",
  fish: "Fish",
  rabbit: "Rabbit",
  "guinea-pig": "Guinea Pig",
  turtle: "Turtle",
  hamster: "Hamster",
  "white-mouse": "Mouse",
};

// Simple seeded random for stable product generation
function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// Generate mock products for a given pet type and category
export const generateProducts = (petType: string, category: string) => {
  const brands = ["PetLife", "Royal Canin", "Pedigree", "Whiskas", "Drools", "Farmina", "Orijen", "Acana", "Hills", "Purina"];
  const products = [];
  
  const categoryNames: Record<string, string[]> = {
    food: ["Premium Food", "Natural Diet", "Organic Mix", "Daily Nutrition", "Complete Meal", "Health Plus"],
    treats: ["Yummy Treats", "Training Bites", "Crunchy Snacks", "Soft Chews", "Reward Sticks"],
    pharmacy: ["Multivitamins", "Skin Care", "Joint Support", "Digestive Aid", "Immune Booster"],
    toys: ["Squeaky Toy", "Chew Ball", "Interactive Puzzle", "Rope Toy", "Plush Friend"],
    default: ["Premium Item", "Essential Pack", "Starter Kit", "Pro Bundle", "Value Set"],
  };

  const names = categoryNames[category] || categoryNames.default;
  
  // Create a seed from petType and category strings
  let baseSeed = 0;
  for (let c = 0; c < petType.length; c++) baseSeed += petType.charCodeAt(c);
  for (let c = 0; c < category.length; c++) baseSeed += category.charCodeAt(c) * 7;

  for (let i = 0; i < 12; i++) {
    const seed = baseSeed * 100 + i;
    const originalPrice = Math.floor(seededRandom(seed) * 2000) + 200;
    const discount = Math.floor(seededRandom(seed + 1) * 40) + 5;
    const price = Math.floor(originalPrice * (1 - discount / 100));
    const isSponsored = seededRandom(seed + 2) > 0.8;
    
    products.push({
      id: `${petType}-${category}-${i}`,
      name: `${brands[i % brands.length]} ${names[i % names.length]}`,
      brand: brands[i % brands.length],
      price,
      originalPrice,
      discount,
      image: `https://images.unsplash.com/photo-${1560807707 + i * 10}-2aa5df59d8?w=400`,
      isSponsored,
      deliveryTime: Math.floor(seededRandom(seed + 3) * 30) + 15,
      petType,
      category,
    });
  }
  
  return products;
};

export const SORT_OPTIONS = [
  { id: "relevance", name: "Relevance" },
  { id: "price-low", name: "Price (Low to High)" },
  { id: "price-high", name: "Price (High to Low)" },
  { id: "discount", name: "Discount (High to Low)" },
];

export const BRAND_OPTIONS = [
  "All Brands",
  "PetLife",
  "Royal Canin",
  "Pedigree",
  "Whiskas",
  "Drools",
  "Farmina",
  "Orijen",
  "Acana",
  "Hills",
  "Purina",
];

export const QUICK_FILTERS = [
  { id: "price-drop", name: "Price Drop", icon: "📉" },
  { id: "best-seller", name: "Best Seller", icon: "⭐" },
  { id: "trending", name: "Trending", icon: "🔥" },
];
