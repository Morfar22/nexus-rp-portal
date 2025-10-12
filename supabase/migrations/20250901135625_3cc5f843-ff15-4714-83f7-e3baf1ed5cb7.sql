-- First, ensure your profile exists and has admin role
INSERT INTO profiles (id, email, role, username)
VALUES ('5027696b-aa78-4d31-84c6-a94ee5940f5f', 'emilfrobergww@gmail.com', 'admin', 'Mmorfar')
ON CONFLICT (id) DO UPDATE SET 
  role = 'admin',
  email = COALESCE(profiles.email, 'emilfrobergww@gmail.com'),
  username = COALESCE(profiles.username, 'Mmorfar');

-- Drop the overly restrictive existing policies and create simple ones
DROP POLICY IF EXISTS "Admin users can view permissions" ON permissions;
DROP POLICY IF EXISTS "Admin users can manage role permissions" ON role_permissions;  
DROP POLICY IF EXISTS "Admin users can manage staff roles" ON staff_roles;
DROP POLICY IF EXISTS "Admin users can view staff roles" ON staff_roles;

-- Create simple policies that allow admin role users
CREATE POLICY "Allow admin access to permissions" ON permissions
FOR ALL USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "Allow admin access to role_permissions" ON role_permissions  
FOR ALL USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "Allow admin access to staff_roles" ON staff_roles
FOR ALL USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);