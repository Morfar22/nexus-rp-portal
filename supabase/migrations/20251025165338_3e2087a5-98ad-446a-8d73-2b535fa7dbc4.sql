-- Drop all existing policies on user_role_assignments
DROP POLICY IF EXISTS "Anyone can view assigned roles" ON user_role_assignments;
DROP POLICY IF EXISTS "Anyone can insert assigned roles" ON user_role_assignments;
DROP POLICY IF EXISTS "User can view their own role assignments" ON user_role_assignments;
DROP POLICY IF EXISTS "User can insert own role assignment" ON user_role_assignments;
DROP POLICY IF EXISTS "Admin staff can manage role assignments" ON user_role_assignments;
DROP POLICY IF EXISTS "Admin staff can insert role assignments" ON user_role_assignments;
DROP POLICY IF EXISTS "Allow insert for user" ON user_role_assignments;
DROP POLICY IF EXISTS "Admin can manage user role assignments" ON user_role_assignments;
DROP POLICY IF EXISTS "Allow select for user" ON user_role_assignments;
DROP POLICY IF EXISTS "Staff can view user role assignments new" ON user_role_assignments;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON user_role_assignments;
DROP POLICY IF EXISTS "Allow insert for all" ON user_role_assignments;
DROP POLICY IF EXISTS "Admins can manage user_role_assignments" ON user_role_assignments;
DROP POLICY IF EXISTS "Allow all authenticated insert" ON user_role_assignments;
DROP POLICY IF EXISTS "Staff can manage user role assignments" ON user_role_assignments;
DROP POLICY IF EXISTS "Allow role management access to user assignments" ON user_role_assignments;

-- Create clean, simple policies for user_role_assignments

-- Service role has full access
CREATE POLICY "Service role full access"
ON user_role_assignments
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Admins can manage all role assignments
CREATE POLICY "Admins can manage role assignments"
ON user_role_assignments
FOR ALL
TO authenticated, anon
USING (
  check_user_is_admin(auth.uid()) OR
  EXISTS (
    SELECT 1 FROM custom_users 
    WHERE id = auth.uid() 
    AND role = 'admin' 
    AND banned = false
  )
)
WITH CHECK (
  check_user_is_admin(auth.uid()) OR
  EXISTS (
    SELECT 1 FROM custom_users 
    WHERE id = auth.uid() 
    AND role = 'admin' 
    AND banned = false
  )
);

-- Users can view their own role assignments
CREATE POLICY "Users can view their own assignments"
ON user_role_assignments
FOR SELECT
TO authenticated, anon
USING (auth.uid() = user_id OR true);

-- Staff with permissions can manage assignments
CREATE POLICY "Staff with permission can manage assignments"
ON user_role_assignments
FOR ALL
TO authenticated, anon
USING (has_permission(auth.uid(), 'staff.manage'))
WITH CHECK (has_permission(auth.uid(), 'staff.manage'));