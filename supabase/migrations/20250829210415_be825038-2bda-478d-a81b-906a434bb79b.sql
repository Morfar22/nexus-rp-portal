-- Fix foreign key relationships for community_votes
ALTER TABLE public.community_votes 
ADD CONSTRAINT community_votes_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Fix foreign key relationships for rp_events
ALTER TABLE public.rp_events 
ADD CONSTRAINT rp_events_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Fix foreign key relationships for character_profiles
ALTER TABLE public.character_profiles 
ADD CONSTRAINT character_profiles_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Fix foreign key relationships for event_participants
ALTER TABLE public.event_participants 
ADD CONSTRAINT event_participants_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.event_participants 
ADD CONSTRAINT event_participants_event_id_fkey 
FOREIGN KEY (event_id) REFERENCES public.rp_events(id) ON DELETE CASCADE;

ALTER TABLE public.event_participants 
ADD CONSTRAINT event_participants_character_id_fkey 
FOREIGN KEY (character_id) REFERENCES public.character_profiles(id) ON DELETE SET NULL;

-- Create community_vote_responses table for tracking user votes
CREATE TABLE IF NOT EXISTS public.community_vote_responses (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    vote_id UUID NOT NULL,
    user_id UUID NOT NULL,
    selected_option TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add foreign keys for vote responses
ALTER TABLE public.community_vote_responses 
ADD CONSTRAINT community_vote_responses_vote_id_fkey 
FOREIGN KEY (vote_id) REFERENCES public.community_votes(id) ON DELETE CASCADE;

ALTER TABLE public.community_vote_responses 
ADD CONSTRAINT community_vote_responses_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Enable RLS on vote responses
ALTER TABLE public.community_vote_responses ENABLE ROW LEVEL SECURITY;

-- Create policies for vote responses
CREATE POLICY "Users can view all vote responses" 
ON public.community_vote_responses 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own vote responses" 
ON public.community_vote_responses 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own vote responses" 
ON public.community_vote_responses 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create unique constraint to prevent duplicate votes
ALTER TABLE public.community_vote_responses 
ADD CONSTRAINT unique_user_vote UNIQUE (vote_id, user_id);

-- Create user_achievements table for tracking achievements
CREATE TABLE IF NOT EXISTS public.user_achievements (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    achievement_id UUID NOT NULL,
    unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    progress JSONB DEFAULT '{}'::jsonb
);

-- Add foreign keys for user achievements
ALTER TABLE public.user_achievements 
ADD CONSTRAINT user_achievements_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.user_achievements 
ADD CONSTRAINT user_achievements_achievement_id_fkey 
FOREIGN KEY (achievement_id) REFERENCES public.achievements(id) ON DELETE CASCADE;

-- Enable RLS on user achievements
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- Create policies for user achievements
CREATE POLICY "Users can view their own achievements" 
ON public.user_achievements 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Staff can view all achievements" 
ON public.user_achievements 
FOR SELECT 
USING (is_staff(auth.uid()));

CREATE POLICY "System can create achievements" 
ON public.user_achievements 
FOR INSERT 
WITH CHECK (true);

-- Create unique constraint to prevent duplicate achievements
ALTER TABLE public.user_achievements 
ADD CONSTRAINT unique_user_achievement UNIQUE (user_id, achievement_id);