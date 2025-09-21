-- Drop and recreate policies with proper auth context
DROP POLICY IF EXISTS "Staff can manage server settings" ON public.server_settings;
DROP POLICY IF EXISTS "Anyone can read server settings" ON public.server_settings;

-- Create more permissive policies for server_settings
CREATE POLICY "Staff can manage all server settings" 
ON public.server_settings 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM custom_users 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'staff', 'moderator')
    AND banned = false
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM custom_users 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'staff', 'moderator')
    AND banned = false
  )
);

-- Create policy for reading settings
CREATE POLICY "Anyone can read server settings" 
ON public.server_settings 
FOR SELECT 
USING (true);