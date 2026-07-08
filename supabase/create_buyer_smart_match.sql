-- ==========================================
-- UNIFIED SQL SCHEMA FOR 'buyer_smart_match' TABLE
-- ==========================================
-- This single table manages the entire lifecycle of the Smart Match feature:
-- - Real-time question-by-question saving
-- - Complete Step 1-6 final submissions
-- - Full protection against user_id or pet_passport_id foreign key constraint failures.
--
-- Running this single query establishes the complete database backend for Smart Match.

CREATE TABLE IF NOT EXISTS public.buyer_smart_match (
    id TEXT PRIMARY KEY, -- Accommodates the frontend's generated sessionId (e.g., 'sms_1719283719_abc')
    user_id UUID, -- Optional user ID (no hard FK constraint to prevent test session crashes)
    pet_passport_id UUID, -- Optional pet passport ID
    pet_name TEXT,
    
    -- Real-time accumulated responses array
    responses JSONB DEFAULT '[]'::jsonb,
    
    -- Step-by-step parsed details
    step1_pet_details JSONB DEFAULT '{}'::jsonb,
    step2_concerns JSONB DEFAULT '[]'::jsonb,
    step3_health_background JSONB DEFAULT '[]'::jsonb,
    step4_current_health_status JSONB DEFAULT '[]'::jsonb,
    step5_photos_videos JSONB DEFAULT '[]'::jsonb,
    step6_review_data JSONB DEFAULT '{}'::jsonb,
    
    status TEXT NOT NULL DEFAULT 'saved', -- 'saved' during steps, 'submitted' after Step 6 finalization
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.buyer_smart_match ENABLE ROW LEVEL SECURITY;

-- Establish RLS policies allowing zero-loss inserts and reads for both guests and authenticated users
DROP POLICY IF EXISTS "Allow public insert on buyer_smart_match" ON public.buyer_smart_match;
CREATE POLICY "Allow public insert on buyer_smart_match" ON public.buyer_smart_match FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public select on buyer_smart_match" ON public.buyer_smart_match;
CREATE POLICY "Allow public select on buyer_smart_match" ON public.buyer_smart_match FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public update on buyer_smart_match" ON public.buyer_smart_match;
CREATE POLICY "Allow public update on buyer_smart_match" ON public.buyer_smart_match FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public delete on buyer_smart_match" ON public.buyer_smart_match;
CREATE POLICY "Allow public delete on buyer_smart_match" ON public.buyer_smart_match FOR DELETE USING (true);

-- Grant full access privileges to anon, authenticated, and service_role
GRANT ALL ON TABLE public.buyer_smart_match TO anon, authenticated, service_role;

-- ==========================================================
-- ENABLE SUPABASE REALTIME REPLICATION (Real-time Status: Enabled)
-- ==========================================================
-- This command adds the table to Supabase's publication list, turning the
-- 'Realtime' column status in Supabase Dashboard from 'Disabled' to 'Enabled'.
BEGIN;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.buyer_smart_match;
COMMIT;

