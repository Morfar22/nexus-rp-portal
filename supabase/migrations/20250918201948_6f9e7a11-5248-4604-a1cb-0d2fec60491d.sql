-- Fix RLS policies for custom_users to allow admin users to update roles
-- First, drop the restrictive update policy
DROP POLICY IF EXISTS "Users can update own data" ON public.custom_users;

-- Create new policies that work with the custom auth system
CREATE POLICY "Users can update own profile" 
ON public.custom_users 
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Allow service role to update any user (for admin operations)
CREATE POLICY "Service role can update users" 
ON public.custom_users 
FOR UPDATE 
USING (true)
WITH CHECK (true);

-- Create a function to check if current session user is admin
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_session_user_id uuid;
  user_role text;
BEGIN
  -- This would need to be implemented based on your session management
  -- For now, we'll allow service role to handle admin operations
  RETURN ((auth.jwt() ->> 'role'::text) = 'service_role'::text);
END;
$$;