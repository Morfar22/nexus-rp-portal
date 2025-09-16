-- Drop existing policies that rely on auth.uid()
DROP POLICY IF EXISTS "Admins can insert server settings" ON public.server_settings;
DROP POLICY IF EXISTS "Admins can update server settings" ON public.server_settings;
DROP POLICY IF EXISTS "Admins can view all server settings" ON public.server_settings;
DROP POLICY IF EXISTS "Admins can manage all server settings" ON public.server_settings;

-- Create new policies that work with service role access (for custom auth)
CREATE POLICY "Service role can manage server settings"
ON public.server_settings
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Allow authenticated access with broader permissions for now
CREATE POLICY "Allow server settings management for authenticated"
ON public.server_settings
FOR ALL
TO authenticated, anon
USING (true)
WITH CHECK (true);