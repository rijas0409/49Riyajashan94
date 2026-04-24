
-- Add pan_card_file column to profiles table for PAN card upload
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pan_card_file text;

-- Add business_name column to profiles for explicit business name storage
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS business_name text;
