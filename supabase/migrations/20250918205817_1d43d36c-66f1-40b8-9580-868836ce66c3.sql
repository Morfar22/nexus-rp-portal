-- Drop the old constraint that only allows 'visitor' and 'staff'
ALTER TABLE public.chat_messages 
DROP CONSTRAINT chat_messages_sender_type_check;

-- Add new constraint that also allows 'ai' as sender_type
ALTER TABLE public.chat_messages 
ADD CONSTRAINT chat_messages_sender_type_check 
CHECK (sender_type = ANY (ARRAY['visitor'::text, 'staff'::text, 'ai'::text]));