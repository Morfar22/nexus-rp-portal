-- Fix the check_user_is_admin function to use custom_users table
CREATE OR REPLACE FUNCTION public.check_user_is_admin(check_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
$function$

-- Also recreate the packages policy to ensure it uses the updated function
DROP POLICY IF EXISTS "Can manage packages with permission" ON packages;

CREATE POLICY "Can manage packages with permission" ON packages
FOR ALL 
USING (
  check_user_is_admin(auth.uid()) OR
  has_permission(auth.uid(), 'packages.manage')
)
WITH CHECK (
  check_user_is_admin(auth.uid()) OR
  has_permission(auth.uid(), 'packages.manage')
);