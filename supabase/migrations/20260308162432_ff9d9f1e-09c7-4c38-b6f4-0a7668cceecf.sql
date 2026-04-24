
ALTER TABLE public.banners
  ADD COLUMN IF NOT EXISTS target_route text NOT NULL DEFAULT '/',
  ADD COLUMN IF NOT EXISTS banner_style text NOT NULL DEFAULT 'full_width',
  ADD COLUMN IF NOT EXISTS custom_width text DEFAULT '100%',
  ADD COLUMN IF NOT EXISTS custom_height text DEFAULT '160px',
  ADD COLUMN IF NOT EXISTS placement text NOT NULL DEFAULT 'top',
  ADD COLUMN IF NOT EXISTS border_radius text DEFAULT '16px',
  ADD COLUMN IF NOT EXISTS link_url text DEFAULT '';

-- Update existing banners with proper target_routes
UPDATE public.banners SET target_route = '/shop', banner_style = 'carousel' WHERE location = 'shop_home';
UPDATE public.banners SET target_route = '/buyer-dashboard', banner_style = 'carousel' WHERE location = 'buyer_home';
