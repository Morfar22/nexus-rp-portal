-- Fix RLS policies for application_types table to work with custom authentication

-- Drop the old policy that uses auth.uid()
DROP POLICY IF EXISTS "Can manage application types with permission" ON application_types;

-- Create new policies that work with custom authentication
-- Allow everyone to view active application types (needed for public forms)
CREATE POLICY "Allow viewing active application types" ON application_types
FOR SELECT
USING (is_active = true);

-- Allow staff to manage all application types
CREATE POLICY "Allow staff to manage application types" ON application_types
FOR ALL
USING (
  -- Check if the current user is staff by checking the user_id against custom_users table
  EXISTS (
    SELECT 1 FROM custom_users cu
    WHERE cu.id = auth.uid() 
    AND cu.role IN ('admin', 'staff')
    AND cu.banned = false
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM custom_users cu
    WHERE cu.id = auth.uid() 
    AND cu.role IN ('admin', 'staff')
    AND cu.banned = false
  )
);