-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Users can only view their own complete profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Create security definer function to get public seller info (safe for public display)
CREATE OR REPLACE FUNCTION public.get_public_seller_info(_seller_id uuid)
RETURNS TABLE (
  id uuid,
  name text,
  profile_photo text,
  rating numeric,
  is_breeder_verified boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.name,
    p.profile_photo,
    p.rating,
    p.is_breeder_verified
  FROM public.profiles p
  WHERE p.id = _seller_id
    AND p.role = 'seller'
$$;

-- Create a policy allowing viewing basic seller info via the profiles table
-- This allows the foreign key joins to work, but only for sellers
CREATE POLICY "Users can view seller profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (role = 'seller');