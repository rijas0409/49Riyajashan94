CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.pet_passports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    passport_id TEXT UNIQUE NOT NULL,
    pet_name TEXT NOT NULL,
    species TEXT NOT NULL,
    gender TEXT NOT NULL,
    breed TEXT NOT NULL,
    appearance TEXT,
    age_type TEXT DEFAULT 'exact',
    dob DATE,
    approx_years INT,
    approx_months INT,
    weight NUMERIC,
    owner_name TEXT NOT NULL,
    primary_phone TEXT NOT NULL,
    emergency_contact_name TEXT,
    emergency_phone TEXT,
    emergency_relationship TEXT,
    photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.pet_medical_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pet_passport_id UUID REFERENCES public.pet_passports(id) ON DELETE CASCADE,
    last_vaccination_date DATE,
    known_allergies TEXT,
    last_veterinary_visit DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.pet_health_conditions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pet_passport_id UUID REFERENCES public.pet_passports(id) ON DELETE CASCADE,
    condition_name TEXT NOT NULL,
    specify_other TEXT
);

CREATE TABLE IF NOT EXISTS public.pet_health_records_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pet_passport_id UUID REFERENCES public.pet_passports(id) ON DELETE CASCADE,
    record_type TEXT NOT NULL,
    vaccine_name TEXT,
    specify_vaccine TEXT,
    date_administered DATE,
    next_due_date DATE,
    diagnosis TEXT,
    prescribed_by TEXT,
    issue_date DATE,
    test_name TEXT,
    test_date DATE,
    procedure_name TEXT,
    surgery_date DATE,
    condition_name TEXT,
    certificate_title TEXT,
    record_description TEXT,
    document_base64 TEXT,
    file_url TEXT,
    file_path TEXT,
    storage_bucket TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.pet_vaccinations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pet_passport_id UUID REFERENCES public.pet_passports(id) ON DELETE CASCADE,
    vaccine_name TEXT NOT NULL
);
