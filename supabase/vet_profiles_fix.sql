
-- Comprehensive Fix for vet_profiles table
-- Run this in Supabase SQL Editor to resolve all "column not found" issues

DO $$ 
BEGIN
    -- 1. Availability Columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vet_profiles' AND column_name = 'available_days') THEN
        ALTER TABLE public.vet_profiles ADD COLUMN available_days TEXT[] NOT NULL DEFAULT '{}';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vet_profiles' AND column_name = 'morning_slots') THEN
        ALTER TABLE public.vet_profiles ADD COLUMN morning_slots BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vet_profiles' AND column_name = 'evening_slots') THEN
        ALTER TABLE public.vet_profiles ADD COLUMN evening_slots BOOLEAN DEFAULT false;
    END IF;

    -- 2. Professional & Identity
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vet_profiles' AND column_name = 'registration_number') THEN
        ALTER TABLE public.vet_profiles ADD COLUMN registration_number TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vet_profiles' AND column_name = 'consultation_type') THEN
        ALTER TABLE public.vet_profiles ADD COLUMN consultation_type TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vet_profiles' AND column_name = 'preferred_language') THEN
        ALTER TABLE public.vet_profiles ADD COLUMN preferred_language TEXT DEFAULT 'English';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vet_profiles' AND column_name = 'specializations') THEN
        ALTER TABLE public.vet_profiles ADD COLUMN specializations TEXT[] DEFAULT '{}';
    END IF;

    -- 3. Fees (Decimal for accuracy)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vet_profiles' AND column_name = 'online_fee') THEN
        ALTER TABLE public.vet_profiles ADD COLUMN online_fee NUMERIC DEFAULT 500;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vet_profiles' AND column_name = 'offline_fee') THEN
        ALTER TABLE public.vet_profiles ADD COLUMN offline_fee NUMERIC DEFAULT 800;
    END IF;

    -- 4. Banking Details
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

    -- 5. Clinic Details
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vet_profiles' AND column_name = 'clinic_address') THEN
        ALTER TABLE public.vet_profiles ADD COLUMN clinic_address TEXT;
    END IF;

    -- 6. Files & Documents (URLs)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vet_profiles' AND column_name = 'vet_degree_file') THEN
        ALTER TABLE public.vet_profiles ADD COLUMN vet_degree_file TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vet_profiles' AND column_name = 'govt_id_file') THEN
        ALTER TABLE public.vet_profiles ADD COLUMN govt_id_file TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vet_profiles' AND column_name = 'pan_card_file') THEN
        ALTER TABLE public.vet_profiles ADD COLUMN pan_card_file TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vet_profiles' AND column_name = 'passport_photo_file') THEN
        ALTER TABLE public.vet_profiles ADD COLUMN passport_photo_file TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vet_profiles' AND column_name = 'clinic_registration_file') THEN
        ALTER TABLE public.vet_profiles ADD COLUMN clinic_registration_file TEXT;
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
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vet_profiles' AND column_name = 'profile_photo') THEN
        ALTER TABLE public.vet_profiles ADD COLUMN profile_photo TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vet_profiles' AND column_name = 'clinic_photos') THEN
        ALTER TABLE public.vet_profiles ADD COLUMN clinic_photos TEXT[] DEFAULT '{}';
    END IF;

    -- 7. Compliance
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vet_profiles' AND column_name = 'vendor_agreement_accepted') THEN
        ALTER TABLE public.vet_profiles ADD COLUMN vendor_agreement_accepted BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vet_profiles' AND column_name = 'telemedicine_consent_accepted') THEN
        ALTER TABLE public.vet_profiles ADD COLUMN telemedicine_consent_accepted BOOLEAN DEFAULT false;
    END IF;

    -- 8. Complex Data
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vet_profiles' AND column_name = 'education_details') THEN
        ALTER TABLE public.vet_profiles ADD COLUMN education_details JSONB DEFAULT '[]';
    END IF;

END $$;
