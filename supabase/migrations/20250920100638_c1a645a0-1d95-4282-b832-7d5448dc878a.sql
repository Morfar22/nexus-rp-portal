-- Fix team_members RLS policies to work with custom authentication
DROP POLICY IF EXISTS "Anyone can view active team members" ON public.team_members;
DROP POLICY IF EXISTS "Staff can manage team members" ON public.team_members;

-- Create updated policies for custom auth system
CREATE POLICY "Anyone can view active team members" 
ON public.team_members FOR SELECT 
USING (is_active = true);

-- Since this uses custom authentication, we need to allow service role to manage team members
-- The application logic will handle permission checking through the custom auth system
CREATE POLICY "Service role can manage team members" 
ON public.team_members FOR ALL 
USING (
  ((auth.jwt() ->> 'role'::text) = 'service_role'::text)
)
WITH CHECK (
  ((auth.jwt() ->> 'role'::text) = 'service_role'::text)
);