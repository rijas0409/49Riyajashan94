
-- Allow users to SELECT their own activity (needed for INSERT...RETURNING)
CREATE POLICY "Users can select own activity for insert returning" ON public.buyer_activity
  FOR SELECT USING (auth.uid() = user_id);

-- Allow users to UPDATE their own activity (for duration tracking)
CREATE POLICY "Users can update own activity duration" ON public.buyer_activity
  FOR UPDATE USING (auth.uid() = user_id);
