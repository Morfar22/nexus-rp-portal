-- Create enhanced live chat features tables

-- Typing indicators table
CREATE TABLE public.chat_typing_indicators (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL,
    user_id UUID,
    user_type TEXT NOT NULL CHECK (user_type IN ('visitor', 'staff')),
    is_typing BOOLEAN NOT NULL DEFAULT true,
    last_activity TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Chat file attachments table  
CREATE TABLE public.chat_file_attachments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL,
    message_id UUID,
    sender_id UUID,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('visitor', 'staff')),
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    file_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Canned responses table for staff quick replies
CREATE TABLE public.canned_responses (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    category TEXT NOT NULL DEFAULT 'general',
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    shortcut TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Chat analytics table for performance tracking
CREATE TABLE public.chat_analytics (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL,
    metric_type TEXT NOT NULL CHECK (metric_type IN ('response_time', 'satisfaction', 'resolution_time', 'ai_handled')),
    metric_value NUMERIC,
    metadata JSONB DEFAULT '{}',
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Chat AI interactions table
CREATE TABLE public.chat_ai_interactions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL,
    user_question TEXT NOT NULL,
    ai_response TEXT NOT NULL,
    confidence_score NUMERIC DEFAULT 0,
    was_helpful BOOLEAN,
    escalated_to_human BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.chat_typing_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_file_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.canned_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_ai_interactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chat_typing_indicators
CREATE POLICY "Staff can manage all typing indicators"
ON public.chat_typing_indicators
FOR ALL
TO authenticated
USING (is_staff(auth.uid()));

CREATE POLICY "Visitors can manage their own typing indicators"
ON public.chat_typing_indicators
FOR ALL
TO authenticated
USING (user_id = auth.uid() AND user_type = 'visitor');

-- Allow anonymous visitors to manage typing indicators for their session
CREATE POLICY "Anonymous visitors can manage typing indicators"
ON public.chat_typing_indicators
FOR ALL
USING (user_type = 'visitor' AND session_id IN (
    SELECT id FROM chat_sessions WHERE user_id IS NULL
));

-- RLS Policies for chat_file_attachments
CREATE POLICY "Staff can view all file attachments"
ON public.chat_file_attachments
FOR SELECT
TO authenticated
USING (is_staff(auth.uid()));

CREATE POLICY "Users can view attachments from their sessions"
ON public.chat_file_attachments
FOR SELECT
TO authenticated
USING (session_id IN (
    SELECT id FROM chat_sessions WHERE user_id = auth.uid()
));

CREATE POLICY "Staff can upload file attachments"
ON public.chat_file_attachments
FOR INSERT
TO authenticated
WITH CHECK (is_staff(auth.uid()) AND sender_type = 'staff');

CREATE POLICY "Visitors can upload file attachments to their sessions"
ON public.chat_file_attachments
FOR INSERT
TO authenticated
WITH CHECK (sender_type = 'visitor' AND session_id IN (
    SELECT id FROM chat_sessions WHERE user_id = auth.uid()
));

-- RLS Policies for canned_responses
CREATE POLICY "Staff can manage canned responses"
ON public.canned_responses
FOR ALL
TO authenticated
USING (is_staff(auth.uid()));

-- RLS Policies for chat_analytics
CREATE POLICY "Staff can view and manage analytics"
ON public.chat_analytics
FOR ALL
TO authenticated
USING (is_staff(auth.uid()));

-- RLS Policies for chat_ai_interactions
CREATE POLICY "Staff can view all AI interactions"
ON public.chat_ai_interactions
FOR SELECT
TO authenticated
USING (is_staff(auth.uid()));

CREATE POLICY "Users can view AI interactions from their sessions"
ON public.chat_ai_interactions
FOR SELECT
TO authenticated
USING (session_id IN (
    SELECT id FROM chat_sessions WHERE user_id = auth.uid()
));

CREATE POLICY "System can create AI interactions"
ON public.chat_ai_interactions
FOR INSERT
WITH CHECK (true);

-- Add some default canned responses
INSERT INTO public.canned_responses (category, title, message, shortcut) VALUES
('greeting', 'Welcome Message', 'Hi! Welcome to our support chat. How can I help you today?', '/welcome'),
('greeting', 'Thank You', 'Thank you for contacting us! Let me assist you with that.', '/thanks'),
('application', 'Application Status', 'I can help you check your application status. Could you please provide your application ID or the email you used to apply?', '/appstatus'),
('application', 'Application Requirements', 'For the application process, you''ll need to fill out our whitelist form with your character background, roleplay experience, and Discord information.', '/appreq'),
('server', 'Server Information', 'Our server IP is: connect panel.adventurerp.dk:30120. You can connect by pressing F8 in FiveM and typing that command.', '/serverinfo'),
('server', 'Discord Link', 'You can join our Discord community for the latest updates and to connect with other players.', '/discord'),
('technical', 'Connection Issues', 'If you''re having trouble connecting, please make sure you have FiveM updated and try restarting it. Also check if our server is currently online.', '/connection'),
('closing', 'Closing Message', 'Is there anything else I can help you with today? If not, feel free to reach out anytime!', '/close'),
('escalation', 'Transfer to Senior Staff', 'Let me transfer you to a senior staff member who can better assist you with this issue.', '/escalate');

-- Add indexes for better performance
CREATE INDEX idx_chat_typing_session ON public.chat_typing_indicators(session_id);
CREATE INDEX idx_chat_typing_activity ON public.chat_typing_indicators(last_activity);
CREATE INDEX idx_chat_files_session ON public.chat_file_attachments(session_id);
CREATE INDEX idx_chat_analytics_session ON public.chat_analytics(session_id);
CREATE INDEX idx_chat_analytics_type ON public.chat_analytics(metric_type);
CREATE INDEX idx_chat_ai_session ON public.chat_ai_interactions(session_id);
CREATE INDEX idx_canned_responses_active ON public.canned_responses(is_active) WHERE is_active = true;

-- Add realtime support for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_typing_indicators;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_file_attachments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_ai_interactions;