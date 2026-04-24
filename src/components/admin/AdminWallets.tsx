import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Wallet, Search, ArrowDownLeft, ArrowUpRight, Eye, IndianRupee, Users } from "lucide-react";
import { toast } from "sonner";

interface WalletRow {
  id: string;
  user_id: string;
  balance: number;
  created_at: string;
  profile?: { name: string; email: string; role: string; phone: string; profile_photo: string | null };
}

interface TxRow {
  id: string;
  wallet_id: string;
  user_id: string;
  type: string;
  amount: number;
  title: string;
  description: string | null;
  created_at: string;
}

const ROLE_LABELS: Record<string, string> = {
  buyer: "Buyer",
  seller: "Breeder",
  product_seller: "Product Seller",
  vet: "Vet",
  delivery_partner: "Delivery",
  admin: "Admin",
};

const AdminWallets = () => {
  const [wallets, setWallets] = useState<WalletRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedWallet, setSelectedWallet] = useState<WalletRow | null>(null);
  const [transactions, setTransactions] = useState<TxRow[]>([]);
  const [txLoading, setTxLoading] = useState(false);

  useEffect(() => { fetchWallets(); }, []);

  const fetchWallets = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("wallets")
      .select("*, profile:profiles!wallets_user_id_fkey(name, email, role, phone, profile_photo)")
      .order("balance", { ascending: false });
    if (!error && data) setWallets(data as any);
    setLoading(false);
  };

  const openWalletDetail = async (w: WalletRow) => {
    setSelectedWallet(w);
    setTxLoading(true);
    const { data } = await supabase
      .from("wallet_transactions")
      .select("*")
      .eq("wallet_id", w.id)
      .order("created_at", { ascending: false });
    setTransactions((data || []) as TxRow[]);
    setTxLoading(false);
  };

  const filtered = wallets.filter((w) => {
    const name = w.profile?.name?.toLowerCase() || "";
    const email = w.profile?.email?.toLowerCase() || "";
    const phone = w.profile?.phone?.toLowerCase() || "";
    const matchSearch = !search || name.includes(search.toLowerCase()) || email.includes(search.toLowerCase()) || phone.includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || w.profile?.role === roleFilter;
    return matchSearch && matchRole;
  });

  const totalBalance = wallets.reduce((s, w) => s + (w.balance || 0), 0);
  const roles = ["all", "buyer", "seller", "product_seller", "vet", "delivery_partner"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[hsl(220,20%,15%)]">Wallet Management</h2>
          <p className="text-sm text-[hsl(220,15%,55%)]">View all user wallets and transaction history</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 border-0 shadow-sm rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-100 flex items-center justify-center">
              <IndianRupee className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-[hsl(220,15%,55%)] font-medium">Total Balance (All Wallets)</p>
              <p className="text-xl font-bold text-[hsl(220,20%,15%)]">₹{totalBalance.toLocaleString("en-IN")}</p>
            </div>
          </div>
        </Card>
        <Card className="p-5 border-0 shadow-sm rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-[hsl(220,15%,55%)] font-medium">Active Wallets</p>
              <p className="text-xl font-bold text-[hsl(220,20%,15%)]">{wallets.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-5 border-0 shadow-sm rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-purple-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-[hsl(220,15%,55%)] font-medium">With Balance {'>'} ₹0</p>
              <p className="text-xl font-bold text-[hsl(220,20%,15%)]">{wallets.filter(w => w.balance > 0).length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(220,15%,55%)]" />
          <Input placeholder="Search by name, email, phone..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 rounded-xl border-[hsl(220,20%,90%)]" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {roles.map((r) => (
            <Button key={r} variant={roleFilter === r ? "default" : "outline"} size="sm" className={`rounded-xl text-xs ${roleFilter === r ? "bg-[hsl(220,80%,50%)] text-white" : ""}`} onClick={() => setRoleFilter(r)}>
              {r === "all" ? "All" : ROLE_LABELS[r] || r}
            </Button>
          ))}
        </div>
      </div>

      {/* Wallets List */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(220,80%,50%)]" /></div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 border-0 shadow-sm rounded-2xl text-center">
          <Wallet className="w-12 h-12 mx-auto text-[hsl(220,15%,75%)] mb-3" />
          <p className="text-[hsl(220,15%,55%)]">No wallets found</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((w) => (
            <Card key={w.id} className="p-4 border-0 shadow-sm rounded-2xl hover:shadow-md transition-shadow cursor-pointer" onClick={() => openWalletDetail(w)}>
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-full overflow-hidden bg-[hsl(220,80%,50%)] flex items-center justify-center shrink-0">
                  {w.profile?.profile_photo ? (
                    <img src={w.profile.profile_photo} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white font-bold text-sm">{w.profile?.name?.[0]?.toUpperCase() || "U"}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm truncate text-[hsl(220,20%,15%)]">{w.profile?.name || "Unknown"}</p>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[hsl(220,20%,94%)] text-[hsl(220,15%,45%)] font-medium shrink-0">
                      {ROLE_LABELS[w.profile?.role || ""] || w.profile?.role}
                    </span>
                  </div>
                  <p className="text-xs text-[hsl(220,15%,55%)] truncate">{w.profile?.email} {w.profile?.phone ? `• ${w.profile.phone}` : ""}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`font-bold text-lg ${w.balance > 0 ? "text-emerald-600" : "text-[hsl(220,20%,15%)]"}`}>₹{w.balance.toLocaleString("en-IN")}</p>
                </div>
                <Eye className="w-4 h-4 text-[hsl(220,15%,65%)] shrink-0" />
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Transaction Detail Dialog */}
      <Dialog open={!!selectedWallet} onOpenChange={() => setSelectedWallet(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-[hsl(220,80%,50%)] flex items-center justify-center shrink-0">
                {selectedWallet?.profile?.profile_photo ? (
                  <img src={selectedWallet.profile.profile_photo} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white font-bold">{selectedWallet?.profile?.name?.[0]?.toUpperCase() || "U"}</span>
                )}
              </div>
              <div>
                <p className="text-base">{selectedWallet?.profile?.name}</p>
                <p className="text-xs font-normal text-[hsl(220,15%,55%)]">
                  {ROLE_LABELS[selectedWallet?.profile?.role || ""] || selectedWallet?.profile?.role} • {selectedWallet?.profile?.email}
                </p>
              </div>
            </DialogTitle>
          </DialogHeader>

          <Card className="p-4 rounded-xl border-0 bg-gradient-to-r from-[hsl(220,80%,50%)] to-[hsl(260,70%,55%)] text-white">
            <p className="text-xs opacity-80">Wallet Balance</p>
            <p className="text-2xl font-bold mt-1">₹{selectedWallet?.balance?.toLocaleString("en-IN") || "0"}</p>
          </Card>

          <div>
            <h4 className="font-semibold text-sm mb-3 text-[hsl(220,20%,15%)]">Transaction History</h4>
            {txLoading ? (
              <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[hsl(220,80%,50%)]" /></div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-8">
                <Wallet className="w-10 h-10 mx-auto text-[hsl(220,15%,75%)] mb-2" />
                <p className="text-sm text-[hsl(220,15%,55%)]">No transactions yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {transactions.map((tx) => (
                  <div key={tx.id} className="flex items-center gap-3 p-3 rounded-xl bg-[hsl(220,20%,97%)]">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center ${tx.type === "credit" ? "bg-emerald-100" : "bg-red-100"}`}>
                      {tx.type === "credit" ? <ArrowDownLeft className="w-4 h-4 text-emerald-600" /> : <ArrowUpRight className="w-4 h-4 text-red-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{tx.title}</p>
                      <p className="text-xs text-[hsl(220,15%,55%)]">{new Date(tx.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                    </div>
                    <span className={`font-bold text-sm ${tx.type === "credit" ? "text-emerald-600" : "text-red-500"}`}>
                      {tx.type === "credit" ? "+" : "-"}₹{tx.amount.toLocaleString("en-IN")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminWallets;
