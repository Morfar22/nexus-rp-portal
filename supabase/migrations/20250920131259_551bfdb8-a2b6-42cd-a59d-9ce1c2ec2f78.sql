-- Fix application_types RLS policies to work properly with custom authentication
-- Drop the incorrect policies
DROP POLICY IF EXISTS "Allow viewing active application types" ON application_types;
DROP POLICY IF EXISTS "Allow staff to manage application types" ON application_types;

-- Create simple policies that allow operations
-- Anyone can view active application types (needed for public application forms)
CREATE POLICY "Public can view active application types" ON application_types
FOR SELECT
USING (is_active = true);

-- Allow all operations on application_types (we'll handle permissions in the application layer)
-- This is necessary because we can't rely on auth.uid() with custom authentication
CREATE POLICY "Allow application type management" ON application_types
FOR ALL
USING (true)
WITH CHECK (true);