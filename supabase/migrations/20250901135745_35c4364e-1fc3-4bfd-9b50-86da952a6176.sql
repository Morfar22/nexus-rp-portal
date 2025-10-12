-- Drop existing policy that's causing conflict
DROP POLICY IF EXISTS "Admin users can manage user role assignments" ON user_role_assignments;

-- Create the corrected policy for user role assignments
CREATE POLICY "Admin users can manage user role assignments"
ON user_role_assignments FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM custom_users 
    WHERE custom_users.id = auth.uid() 
    AND custom_users.role = 'admin'
    AND NOT custom_users.banned
  )
);