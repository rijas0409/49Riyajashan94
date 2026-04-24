import { useState, useEffect } from "react";
import { MapPin, Truck, ChevronRight, Navigation, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface DeliveryDetailsCardProps {
  city: string;
  state: string;
}

interface Address {
  id: string;
  address_line: string;
  city: string;
  state: string;
  pincode: string;
  is_default: boolean;
}

const DeliveryDetailsCard = ({ city, state }: DeliveryDetailsCardProps) => {
  const [address, setAddress] = useState<Address | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [form, setForm] = useState({ address_line: "", city: "", state: "", pincode: "" });

  useEffect(() => {
    fetchDefaultAddress();
  }, []);

  const fetchDefaultAddress = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setLoading(false); return; }

    const { data } = await supabase
      .from("addresses")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("is_default", true)
      .single();

    if (data) {
      setAddress(data);
    } else {
      const { data: anyAddr } = await supabase
        .from("addresses")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      if (anyAddr) setAddress(anyAddr);
    }
    setLoading(false);
  };

  const openModal = () => {
    if (address) {
      setForm({
        address_line: address.address_line,
        city: address.city,
        state: address.state,
        pincode: address.pincode,
      });
    } else {
      setForm({ address_line: "", city: "", state: "", pincode: "" });
    }
    setShowModal(true);
  };

  const handleUseCurrentLocation = async () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
            { headers: { "Accept-Language": "en" } }
          );
          const data = await res.json();
          const addr = data.address || {};
          setForm({
            address_line: [addr.road, addr.neighbourhood, addr.suburb].filter(Boolean).join(", ") || data.display_name?.split(",").slice(0, 2).join(",") || "",
            city: addr.city || addr.town || addr.village || addr.county || "",
            state: addr.state || "",
            pincode: addr.postcode || "",
          });
          toast.success("Location fetched!");
        } catch {
          toast.error("Failed to get address from location");
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        setLocating(false);
        if (err.code === 1) toast.error("Location permission denied. Please allow location access.");
        else toast.error("Could not get your location");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSaveAddress = async () => {
    if (!form.address_line || !form.city || !form.state || !form.pincode) {
      toast.error("Please fill all fields");
      return;
    }
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setSaving(false); return; }

    if (address) {
      // Update existing
      const { data, error } = await supabase
        .from("addresses")
        .update({
          address_line: form.address_line,
          city: form.city,
          state: form.state,
          pincode: form.pincode,
        })
        .eq("id", address.id)
        .select()
        .single();
      if (error) {
        toast.error("Failed to update address");
      } else {
        setAddress(data);
        setShowModal(false);
        toast.success("Address updated!");
      }
    } else {
      // Insert new
      const { data, error } = await supabase
        .from("addresses")
        .insert({
          user_id: session.user.id,
          address_line: form.address_line,
          city: form.city,
          state: form.state,
          pincode: form.pincode,
          is_default: true,
        })
        .select()
        .single();
      if (error) {
        toast.error("Failed to save address");
      } else {
        setAddress(data);
        setShowModal(false);
        toast.success("Address saved!");
      }
    }
    setSaving(false);
  };

  const displayAddress = address
    ? `${address.address_line}, ${address.city}`
    : null;

  return (
    <>
      <div className="px-5 py-4">
        <h3 className="font-bold text-[17px] text-[#151B32] mb-3">Delivery Details</h3>
        <div className="rounded-2xl border border-[#ECECEC] bg-white overflow-hidden">
          {/* Delivery address row - always clickable to open modal */}
          <div
            className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-[#F9FAFB] transition-colors"
            onClick={openModal}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-[#E0E7FF] flex items-center justify-center">
                <MapPin className="w-4 h-4 text-[#818CF8]" />
              </div>
              <div>
                <p className="text-[9px] font-bold text-[#999] uppercase tracking-wider">DELIVERY ADDRESS</p>
                <p className="text-[12px] text-[#151B32]">
                  {displayAddress || "Tap to add delivery address"}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#999]" />
          </div>

          <div className="border-t border-[#F0F0F0] mx-4" />

          {/* Express delivery row */}
          <div className="flex items-center gap-2.5 px-4 py-3">
            <div className="w-9 h-9 rounded-lg bg-[#D1FAE5] flex items-center justify-center">
              <Truck className="w-4 h-4 text-[#10B981]" />
            </div>
            <div>
              <p className="text-[9px] font-bold text-[#10B981] uppercase tracking-wider">EXPRESS DELIVERY</p>
              <p className="text-[12px] text-[#151B32]">Arriving in 2 days</p>
            </div>
          </div>
        </div>
      </div>

      {/* Address Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40" onClick={() => setShowModal(false)}>
          <div
            className="w-full max-w-lg bg-white rounded-t-3xl p-5 pb-8 animate-in slide-in-from-bottom duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[18px] font-bold text-[#151B32]">
                {address ? "Edit Delivery Address" : "Add Delivery Address"}
              </h3>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-full bg-[#F3F4F6] flex items-center justify-center">
                <X className="w-4 h-4 text-[#6B7280]" />
              </button>
            </div>

            {/* Use Current Location */}
            <button
              onClick={handleUseCurrentLocation}
              disabled={locating}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-[#E0E7FF] bg-[#F0F4FF] mb-5 hover:bg-[#E0E7FF] transition-colors"
            >
              {locating ? (
                <Loader2 className="w-5 h-5 text-[#4F46E5] animate-spin" />
              ) : (
                <Navigation className="w-5 h-5 text-[#4F46E5]" />
              )}
              <span className="text-[14px] font-semibold text-[#4F46E5]">
                {locating ? "Fetching location..." : "Use Current Location"}
              </span>
            </button>

            {/* Form */}
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-[#6B7280]">Address Line *</Label>
                <Input
                  placeholder="House No., Street, Area"
                  value={form.address_line}
                  onChange={(e) => setForm({ ...form, address_line: e.target.value })}
                  className="rounded-xl h-11 text-sm mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-[#6B7280]">City *</Label>
                  <Input
                    placeholder="City"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="rounded-xl h-11 text-sm mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-[#6B7280]">State *</Label>
                  <Input
                    placeholder="State"
                    value={form.state}
                    onChange={(e) => setForm({ ...form, state: e.target.value })}
                    className="rounded-xl h-11 text-sm mt-1"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs text-[#6B7280]">Pincode *</Label>
                <Input
                  placeholder="400001"
                  value={form.pincode}
                  onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                  className="rounded-xl h-11 text-sm mt-1"
                />
              </div>
              <Button
                onClick={handleSaveAddress}
                disabled={saving}
                className="w-full h-12 rounded-xl text-[15px] font-bold mt-2"
                style={{ background: "linear-gradient(90deg, #FF4D6D, #8B5CF6)" }}
              >
                {saving ? "Saving..." : address ? "Update Address" : "Save Address"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DeliveryDetailsCard;
