-- CRITICAL SECURITY FIX: Replace dangerous RLS policies for custom_users table

-- Drop ALL existing policies first (using IF EXISTS to handle missing ones gracefully)
DROP POLICY IF EXISTS "Service can manage custom users" ON public.custom_users;
DROP POLICY IF EXISTS "System can manage users" ON public.custom_users;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.custom_users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.custom_users;
DROP POLICY IF EXISTS "Staff can view all users" ON public.custom_users;
DROP POLICY IF EXISTS "Staff can manage all users" ON public.custom_users;
DROP POLICY IF EXISTS "System operations for services" ON public.custom_users;
DROP POLICY IF EXISTS "Allow user registration" ON public.custom_users;

-- Now create the secure policies with unique names

-- 1. Users can only view their own data
CREATE POLICY "custom_users_select_own" 
ON public.custom_users 
FOR SELECT 
USING (auth.uid() = id);

-- 2. Users can only update their own basic data  
CREATE POLICY "custom_users_update_own" 
ON public.custom_users 
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 3. Admin/Staff can view all users for management
CREATE POLICY "custom_users_admin_select_all" 
ON public.custom_users 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.custom_users admin_check
    WHERE admin_check.id = auth.uid() 
    AND admin_check.role IN ('admin', 'staff', 'moderator')
    AND admin_check.banned = false
  )
);

-- 4. Admin/Staff can manage all users
CREATE POLICY "custom_users_admin_manage_all" 
ON public.custom_users 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.custom_users admin_check
    WHERE admin_check.id = auth.uid() 
    AND admin_check.role IN ('admin', 'staff')
    AND admin_check.banned = false
  )
);

-- 5. Service role operations (for backend edge functions)
CREATE POLICY "custom_users_service_operations" 
ON public.custom_users 
FOR ALL 
USING (auth.jwt() ->> 'role' = 'service_role');

-- 6. Allow new user registration
CREATE POLICY "custom_users_registration" 
ON public.custom_users 
FOR INSERT 
WITH CHECK (true);  -- Allow registration, but validate in application logic

-- Create secure function for permission checking
CREATE OR REPLACE FUNCTION public.get_user_role(user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role
  FROM public.custom_users
  WHERE id = user_id AND banned = false;
  
  RETURN COALESCE(user_role, 'none');
END;
$$;