-- Create proper RLS policies for team_members table
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