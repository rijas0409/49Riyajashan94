import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search, Eye, ShoppingBag, Clock, Wallet, User, PawPrint, Package,
  Stethoscope, ArrowDownLeft, ArrowUpRight, TrendingUp, Activity
} from "lucide-react";

interface BuyerProfile {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  profile_photo: string | null;
  created_at: string | null;
}

const AdminBuyers = () => {
  const [buyers, setBuyers] = useState<BuyerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedBuyer, setSelectedBuyer] = useState<BuyerProfile | null>(null);
  const [buyerActivity, setBuyerActivity] = useState<any[]>([]);
  const [buyerOrders, setBuyerOrders] = useState<any[]>([]);
  const [buyerWallet, setBuyerWallet] = useState<{ balance: number; transactions: any[] } | null>(null);
  const [buyerVetBookings, setBuyerVetBookings] = useState<any[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => { fetchBuyers(); }, []);

  const fetchBuyers = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("id, name, email, phone, profile_photo, created_at")
      .eq("role", "buyer")
      .order("created_at", { ascending: false });
    setBuyers((data || []) as BuyerProfile[]);
    setLoading(false);
  };

  const openBuyerDetail = async (buyer: BuyerProfile) => {
    setSelectedBuyer(buyer);
    setDetailLoading(true);

    const [activityRes, ordersRes, walletRes, vetRes] = await Promise.all([
      supabase
        .from("buyer_activity")
        .select("*")
        .eq("user_id", buyer.id)
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("orders")
        .select("*, pet:pets(name, breed, images)")
        .eq("buyer_id", buyer.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("wallets")
        .select("*")
        .eq("user_id", buyer.id)
        .maybeSingle(),
      supabase
        .from("vet_appointments")
        .select("*")
        .eq("user_id", buyer.id)
        .order("created_at", { ascending: false }),
    ]);

    setBuyerActivity(activityRes.data || []);
    setBuyerOrders(ordersRes.data || []);
    setBuyerVetBookings(vetRes.data || []);

    if (walletRes.data) {
      const { data: txs } = await supabase
        .from("wallet_transactions")
        .select("*")
        .eq("wallet_id", walletRes.data.id)
        .order("created_at", { ascending: false });
      setBuyerWallet({ balance: walletRes.data.balance, transactions: txs || [] });
    } else {
      setBuyerWallet(null);
    }

    setDetailLoading(false);
  };

  const filtered = buyers.filter((b) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (b.name?.toLowerCase().includes(s)) || (b.email?.toLowerCase().includes(s)) || (b.phone?.includes(s));
  });

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  const entityIcon = (type: string) => {
    if (type === "pet") return <PawPrint className="w-4 h-4" />;
    if (type === "product") return <Package className="w-4 h-4" />;
    if (type === "vet") return <Stethoscope className="w-4 h-4" />;
    return <Eye className="w-4 h-4" />;
  };

  const entityColor = (type: string) => {
    if (type === "pet") return "bg-amber-100 text-amber-700";
    if (type === "product") return "bg-blue-100 text-blue-700";
    if (type === "vet") return "bg-pink-100 text-pink-700";
    return "bg-gray-100 text-gray-700";
  };

  // Compute behavior summary for selected buyer
  const petViews = buyerActivity.filter(a => a.entity_type === "pet").length;
  const productViews = buyerActivity.filter(a => a.entity_type === "product").length;
  const vetViews = buyerActivity.filter(a => a.entity_type === "vet").length;
  const avgTimeOnPets = petViews > 0 ? Math.round(buyerActivity.filter(a => a.entity_type === "pet").reduce((s, a) => s + (a.duration_seconds || 0), 0) / petViews) : 0;
  const avgTimeOnProducts = productViews > 0 ? Math.round(buyerActivity.filter(a => a.entity_type === "product").reduce((s, a) => s + (a.duration_seconds || 0), 0) / productViews) : 0;
  const totalSpent = buyerOrders.reduce((s, o) => s + (o.amount || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[hsl(220,20%,15%)]">Buyer Analytics</h2>
        <p className="text-sm text-[hsl(220,15%,55%)]">Track buyer behavior, purchases, wallet & activity — Admin only, encrypted access</p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(220,15%,55%)]" />
        <Input placeholder="Search by name, email, phone..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 rounded-xl border-[hsl(220,20%,90%)]" />
      </div>

      {/* Buyers List */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(220,80%,50%)]" /></div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 border-0 shadow-sm rounded-2xl text-center">
          <User className="w-12 h-12 mx-auto text-[hsl(220,15%,75%)] mb-3" />
          <p className="text-[hsl(220,15%,55%)]">No buyers found</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((b) => (
            <Card key={b.id} className="p-4 border-0 shadow-sm rounded-2xl hover:shadow-md transition-shadow cursor-pointer" onClick={() => openBuyerDetail(b)}>
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-full overflow-hidden bg-[hsl(220,80%,50%)] flex items-center justify-center shrink-0">
                  {b.profile_photo ? (
                    <img src={b.profile_photo} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white font-bold text-sm">{b.name?.[0]?.toUpperCase() || "B"}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate text-[hsl(220,20%,15%)]">{b.name}</p>
                  <p className="text-xs text-[hsl(220,15%,55%)] truncate">{b.email} {b.phone ? `• ${b.phone}` : ""}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">Buyer</span>
                  <Eye className="w-4 h-4 text-[hsl(220,15%,65%)]" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selectedBuyer} onOpenChange={() => setSelectedBuyer(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-[hsl(220,80%,50%)] flex items-center justify-center shrink-0">
                {selectedBuyer?.profile_photo ? (
                  <img src={selectedBuyer.profile_photo} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white font-bold text-lg">{selectedBuyer?.name?.[0]?.toUpperCase() || "B"}</span>
                )}
              </div>
              <div>
                <p className="text-lg">{selectedBuyer?.name}</p>
                <p className="text-xs font-normal text-[hsl(220,15%,55%)]">{selectedBuyer?.email} {selectedBuyer?.phone ? `• ${selectedBuyer.phone}` : ""}</p>
              </div>
            </DialogTitle>
          </DialogHeader>

          {detailLoading ? (
            <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(220,80%,50%)]" /></div>
          ) : (
            <div className="p-6 pt-4 space-y-5">
              {/* Behavior Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Card className="p-3 border-0 shadow-sm rounded-xl text-center">
                  <PawPrint className="w-5 h-5 mx-auto text-amber-500 mb-1" />
                  <p className="text-lg font-bold text-[hsl(220,20%,15%)]">{petViews}</p>
                  <p className="text-[10px] text-[hsl(220,15%,55%)]">Pet Views</p>
                </Card>
                <Card className="p-3 border-0 shadow-sm rounded-xl text-center">
                  <Package className="w-5 h-5 mx-auto text-blue-500 mb-1" />
                  <p className="text-lg font-bold text-[hsl(220,20%,15%)]">{productViews}</p>
                  <p className="text-[10px] text-[hsl(220,15%,55%)]">Product Views</p>
                </Card>
                <Card className="p-3 border-0 shadow-sm rounded-xl text-center">
                  <Stethoscope className="w-5 h-5 mx-auto text-pink-500 mb-1" />
                  <p className="text-lg font-bold text-[hsl(220,20%,15%)]">{vetViews}</p>
                  <p className="text-[10px] text-[hsl(220,15%,55%)]">Vet Views</p>
                </Card>
                <Card className="p-3 border-0 shadow-sm rounded-xl text-center">
                  <ShoppingBag className="w-5 h-5 mx-auto text-emerald-500 mb-1" />
                  <p className="text-lg font-bold text-[hsl(220,20%,15%)]">₹{totalSpent.toLocaleString("en-IN")}</p>
                  <p className="text-[10px] text-[hsl(220,15%,55%)]">Total Spent</p>
                </Card>
              </div>

              {/* Avg Time */}
              <div className="flex gap-4 flex-wrap">
                <div className="flex items-center gap-2 text-xs text-[hsl(220,15%,45%)]">
                  <Clock className="w-3.5 h-3.5" /> Avg time on Pets: <span className="font-semibold">{formatDuration(avgTimeOnPets)}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[hsl(220,15%,45%)]">
                  <Clock className="w-3.5 h-3.5" /> Avg time on Products: <span className="font-semibold">{formatDuration(avgTimeOnProducts)}</span>
                </div>
              </div>

              <Tabs defaultValue="activity" className="w-full">
                <TabsList className="w-full rounded-xl bg-[hsl(220,20%,95%)]">
                  <TabsTrigger value="activity" className="flex-1 rounded-lg text-xs">Activity Log</TabsTrigger>
                  <TabsTrigger value="orders" className="flex-1 rounded-lg text-xs">Orders</TabsTrigger>
                  <TabsTrigger value="vet" className="flex-1 rounded-lg text-xs">Vet Bookings</TabsTrigger>
                  <TabsTrigger value="wallet" className="flex-1 rounded-lg text-xs">Wallet</TabsTrigger>
                </TabsList>

                {/* Activity Tab */}
                <TabsContent value="activity" className="mt-4 space-y-2 max-h-[350px] overflow-y-auto">
                  {buyerActivity.length === 0 ? (
                    <p className="text-center text-sm text-[hsl(220,15%,55%)] py-8">No activity recorded yet</p>
                  ) : buyerActivity.map((a) => (
                    <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl bg-[hsl(220,20%,97%)]">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${entityColor(a.entity_type)}`}>
                        {entityIcon(a.entity_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">{a.entity_name || a.entity_id}</p>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-[hsl(220,20%,92%)] text-[hsl(220,15%,50%)] shrink-0 uppercase">{a.entity_type}</span>
                        </div>
                        <p className="text-xs text-[hsl(220,15%,55%)]">
                          {new Date(a.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="flex items-center gap-1 text-xs font-semibold text-[hsl(220,20%,15%)]">
                          <Clock className="w-3 h-3" /> {formatDuration(a.duration_seconds || 0)}
                        </div>
                      </div>
                    </div>
                  ))}
                </TabsContent>

                {/* Orders Tab */}
                <TabsContent value="orders" className="mt-4 space-y-2 max-h-[350px] overflow-y-auto">
                  {buyerOrders.length === 0 ? (
                    <p className="text-center text-sm text-[hsl(220,15%,55%)] py-8">No orders yet</p>
                  ) : buyerOrders.map((o) => (
                    <div key={o.id} className="flex items-center gap-3 p-3 rounded-xl bg-[hsl(220,20%,97%)]">
                      <div className="w-9 h-9 rounded-lg overflow-hidden bg-[hsl(220,20%,92%)] shrink-0">
                        {o.pet?.images?.[0] ? (
                          <img src={o.pet.images[0]} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <ShoppingBag className="w-4 h-4 m-auto mt-2.5 text-[hsl(220,15%,65%)]" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{o.pet?.name || "Order"} {o.pet?.breed ? `(${o.pet.breed})` : ""}</p>
                        <p className="text-xs text-[hsl(220,15%,55%)]">{new Date(o.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-sm text-[hsl(220,20%,15%)]">₹{o.amount?.toLocaleString("en-IN")}</p>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${o.status === "delivered" ? "bg-emerald-100 text-emerald-700" : o.status === "cancelled" ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-700"}`}>
                          {o.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </TabsContent>

                {/* Vet Bookings Tab */}
                <TabsContent value="vet" className="mt-4 space-y-2 max-h-[350px] overflow-y-auto">
                  {buyerVetBookings.length === 0 ? (
                    <p className="text-center text-sm text-[hsl(220,15%,55%)] py-8">No vet bookings yet</p>
                  ) : buyerVetBookings.map((v) => (
                    <div key={v.id} className="flex items-center gap-3 p-3 rounded-xl bg-[hsl(220,20%,97%)]">
                      <div className="w-9 h-9 rounded-full bg-pink-100 flex items-center justify-center shrink-0">
                        <Stethoscope className="w-4 h-4 text-pink-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{v.pet_name} ({v.pet_type})</p>
                        <p className="text-xs text-[hsl(220,15%,55%)]">{v.appointment_date} • {v.appointment_time} • {v.appointment_type}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-sm text-[hsl(220,20%,15%)]">₹{v.amount}</p>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${v.status === "completed" ? "bg-emerald-100 text-emerald-700" : v.status === "cancelled" ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-700"}`}>
                          {v.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </TabsContent>

                {/* Wallet Tab */}
                <TabsContent value="wallet" className="mt-4 space-y-3">
                  <Card className="p-4 rounded-xl border-0 bg-gradient-to-r from-[hsl(220,80%,50%)] to-[hsl(260,70%,55%)] text-white">
                    <p className="text-xs opacity-80">Wallet Balance</p>
                    <p className="text-2xl font-bold mt-1">₹{buyerWallet?.balance?.toLocaleString("en-IN") || "0"}</p>
                  </Card>
                  <div className="space-y-2 max-h-[250px] overflow-y-auto">
                    {(!buyerWallet || buyerWallet.transactions.length === 0) ? (
                      <p className="text-center text-sm text-[hsl(220,15%,55%)] py-6">No wallet transactions</p>
                    ) : buyerWallet.transactions.map((tx: any) => (
                      <div key={tx.id} className="flex items-center gap-3 p-3 rounded-xl bg-[hsl(220,20%,97%)]">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${tx.type === "credit" ? "bg-emerald-100" : "bg-red-100"}`}>
                          {tx.type === "credit" ? <ArrowDownLeft className="w-4 h-4 text-emerald-600" /> : <ArrowUpRight className="w-4 h-4 text-red-500" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{tx.title}</p>
                          <p className="text-xs text-[hsl(220,15%,55%)]">{new Date(tx.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</p>
                        </div>
                        <span className={`font-bold text-sm ${tx.type === "credit" ? "text-emerald-600" : "text-red-500"}`}>
                          {tx.type === "credit" ? "+" : "-"}₹{tx.amount}
                        </span>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminBuyers;
