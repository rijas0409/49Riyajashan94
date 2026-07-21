import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Plus, MapPin, Trash2, Star, ShieldCheck, Sparkles, Map as MapIcon, Search, Compass, Loader2, Locate, Pencil } from "lucide-react";
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
  
  const openMapStep = () => {
    setEditingAddressId(null);
    setForm({ address_line: "", city: "", state: "", pincode: "" });
    setLocationEnabled(true);
    setAddressStep("map");
  };

  // Map and Geolocation states
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: 28.6139, lng: 77.2090 }); // Default to Delhi, India
  const [mapZoom, setMapZoom] = useState(15);
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [gpsLocation, setGpsLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [geocoding, setGeocoding] = useState(false);
  const [mapSearchQuery, setMapSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResultsDropdown, setShowResultsDropdown] = useState(false);
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
      requestLocation();
    }
    
    if (addressStep === "map") {
      const interval = setInterval(() => {
        setCarouselIndex((prev) => (prev === 0 ? 1 : 0));
      }, 4900);
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addressStep]);

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
                const address_line = result.formatted_address;
                let city = "";
                let state = "";
                let pincode = "";

                for (const component of result.address_components) {
                  const types = component.types;
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
                resolveGoogle({ address_line, city, state, pincode });
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
            const address_line = data.display_name || `Location at ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
            const city = data.address.city || data.address.town || data.address.village || data.address.suburb || data.address.county || "";
            const state = data.address.state || "";
            const pincode = data.address.postcode || "";
            resolve({ address_line, city, state, pincode });
            return;
          }
        }
      } catch (nominatimErr) {
        console.error("Nominatim geocoder fallback failed:", nominatimErr);
      }

      // 3. Last resort coordinates-based address
      resolve({
        address_line: `Pinned Location (Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)})`,
        city: "Delhi",
        state: "Delhi",
        pincode: "110001"
      });
    });
  };

  const handleSearch = async (query: string) => {
    setMapSearchQuery(query);
    if (!query || query.length < 3) {
      setSearchResults([]);
      setShowResultsDropdown(false);
      return;
    }
    setSearching(true);
    
    if (!window.google || !window.google.maps || !window.google.maps.places) {
      setSearching(false);
      return;
    }

    try {
      const autocompleteService = new google.maps.places.AutocompleteService();
      autocompleteService.getPlacePredictions(
        { input: query, componentRestrictions: { country: "in" } },
        (predictions, status) => {
          setSearching(false);
          if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
            setSearchResults(predictions.map(p => ({
              display_name: p.description,
              place_id: p.place_id,
              main_text: p.structured_formatting?.main_text || p.description,
              secondary_text: p.structured_formatting?.secondary_text || ""
            })));
            setShowResultsDropdown(true);
          } else {
            setSearchResults([]);
          }
        }
      );
    } catch (err) {
      console.error("Autocomplete failed:", err);
      setSearching(false);
    }
  };

  const selectSuggestion = async (suggestion: any) => {
    setShowResultsDropdown(false);
    setMapSearchQuery(suggestion.display_name);
    setGeocoding(true);

    if (!window.google || !window.google.maps) {
      setGeocoding(false);
      return;
    }

    try {
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ placeId: suggestion.place_id }, async (results, status) => {
        if (status === "OK" && results && results[0]) {
          const location = results[0].geometry.location;
          const lat = location.lat();
          const lng = location.lng();
          
          skipNextGeocodeRef.current = true;
          setMapCenter({ lat, lng });
          setMapZoom(16);

          if (mapRef.current) {
            mapRef.current.panTo({ lat, lng });
            mapRef.current.setZoom(16);
          }

          const address_line = results[0].formatted_address;
          let city = "";
          let state = "";
          let pincode = "";

          for (const component of results[0].address_components) {
            const types = component.types;
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

          const matched = matchCityAndState(city, state);
          setForm({
            address_line,
            city: matched.city || city,
            state: matched.state || state,
            pincode: pincode
          });
          setLocationEnabled(true);
        } else {
          toast.error("Could not find coordinates for this location");
        }
        setGeocoding(false);
      });
    } catch (err) {
      console.error("Select suggestion geocode failed:", err);
      setGeocoding(false);
    }
  };

  const requestLocation = () => {
    setGeocoding(true);

    if (!navigator.geolocation) {
      setGeocoding(false);
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    // Increased timeout to 10s and maximumAge: 0 to force a clean, highly accurate real-time read from GPS
    const options = { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setGpsLocation({ lat, lng });
        setMapCenter({ lat, lng });
        if (mapRef.current) {
          skipNextGeocodeRef.current = true;
          mapRef.current.panTo({ lat, lng });
          mapRef.current.setZoom(16);
        }
        setLocationEnabled(true);
        toast.success("Exact live location detected!");

        const result = await reverseGeocode(lat, lng);
        setGeocoding(false);
        if (result) {
          const matched = matchCityAndState(result.city, result.state);
          setForm({
            address_line: result.address_line,
            city: matched.city || result.city,
            state: matched.state || result.state,
            pincode: result.pincode
          });
        }
      },
      async (error) => {
        console.warn("High accuracy geolocation failed or timed out. Trying standard precision...", error);
        
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            setGpsLocation({ lat, lng });
            setMapCenter({ lat, lng });
            if (mapRef.current) {
              skipNextGeocodeRef.current = true;
              mapRef.current.panTo({ lat, lng });
              mapRef.current.setZoom(16);
            }
            setLocationEnabled(true);
            toast.success("Live location detected!");

            const result = await reverseGeocode(lat, lng);
            setGeocoding(false);
            if (result) {
              const matched = matchCityAndState(result.city, result.state);
              setForm({
                address_line: result.address_line,
                city: matched.city || result.city,
                state: matched.state || result.state,
                pincode: result.pincode
              });
            }
          },
          async (error2) => {
            console.error("Standard precision geolocation failed too:", error2);
            // Try IP-based location lookup in real-time seamlessly!
            try {
              console.log("Attempting IP-based geolocation fallback...");
              const ipResponse = await fetch("https://ipapi.co/json/");
              if (ipResponse.ok) {
                const ipData = await ipResponse.json();
                if (ipData && ipData.latitude && ipData.longitude) {
                  const lat = ipData.latitude;
                  const lng = ipData.longitude;
                  setGpsLocation({ lat, lng });
                  setMapCenter({ lat, lng });
                  if (mapRef.current) {
                    skipNextGeocodeRef.current = true;
                    mapRef.current.panTo({ lat, lng });
                    mapRef.current.setZoom(14);
                  }
                  setLocationEnabled(true);
                  const result = await reverseGeocode(lat, lng);
                  setGeocoding(false);
                  if (result) {
                    const matched = matchCityAndState(result.city, result.state);
                    setForm({
                      address_line: result.address_line,
                      city: matched.city || result.city,
                      state: matched.state || result.state,
                      pincode: result.pincode
                    });
                  }
                  toast.success("Approximate location detected from network!");
                  return;
                }
              }
            } catch (ipErr) {
              console.error("IP geolocation failed too:", ipErr);
            }

            // Fallback to default delhi map center but still enable location so they see the address card
            const lat = mapCenter.lat || 28.6139;
            const lng = mapCenter.lng || 77.2090;
            setLocationEnabled(true);
            const result = await reverseGeocode(lat, lng);
            setGeocoding(false);
            if (result) {
              const matched = matchCityAndState(result.city, result.state);
              setForm({
                address_line: result.address_line,
                city: matched.city || result.city,
                state: matched.state || result.state,
                pincode: result.pincode
              });
            }
            toast.info("Using default location. You can search or drag the map to select your address.");
          },
          { enableHighAccuracy: false, timeout: 5000, maximumAge: 0 }
        );
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
    if (!form.address_line || !form.city || !form.state || !form.pincode) {
      toast.error("Please fill all fields");
      return;
    }
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    if (editingAddressId) {
      // Edit mode
      const { error } = await supabase
        .from("addresses")
        .update({
          address_line: form.address_line,
          city: form.city,
          state: form.state,
          pincode: form.pincode
        })
        .eq("id", editingAddressId);

      if (error) {
        toast.error("Failed to update address");
      } else {
        toast.success("Address updated successfully");
        setForm({ address_line: "", city: "", state: "", pincode: "" });
        setEditingAddressId(null);
        setAddressStep("list");
        fetchAddresses();
      }
    } else {
      // Add mode
      const { error } = await supabase.from("addresses").insert({
        ...form,
        user_id: session.user.id,
        is_default: addresses.length === 0,
      });

      if (error) {
        toast.error("Failed to add address");
      } else {
        toast.success("Address added successfully");
        setForm({ address_line: "", city: "", state: "", pincode: "" });
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
    toast.success("Default delivery location updated");
    fetchAddresses();
  };

  // Real Map layout if user is on "map" step
  if (addressStep === "map") {
    const detectedArea = form.address_line ? form.address_line.split(',')[0].trim() : "Custom Pinned Location";
    const fullAddress = `${form.address_line || ""}${form.city ? `, ${form.city}` : ""}${form.state ? `, ${form.state}` : ""}${form.pincode ? ` ${form.pincode}` : ""}`;
    const isMovedAway = gpsLocation && (
      Math.abs(mapCenter.lat - gpsLocation.lat) > 0.00015 ||
      Math.abs(mapCenter.lng - gpsLocation.lng) > 0.00015
    );

    return (
      <APIProvider apiKey={GOOGLE_MAPS_API_KEY} version="weekly" libraries={["places", "geocoding"]}>
        <MapUpdater mapRef={mapRef} />
        <div className="fixed inset-0 z-50 bg-gray-50 flex flex-col overflow-hidden">
          {/* Real Google Map */}
          <div className="w-full h-full absolute inset-0 z-0 overflow-hidden">
            <Map
              center={mapCenter}
              zoom={mapZoom}
              minZoom={5}
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
              onDragend={() => {
                setLocationEnabled(true);
              }}
              onIdle={() => {
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
                    if (result) {
                      const matched = matchCityAndState(result.city, result.state);
                      setForm({
                        address_line: result.address_line,
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
              className="w-full bg-white text-gray-800 rounded-full pl-5 pr-12 h-11 border border-gray-100 shadow-[0_4px_15px_rgba(0,0,0,0.08)] font-medium text-xs focus:ring-2 focus:ring-primary focus-visible:ring-primary"
            />
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
              {searching ? (
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </div>

            {/* Autocomplete Search suggestions dropdown */}
            {showResultsDropdown && searchResults.length > 0 && (
              <div className="absolute top-full mt-2 left-0 right-0 bg-white rounded-[20px] shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-purple-50/60 p-2 z-30 max-h-60 overflow-y-auto">
                {searchResults.map((result, idx) => (
                  <button
                    key={idx}
                    onClick={() => selectSuggestion(result)}
                    className="w-full text-left px-4 py-3 hover:bg-purple-50/50 rounded-xl transition-colors flex items-start gap-3 text-xs text-gray-700 border-b border-gray-50 last:border-0"
                  >
                    <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <MapPin className="w-4 h-4 text-[#FF5722]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-gray-900 truncate leading-normal">{result.main_text}</p>
                      {result.secondary_text && (
                        <p className="text-[10px] text-gray-500 truncate mt-0.5 leading-normal">{result.secondary_text}</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Floating Target (Locate Me) Button on Right Side */}
        <button
          onClick={snapToCurrentLocation}
          disabled={geocoding}
          className="absolute right-4 bottom-[280px] sm:bottom-[310px] z-30 w-12 h-12 bg-white hover:bg-gray-50 rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.15)] border border-gray-100 flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
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
              {/* Top tick */}
              <line x1="12" y1="5.5" x2="12" y2="3" stroke="#FF5722" strokeWidth="2" strokeLinecap="round" />
              {/* Bottom tick */}
              <line x1="12" y1="18.5" x2="12" y2="21" stroke="#FF5722" strokeWidth="2" strokeLinecap="round" />
              {/* Left tick */}
              <line x1="5.5" y1="12" x2="3" y2="12" stroke="#FF5722" strokeWidth="2" strokeLinecap="round" />
              {/* Right tick */}
              <line x1="18.5" y1="12" x2="21" y2="12" stroke="#FF5722" strokeWidth="2" strokeLinecap="round" />
            </svg>
          )}
        </button>

        {/* Bottom Card sheet */}
        <div className="absolute bottom-4 left-4 right-4 z-20 max-w-lg mx-auto">
          {locationEnabled && (
            /* Floating "Current location" Button directly above bottom card */
            <div className="flex justify-center mb-3">
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
            </div>
          )}

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

                <div className="flex gap-2.5 pt-1">
                  <Button 
                    onClick={() => setLocationEnabled(false)}
                    variant="outline"
                    className="rounded-2xl border-gray-200 hover:bg-gray-50 text-gray-500 font-bold text-xs h-11 px-5"
                  >
                    Change
                  </Button>
                  <Button 
                    onClick={() => setAddressStep("form")}
                    disabled={geocoding}
                    className="flex-1 rounded-2xl bg-[#FF5722] hover:bg-[#F4511E] disabled:bg-orange-400 disabled:opacity-80 text-white font-extrabold text-xs h-11 shadow-md shadow-orange-500/10 active:scale-95 transition-all flex items-center justify-center gap-1.5"
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
    <div className="min-h-screen bg-[#faf8fc] pb-12 relative overflow-x-hidden">
      {/* Decorative Blur Blobs */}
      <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-primary/5 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute top-40 left-0 w-[200px] h-[200px] bg-indigo-500/5 rounded-full blur-[60px] pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-purple-100/60 shadow-[0_2px_15px_-3px_rgba(155,81,224,0.03)]">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between max-w-4xl">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-full hover:bg-purple-50 transition-colors" 
              onClick={() => {
                if (window.history.length > 1) {
                  navigate(-1);
                } else {
                  navigate("/buyer/profile");
                }
              }}
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </Button>
            <div>
              <h1 className="text-lg font-bold bg-gradient-primary bg-clip-text text-transparent">Addresses</h1>
            </div>
          </div>
          {addressStep === "list" && (
            <Button 
              onClick={openMapStep} 
              size="sm"
              className="rounded-full bg-gradient-primary hover:opacity-95 text-white font-semibold text-xs px-4 h-9 shadow-md shadow-primary/20 active:scale-95 transition-all gap-1"
            >
              <Plus className="w-4 h-4" />
              Add New
            </Button>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-lg space-y-6 relative">
        {addressStep === "form" && (
          <Card className="p-5 rounded-[24px] border border-purple-100/80 shadow-[0_8px_30px_rgb(155,81,224,0.04)] bg-white space-y-4">
            <div className="flex justify-between items-center pb-1">
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                {editingAddressId ? "Edit Saved Address" : "Add New Address"}
              </h3>
              <button 
                onClick={() => {
                  setAddressStep("list");
                  setEditingAddressId(null);
                  setForm({ address_line: "", city: "", state: "", pincode: "" });
                }}
                className="text-xs text-gray-400 hover:text-gray-600 font-semibold"
              >
                Cancel
              </button>
            </div>

            <div className="space-y-3.5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Street Address</label>
                <Input 
                  placeholder="House No., Street name, Area, Landmark" 
                  value={form.address_line} 
                  onChange={(e) => setForm({ ...form, address_line: e.target.value })} 
                  className="rounded-xl border-purple-100 bg-white h-11 text-sm focus:ring-2 focus:ring-primary focus:border-transparent" 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">State</label>
                  <Input 
                    placeholder="e.g. Haryana, Delhi" 
                    value={form.state} 
                    onChange={(e) => setForm({ ...form, state: e.target.value })} 
                    className="rounded-xl border-purple-100 bg-white h-11 text-sm focus:ring-2 focus:ring-primary focus:border-transparent font-medium" 
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">City</label>
                  <Input 
                    placeholder="e.g. Gurugram, New Delhi" 
                    value={form.city} 
                    onChange={(e) => setForm({ ...form, city: e.target.value })} 
                    className="rounded-xl border-purple-100 bg-white h-11 text-sm focus:ring-2 focus:ring-primary focus:border-transparent font-medium" 
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Pincode / ZIP</label>
                <Input 
                  placeholder="6 Digit PIN code" 
                  value={form.pincode} 
                  onChange={(e) => setForm({ ...form, pincode: e.target.value })} 
                  className="rounded-xl border-purple-100 bg-white h-11 text-sm focus:ring-2 focus:ring-primary focus:border-transparent" 
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button 
                variant="outline" 
                onClick={() => setAddressStep("map")} 
                disabled={!!editingAddressId}
                className="flex-1 rounded-xl text-xs h-10 border-gray-200 hover:bg-gray-50 font-semibold disabled:opacity-50"
              >
                Back to Map
              </Button>
              <Button 
                onClick={handleSave} 
                className="flex-1 rounded-xl text-xs h-10 bg-primary hover:bg-primary/95 text-white font-semibold shadow-md shadow-primary/10"
              >
                {editingAddressId ? "Update Address" : "Save Location"}
              </Button>
            </div>
          </Card>
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
  );
};

export default Addresses;
