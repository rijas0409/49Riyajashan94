
-- Create a SECURITY DEFINER function to self-heal missing user_roles / profiles rows.
-- This avoids triggers on reserved schemas and keeps role as authoritative in user_roles.

CREATE OR REPLACE FUNCTION public.ensure_user_initialized(
  _role public.user_role,
  _name text,
  _email text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid;
  v_role public.user_role;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Only allow known roles; default to buyer if null
  v_role := COALESCE(_role, 'buyer'::public.user_role);

  -- Ensure user_roles row exists (authoritative)
  INSERT INTO public.user_roles (user_id, role)
  SELECT v_uid, v_role
  WHERE NOT EXISTS (
    SELECT 1 FROM public.user_roles ur WHERE ur.user_id = v_uid
  );

  -- Ensure profiles row exists (for UI fields)
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    v_uid,
    _email,
    COALESCE(NULLIF(_name, ''), 'User'),
    v_role
  )
  ON CONFLICT (id) DO NOTHING;
END;
$$;

-- Allow authenticated users to call it
GRANT EXECUTE ON FUNCTION public.ensure_user_initialized(public.user_role, text, text) TO authenticated;
