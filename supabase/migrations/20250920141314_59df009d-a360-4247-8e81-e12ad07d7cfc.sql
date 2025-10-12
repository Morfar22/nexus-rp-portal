-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Staff can view all applications" ON applications;

-- Create a new policy that respects required_permissions
CREATE POLICY "Staff can view applications based on their roles" ON applications
FOR SELECT
USING (
  -- Anyone can see applications with no required roles
  (required_permissions IS NULL OR array_length(required_permissions, 1) = 0)
  OR
  -- Or if user has at least one of the required roles
  EXISTS (
    SELECT 1 
    FROM user_role_assignments ura
    JOIN staff_roles sr ON ura.role_id = sr.id
    WHERE ura.user_id = auth.uid()
      AND ura.is_active = true
      AND sr.is_active = true
      AND sr.name = ANY(required_permissions)
  )
);