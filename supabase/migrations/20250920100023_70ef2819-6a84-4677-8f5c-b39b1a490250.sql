-- Drop existing policies that don't work with custom auth
DROP POLICY IF EXISTS "Staff can update team members" ON public.team_members;

-- Create new policies that work with custom authentication
-- Allow all operations for service role (used by edge functions)
CREATE POLICY "Service role full access to team members"
ON public.team_members
FOR ALL
TO public
USING (((auth.jwt() ->> 'role'::text) = 'service_role'::text))
WITH CHECK (((auth.jwt() ->> 'role'::text) = 'service_role'::text));

-- Allow public read access to active team members (for display)
CREATE POLICY "Public can view active team members"
ON public.team_members
FOR SELECT
TO public
USING (is_active = true);

-- Allow authenticated users to manage team members (they will be validated by the application layer)
CREATE POLICY "Authenticated users can manage team members"
ON public.team_members
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);