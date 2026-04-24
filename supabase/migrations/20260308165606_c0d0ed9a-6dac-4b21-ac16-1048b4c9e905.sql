
-- Wallets table: one wallet per user
CREATE TABLE public.wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  balance numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Wallet transactions table
CREATE TABLE public.wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id uuid NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'credit',
  amount numeric NOT NULL DEFAULT 0,
  title text NOT NULL DEFAULT '',
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Wallets RLS
CREATE POLICY "Users can view own wallet" ON public.wallets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admin can view all wallets" ON public.wallets FOR SELECT USING (has_role(auth.uid(), 'admin'::user_role));
CREATE POLICY "Admin can insert wallets" ON public.wallets FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::user_role));
CREATE POLICY "Admin can update wallets" ON public.wallets FOR UPDATE USING (has_role(auth.uid(), 'admin'::user_role));

-- Wallet transactions RLS
CREATE POLICY "Users can view own transactions" ON public.wallet_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admin can view all transactions" ON public.wallet_transactions FOR SELECT USING (has_role(auth.uid(), 'admin'::user_role));
CREATE POLICY "Admin can insert transactions" ON public.wallet_transactions FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::user_role));

-- Trigger to auto-update updated_at on wallets
CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON public.wallets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
