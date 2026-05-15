
-- Add columns to vet_appointments for enhanced consultation flow
ALTER TABLE public.vet_appointments 
ADD COLUMN IF NOT EXISTS symptoms_data JSONB,
ADD COLUMN IF NOT EXISTS ai_summary TEXT,
ADD COLUMN IF NOT EXISTS selected_duration INTEGER;

-- Ensure RLS allows the new columns
-- Policies already exist for select/insert/update based on user_id/vet_id
