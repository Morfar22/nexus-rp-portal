-- Remove all policies on team_members that cause infinite recursion
-- These policies check custom_users within themselves

DROP POLICY IF EXISTS "Staff can create team members" ON public.team_members;
DROP POLICY IF EXISTS "Staff can delete team members" ON public.team_members;
DROP POLICY IF EXISTS "Staff can update team members" ON public.team_members;
DROP POLICY IF EXISTS "Staff can view all team data" ON public.team_members;

-- Also clean up similar policies on other tables that might be causing issues
DROP POLICY IF EXISTS "Admins can manage sessions" ON public.custom_sessions;
DROP POLICY IF EXISTS "Staff can view sessions for admin" ON public.custom_sessions;
DROP POLICY IF EXISTS "Admins can delete failed login attempts" ON public.failed_login_attempts;
DROP POLICY IF EXISTS "Admins can update failed login attempts" ON public.failed_login_attempts;
DROP POLICY IF EXISTS "Staff can view failed login attempts" ON public.failed_login_attempts;

-- Ensure team_members only has the simple read policy (already created)
-- This should allow the team members to be fetched without infinite recursion

-- Also ensure staff_roles only has simple read policy (already created)

-- Verify the policies are clean
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('team_members', 'staff_roles')
ORDER BY tablename, policyname;