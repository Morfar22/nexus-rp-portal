-- First, drop ALL existing policies that might cause recursion issues
DROP POLICY IF EXISTS "Admin users can view permissions" ON public.permissions;
DROP POLICY IF EXISTS "Admin users can view permissions v2" ON public.permissions;  
DROP POLICY IF EXISTS "Staff can view permissions" ON public.permissions;
DROP POLICY IF EXISTS "Staff can view permissions v2" ON public.permissions;

DROP POLICY IF EXISTS "Admin users can manage role permissions" ON public.role_permissions;
DROP POLICY IF EXISTS "Admin users can manage role permissions v2" ON public.role_permissions;

DROP POLICY IF EXISTS "Admin users can manage staff roles" ON public.staff_roles;
DROP POLICY IF EXISTS "Admin users can manage staff roles v2" ON public.staff_roles;
DROP POLICY IF EXISTS "Staff can view staff roles" ON public.staff_roles;
DROP POLICY IF EXISTS "Staff can view staff roles v2" ON public.staff_roles;

DROP POLICY IF EXISTS "Admin users can manage user role assignments" ON public.user_role_assignments;
DROP POLICY IF EXISTS "Admin users can manage user role assignments v2" ON public.user_role_assignments;
DROP POLICY IF EXISTS "Staff can view user role assignments" ON public.user_role_assignments;
DROP POLICY IF EXISTS "Staff can view user role assignments v2" ON public.user_role_assignments;

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

-- Now create the new policies
CREATE POLICY "Admin can view permissions" 
ON public.permissions 
FOR SELECT 
USING (check_user_is_admin(auth.uid()));

CREATE POLICY "Admin can manage role permissions" 
ON public.role_permissions 
FOR ALL 
USING (check_user_is_admin(auth.uid()));

CREATE POLICY "Admin can manage staff roles" 
ON public.staff_roles 
FOR ALL 
USING (check_user_is_admin(auth.uid()));

CREATE POLICY "Admin can manage user role assignments" 
ON public.user_role_assignments 
FOR ALL 
USING (check_user_is_admin(auth.uid()));

-- Add staff-level permissions for viewing
CREATE POLICY "Staff can view permissions new" 
ON public.permissions 
FOR SELECT 
USING (check_user_is_staff_role(auth.uid()));

CREATE POLICY "Staff can view staff roles new" 
ON public.staff_roles 
FOR SELECT 
USING (check_user_is_staff_role(auth.uid()));

CREATE POLICY "Staff can view user role assignments new" 
ON public.user_role_assignments 
FOR SELECT 
USING (check_user_is_staff_role(auth.uid()));