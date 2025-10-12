-- Clean up the orphaned policies since RLS is disabled
DROP POLICY IF EXISTS "Service role can manage server settings" ON public.server_settings;
DROP POLICY IF EXISTS "Anon can manage server settings" ON public.server_settings;