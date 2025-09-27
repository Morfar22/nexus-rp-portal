-- Drop the existing foreign key constraint that references auth.users
ALTER TABLE chat_sessions DROP CONSTRAINT IF EXISTS chat_sessions_user_id_fkey;

-- Add new foreign key constraint to reference custom_users table instead
ALTER TABLE chat_sessions ADD CONSTRAINT chat_sessions_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES custom_users(id) ON DELETE CASCADE;