-- Add onboarding completion tracking for sellers
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_onboarding_complete boolean DEFAULT false;