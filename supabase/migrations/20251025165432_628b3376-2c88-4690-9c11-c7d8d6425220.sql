-- Drop ALL existing policies on user_role_assignments
DO $$ 
DECLARE 
    pol record;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'user_role_assignments' 
        AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON user_role_assignments', pol.policyname);
    END LOOP;
END $$;

-- Create clean, simple policies for user_role_assignments

-- Service role has full access
CREATE POLICY "Service role full access"
ON user_role_assignments
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Admins can manage all role assignments
CREATE POLICY "Admins can manage role assignments"
ON user_role_assignments
FOR ALL
TO authenticated, anon
USING (
  check_user_is_admin(auth.uid()) OR
  EXISTS (
    SELECT 1 FROM custom_users 
    WHERE id = auth.uid() 
    AND role = 'admin' 
    AND banned = false
  )
)
WITH CHECK (
  check_user_is_admin(auth.uid()) OR
  EXISTS (
    SELECT 1 FROM custom_users 
    WHERE id = auth.uid() 
    AND role = 'admin' 
    AND banned = false
  )
);

-- Users can view their own role assignments
CREATE POLICY "Users can view their own assignments"
ON user_role_assignments
FOR SELECT
TO authenticated, anon
USING (auth.uid() = user_id OR true);

-- Staff with permissions can manage assignments
CREATE POLICY "Staff with permission can manage assignments"
ON user_role_assignments
FOR ALL
TO authenticated, anon
USING (has_permission(auth.uid(), 'staff.manage'))
WITH CHECK (has_permission(auth.uid(), 'staff.manage'));