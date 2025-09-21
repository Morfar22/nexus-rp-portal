-- Fix RLS policies for servers table - allow staff operations
DROP POLICY IF EXISTS "Staff can manage servers" ON public.servers;
DROP POLICY IF EXISTS "Public can view active servers" ON public.servers;

-- Create more permissive policies for servers
CREATE POLICY "Staff can view all servers" ON public.servers
FOR SELECT USING (is_staff(auth.uid()));

CREATE POLICY "Staff can manage all servers" ON public.servers
FOR ALL USING (is_staff(auth.uid()));

CREATE POLICY "Public can view active servers" ON public.servers
FOR SELECT USING (is_active = true);

-- Fix server_settings table policy
DROP POLICY IF EXISTS "Staff can manage server settings" ON public.server_settings;

CREATE POLICY "Staff can view server settings" ON public.server_settings
FOR SELECT USING (is_staff(auth.uid()));

CREATE POLICY "Staff can manage server settings" ON public.server_settings
FOR INSERT WITH CHECK (is_staff(auth.uid()));

CREATE POLICY "Staff can update server settings" ON public.server_settings
FOR UPDATE USING (is_staff(auth.uid()));

CREATE POLICY "Staff can delete server settings" ON public.server_settings
FOR DELETE USING (is_staff(auth.uid()));