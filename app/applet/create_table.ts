import { createClient } from "@supabase/supabase-js";
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

async function run() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://lnxzkusbhidaqhhsxjtk.supabase.co";
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  const sql = `
CREATE TABLE IF NOT EXISTS public.smart_match_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    pet_data JSONB NOT NULL,
    concerns JSONB NOT NULL,
    health_background JSONB NOT NULL,
    current_health_status JSONB NOT NULL,
    media_files JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_smart_match_user_id ON public.smart_match_submissions(user_id);

ALTER TABLE public.smart_match_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert own submissions" ON public.smart_match_submissions;
CREATE POLICY "Users can insert own submissions"
ON public.smart_match_submissions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own submissions" ON public.smart_match_submissions;
CREATE POLICY "Users can view own submissions"
ON public.smart_match_submissions
FOR SELECT
USING (auth.uid() = user_id);
  `;

  // We can't execute raw DDL directly from JS via standard postgrest unless we have a run_sql rpc.
  // We'll check if run_sql exists.
  const { data, error } = await supabase.rpc('run_sql', { query: sql });
  if (error) {
    console.error("Error running SQL:", error.message);
  } else {
    console.log("SQL executed successfully!");
  }
}
run();
