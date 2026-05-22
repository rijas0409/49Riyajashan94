-- =========================================================================
-- Supabase Schema Fix: Public Visibility for Vets and Profiles
-- Run this in your Supabase SQL Editor to make sure vet card reviews & names 
-- are fully visible to all buyers and guest users!
-- =========================================================================

-- 1. Grant Select permissions safely to public readers (Anon and Authenticated users)
GRANT SELECT ON public.profiles TO anon, authenticated;
GRANT SELECT ON public.vet_profiles TO anon, authenticated;

-- 2. Create the select policy for vet profiles
DROP POLICY IF EXISTS "Anyone can view verified active vets" ON public.vet_profiles;
DROP POLICY IF EXISTS "Anyone can view approved vet profiles" ON public.vet_profiles;

CREATE POLICY "Anyone can view verified active vets" 
ON public.vet_profiles FOR SELECT 
USING (verification_status IN ('verified', 'approved') AND is_active = true);

-- 3. Create public read policy on profiles (so buyers can read vet names & profile pictures)
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;

CREATE POLICY "Users can view all profiles" 
ON public.profiles FOR SELECT 
USING (true);

-- 4. Ensure foreign key constraint from vet_profiles to profiles is intact
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'vet_profiles_user_id_fkey'
    ) THEN
        ALTER TABLE public.vet_profiles 
        ADD CONSTRAINT vet_profiles_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 5. Notify PostgREST to reload the schema cache immediately
NOTIFY pgrst, 'reload schema';
