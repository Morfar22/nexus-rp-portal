-- CRITICAL SECURITY FIX: Secure email_verification_tokens table
-- Issue: Email verification tokens are publicly accessible due to dangerous RLS policy

-- Drop the dangerous policy that allows public access
DROP POLICY IF EXISTS "System can manage email tokens" ON public.email_verification_tokens;

-- Create secure policies for email verification tokens

-- 1. Only service role can create email verification tokens (for system operations)
CREATE POLICY "Service role can create email tokens" 
ON public.email_verification_tokens 
FOR INSERT 
WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- 2. Only service role can update tokens (mark as used)
CREATE POLICY "Service role can update email tokens" 
ON public.email_verification_tokens 
FOR UPDATE 
USING (auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- 3. Only service role can delete expired tokens
CREATE POLICY "Service role can delete email tokens" 
ON public.email_verification_tokens 
FOR DELETE 
USING (auth.jwt() ->> 'role' = 'service_role');

-- 4. Only service role can read tokens (for verification process)
CREATE POLICY "Service role can read email tokens" 
ON public.email_verification_tokens 
FOR SELECT 
USING (auth.jwt() ->> 'role' = 'service_role');

-- CRITICAL SECURITY FIX: Secure password_reset_tokens table  
-- Issue: Similar exposure risk as email tokens

-- Drop any dangerous policies
DROP POLICY IF EXISTS "System can manage password tokens" ON public.password_reset_tokens;

-- Create secure policies for password reset tokens

-- 1. Only service role can create password reset tokens
CREATE POLICY "Service role can create password tokens" 
ON public.password_reset_tokens 
FOR INSERT 
WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- 2. Only service role can update tokens (mark as used)
CREATE POLICY "Service role can update password tokens" 
ON public.password_reset_tokens 
FOR UPDATE 
USING (auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- 3. Only service role can delete expired tokens
CREATE POLICY "Service role can delete password tokens" 
ON public.password_reset_tokens 
FOR DELETE 
USING (auth.jwt() ->> 'role' = 'service_role');

-- 4. Only service role can read tokens (for verification process)
CREATE POLICY "Service role can read password tokens" 
ON public.password_reset_tokens 
FOR SELECT 
USING (auth.jwt() ->> 'role' = 'service_role');

-- CRITICAL SECURITY FIX: Secure failed_login_attempts table
-- Issue: Full public access allows enumeration of failed login data

-- Drop dangerous policy
DROP POLICY IF EXISTS "System can manage failed login attempts" ON public.failed_login_attempts;

-- Create secure policies for failed login attempts

-- 1. Only service role and staff can view failed login attempts
CREATE POLICY "Staff can view failed login attempts" 
ON public.failed_login_attempts 
FOR SELECT 
USING (
  auth.jwt() ->> 'role' = 'service_role' OR
  EXISTS (
    SELECT 1 FROM public.custom_users staff
    WHERE staff.id = auth.uid() 
    AND staff.role IN ('admin', 'staff')
    AND staff.banned = false
  )
);

-- 2. Only service role can create failed login records
CREATE POLICY "Service role can create failed login attempts" 
ON public.failed_login_attempts 
FOR INSERT 
WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- 3. Only service role and admins can update (for blocking/unblocking)
CREATE POLICY "Admins can update failed login attempts" 
ON public.failed_login_attempts 
FOR UPDATE 
USING (
  auth.jwt() ->> 'role' = 'service_role' OR
  EXISTS (
    SELECT 1 FROM public.custom_users admin
    WHERE admin.id = auth.uid() 
    AND admin.role = 'admin'
    AND admin.banned = false
  )
);

-- 4. Only service role and admins can delete old records
CREATE POLICY "Admins can delete failed login attempts" 
ON public.failed_login_attempts 
FOR DELETE 
USING (
  auth.jwt() ->> 'role' = 'service_role' OR
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
    WHEN qual LIKE '%service_role%' THEN '✅ Service role only'
    WHEN qual LIKE '%staff%' OR qual LIKE '%admin%' THEN '✅ Staff/admin access only'
    WHEN qual = 'true' THEN '🚨 DANGEROUS: Full public access!'
    ELSE '⚠️ Review: ' || LEFT(qual, 50)
  END as security_status
FROM pg_policies 
WHERE tablename IN ('email_verification_tokens', 'password_reset_tokens', 'failed_login_attempts')
ORDER BY tablename, policyname;