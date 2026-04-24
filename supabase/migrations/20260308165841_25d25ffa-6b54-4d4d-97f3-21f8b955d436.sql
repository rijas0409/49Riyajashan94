
-- Buyer activity tracking table - encrypted/admin-only access
CREATE TABLE public.buyer_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  activity_type text NOT NULL DEFAULT 'page_view',
  entity_type text NOT NULL DEFAULT 'pet',
  entity_id text NOT NULL,
  entity_name text,
  entity_image text,
  duration_seconds integer DEFAULT 0,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS - ONLY admin can access
ALTER TABLE public.buyer_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can view all buyer activity" ON public.buyer_activity
  FOR SELECT USING (has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Authenticated users can insert own activity" ON public.buyer_activity
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX idx_buyer_activity_user ON public.buyer_activity(user_id);
CREATE INDEX idx_buyer_activity_entity ON public.buyer_activity(entity_type, entity_id);
CREATE INDEX idx_buyer_activity_created ON public.buyer_activity(created_at DESC);
