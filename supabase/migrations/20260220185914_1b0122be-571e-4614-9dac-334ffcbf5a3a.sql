
-- Add new columns to pets table for bloodline, registration, age system, size, weight
ALTER TABLE public.pets 
ADD COLUMN IF NOT EXISTS bloodline text,
ADD COLUMN IF NOT EXISTS registered_with text,
ADD COLUMN IF NOT EXISTS birth_date date,
ADD COLUMN IF NOT EXISTS age_type text DEFAULT 'approximate',
ADD COLUMN IF NOT EXISTS size text,
ADD COLUMN IF NOT EXISTS weight_kg numeric;
