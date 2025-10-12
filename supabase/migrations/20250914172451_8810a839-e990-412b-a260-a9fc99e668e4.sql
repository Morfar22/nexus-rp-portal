-- Create additional helper functions to completely bypass RLS issues

-- Function to get user data safely
CREATE OR REPLACE FUNCTION public.get_user_data(user_uuid uuid)
RETURNS TABLE (
  id uuid,
  username text,
  email text,
  role text,
  banned boolean,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY 
  SELECT cu.id, cu.username, cu.email, cu.role, cu.banned, cu.created_at
  FROM custom_users cu
  WHERE cu.id = user_uuid;
END;
$$;

-- Function to get role permissions safely
CREATE OR REPLACE FUNCTION public.get_role_permissions_data(role_uuid uuid)
RETURNS TABLE (
  permission_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY 
  SELECT p.name
  FROM role_permissions rp
  INNER JOIN permissions p ON rp.permission_id = p.id
  WHERE rp.role_id = role_uuid;
END;
$$;

-- Function to search users safely
CREATE OR REPLACE FUNCTION public.search_users_data(search_query text)
RETURNS TABLE (
  id uuid,
  username text,
  email text,
  role text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY 
  SELECT cu.id, cu.username, cu.email, cu.role
  FROM custom_users cu
  WHERE cu.email ILIKE '%' || search_query || '%'
     OR cu.username ILIKE '%' || search_query || '%'
  LIMIT 10;
END;
$$;