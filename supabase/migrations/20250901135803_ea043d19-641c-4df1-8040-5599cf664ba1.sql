-- Fix RLS policies to work with your custom authentication system
-- Drop the current policies and create ones that work without requiring app.current_user_id
DROP POLICY IF EXISTS "Custom admin can access permissions" ON permissions;
DROP POLICY IF EXISTS "Custom admin can access role_permissions" ON role_permissions;
DROP POLICY IF EXISTS "Custom admin can access staff_roles" ON staff_roles;

-- Create simpler policies that allow access to admin users from custom_users
-- Note: These use has_super_admin_hierarchy function which should work with custom_users
CREATE POLICY "Admins can manage permissions" ON permissions
FOR ALL USING (has_super_admin_hierarchy(auth.uid()));

CREATE POLICY "Admins can manage role_permissions" ON role_permissions  
FOR ALL USING (has_super_admin_hierarchy(auth.uid()));

CREATE POLICY "Admins can manage staff_roles" ON staff_roles
FOR ALL USING (has_super_admin_hierarchy(auth.uid()));

-- Also ensure user_role_assignments can be managed by admins
DROP POLICY IF EXISTS "Can manage user role assignments with permission" ON user_role_assignments;

CREATE POLICY "Admins can manage user_role_assignments" ON user_role_assignments
FOR ALL USING (has_super_admin_hierarchy(auth.uid()));