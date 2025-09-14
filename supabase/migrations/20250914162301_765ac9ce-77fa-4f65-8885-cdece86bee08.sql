-- CRITICAL SECURITY FIX: Properly replace ALL existing RLS policies for custom_users table

-- First, drop ALL existing policies (including any that may have been partially created)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.custom_users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.custom_users;
DROP POLICY IF EXISTS "Staff can view all users" ON public.custom_users;
DROP POLICY IF EXISTS "Staff can manage all users" ON public.custom_users;
DROP POLICY IF EXISTS "System operations for authenticated services" ON public.custom_users;
DROP POLICY IF EXISTS "Service can manage custom users" ON public.custom_users;
DROP POLICY IF EXISTS "System can manage users" ON public.custom_users;

-- List all policies to see what exists
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'custom_users';