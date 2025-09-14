-- CRITICAL SECURITY FIX: Secure the custom_sessions table against session hijacking

-- First, check current policies
SELECT tablename, policyname, permissive, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'custom_sessions';