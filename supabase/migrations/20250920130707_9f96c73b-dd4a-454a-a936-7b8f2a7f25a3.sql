-- Fix foreign key constraint on applications table to reference custom_users instead of auth.users

-- First, drop the existing foreign key constraint
ALTER TABLE applications DROP CONSTRAINT IF EXISTS applications_user_id_fkey;

-- Add new foreign key constraint pointing to custom_users table
ALTER TABLE applications 
ADD CONSTRAINT applications_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES custom_users(id) ON DELETE CASCADE;