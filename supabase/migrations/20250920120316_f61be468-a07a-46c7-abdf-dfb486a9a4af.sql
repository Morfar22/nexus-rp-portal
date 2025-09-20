-- Update the is_staff function to check both old and new role systems
CREATE OR REPLACE FUNCTION public.is_staff(check_user_uuid uuid DEFAULT NULL::uuid)
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
    
    -- Check if user has staff role in custom_users table (old system)
    IF EXISTS (
        SELECT 1 
        FROM custom_users 
        WHERE id = check_user_uuid 
        AND role IN ('admin', 'staff', 'moderator')
        AND banned = false
    ) THEN
        RETURN true;
    END IF;
    
    -- Check if user has active role assignments (new system)
    IF EXISTS (
        SELECT 1
        FROM user_role_assignments ura
        JOIN staff_roles sr ON ura.role_id = sr.id
        WHERE ura.user_id = check_user_uuid 
        AND ura.is_active = true
        AND sr.is_active = true
    ) THEN
        RETURN true;
    END IF;
    
    RETURN false;
END;
$function$