
-- Comprehensive Fix for profiles and vet_profiles tables
-- Run this in Supabase SQL Editor to resolve all schema and policy issues

-- 1. Profiles Table Updates
DO $FIX$ 
BEGIN
    -- Ensure profiles table has required columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'address') THEN
        ALTER TABLE public.profiles ADD COLUMN address TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'birth_date') THEN
        ALTER TABLE public.profiles ADD COLUMN birth_date DATE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'gender') THEN
        ALTER TABLE public.profiles ADD COLUMN gender TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_onboarding_complete') THEN
        ALTER TABLE public.profiles ADD COLUMN is_onboarding_complete BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_admin_approved') THEN
        ALTER TABLE public.profiles ADD COLUMN is_admin_approved BOOLEAN DEFAULT false;
    END IF;
END $FIX$;

-- 2. Vet Profiles Table Updates
DO $FIX$ 
BEGIN
    -- Ensure table exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vet_profiles') THEN
        CREATE TABLE public.vet_profiles (
            id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
    END IF;

    -- Professional Info
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vet_profiles' AND column_name = 'qualification') THEN
        ALTER TABLE public.vet_profiles ADD COLUMN qualification TEXT DEFAULT 'BVSc';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vet_profiles' AND column_name = 'registration_number') THEN
        ALTER TABLE public.vet_profiles ADD COLUMN registration_number TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vet_profiles' AND column_name = 'years_of_experience') THEN
        ALTER TABLE public.vet_profiles ADD COLUMN years_of_experience INTEGER DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vet_profiles' AND column_name = 'specializations') THEN
        ALTER TABLE public.vet_profiles ADD COLUMN specializations TEXT[] DEFAULT '{}';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vet_profiles' AND column_name = 'preferred_language') THEN
        ALTER TABLE public.vet_profiles ADD COLUMN preferred_language TEXT DEFAULT 'English';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vet_profiles' AND column_name = 'consultation_type') THEN
        ALTER TABLE public.vet_profiles ADD COLUMN consultation_type TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vet_profiles' AND column_name = 'self_practice') THEN
        ALTER TABLE public.vet_profiles ADD COLUMN self_practice BOOLEAN DEFAULT false;
    END IF;

    -- Availability
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vet_profiles' AND column_name = 'available_days') THEN
        ALTER TABLE public.vet_profiles ADD COLUMN available_days TEXT[] NOT NULL DEFAULT '{}';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vet_profiles' AND column_name = 'morning_slots') THEN
        ALTER TABLE public.vet_profiles ADD COLUMN morning_slots BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vet_profiles' AND column_name = 'evening_slots') THEN
        ALTER TABLE public.vet_profiles ADD COLUMN evening_slots BOOLEAN DEFAULT false;
    END IF;

    -- Fees
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vet_profiles' AND column_name = 'online_fee') THEN
        ALTER TABLE public.vet_profiles ADD COLUMN online_fee NUMERIC DEFAULT 500;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vet_profiles' AND column_name = 'offline_fee') THEN
        ALTER TABLE public.vet_profiles ADD COLUMN offline_fee NUMERIC DEFAULT 800;
    END IF;

    -- Banking
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

    -- Clinic & Address
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vet_profiles' AND column_name = 'clinic_address') THEN
        ALTER TABLE public.vet_profiles ADD COLUMN clinic_address TEXT;
    END IF;

    -- Document URLs
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
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vet_profiles' AND column_name = 'profile_photo') THEN
        ALTER TABLE public.vet_profiles ADD COLUMN profile_photo TEXT;
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

    -- Photos (Array)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vet_profiles' AND column_name = 'clinic_photos') THEN
        ALTER TABLE public.vet_profiles ADD COLUMN clinic_photos TEXT[] DEFAULT '{}';
    END IF;

    -- Compliance
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vet_profiles' AND column_name = 'vendor_agreement_accepted') THEN
        ALTER TABLE public.vet_profiles ADD COLUMN vendor_agreement_accepted BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vet_profiles' AND column_name = 'telemedicine_consent_accepted') THEN
        ALTER TABLE public.vet_profiles ADD COLUMN telemedicine_consent_accepted BOOLEAN DEFAULT false;
    END IF;

    -- Complex Data (JSONB)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vet_profiles' AND column_name = 'education_details') THEN
        ALTER TABLE public.vet_profiles ADD COLUMN education_details JSONB DEFAULT '[]';
    END IF;

    -- Status and Misc
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vet_profiles' AND column_name = 'verification_status') THEN
        ALTER TABLE public.vet_profiles ADD COLUMN verification_status TEXT NOT NULL DEFAULT 'pending';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vet_profiles' AND column_name = 'is_active') THEN
        ALTER TABLE public.vet_profiles ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;

END $FIX$;

-- 3. RLS Fix for vet_profiles
ALTER TABLE public.vet_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Vets can view own profile" ON public.vet_profiles;
DROP POLICY IF EXISTS "Vets can update own profile" ON public.vet_profiles;
DROP POLICY IF EXISTS "Vets can insert own profile" ON public.vet_profiles;
DROP POLICY IF EXISTS "Anyone can view verified active vets" ON public.vet_profiles;

CREATE POLICY "Vets can view own profile" ON public.vet_profiles 
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Vets can update own profile" ON public.vet_profiles 
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Vets can insert own profile" ON public.vet_profiles 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone can view verified active vets" ON public.vet_profiles 
    FOR SELECT USING (verification_status = 'verified' AND is_active = true);

-- 4. RLS Fix for profiles (ensure address, gender, birth_date are readable/writable)
-- Usually users have a profile update policy already.

-- 5. Storage Bucket and Policies
DO $FIX$
BEGIN
    INSERT INTO storage.buckets (id, name, public) 
    VALUES ('vet-documents', 'vet-documents', false)
    ON CONFLICT (id) DO NOTHING;
END $FIX$;

DROP POLICY IF EXISTS "Vets can upload own documents" ON storage.objects;
DROP POLICY IF EXISTS "Vets can view own documents" ON storage.objects;

CREATE POLICY "Vets can upload own documents" ON storage.objects 
    FOR INSERT WITH CHECK (bucket_id = 'vet-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Vets can view own documents" ON storage.objects 
    FOR SELECT USING (bucket_id = 'vet-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
