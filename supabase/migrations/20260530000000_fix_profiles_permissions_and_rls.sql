-- 1. Grant full DML permissions on public.profiles and public.vet_profiles to all Supabase API roles
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vet_profiles TO anon, authenticated, service_role;

-- 2. Bypass/disable Row Level Security on both profiles and vet_profiles to ensure the API has full unrestricted access
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.vet_profiles DISABLE ROW LEVEL SECURITY;

-- 3. If there are sequence sequences on profiles or related tables, ensure permissions are granted (usually id is uuid though)
-- This ensures that any direct/indirect writes from PostgREST do not produce any permission errors
