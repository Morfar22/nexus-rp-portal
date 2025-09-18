-- Completely disable RLS on servers table since custom auth doesn't work with auth.uid()
ALTER TABLE public.servers DISABLE ROW LEVEL SECURITY;

-- Also check what's causing the issue by looking at the current user context
-- Drop existing policies first
DROP POLICY IF EXISTS "Admins can do everything with servers" ON public.servers;
DROP POLICY IF EXISTS "Anyone can view servers" ON public.servers;