
-- Fix for missing or incorrect columns in vet_profiles
DO $$ 
BEGIN
  -- Fix available_days
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vet_profiles' AND column_name = 'available_days'
  ) THEN
    ALTER TABLE public.vet_profiles ADD COLUMN available_days TEXT[] NOT NULL DEFAULT '{}';
  END IF;

  -- Fix morning_slots if it's the wrong type or missing
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vet_profiles' AND column_name = 'morning_slots' AND data_type = 'ARRAY'
  ) THEN
    ALTER TABLE public.vet_profiles DROP COLUMN morning_slots;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vet_profiles' AND column_name = 'morning_slots'
  ) THEN
    ALTER TABLE public.vet_profiles ADD COLUMN morning_slots BOOLEAN DEFAULT false;
  END IF;

  -- Fix evening_slots if it's the wrong type or missing
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vet_profiles' AND column_name = 'evening_slots' AND data_type = 'ARRAY'
  ) THEN
    ALTER TABLE public.vet_profiles DROP COLUMN evening_slots;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vet_profiles' AND column_name = 'evening_slots'
  ) THEN
    ALTER TABLE public.vet_profiles ADD COLUMN evening_slots BOOLEAN DEFAULT false;
  END IF;
END $$;
