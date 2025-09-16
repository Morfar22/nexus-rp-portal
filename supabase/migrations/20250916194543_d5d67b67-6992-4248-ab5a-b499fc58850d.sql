-- Check which functions might be causing recursion by querying custom_users
-- and ensure team_members and staff_roles have simple read policies

-- Check if team_members table exists and has simple policies
DROP POLICY IF EXISTS "Staff can manage team members" ON public.team_members;
DROP POLICY IF EXISTS "Admins can manage team members" ON public.team_members;
DROP POLICY IF EXISTS "Users can view team members" ON public.team_members;

-- Ensure team_members has simple read access (already created but let's make sure)
DROP POLICY IF EXISTS "Allow public read access to team members" ON public.team_members;
CREATE POLICY "Public can read team members" 
ON public.team_members 
FOR SELECT 
USING (true);

-- Check staff_roles policies
DROP POLICY IF EXISTS "Staff can manage staff roles" ON public.staff_roles;
DROP POLICY IF EXISTS "Admins can manage staff roles" ON public.staff_roles;

-- Ensure staff_roles has simple read access
DROP POLICY IF EXISTS "Allow public read access to staff roles" ON public.staff_roles;
CREATE POLICY "Public can read staff roles" 
ON public.staff_roles 
FOR SELECT 
USING (true);

-- For debugging, let's see what tables might be causing issues
SELECT tablename, policyname, qual, with_check 
FROM pg_policies 
WHERE schemaname = 'public' 
AND (qual LIKE '%custom_users%' OR with_check LIKE '%custom_users%')
ORDER BY tablename, policyname;