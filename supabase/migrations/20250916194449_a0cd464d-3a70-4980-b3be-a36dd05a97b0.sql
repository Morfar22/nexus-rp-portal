-- Remove all RLS policies that cause infinite recursion on custom_users
-- These policies reference custom_users within themselves, causing loops

-- Drop all existing policies on custom_users to start clean
DROP POLICY IF EXISTS "Admins can delete users" ON public.custom_users;
DROP POLICY IF EXISTS "Admins can manage all users" ON public.custom_users;
DROP POLICY IF EXISTS "Allow public read access to custom users" ON public.custom_users;
DROP POLICY IF EXISTS "Secure user registration" ON public.custom_users;
DROP POLICY IF EXISTS "custom_users_admin_manage_all" ON public.custom_users;
DROP POLICY IF EXISTS "custom_users_admin_select_all" ON public.custom_users;
DROP POLICY IF EXISTS "custom_users_registration" ON public.custom_users;
DROP POLICY IF EXISTS "custom_users_select_own" ON public.custom_users;
DROP POLICY IF EXISTS "custom_users_service_operations" ON public.custom_users;
DROP POLICY IF EXISTS "custom_users_update_own" ON public.custom_users;

-- Create simple, non-recursive policies
-- Allow service role full access
CREATE POLICY "Service role full access" 
ON public.custom_users 
FOR ALL 
USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text)
WITH CHECK ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- Allow public read access (no recursion)
CREATE POLICY "Public read access" 
ON public.custom_users 
FOR SELECT 
USING (true);

-- Allow users to read their own data
CREATE POLICY "Users can read own data" 
ON public.custom_users 
FOR SELECT 
USING (auth.uid() = id);

-- Allow users to update their own data
CREATE POLICY "Users can update own data" 
ON public.custom_users 
FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Allow registration (insert)
CREATE POLICY "Allow user registration" 
ON public.custom_users 
FOR INSERT 
WITH CHECK (true);