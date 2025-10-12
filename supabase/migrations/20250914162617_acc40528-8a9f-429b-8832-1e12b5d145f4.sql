-- Clean up duplicate policies on custom_users table

-- Remove old/duplicate policies
DROP POLICY IF EXISTS "Allow user registration" ON public.custom_users;
DROP POLICY IF EXISTS "System operations for services" ON public.custom_users;

-- Final verification of secure policies
SELECT 
  tablename, 
  policyname, 
  cmd,
  CASE 
    WHEN qual LIKE '%auth.uid() = id%' THEN '✅ User can only access own data'
    WHEN qual LIKE '%service_role%' THEN '✅ Service role access'
    WHEN qual LIKE '%admin%' OR qual LIKE '%staff%' THEN '✅ Staff/admin access only'
    ELSE '⚠️ Review needed: ' || LEFT(qual, 50)
  END as security_status
FROM pg_policies 
WHERE tablename = 'custom_users'
ORDER BY cmd, policyname;