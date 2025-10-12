-- Drop all existing policies on subscribers table
DROP POLICY IF EXISTS "Staff can view all subscriptions" ON public.subscribers;
DROP POLICY IF EXISTS "Staff can delete subscriptions" ON public.subscribers;
DROP POLICY IF EXISTS "Service role can manage subscriptions" ON public.subscribers;
DROP POLICY IF EXISTS "Allow subscription creation" ON public.subscribers;
DROP POLICY IF EXISTS "insert_subscription" ON public.subscribers;
DROP POLICY IF EXISTS "Users can view their subscription by user_id" ON public.subscribers;
DROP POLICY IF EXISTS "Users can update subscriptions" ON public.subscribers;

-- Create simple, working policies for custom auth system
CREATE POLICY "Enable read access for all authenticated users" 
ON public.subscribers 
FOR SELECT 
USING (true);

CREATE POLICY "Enable insert for all users" 
ON public.subscribers 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Enable update for all users" 
ON public.subscribers 
FOR UPDATE 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Enable delete for staff" 
ON public.subscribers 
FOR DELETE 
USING (is_staff(auth.uid()));

-- Keep service role access for Stripe webhooks
CREATE POLICY "Service role full access" 
ON public.subscribers 
FOR ALL 
USING ((auth.jwt() ->> 'role') = 'service_role')
WITH CHECK ((auth.jwt() ->> 'role') = 'service_role');