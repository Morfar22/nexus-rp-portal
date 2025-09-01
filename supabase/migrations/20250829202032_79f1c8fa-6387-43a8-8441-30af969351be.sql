-- Create push subscriptions table for web push notifications
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS on push subscriptions
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies for push subscriptions
CREATE POLICY "Users can manage their own push subscriptions"
ON public.push_subscriptions
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Staff can view all push subscriptions"
ON public.push_subscriptions
FOR SELECT
USING (is_staff(auth.uid()));

-- Create missed chat tracking table
CREATE TABLE IF NOT EXISTS public.missed_chats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  staff_notified UUID[] DEFAULT '{}',
  email_sent_at TIMESTAMP WITH TIME ZONE,
  push_sent_at TIMESTAMP WITH TIME ZONE,
  wait_time_minutes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on missed chats
ALTER TABLE public.missed_chats ENABLE ROW LEVEL SECURITY;

-- Create policies for missed chats
CREATE POLICY "Staff can view missed chats"
ON public.missed_chats
FOR SELECT
USING (is_staff(auth.uid()));

CREATE POLICY "System can create missed chat records"
ON public.missed_chats
FOR INSERT
WITH CHECK (true);

-- Add notification settings to server settings
INSERT INTO public.server_settings (setting_key, setting_value) 
VALUES (
  'notification_settings',
  '{
    "missed_chat_timeout": 5,
    "email_notifications": true,
    "push_notifications": true,
    "staff_away_timeout": 10,
    "escalation_enabled": true
  }'::jsonb
) ON CONFLICT (setting_key) DO NOTHING;

-- Create function to check for missed chats
CREATE OR REPLACE FUNCTION public.check_missed_chats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  timeout_minutes INTEGER := 5;
  session_record RECORD;
BEGIN
  -- Get timeout from settings
  SELECT COALESCE((setting_value->>'missed_chat_timeout')::INTEGER, 5)
  INTO timeout_minutes
  FROM server_settings 
  WHERE setting_key = 'notification_settings';
  
  -- Find sessions that have been waiting too long
  FOR session_record IN
    SELECT cs.id, cs.visitor_name, cs.visitor_email, cs.created_at,
           EXTRACT(EPOCH FROM (NOW() - cs.created_at))/60 as wait_minutes
    FROM chat_sessions cs
    LEFT JOIN missed_chats mc ON mc.session_id = cs.id
    WHERE cs.status = 'waiting'
      AND cs.created_at < NOW() - (timeout_minutes || ' minutes')::INTERVAL
      AND mc.session_id IS NULL
  LOOP
    -- Create missed chat record
    INSERT INTO missed_chats (session_id, wait_time_minutes)
    VALUES (session_record.id, session_record.wait_minutes);
    
    -- Log for analytics
    INSERT INTO chat_analytics (session_id, metric_type, metric_value, metadata)
    VALUES (
      session_record.id, 
      'missed_chat', 
      1, 
      jsonb_build_object(
        'wait_time_minutes', session_record.wait_minutes,
        'visitor_name', session_record.visitor_name,
        'visitor_email', session_record.visitor_email
      )
    );
  END LOOP;
END;
$$;

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_push_subscriptions_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Create trigger for push subscriptions
CREATE TRIGGER update_push_subscriptions_updated_at
  BEFORE UPDATE ON public.push_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_push_subscriptions_updated_at();