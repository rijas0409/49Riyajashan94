-- Check and create user_advertisements table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_advertisements (
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

-- Grant appropriate permissions to authenticated, anon, and service_role
GRANT ALL ON TABLE public.user_advertisements TO authenticated;
GRANT ALL ON TABLE public.user_advertisements TO service_role;
GRANT SELECT ON TABLE public.user_advertisements TO anon;

-- Enable RLS
ALTER TABLE public.user_advertisements ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to prevent conflicts
DROP POLICY IF EXISTS "Admin can view all user advertisements" ON public.user_advertisements;
DROP POLICY IF EXISTS "Admin can update user advertisements" ON public.user_advertisements;
DROP POLICY IF EXISTS "Users can create own advertisements" ON public.user_advertisements;
DROP POLICY IF EXISTS "Users can view own advertisements" ON public.user_advertisements;
DROP POLICY IF EXISTS "Admin can delete user advertisements" ON public.user_advertisements;
DROP POLICY IF EXISTS "Public can view advertisements" ON public.user_advertisements;
DROP POLICY IF EXISTS "Users can update own advertisements" ON public.user_advertisements;
DROP POLICY IF EXISTS "Users can delete own advertisements" ON public.user_advertisements;

-- 1. Public can view active/saving corner offers (essential for clients to see vet discounts!)
CREATE POLICY "Public can view advertisements" 
ON public.user_advertisements 
FOR SELECT 
USING (true);

-- 2. Authenticated users can insert their own advertisements
CREATE POLICY "Users can create own advertisements" 
ON public.user_advertisements 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- 3. Authenticated users can update their own advertisements
CREATE POLICY "Users can update own advertisements" 
ON public.user_advertisements 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. Authenticated users can delete their own advertisements
CREATE POLICY "Users can delete own advertisements" 
ON public.user_advertisements 
FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

-- 5. Admin override policies (if needed, through service_role or check)
CREATE POLICY "Admin can view all user advertisements"
ON public.user_advertisements 
FOR SELECT 
TO authenticated
USING (true);
