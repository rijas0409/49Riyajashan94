
-- Drop restrictive policies and recreate as permissive
DROP POLICY IF EXISTS "Anyone can view active banners" ON public.banners;
DROP POLICY IF EXISTS "Admin can view all banners" ON public.banners;

-- Recreate as PERMISSIVE (default) so either one passing is enough
CREATE POLICY "Anyone can view active banners"
ON public.banners FOR SELECT
TO anon, authenticated
USING (is_active = true);

CREATE POLICY "Admin can view all banners"
ON public.banners FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::user_role));
