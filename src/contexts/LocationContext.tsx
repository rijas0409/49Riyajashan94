import { createContext, useContext, useMemo, useState, ReactNode } from "react";

const CITIES = [
  { id: "greater-noida", name: "Greater Noida", state: "Uttar Pradesh" },
  { id: "noida", name: "Noida", state: "Uttar Pradesh" },
  { id: "delhi", name: "Delhi", state: "Delhi" },
  { id: "gurgaon", name: "Gurgaon", state: "Haryana" },
  { id: "mumbai", name: "Mumbai", state: "Maharashtra" },
  { id: "bangalore", name: "Bangalore", state: "Karnataka" },
  { id: "hyderabad", name: "Hyderabad", state: "Telangana" },
  { id: "chennai", name: "Chennai", state: "Tamil Nadu" },
  { id: "pune", name: "Pune", state: "Maharashtra" },
  { id: "kolkata", name: "Kolkata", state: "West Bengal" },
] as const;

const DEFAULT_CITY = "Gurgaon";
const STORAGE_KEY = "petlink:selected-city";

interface LocationContextType {
  city: string;
  setCity: (city: string) => void;
  cities: typeof CITIES;
}

const readInitialCity = () => {
  if (typeof window === "undefined") return DEFAULT_CITY;

  const savedCity = window.localStorage.getItem(STORAGE_KEY)?.trim();
  if (savedCity) return savedCity;

  return DEFAULT_CITY;
};

const LocationContext = createContext<LocationContextType>({
  city: DEFAULT_CITY,
  setCity: () => {},
  cities: CITIES,
});

export const LocationProvider = ({ children }: { children: ReactNode }) => {
  const [city, setCityState] = useState(readInitialCity);

  const setCity = (nextCity: string) => {
    const resolvedCity = nextCity?.trim() || DEFAULT_CITY;
    setCityState(resolvedCity);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, resolvedCity);
    }
  };

  const value = useMemo(() => ({ city, setCity, cities: CITIES }), [city]);

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
};

export const useLocation = () => useContext(LocationContext);
