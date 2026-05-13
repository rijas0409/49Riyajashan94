export interface MockBreeder {
  id: string;
  name: string;
  profile_photo: string | null;
  rating: number;
  is_breeder_verified: boolean;
  city: string;
  petCount: number;
  coverImage: string;
}

export interface MockPet {
  id: string;
  name: string;
  breed: string;
  category: string;
  gender: string;
  age_months: number;
  price: number;
  description: string;
  city: string;
  state: string;
  location: string;
  vaccinated: boolean;
  verification_status: string;
  images: string[];
  owner_id: string;
  created_at: string;
  views: number;
  is_featured?: boolean;
}

export const MOCK_BREEDERS: MockBreeder[] = [
  {
    id: "breeder-1",
    name: "Royal Canines Kennel",
    profile_photo: "https://plus.unsplash.com/premium_photo-1683121366070-5ceb7e007a97?w=400",
    rating: 4.9,
    is_breeder_verified: true,
    city: "Mumbai",
    petCount: 15,
    coverImage: "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=800"
  },
  {
    id: "breeder-2",
    name: "Happy Tails Cattery",
    profile_photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400",
    rating: 4.7,
    is_breeder_verified: true,
    city: "Delhi",
    petCount: 8,
    coverImage: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800"
  },
  {
    id: "breeder-3",
    name: "Exotic Avian Hub",
    profile_photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400",
    rating: 4.8,
    is_breeder_verified: true,
    city: "Bangalore",
    petCount: 12,
    coverImage: "https://images.unsplash.com/photo-1452570053594-1b985d6ea890?w=800"
  },
  {
    id: "breeder-4",
    name: "Golden Meadows",
    profile_photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400",
    rating: 4.6,
    is_breeder_verified: true,
    city: "Pune",
    petCount: 5,
    coverImage: "https://images.unsplash.com/photo-1552053831-71594a27632d?w=800"
  }
];

export const MOCK_PETS: MockPet[] = [
  {
    id: "mock-1",
    name: "Buddy",
    breed: "Golden Retriever Puppies",
    category: "dog",
    gender: "Male",
    age_months: 2,
    price: 25000,
    description: "Playful and healthy Golden Retriever puppies. KCI registered.",
    city: "Mumbai",
    state: "MH",
    location: "Bandra, Mumbai",
    vaccinated: true,
    verification_status: "verified",
    images: ["https://images.unsplash.com/photo-1552053831-71594a27632d?w=800"],
    owner_id: "breeder-1",
    created_at: new Date().toISOString(),
    views: 1250,
    is_featured: true,
  },
  {
    id: "mock-2",
    name: "Luna",
    breed: "Triple Coat Persian Cat",
    category: "cat",
    gender: "Female",
    age_months: 4,
    price: 18000,
    description: "Beautiful triple coat Persian kitten. Very social and litter trained.",
    city: "Delhi",
    state: "DL",
    location: "Rohini, Delhi",
    vaccinated: true,
    verification_status: "verified",
    images: ["https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800"],
    owner_id: "breeder-2",
    created_at: new Date().toISOString(),
    views: 980,
    is_featured: true,
  },
  {
    id: "mock-3",
    name: "Rio",
    breed: "Macaw Parrot",
    category: "bird",
    gender: "Male",
    age_months: 6,
    price: 55000,
    description: "Healthy Macaw parrot. Hand-raised and starting to speak.",
    city: "Bangalore",
    state: "KA",
    location: "Indiranagar, Bangalore",
    vaccinated: true,
    verification_status: "verified",
    images: ["https://images.unsplash.com/photo-1452570053594-1b985d6ea890?w=800"],
    owner_id: "breeder-3",
    created_at: new Date().toISOString(),
    views: 750,
    is_featured: false,
  },
  {
    id: "mock-4",
    name: "Max",
    breed: "German Shepherd (Long Coat)",
    category: "dog",
    gender: "Male",
    age_months: 3,
    price: 32000,
    description: "Aggressive yet loyal German Shepherd male puppy. Guard dog potential.",
    city: "Pune",
    state: "MH",
    location: "Kothrud, Pune",
    vaccinated: true,
    verification_status: "verified",
    images: ["https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?w=800"],
    owner_id: "breeder-1",
    created_at: new Date().toISOString(),
    views: 2100,
    is_featured: true,
  },
  {
    id: "mock-5",
    name: "Snowball",
    breed: "Netherland Dwarf Rabbit",
    category: "rabbit",
    gender: "Female",
    age_months: 2,
    price: 8000,
    description: "Tiny and cute Netherland Dwarf rabbit. Perfect for indoors.",
    city: "Chennai",
    state: "TN",
    location: "Adyar, Chennai",
    vaccinated: true,
    verification_status: "verified",
    images: ["https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=800"],
    owner_id: "breeder-2",
    created_at: new Date().toISOString(),
    views: 450,
    is_featured: false,
  },
  {
    id: "mock-6",
    name: "Rover",
    breed: "Beagle Male Puppy",
    category: "dog",
    gender: "Male",
    age_months: 2,
    price: 22000,
    description: "Active Beagle puppy. Great with kids and other pets.",
    city: "Hyderabad",
    state: "TS",
    location: "Gachibowli, Hyderabad",
    vaccinated: true,
    verification_status: "verified",
    images: ["https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?w=800"],
    owner_id: "breeder-3",
    created_at: new Date().toISOString(),
    views: 1560,
    is_featured: false,
  }
];
