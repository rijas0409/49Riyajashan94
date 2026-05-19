
-- Ensure Admin can update profiles
DROP POLICY IF EXISTS "Admin can update any profile" ON public.profiles;
CREATE POLICY "Admin can update any profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' OR 
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- Ensure Admin can view profiles
DROP POLICY IF EXISTS "Admin can view all profiles" ON public.profiles;
CREATE POLICY "Admin can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' OR 
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- Ensure Admin can update vet profiles
DROP POLICY IF EXISTS "Admin can update any vet profile" ON public.vet_profiles;
CREATE POLICY "Admin can update any vet profile"
ON public.vet_profiles
FOR UPDATE
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' OR 
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- Ensure Admin can view vet profiles
DROP POLICY IF EXISTS "Admin can view any vet profile" ON public.vet_profiles;
CREATE POLICY "Admin can view any vet profile"
ON public.vet_profiles
FOR SELECT
TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' OR 
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- Enable Realtime for key tables
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER TABLE public.vet_profiles REPLICA IDENTITY FULL;

-- Note: In Supabase dashboard, you still need to add these to the 'supabase_realtime' publication
-- but this SQL ensures the tables are ready for identity tracking.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
  
  ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.vet_profiles;
EXCEPTION
  WHEN OTHERS THEN
    -- Table might already be in publication
    NULL;
END $$;
