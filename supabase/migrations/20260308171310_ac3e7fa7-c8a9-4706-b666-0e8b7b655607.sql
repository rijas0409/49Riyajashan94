
-- Table to store admin-sent notifications
CREATE TABLE public.admin_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sent_by uuid NOT NULL,
  target_role text NOT NULL DEFAULT 'all',
  title text NOT NULL,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Table to track per-user read status
CREATE TABLE public.user_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id uuid REFERENCES public.admin_notifications(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(notification_id, user_id)
);

ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

-- Admin can do everything on admin_notifications
CREATE POLICY "Admin can insert notifications" ON public.admin_notifications
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Admin can view all notifications" ON public.admin_notifications
  FOR SELECT USING (has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Admin can delete notifications" ON public.admin_notifications
  FOR DELETE USING (has_role(auth.uid(), 'admin'::user_role));

-- Users can view notifications targeted to their role or 'all'
CREATE POLICY "Users can view targeted notifications" ON public.admin_notifications
  FOR SELECT USING (
    target_role = 'all' 
    OR target_role = (SELECT role::text FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1)
  );

-- user_notifications policies
CREATE POLICY "Admin can view all user_notifications" ON public.user_notifications
  FOR SELECT USING (has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Users can view own notifications" ON public.user_notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification read" ON public.user_notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notification read" ON public.user_notifications
  FOR UPDATE USING (auth.uid() = user_id);
