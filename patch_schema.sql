-- Run this SQL in your Supabase SQL Editor to add the missing columns to pet_health_records_documents
-- This fixes the error: "Could not find the 'file_path' column of 'pet_health_records_documents' in the schema cache"

ALTER TABLE public.pet_health_records_documents 
ADD COLUMN IF NOT EXISTS file_url TEXT,
ADD COLUMN IF NOT EXISTS file_path TEXT,
ADD COLUMN IF NOT EXISTS storage_bucket TEXT;

-- Refresh the schema cache if needed (though Supabase usually does this automatically)
-- NOTIFY pgrst, 'reload schema';
