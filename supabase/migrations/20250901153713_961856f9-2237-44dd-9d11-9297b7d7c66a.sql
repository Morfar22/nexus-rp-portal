-- Check what the current user session looks like
SELECT auth.uid();

-- Update RLS policies for team_members to work with custom auth system
DROP POLICY IF EXISTS "Staff can manage team members" ON team_members;
DROP POLICY IF EXISTS "Anyone can view active team members" ON team_members;

-- Create new policies that work with custom auth
CREATE POLICY "Anyone can view active team members" 
ON team_members 
FOR SELECT 
USING (is_active = true);

-- Create a policy that allows users with admin role to manage team members
CREATE POLICY "Admins can manage team members" 
ON team_members 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM custom_users 
    WHERE id = (
      SELECT user_id FROM custom_sessions 
      WHERE session_token = current_setting('request.headers', true)::json->>'authorization'
      AND expires_at > NOW()
    ) 
    AND role IN ('admin', 'staff')
    AND banned = false
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM custom_users 
    WHERE id = (
      SELECT user_id FROM custom_sessions 
      WHERE session_token = current_setting('request.headers', true)::json->>'authorization'
      AND expires_at > NOW()
    ) 
    AND role IN ('admin', 'staff') 
    AND banned = false
  )
);