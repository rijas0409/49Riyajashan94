-- Add priority_fee_paid column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS priority_fee_paid boolean DEFAULT false;