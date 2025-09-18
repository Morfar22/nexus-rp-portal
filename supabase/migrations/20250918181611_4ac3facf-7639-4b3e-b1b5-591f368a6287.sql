-- Check current RLS policies on servers table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'servers';

-- Disable RLS on servers table temporarily to allow insertions
ALTER TABLE public.servers DISABLE ROW LEVEL SECURITY;