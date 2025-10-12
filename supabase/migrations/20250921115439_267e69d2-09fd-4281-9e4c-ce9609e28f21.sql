-- Temporarily make servers table more permissive for debugging
DROP POLICY IF EXISTS "Allow staff to manage servers" ON public.servers;
DROP POLICY IF EXISTS "Allow public to view active servers" ON public.servers;

-- Allow all authenticated users to manage servers temporarily
CREATE POLICY "Temp: All authenticated users can manage servers" ON public.servers
FOR ALL USING (auth.uid() IS NOT NULL);

-- Allow all users to view servers
CREATE POLICY "Temp: All users can view servers" ON public.servers
FOR SELECT USING (true);

-- Also fix server_settings
DROP POLICY IF EXISTS "Allow staff to manage server settings" ON public.server_settings;

CREATE POLICY "Temp: All authenticated users can manage server settings" ON public.server_settings
FOR ALL USING (auth.uid() IS NOT NULL);