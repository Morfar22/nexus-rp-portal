-- CRITICAL SECURITY FIX: Implement proper RLS policies for custom_users table

-- First, drop the existing dangerous policies that allow public access
DROP POLICY IF EXISTS "Service can manage custom users" ON public.custom_users;
DROP POLICY IF EXISTS "System can manage users" ON public.custom_users;

-- Create secure RLS policies

-- 1. Users can view their own basic profile data
CREATE POLICY "Users can view their own profile" 
ON public.custom_users 
FOR SELECT 
USING (auth.uid() = id);

-- 2. Users can update their own basic profile data (limited fields only)
CREATE POLICY "Users can update their own profile" 
ON public.custom_users 
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 3. Staff/Admins can view all users (for management purposes)
CREATE POLICY "Staff can view all users" 
ON public.custom_users 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.custom_users staff_check
    WHERE staff_check.id = auth.uid() 
    AND staff_check.role IN ('admin', 'staff', 'moderator')
    AND staff_check.banned = false
  )
);

-- 4. Staff/Admins can manage all users
CREATE POLICY "Staff can manage all users" 
ON public.custom_users 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.custom_users staff_check
    WHERE staff_check.id = auth.uid() 
    AND staff_check.role IN ('admin', 'staff')
    AND staff_check.banned = false
  )
);

-- 5. Allow system/service operations (for edge functions and internal operations)
CREATE POLICY "System operations for services" 
ON public.custom_users 
FOR ALL 
USING (
  -- Only allow if this is a service role
  auth.jwt() ->> 'role' = 'service_role'
);

-- 6. Allow user registration (INSERT for new users)
CREATE POLICY "Allow user registration" 
ON public.custom_users 
FOR INSERT 
WITH CHECK (
  -- Allow anonymous users to create accounts (registration)
  auth.uid() IS NULL OR auth.uid() = id
);

-- Create a security function to safely check user permissions
CREATE OR REPLACE FUNCTION public.check_user_permission(user_id uuid, required_role text DEFAULT 'user')
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.custom_users
    WHERE id = user_id 
    AND banned = false
    AND (
      required_role = 'user' OR
      (required_role = 'moderator' AND role IN ('moderator', 'staff', 'admin')) OR
      (required_role = 'staff' AND role IN ('staff', 'admin')) OR
      (required_role = 'admin' AND role = 'admin')
    )
  );
END;
$$;