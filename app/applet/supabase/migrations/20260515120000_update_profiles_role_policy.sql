DROP POLICY IF EXISTS "Users can update own profile (except role)" ON public.profiles;

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id 
  AND role != 'admin'::user_role
);
