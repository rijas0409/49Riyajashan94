-- Drop the table if we need a fresh start (optional, maybe just create if not exists)
CREATE TABLE IF NOT EXISTS public.smart_match_consultations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    pet_passport_id UUID REFERENCES public.pet_passports(id) ON DELETE CASCADE,
    
    -- Step 1
    step1_pet_details JSONB DEFAULT '{}'::jsonb,
    
    -- Step 2
    step2_concerns JSONB DEFAULT '[]'::jsonb,
    
    -- Step 3
    step3_health_background JSONB DEFAULT '[]'::jsonb,
    
    -- Step 4
    step4_current_health_status JSONB DEFAULT '[]'::jsonb,
    
    -- Step 5
    step5_photos_videos JSONB DEFAULT '[]'::jsonb,
    
    -- Step 6
    step6_review_data JSONB DEFAULT '{}'::jsonb,
    
    status TEXT NOT NULL DEFAULT 'submitted',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.smart_match_consultations ENABLE ROW LEVEL SECURITY;

-- Allow public insert and select to allow seamless insertion for all users (including guests)
DROP POLICY IF EXISTS "Allow public insert on smart_match_consultations" ON public.smart_match_consultations;
CREATE POLICY "Allow public insert on smart_match_consultations" ON public.smart_match_consultations FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public select on smart_match_consultations" ON public.smart_match_consultations;
CREATE POLICY "Allow public select on smart_match_consultations" ON public.smart_match_consultations FOR SELECT USING (true);

GRANT ALL ON TABLE public.smart_match_consultations TO anon, authenticated, service_role;
