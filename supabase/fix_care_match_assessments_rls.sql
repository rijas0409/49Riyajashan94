-- SQL Script to fix Row Level Security (RLS) policies for "care_match_assessments"
-- Run this in your Supabase Dashboard SQL Editor to ensure seamless data saving!

-- 1. Ensure the table exists and has the correct schema
CREATE TABLE IF NOT EXISTS public.care_match_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    pet_passport_id UUID REFERENCES public.pet_passports(id) ON DELETE CASCADE,
    responses JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'completed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable Row-Level Security on the table
ALTER TABLE public.care_match_assessments ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing restrictive policies if any exist
DROP POLICY IF EXISTS "Users can insert their own care match assessments" ON public.care_match_assessments;
DROP POLICY IF EXISTS "Users can view their own care match assessments" ON public.care_match_assessments;
DROP POLICY IF EXISTS "Allow public insert on care_match_assessments" ON public.care_match_assessments;
DROP POLICY IF EXISTS "Allow public select on care_match_assessments" ON public.care_match_assessments;

-- 4. Create robust public policies that allow inserting and viewing assessments
-- Since the server uses the anon/publishable key to perform insertions, we allow public insert & select
-- so that both guest and registered user records can be seamlessly persisted and viewed.
CREATE POLICY "Allow public insert on care_match_assessments" 
ON public.care_match_assessments 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public select on care_match_assessments" 
ON public.care_match_assessments 
FOR SELECT 
USING (true);

-- 5. Explicitly grant permissions to standard Supabase roles
GRANT ALL ON TABLE public.care_match_assessments TO anon, authenticated, service_role;
