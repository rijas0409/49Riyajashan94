
CREATE TABLE public.product_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.shop_products(id) ON DELETE CASCADE,
  product_name text NOT NULL,
  product_image text,
  product_price numeric NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  total_amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.product_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyers can view own product orders"
  ON public.product_orders FOR SELECT
  USING (auth.uid() = buyer_id);

CREATE POLICY "Buyers can create product orders"
  ON public.product_orders FOR INSERT
  WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Admin can view all product orders"
  ON public.product_orders FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can update product orders"
  ON public.product_orders FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));
