-- CRITICAL SECURITY FIX: Create proper secure RLS policies for custom_users table

-- Drop existing policies to replace with secure ones
DROP POLICY IF EXISTS "Allow user registration" ON public.custom_users;
DROP POLICY IF EXISTS "System operations for services" ON public.custom_users;

-- 1. Allow user registration (secure version)
CREATE POLICY "Secure user registration" 
ON public.custom_users 
FOR INSERT 
WITH CHECK (
  -- Allow service role (for system operations)
  auth.jwt() ->> 'role' = 'service_role'
  OR
  -- Allow users to create their own account (signup)
  (auth.uid() IS NULL AND NEW.id IS NOT NULL)
  OR
  -- Allow authenticated users to update their own record
  (auth.uid() = NEW.id)
);

-- 2. Users can view their own profile data only
CREATE POLICY "Users can view their own profile" 
ON public.custom_users 
FOR SELECT 
USING (auth.uid() = id);

-- 3. Users can update their own basic profile data (with restrictions)
CREATE POLICY "Users can update their own profile" 
ON public.custom_users 
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id 
  -- Prevent users from changing sensitive system fields
  AND OLD.role = NEW.role -- Can't change own role
  AND OLD.banned = NEW.banned -- Can't unban themselves
  AND OLD.banned_by = NEW.banned_by -- Can't clear ban info
  AND OLD.email_verified = NEW.email_verified -- Can't self-verify email
  AND OLD.created_at = NEW.created_at -- Can't modify creation date
);

-- 4. Staff can view all users (for administrative purposes)
CREATE POLICY "Staff can view all users" 
ON public.custom_users 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.custom_users staff_user
    WHERE staff_user.id = auth.uid() 
    AND staff_user.role IN ('admin', 'staff', 'moderator')
    AND staff_user.banned = false
  )
);

-- 5. Admins and staff can manage all users
CREATE POLICY "Admins can manage all users" 
ON public.custom_users 
FOR ALL 
USING (
  -- Allow service role for system operations
  auth.jwt() ->> 'role' = 'service_role'
  OR
  -- Allow admin and staff roles to manage users
  EXISTS (
    SELECT 1 FROM public.custom_users admin_user
    WHERE admin_user.id = auth.uid() 
    AND admin_user.role IN ('admin', 'staff')
    AND admin_user.banned = false
  )
);

-- 6. Create a safe public view for displaying user info (no sensitive data)
DROP VIEW IF EXISTS public.user_public_profiles;
CREATE VIEW public.user_public_profiles AS
SELECT 
  id,
  username,
  full_name,
  avatar_url,
  role,
  created_at,
  discord_username
FROM public.custom_users
WHERE banned = false AND email_verified = true;

-- Add comment to explain the view
COMMENT ON VIEW public.user_public_profiles IS 'Safe public view of user profiles without sensitive data like emails, password hashes, or tokens';

-- Create a security function for permission checking
CREATE OR REPLACE FUNCTION public.check_user_role(user_id uuid, required_role text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Return false if user_id is null
  IF user_id IS NULL THEN
    RETURN false;
  END IF;
  
  RETURN EXISTS (
    SELECT 1 FROM public.custom_users
    WHERE id = user_id 
    AND banned = false
    AND email_verified = true
    AND (
      (required_role = 'user') OR
      (required_role = 'moderator' AND role IN ('moderator', 'staff', 'admin')) OR
      (required_role = 'staff' AND role IN ('staff', 'admin')) OR
      (required_role = 'admin' AND role = 'admin')
    )
  );
END;
$$;