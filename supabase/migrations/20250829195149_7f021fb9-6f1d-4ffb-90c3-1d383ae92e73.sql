-- Create storage bucket for chat files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('chat-files', 'chat-files', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for chat files
CREATE POLICY "Staff can upload chat files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'chat-files' AND
    is_staff(auth.uid())
);

CREATE POLICY "Users can upload files to their chat sessions"
ON storage.objects  
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'chat-files' AND
    (storage.foldername(name))[1] IN (
        SELECT id::text FROM chat_sessions WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Chat file access for participants"
ON storage.objects
FOR SELECT
USING (
    bucket_id = 'chat-files' AND (
        is_staff(auth.uid()) OR
        (storage.foldername(name))[1] IN (
            SELECT id::text FROM chat_sessions WHERE user_id = auth.uid()
        )
    )
);