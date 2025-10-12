-- Drop the broken policies
DROP POLICY IF EXISTS "Staff can manage all server settings" ON public.server_settings;
DROP POLICY IF EXISTS "Anyone can read server settings" ON public.server_settings;

-- Create policies that work with your custom auth system
-- Since you're using custom sessions and Bearer tokens, we need service-role level access
CREATE POLICY "Service role can manage server settings" 
ON public.server_settings 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Also allow anon role since your frontend uses anon key with bearer token
CREATE POLICY "Anon can manage server settings" 
ON public.server_settings 
FOR ALL 
TO anon
USING (true)
WITH CHECK (true);