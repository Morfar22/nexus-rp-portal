-- Fix foreign key constraint for chat_messages.sender_id
-- Drop existing foreign key constraint if it exists
ALTER TABLE chat_messages DROP CONSTRAINT IF EXISTS chat_messages_sender_id_fkey;

-- Add correct foreign key constraint pointing to custom_users table
ALTER TABLE chat_messages 
ADD CONSTRAINT chat_messages_sender_id_fkey 
FOREIGN KEY (sender_id) REFERENCES custom_users(id) ON DELETE SET NULL;