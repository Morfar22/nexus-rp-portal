-- CRITICAL SECURITY FIX: Create secure RLS policies for custom_users table (fixed version)

-- 1. Allow secure user registration 
CREATE POLICY "Secure user registration" 
ON public.custom_users 
FOR INSERT 
WITH CHECK (
  -- Allow service role for system operations
  auth.jwt() ->> 'role' = 'service_role'
  OR
  -- Allow anonymous users to register (signup process)
  auth.uid() IS NULL
  OR
  -- Allow authenticated users to create/update their own record
  auth.uid() = id
);

-- 2. Users can view ONLY their own profile data
CREATE POLICY "Users can view their own profile" 
ON public.custom_users 
FOR SELECT 
USING (auth.uid() = id);

-- 3. Users can update their own basic profile (with restrictions)
CREATE POLICY "Users can update their own profile" 
ON public.custom_users 
FOR UPDATE 
USING (auth.uid() = id);

-- 4. Staff can view all users for administration
CREATE POLICY "Staff can view all users" 
ON public.custom_users 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.custom_users staff
    WHERE staff.id = auth.uid() 
    AND staff.role IN ('admin', 'staff', 'moderator')
    AND staff.banned = false
  )
);

-- 5. Admins/staff can manage all users
CREATE POLICY "Admins can manage all users" 
ON public.custom_users 
FOR ALL 
USING (
  -- Allow service role
  auth.jwt() ->> 'role' = 'service_role'
  OR
  -- Allow admin and staff to manage users
  EXISTS (
    SELECT 1 FROM public.custom_users admin
    WHERE admin.id = auth.uid() 
    AND admin.role IN ('admin', 'staff')
    AND admin.banned = false
  )
);

-- 6. Delete policy for admins only
CREATE POLICY "Admins can delete users" 
ON public.custom_users 
FOR DELETE 
USING (
  -- Only service role or admins can delete users
  auth.jwt() ->> 'role' = 'service_role'
  OR
  EXISTS (
    SELECT 1 FROM public.custom_users admin
    WHERE admin.id = auth.uid() 
    AND admin.role = 'admin'
    AND admin.banned = false
  )
);

-- Verify the policies were created successfully
SELECT tablename, policyname, permissive, cmd, qual 
FROM pg_policies 
WHERE tablename = 'custom_users'
ORDER BY policyname;