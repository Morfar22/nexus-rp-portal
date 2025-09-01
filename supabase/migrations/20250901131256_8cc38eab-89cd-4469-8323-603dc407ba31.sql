-- Update RLS policies for custom_users to work with custom authentication system

-- Drop existing policies
DROP POLICY IF EXISTS "Users can update their own profile" ON public.custom_users;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.custom_users;

-- Create new policies that work with the service role key (system access)
CREATE POLICY "Service can manage custom users" 
ON public.custom_users 
FOR ALL 
USING (true);