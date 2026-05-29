-- Migration: Add missing onboarding form fields to public.vet_profiles
DO $$
BEGIN
    -- A) Practice details
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vet_profiles' AND column_name = 'practice_type') THEN
        ALTER TABLE public.vet_profiles ADD COLUMN practice_type TEXT[] DEFAULT '{"Hospital / Organization"}';
    END IF;

    -- B) Clinic details
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vet_profiles' AND column_name = 'clinic_name') THEN
        ALTER TABLE public.vet_profiles ADD COLUMN clinic_name TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vet_profiles' AND column_name = 'clinic_pincode') THEN
        ALTER TABLE public.vet_profiles ADD COLUMN clinic_pincode TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vet_profiles' AND column_name = 'clinic_gst') THEN
        ALTER TABLE public.vet_profiles ADD COLUMN clinic_gst TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vet_profiles' AND column_name = 'clinic_videos') THEN
        ALTER TABLE public.vet_profiles ADD COLUMN clinic_videos TEXT[] DEFAULT '{}';
    END IF;

    -- C) Hospital details
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vet_profiles' AND column_name = 'hospital_name') THEN
        ALTER TABLE public.vet_profiles ADD COLUMN hospital_name TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vet_profiles' AND column_name = 'hospital_role') THEN
        ALTER TABLE public.vet_profiles ADD COLUMN hospital_role TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vet_profiles' AND column_name = 'hospital_address') THEN
        ALTER TABLE public.vet_profiles ADD COLUMN hospital_address TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vet_profiles' AND column_name = 'hospital_pincode') THEN
        ALTER TABLE public.vet_profiles ADD COLUMN hospital_pincode TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vet_profiles' AND column_name = 'hospital_joining_proof_file') THEN
        ALTER TABLE public.vet_profiles ADD COLUMN hospital_joining_proof_file TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vet_profiles' AND column_name = 'hospital_employee_id') THEN
        ALTER TABLE public.vet_profiles ADD COLUMN hospital_employee_id TEXT;
    END IF;

    -- D) Availability Structure
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vet_profiles' AND column_name = 'weekly_availability') THEN
        ALTER TABLE public.vet_profiles ADD COLUMN weekly_availability JSONB;
    END IF;

    -- E) Support facilities
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vet_profiles' AND column_name = 'emergency_available') THEN
        ALTER TABLE public.vet_profiles ADD COLUMN emergency_available BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vet_profiles' AND column_name = 'weekend_availability') THEN
        ALTER TABLE public.vet_profiles ADD COLUMN weekend_availability TEXT DEFAULT 'no';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vet_profiles' AND column_name = 'support_24x7') THEN
        ALTER TABLE public.vet_profiles ADD COLUMN support_24x7 TEXT DEFAULT 'no';
    END IF;

END $$;
