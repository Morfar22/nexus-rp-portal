-- Drop the foreign key constraint that's causing issues
ALTER TABLE public.server_settings DROP CONSTRAINT IF EXISTS server_settings_created_by_fkey;

-- Make created_by nullable to avoid issues
ALTER TABLE public.server_settings ALTER COLUMN created_by DROP NOT NULL;