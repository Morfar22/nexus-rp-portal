-- Add RLS policy to allow staff to delete subscriptions
CREATE POLICY "Staff can delete subscriptions" ON public.subscribers FOR DELETE USING (is_staff(auth.uid()));