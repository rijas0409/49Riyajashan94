import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Wallet, ArrowUpRight, ArrowDownLeft, Plus, Loader2, ShieldCheck, TrendingUp, HelpCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: "credit" | "debit";
  created_at: string;
}

const WalletPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [balance, setBalance] = useState<number>(0);
  const [walletId, setWalletId] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isAddMoneyOpen, setIsAddMoneyOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const load = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }
      const uid = session.user.id;

      const { data: wallet } = await supabase.from("wallets").select("*").eq("user_id", uid).maybeSingle();
      if (wallet) {
        setBalance(wallet.balance || 0);
        setWalletId(wallet.id);
        const { data: txs } = await supabase
          .from("wallet_transactions")
          .select("*")
          .eq("wallet_id", wallet.id)
          .order("created_at", { ascending: false });
        setTransactions((txs as unknown as Transaction[]) || []);
      }
    } catch (err) {
      console.error("Failed to load wallet data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleAddMoney = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast({ title: "Invalid Amount", description: "Please enter a valid amount.", variant: "destructive" });
      return;
    }

    setIsProcessing(true);
    
    // Simulate payment gateway delay
    setTimeout(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("Not authenticated");
        
        let currentWalletId = walletId;
        const newBalance = balance + numAmount;
        
        if (!currentWalletId) {
          const { data: newWallet, error: createError } = await supabase
            .from("wallets")
            .insert({ user_id: session.user.id, balance: numAmount })
            .select()
            .single();
            
          if (createError) throw createError;
          currentWalletId = newWallet.id;
        } else {
          const { error: updateError } = await supabase
            .from("wallets")
            .update({ balance: newBalance })
            .eq("id", currentWalletId);
            
          if (updateError) throw updateError;
        }
        
        const { error: txError } = await supabase
          .from("wallet_transactions")
          .insert({
            wallet_id: currentWalletId,
            user_id: session.user.id,
            amount: numAmount,
            type: "credit",
            title: "Added Money to Wallet",
            description: "Added via simulated payment gateway"
          });
          
        if (txError) throw txError;
        
        setBalance(newBalance);
        setWalletId(currentWalletId);
        setIsAddMoneyOpen(false);
        setAmount("");
        toast({ title: "Payment Successful", description: `₹${numAmount} added to your wallet.` });
        
        // Refresh transactions
        load();
      } catch (error: unknown) {
        const errMsg = error instanceof Error ? error.message : "An error occurred";
        toast({ title: "Payment Failed", description: errMsg, variant: "destructive" });
      } finally {
        setIsProcessing(false);
      }
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-[#faf8fc] pb-12 relative overflow-x-hidden">
      {/* Dynamic Background Blur Blobs */}
      <div className="absolute top-0 right-0 w-[350px] h-[350px] bg-primary/5 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute top-40 left-0 w-[250px] h-[250px] bg-indigo-500/5 rounded-full blur-[60px] pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-purple-100/60 shadow-[0_2px_15px_-3px_rgba(155,81,224,0.03)]">
        <div className="container mx-auto px-4 py-3 flex items-center gap-4 max-w-4xl">
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full hover:bg-purple-50 transition-colors" 
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </Button>
          <div>
            <h1 className="text-lg font-bold bg-gradient-primary bg-clip-text text-transparent">Sruvo Wallet</h1>
            <p className="text-[10px] text-muted-foreground font-medium">Quick checkout, instant refunds & seamless payments</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-lg space-y-6 relative">
        {/* Glow Wallet Balance Card */}
        <Card className="p-6 rounded-[24px] border-0 bg-gradient-primary text-white shadow-xl shadow-purple-500/15 relative overflow-hidden">
          <div className="absolute top-[-20%] right-[-10%] w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-[-10%] left-[-10%] w-32 h-32 bg-indigo-500/10 rounded-full blur-xl pointer-events-none" />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-white/80">Available Sruvo Balance</span>
              <Wallet className="w-5 h-5 text-white/90" />
            </div>
            <h2 className="text-3xl font-extrabold mt-2.5 tracking-tight">
              ₹{balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </h2>
            
            <div className="flex gap-3 mt-6">
              <Button 
                variant="secondary" 
                size="sm" 
                className="rounded-full gap-1.5 px-5 h-10 text-xs font-bold bg-white text-primary hover:bg-white/95 active:scale-95 transition-all shadow-md"
                onClick={() => setIsAddMoneyOpen(true)}
              >
                <Plus className="w-4 h-4" /> Add Funds
              </Button>
              <div className="flex items-center gap-1.5 text-[11px] text-white/80 font-medium ml-auto">
                <TrendingUp className="w-3.5 h-3.5" /> 
                100% Secure
              </div>
            </div>
          </div>
        </Card>

        {/* Transaction History Section */}
        <div>
          <div className="flex items-center justify-between mb-3.5">
            <h3 className="text-sm font-bold text-gray-800">Transaction History</h3>
            <span className="text-[10px] bg-purple-100/60 text-primary font-bold px-2 py-0.5 rounded-full">
              {transactions.length} Activity
            </span>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center bg-white rounded-3xl border border-purple-100/60 p-6 shadow-sm">
              <div className="w-14 h-14 bg-purple-50 rounded-full flex items-center justify-center mb-4 border border-purple-100/40">
                <Wallet className="w-6 h-6 text-primary" />
              </div>
              <p className="text-sm font-bold text-gray-800">No transaction records found</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
                Your pocket is empty. Add funds to start your next order instantly!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => (
                <Card 
                  key={tx.id} 
                  className="p-4 rounded-[18px] border border-purple-50 bg-white hover:border-purple-100/60 hover:shadow-sm transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      tx.type === "credit" ? "bg-emerald-50 border border-emerald-100" : "bg-red-50 border border-red-100"
                    }`}>
                      {tx.type === "credit" ? (
                        <ArrowDownLeft className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <ArrowUpRight className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-gray-800 truncate leading-tight">{tx.title}</p>
                      <p className="text-[10px] text-muted-foreground mt-1 font-semibold">
                        {new Date(tx.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <span className={`font-bold text-sm ${tx.type === "credit" ? "text-emerald-600" : "text-red-500"}`}>
                      {tx.type === "credit" ? "+" : "-"}₹{tx.amount}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Security / Info Badge */}
        <div className="text-center pt-2">
          <p className="text-[11px] text-muted-foreground font-semibold flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Wallet balance is fully insured and managed securely.
          </p>
        </div>

        {/* Add Money Dialog */}
        <Dialog open={isAddMoneyOpen} onOpenChange={setIsAddMoneyOpen}>
          <DialogContent className="sm:max-w-md rounded-[24px] border border-purple-100 shadow-xl bg-white p-6">
            <DialogHeader className="space-y-1.5">
              <DialogTitle className="text-base font-bold text-gray-800">Add Money to Wallet</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Fund your Sruvo Wallet via secure, instant UPI or Netbanking. Enter amount below:
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-3">
              <div className="relative">
                <span className="absolute inset-y-0 left-4 flex items-center text-lg font-bold text-gray-400">₹</span>
                <Input
                  type="number"
                  placeholder="Enter amount (e.g. 500)"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={isProcessing}
                  className="rounded-xl border-purple-100 bg-white pl-8 h-12 text-sm focus:ring-2 focus:ring-primary focus:border-transparent font-bold"
                />
              </div>

              <div className="flex gap-2 flex-wrap">
                {[100, 500, 1000, 2000].map((quickAmount) => (
                  <Button
                    key={quickAmount}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1 rounded-full border-purple-100 hover:bg-purple-50 text-xs font-semibold text-primary transition-all h-9"
                    onClick={() => setAmount(quickAmount.toString())}
                    disabled={isProcessing}
                  >
                    +₹{quickAmount}
                  </Button>
                ))}
              </div>
            </div>

            <DialogFooter className="sm:justify-start gap-2">
              <Button 
                onClick={handleAddMoney} 
                disabled={!amount || isProcessing}
                className="w-full rounded-xl bg-primary hover:bg-primary/95 text-white font-bold h-11 text-xs shadow-md shadow-primary/20"
              >
                {isProcessing ? (
                  <span className="flex items-center gap-2 justify-center">
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                    Redirecting to Secure Gateway...
                  </span>
                ) : (
                  'Proceed to Payment'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default WalletPage;
