-- Create character profiles table
CREATE TABLE public.character_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  character_name VARCHAR(100) NOT NULL,
  character_description TEXT,
  character_backstory TEXT,
  character_image_url TEXT,
  age INTEGER,
  occupation VARCHAR(100),
  personality_traits TEXT[],
  relationships TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create achievements table
CREATE TABLE public.achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  icon VARCHAR(50) NOT NULL,
  category VARCHAR(50) NOT NULL,
  points INTEGER DEFAULT 0,
  rarity VARCHAR(20) DEFAULT 'common' CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),
  requirements JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user achievements table (junction table)
CREATE TABLE public.user_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  progress INTEGER DEFAULT 100,
  UNIQUE(user_id, achievement_id)
);

-- Create roleplay events table
CREATE TABLE public.rp_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER DEFAULT 120,
  max_participants INTEGER,
  location VARCHAR(100),
  event_type VARCHAR(50) NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'ongoing', 'completed', 'cancelled')),
  requirements TEXT,
  rewards TEXT,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create event participants table
CREATE TABLE public.event_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES rp_events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  character_id UUID REFERENCES character_profiles(id),
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status VARCHAR(20) DEFAULT 'registered' CHECK (status IN ('registered', 'attended', 'no_show')),
  UNIQUE(event_id, user_id)
);

-- Create community votes table
CREATE TABLE public.community_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  options JSONB NOT NULL,
  vote_type VARCHAR(50) NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  requires_staff_approval BOOLEAN DEFAULT false,
  min_participation INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user votes table
CREATE TABLE public.user_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vote_id UUID NOT NULL REFERENCES community_votes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  selected_option VARCHAR(100) NOT NULL,
  voted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(vote_id, user_id)
);

-- Enable RLS on all new tables
ALTER TABLE public.character_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rp_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_votes ENABLE ROW LEVEL SECURITY;

-- Character Profiles Policies
CREATE POLICY "Users can view all active character profiles" 
ON public.character_profiles 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Users can create their own character profiles" 
ON public.character_profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own character profiles" 
ON public.character_profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own character profiles" 
ON public.character_profiles 
FOR DELETE 
USING (auth.uid() = user_id);

-- Achievements Policies
CREATE POLICY "Everyone can view active achievements" 
ON public.achievements 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Staff can manage achievements" 
ON public.achievements 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = auth.uid() 
  AND profiles.role IN ('admin', 'staff', 'moderator')
));

-- User Achievements Policies
CREATE POLICY "Users can view all user achievements" 
ON public.user_achievements 
FOR SELECT 
USING (true);

CREATE POLICY "System can create user achievements" 
ON public.user_achievements 
FOR INSERT 
WITH CHECK (true);

-- RP Events Policies
CREATE POLICY "Everyone can view public events" 
ON public.rp_events 
FOR SELECT 
USING (is_public = true OR auth.uid() = created_by);

CREATE POLICY "Authenticated users can create events" 
ON public.rp_events 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Event creators and staff can update events" 
ON public.rp_events 
FOR UPDATE 
USING (
  auth.uid() = created_by OR 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'staff', 'moderator')
  )
);

CREATE POLICY "Event creators and staff can delete events" 
ON public.rp_events 
FOR DELETE 
USING (
  auth.uid() = created_by OR 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'staff', 'moderator')
  )
);

-- Event Participants Policies
CREATE POLICY "Users can view event participants for events they can see" 
ON public.event_participants 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM rp_events 
    WHERE rp_events.id = event_participants.event_id 
    AND (rp_events.is_public = true OR rp_events.created_by = auth.uid())
  )
);

CREATE POLICY "Users can join/leave events" 
ON public.event_participants 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own participation" 
ON public.event_participants 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can remove their own participation" 
ON public.event_participants 
FOR DELETE 
USING (auth.uid() = user_id);

-- Community Votes Policies
CREATE POLICY "Everyone can view active votes" 
ON public.community_votes 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Authenticated users can create votes" 
ON public.community_votes 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Vote creators and staff can manage votes" 
ON public.community_votes 
FOR UPDATE 
USING (
  auth.uid() = created_by OR 
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'staff', 'moderator')
  )
);

-- User Votes Policies
CREATE POLICY "Users can view their own votes and vote results" 
ON public.user_votes 
FOR SELECT 
USING (auth.uid() = user_id OR true);

CREATE POLICY "Users can cast their own votes" 
ON public.user_votes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own votes" 
ON public.user_votes 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Add indexes for better performance
CREATE INDEX idx_character_profiles_user_id ON character_profiles(user_id);
CREATE INDEX idx_character_profiles_active ON character_profiles(is_active);
CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX idx_user_achievements_achievement_id ON user_achievements(achievement_id);
CREATE INDEX idx_rp_events_date ON rp_events(event_date);
CREATE INDEX idx_rp_events_status ON rp_events(status);
CREATE INDEX idx_event_participants_event_id ON event_participants(event_id);
CREATE INDEX idx_event_participants_user_id ON event_participants(user_id);
CREATE INDEX idx_community_votes_active ON community_votes(is_active);
CREATE INDEX idx_community_votes_dates ON community_votes(starts_at, ends_at);
CREATE INDEX idx_user_votes_vote_id ON user_votes(vote_id);

-- Create function for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_character_profiles_updated_at
BEFORE UPDATE ON public.character_profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rp_events_updated_at
BEFORE UPDATE ON public.rp_events
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Insert some default achievements
INSERT INTO public.achievements (name, description, icon, category, points, rarity) VALUES 
('Velkommen til Serveren', 'Fuldfør din første login på serveren', 'Star', 'Begynder', 10, 'common'),
('Første Karakter', 'Opret din første karakter profil', 'User', 'Karakter', 25, 'common'),
('Social Butterfly', 'Chat med 10 forskellige spillere', 'MessageCircle', 'Social', 50, 'uncommon'),
('Event Deltager', 'Deltag i dit første RP event', 'Calendar', 'Events', 75, 'uncommon'),
('Veteran Spiller', 'Spil på serveren i 30 dage', 'Shield', 'Aktivitet', 200, 'rare'),
('Community Stemme', 'Stem i din første community afstemning', 'Vote', 'Community', 30, 'common'),
('Event Organisator', 'Organiser dit første RP event', 'Crown', 'Leadership', 150, 'rare'),
('Karakter Mester', 'Opret 5 forskellige karakterer', 'Users', 'Karakter', 250, 'epic'),
('Loyal Spiller', 'Spil på serveren i 100 dage', 'Award', 'Aktivitet', 500, 'legendary'),
('Community Leder', 'Organiser 10 successful events', 'Trophy', 'Leadership', 1000, 'legendary');