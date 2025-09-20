-- Fix security issues - Enable RLS on views and tables that need it
-- Enable RLS on user_roles_view (if needed) and ensure proper access control

-- First, let's make sure RLS is enabled on all our custom tables that might be missing it
DO $$
BEGIN
    -- Enable RLS on staff_roles if not already enabled
    IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON c.relnamespace = n.oid 
                  WHERE c.relname = 'staff_roles' AND n.nspname = 'public' AND c.relrowsecurity = true) THEN
        ALTER TABLE public.staff_roles ENABLE ROW LEVEL SECURITY;
    END IF;

    -- Enable RLS on user_role_assignments if not already enabled  
    IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON c.relnamespace = n.oid 
                  WHERE c.relname = 'user_role_assignments' AND n.nspname = 'public' AND c.relrowsecurity = true) THEN
        ALTER TABLE public.user_role_assignments ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Since we can't easily fix the view security definer warnings without breaking functionality,
-- let's create a secure alternative approach by updating our functions instead of relying on the view

-- Drop the view and create a secure function instead
DROP VIEW IF EXISTS user_roles_view;

-- Create a secure function to get user role
CREATE OR REPLACE FUNCTION public.get_user_current_role(user_uuid uuid DEFAULT auth.uid())
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role text;
BEGIN
  -- Check if user has any custom roles assigned
  SELECT sr.name INTO user_role
  FROM user_role_assignments ura
  JOIN staff_roles sr ON ura.role_id = sr.id
  WHERE ura.user_id = user_uuid 
    AND ura.is_active = true
    AND sr.is_active = true
  ORDER BY sr.hierarchy_level DESC
  LIMIT 1;
  
  -- If no custom role found, return 'user'
  RETURN COALESCE(user_role, 'user');
END;
$$;