-- Purge all users from the system
-- This will delete all user data including profiles, roles, and authentication records

-- Delete all user-related data in dependency order
DELETE FROM user_role_assignments;
DELETE FROM user_roles;
DELETE FROM profiles;
DELETE FROM custom_sessions;
DELETE FROM custom_users;

-- Delete from auth.users (this will cascade to related auth tables)
DELETE FROM auth.users;

-- Reset any sequences or auto-incrementing fields if needed
-- (None appear to be needed based on the schema)