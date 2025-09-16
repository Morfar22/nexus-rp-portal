-- Fix infinite recursion in RLS policies

-- Drop existing problematic policies on custom_users
DROP POLICY IF EXISTS "Users can view all custom users" ON public.custom_users;
DROP POLICY IF EXISTS "Users can view other users" ON public.custom_users;
DROP POLICY IF EXISTS "Staff can view all custom users" ON public.custom_users;
DROP POLICY IF EXISTS "Allow staff to view all custom users" ON public.custom_users;

-- Create simple, non-recursive policies for custom_users
CREATE POLICY "Allow public read access to custom users" 
ON public.custom_users 
FOR SELECT 
USING (true);

-- Ensure team_members has proper policies without recursion
DROP POLICY IF EXISTS "Allow public read access to team members" ON public.team_members;
DROP POLICY IF EXISTS "Users can view team members" ON public.team_members;

CREATE POLICY "Allow public read access to team members" 
ON public.team_members 
FOR SELECT 
USING (true);

-- Ensure staff_roles has proper policies
DROP POLICY IF EXISTS "Allow public read access to staff roles" ON public.staff_roles;
DROP POLICY IF EXISTS "Users can view staff roles" ON public.staff_roles;

CREATE POLICY "Allow public read access to staff roles" 
ON public.staff_roles 
FOR SELECT 
USING (true);