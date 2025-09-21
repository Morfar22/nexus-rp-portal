-- Completely disable RLS for server_settings since custom auth system is used
ALTER TABLE public.server_settings DISABLE ROW LEVEL SECURITY;