-- First, let's insert your profile with admin role
INSERT INTO profiles (id, email, username, role) 
VALUES (
  '5027696b-aa78-4d31-84c6-a94ee5940f5f'::uuid, 
  'emilfrobergww@gmail.com', 
  'Mmorfar', 
  'admin'
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  username = EXCLUDED.username,
  role = EXCLUDED.role;

-- Also fix the has_permission function to work with the profiles table
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
  
  -- Super admin bypass - check profiles table for admin role
  IF EXISTS (
    SELECT 1 
    FROM profiles
    WHERE id = check_user_id 
    AND role = 'admin'
    AND NOT banned
  ) THEN
    RETURN TRUE;
  END IF;

  -- For specific permissions, check role-based permissions
  IF permission_name IS NOT NULL THEN
    -- Check if user has a role assignment with the required permission
    RETURN EXISTS (
      SELECT 1
      FROM user_role_assignments ura
      JOIN role_permissions rp ON ura.role_id = rp.role_id
      JOIN permissions p ON rp.permission_id = p.id
      WHERE ura.user_id = check_user_id
      AND p.name = permission_name
      AND ura.is_active = true
    );
  END IF;

  RETURN FALSE;
END;
$function$;