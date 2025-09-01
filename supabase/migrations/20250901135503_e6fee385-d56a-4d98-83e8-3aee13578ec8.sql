-- Update RLS policies to allow admin users to view role management data
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Staff can view permissions" ON permissions;
DROP POLICY IF EXISTS "Staff can view role permissions" ON role_permissions;
DROP POLICY IF EXISTS "Admins can manage role permissions" ON role_permissions;

-- Create more permissive policies for admin users
CREATE POLICY "Admin users can view permissions"
ON permissions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admin users can manage role permissions"
ON role_permissions FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Update staff_roles policy to be more permissive for admins
DROP POLICY IF EXISTS "Super admins can manage staff roles" ON staff_roles;

CREATE POLICY "Admin users can manage staff roles"
ON staff_roles FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Allow admins to view staff roles
CREATE POLICY "Admin users can view staff roles"
ON staff_roles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);