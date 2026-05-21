-- Migration: Allow anyone to view approved vet profiles via RLS policy
-- 1. Create a policy on public.profiles allowing anyone to view approved vet profiles
DROP POLICY IF EXISTS "Anyone can view approved vet profiles" ON public.profiles;

CREATE POLICY "Anyone can view approved vet profiles"
ON public.profiles
FOR SELECT
USING (role = 'vet' AND is_admin_approved = true);

-- 2. Also ensure everyone can view verified active vets in vet_profiles table
DROP POLICY IF EXISTS "Anyone can view verified active vets" ON public.vet_profiles;

CREATE POLICY "Anyone can view verified active vets"
ON public.vet_profiles
FOR SELECT
USING (verification_status = 'verified' AND is_active = true);
