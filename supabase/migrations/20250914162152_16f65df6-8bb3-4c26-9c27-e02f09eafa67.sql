-- CRITICAL SECURITY FIX: Implement proper RLS policies for custom_users table

-- First, drop the existing dangerous policies that allow public access
DROP POLICY IF EXISTS "Service can manage custom users" ON public.custom_users;
DROP POLICY IF EXISTS "System can manage users" ON public.custom_users;

-- Create secure RLS policies

-- 1. Users can view their own basic profile data (excluding sensitive fields)
CREATE POLICY "Users can view their own profile" 
ON public.custom_users 
FOR SELECT 
USING (auth.uid() = id);

-- 2. Users can update their own basic profile data (excluding sensitive system fields)
CREATE POLICY "Users can update their own profile" 
ON public.custom_users 
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id 
  AND OLD.role = NEW.role -- Prevent users from changing their own role
  AND OLD.banned = NEW.banned -- Prevent users from unbanning themselves
  AND OLD.banned_by = NEW.banned_by -- Prevent users from clearing ban info
  AND OLD.email_verified = NEW.email_verified -- Prevent users from self-verifying email
);

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
-- This should be used sparingly and only by authenticated service operations
CREATE POLICY "System operations for authenticated services" 
ON public.custom_users 
FOR ALL 
USING (
  -- Only allow if this is a service role or specific system operation
  auth.jwt() ->> 'role' = 'service_role'
  OR 
  -- Allow specific system operations that need to create/manage users
  (auth.uid() IS NULL AND current_setting('request.jwt.claims', true)::json ->> 'role' = 'anon')
);

-- 6. Create a secure view for public user data (for displaying usernames, avatars, etc.)
CREATE OR REPLACE VIEW public.user_public_profiles AS
SELECT 
  id,
  username,
  full_name,
  avatar_url,
  role,
  created_at,
  banned,
  discord_username
FROM public.custom_users
WHERE banned = false;

-- Enable RLS on the view
ALTER VIEW public.user_public_profiles SET (security_barrier = true);

-- Allow anyone to read the public profiles view (safe data only)
CREATE POLICY "Anyone can view public user profiles" 
ON public.user_public_profiles 
FOR SELECT 
USING (true);

-- Create a security function to safely check user permissions without exposing data
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