-- Fix RLS policies to work with the current auth system
-- Since you're using custom auth, let's check custom_users instead

-- Update has_permission function to check custom_users table
CREATE OR REPLACE FUNCTION public.has_permission(check_user_id uuid DEFAULT NULL::uuid, permission_name text DEFAULT NULL::text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- If no user ID provided, return false
  IF check_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Super admin bypass - check custom_users table for admin role
  IF EXISTS (
    SELECT 1 
    FROM custom_users
    WHERE id = check_user_id 
    AND role = 'admin'
    AND NOT banned
  ) THEN
    RETURN TRUE;
  END IF;

  -- For staff/moderator roles, give basic permissions
  IF permission_name IS NOT NULL THEN
    RETURN EXISTS (
      SELECT 1
      FROM custom_users
      WHERE id = check_user_id
      AND role IN ('admin', 'staff', 'moderator')
      AND NOT banned
    );
  END IF;

  RETURN FALSE;
END;
$function$;

-- Update RLS policies to use custom_users table
DROP POLICY IF EXISTS "Admin users can view permissions" ON permissions;
DROP POLICY IF EXISTS "Admin users can manage role permissions" ON role_permissions;
DROP POLICY IF EXISTS "Admin users can manage staff roles" ON staff_roles;
DROP POLICY IF EXISTS "Admin users can view staff roles" ON staff_roles;

CREATE POLICY "Admin users can view permissions"
ON permissions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM custom_users 
    WHERE custom_users.id = auth.uid() 
    AND custom_users.role = 'admin'
    AND NOT custom_users.banned
  )
);

CREATE POLICY "Admin users can manage role permissions"
ON role_permissions FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM custom_users 
    WHERE custom_users.id = auth.uid() 
    AND custom_users.role = 'admin'
    AND NOT custom_users.banned
  )
);

CREATE POLICY "Admin users can manage staff roles"
ON staff_roles FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM custom_users 
    WHERE custom_users.id = auth.uid() 
    AND custom_users.role = 'admin'
    AND NOT custom_users.banned
  )
);

-- Create a policy for user_role_assignments too
CREATE POLICY "Admin users can manage user role assignments"
ON user_role_assignments FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM custom_users 
    WHERE custom_users.id = auth.uid() 
    AND custom_users.role = 'admin'
    AND NOT custom_users.banned
  )
);