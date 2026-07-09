-- Migration: Add Smart Match High Performance Indexes and RPC
-- Added: July 09, 2026

-- Ensure latitude and longitude columns exist on vet_profiles before index creation
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'vet_profiles') THEN
        ALTER TABLE public.vet_profiles ADD COLUMN IF NOT EXISTS latitude NUMERIC;
        ALTER TABLE public.vet_profiles ADD COLUMN IF NOT EXISTS longitude NUMERIC;
    END IF;
END $$;

-- 1. Create high performance indexes for vet_profiles table
CREATE INDEX IF NOT EXISTS idx_vet_profiles_active_verified 
ON public.vet_profiles (is_active, verification_status);

CREATE INDEX IF NOT EXISTS idx_vet_profiles_coords 
ON public.vet_profiles (latitude, longitude) 
WHERE is_active = true AND verification_status IN ('verified', 'approved');

CREATE INDEX IF NOT EXISTS idx_vet_profiles_pincode 
ON public.vet_profiles (clinic_pincode, hospital_pincode);

CREATE INDEX IF NOT EXISTS idx_vet_profiles_specializations 
ON public.vet_profiles USING gin (specializations);

-- 2. Create index on appointments for faster range query & shortlisted candidate checks
CREATE INDEX IF NOT EXISTS idx_vet_appointments_vet_date_status 
ON public.vet_appointments (vet_id, appointment_date, status);

-- 3. Create the optimized candidate search function (RPC)
CREATE OR REPLACE FUNCTION public.get_candidate_vets(
  p_species TEXT,
  p_consultation_type TEXT,
  p_user_lat NUMERIC,
  p_user_lon NUMERIC,
  p_user_pincode TEXT,
  p_limit INTEGER DEFAULT 100
)
RETURNS SETOF public.vet_profiles
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_requested_species TEXT := LOWER(TRIM(p_species));
BEGIN
  RETURN QUERY
  SELECT vp.*
  FROM public.vet_profiles vp
  WHERE vp.is_active = true
    AND vp.verification_status IN ('verified', 'approved')
    -- 1. Supported Species Filter
    AND (
      vp.specializations IS NULL 
      OR cardinality(vp.specializations) = 0 
      OR 'all' = ANY(vp.specializations) 
      OR 'general' = ANY(vp.specializations) 
      OR 'canine' = ANY(vp.specializations) 
      OR 'feline' = ANY(vp.specializations) 
      -- exact or substring match in lowercase
      OR EXISTS (
        SELECT 1 
        FROM unnest(vp.specializations) s 
        WHERE LOWER(s) LIKE '%' || v_requested_species || '%'
           OR v_requested_species LIKE '%' || LOWER(s) || '%'
      )
    )
    -- 2. Consultation Mode Filter
    AND (
      p_consultation_type IS NULL 
      OR p_consultation_type = ''
      OR LOWER(p_consultation_type) = 'both'
      OR (LOWER(p_consultation_type) = 'instant' AND (vp.consultation_type = 'online' OR vp.consultation_type = 'both' OR vp.consultation_type = 'online, offline'))
      OR (LOWER(p_consultation_type) = 'future' AND (vp.consultation_type = 'offline' OR vp.consultation_type = 'both' OR vp.consultation_type = 'offline, online' OR vp.consultation_type = 'online, offline' OR vp.consultation_type = 'clinic' OR vp.consultation_type = 'home' OR vp.consultation_type = 'online, clinic, home'))
      OR (vp.consultation_type ILIKE '%' || p_consultation_type || '%')
    )
  ORDER BY 
    CASE 
      WHEN p_user_lat IS NOT NULL AND p_user_lon IS NOT NULL AND vp.latitude IS NOT NULL AND vp.longitude IS NOT NULL THEN
        -- Haversine formula distance calculation
        6371 * acos(
          LEAST(1.0, GREATEST(-1.0, 
            cos(radians(p_user_lat)) * cos(radians(vp.latitude)) * cos(radians(vp.longitude) - radians(p_user_lon)) + 
            sin(radians(p_user_lat)) * sin(radians(vp.latitude))
          ))
        )
      ELSE 9999.0
    END ASC,
    vp.years_of_experience DESC,
    vp.average_rating DESC
  LIMIT p_limit;
END;
$$;
