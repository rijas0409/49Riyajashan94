-- Migration to guarantee that the qualification column in vet_profiles can store custom other qualifications (arbitrary text)
ALTER TABLE public.vet_profiles ALTER COLUMN qualification TYPE TEXT;
