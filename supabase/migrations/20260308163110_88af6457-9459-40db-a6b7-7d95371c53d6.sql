
-- Create user_advertisements table to track all promotions/ads run by platform users
CREATE TABLE public.user_advertisements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  user_role text NOT NULL DEFAULT 'seller',
  ad_type text NOT NULL DEFAULT 'sponsored_listing',
  title text NOT NULL DEFAULT '',
  description text,
  target_entity_id uuid,
  target_entity_type text DEFAULT 'pet',
  target_route text,
  image_url text,
  start_date timestamp with time zone NOT NULL DEFAULT now(),
  end_date timestamp with time zone,
  daily_cost numeric NOT NULL DEFAULT 0,
  total_cost numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  impressions integer DEFAULT 0,
  clicks integer DEFAULT 0,
  placement text DEFAULT 'search_results',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_advertisements ENABLE ROW LEVEL SECURITY;

-- Admin can view all advertisements
CREATE POLICY "Admin can view all user advertisements"
ON public.user_advertisements FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::user_role));

-- Admin can update any advertisement
CREATE POLICY "Admin can update user advertisements"
ON public.user_advertisements FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::user_role));

-- Users can create their own advertisements
CREATE POLICY "Users can create own advertisements"
ON public.user_advertisements FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can view their own advertisements
CREATE POLICY "Users can view own advertisements"
ON public.user_advertisements FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Admin can delete advertisements
CREATE POLICY "Admin can delete user advertisements"
ON public.user_advertisements FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::user_role));
