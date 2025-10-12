-- Add RLS policy to allow staff to update team members
CREATE POLICY "Staff can update team members"
ON public.team_members
FOR UPDATE
TO authenticated
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