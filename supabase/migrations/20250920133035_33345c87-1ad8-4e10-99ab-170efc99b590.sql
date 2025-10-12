-- Fix role_permissions policies to allow proper access
DROP POLICY IF EXISTS "Staff can view role permissions" ON role_permissions;
DROP POLICY IF EXISTS "Admins can manage role permissions" ON role_permissions;

-- Create a more permissive policy for role_permissions
CREATE POLICY "Allow reading role permissions" ON role_permissions
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage role permissions" ON role_permissions
FOR ALL
USING (check_user_is_admin(auth.uid()))
WITH CHECK (check_user_is_admin(auth.uid()));

-- Also fix permissions table policy
DROP POLICY IF EXISTS "Staff can view permissions" ON permissions;
DROP POLICY IF EXISTS "Admins can manage permissions" ON permissions;

CREATE POLICY "Allow reading permissions" ON permissions
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage permissions" ON permissions
FOR ALL
USING (check_user_is_admin(auth.uid()))
WITH CHECK (check_user_is_admin(auth.uid()));