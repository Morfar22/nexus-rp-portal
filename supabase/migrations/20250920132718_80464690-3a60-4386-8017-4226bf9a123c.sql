-- Fix RLS policies for permissions table to allow proper access
DROP POLICY IF EXISTS "Allow role management access to permissions" ON permissions;
DROP POLICY IF EXISTS "Temp allow all permissions" ON permissions;
DROP POLICY IF EXISTS "Admin can view permissions" ON permissions;
DROP POLICY IF EXISTS "Staff can view permissions new" ON permissions;
DROP POLICY IF EXISTS "Admins can manage permissions" ON permissions;
DROP POLICY IF EXISTS "Super admins can manage permissions" ON permissions;

-- Create new simplified policies for permissions
CREATE POLICY "Staff can view permissions" ON permissions
FOR SELECT 
USING (
  check_user_is_staff_role(auth.uid()) OR 
  check_user_is_admin(auth.uid()) OR 
  EXISTS (
    SELECT 1 FROM user_role_assignments ura 
    JOIN staff_roles sr ON ura.role_id = sr.id 
    WHERE ura.user_id = auth.uid() AND ura.is_active = true AND sr.is_active = true
  )
);

CREATE POLICY "Admins can manage permissions" ON permissions
FOR ALL
USING (check_user_is_admin(auth.uid()))
WITH CHECK (check_user_is_admin(auth.uid()));

-- Also fix role_permissions policies
DROP POLICY IF EXISTS "Allow role management access to role permissions" ON role_permissions;
DROP POLICY IF EXISTS "Temp allow all role_permissions" ON role_permissions;
DROP POLICY IF EXISTS "Admin can manage role permissions" ON role_permissions;
DROP POLICY IF EXISTS "Admins can manage role_permissions" ON role_permissions;

-- Create new policies for role_permissions
CREATE POLICY "Staff can view role permissions" ON role_permissions
FOR SELECT 
USING (
  check_user_is_staff_role(auth.uid()) OR 
  check_user_is_admin(auth.uid()) OR 
  EXISTS (
    SELECT 1 FROM user_role_assignments ura 
    JOIN staff_roles sr ON ura.role_id = sr.id 
    WHERE ura.user_id = auth.uid() AND ura.is_active = true AND sr.is_active = true
  )
);

CREATE POLICY "Admins can manage role permissions" ON role_permissions
FOR ALL
USING (check_user_is_admin(auth.uid()))
WITH CHECK (check_user_is_admin(auth.uid()));