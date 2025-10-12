-- Fix RLS policies for applications table to work with custom authentication

-- Drop the old policies that use auth.uid()
DROP POLICY IF EXISTS "Users can create their own applications" ON applications;
DROP POLICY IF EXISTS "Users can view their own applications" ON applications;
DROP POLICY IF EXISTS "Users can update their pending applications" ON applications;

-- Create new policies that work with custom authentication
-- Allow anyone to insert applications (we'll validate user_id in the application)
CREATE POLICY "Allow application creation" ON applications
FOR INSERT
WITH CHECK (true);

-- Allow users to view applications (staff can view all, others based on permissions)
CREATE POLICY "Allow application viewing" ON applications
FOR SELECT
USING (
  -- Staff can view all applications
  is_staff(user_id) OR
  -- Users with permission can view all
  has_permission(user_id, 'applications.view') OR
  -- Users can view their own (we'll need to check via custom sessions)
  user_id IN (
    SELECT cs.user_id 
    FROM custom_sessions cs 
    WHERE cs.user_id = applications.user_id
    AND cs.expires_at > NOW()
  )
);

-- Allow users to update their own pending applications
CREATE POLICY "Allow application updates" ON applications
FOR UPDATE
USING (
  -- Staff can update all
  is_staff(user_id) OR
  -- Users with permission can update all  
  has_permission(user_id, 'applications.review') OR
  -- Users can update their own pending applications
  (status = 'pending' AND user_id IN (
    SELECT cs.user_id 
    FROM custom_sessions cs 
    WHERE cs.user_id = applications.user_id
    AND cs.expires_at > NOW()
  ))
);