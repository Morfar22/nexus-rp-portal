-- Drop all existing role assignment policies and recreate with security definer functions

-- Drop all existing policies for user_role_assignments
DROP POLICY IF EXISTS "Admin hierarchy can manage role assignments" ON user_role_assignments;
DROP POLICY IF EXISTS "Admin hierarchy can insert role assignments" ON user_role_assignments;
DROP POLICY IF EXISTS "Staff with admin hierarchy can manage role assignments" ON user_role_assignments;
DROP POLICY IF EXISTS "Staff with admin hierarchy can insert role assignments" ON user_role_assignments;

-- Create the security definer functions (recreate in case they don't exist)
CREATE OR REPLACE FUNCTION public.has_admin_hierarchy(check_user_uuid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM user_role_assignments ura
        JOIN staff_roles sr ON ura.role_id = sr.id
        WHERE ura.user_id = check_user_uuid 
        AND ura.is_active = true 
        AND sr.hierarchy_level >= 70
    );
END;
$$;

-- Create new policies using the security definer function
CREATE POLICY "Admin staff can manage role assignments"
ON user_role_assignments
USING (has_admin_hierarchy());

CREATE POLICY "Admin staff can insert role assignments"
ON user_role_assignments
FOR INSERT
WITH CHECK (has_admin_hierarchy());