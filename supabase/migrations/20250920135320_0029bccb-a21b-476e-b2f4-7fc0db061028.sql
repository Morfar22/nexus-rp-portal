-- Fix RLS policies for applications table to work with custom authentication system

-- Drop ALL existing RLS policies on applications table
DROP POLICY IF EXISTS "Allow application creation" ON applications;
DROP POLICY IF EXISTS "Allow application viewing" ON applications;
DROP POLICY IF EXISTS "Allow application updates" ON applications;
DROP POLICY IF EXISTS "Allow application deletion" ON applications;
DROP POLICY IF EXISTS "Can delete applications with permission" ON applications;
DROP POLICY IF EXISTS "Can review applications with permission" ON applications;
DROP POLICY IF EXISTS "Can view applications with permission" ON applications;
DROP POLICY IF EXISTS "Public can create applications" ON applications;
DROP POLICY IF EXISTS "Staff can view all applications" ON applications;
DROP POLICY IF EXISTS "Staff can update applications" ON applications;
DROP POLICY IF EXISTS "Staff can delete applications" ON applications;
DROP POLICY IF EXISTS "Users can view their own applications" ON applications;

-- Create new RLS policies that work with custom authentication
CREATE POLICY "Public can create applications" 
ON applications 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Staff can view all applications" 
ON applications 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM custom_sessions cs
    JOIN custom_users cu ON cs.user_id = cu.id
    WHERE cs.expires_at > now()
    AND cu.role IN ('admin', 'staff', 'moderator')
    AND cu.banned = false
  )
);

CREATE POLICY "Staff can update applications" 
ON applications 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM custom_sessions cs
    JOIN custom_users cu ON cs.user_id = cu.id
    WHERE cs.expires_at > now()
    AND cu.role IN ('admin', 'staff', 'moderator')
    AND cu.banned = false
  )
);

CREATE POLICY "Staff can delete applications" 
ON applications 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM custom_sessions cs
    JOIN custom_users cu ON cs.user_id = cu.id
    WHERE cs.expires_at > now()
    AND cu.role IN ('admin', 'staff', 'moderator')
    AND cu.banned = false
  )
);

CREATE POLICY "Users can view their own applications" 
ON applications 
FOR SELECT 
USING (
  user_id IN (
    SELECT cs.user_id FROM custom_sessions cs
    WHERE cs.expires_at > now()
  )
);