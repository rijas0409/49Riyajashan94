import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Wallet, ArrowUpRight, ArrowDownLeft, Plus, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const WalletPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [balance, setBalance] = useState<number>(0);
  const [walletId, setWalletId] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isAddMoneyOpen, setIsAddMoneyOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const load = async () => {
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
      setTransactions(txs || []);
    }
    setLoading(false);
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
        let newBalance = balance + numAmount;
        
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
      } catch (error: any) {
        toast({ title: "Payment Failed", description: error.message, variant: "destructive" });
      } finally {
        setIsProcessing(false);
      }
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">Wallet</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-lg space-y-6">
        <Card className="p-6 rounded-2xl border-0 bg-gradient-primary text-white">
          <p className="text-sm opacity-80">Available Balance</p>
          <h2 className="text-3xl font-bold mt-1">₹{balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</h2>
          <Button 
            variant="secondary" 
            size="sm" 
            className="mt-4 rounded-xl gap-2 text-primary"
            onClick={() => setIsAddMoneyOpen(true)}
          >
            <Plus className="w-4 h-4" /> Add Money
          </Button>
        </Card>

        <div>
          <h3 className="font-semibold mb-3">Recent Transactions</h3>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-3">
                <Wallet className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx: any) => (
                <Card key={tx.id} className="p-4 rounded-2xl border-0 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === "credit" ? "bg-green-100" : "bg-red-100"}`}>
                      {tx.type === "credit" ? (
                        <ArrowDownLeft className="w-5 h-5 text-green-600" />
                      ) : (
                        <ArrowUpRight className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{tx.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(tx.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                    <span className={`font-bold text-sm ${tx.type === "credit" ? "text-green-600" : "text-destructive"}`}>
                      {tx.type === "credit" ? "+" : "-"}₹{tx.amount}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        <Dialog open={isAddMoneyOpen} onOpenChange={setIsAddMoneyOpen}>
          <DialogContent className="sm:max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle>Add Money to Wallet</DialogTitle>
              <DialogDescription>
                Enter the amount you want to add. You will be redirected to a secure payment gateway.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Input
                  type="number"
                  placeholder="Enter amount (e.g. 500)"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={isProcessing}
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {[100, 500, 1000, 2000].map((quickAmount) => (
                  <Button
                    key={quickAmount}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setAmount(quickAmount.toString())}
                    disabled={isProcessing}
                  >
                    +₹{quickAmount}
                  </Button>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button 
                onClick={handleAddMoney} 
                disabled={!amount || isProcessing}
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Redirecting to Gateway...
                  </>
                ) : (
                  'Proceed to Pay'
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
