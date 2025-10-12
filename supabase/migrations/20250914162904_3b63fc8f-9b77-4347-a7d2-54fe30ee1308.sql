-- CRITICAL SECURITY FIX: Replace dangerous custom_sessions policies

-- Drop the dangerous policies that allow public access
DROP POLICY IF EXISTS "System can manage sessions" ON public.custom_sessions;
DROP POLICY IF EXISTS "Users can view their own sessions" ON public.custom_sessions;

-- Create secure replacement policies

-- 1. Users can ONLY view their own sessions (using proper Supabase auth)
CREATE POLICY "Users can view their own sessions" 
ON public.custom_sessions 
FOR SELECT 
USING (auth.uid() = user_id);

-- 2. Users can update their own sessions (for session refresh, logout, etc.)
CREATE POLICY "Users can update their own sessions" 
ON public.custom_sessions 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 3. Users can delete their own sessions (for logout)
CREATE POLICY "Users can delete their own sessions" 
ON public.custom_sessions 
FOR DELETE 
USING (auth.uid() = user_id);

-- 4. Service role can manage sessions (for system operations like cleanup, creation)
CREATE POLICY "Service role can manage sessions" 
ON public.custom_sessions 
FOR ALL 
USING (auth.jwt() ->> 'role' = 'service_role');

-- 5. Allow session creation for authenticated users and anonymous (for login process)
CREATE POLICY "Allow session creation" 
ON public.custom_sessions 
FOR INSERT 
WITH CHECK (
  -- Service role can create any session
  auth.jwt() ->> 'role' = 'service_role'
  OR
  -- Users can create sessions for themselves
  auth.uid() = user_id
  OR
  -- Allow anonymous session creation during login process
  auth.uid() IS NULL
);

-- 6. Staff can view sessions for administrative purposes (with restrictions)
CREATE POLICY "Staff can view sessions for admin" 
ON public.custom_sessions 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.custom_users staff
    WHERE staff.id = auth.uid() 
    AND staff.role IN ('admin', 'staff')
    AND staff.banned = false
  )
);

-- 7. Admins can manage sessions for security purposes (ban users, force logout)
CREATE POLICY "Admins can manage sessions" 
ON public.custom_sessions 
FOR ALL 
USING (
  auth.jwt() ->> 'role' = 'service_role'
  OR
  EXISTS (
    SELECT 1 FROM public.custom_users admin
    WHERE admin.id = auth.uid() 
    AND admin.role = 'admin'
    AND admin.banned = false
  )
);

-- Verify the new secure policies
SELECT 
  tablename, 
  policyname, 
  cmd,
  CASE 
    WHEN qual LIKE '%auth.uid() = user_id%' THEN '✅ User can only access own sessions'
    WHEN qual LIKE '%service_role%' THEN '✅ Service role access'
    WHEN qual LIKE '%admin%' OR qual LIKE '%staff%' THEN '✅ Staff/admin access only'
    WHEN qual = 'true' THEN '🚨 DANGEROUS: Public access!'
    ELSE '⚠️ Review: ' || LEFT(qual, 50)
  END as security_status
FROM pg_policies 
WHERE tablename = 'custom_sessions'
ORDER BY policyname;