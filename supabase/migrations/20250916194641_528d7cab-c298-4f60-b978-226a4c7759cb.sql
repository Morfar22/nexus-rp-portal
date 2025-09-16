-- Clean up any remaining recursive policies and check if team members can load

-- First, let's check what policies might still be causing issues
-- Drop any policies that might be calling functions that query custom_users

-- Fix any remaining recursive issues on related tables
-- Check if there are any views or functions that might cause recursion

-- Ensure the is_staff function is security definer to avoid recursion
DROP FUNCTION IF EXISTS public.is_staff(uuid);
CREATE OR REPLACE FUNCTION public.is_staff(check_user_uuid uuid DEFAULT NULL::uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  -- Use a simple direct query without referencing other functions
  SELECT EXISTS (
    SELECT 1 
    FROM custom_users 
    WHERE id = check_user_uuid 
    AND role IN ('admin', 'staff', 'moderator')
    AND banned = false
  );
$$;

-- Also fix has_permission function to be security definer
DROP FUNCTION IF EXISTS public.has_permission(uuid, text);
CREATE OR REPLACE FUNCTION public.has_permission(check_user_id uuid DEFAULT NULL::uuid, permission_name text DEFAULT NULL::text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  -- Simple direct check without recursion
  SELECT EXISTS (
    SELECT 1 
    FROM custom_users
    WHERE id = check_user_id 
    AND role = 'admin'
    AND NOT banned
  );
$$;