-- Drop all existing policies for chat_sessions and recreate them properly
DROP POLICY IF EXISTS "Anyone can create chat sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Can manage chat sessions with permission" ON public.chat_sessions;
DROP POLICY IF EXISTS "Users can create chat sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Users can view their own chat sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Can update chat sessions appropriately" ON public.chat_sessions;

-- Create simple policies that work for live chat
CREATE POLICY "Allow chat session creation" 
ON public.chat_sessions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow chat session viewing" 
ON public.chat_sessions 
FOR SELECT 
USING (true);

CREATE POLICY "Allow chat session updates" 
ON public.chat_sessions 
FOR UPDATE 
USING (true);

CREATE POLICY "Staff can manage all sessions" 
ON public.chat_sessions 
FOR ALL 
USING (is_staff(auth.uid()));

-- Fix chat messages policies too
DROP POLICY IF EXISTS "Anyone can insert messages in valid sessions" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can view messages in accessible sessions" ON public.chat_messages;
DROP POLICY IF EXISTS "Staff can insert chat messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Staff can view all chat messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Visitors can insert messages in their session" ON public.chat_messages;
DROP POLICY IF EXISTS "Visitors can view messages in their session" ON public.chat_messages;

-- Create simple chat message policies
CREATE POLICY "Allow message creation" 
ON public.chat_messages 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow message viewing" 
ON public.chat_messages 
FOR SELECT 
USING (true);

CREATE POLICY "Staff can manage messages" 
ON public.chat_messages 
FOR ALL 
USING (is_staff(auth.uid()));