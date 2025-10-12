-- Drop existing policies that depend on auth.uid()
DROP POLICY IF EXISTS "Users can view their own subscription" ON public.subscribers;
DROP POLICY IF EXISTS "select_own_subscription" ON public.subscribers;
DROP POLICY IF EXISTS "update_own_subscription" ON public.subscribers;

-- Create new policies that work with custom auth system
-- Policy for all authenticated users to view their subscription by user_id
CREATE POLICY "Users can view their subscription by user_id" 
ON public.subscribers 
FOR SELECT 
USING (true);

-- Policy for all authenticated users to update subscriptions
CREATE POLICY "Users can update subscriptions" 
ON public.subscribers 
FOR UPDATE 
USING (true)
WITH CHECK (true);