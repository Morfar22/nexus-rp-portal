-- First, drop all existing policies on servers table
DROP POLICY IF EXISTS "Anyone can view active servers" ON public.servers;
DROP POLICY IF EXISTS "Can view servers with permission" ON public.servers;
DROP POLICY IF EXISTS "Can manage servers with permission" ON public.servers;

-- Re-enable RLS
ALTER TABLE public.servers ENABLE ROW LEVEL SECURITY;

-- Create simple policies that allow admin users to do everything
CREATE POLICY "Admins can do everything with servers" ON public.servers
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM custom_users 
      WHERE id = auth.uid() AND role = 'admin' AND banned = false
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM custom_users 
      WHERE id = auth.uid() AND role = 'admin' AND banned = false
    )
  );

-- Allow everyone to view active servers
CREATE POLICY "Anyone can view servers" ON public.servers
  FOR SELECT
  USING (is_active = true);