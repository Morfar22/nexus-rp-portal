-- Fix infinite recursion in RLS policies by creating security definer functions
-- These functions can safely access custom_users without triggering RLS

-- Drop problematic policies that cause recursion
DROP POLICY IF EXISTS "Admin users can view permissions" ON public.permissions;
DROP POLICY IF EXISTS "Admin users can manage role permissions" ON public.role_permissions;
DROP POLICY IF EXISTS "Admin users can manage staff roles" ON public.staff_roles;
DROP POLICY IF EXISTS "Admin users can manage user role assignments" ON public.user_role_assignments;

-- Create security definer functions to check roles without RLS recursion
CREATE OR REPLACE FUNCTION public.check_user_is_admin(check_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF check_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  RETURN EXISTS (
    SELECT 1 FROM custom_users
    WHERE id = check_user_id 
    AND role = 'admin'
    AND banned = false
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.check_user_is_staff_role(check_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF check_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  RETURN EXISTS (
    SELECT 1 FROM custom_users
    WHERE id = check_user_id 
    AND role IN ('admin', 'staff', 'moderator')
    AND banned = false
  );
END;
$$;

-- Update policies to use the security definer functions
CREATE POLICY "Admin users can view permissions" 
ON public.permissions 
FOR SELECT 
USING (check_user_is_admin());

CREATE POLICY "Admin users can manage role permissions" 
ON public.role_permissions 
FOR ALL 
USING (check_user_is_admin());

CREATE POLICY "Admin users can manage staff roles" 
ON public.staff_roles 
FOR ALL 
USING (check_user_is_admin());

CREATE POLICY "Admin users can manage user role assignments" 
ON public.user_role_assignments 
FOR ALL 
USING (check_user_is_admin());

-- Also add staff-level permissions for viewing
CREATE POLICY "Staff can view permissions" 
ON public.permissions 
FOR SELECT 
USING (check_user_is_staff_role());

CREATE POLICY "Staff can view staff roles" 
ON public.staff_roles 
FOR SELECT 
USING (check_user_is_staff_role());

CREATE POLICY "Staff can view user role assignments" 
ON public.user_role_assignments 
FOR SELECT 
USING (check_user_is_staff_role());