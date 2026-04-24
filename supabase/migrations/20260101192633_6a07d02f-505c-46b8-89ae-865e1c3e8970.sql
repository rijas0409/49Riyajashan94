-- Add new columns to profiles for seller profile enhancements
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS is_admin_approved BOOLEAN DEFAULT false;

-- Add columns to pets for priority verification
ALTER TABLE public.pets
ADD COLUMN IF NOT EXISTS priority_verification BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS priority_fee_paid BOOLEAN DEFAULT false;

-- Update pets RLS to only show admin-approved verified listings to public
DROP POLICY IF EXISTS "Anyone can view available pets" ON public.pets;
CREATE POLICY "Anyone can view available verified pets"
ON public.pets
FOR SELECT
USING (
  (is_available = true AND verification_status = 'verified')
  OR (auth.uid() = owner_id)
  OR has_role(auth.uid(), 'admin'::user_role)
);