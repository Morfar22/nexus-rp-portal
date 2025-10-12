-- Add password reset columns to custom_users table
ALTER TABLE public.custom_users 
ADD COLUMN IF NOT EXISTS reset_token TEXT,
ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMPTZ;