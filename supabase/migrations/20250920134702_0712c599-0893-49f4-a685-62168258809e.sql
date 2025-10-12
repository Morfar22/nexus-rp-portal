-- Fix foreign key constraint issue for application_types
-- Drop existing foreign key constraint if it exists
ALTER TABLE application_types DROP CONSTRAINT IF EXISTS application_types_created_by_fkey;

-- Add correct foreign key constraint to custom_users table
ALTER TABLE application_types 
ADD CONSTRAINT application_types_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES custom_users(id) ON DELETE SET NULL;