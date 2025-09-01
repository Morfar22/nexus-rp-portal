-- Create generate-image edge function for OpenAI image generation
-- This will be used by the creative tools functionality

-- First ensure we have a user_achievements table for the achievements system
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  progress INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on user_achievements
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- Create policies for user_achievements
CREATE POLICY "Users can view their own achievements" 
ON public.user_achievements 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can create user achievements" 
ON public.user_achievements 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Staff can view all user achievements" 
ON public.user_achievements 
FOR SELECT 
USING (is_staff(auth.uid()));

-- Add unique constraint to prevent duplicate achievements
ALTER TABLE public.user_achievements 
ADD CONSTRAINT unique_user_achievement 
UNIQUE (user_id, achievement_id);

-- Create updated_at trigger for user_achievements
CREATE TRIGGER update_user_achievements_updated_at
BEFORE UPDATE ON public.user_achievements
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();