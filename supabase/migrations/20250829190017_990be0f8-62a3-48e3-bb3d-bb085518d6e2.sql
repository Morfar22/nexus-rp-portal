-- Update RLS policies for user_role_assignments to work with new staff role system

-- Drop existing policies that use legacy is_admin() function
DROP POLICY IF EXISTS "Admins can manage role assignments" ON user_role_assignments;
DROP POLICY IF EXISTS "Admins can insert any role assignment" ON user_role_assignments;

-- Create new policies that work with the staff_roles system
CREATE POLICY "Staff with admin hierarchy can manage role assignments"
ON user_role_assignments
USING (
  EXISTS (
    SELECT 1 FROM user_role_assignments ura
    JOIN staff_roles sr ON ura.role_id = sr.id
    WHERE ura.user_id = auth.uid() 
    AND ura.is_active = true 
    AND sr.hierarchy_level >= 70
  )
);

CREATE POLICY "Staff with admin hierarchy can insert role assignments"
ON user_role_assignments
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_role_assignments ura
    JOIN staff_roles sr ON ura.role_id = sr.id
    WHERE ura.user_id = auth.uid() 
    AND ura.is_active = true 
    AND sr.hierarchy_level >= 70
  )
);

-- Also update the staff_roles policies for consistency
DROP POLICY IF EXISTS "Admins can manage staff roles" ON staff_roles;

CREATE POLICY "High hierarchy staff can manage staff roles"
ON staff_roles
USING (
  EXISTS (
    SELECT 1 FROM user_role_assignments ura
    JOIN staff_roles sr ON ura.role_id = sr.id
    WHERE ura.user_id = auth.uid() 
    AND ura.is_active = true 
    AND sr.hierarchy_level >= 90
  )
);