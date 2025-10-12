-- Create custom users table
CREATE TABLE public.custom_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  username TEXT UNIQUE,
  email_verified BOOLEAN NOT NULL DEFAULT false,
  banned BOOLEAN NOT NULL DEFAULT false,
  banned_by UUID,
  banned_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_login TIMESTAMP WITH TIME ZONE,
  avatar_url TEXT,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'user'
);

-- Create email verification tokens table
CREATE TABLE public.email_verification_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.custom_users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create password reset tokens table
CREATE TABLE public.password_reset_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.custom_users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create custom user sessions table (different name to avoid conflict)
CREATE TABLE public.custom_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.custom_users(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_accessed TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address INET,
  user_agent TEXT
);

-- Enable RLS on all tables
ALTER TABLE public.custom_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_verification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for custom_users
CREATE POLICY "Users can view their own profile" ON public.custom_users
  FOR SELECT USING (id = (current_setting('app.current_user_id', true))::UUID);

CREATE POLICY "Users can update their own profile" ON public.custom_users
  FOR UPDATE USING (id = (current_setting('app.current_user_id', true))::UUID);

CREATE POLICY "System can manage users" ON public.custom_users
  FOR ALL USING (true);

-- Create RLS policies for other tables
CREATE POLICY "System can manage email tokens" ON public.email_verification_tokens
  FOR ALL USING (true);

CREATE POLICY "System can manage password tokens" ON public.password_reset_tokens
  FOR ALL USING (true);

CREATE POLICY "Users can view their own sessions" ON public.custom_sessions
  FOR SELECT USING (user_id = (current_setting('app.current_user_id', true))::UUID);

CREATE POLICY "System can manage sessions" ON public.custom_sessions
  FOR ALL USING (true);

-- Create indexes for performance
CREATE INDEX idx_custom_users_email ON public.custom_users(email);
CREATE INDEX idx_custom_users_username ON public.custom_users(username);
CREATE INDEX idx_email_verification_tokens_token ON public.email_verification_tokens(token);
CREATE INDEX idx_email_verification_tokens_user_id ON public.email_verification_tokens(user_id);
CREATE INDEX idx_password_reset_tokens_token ON public.password_reset_tokens(token);
CREATE INDEX idx_password_reset_tokens_user_id ON public.password_reset_tokens(user_id);
CREATE INDEX idx_custom_sessions_token ON public.custom_sessions(session_token);
CREATE INDEX idx_custom_sessions_user_id ON public.custom_sessions(user_id);

-- Create trigger for updated_at on custom_users
CREATE TRIGGER update_custom_users_updated_at
  BEFORE UPDATE ON public.custom_users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();