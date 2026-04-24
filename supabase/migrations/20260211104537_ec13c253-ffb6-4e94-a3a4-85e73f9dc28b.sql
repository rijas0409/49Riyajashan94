
-- Add product_seller to user_role enum
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'product_seller';

-- Create shop_products table
CREATE TABLE public.shop_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  brand TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL,
  pet_type TEXT NOT NULL,
  price NUMERIC NOT NULL,
  original_price NUMERIC,
  discount INTEGER DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  weight TEXT,
  variants JSONB DEFAULT '[]'::jsonb,
  images TEXT[] DEFAULT '{}'::text[],
  is_active BOOLEAN DEFAULT true,
  verification_status public.verification_status DEFAULT 'pending',
  priority_verification BOOLEAN DEFAULT false,
  priority_fee_paid BOOLEAN DEFAULT false,
  total_sold INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shop_products ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Anyone can view verified active products"
  ON public.shop_products FOR SELECT
  USING (
    (is_active = true AND verification_status = 'verified')
    OR (auth.uid() = seller_id)
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Product sellers can insert own products"
  ON public.shop_products FOR INSERT
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Product sellers can update own products"
  ON public.shop_products FOR UPDATE
  USING (auth.uid() = seller_id);

CREATE POLICY "Product sellers can delete own products"
  ON public.shop_products FOR DELETE
  USING (auth.uid() = seller_id);

CREATE POLICY "Admin can update any product"
  ON public.shop_products FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_shop_products_updated_at
  BEFORE UPDATE ON public.shop_products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true)
  ON CONFLICT (id) DO NOTHING;

-- Storage policies for product images
CREATE POLICY "Anyone can view product images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

CREATE POLICY "Product sellers can upload product images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'product-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Product sellers can update own product images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'product-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Product sellers can delete own product images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'product-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add product_seller profile fields (reusing existing columns: gst_number)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gst_number TEXT;
