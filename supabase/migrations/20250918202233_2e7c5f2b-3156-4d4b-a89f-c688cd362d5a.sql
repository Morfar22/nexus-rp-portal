-- Fix RLS policies for chat_sessions to work with custom auth system
-- Drop the restrictive policies
DROP POLICY IF EXISTS "Users can create chat sessions" ON public.chat_sessions;
DROP POLICY IF EXISTS "Users can view their own chat sessions" ON public.chat_sessions;

-- Create new policies that work for both authenticated and anonymous users
CREATE POLICY "Anyone can create chat sessions" 
ON public.chat_sessions 
FOR INSERT 
WITH CHECK (true);

-- Allow users to view their own sessions or anonymous sessions based on session data
CREATE POLICY "Users can view relevant chat sessions" 
ON public.chat_sessions 
FOR SELECT 
USING (
  -- Staff can see all sessions
  has_permission(auth.uid(), 'chat.manage'::text) OR
  -- Authenticated users can see their own sessions
  (auth.uid() = user_id) OR
  -- Allow viewing for session management (will be restricted by application logic)
  (user_id IS NULL)
);

-- Update policy to allow session updates for staff and the session creator
CREATE POLICY "Can update chat sessions appropriately" 
ON public.chat_sessions 
FOR UPDATE 
USING (
  has_permission(auth.uid(), 'chat.manage'::text) OR
  (auth.uid() = user_id)
);

-- Create new policy for chat messages to work with anonymous users
DROP POLICY IF EXISTS "Visitors can insert messages in their session" ON public.chat_messages;

CREATE POLICY "Anyone can insert messages in valid sessions" 
ON public.chat_messages 
FOR INSERT 
WITH CHECK (
  -- Staff can insert as staff
  (sender_type = 'staff' AND is_staff(auth.uid())) OR
  -- Anyone can insert as visitor (application will validate session ownership)
  (sender_type = 'visitor')
);

-- Fix chat message viewing policy
DROP POLICY IF EXISTS "Visitors can view messages in their session" ON public.chat_messages;

CREATE POLICY "Users can view messages in accessible sessions" 
ON public.chat_messages 
FOR SELECT 
USING (
  -- Staff can view all messages
  is_staff(auth.uid()) OR
  -- Messages in sessions user can access
  session_id IN (
    SELECT id FROM chat_sessions 
    WHERE 
      has_permission(auth.uid(), 'chat.manage'::text) OR
      (auth.uid() = user_id) OR
      (user_id IS NULL)
  )
);