ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone;
UPDATE public.profiles SET approved_at = created_at WHERE is_admin_approved = true AND approved_at IS NULL;
