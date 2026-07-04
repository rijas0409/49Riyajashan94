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
-- Supports both authenticated users (for their own data) and guest/anonymous users (where user_id is NULL)
CREATE POLICY "Allow public insert on care_match_assessments" 
ON public.care_match_assessments 
FOR INSERT 
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Allow public select on care_match_assessments" 
ON public.care_match_assessments 
FOR SELECT 
USING (auth.uid() = user_id OR user_id IS NULL);

-- 5. Explicitly grant permissions to standard Supabase roles
GRANT ALL ON TABLE public.care_match_assessments TO anon, authenticated, service_role;
