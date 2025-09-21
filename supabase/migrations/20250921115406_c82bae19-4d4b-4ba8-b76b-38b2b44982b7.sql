-- Drop all existing policies first
DROP POLICY IF EXISTS "Staff can view all servers" ON public.servers;
DROP POLICY IF EXISTS "Staff can manage all servers" ON public.servers;
DROP POLICY IF EXISTS "Public can view active servers" ON public.servers;
DROP POLICY IF EXISTS "Staff can view server settings" ON public.server_settings;
DROP POLICY IF EXISTS "Staff can manage server settings" ON public.server_settings;
DROP POLICY IF EXISTS "Staff can update server settings" ON public.server_settings;
DROP POLICY IF EXISTS "Staff can delete server settings" ON public.server_settings;

-- Create new policies for servers table
CREATE POLICY "Allow staff to manage servers" ON public.servers
FOR ALL USING (is_staff(auth.uid()));

CREATE POLICY "Allow public to view active servers" ON public.servers
FOR SELECT USING (is_active = true);

-- Create new policies for server_settings table
CREATE POLICY "Allow staff to manage server settings" ON public.server_settings
FOR ALL USING (is_staff(auth.uid()));