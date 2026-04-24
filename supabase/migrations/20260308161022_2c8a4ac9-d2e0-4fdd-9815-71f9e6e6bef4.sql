
-- Create banners table for admin-managed banners across the app
CREATE TABLE public.banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  subtitle text DEFAULT '',
  image_url text DEFAULT '',
  gradient text DEFAULT 'linear-gradient(135deg, #7c3aed, #a855f7, #ec4899)',
  cta_text text DEFAULT 'Shop Now',
  cta_link text DEFAULT '',
  location text NOT NULL DEFAULT 'shop_home',
  position integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

-- Anyone can view active banners (public facing)
CREATE POLICY "Anyone can view active banners"
ON public.banners FOR SELECT
USING (is_active = true);

-- Admin can view all banners
CREATE POLICY "Admin can view all banners"
ON public.banners FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::user_role));

-- Admin can insert banners
CREATE POLICY "Admin can insert banners"
ON public.banners FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::user_role));

-- Admin can update banners
CREATE POLICY "Admin can update banners"
ON public.banners FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::user_role));

-- Admin can delete banners
CREATE POLICY "Admin can delete banners"
ON public.banners FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::user_role));

-- Create storage bucket for banner images
INSERT INTO storage.buckets (id, name, public) VALUES ('banner-images', 'banner-images', true)
ON CONFLICT (id) DO NOTHING;

-- Public read access for banner images
CREATE POLICY "Anyone can view banner images"
ON storage.objects FOR SELECT
USING (bucket_id = 'banner-images');

-- Admin can upload banner images
CREATE POLICY "Admin can upload banner images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'banner-images' AND has_role(auth.uid(), 'admin'::user_role));

-- Admin can update banner images
CREATE POLICY "Admin can update banner images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'banner-images' AND has_role(auth.uid(), 'admin'::user_role));

-- Admin can delete banner images
CREATE POLICY "Admin can delete banner images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'banner-images' AND has_role(auth.uid(), 'admin'::user_role));
