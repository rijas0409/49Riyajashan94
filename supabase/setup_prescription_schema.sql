-- 1. Storage Bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('prescription-files', 'prescription-files', true) ON CONFLICT DO NOTHING;

CREATE POLICY "Allow public viewing of prescription-files"
ON storage.objects FOR SELECT
USING ( bucket_id = 'prescription-files' );

CREATE POLICY "Allow vet uploads to prescription-files"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'prescription-files' AND auth.uid() IS NOT NULL );

-- 2. Master Tables
CREATE TABLE IF NOT EXISTS master_diagnoses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diagnosis_name TEXT NOT NULL UNIQUE,
  diagnosis_description TEXT,
  created_by_vet UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_master_diagnoses_name ON master_diagnoses(diagnosis_name);

CREATE TABLE IF NOT EXISTS master_medicines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medicine_name TEXT NOT NULL,
  form_type TEXT,
  pharmacy_source TEXT,
  unit_price NUMERIC,
  created_by_vet UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_master_medicines_name ON master_medicines(medicine_name);

CREATE TABLE IF NOT EXISTS master_lab_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_name TEXT NOT NULL UNIQUE,
  specific_instructions TEXT,
  created_by_vet UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_master_lab_tests_name ON master_lab_tests(test_name);

-- 3. Prescription Table
CREATE TABLE IF NOT EXISTS prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES vet_appointments(id) ON DELETE CASCADE,
  pet_id UUID, -- References pet id (assuming pets table exists in your project)
  vet_id UUID REFERENCES auth.users(id),
  temperature_f NUMERIC,
  heart_rate_bpm NUMERIC,
  diagnosis_tags JSONB DEFAULT '[]'::jsonb,
  clinical_summary TEXT,
  next_appointment_date DATE,
  next_appointment_time TIME,
  consultation_outcome TEXT,
  prescription_status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- Add simple trigger for updated_at
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS prescriptions_updated_at ON prescriptions;
CREATE TRIGGER prescriptions_updated_at
BEFORE UPDATE ON prescriptions FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

-- 4. Prescription Medicines
CREATE TABLE IF NOT EXISTS prescription_medicines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id UUID REFERENCES prescriptions(id) ON DELETE CASCADE,
  medicine_name TEXT NOT NULL,
  form_type TEXT,
  unit_price NUMERIC,
  pharmacy_source TEXT,
  dosage_quantity TEXT,
  dosage_frequency TEXT,
  dosage_timing TEXT,
  dosage_duration TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 5. Prescription Lab Tests
CREATE TABLE IF NOT EXISTS prescription_lab_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id UUID REFERENCES prescriptions(id) ON DELETE CASCADE,
  test_name TEXT NOT NULL,
  test_instructions TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 6. Prescription Attachments
CREATE TABLE IF NOT EXISTS prescription_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id UUID REFERENCES prescriptions(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_size BIGINT,
  file_url TEXT NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 7. Consultation Ratings
CREATE TABLE IF NOT EXISTS consultation_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES vet_appointments(id) ON DELETE CASCADE,
  prescription_id UUID REFERENCES prescriptions(id) ON DELETE CASCADE,
  buyer_id UUID REFERENCES auth.users(id),
  vet_id UUID REFERENCES auth.users(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(appointment_id)
);

-- Enable RLS and simple policies
ALTER TABLE master_diagnoses ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_lab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescription_medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescription_lab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescription_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultation_ratings ENABLE ROW LEVEL SECURITY;

-- Allow reading all generally
CREATE POLICY "Public read access for master_diagnoses" ON master_diagnoses FOR SELECT USING (true);
CREATE POLICY "Public read access for master_medicines" ON master_medicines FOR SELECT USING (true);
CREATE POLICY "Public read access for master_lab_tests" ON master_lab_tests FOR SELECT USING (true);

-- Allow authorized insert
CREATE POLICY "Auth insert access for master_diagnoses" ON master_diagnoses FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Auth insert access for master_medicines" ON master_medicines FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Auth insert access for master_lab_tests" ON master_lab_tests FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Prescriptions
CREATE POLICY "Read prescriptions for involved parties" ON prescriptions FOR SELECT 
USING (auth.uid() = vet_id OR auth.uid() IN (SELECT user_id FROM vet_appointments WHERE id = appointment_id));
CREATE POLICY "Vet can insert prescriptions" ON prescriptions FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Vet can update own prescriptions" ON prescriptions FOR UPDATE USING (auth.uid() = vet_id);

-- Prescription tables policies
CREATE POLICY "All can read prescription_medicines" ON prescription_medicines FOR SELECT USING (true);
CREATE POLICY "Vet can insert prescription_medicines" ON prescription_medicines FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "All can read prescription_lab_tests" ON prescription_lab_tests FOR SELECT USING (true);
CREATE POLICY "Vet can insert prescription_lab_tests" ON prescription_lab_tests FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "All can read prescription_attachments" ON prescription_attachments FOR SELECT USING (true);
CREATE POLICY "Vet can insert prescription_attachments" ON prescription_attachments FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "All can read consultation_ratings" ON consultation_ratings FOR SELECT USING (true);
CREATE POLICY "Buyer can insert consultation_ratings" ON consultation_ratings FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE prescriptions;
ALTER PUBLICATION supabase_realtime ADD TABLE prescription_medicines;
ALTER PUBLICATION supabase_realtime ADD TABLE prescription_lab_tests;
ALTER PUBLICATION supabase_realtime ADD TABLE prescription_attachments;
ALTER PUBLICATION supabase_realtime ADD TABLE master_diagnoses;
ALTER PUBLICATION supabase_realtime ADD TABLE master_medicines;
ALTER PUBLICATION supabase_realtime ADD TABLE master_lab_tests;
