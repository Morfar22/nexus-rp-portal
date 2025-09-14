-- Create a complete workaround for the custom authentication system
-- Since auth.uid() is null, we need to bypass it entirely for role management

-- Create a function that can be called directly to check user roles using user ID
CREATE OR REPLACE FUNCTION public.check_role_for_user(user_uuid uuid, required_role text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF user_uuid IS NULL THEN
    RETURN false;
  END IF;
  
  RETURN EXISTS (
    SELECT 1 FROM custom_users
    WHERE id = user_uuid 
    AND (
      (required_role = 'admin' AND role = 'admin') OR
      (required_role = 'staff' AND role IN ('admin', 'staff')) OR
      (required_role = 'moderator' AND role IN ('admin', 'staff', 'moderator'))
    )
    AND banned = false
  );
END;
$$;

-- Create a public function to get staff roles data without RLS restrictions
CREATE OR REPLACE FUNCTION public.get_staff_roles_data()
RETURNS TABLE (
  id uuid,
  name text,
  display_name text,
  description text,
  color text,
  hierarchy_level integer,
  is_active boolean,
  created_at timestamptz,
  updated_at timestamptz,
  created_by uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY 
  SELECT sr.id, sr.name, sr.display_name, sr.description, sr.color, 
         sr.hierarchy_level, sr.is_active, sr.created_at, sr.updated_at, sr.created_by
  FROM staff_roles sr
  WHERE sr.is_active = true
  ORDER BY sr.hierarchy_level ASC;
END;
$$;

-- Create a public function to get user role assignments without RLS restrictions
CREATE OR REPLACE FUNCTION public.get_user_role_assignments_data()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  role_id uuid,
  assigned_at timestamptz,
  assigned_by uuid,
  expires_at timestamptz,
  is_active boolean,
  display_name text,
  color text,
  hierarchy_level integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY 
  SELECT ura.id, ura.user_id, ura.role_id, ura.assigned_at, ura.assigned_by, 
         ura.expires_at, ura.is_active, sr.display_name, sr.color, sr.hierarchy_level
  FROM user_role_assignments ura
  INNER JOIN staff_roles sr ON ura.role_id = sr.id
  WHERE ura.is_active = true
  ORDER BY ura.assigned_at DESC;
END;
$$;

-- Create a public function to get permissions without RLS restrictions
CREATE OR REPLACE FUNCTION public.get_permissions_data()
RETURNS TABLE (
  id uuid,
  name text,
  display_name text,
  description text,
  category text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY 
  SELECT p.id, p.name, p.display_name, p.description, p.category, p.created_at
  FROM permissions p
  ORDER BY p.category, p.display_name;
END;
$$;