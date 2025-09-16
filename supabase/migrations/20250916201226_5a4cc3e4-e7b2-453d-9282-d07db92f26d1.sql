-- Add specific INSERT policy for server_settings
CREATE POLICY "Admins can insert server settings"
ON public.server_settings
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM custom_users 
    WHERE id = auth.uid() 
    AND role = 'admin'
    AND banned = false
  )
);

-- Add specific UPDATE policy for server_settings  
CREATE POLICY "Admins can update server settings"
ON public.server_settings
FOR UPDATE
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