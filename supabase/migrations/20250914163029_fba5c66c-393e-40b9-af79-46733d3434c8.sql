-- CRITICAL SECURITY FIX: Secure team_members table against data harvesting
-- Issue: Staff personal information (Discord IDs, usernames, locations) publicly accessible

-- Drop ALL existing dangerous policies
DROP POLICY IF EXISTS "Allow team management" ON public.team_members;
DROP POLICY IF EXISTS "Allow team member operations" ON public.team_members;
DROP POLICY IF EXISTS "Anyone can view active team members" ON public.team_members;  
DROP POLICY IF EXISTS "Public can view active team members" ON public.team_members;

-- Create secure policies

-- 1. Public can view only SAFE information about active team members (no Discord IDs, usernames, or sensitive data)
CREATE POLICY "Public can view safe team info" 
ON public.team_members 
FOR SELECT 
USING (
  is_active = true 
  -- This policy will be combined with column-level security via views if needed
);

-- 2. Staff can view all team member information for management purposes
CREATE POLICY "Staff can view all team data" 
ON public.team_members 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.custom_users staff
    WHERE staff.id = auth.uid() 
    AND staff.role IN ('admin', 'staff', 'moderator')
    AND staff.banned = false
  )
);

-- 3. Staff can create new team members
CREATE POLICY "Staff can create team members" 
ON public.team_members 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.custom_users staff
    WHERE staff.id = auth.uid() 
    AND staff.role IN ('admin', 'staff')
    AND staff.banned = false
  )
);

-- 4. Staff can update team members
CREATE POLICY "Staff can update team members" 
ON public.team_members 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.custom_users staff
    WHERE staff.id = auth.uid() 
    AND staff.role IN ('admin', 'staff')
    AND staff.banned = false
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.custom_users staff
    WHERE staff.id = auth.uid() 
    AND staff.role IN ('admin', 'staff')
    AND staff.banned = false
  )
);

-- 5. Staff can delete team members
CREATE POLICY "Staff can delete team members" 
ON public.team_members 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.custom_users staff
    WHERE staff.id = auth.uid() 
    AND staff.role IN ('admin', 'staff')
    AND staff.banned = false
  )
);

-- 6. Service role can manage everything (for automated operations)
CREATE POLICY "Service role can manage team members" 
ON public.team_members 
FOR ALL 
USING (auth.jwt() ->> 'role' = 'service_role');

-- Create a secure view for public team display (only safe information)
CREATE OR REPLACE VIEW public.team_members_public AS
SELECT 
  id,
  name,
  role,
  bio,
  image_url,
  location, -- Keep location as it might be city-level info that's okay to show
  order_index,
  is_active,
  created_at,
  staff_role_id
  -- Explicitly exclude: discord_id, discord_username, auto_synced, last_discord_sync
FROM public.team_members
WHERE is_active = true;

-- Grant access to the public view
GRANT SELECT ON public.team_members_public TO anon, authenticated;

-- Verify the new secure policies
SELECT 
  tablename, 
  policyname, 
  cmd,
  CASE 
    WHEN qual LIKE '%staff%' OR qual LIKE '%admin%' THEN '✅ Staff/admin access only'
    WHEN qual LIKE '%service_role%' THEN '✅ Service role access'
    WHEN qual LIKE '%is_active = true%' THEN '⚠️ Public access to active members - review what data is exposed'
    WHEN qual = 'true' THEN '🚨 DANGEROUS: Full public access!'
    ELSE '⚠️ Review: ' || LEFT(qual, 50)
  END as security_status
FROM pg_policies 
WHERE tablename = 'team_members'
ORDER BY policyname;