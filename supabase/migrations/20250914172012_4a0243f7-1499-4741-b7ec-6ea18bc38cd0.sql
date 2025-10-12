-- Temporary fix: Add permissive policies for role management access
-- This allows the role management system to work while auth.uid() is null

-- Allow viewing user role assignments for role management
CREATE POLICY "Allow role management access to user assignments" 
ON public.user_role_assignments 
FOR SELECT 
USING (true);

-- Allow viewing staff roles for role management  
CREATE POLICY "Allow role management access to staff roles"
ON public.staff_roles
FOR SELECT
USING (true);

-- Allow viewing permissions for role management
CREATE POLICY "Allow role management access to permissions"
ON public.permissions
FOR SELECT
USING (true);

-- Allow viewing role permissions for role management
CREATE POLICY "Allow role management access to role permissions"
ON public.role_permissions
FOR SELECT
USING (true);