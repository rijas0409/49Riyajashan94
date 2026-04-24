-- Add delivery_partner to user_role enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'delivery_partner';

-- Add platform_margin_percent column to transport_requests if not exists
ALTER TABLE public.transport_requests 
ADD COLUMN IF NOT EXISTS platform_margin_percent numeric DEFAULT 10;

-- Add completed status to transport_status enum
ALTER TYPE transport_status ADD VALUE IF NOT EXISTS 'completed';
ALTER TYPE transport_status ADD VALUE IF NOT EXISTS 'cancelled';

-- Enable realtime for transport_requests
ALTER PUBLICATION supabase_realtime ADD TABLE public.transport_requests;

-- RLS policy for delivery partners to view assigned deliveries
CREATE POLICY "Delivery partners can view assigned deliveries"
ON public.transport_requests
FOR SELECT
USING (
  auth.uid() = assigned_partner_id OR
  public.has_role(auth.uid(), 'admin'::user_role)
);

-- RLS policy for delivery partners to update their assigned deliveries
CREATE POLICY "Delivery partners can update assigned deliveries"
ON public.transport_requests
FOR UPDATE
USING (auth.uid() = assigned_partner_id)
WITH CHECK (auth.uid() = assigned_partner_id);

-- RLS policy for admin to view all transport requests
CREATE POLICY "Admin can view all transport requests"
ON public.transport_requests
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::user_role));

-- RLS policy for admin to update any transport request
CREATE POLICY "Admin can update any transport request"
ON public.transport_requests
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'::user_role));

-- RLS policy for admin to insert transport requests
CREATE POLICY "Admin can insert transport requests"
ON public.transport_requests
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'::user_role));