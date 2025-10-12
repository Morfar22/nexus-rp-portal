-- Fix foreign key constraint for chat_sessions.assigned_to
-- Drop existing foreign key constraint if it exists
ALTER TABLE chat_sessions DROP CONSTRAINT IF EXISTS chat_sessions_assigned_to_fkey;

-- Add correct foreign key constraint pointing to custom_users table
ALTER TABLE chat_sessions 
ADD CONSTRAINT chat_sessions_assigned_to_fkey 
FOREIGN KEY (assigned_to) REFERENCES custom_users(id) ON DELETE SET NULL;