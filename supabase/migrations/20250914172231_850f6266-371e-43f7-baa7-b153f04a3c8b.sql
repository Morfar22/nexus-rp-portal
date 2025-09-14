-- Create security definer functions to check roles without RLS recursion
-- These functions bypass RLS when checking custom_users table
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

-- Test if we can fix the custom auth issue by creating a function that returns the current user id
-- from the custom session system
CREATE OR REPLACE FUNCTION public.get_current_custom_user_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_id uuid;
BEGIN
  -- For now, return auth.uid() but this could be modified to work with custom sessions
  user_id := auth.uid();
  
  -- If auth.uid() is null, we might need to check custom session token
  -- This would require additional logic to parse session tokens
  
  RETURN user_id;
END;
$$;