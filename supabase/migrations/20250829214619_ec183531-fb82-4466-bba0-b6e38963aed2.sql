-- Fix the SELECT policy to allow users to see their own characters even when inactive
-- This prevents RLS conflicts during updates
DROP POLICY IF EXISTS "Users can view all active character profiles" ON public.character_profiles;

-- Create a new SELECT policy that allows:
-- 1. Anyone to view active characters (public gallery)
-- 2. Users to view their own characters regardless of active status (for management)
CREATE POLICY "Users can view characters" 
ON public.character_profiles 
FOR SELECT 
USING (
    (is_active = true) 
    OR 
    (auth.uid() = user_id)
);