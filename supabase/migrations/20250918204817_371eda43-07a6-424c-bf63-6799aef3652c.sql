-- Enable RLS on chat_typing_indicators table
ALTER TABLE public.chat_typing_indicators ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to manage typing indicators for their session
CREATE POLICY "Allow typing indicators management"
ON public.chat_typing_indicators
FOR ALL
USING (true)
WITH CHECK (true);

-- Also ensure other chat tables have proper RLS if they exist
DO $$
BEGIN
  -- Enable RLS on chat_sessions if it exists and isn't already enabled
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'chat_sessions') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'chat_sessions' AND rowsecurity = true) THEN
      ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
      
      -- Allow anyone to view and create chat sessions
      CREATE POLICY "Allow chat session access" ON public.chat_sessions FOR ALL USING (true) WITH CHECK (true);
    END IF;
  END IF;

  -- Enable RLS on chat_messages if it exists and isn't already enabled
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'chat_messages') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'chat_messages' AND rowsecurity = true) THEN
      ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
      
      -- Allow anyone to view and create chat messages
      CREATE POLICY "Allow chat message access" ON public.chat_messages FOR ALL USING (true) WITH CHECK (true);
    END IF;
  END IF;
END $$;