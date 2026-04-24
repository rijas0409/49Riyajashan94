
-- Admin needs to SELECT all profiles (for approval workflow)
CREATE POLICY "Admin can view all profiles"
ON public.profiles
FOR SELECT
USING (has_role(auth.uid(), 'admin'::user_role));

-- Admin needs to UPDATE profiles (to set is_admin_approved, is_onboarding_complete)
CREATE POLICY "Admin can update any profile"
ON public.profiles
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::user_role));

-- Vets need to INSERT their own earnings after completing consultations
CREATE POLICY "Vets can insert own earnings"
ON public.vet_earnings
FOR INSERT
WITH CHECK (auth.uid() = vet_id);
