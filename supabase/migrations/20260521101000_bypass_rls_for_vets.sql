-- Drop existing restrictive policy just in case
DROP POLICY IF EXISTS "Anyone can view approved vet profiles" ON public.profiles;

-- Allow ANYONE to view ALL vet profiles regardless of approval (for debugging)
CREATE POLICY "Anyone can view approved vet profiles"
ON public.profiles
FOR SELECT
USING (role = 'vet');

-- Allow ANYONE to view all vet_profiles
DROP POLICY IF EXISTS "Anyone can view verified active vets" ON public.vet_profiles;

CREATE POLICY "Anyone can view verified active vets"
ON public.vet_profiles
FOR SELECT
USING (true);
