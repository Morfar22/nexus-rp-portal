-- Migrate existing users from Supabase auth to custom_users table

-- First, let's see what we're working with
INSERT INTO custom_users (
  id,
  email, 
  username,
  full_name,
  avatar_url,
  role,
  email_verified,
  password_hash,
  created_at,
  updated_at,
  last_login
)
SELECT 
  au.id,
  au.email,
  COALESCE(p.username, SPLIT_PART(au.email, '@', 1)) as username, -- Use email prefix if no username
  p.full_name,
  p.avatar_url,
  COALESCE(p.role, 'user') as role, -- Default to 'user' if no role set
  CASE WHEN au.email_confirmed_at IS NOT NULL THEN true ELSE false END as email_verified,
  'MIGRATION_REQUIRED' as password_hash, -- Placeholder - users need to reset password
  au.created_at,
  COALESCE(p.created_at, au.created_at) as updated_at,
  au.last_sign_in_at
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE NOT EXISTS (
  SELECT 1 FROM custom_users cu WHERE cu.id = au.id
); -- Avoid duplicates if running multiple times