-- Migration: Add city and state column to public.profiles and public.vet_profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS state TEXT;

ALTER TABLE public.vet_profiles ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.vet_profiles ADD COLUMN IF NOT EXISTS state TEXT;

-- Try to backfill city and state from the existing address field in profiles
UPDATE public.profiles 
SET 
  city = split_part(address, ',', 1),
  state = trim(split_part(address, ',', 2))
WHERE address IS NOT NULL AND (city IS NULL OR city = '');

-- Also try to backfill from profiles to vet_profiles
UPDATE public.vet_profiles vp
SET 
  city = p.city,
  state = p.state
FROM public.profiles p
WHERE vp.user_id = p.id AND (vp.city IS NULL OR vp.city = '' OR vp.state IS NULL OR vp.state = '');
