
-- Fix for missing or incorrect columns in vet_profiles
DO $$ 
BEGIN
  -- Fix available_days
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vet_profiles' AND column_name = 'available_days') THEN
    ALTER TABLE public.vet_profiles ADD COLUMN available_days TEXT[] NOT NULL DEFAULT '{}';
  END IF;

  -- Fix slots
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vet_profiles' AND column_name = 'morning_slots') THEN
    ALTER TABLE public.vet_profiles ADD COLUMN morning_slots BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vet_profiles' AND column_name = 'evening_slots') THEN
    ALTER TABLE public.vet_profiles ADD COLUMN evening_slots BOOLEAN DEFAULT false;
  END IF;

  -- Fix banking details
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vet_profiles' AND column_name = 'bank_account_name') THEN
    ALTER TABLE public.vet_profiles ADD COLUMN bank_account_name TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vet_profiles' AND column_name = 'bank_name') THEN
    ALTER TABLE public.vet_profiles ADD COLUMN bank_name TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vet_profiles' AND column_name = 'bank_account_number') THEN
    ALTER TABLE public.vet_profiles ADD COLUMN bank_account_number TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vet_profiles' AND column_name = 'bank_ifsc') THEN
    ALTER TABLE public.vet_profiles ADD COLUMN bank_ifsc TEXT;
  END IF;

  -- Fix compliance and extra files
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vet_profiles' AND column_name = 'pan_card_file') THEN
    ALTER TABLE public.vet_profiles ADD COLUMN pan_card_file TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vet_profiles' AND column_name = 'passport_photo_file') THEN
    ALTER TABLE public.vet_profiles ADD COLUMN passport_photo_file TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vet_profiles' AND column_name = 'clinic_shop_license_file') THEN
    ALTER TABLE public.vet_profiles ADD COLUMN clinic_shop_license_file TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vet_profiles' AND column_name = 'gst_certificate_file') THEN
    ALTER TABLE public.vet_profiles ADD COLUMN gst_certificate_file TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vet_profiles' AND column_name = 'clinic_address_proof_file') THEN
    ALTER TABLE public.vet_profiles ADD COLUMN clinic_address_proof_file TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vet_profiles' AND column_name = 'cancelled_cheque_file') THEN
    ALTER TABLE public.vet_profiles ADD COLUMN cancelled_cheque_file TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vet_profiles' AND column_name = 'vendor_agreement_accepted') THEN
    ALTER TABLE public.vet_profiles ADD COLUMN vendor_agreement_accepted BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vet_profiles' AND column_name = 'telemedicine_consent_accepted') THEN
    ALTER TABLE public.vet_profiles ADD COLUMN telemedicine_consent_accepted BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vet_profiles' AND column_name = 'clinic_photos') THEN
    ALTER TABLE public.vet_profiles ADD COLUMN clinic_photos TEXT[] DEFAULT '{}';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vet_profiles' AND column_name = 'education_details') THEN
    ALTER TABLE public.vet_profiles ADD COLUMN education_details JSONB DEFAULT '[]';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vet_profiles' AND column_name = 'preferred_language') THEN
    ALTER TABLE public.vet_profiles ADD COLUMN preferred_language TEXT DEFAULT 'English';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vet_profiles' AND column_name = 'clinic_address') THEN
    ALTER TABLE public.vet_profiles ADD COLUMN clinic_address TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vet_profiles' AND column_name = 'registration_number') THEN
    ALTER TABLE public.vet_profiles ADD COLUMN registration_number TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vet_profiles' AND column_name = 'govt_id_file') THEN
    ALTER TABLE public.vet_profiles ADD COLUMN govt_id_file TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vet_profiles' AND column_name = 'clinic_registration_file') THEN
    ALTER TABLE public.vet_profiles ADD COLUMN clinic_registration_file TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vet_profiles' AND column_name = 'profile_photo') THEN
    ALTER TABLE public.vet_profiles ADD COLUMN profile_photo TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vet_profiles' AND column_name = 'vet_degree_file') THEN
    ALTER TABLE public.vet_profiles ADD COLUMN vet_degree_file TEXT;
  END IF;
END $$;
