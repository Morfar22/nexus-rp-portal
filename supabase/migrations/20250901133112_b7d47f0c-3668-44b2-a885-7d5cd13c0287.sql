-- Update permission functions to work with custom authentication system
-- Replace the existing functions to check custom_users table instead

-- Update is_staff function to work with custom_users
CREATE OR REPLACE FUNCTION public.is_staff(check_user_uuid uuid DEFAULT NULL)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    -- If no user ID provided, return false
    IF check_user_uuid IS NULL THEN
        RETURN false;
    END IF;
    
    -- Check if user exists in custom_users and has admin or staff role
    RETURN EXISTS (
        SELECT 1 
        FROM custom_users 
        WHERE id = check_user_uuid 
        AND role IN ('admin', 'staff', 'moderator')
        AND banned = false
    );
END;
$function$;

-- Update has_permission function to work with custom_users
CREATE OR REPLACE FUNCTION public.has_permission(check_user_id uuid DEFAULT NULL, permission_name text DEFAULT NULL::text)
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
  
  -- Super admin (admin role) bypass - check custom_users table
  IF EXISTS (
    SELECT 1 
    FROM custom_users
    WHERE id = check_user_id 
    AND role = 'admin'
    AND banned = false
  ) THEN
    RETURN TRUE;
  END IF;

  -- For now, return true for staff and moderator roles for basic permissions
  -- This can be expanded later with a proper permission system
  IF permission_name IS NOT NULL THEN
    RETURN EXISTS (
      SELECT 1
      FROM custom_users
      WHERE id = check_user_id
      AND role IN ('admin', 'staff', 'moderator')
      AND banned = false
    );
  END IF;

  RETURN FALSE;
END;
$function$;

-- Update has_hierarchy_level function
CREATE OR REPLACE FUNCTION public.has_hierarchy_level(check_user_id uuid DEFAULT NULL, min_level integer DEFAULT 0)
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
  
  -- Check hierarchy based on role in custom_users
  RETURN EXISTS (
    SELECT 1 
    FROM custom_users
    WHERE id = check_user_id 
    AND banned = false
    AND (
      (role = 'admin' AND min_level <= 100) OR
      (role = 'staff' AND min_level <= 70) OR  
      (role = 'moderator' AND min_level <= 50) OR
      (role = 'user' AND min_level <= 10)
    )
  );
END;
$function$;

-- Update has_admin_hierarchy function
CREATE OR REPLACE FUNCTION public.has_admin_hierarchy(check_user_uuid uuid DEFAULT NULL)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    -- If no user ID provided, return false
    IF check_user_uuid IS NULL THEN
        RETURN false;
    END IF;
    
    RETURN EXISTS (
        SELECT 1 
        FROM custom_users
        WHERE id = check_user_uuid 
        AND role IN ('admin', 'staff')
        AND banned = false
    );
END;
$function$;

-- Update has_super_admin_hierarchy function
CREATE OR REPLACE FUNCTION public.has_super_admin_hierarchy(check_user_uuid uuid DEFAULT NULL)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    -- If no user ID provided, return false
    IF check_user_uuid IS NULL THEN
        RETURN false;
    END IF;
    
    RETURN EXISTS (
        SELECT 1 
        FROM custom_users
        WHERE id = check_user_uuid 
        AND role = 'admin'
        AND banned = false
    );
END;
$function$;