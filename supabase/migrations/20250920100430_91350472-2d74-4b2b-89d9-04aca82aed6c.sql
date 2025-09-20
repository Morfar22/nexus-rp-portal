-- Clean up conflicting team_members RLS policies and create proper ones
DROP POLICY IF EXISTS "Service role full access to team members" ON public.team_members;
DROP POLICY IF EXISTS "Public can view active team members" ON public.team_members;
DROP POLICY IF EXISTS "Authenticated users can manage team members" ON public.team_members;
DROP POLICY IF EXISTS "Public can read team members" ON public.team_members;
DROP POLICY IF EXISTS "Public can view safe team info" ON public.team_members;
DROP POLICY IF EXISTS "Public read team members simple" ON public.team_members;
DROP POLICY IF EXISTS "Service role can manage team members" ON public.team_members;

-- Create clean RLS policies for team_members
CREATE POLICY "Anyone can view active team members" 
ON public.team_members FOR SELECT 
USING (is_active = true);

CREATE POLICY "Staff can manage team members" 
ON public.team_members FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.custom_users 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'staff') 
    AND banned = false
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.custom_users 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'staff') 
    AND banned = false
  )
);