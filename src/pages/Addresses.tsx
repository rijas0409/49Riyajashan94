import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Plus, MapPin, Trash2, Star } from "lucide-react";
import { toast } from "sonner";

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
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ address_line: "", city: "", state: "", pincode: "" });

  useEffect(() => { fetchAddresses(); }, []);

  const fetchAddresses = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate("/auth"); return; }

    const { data } = await supabase
      .from("addresses")
      .select("*")
      .eq("user_id", session.user.id)
      .order("is_default", { ascending: false });

    setAddresses(data || []);
    setLoading(false);
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
      toast.success("Address added");
      setForm({ address_line: "", city: "", state: "", pincode: "" });
      setShowForm(false);
      fetchAddresses();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("addresses").delete().eq("id", id);
    if (error) toast.error("Failed to delete");
    else { toast.success("Address deleted"); fetchAddresses(); }
  };

  const setDefault = async (id: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    await supabase.from("addresses").update({ is_default: false }).eq("user_id", session.user.id);
    await supabase.from("addresses").update({ is_default: true }).eq("id", id);
    toast.success("Default address updated");
    fetchAddresses();
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="rounded-full" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold">My Addresses</h1>
          </div>
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setShowForm(true)}>
            <Plus className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-lg space-y-4">
        {showForm && (
          <Card className="p-5 rounded-2xl border-0 shadow-sm space-y-3">
            <h3 className="font-semibold">Add New Address</h3>
            <Input placeholder="Address Line" value={form.address_line} onChange={(e) => setForm({ ...form, address_line: e.target.value })} className="rounded-xl" />
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="rounded-xl" />
              <Input placeholder="State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className="rounded-xl" />
            </div>
            <Input placeholder="Pincode" value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} className="rounded-xl" />
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowForm(false)} className="flex-1 rounded-xl">Cancel</Button>
              <Button onClick={handleAdd} className="flex-1 rounded-xl">Save</Button>
            </div>
          </Card>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : addresses.length === 0 && !showForm ? (
          <div className="flex flex-col items-center py-20 text-center">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
              <MapPin className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold mb-2">No addresses saved</h2>
            <p className="text-muted-foreground mb-6">Add your delivery address</p>
            <Button onClick={() => setShowForm(true)} className="rounded-2xl">Add Address</Button>
          </div>
        ) : (
          addresses.map((addr) => (
            <Card key={addr.id} className="p-4 rounded-2xl border-0 shadow-sm">
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{addr.address_line}</p>
                    {addr.is_default && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">Default</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{addr.city}, {addr.state} - {addr.pincode}</p>
                </div>
                <div className="flex flex-col gap-2">
                  {!addr.is_default && (
                    <button onClick={() => setDefault(addr.id)} className="text-muted-foreground hover:text-primary">
                      <Star className="w-4 h-4" />
                    </button>
                  )}
                  <button onClick={() => handleDelete(addr.id)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))
        )}
      </main>
    </div>
  );
};

export default Addresses;
