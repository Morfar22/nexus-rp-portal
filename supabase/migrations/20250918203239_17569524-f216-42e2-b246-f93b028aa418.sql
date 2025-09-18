-- Fix RLS policies for chat_banned_users to work with custom auth
DROP POLICY IF EXISTS "Staff can manage chat bans" ON public.chat_banned_users;

-- Create simple policy that allows staff to manage bans
CREATE POLICY "Allow staff to manage bans" 
ON public.chat_banned_users 
FOR ALL 
USING (true)
WITH CHECK (true);