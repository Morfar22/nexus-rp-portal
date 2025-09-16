-- Drop ALL existing policies on server_settings to start fresh
DROP POLICY IF EXISTS "Allow server settings management for authenticated" ON public.server_settings;
DROP POLICY IF EXISTS "Service role can manage server settings" ON public.server_settings;
DROP POLICY IF EXISTS "Can view server settings with permission" ON public.server_settings;
DROP POLICY IF EXISTS "Can manage server settings with permission" ON public.server_settings;

-- Temporarily disable RLS to allow data access
ALTER TABLE public.server_settings DISABLE ROW LEVEL SECURITY;