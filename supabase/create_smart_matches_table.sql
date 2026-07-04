-- SQL Migration to create the dedicated smart_matches table in Supabase
-- You can copy and execute this block in your Supabase Dashboard SQL Editor

CREATE TABLE IF NOT EXISTS public.smart_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    pet_id UUID REFERENCES public.pet_passports(id) ON DELETE CASCADE,
    pet_name TEXT,
    payload JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.smart_matches ENABLE ROW LEVEL SECURITY;

-- Create security policies so users can securely access their records
CREATE POLICY "Users can insert their own smart matches" 
ON public.smart_matches 
FOR INSERT 
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can view their own smart matches" 
ON public.smart_matches 
FOR SELECT 
USING (auth.uid() = user_id OR user_id IS NULL);

-- Grant permissions for authenticated and service_role connections
GRANT ALL ON TABLE public.smart_matches TO anon, authenticated, service_role;
