import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Plus, MapPin, Trash2, Star, ShieldCheck, Sparkles, Map as MapIcon, Search, Compass, Loader2, Locate, Pencil, X, Building2, Users, Briefcase, Home, MoreHorizontal, CheckCircle2, ChevronDown, ChevronRight, Bookmark, Tag, Cloud, Bell, PhoneCall, Dog, DoorOpen, Target, Milestone, Edit3, Check, Navigation, LocateFixed } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "@/contexts/LocationContext";
import { APIProvider, Map, useMap } from "@vis.gl/react-google-maps";

const GOOGLE_MAPS_API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY ||
  "AIzaSyCpOg1A6w1yoptUZe_-oEq__5bxoQdil5U";

const MapUpdater = ({ mapRef }: { mapRef: React.MutableRefObject<any> }) => {
  const map = useMap();
  useEffect(() => {
    if (map) {
      mapRef.current = map;
    }
    return () => {
      mapRef.current = null;
    };
  }, [map, mapRef]);
  return null;
};

interface Address {
  id: string;
  address_line: string;
  city: string;
  state: string;
  pincode: string;
  is_default: boolean;
}

const Addresses = () => {
  const navigate = useNavigate();
  const { cities } = useLocation();
  const uniqueStates = Array.from(new Set(cities.map(c => c.state))).sort();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [addressStep, setAddressStep] = useState<"list" | "map" | "form">("list");
  const [form, setForm] = useState({ address_line: "", city: "", state: "", pincode: "" });
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);

  // Form step extra detailed states
  const [selectedAddressType, setSelectedAddressType] = useState<string>("Home");
  const [customAddressType, setCustomAddressType] = useState<string>("");
  const [buildingFloor, setBuildingFloor] = useState<string>("");
  const [streetName, setStreetName] = useState<string>("");
  const [saveAddressAs, setSaveAddressAs] = useState<string>("Home Address");
  const [isDefaultAddress, setIsDefaultAddress] = useState<boolean>(true);
  const [saveToAccount, setSaveToAccount] = useState<boolean>(true);
  const [deliveryInstructions, setDeliveryInstructions] = useState<string>("");
  const [selectedPresetInstructions, setSelectedPresetInstructions] = useState<string[]>([]);
  const [receiverName, setReceiverName] = useState<string>("User");
  const [receiverPhone, setReceiverPhone] = useState<string>("+91 98765 43210");
  const [isEditingReceiver, setIsEditingReceiver] = useState<boolean>(false);

  // Sync real-time user profile for receiver details
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const user = session.user;
          const metaName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "";
          const metaPhone = user.user_metadata?.phone_number || user.user_metadata?.phone || user.phone || "";
          
          const { data: prof } = await supabase
            .from("profiles")
            .select("full_name, name, phone_number, phone")
            .eq("id", user.id)
            .maybeSingle();

          const resolvedName = prof?.full_name || prof?.name || metaName || "User Account";
          const resolvedPhone = prof?.phone_number || prof?.phone || metaPhone || "+91 98765 43210";

          if (resolvedName) setReceiverName(resolvedName);
          if (resolvedPhone) setReceiverPhone(resolvedPhone);
        }
      } catch (e) {
        console.error("Error fetching user profile for receiver:", e);
      }
    };
    fetchUserProfile();
  }, []);

  // Sync Save Address As with selectedAddressType or customAddressType
  useEffect(() => {
    if (selectedAddressType === "Home") {
      setSaveAddressAs("Home Address");
    } else if (selectedAddressType === "Work") {
      setSaveAddressAs("Office Address");
    } else if (selectedAddressType === "Parents' Home") {
      setSaveAddressAs("Parents' Home Address");
    } else if (selectedAddressType === "Other") {
      const customLabel = customAddressType.trim();
      setSaveAddressAs(customLabel ? `${customLabel} Address` : "Other Address");
    }
  }, [selectedAddressType, customAddressType]);

  const togglePresetInstruction = (id: string, label: string) => {
    if (selectedPresetInstructions.includes(id)) {
      setSelectedPresetInstructions(prev => prev.filter(i => i !== id));
      setDeliveryInstructions(prev => {
        const parts = prev.split(",").map(s => s.trim()).filter(s => s && s !== label);
        return parts.join(", ");
      });
    } else {
      setSelectedPresetInstructions(prev => [...prev, id]);
      setDeliveryInstructions(prev => (prev ? `${prev}, ${label}` : label));
    }
  };
  
  const openMapStep = () => {
    setEditingAddressId(null);
    setForm({ address_line: "", city: "", state: "", pincode: "" });
    setLocationEnabled(false);
    setIsOutsideIndia(false);
    setAddressStep("map");
  };

  // Map and Geolocation states
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: 28.6139, lng: 77.2090 }); // Default to Delhi, India
  const [mapZoom, setMapZoom] = useState(15);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [isOutsideIndia, setIsOutsideIndia] = useState(false);
  const [gpsLocation, setGpsLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [geocoding, setGeocoding] = useState(false);
  const [mapSearchQuery, setMapSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResultsDropdown, setShowResultsDropdown] = useState(false);
  const [showFullSearchResultsScreen, setShowFullSearchResultsScreen] = useState(false);
  const [selectedSearchResultIndex, setSelectedSearchResultIndex] = useState(0);
  const mapRef = useRef<any>(null);
  const skipNextGeocodeRef = useRef(false);
  const hasShownGeocodeErrorRef = useRef(false);
  const [carouselIndex, setCarouselIndex] = useState(0);

  useEffect(() => { 
    fetchAddresses(); 
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (addressStep === "map") {
      const interval = setInterval(() => {
        setCarouselIndex((prev) => (prev === 0 ? 1 : 0));
      }, 4900);
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addressStep]);

  // Check if location is strictly within India territory
  const checkIsLocationInIndia = (lat: number, lng: number, countryStr?: string): boolean => {
    if (countryStr && countryStr.trim().length > 0) {
      const c = countryStr.toLowerCase().trim();
      const isIndiaName = c === "india" || c === "republic of india" || c === "in" || c.includes("india");
      if (!isIndiaName) {
        // Strictly outside India (e.g. Pakistan, China, Nepal, Sri Lanka, Bangladesh, etc.)
        return false;
      }
      return true;
    }
    // Bounding box strictly for India mainland & islands (lat: 8.0 - 35.5, lng: 68.1 - 97.4)
    const isLatValid = lat >= 8.0 && lat <= 35.5;
    const isLngValid = lng >= 68.1 && lng <= 97.4;
    return isLatValid && isLngValid;
  };

  // Helper to smoothly animate map camera pan & zoom in to target location
  const animateMapToLocation = (lat: number, lng: number, targetZoom = 16) => {
    setMapCenter({ lat, lng });
    if (mapRef.current) {
      skipNextGeocodeRef.current = true;
      mapRef.current.panTo({ lat, lng });
      const currentZoom = mapRef.current.getZoom() || 10;
      if (currentZoom < targetZoom) {
        let curr = currentZoom;
        const zoomInterval = setInterval(() => {
          curr += 1;
          if (mapRef.current) mapRef.current.setZoom(curr);
          if (curr >= targetZoom) {
            clearInterval(zoomInterval);
          }
        }, 100);
      } else {
        mapRef.current.setZoom(targetZoom);
      }
    } else {
      setMapZoom(targetZoom);
    }
  };

  // Helper to match dynamic reverse-geocoded state & city to Sruvo Location Context options
  const matchCityAndState = (fetchedCity: string, fetchedState: string) => {
    if (!fetchedCity || !fetchedState) return { state: "", city: "" };

    const matchedState = uniqueStates.find(st => 
      st.toLowerCase().includes(fetchedState.toLowerCase()) || 
      fetchedState.toLowerCase().includes(st.toLowerCase())
    ) || "";

    const availableCities = cities.filter(c => !matchedState || c.state === matchedState);
    const matchedCityObj = availableCities.find(c => 
      c.name.toLowerCase().includes(fetchedCity.toLowerCase()) || 
      fetchedCity.toLowerCase().includes(c.name.toLowerCase())
    ) || cities.find(c => 
      c.name.toLowerCase().includes(fetchedCity.toLowerCase()) || 
      fetchedCity.toLowerCase().includes(c.name.toLowerCase())
    );

    return {
      state: matchedState || (matchedCityObj ? matchedCityObj.state : ""),
      city: matchedCityObj ? matchedCityObj.name : ""
    };
  };

  // Helper to calculate distance in km between two lat/lng points
  const calculateDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Helper to clean, deduplicate, and format raw address strings into clean Landmark, City, State Pincode, India format
  const formatCleanAddress = (
    rawAddressLine: string,
    rawCity?: string,
    rawState?: string,
    rawPincode?: string,
    rawCountry?: string
  ) => {
    const city = (rawCity || "").trim();
    const state = (rawState || "").trim();
    const pincode = (rawPincode || "").trim();

    if (!rawAddressLine) {
      const fallbackParts = [city, state, pincode, "India"].filter(Boolean);
      return {
        cleanAddressLine: city || "Selected Location",
        cleanCity: city,
        cleanState: state,
        cleanPincode: pincode,
        detectedArea: city || "Selected Area",
        fullAddress: fallbackParts.join(", ")
      };
    }

    const rawParts = rawAddressLine.split(",").map(p => p.trim()).filter(Boolean);
    const cleanParts: string[] = [];
    const seenLower = new Set<string>();

    for (const part of rawParts) {
      const pLower = part.toLowerCase();

      // 1. Skip country names
      if (pLower === "india" || pLower === "republic of india" || pLower === "in") {
        continue;
      }

      // 2. Skip if part is pure pincode or contains pincode
      if (/^\d{6}$/.test(part) || (pincode && part.includes(pincode))) {
        continue;
      }

      // 3. Skip administrative clutter keywords like Tahsil, Tehsil, Taluka, Subdistrict, District, County, Division
      if (/\b(tahsil|tehsil|taluka|subdistrict|district|county|division)\b/i.test(part)) {
        continue;
      }

      // 4. Skip redundant City / District suffixes e.g., "Indore City" when city is "Indore"
      if (city && (pLower === `${city.toLowerCase()} city` || pLower === `${city.toLowerCase()} district`)) {
        continue;
      }
      if (pLower.endsWith(" city") && city && pLower.includes(city.toLowerCase())) {
        continue;
      }

      // 5. Skip if part is exact match to city or state (we append city, state, pincode at the end)
      if (city && pLower === city.toLowerCase()) {
        continue;
      }
      if (state && pLower === state.toLowerCase()) {
        continue;
      }

      // 6. Deduplicate if part already seen
      if (seenLower.has(pLower)) {
        continue;
      }

      seenLower.add(pLower);
      cleanParts.push(part);
    }

    if (cleanParts.length === 0) {
      const firstPart = rawParts[0] || city || "Pinned Location";
      if (firstPart && !firstPart.toLowerCase().includes("india") && !/^\d{6}$/.test(firstPart)) {
        cleanParts.push(firstPart);
      } else {
        cleanParts.push(city || "Pinned Location");
      }
    }

    const cleanAddressLine = cleanParts.join(", ");
    const detectedArea = cleanParts[0] || city || "Selected Area";

    // Build clean full address: "Landmark/Street, City, State Pincode, India"
    const fullComponents: string[] = [cleanAddressLine];

    if (city && !cleanAddressLine.toLowerCase().includes(city.toLowerCase())) {
      fullComponents.push(city);
    }

    let stateAndPincode = state;
    if (pincode && !stateAndPincode.includes(pincode)) {
      stateAndPincode = stateAndPincode ? `${stateAndPincode} ${pincode}` : pincode;
    }

    if (stateAndPincode && !cleanAddressLine.toLowerCase().includes(stateAndPincode.toLowerCase())) {
      fullComponents.push(stateAndPincode);
    }

    if (!fullComponents.some(c => c.toLowerCase().includes("india"))) {
      fullComponents.push("India");
    }

    const fullAddress = fullComponents.filter(Boolean).join(", ");

    return {
      cleanAddressLine,
      cleanCity: city,
      cleanState: state,
      cleanPincode: pincode,
      detectedArea,
      fullAddress
    };
  };

  const reverseGeocode = (lat: number, lng: number): Promise<any> => {
    return new Promise(async (resolve) => {
      // 1. Try Google Maps Geocoder first if available
      if (window.google && window.google.maps) {
        try {
          const geocoder = new google.maps.Geocoder();
          const googleResult = await new Promise<any>((resolveGoogle) => {
            geocoder.geocode({ location: { lat, lng } }, (results, status) => {
              if (status === "OK" && results && results[0]) {
                const result = results[0];
                const raw_address = result.formatted_address;
                let city = "";
                let state = "";
                let pincode = "";
                let country = "";

                for (const component of result.address_components) {
                  const types = component.types;
                  if (types.includes("country")) {
                    country = component.long_name;
                  }
                  if (types.includes("postal_code")) {
                    pincode = component.long_name;
                  }
                  if (types.includes("administrative_area_level_1")) {
                    state = component.long_name;
                  }
                  if (types.includes("locality") || types.includes("sublocality_level_1") || types.includes("sublocality")) {
                    if (!city) city = component.long_name;
                  }
                }
                const cleaned = formatCleanAddress(raw_address, city, state, pincode, country);
                resolveGoogle({ 
                  address_line: cleaned.cleanAddressLine, 
                  city, 
                  state, 
                  pincode, 
                  country,
                  fullAddress: cleaned.fullAddress,
                  detectedArea: cleaned.detectedArea
                });
              } else {
                if (status === "REQUEST_DENIED" && !hasShownGeocodeErrorRef.current) {
                  console.warn("Geocoding Service request denied. Falling back to OpenStreetMap Nominatim...");
                  hasShownGeocodeErrorRef.current = true;
                }
                resolveGoogle(null);
              }
            });
          });

          if (googleResult) {
            resolve(googleResult);
            return;
          }
        } catch (err) {
          console.error("Google Geocoder failed:", err);
        }
      }

      // 2. Real-time Fallback to OpenStreetMap Nominatim API if Google fails or is denied
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`, {
          headers: {
            "Accept-Language": "en",
            "User-Agent": "SruvoPetLinkApp/1.0"
          }
        });
        if (response.ok) {
          const data = await response.json();
          if (data && data.address) {
            const landmark = data.address.amenity || data.address.building || data.address.historic || data.address.shop || data.address.tourism || data.address.office || "";
            const road = data.address.road || data.address.street || data.address.pedestrian || "";
            const neighbourhood = data.address.neighbourhood || data.address.suburb || data.address.residential || "";

            const streetParts = [landmark, road, neighbourhood].filter(Boolean);
            const raw_address = streetParts.length > 0 ? streetParts.join(", ") : (data.display_name || "");
            const city = data.address.city || data.address.town || data.address.village || data.address.county || "";
            const state = data.address.state || "";
            const pincode = data.address.postcode || "";
            const country = data.address.country || "India";

            const cleaned = formatCleanAddress(raw_address, city, state, pincode, country);
            resolve({ 
              address_line: cleaned.cleanAddressLine, 
              city, 
              state, 
              pincode, 
              country,
              fullAddress: cleaned.fullAddress,
              detectedArea: cleaned.detectedArea
            });
            return;
          }
        }
      } catch (nominatimErr) {
        console.error("Nominatim geocoder fallback failed:", nominatimErr);
      }

      // 3. Last resort coordinates-based address
      resolve({
        address_line: `Pinned Location`,
        city: "Delhi",
        state: "Delhi",
        pincode: "110001",
        country: "India",
        fullAddress: `Pinned Location, Delhi 110001, India`,
        detectedArea: `Pinned Location`
      });
    });
  };

  const handleSearch = async (query: string) => {
    setMapSearchQuery(query);
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      setShowResultsDropdown(false);
      return;
    }
    setSearching(true);

    const cleanQuery = query.trim();

    // 1. Try Google Places Autocomplete Service first if available
    let googleSuccess = false;
    if (window.google && window.google.maps && window.google.maps.places) {
      try {
        const autocompleteService = new google.maps.places.AutocompleteService();
        autocompleteService.getPlacePredictions(
          { input: cleanQuery, componentRestrictions: { country: "in" } },
          (predictions, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && predictions && predictions.length > 0) {
              googleSuccess = true;
              setSearching(false);
              setSearchResults(predictions.map(p => ({
                display_name: p.description,
                place_id: p.place_id,
                main_text: p.structured_formatting?.main_text || p.description,
                secondary_text: p.structured_formatting?.secondary_text || "",
                source: "google"
              })));
              setShowResultsDropdown(true);
            } else {
              // Fallback to Nominatim if Google returned zero results
              fetchNominatimSearchResults(cleanQuery);
            }
          }
        );
        return;
      } catch (err) {
        console.warn("Google Autocomplete exception, trying Nominatim fallback:", err);
      }
    }

    // 2. OpenStreetMap Nominatim Search API Fallback (Real-time & High Precision for India)
    if (!googleSuccess) {
      fetchNominatimSearchResults(cleanQuery);
    }
  };

  const fetchNominatimSearchResults = async (query: string) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=in&addressdetails=1&limit=8`,
        {
          headers: {
            "Accept-Language": "en",
            "User-Agent": "SruvoPetLinkApp/1.0"
          }
        }
      );
      setSearching(false);
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          const results = data.map((item: any) => {
            const main = item.name || item.address?.amenity || item.address?.road || item.address?.suburb || item.display_name.split(',')[0];
            const secondaryParts = [
              item.address?.suburb,
              item.address?.city || item.address?.town || item.address?.village,
              item.address?.state,
              "India"
            ].filter(Boolean);
            const secondary = Array.from(new Set(secondaryParts)).join(", ");

            return {
              display_name: item.display_name,
              main_text: main,
              secondary_text: secondary,
              lat: parseFloat(item.lat),
              lng: parseFloat(item.lon),
              raw_address: item.address,
              source: "nominatim"
            };
          });
          setSearchResults(results);
          setShowResultsDropdown(true);
          return;
        }
      }
      setSearchResults([]);
      setShowResultsDropdown(false);
    } catch (err) {
      console.error("Nominatim search failed:", err);
      setSearching(false);
      setSearchResults([]);
      setShowResultsDropdown(false);
    }
  };

  const selectSuggestion = async (suggestion: any) => {
    setShowResultsDropdown(false);
    setSearchResults([]);
    setMapSearchQuery(suggestion.main_text || suggestion.display_name);
    setGeocoding(true);

    // Case A: Google Place ID result
    if (suggestion.source === "google" && suggestion.place_id && window.google && window.google.maps) {
      try {
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ placeId: suggestion.place_id }, async (results, status) => {
          if (status === "OK" && results && results[0]) {
            const location = results[0].geometry.location;
            const lat = location.lat();
            const lng = location.lng();

            let country = "";
            let city = "";
            let state = "";
            let pincode = "";

            for (const component of results[0].address_components) {
              const types = component.types;
              if (types.includes("country")) country = component.long_name;
              if (types.includes("postal_code")) pincode = component.long_name;
              if (types.includes("administrative_area_level_1")) state = component.long_name;
              if (types.includes("locality") || types.includes("sublocality_level_1") || types.includes("sublocality")) {
                if (!city) city = component.long_name;
              }
            }

            const inIndia = checkIsLocationInIndia(lat, lng, country);
            setIsOutsideIndia(!inIndia);
            if (!inIndia) {
              toast.error("Sorry, our services are currently available only within India.");
            } else {
              animateMapToLocation(lat, lng, 16);
              const matched = matchCityAndState(city, state);
              const cleaned = formatCleanAddress(results[0].formatted_address || suggestion.display_name, matched.city || city, matched.state || state, pincode, country);
              const fullLoc = cleaned.fullAddress || results[0].formatted_address || suggestion.display_name;
              setForm({
                address_line: fullLoc,
                city: matched.city || city,
                state: matched.state || state,
                pincode: pincode
              });
              setLocationEnabled(true);
            }
          } else {
            toast.error("Could not find coordinates for this location");
          }
          setGeocoding(false);
        });
        return;
      } catch (err) {
        console.error("Google Place Geocode failed, falling back...", err);
      }
    }

    // Case B: Direct Lat/Lng or Nominatim result
    if (suggestion.lat && suggestion.lng) {
      const lat = suggestion.lat;
      const lng = suggestion.lng;
      const countryStr = suggestion.raw_address?.country || "India";

      const inIndia = checkIsLocationInIndia(lat, lng, countryStr);
      setIsOutsideIndia(!inIndia);

      if (!inIndia) {
        toast.error("Sorry, our services are currently available only within India.");
        setGeocoding(false);
        return;
      }

      animateMapToLocation(lat, lng, 16);
      const rev = await reverseGeocode(lat, lng);
      setGeocoding(false);

      const finalAddress = rev?.address_line || suggestion.display_name;
      const finalCity = rev?.city || suggestion.raw_address?.city || suggestion.raw_address?.town || "";
      const finalState = rev?.state || suggestion.raw_address?.state || "";
      const finalPincode = rev?.pincode || suggestion.raw_address?.postcode || "";

      const matched = matchCityAndState(finalCity, finalState);
      const cleaned = formatCleanAddress(finalAddress, matched.city || finalCity, matched.state || finalState, finalPincode, countryStr);
      const fullLoc = cleaned.fullAddress || rev?.fullAddress || finalAddress || suggestion.display_name;
      setForm({
        address_line: fullLoc,
        city: matched.city || finalCity,
        state: matched.state || finalState,
        pincode: finalPincode
      });
      setLocationEnabled(true);
      return;
    }

    setGeocoding(false);
  };

  const requestLocation = () => {
    setGeocoding(true);

    if (!navigator.geolocation) {
      setGeocoding(false);
      toast.error("Geolocation is not supported by your device");
      return;
    }

    const options = { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        const result = await reverseGeocode(lat, lng);
        setGeocoding(false);

        const inIndia = checkIsLocationInIndia(lat, lng, result?.country);
        if (!inIndia) {
          setIsOutsideIndia(true);
          toast.error("Sorry, our services are currently available only within India.");
          return;
        }

        setIsOutsideIndia(false);
        setGpsLocation({ lat, lng });
        animateMapToLocation(lat, lng, 16);
        setLocationEnabled(true);
        toast.success("Exact live location detected!");

        if (result) {
          const matched = matchCityAndState(result.city, result.state);
          const cleaned = formatCleanAddress(result.address_line, matched.city || result.city, matched.state || result.state, result.pincode, result.country);
          const fullLoc = result.fullAddress || cleaned.fullAddress || result.address_line;
          setForm({
            address_line: fullLoc,
            city: matched.city || result.city,
            state: matched.state || result.state,
            pincode: result.pincode
          });
        }
      },
      (error) => {
        console.warn("Geolocation permission or GPS read failed:", error);
        setGeocoding(false);
        toast.error("Please enable location permission on your device to map your address.");
      },
      options
    );
  };

  const snapToCurrentLocation = async () => {
    // Force a clean, direct lookup from the device GPS to prevent caching of outdated/wrong locations
    toast.info("Accessing live GPS of your device...", { duration: 2500 });
    requestLocation();
  };

  const fetchAddresses = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }

      const { data } = await supabase
        .from("addresses")
        .select("*")
        .eq("user_id", session.user.id)
        .order("is_default", { ascending: false });

      setAddresses(data || []);
    } catch (err) {
      console.error("Failed to fetch addresses:", err);
    } finally {
      setLoading(false);
      setInitialLoadDone(true);
    }
  };

  const startEdit = (addr: Address) => {
    setEditingAddressId(addr.id);
    setForm({
      address_line: addr.address_line,
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode
    });
    setAddressStep("form");
  };

  const handleSave = async () => {
    // Validation for mandatory fields
    if (!buildingFloor.trim() && !form.address_line.trim()) {
      toast.error("Please fill in Building / Floor and Area / Locality details");
      return;
    }
    if (!form.address_line.trim()) {
      toast.error("Please enter Area / Locality address");
      return;
    }
    if (!receiverName.trim() || !receiverPhone.trim()) {
      toast.error("Please enter Receiver Name and Phone number");
      return;
    }

    const fullParts = [buildingFloor.trim(), streetName.trim(), form.address_line.trim()].filter(Boolean);
    const finalAddressLine = fullParts.length > 0 ? fullParts.join(", ") : "Selected Address";
    const finalCity = form.city || "Indore";
    const finalState = form.state || "Madhya Pradesh";
    const finalPincode = form.pincode || "452001";

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error("Please log in to save addresses");
      return;
    }

    // Ensure only one default address if user marked set as default address
    if (isDefaultAddress) {
      await supabase.from("addresses").update({ is_default: false }).eq("user_id", session.user.id);
    }

    if (editingAddressId) {
      // Edit mode
      const { error } = await supabase
        .from("addresses")
        .update({
          address_line: finalAddressLine,
          city: finalCity,
          state: finalState,
          pincode: finalPincode,
          is_default: isDefaultAddress
        })
        .eq("id", editingAddressId);

      if (error) {
        toast.error("Failed to update address: " + error.message);
      } else {
        toast.success("Address updated successfully!");
        setForm({ address_line: "", city: "", state: "", pincode: "" });
        setBuildingFloor("");
        setStreetName("");
        setEditingAddressId(null);
        setAddressStep("list");
        fetchAddresses();
      }
    } else {
      // Add mode
      const { error } = await supabase.from("addresses").insert({
        address_line: finalAddressLine,
        city: finalCity,
        state: finalState,
        pincode: finalPincode,
        user_id: session.user.id,
        is_default: isDefaultAddress || addresses.length === 0,
      });

      if (error) {
        toast.error("Failed to save address: " + error.message);
      } else {
        toast.success("Address saved successfully!");
        setForm({ address_line: "", city: "", state: "", pincode: "" });
        setBuildingFloor("");
        setStreetName("");
        setAddressStep("list");
        fetchAddresses();
      }
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("addresses").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete address");
    } else {
      toast.success("Address deleted successfully");
      fetchAddresses();
    }
  };

  const setDefault = async (id: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    await supabase.from("addresses").update({ is_default: false }).eq("user_id", session.user.id);
    await supabase.from("addresses").update({ is_default: true }).eq("id", id);
    toast.success("Default address updated!");
    fetchAddresses();
  };

  // Real Map layout if user is on "map" step
  if (addressStep === "map") {
    if (showFullSearchResultsScreen) {
      return (
        <APIProvider apiKey={GOOGLE_MAPS_API_KEY} version="weekly" libraries={["places", "geocoding"]}>
          <div className="fixed inset-0 z-50 bg-[#FAF9FC] flex flex-col overflow-hidden max-w-lg mx-auto shadow-2xl">
            {/* Top Bar Header */}
            <div className="bg-white px-4 py-3 border-b border-gray-100 flex items-center gap-3 shadow-xs sticky top-0 z-50">
              <button 
                type="button"
                onClick={() => setShowFullSearchResultsScreen(false)}
                className="w-10 h-10 rounded-full bg-white hover:bg-gray-100 border border-gray-200/80 shadow-xs flex items-center justify-center flex-shrink-0 cursor-pointer transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-800" />
              </button>

              <div className="relative flex-1">
                <Input 
                  type="text"
                  placeholder="Search location..." 
                  value={mapSearchQuery} 
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full bg-gray-50 text-gray-900 rounded-full pl-4 pr-10 h-11 border border-gray-200 font-semibold text-sm focus:bg-white focus:ring-2 focus:ring-[#FF5722]"
                />
                {mapSearchQuery && (
                  <button 
                    type="button"
                    onClick={() => {
                      setMapSearchQuery("");
                      setSearchResults([]);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 rounded-full transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                )}
              </div>
            </div>

            {/* Sub-header Bar: Showing results for "query" | Near me */}
            <div className="px-4 py-2.5 bg-white border-b border-gray-100 flex items-center justify-between text-xs sm:text-sm">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className="w-5 h-5 rounded-full bg-[#FFF0EB] flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-3.5 h-3.5 text-[#FF5722]" />
                </div>
                <p className="font-medium text-gray-600 truncate">
                  Showing results for &ldquo;<span className="font-bold text-gray-900">{mapSearchQuery || "Search"}</span>&rdquo;
                </p>
              </div>

              <button 
                type="button"
                className="flex items-center gap-1 font-semibold text-gray-600 hover:text-gray-900 cursor-pointer flex-shrink-0 ml-3 bg-gray-50 px-2.5 py-1 rounded-full border border-gray-200/60"
              >
                <span>Near me</span>
                <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
              </button>
            </div>

            {/* Search Results List */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5 pb-44 bg-[#FAF9FC]">
              {searching ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3 text-gray-400">
                  <Loader2 className="w-8 h-8 animate-spin text-[#FF5722]" />
                  <p className="text-xs font-medium">Searching location results...</p>
                </div>
              ) : searchResults.length > 0 ? (
                searchResults.map((result, idx) => {
                  let distanceDisplay = "";
                  if (result.lat && result.lng && mapCenter) {
                    const dist = calculateDistanceKm(mapCenter.lat, mapCenter.lng, result.lat, result.lng);
                    distanceDisplay = dist < 1 ? `${(dist * 1000).toFixed(0)} m` : `${dist.toFixed(1)} km`;
                  } else {
                    const estKm = (0.6 + idx * 0.9).toFixed(1);
                    distanceDisplay = `${estKm} km`;
                  }

                  const isSelected = idx === selectedSearchResultIndex;

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedSearchResultIndex(idx)}
                      className={`w-full text-left p-3.5 rounded-2xl transition-all flex items-center justify-between gap-3 cursor-pointer ${
                        isSelected 
                          ? "bg-[#FFF6F2] border-2 border-[#FF5722]/80 shadow-xs" 
                          : "bg-white hover:bg-gray-50 border border-gray-100 shadow-2xs"
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          isSelected ? "bg-[#FFEAE2]" : "bg-[#FFF0EB]"
                        }`}>
                          <MapPin className="w-5 h-5 text-[#FF5722]" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-extrabold text-gray-900 text-sm sm:text-base truncate leading-snug">
                            {result.main_text}
                          </p>
                          <p className="text-xs text-gray-500 font-medium truncate mt-0.5">
                            {result.secondary_text || result.display_name}
                          </p>
                        </div>
                      </div>
                      <div className={`text-xs font-bold whitespace-nowrap flex-shrink-0 ml-1 ${
                        isSelected ? "text-[#FF5722]" : "text-gray-400"
                      }`}>
                        {distanceDisplay}
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="py-10 text-center space-y-2">
                  <p className="text-sm font-bold text-gray-700">No matching locations found</p>
                  <p className="text-xs text-gray-400">Try searching for a city, landmark, or street name</p>
                </div>
              )}

              {/* Row: See more results for "query" (only when > 9 results and query is active) */}
              {searchResults.length > 9 && mapSearchQuery.trim() && (
                <div 
                  onClick={() => {
                    if (mapSearchQuery.trim()) {
                      handleSearch(mapSearchQuery.trim());
                    }
                  }}
                  className="bg-white hover:bg-gray-50 rounded-2xl p-3.5 border border-gray-100 flex items-center justify-between cursor-pointer transition-all shadow-2xs"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center flex-shrink-0">
                      <Search className="w-5 h-5 text-gray-400" />
                    </div>
                    <span className="text-xs font-bold text-gray-600 truncate">
                      See more results for &ldquo;{mapSearchQuery.trim()}&rdquo;
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                </div>
              )}
            </div>

            {/* Bottom Fixed Selected Location Drawer (matching exact bottom card from UI image) */}
            <div className="fixed bottom-0 inset-x-0 bg-white rounded-t-[28px] border-t border-gray-100 shadow-[0_-10px_35px_rgba(0,0,0,0.12)] p-4 sm:p-5 z-50 max-w-lg mx-auto space-y-3.5">
              <div className="flex items-center justify-between gap-3">
                <div className="w-11 h-11 rounded-full bg-[#FFF0EB] flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-[#FF5722]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-medium text-gray-400 leading-none">Selected location</p>
                  <h4 className="font-extrabold text-gray-900 text-sm sm:text-base leading-tight truncate mt-1">
                    {searchResults[selectedSearchResultIndex]?.main_text || mapSearchQuery || "Selected Location"}
                  </h4>
                  <p className="text-xs text-gray-500 font-normal truncate mt-0.5">
                    {searchResults[selectedSearchResultIndex]?.secondary_text || searchResults[selectedSearchResultIndex]?.display_name || "Location details"}
                  </p>
                </div>
                <div className="text-xs font-bold text-[#FF5722] flex-shrink-0">
                  {(() => {
                    const currentRes = searchResults[selectedSearchResultIndex];
                    if (currentRes && currentRes.lat && currentRes.lng && mapCenter) {
                      const dist = calculateDistanceKm(mapCenter.lat, mapCenter.lng, currentRes.lat, currentRes.lng);
                      return dist < 1 ? `${(dist * 1000).toFixed(0)} m` : `${dist.toFixed(1)} km`;
                    }
                    return `${(0.6 + (selectedSearchResultIndex || 0) * 0.9).toFixed(1)} km`;
                  })()}
                </div>
              </div>

              <button
                type="button"
                onClick={async () => {
                  const selectedItem = searchResults[selectedSearchResultIndex] || searchResults[0];
                  if (selectedItem) {
                    await selectSuggestion(selectedItem);
                  }
                  setShowFullSearchResultsScreen(false);
                  setAddressStep("form");
                }}
                className="w-full rounded-full bg-[#FF5722] hover:bg-[#F4511E] text-white font-extrabold text-sm sm:text-base py-3.5 shadow-lg shadow-orange-500/20 active:scale-[0.98] transition-all cursor-pointer"
              >
                Confirm this location
              </button>
            </div>
          </div>
        </APIProvider>
      );
    }
    const cleanedMapAddr = formatCleanAddress(form.address_line, form.city, form.state, form.pincode, "India");
    const detectedArea = cleanedMapAddr.detectedArea;
    const fullAddress = cleanedMapAddr.fullAddress;
    const isMovedAway = gpsLocation && (
      Math.abs(mapCenter.lat - gpsLocation.lat) > 0.00015 ||
      Math.abs(mapCenter.lng - gpsLocation.lng) > 0.00015
    );

    return (
      <APIProvider apiKey={GOOGLE_MAPS_API_KEY} version="weekly" libraries={["places", "geocoding"]}>
        <MapUpdater mapRef={mapRef} />
        <div className="fixed inset-0 z-50 bg-gray-50 flex flex-col overflow-hidden">
          {/* Real Google Map */}
          <div className={`w-full h-full absolute inset-0 z-0 overflow-hidden transition-all duration-300 ${!locationEnabled ? "opacity-50 filter grayscale-[25%] pointer-events-none" : "opacity-100 pointer-events-auto"}`}>
            <Map
              center={mapCenter}
              zoom={mapZoom}
              minZoom={4}
              maxZoom={20}
              gestureHandling="greedy"
              disableDefaultUI={true}
              internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
              onCameraChanged={(ev) => {
                if (ev.map) {
                  mapRef.current = ev.map;
                }
                const newLat = ev.detail.center.lat;
                const newLng = ev.detail.center.lng;
                const newZoom = ev.detail.zoom;
                setMapCenter({ lat: newLat, lng: newLng });
                setMapZoom(newZoom);
              }}
              onIdle={() => {
                if (!locationEnabled) return;
                if (mapRef.current) {
                  const center = mapRef.current.getCenter();
                  if (!center) return;
                  const newLat = center.lat();
                  const newLng = center.lng();
                  
                  if (skipNextGeocodeRef.current) {
                    skipNextGeocodeRef.current = false;
                    return;
                  }
                  setGeocoding(true);
                  reverseGeocode(newLat, newLng).then((result) => {
                    setGeocoding(false);
                    const inIndia = checkIsLocationInIndia(newLat, newLng, result?.country);
                    setIsOutsideIndia(!inIndia);
                    if (!inIndia) {
                      toast.error("Sorry, our services are currently available only within India.");
                    } else if (result) {
                      const matched = matchCityAndState(result.city, result.state);
                      const cleaned = formatCleanAddress(result.address_line, matched.city || result.city, matched.state || result.state, result.pincode, result.country);
                      const fullLoc = result.fullAddress || cleaned.fullAddress || result.address_line;
                      setForm({
                        address_line: fullLoc,
                        city: matched.city || result.city,
                        state: matched.state || result.state,
                        pincode: result.pincode
                      });
                    }
                  });
                }
              }}
              style={{ width: "100%", height: "100%" }}
            />
          </div>

        {/* Center Pulsating Pin Marker */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="flex flex-col items-center -translate-y-8">
            {/* Pulsing shadow */}
            <div className="w-10 h-3 bg-black/15 rounded-full absolute -bottom-1 left-1/2 -translate-x-1/2 scale-x-150 blur-[2px] animate-pulse" />
            {/* Animated Pin */}
            <div className="relative animate-bounce duration-1000">
              <div className="w-12 h-12 bg-[#FF5722] rounded-full flex items-center justify-center border-4 border-white shadow-[0_8px_20px_rgba(255,87,34,0.35)]">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <div className="w-4 h-4 bg-[#FF5722] rotate-45 absolute -bottom-1.5 left-1/2 -translate-x-1/2 border-r-4 border-b-4 border-white shadow-[0_4px_10px_rgba(255,87,34,0.35)]" />
            </div>
          </div>
        </div>

        {/* Top Floating Search and Action bar */}
        <div className="absolute top-4 left-4 right-4 z-20 flex gap-2.5 items-center max-w-lg mx-auto">
          <Button 
            onClick={() => setAddressStep("list")}
            size="icon" 
            className="w-11 h-11 bg-white hover:bg-gray-50 text-gray-700 rounded-full shadow-[0_4px_15px_rgba(0,0,0,0.08)] border border-gray-100 flex-shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>

          <div className="relative flex-1">
            <Input 
              type="text"
              placeholder="Search an area or address" 
              value={mapSearchQuery} 
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full bg-white text-gray-800 rounded-full pl-5 pr-14 h-11 border border-gray-100 shadow-[0_4px_15px_rgba(0,0,0,0.08)] font-medium text-xs focus:ring-2 focus:ring-[#FF5722] focus-visible:ring-[#FF5722]"
            />
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-gray-400">
              {searching && (
                <Loader2 className="w-4 h-4 animate-spin text-[#FF5722]" />
              )}
              {mapSearchQuery && (
                <button 
                  type="button"
                  onClick={() => {
                    setMapSearchQuery("");
                    setSearchResults([]);
                    setShowResultsDropdown(false);
                  }}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5 text-gray-500" />
                </button>
              )}
              {!searching && !mapSearchQuery && (
                <Search className="w-4 h-4 text-gray-400" />
              )}
            </div>

            {/* Autocomplete Search suggestions dropdown matching exact design */}
            {showResultsDropdown && searchResults.length > 0 && (
              <div className="absolute top-full mt-2.5 -left-[54px] right-0 bg-white rounded-[24px] shadow-[0_16px_45px_rgba(0,0,0,0.14)] border border-gray-100/80 p-2.5 z-50 max-h-[380px] overflow-y-auto divide-y divide-gray-50/50">
                {searchResults.slice(0, 3).map((result, idx) => {
                  let distanceDisplay = "";
                  if (result.lat && result.lng && mapCenter) {
                    const dist = calculateDistanceKm(mapCenter.lat, mapCenter.lng, result.lat, result.lng);
                    distanceDisplay = dist < 1 ? `${(dist * 1000).toFixed(0)} m` : `${dist.toFixed(1)} km`;
                  } else {
                    // Estimated distance for Google predictions
                    const estKm = (0.5 + idx * 0.7).toFixed(1);
                    distanceDisplay = `${estKm} km`;
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => selectSuggestion(result)}
                      className="w-full text-left px-3 py-3 hover:bg-gray-50/80 rounded-2xl transition-all flex items-center justify-between gap-3 cursor-pointer group"
                    >
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        <div className="w-10 h-10 rounded-full bg-[#FFF3EE] flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-5 h-5 text-[#FF5722]" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-gray-900 truncate leading-snug text-[14px]">
                            {result.main_text}
                          </p>
                          {result.secondary_text && (
                            <p className="text-[12px] text-gray-400 font-normal truncate mt-0.5 leading-tight">
                              {result.secondary_text}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-[12px] text-gray-400 font-medium whitespace-nowrap ml-2 flex-shrink-0">
                        {distanceDisplay}
                      </div>
                    </button>
                  );
                })}

                {/* Bottom row: "See more results for..." */}
                <button
                  type="button"
                  onClick={() => {
                    setShowResultsDropdown(false);
                    setSelectedSearchResultIndex(0);
                    setShowFullSearchResultsScreen(true);
                  }}
                  className="w-full pt-2 pb-1 px-3 text-left hover:bg-gray-50/80 rounded-xl transition-all cursor-pointer group flex items-center justify-between"
                >
                  <div className="flex items-center gap-3.5 py-2 text-gray-500 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center flex-shrink-0">
                      <Search className="w-5 h-5 text-gray-400 group-hover:text-[#FF5722] transition-colors" />
                    </div>
                    <span className="text-[13px] font-semibold text-gray-600 truncate group-hover:text-gray-900 transition-colors">
                      See more results for &ldquo;{mapSearchQuery}&rdquo;
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Card sheet */}
        <div className="absolute bottom-4 left-4 right-4 z-20 max-w-lg mx-auto">
          {/* Controls row positioned 9px directly above the bottom card */}
          <div className="relative flex items-center justify-center mb-[9px] w-full min-h-[48px]">
            {/* Center: Current location button */}
            {locationEnabled && (
              <button 
                onClick={requestLocation}
                disabled={geocoding}
                className="bg-white hover:bg-gray-50 text-gray-800 rounded-full py-2.5 px-5 shadow-[0_4px_15px_rgba(0,0,0,0.1)] border border-gray-100 flex items-center gap-2 text-xs font-extrabold transition-all active:scale-95 cursor-pointer"
              >
                {geocoding ? (
                  <Loader2 className="w-4 h-4 animate-spin text-[#FF5722]" />
                ) : (
                  <Compass className="w-4 h-4 text-[#FF5722]" />
                )}
                Current location
              </button>
            )}

            {/* Right: Floating Target (Locate Me) Button on Right Side */}
            <button
              onClick={snapToCurrentLocation}
              disabled={geocoding}
              className="absolute right-0 top-1/2 -translate-y-1/2 w-12 h-12 bg-white hover:bg-gray-50 rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.15)] border border-gray-100 flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
              id="gps-target-btn"
              title="Re-center to exact live location"
            >
              {geocoding ? (
                <Loader2 className="w-5 h-5 animate-spin text-[#FF5722]" />
              ) : (
                <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-[#FF5722]" xmlns="http://www.w3.org/2000/svg">
                  {/* Inner solid orange-red dot */}
                  <circle cx="12" cy="12" r="3" fill="#FF5722" />
                  
                  {/* Outer orange-red stroke circle */}
                  <circle cx="12" cy="12" r="6.5" stroke="#FF5722" strokeWidth="2" fill="none" />
                  
                  {/* 4 tick marks protruding from the outer circle */}
                  <line x1="12" y1="5.5" x2="12" y2="3" stroke="#FF5722" strokeWidth="2" strokeLinecap="round" />
                  <line x1="12" y1="18.5" x2="12" y2="21" stroke="#FF5722" strokeWidth="2" strokeLinecap="round" />
                  <line x1="5.5" y1="12" x2="3" y2="12" stroke="#FF5722" strokeWidth="2" strokeLinecap="round" />
                  <line x1="18.5" y1="12" x2="21" y2="12" stroke="#FF5722" strokeWidth="2" strokeLinecap="round" />
                </svg>
              )}
            </button>
          </div>

          {!locationEnabled ? (
            /* 1.jpg layout: Location Permissions / Turn on Device Location screen */
            <div className="bg-white p-5 rounded-[24px] border border-gray-100 shadow-[0_12px_40px_rgba(0,0,0,0.1)] space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <h3 className="text-sm font-extrabold text-gray-800 tracking-tight leading-tight">
                    Find your delivery location
                  </h3>
                  <p className="text-[10px] text-gray-500 font-medium leading-normal">
                    Turn on device location for faster, pinpoint address mapping and delivery options.
                  </p>
                </div>
                {/* Compass graphic */}
                <div className="w-12 h-12 rounded-full bg-orange-50 border border-orange-100 flex items-center justify-center flex-shrink-0 relative">
                  <span className="absolute inset-0 rounded-full bg-orange-400/10 animate-ping" />
                  <Compass className="w-6 h-6 text-[#FF5722]" />
                </div>
              </div>

              <Button 
                onClick={requestLocation}
                disabled={geocoding}
                className="w-full rounded-2xl bg-[#FF5722] hover:bg-[#F4511E] text-white font-extrabold text-xs h-11 shadow-md shadow-orange-500/10 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {geocoding ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Compass className="w-4 h-4" />
                )}
                Turn on device location
              </Button>
            </div>
          ) : (
            /* 2.jpg layout: Confirmed coordinates - displaying real geocoded address */
            <div className="bg-white rounded-[24px] border border-gray-100 shadow-[0_12px_40px_rgba(0,0,0,0.12)] overflow-hidden">
              {/* Grey sub-header: Order will be delivered here */}
              <div className="bg-gray-50 border-b border-gray-100/60 overflow-hidden relative h-9">
                <div 
                  className="absolute inset-x-0 top-0 flex flex-col transition-transform duration-500 ease-in-out"
                  style={{ transform: `translateY(-${carouselIndex * 36}px)` }}
                >
                  <div className="h-9 flex items-center px-5">
                    <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                      Order will be delivered here
                    </p>
                  </div>
                  <div className="h-9 flex items-center px-5">
                    <p className="text-[11px] font-bold text-[#FF5722] uppercase tracking-wider">
                      Place the pin at exact delivery location
                    </p>
                  </div>
                </div>
              </div>

              {/* Address details */}
              <div className="p-5 space-y-4">
                {isOutsideIndia ? (
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-3.5 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 text-red-600 mt-0.5">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-red-700 leading-tight">Service Unavailable</p>
                      <p className="text-[11px] font-medium text-red-600 mt-0.5 leading-snug">
                        Sorry, our services are currently available only within India.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center flex-shrink-0 border border-orange-100 mt-0.5">
                      <MapPin className="w-5 h-5 text-[#FF5722] fill-[#FF5722]/10" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className={`min-w-0 transition-opacity duration-200 ${geocoding ? "opacity-60" : "opacity-100"}`}>
                        <p className="font-extrabold text-gray-900 text-sm leading-tight truncate">
                          {detectedArea || "Selected Area"}
                        </p>
                        <p className="text-[11px] text-gray-500 font-semibold mt-1 leading-relaxed">
                          {geocoding ? "Locating pinned address..." : (fullAddress.trim() || "Location selected. Press Confirm to fill details.")}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-1">
                  <Button 
                    onClick={() => setAddressStep("form")}
                    disabled={geocoding || isOutsideIndia}
                    className="w-full rounded-2xl bg-[#FF5722] hover:bg-[#F4511E] disabled:bg-gray-300 disabled:text-gray-500 disabled:opacity-80 text-white font-extrabold text-xs h-11 shadow-md shadow-orange-500/10 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                  >
                    {geocoding && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Confirm & proceed
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </APIProvider>
    );
  }

  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY} version="weekly" libraries={["places", "geocoding"]}>
      <div className="min-h-screen bg-[#faf8fc] pb-12 relative overflow-x-hidden">
      {/* Decorative Blur Blobs */}
      <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-primary/5 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute top-40 left-0 w-[200px] h-[200px] bg-indigo-500/5 rounded-full blur-[60px] pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-purple-100/60 shadow-[0_2px_15px_-3px_rgba(155,81,224,0.03)]">
        <div className="container mx-auto px-4 py-2.5 flex items-center justify-between max-w-4xl gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-full hover:bg-purple-50 transition-colors flex-shrink-0" 
              onClick={() => {
                if (addressStep === "form") {
                  if (editingAddressId) {
                    setAddressStep("list");
                  } else {
                    setAddressStep("map");
                  }
                } else if (addressStep === "map") {
                  setAddressStep("list");
                } else {
                  if (window.history.length > 1) {
                    navigate(-1);
                  } else {
                    navigate("/buyer/profile");
                  }
                }
              }}
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </Button>

            {addressStep !== "form" && (
              <div>
                <h1 className="text-lg font-bold bg-gradient-primary bg-clip-text text-transparent">Addresses</h1>
              </div>
            )}

            {addressStep === "form" && (
              <div className="min-w-0">
                <h1 className="text-sm sm:text-base font-extrabold text-gray-900 leading-tight truncate">
                  {editingAddressId ? "Edit Address" : "Add New Address"}
                </h1>
                <p className="text-[10px] sm:text-xs text-gray-500 font-medium leading-tight truncate">
                  We&apos;ll use this address for faster and safer deliveries.
                </p>
              </div>
            )}
          </div>

          {addressStep === "list" && (
            <Button 
              onClick={openMapStep} 
              size="sm"
              className="rounded-full bg-gradient-primary hover:opacity-95 text-white font-semibold text-xs px-4 h-9 shadow-md shadow-primary/20 active:scale-95 transition-all gap-1 flex-shrink-0"
            >
              <Plus className="w-4 h-4" />
              Add New
            </Button>
          )}

          {addressStep === "form" && (
            <button 
              onClick={() => {
                setAddressStep("map");
                requestLocation();
              }}
              disabled={geocoding}
              className="bg-white hover:bg-gray-50 text-[#FF5722] rounded-full px-4 py-2 border border-gray-200/80 shadow-xs flex items-center gap-1.5 text-xs font-extrabold transition-all active:scale-95 cursor-pointer flex-shrink-0"
            >
              {geocoding ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#FF5722]" />
              ) : (
                <LocateFixed className="w-3.5 h-3.5 text-[#FF5722]" />
              )}
              <span>Use my location</span>
            </button>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-lg space-y-6 relative">
        {addressStep === "form" && (
          <div className="space-y-4 pb-8">
            {/* CARD 1: Address Type */}
            <div className="bg-white rounded-[24px] border border-gray-100 p-5 shadow-[0_4px_25px_rgba(0,0,0,0.03)] space-y-3">
              <div>
                <h3 className="text-sm font-extrabold text-gray-900">Address Type</h3>
                <p className="text-xs text-gray-400 font-medium mt-0.5">Choose a label for this address</p>
              </div>

              <div className="grid grid-cols-4 gap-2.5">
                {[
                  { id: "Home", label: "Home", icon: Home },
                  { id: "Work", label: "Work", icon: Briefcase },
                  { id: "Parents' Home", label: "Parents' Home", icon: Users },
                  { id: "Other", label: "Other", icon: MoreHorizontal }
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = selectedAddressType === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedAddressType(item.id)}
                      className={`py-3 px-1.5 rounded-2xl flex flex-col items-center justify-center gap-2 border transition-all cursor-pointer ${
                        isSelected 
                          ? "bg-[#FFF3EE] border-2 border-[#FF5722] text-[#FF5722] font-bold shadow-xs" 
                          : "bg-white border-gray-200 hover:border-gray-300 text-gray-700 font-medium"
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isSelected ? "text-[#FF5722]" : "text-gray-500"}`} />
                      <span className="text-[11px] text-center leading-tight">{item.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Dedicated custom input for 'Other' selection */}
              {selectedAddressType === "Other" && (
                <div className="mt-3 bg-[#F8F9FA] rounded-2xl p-3 border border-orange-100 space-y-1">
                  <label className="text-[11px] font-bold text-gray-600 block">Custom Address Label</label>
                  <Input
                    type="text"
                    placeholder="Enter custom label (e.g. Friend's Flat, Gym, Studio)"
                    value={customAddressType}
                    onChange={(e) => setCustomAddressType(e.target.value)}
                    className="bg-white border-gray-200 text-xs font-bold text-gray-900 h-10 rounded-xl focus:border-[#FF5722]"
                  />
                </div>
              )}
            </div>

            {/* CARD 2: Receiver Details */}
            <div className="bg-white rounded-[24px] border border-gray-100 p-5 shadow-[0_4px_25px_rgba(0,0,0,0.03)] space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-gray-900">Receiver Details</h3>
                {!isEditingReceiver && (
                  <button 
                    type="button"
                    onClick={() => setIsEditingReceiver(true)}
                    className="text-xs font-extrabold text-[#FF5722] flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Edit
                  </button>
                )}
              </div>

              {isEditingReceiver ? (
                <div className="bg-[#F8F9FA] rounded-2xl p-4 border border-orange-200/80 space-y-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-600">Receiver Name</label>
                    <Input 
                      type="text"
                      value={receiverName}
                      onChange={(e) => setReceiverName(e.target.value)}
                      placeholder="Enter full name"
                      className="bg-white border-gray-200 text-xs font-bold text-gray-900 h-10 rounded-xl focus:border-[#FF5722]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-600">Receiver Phone Number</label>
                    <Input 
                      type="text"
                      value={receiverPhone}
                      onChange={(e) => setReceiverPhone(e.target.value)}
                      placeholder="Enter phone number"
                      className="bg-white border-gray-200 text-xs font-bold text-gray-900 h-10 rounded-xl focus:border-[#FF5722]"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsEditingReceiver(false)}
                      className="h-8 rounded-xl text-xs font-bold"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="button" 
                      onClick={() => {
                        if (!receiverName.trim() || !receiverPhone.trim()) {
                          toast.error("Please enter both receiver name and phone number");
                          return;
                        }
                        setIsEditingReceiver(false);
                        toast.success("Receiver details updated");
                      }}
                      className="h-8 rounded-xl text-xs font-bold bg-[#FF5722] hover:bg-[#F4511E] text-white"
                    >
                      Save Details
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="bg-[#F8F9FA] rounded-2xl p-3.5 border border-gray-100 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-[#FFE5DC] text-[#FF5722] font-black text-sm flex items-center justify-center flex-shrink-0">
                      {receiverName ? receiverName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() : "US"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-gray-900 text-sm truncate">{receiverName}</p>
                      <p className="text-xs text-gray-500 font-medium mt-0.5">{receiverPhone}</p>
                      <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 mt-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600/20" />
                        <span>Logged-in account details</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* CARD 3: Address Details */}
            <div className="bg-white rounded-[24px] border border-gray-100 p-5 shadow-[0_4px_25px_rgba(0,0,0,0.03)] space-y-4">
              <div className="flex items-center justify-between gap-1.5 w-full whitespace-nowrap">
                <div className="flex items-center gap-1.5 min-w-0">
                  <MapPin className="w-4 h-4 text-[#FF5722] flex-shrink-0" />
                  <h3 className="text-xs sm:text-sm font-extrabold text-gray-900 truncate">Address Details</h3>
                </div>
                <span className="bg-[#FFF3EE] text-[#FF5722] text-[9px] sm:text-[10px] font-bold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full border border-[#FFD3C4] flex-shrink-0">
                  Required for accurate delivery
                </span>
              </div>

              <div className="space-y-3">
                {/* Building / Floor */}
                <div className="bg-white rounded-2xl border border-gray-200/90 p-3 flex items-center gap-3 focus-within:border-[#FF5722] focus-within:ring-2 focus-within:ring-orange-500/10 transition-all">
                  <Building2 className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-gray-500">Building / Floor</p>
                    <input 
                      type="text"
                      placeholder="Flat No. B-12, Silver Springs Apartments"
                      value={buildingFloor}
                      onChange={(e) => setBuildingFloor(e.target.value)}
                      className="w-full bg-transparent text-xs font-semibold text-gray-900 focus:outline-none placeholder:text-gray-400 mt-0.5"
                    />
                  </div>
                </div>

                {/* Street (Recommended) */}
                <div className="bg-white rounded-2xl border border-gray-200/90 p-3 flex items-center gap-3 focus-within:border-[#FF5722] focus-within:ring-2 focus-within:ring-orange-500/10 transition-all">
                  <Milestone className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-gray-500">Street (Recommended)</p>
                    <input 
                      type="text"
                      placeholder="Khandwa Road, Near Shell Petrol Pump"
                      value={streetName}
                      onChange={(e) => setStreetName(e.target.value)}
                      className="w-full bg-transparent text-xs font-semibold text-gray-900 focus:outline-none placeholder:text-gray-400 mt-0.5"
                    />
                  </div>
                </div>

                {/* Split Area & Mini Map Card */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Left: Area / Locality */}
                  <div className="bg-white rounded-2xl border border-gray-200/90 p-3 space-y-1.5 focus-within:border-[#FF5722] transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] font-bold text-gray-500">Area / Locality</p>
                      </div>
                      <div className="flex items-start gap-1.5 mt-1">
                        <MapPin className="w-4 h-4 text-[#FF5722] flex-shrink-0 mt-0.5" />
                        <textarea 
                          rows={2}
                          value={form.address_line}
                          onChange={(e) => setForm({ ...form, address_line: e.target.value })}
                          placeholder="Enter Area / Locality address"
                          className="w-full bg-transparent text-xs font-bold text-gray-900 focus:outline-none resize-none leading-snug p-0 border-0"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right: Live Real-time Mini Map Preview */}
                  <div className="relative h-32 rounded-2xl overflow-hidden border border-gray-200/90 bg-gray-100 flex items-center justify-center shadow-inner">
                    <Map
                      key={`mini-map-${mapCenter.lat}-${mapCenter.lng}`}
                      center={mapCenter}
                      zoom={16}
                      minZoom={12}
                      maxZoom={20}
                      gestureHandling="none"
                      disableDefaultUI={true}
                      internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                      style={{ width: "100%", height: "100%" }}
                    />
                    {/* Center Pin Marker */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                      <div className="w-8 h-8 bg-[#FF5722] rounded-full flex items-center justify-center border-2 border-white shadow-md animate-bounce">
                        <MapPin className="w-4 h-4 text-white" />
                      </div>
                    </div>

                    <button 
                      type="button"
                      onClick={() => setAddressStep("map")}
                      className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-20 bg-white hover:bg-gray-50 text-gray-800 rounded-full py-1.5 px-3.5 shadow-md border border-gray-100 flex items-center gap-1.5 text-[11px] font-bold active:scale-95 transition-all cursor-pointer whitespace-nowrap"
                    >
                      <Target className="w-3.5 h-3.5 text-[#FF5722]" />
                      Change Pin
                    </button>
                  </div>
                </div>

                {/* Save address as dropdown */}
                <div className="bg-white rounded-2xl border border-gray-200/90 p-3 flex items-center justify-between gap-3 focus-within:border-[#FF5722]">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Bookmark className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-bold text-gray-500">Save address as</p>
                      <select
                        value={saveAddressAs}
                        onChange={(e) => setSaveAddressAs(e.target.value)}
                        className="w-full bg-transparent text-xs font-bold text-gray-900 focus:outline-none cursor-pointer py-0.5 appearance-none pr-6"
                      >
                        {selectedAddressType === "Home" && (
                          <>
                            <option value="Home Address">Home Address</option>
                            <option value="Main Residence">Main Residence</option>
                          </>
                        )}
                        {selectedAddressType === "Work" && (
                          <>
                            <option value="Office Address">Office Address</option>
                            <option value="Workplace">Workplace</option>
                          </>
                        )}
                        {selectedAddressType === "Parents' Home" && (
                          <>
                            <option value="Parents' Home Address">Parents' Home Address</option>
                            <option value="Parent's House">Parent's House</option>
                          </>
                        )}
                        {selectedAddressType === "Other" && (
                          <option value={customAddressType.trim() ? `${customAddressType.trim()} Address` : "Custom Location Address"}>
                            {customAddressType.trim() ? `${customAddressType.trim()} Address` : "Custom Location Address"}
                          </option>
                        )}
                      </select>
                    </div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0 pointer-events-none" />
                </div>

                {/* Location Accuracy Banner */}
                <div className="bg-[#E8F5E9] border border-[#C8E6C9] rounded-2xl p-3 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-[#A5D6A7]/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Target className="w-4 h-4 text-[#2E7D32]" />
                  </div>
                  <div>
                    <p className="text-xs font-extrabold text-[#1B5E20]">Location Accuracy: Excellent</p>
                    <p className="text-[11px] font-medium text-[#2E7D32] mt-0.5 leading-snug">
                      Your delivery partner can easily find this address.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* CARD 4: Address Preferences */}
            <div className="bg-white rounded-[24px] border border-gray-100 p-5 shadow-[0_4px_25px_rgba(0,0,0,0.03)] space-y-3">
              <div>
                <h3 className="text-sm font-extrabold text-gray-900">Address Preferences</h3>
                <p className="text-xs text-gray-400 font-medium mt-0.5">These help us deliver better</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Default Address toggle */}
                <div className="bg-[#F8F9FA] rounded-2xl p-3.5 border border-gray-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-[#FFF3EE] text-[#FF5722] flex items-center justify-center flex-shrink-0">
                      <Star className="w-4 h-4 fill-[#FF5722]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-900">Set as default address</p>
                      <p className="text-[10px] text-gray-400 font-medium leading-tight mt-0.5">
                        This address will be used at checkout.
                      </p>
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setIsDefaultAddress(!isDefaultAddress)}
                    className={`w-11 h-6 rounded-full transition-colors p-0.5 flex items-center cursor-pointer flex-shrink-0 ${
                      isDefaultAddress ? "bg-[#FF5722]" : "bg-gray-300"
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                      isDefaultAddress ? "translate-x-5" : "translate-x-0"
                    }`} />
                  </button>
                </div>

                {/* Save to Account toggle */}
                <div className="bg-[#F8F9FA] rounded-2xl p-3.5 border border-gray-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-[#FFF3EE] text-[#FF5722] flex items-center justify-center flex-shrink-0">
                      <Cloud className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-900">Save for future use</p>
                      <p className="text-[10px] text-gray-400 font-medium leading-tight mt-0.5">
                        Access this address from all your devices.
                      </p>
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setSaveToAccount(!saveToAccount)}
                    className={`w-11 h-6 rounded-full transition-colors p-0.5 flex items-center cursor-pointer flex-shrink-0 ${
                      saveToAccount ? "bg-[#FF5722]" : "bg-gray-300"
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                      saveToAccount ? "translate-x-5" : "translate-x-0"
                    }`} />
                  </button>
                </div>
              </div>
            </div>

            {/* CARD 5: Delivery Instructions (Optional) */}
            <div className="bg-white rounded-[24px] border border-gray-100 p-5 shadow-[0_4px_25px_rgba(0,0,0,0.03)] space-y-3.5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-gray-900">
                  Delivery Instructions <span className="text-xs font-normal text-gray-400">(Optional)</span>
                </h3>
              </div>

              {/* Textarea Input Box */}
              <div className="bg-[#F8F9FA] rounded-2xl border border-gray-200/80 p-3">
                <textarea 
                  value={deliveryInstructions}
                  onChange={(e) => setDeliveryInstructions(e.target.value.slice(0, 120))}
                  placeholder="e.g. Gate No. 2, Ring the bell, Leave at the security desk etc."
                  rows={2}
                  className="w-full bg-transparent border-0 focus:outline-none text-xs font-medium text-gray-800 placeholder:text-gray-400 resize-none"
                />
                <p className="text-[10px] text-gray-400 font-medium text-right mt-1">
                  {deliveryInstructions.length}/120
                </p>
              </div>

              {/* Quick Tag Presets */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {[
                  { id: "door", label: "Leave at Door", icon: DoorOpen },
                  { id: "bell", label: "Ring Bell", icon: Bell },
                  { id: "call", label: "Call on Arrival", icon: PhoneCall },
                  { id: "lift", label: "Lift Available", icon: Building2 },
                  { id: "pets", label: "Pets at Home", icon: Dog }
                ].map((chip) => {
                  const ChipIcon = chip.icon;
                  const isActive = selectedPresetInstructions.includes(chip.id);
                  return (
                    <button
                      key={chip.id}
                      type="button"
                      onClick={() => togglePresetInstruction(chip.id, chip.label)}
                      className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 text-[11px] font-semibold whitespace-nowrap border transition-all cursor-pointer ${
                        isActive 
                          ? "bg-[#FFF3EE] border-[#FF5722] text-[#FF5722] font-bold" 
                          : "bg-[#F8F9FA] border-gray-200 text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <ChipIcon className={`w-3.5 h-3.5 ${isActive ? "text-[#FF5722]" : "text-gray-500"}`} />
                      <span>{chip.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom Sticky Action Bar */}
            <div className="pt-2">
              <button 
                type="button"
                onClick={handleSave}
                className="w-full rounded-2xl bg-[#FF5722] hover:bg-[#F4511E] text-white py-3.5 px-6 shadow-lg shadow-orange-500/20 active:scale-[0.98] transition-all flex flex-col items-center justify-center cursor-pointer"
              >
                <div className="flex items-center justify-center gap-2 text-sm font-extrabold tracking-wide">
                  <MapPin className="w-4 h-4 text-white" />
                  <span>{editingAddressId ? "Update Address" : "Save Address"}</span>
                </div>
              </button>
            </div>
          </div>
        )}

        {!initialLoadDone && addressStep === "list" ? (
          <div className="space-y-4">
            {[1, 2, 3].map((skeleton) => (
              <Card key={skeleton} className="p-5 rounded-[22px] border border-purple-50 bg-white flex justify-between items-start gap-4 animate-pulse">
                <div className="flex gap-4 items-start w-full">
                  <div className="w-11 h-11 bg-gray-200 rounded-xl flex-shrink-0" />
                  <div className="w-full space-y-2 mt-1">
                    <div className="h-4 bg-gray-200 rounded w-1/3" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : addresses.length === 0 && addressStep === "list" ? (
          <div className="flex flex-col items-center py-16 text-center bg-white rounded-3xl border border-purple-100/60 p-6 shadow-sm">
            <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mb-4 border border-purple-100/40">
              <MapIcon className="w-7 h-7 text-primary" />
            </div>
            <h2 className="text-base font-bold text-gray-800">No saved locations found</h2>
            <p className="text-xs text-muted-foreground mt-1.5 mb-6 max-w-xs">
              Add your delivery address to proceed with seamless order trackings and checkout experiences.
            </p>
            <Button 
              onClick={openMapStep} 
              className="rounded-full bg-gradient-primary hover:opacity-95 text-white text-xs font-semibold px-6 shadow-md shadow-primary/20 h-10 active:scale-95 transition-all"
            >
              Add Your First Address
            </Button>
          </div>
        ) : addressStep === "list" && (
          <div className="space-y-4">
            {addresses.map((addr) => {
              const addressLineLower = addr.address_line.toLowerCase();
              const isHome = addressLineLower.includes("home");
              const isWork = addressLineLower.includes("work") || addressLineLower.includes("office");

              return (
                <Card 
                  key={addr.id} 
                  className={`p-5 rounded-2xl border transition-all duration-300 flex flex-col gap-4 ${
                    addr.is_default 
                      ? "border-primary/40 bg-primary/[0.01] shadow-[0_4px_20px_rgba(155,81,224,0.05)]" 
                      : "border-gray-100 bg-white hover:border-gray-200 hover:shadow-[0_4px_20px_rgba(0,0,0,0.04)]"
                  }`}
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex gap-4 items-start min-w-0">
                      {/* Elegant Clean MapPin Icon Wrapper */}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border transition-all ${
                        addr.is_default 
                          ? "bg-primary/10 border-primary/20 text-primary" 
                          : "bg-gray-50 border-gray-100 text-gray-500"
                      }`}>
                        <MapPin className="w-5 h-5" />
                      </div>
                      
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1.5">
                          <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                            isHome 
                              ? "bg-blue-50 text-blue-600 border border-blue-100" 
                              : isWork 
                                ? "bg-amber-50 text-amber-600 border border-amber-100" 
                                : "bg-purple-50 text-primary border border-purple-100"
                          }`}>
                            {isHome ? "Home" : isWork ? "Work" : "Address"}
                          </span>

                          {addr.is_default && (
                            <span className="text-[9px] bg-primary/10 text-primary border border-primary/20 font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 uppercase tracking-wider">
                              <Star className="w-2.5 h-2.5 fill-current" />
                              Default
                            </span>
                          )}
                        </div>
                        
                        <h4 className="font-bold text-gray-800 text-sm leading-snug line-clamp-2">
                          {addr.address_line}
                        </h4>
                        
                        <p className="text-xs text-gray-500 font-medium mt-1">
                          {addr.city}, {addr.state} - {addr.pincode}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action buttons at the bottom of the card with simple separator */}
                  <div className="border-t border-gray-100/80 pt-3.5 flex items-center justify-between gap-2">
                    <div>
                      {!addr.is_default ? (
                        <button 
                          onClick={() => setDefault(addr.id)}
                          className="text-xs text-primary hover:text-primary/90 font-bold transition-all hover:underline"
                        >
                          Set as Default
                        </button>
                      ) : (
                        <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                          <ShieldCheck className="w-4 h-4" />
                          Default Delivery Address
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Edit Button */}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => startEdit(addr)}
                        title="Edit Address"
                        className="text-gray-400 hover:text-primary hover:bg-purple-50 hover:border-purple-100 border border-transparent rounded-full w-8 h-8 transition-all active:scale-90"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>

                      {/* Delete Button */}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDelete(addr.id)}
                        title="Delete Address"
                        className="text-gray-400 hover:text-destructive hover:bg-red-50 hover:border-red-100 border border-transparent rounded-full w-8 h-8 transition-all active:scale-90"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Support Note */}
        {addressStep === "list" && (
          <div className="text-center pt-2">
            <p className="text-[11px] text-muted-foreground font-medium flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Your delivery addresses are securely managed.
            </p>
          </div>
        )}
      </main>
    </div>
  </APIProvider>
  );
};

export default Addresses;
