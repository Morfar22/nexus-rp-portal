-- Enable RLS on subscribers table (if not already enabled)
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

-- Only create policies that don't exist yet
DO $$
BEGIN
    -- Policy for users to view their own subscription
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'subscribers' 
        AND policyname = 'Users can view their own subscription'
    ) THEN
        CREATE POLICY "Users can view their own subscription" 
        ON public.subscribers 
        FOR SELECT 
        USING (auth.uid() = user_id);
    END IF;
    
    -- Policy for service role to manage subscriptions
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'subscribers' 
        AND policyname = 'Service role can manage subscriptions'
    ) THEN
        CREATE POLICY "Service role can manage subscriptions" 
        ON public.subscribers 
        FOR ALL 
        USING ((auth.jwt() ->> 'role') = 'service_role')
        WITH CHECK ((auth.jwt() ->> 'role') = 'service_role');
    END IF;
    
    -- Policy for creating subscriptions
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'subscribers' 
        AND policyname = 'Allow subscription creation'
    ) THEN
        CREATE POLICY "Allow subscription creation" 
        ON public.subscribers 
        FOR INSERT 
        WITH CHECK (true);
    END IF;
END $$;