-- Check current RLS policies for team_members
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'team_members';

-- Drop existing policies and recreate them properly
DROP POLICY IF EXISTS "Staff can manage team members" ON team_members;
DROP POLICY IF EXISTS "Anyone can view active team members" ON team_members;

-- Create proper RLS policies for team_members
CREATE POLICY "Anyone can view active team members" 
ON team_members 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Staff can manage team members" 
ON team_members 
FOR ALL 
USING (is_staff(auth.uid()))
WITH CHECK (is_staff(auth.uid()));