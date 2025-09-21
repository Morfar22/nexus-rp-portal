-- Add index on custom_users.email for faster lookups
CREATE INDEX IF NOT EXISTS idx_custom_users_email ON public.custom_users (email);

-- Add indexes for better performance on commonly queried columns
CREATE INDEX IF NOT EXISTS idx_custom_users_role ON public.custom_users (role);
CREATE INDEX IF NOT EXISTS idx_custom_users_banned ON public.custom_users (banned);
CREATE INDEX IF NOT EXISTS idx_custom_users_created_at ON public.custom_users (created_at DESC);

-- Add indexes for applications table
CREATE INDEX IF NOT EXISTS idx_applications_status ON public.applications (status);
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON public.applications (user_id);
CREATE INDEX IF NOT EXISTS idx_applications_created_at ON public.applications (created_at DESC);

-- Add indexes for chat_sessions table  
CREATE INDEX IF NOT EXISTS idx_chat_sessions_status ON public.chat_sessions (status);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_created_at ON public.chat_sessions (created_at DESC);

-- Add indexes for profiles table
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles (role);
CREATE INDEX IF NOT EXISTS idx_profiles_discord_id ON public.profiles (discord_id);

-- Consider partitioning for large tables (performance_metrics by date)
-- This is a comment for future consideration when data grows large enough