-- Fix storage policies for user-avatars to work with custom authentication

-- Drop existing avatar policies
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects; 
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update avatars" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete avatars" ON storage.objects;

-- Create new policies for custom auth system
CREATE POLICY "Custom auth avatar uploads" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'user-avatars');

CREATE POLICY "Custom auth avatar updates" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'user-avatars');

CREATE POLICY "Custom auth avatar deletes" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'user-avatars');