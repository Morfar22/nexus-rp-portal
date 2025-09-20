-- Drop ALL existing policies on team_members
DROP POLICY IF EXISTS "Anyone can view active team members" ON public.team_members;
DROP POLICY IF EXISTS "Staff can manage team members" ON public.team_members;

-- Re-check what policies exist
SELECT policyname FROM pg_policies WHERE tablename = 'team_members';