-- Fix packages RLS policy to allow super admins and admins
DROP POLICY IF EXISTS "Can manage packages with permission" ON packages;

CREATE POLICY "Can manage packages with permission" ON packages
FOR ALL 
USING (
  has_permission(auth.uid(), 'packages.manage') OR 
  check_user_is_admin(auth.uid())
)
WITH CHECK (
  has_permission(auth.uid(), 'packages.manage') OR 
  check_user_is_admin(auth.uid())
);