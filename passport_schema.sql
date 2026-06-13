-- Run this SQL in your Supabase SQL Editor to create the necessary Pet Passport tables.

-- 0. Make sure previously existing tables with the same names are removed 
-- (Uncomment the following lines if you want the script to automatically drop old tables)
-- DROP TABLE IF EXISTS public.pet_health_records_documents CASCADE;
-- DROP TABLE IF EXISTS public.pet_health_conditions CASCADE;
-- DROP TABLE IF EXISTS public.pet_medical_logs CASCADE;
-- DROP TABLE IF EXISTS public.pet_passports CASCADE;

-- 1. Create the main Pet Passports table
CREATE TABLE IF NOT EXISTS public.pet_passports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    passport_id VARCHAR(50) UNIQUE NOT NULL,
    pet_name VARCHAR(100) NOT NULL,
    species VARCHAR(50) NOT NULL,
    gender VARCHAR(20) NOT NULL,
    breed VARCHAR(100),
    appearance TEXT,
    age_type VARCHAR(20),
    dob DATE,
    approx_years INTEGER,
    approx_months INTEGER,
    weight NUMERIC(5,2),
    owner_name VARCHAR(100) NOT NULL,
    primary_phone VARCHAR(20) NOT NULL,
    emergency_contact_name VARCHAR(100),
    emergency_phone VARCHAR(20),
    emergency_relationship VARCHAR(50),
    photo_url TEXT,
    last_sync TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create the Medical Logs table
CREATE TABLE IF NOT EXISTS public.pet_medical_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pet_passport_id UUID REFERENCES public.pet_passports(id) ON DELETE CASCADE NOT NULL,
    last_vaccination_date DATE,
    known_allergies TEXT,
    last_veterinary_visit DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create the Health Conditions table
CREATE TABLE IF NOT EXISTS public.pet_health_conditions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pet_passport_id UUID REFERENCES public.pet_passports(id) ON DELETE CASCADE NOT NULL,
    condition_name VARCHAR(100) NOT NULL,
    specify_other TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create the Health Records/Documents table
CREATE TABLE IF NOT EXISTS public.pet_health_records_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pet_passport_id UUID REFERENCES public.pet_passports(id) ON DELETE CASCADE NOT NULL,
    record_type VARCHAR(50) NOT NULL,
    vaccine_name VARCHAR(100),
    specify_vaccine VARCHAR(100),
    date_administered DATE,
    next_due_date DATE,
    diagnosis TEXT,
    prescribed_by VARCHAR(100),
    issue_date DATE,
    test_name VARCHAR(100),
    test_date DATE,
    procedure_name VARCHAR(100),
    surgery_date DATE,
    condition_name VARCHAR(100),
    certificate_title VARCHAR(100),
    record_description TEXT,
    document_base64 TEXT,
    file_url TEXT,
    file_path TEXT,
    storage_bucket TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Enable Realtime triggers for the Admin Panel
-- (Requires supabase_realtime publication)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

DO $$
BEGIN
  -- Add tables to publication if they are not already in it
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'pet_passports'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.pet_passports;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'pet_medical_logs'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.pet_medical_logs;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'pet_health_conditions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.pet_health_conditions;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'pet_health_records_documents'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.pet_health_records_documents;
  END IF;
END $$;

-- 6. Grant Permissions
-- Ensure anon and authenticated roles have access to these tables
GRANT ALL ON TABLE public.pet_passports TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.pet_medical_logs TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.pet_health_conditions TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.pet_health_records_documents TO anon, authenticated, service_role;

-- Disable Row Level Security (RLS) for now to allow simple insertion without authentication issues.
ALTER TABLE public.pet_passports DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pet_medical_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pet_health_conditions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pet_health_records_documents DISABLE ROW LEVEL SECURITY;

-- 7. Diagnostic Logging Table (Optional / Helper)
CREATE TABLE IF NOT EXISTS public.debug_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    log_level VARCHAR(20) DEFAULT 'info',
    message TEXT NOT NULL,
    context JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

GRANT ALL ON TABLE public.debug_logs TO anon, authenticated, service_role;
ALTER TABLE public.debug_logs DISABLE ROW LEVEL SECURITY;

-- Note: In a production environment, you should also add proper RLS policies here.
