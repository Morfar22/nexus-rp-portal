-- Update custom_users with admin role and create policies that work with custom authentication
UPDATE custom_users 
SET role = 'admin' 
WHERE email = 'emilfrobergww@gmail.com';

-- Drop existing problematic policies and create new ones for custom_users
DROP POLICY IF EXISTS "Allow admin access to permissions" ON permissions;
DROP POLICY IF EXISTS "Allow admin access to role_permissions" ON role_permissions;
DROP POLICY IF EXISTS "Allow admin access to staff_roles" ON staff_roles;

-- Create policies that work with custom_users table
CREATE POLICY "Custom admin can access permissions" ON permissions
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM custom_users 
    WHERE id = (current_setting('app.current_user_id', true))::uuid
    AND role = 'admin'
    AND NOT banned
  )
);

CREATE POLICY "Custom admin can access role_permissions" ON role_permissions  
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM custom_users 
    WHERE id = (current_setting('app.current_user_id', true))::uuid
    AND role = 'admin'
    AND NOT banned
  )
);

CREATE POLICY "Custom admin can access staff_roles" ON staff_roles
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM custom_users 
    WHERE id = (current_setting('app.current_user_id', true))::uuid
    AND role = 'admin'
    AND NOT banned
  )
);