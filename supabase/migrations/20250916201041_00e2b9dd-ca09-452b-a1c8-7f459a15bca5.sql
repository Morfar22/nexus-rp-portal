-- Add a more permissive policy for admin users to access server settings
CREATE POLICY "Admins can view all server settings"
ON public.server_settings
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM custom_users 
    WHERE id = auth.uid() 
    AND role = 'admin'
    AND banned = false
  )
);

-- Add admin policy for updates too
CREATE POLICY "Admins can manage all server settings"
ON public.server_settings
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM custom_users 
    WHERE id = auth.uid() 
    AND role = 'admin'
    AND banned = false
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM custom_users 
    WHERE id = auth.uid() 
    AND role = 'admin'
    AND banned = false
  )
);