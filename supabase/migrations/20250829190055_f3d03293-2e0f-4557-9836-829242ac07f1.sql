-- Fix infinite recursion by creating security definer functions

-- Create function to check if user has high hierarchy staff role (70+)
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

-- Create function to check if user has super admin hierarchy (90+)
CREATE OR REPLACE FUNCTION public.has_super_admin_hierarchy(check_user_uuid uuid DEFAULT auth.uid())
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
        AND sr.hierarchy_level >= 90
    );
END;
$$;

-- Drop and recreate RLS policies using the security definer functions
DROP POLICY IF EXISTS "Staff with admin hierarchy can manage role assignments" ON user_role_assignments;
DROP POLICY IF EXISTS "Staff with admin hierarchy can insert role assignments" ON user_role_assignments;
DROP POLICY IF EXISTS "High hierarchy staff can manage staff roles" ON staff_roles;

-- Updated policies for user_role_assignments
CREATE POLICY "Admin hierarchy can manage role assignments"
ON user_role_assignments
USING (has_admin_hierarchy());

CREATE POLICY "Admin hierarchy can insert role assignments"
ON user_role_assignments
FOR INSERT
WITH CHECK (has_admin_hierarchy());

-- Updated policies for staff_roles
CREATE POLICY "Super admin hierarchy can manage staff roles"
ON staff_roles
USING (has_super_admin_hierarchy());