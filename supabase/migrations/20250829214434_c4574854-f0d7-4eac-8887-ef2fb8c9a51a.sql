-- Fix the RLS policy for character profile updates to ensure users can deactivate their own characters
DROP POLICY IF EXISTS "Users can update their own character profiles" ON public.character_profiles;

-- Create a more permissive update policy that allows both content updates and deactivation
CREATE POLICY "Users can update their own character profiles" 
ON public.character_profiles 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Also ensure users can delete their own characters completely if needed
DROP POLICY IF EXISTS "Users can delete their own character profiles" ON public.character_profiles;

CREATE POLICY "Users can delete their own character profiles" 
ON public.character_profiles 
FOR DELETE 
USING (auth.uid() = user_id);