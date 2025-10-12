-- Drop existing policies if they exist to recreate them properly
DROP POLICY IF EXISTS "Staff can manage server settings" ON public.server_settings;
DROP POLICY IF EXISTS "Anyone can read server settings" ON public.server_settings;

-- Create policies for server_settings - Allow staff to manage all settings
CREATE POLICY "Staff can manage server settings" 
ON public.server_settings 
FOR ALL 
USING (is_staff(auth.uid()))
WITH CHECK (is_staff(auth.uid()));

-- Create policy for reading settings (more permissive for reading)
CREATE POLICY "Anyone can read server settings" 
ON public.server_settings 
FOR SELECT 
USING (true);