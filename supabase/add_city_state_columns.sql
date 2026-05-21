-- Run this in Supabase SQL Editor to resolve and add explicit City and State columns to the profiles and vet_profiles tables, and backfill existing entries!

-- 1. Add city and state columns to the profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS state TEXT;

-- 2. Add city and state columns to the vet_profiles table
ALTER TABLE public.vet_profiles ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.vet_profiles ADD COLUMN IF NOT EXISTS state TEXT;

-- 3. Backfill columns for profiles from the existing address field (which stores "City, State")
UPDATE public.profiles
SET 
  city = TRIM(SPLIT_PART(address, ',', 1)),
  state = CASE 
    WHEN POSITION(',' IN address) > 0 THEN TRIM(SPLIT_PART(address, ',', 2))
    ELSE NULL
  END
WHERE address IS NOT NULL AND (city IS NULL OR state IS NULL);

-- 4. Backfill columns for vet_profiles from matching user profile details
UPDATE public.vet_profiles vp
SET 
  city = p.city,
  state = p.state
FROM public.profiles p
WHERE vp.user_id = p.id AND (vp.city IS NULL OR vp.state IS NULL);

-- Verification Select to check table status (optional run)
-- SELECT id, full_name, address, city, state FROM public.profiles;
