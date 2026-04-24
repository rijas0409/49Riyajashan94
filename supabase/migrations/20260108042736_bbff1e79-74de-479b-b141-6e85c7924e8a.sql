-- Create wishlist table for pets
CREATE TABLE public.wishlist_pets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, pet_id)
);

-- Create wishlist table for products (for future use)
CREATE TABLE public.wishlist_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  product_image TEXT,
  product_price NUMERIC,
  pet_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- Enable RLS
ALTER TABLE public.wishlist_pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist_products ENABLE ROW LEVEL SECURITY;

-- RLS Policies for wishlist_pets
CREATE POLICY "Users can view their own pet wishlist" 
ON public.wishlist_pets FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can add to their pet wishlist" 
ON public.wishlist_pets FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove from their pet wishlist" 
ON public.wishlist_pets FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies for wishlist_products
CREATE POLICY "Users can view their own product wishlist" 
ON public.wishlist_products FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can add to their product wishlist" 
ON public.wishlist_products FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove from their product wishlist" 
ON public.wishlist_products FOR DELETE 
USING (auth.uid() = user_id);