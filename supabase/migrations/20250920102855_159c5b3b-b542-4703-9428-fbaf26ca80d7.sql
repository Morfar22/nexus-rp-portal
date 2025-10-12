-- Enable RLS on subscribers table
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

-- Policy for users to view their own subscription
CREATE POLICY "Users can view their own subscription" 
ON public.subscribers 
FOR SELECT 
USING (auth.uid() = user_id);

-- Policy for staff to view all subscriptions
CREATE POLICY "Staff can view all subscriptions" 
ON public.subscribers 
FOR SELECT 
USING (has_permission(auth.uid(), 'packages.manage'));

-- Policy for service role to manage subscriptions (for Stripe webhooks)
CREATE POLICY "Service role can manage subscriptions" 
ON public.subscribers 
FOR ALL 
USING ((auth.jwt() ->> 'role') = 'service_role')
WITH CHECK ((auth.jwt() ->> 'role') = 'service_role');

-- Policy for users to update their own subscription (for manual updates)
CREATE POLICY "Users can update their own subscription" 
ON public.subscribers 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy for creating subscriptions
CREATE POLICY "Allow subscription creation" 
ON public.subscribers 
FOR INSERT 
WITH CHECK (true);