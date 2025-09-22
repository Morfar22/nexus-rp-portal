-- Drop the old policy that relies on auth.uid()
DROP POLICY IF EXISTS "Staff can manage application types" ON application_types;

-- Create new policy that allows service role and staff operations
CREATE POLICY "Allow service role and staff to manage application types"
ON application_types
FOR ALL
USING (
  -- Allow service role full access
  ((auth.jwt() ->> 'role'::text) = 'service_role'::text) OR
  -- Allow if there's no auth context (for custom auth system)
  (auth.uid() IS NULL)
)
WITH CHECK (
  -- Allow service role full access  
  ((auth.jwt() ->> 'role'::text) = 'service_role'::text) OR
  -- Allow if there's no auth context (for custom auth system)
  (auth.uid() IS NULL)
);