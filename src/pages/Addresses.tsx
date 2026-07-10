import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Plus, MapPin, Trash2, Star, ShieldCheck, Sparkles, Map } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "@/contexts/LocationContext";

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
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ address_line: "", city: "", state: "", pincode: "" });

  useEffect(() => { 
    fetchAddresses(); 
  }, []);

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
    }
  };

  const handleAdd = async () => {
    if (!form.address_line || !form.city || !form.state || !form.pincode) {
      toast.error("Please fill all fields");
      return;
    }
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

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
      setShowForm(false);
      fetchAddresses();
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
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </Button>
            <div>
              <h1 className="text-lg font-bold bg-gradient-primary bg-clip-text text-transparent">Delivery Addresses</h1>
              <p className="text-[10px] text-muted-foreground font-medium">Manage locations for your pet deliveries</p>
            </div>
          </div>
          {!showForm && (
            <Button 
              onClick={() => setShowForm(true)} 
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
        {showForm && (
          <Card className="p-5 rounded-[24px] border border-purple-100/80 shadow-[0_8px_30px_rgb(155,81,224,0.04)] bg-white space-y-4">
            <div className="flex justify-between items-center pb-1">
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                Add New Address
              </h3>
              <button 
                onClick={() => setShowForm(false)}
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
                  <div className="relative">
                    <select
                      value={form.state}
                      onChange={(e) => setForm({ ...form, state: e.target.value, city: "" })}
                      className="w-full rounded-xl border border-purple-100 bg-white h-11 px-3 text-xs focus:ring-2 focus:ring-primary focus:border-transparent appearance-none font-medium cursor-pointer"
                    >
                      <option value="">Select State</option>
                      {uniqueStates.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-400">
                      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                        <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">City</label>
                  <div className="relative">
                    <select
                      value={form.city}
                      disabled={!form.state}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                      className="w-full rounded-xl border border-purple-100 bg-white h-11 px-3 text-xs focus:ring-2 focus:ring-primary focus:border-transparent appearance-none font-medium disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <option value="">
                        {form.state ? "Select City" : "Select State First"}
                      </option>
                      {cities
                        .filter((c) => c.state === form.state)
                        .map((c) => (
                          <option key={c.id} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                    </select>
                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-400">
                      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                        <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                      </svg>
                    </div>
                  </div>
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
                onClick={() => setShowForm(false)} 
                className="flex-1 rounded-xl text-xs h-10 border-gray-200 hover:bg-gray-50 font-semibold"
              >
                Discard
              </Button>
              <Button 
                onClick={handleAdd} 
                className="flex-1 rounded-xl text-xs h-10 bg-primary hover:bg-primary/95 text-white font-semibold shadow-md shadow-primary/10"
              >
                Save Location
              </Button>
            </div>
          </Card>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : addresses.length === 0 && !showForm ? (
          <div className="flex flex-col items-center py-16 text-center bg-white rounded-3xl border border-purple-100/60 p-6 shadow-sm">
            <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mb-4 border border-purple-100/40">
              <Map className="w-7 h-7 text-primary" />
            </div>
            <h2 className="text-base font-bold text-gray-800">No saved locations found</h2>
            <p className="text-xs text-muted-foreground mt-1.5 mb-6 max-w-xs">
              Add your delivery address to proceed with seamless order trackings and checkout experiences.
            </p>
            <Button 
              onClick={() => setShowForm(true)} 
              className="rounded-full bg-primary hover:bg-primary/95 text-white text-xs font-semibold px-6 shadow-md shadow-primary/20 h-10"
            >
              Add Your First Address
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {addresses.map((addr) => (
              <Card 
                key={addr.id} 
                className="p-5 rounded-[22px] border border-purple-50 bg-white hover:border-purple-100 hover:shadow-md transition-all flex justify-between items-start gap-4"
              >
                <div className="flex gap-4 items-start min-w-0">
                  <div className="w-11 h-11 bg-purple-50/70 rounded-xl flex items-center justify-center flex-shrink-0 border border-purple-100/40">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-gray-800 text-sm truncate leading-tight">{addr.address_line}</p>
                      {addr.is_default && (
                        <span className="text-[9px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full border border-primary/20">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1.5 font-medium">
                      {addr.city}, {addr.state} - {addr.pincode}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  {!addr.is_default && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setDefault(addr.id)}
                      className="text-xs text-primary hover:text-primary hover:bg-purple-50 rounded-full h-8 px-2.5 font-bold"
                    >
                      Make Default
                    </Button>
                  )}
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleDelete(addr.id)}
                    className="text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full w-8 h-8 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Support Note */}
        <div className="text-center pt-2">
          <p className="text-[11px] text-muted-foreground font-medium flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Your delivery addresses are securely managed.
          </p>
        </div>
      </main>
    </div>
  );
};

export default Addresses;
