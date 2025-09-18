-- Add unique constraint for chat typing indicators
ALTER TABLE public.chat_typing_indicators 
ADD CONSTRAINT chat_typing_indicators_session_user_type_unique 
UNIQUE (session_id, user_id, user_type);