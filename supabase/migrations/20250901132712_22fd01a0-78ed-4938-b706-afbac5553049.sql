-- Purge all users from the system
-- Use CASCADE deletes where possible and only work with known tables

-- First disable all triggers temporarily to avoid cascading issues
SET session_replication_role = replica;

-- Set optional user reference fields to NULL in known tables
UPDATE application_types SET created_by = NULL WHERE created_by IS NOT NULL;
UPDATE email_templates SET created_by = NULL WHERE created_by IS NOT NULL;
UPDATE server_settings SET created_by = NULL WHERE created_by IS NOT NULL;
UPDATE packages SET created_by = NULL WHERE created_by IS NOT NULL;
UPDATE partners SET created_by = NULL WHERE created_by IS NOT NULL;
UPDATE rules SET created_by = NULL WHERE created_by IS NOT NULL;
UPDATE laws SET created_by = NULL WHERE created_by IS NOT NULL;
UPDATE servers SET created_by = NULL WHERE created_by IS NOT NULL;
UPDATE canned_responses SET created_by = NULL WHERE created_by IS NOT NULL;

-- Update banned_by references
UPDATE profiles SET banned_by = NULL WHERE banned_by IS NOT NULL;
UPDATE custom_users SET banned_by = NULL WHERE banned_by IS NOT NULL;
UPDATE chat_banned_users SET banned_by = NULL WHERE banned_by IS NOT NULL;

-- Update application references
UPDATE applications SET reviewed_by = NULL WHERE reviewed_by IS NOT NULL;
UPDATE applications SET closed_by = NULL WHERE closed_by IS NOT NULL;

-- Update chat session assignment
UPDATE chat_sessions SET assigned_to = NULL WHERE assigned_to IS NOT NULL;

-- Delete from known user-dependent tables
TRUNCATE chat_file_attachments CASCADE;
TRUNCATE chat_typing_indicators CASCADE;
TRUNCATE chat_ai_interactions CASCADE;
TRUNCATE chat_messages CASCADE;
TRUNCATE missed_chats CASCADE;
TRUNCATE chat_sessions CASCADE;
TRUNCATE chat_banned_users CASCADE;
TRUNCATE event_participants CASCADE;
TRUNCATE community_vote_responses CASCADE;
TRUNCATE character_profiles CASCADE;
TRUNCATE applications CASCADE;
TRUNCATE supporters CASCADE;
TRUNCATE rp_events CASCADE;
TRUNCATE community_votes CASCADE;
TRUNCATE push_subscriptions CASCADE;
TRUNCATE email_verification_tokens CASCADE;
TRUNCATE password_reset_tokens CASCADE;
TRUNCATE failed_login_attempts CASCADE;
TRUNCATE application_rate_limits CASCADE;
TRUNCATE audit_logs CASCADE;
TRUNCATE user_role_assignments CASCADE;
TRUNCATE user_roles CASCADE;
TRUNCATE custom_sessions CASCADE;
TRUNCATE profiles CASCADE;
TRUNCATE custom_users CASCADE;

-- Re-enable triggers
SET session_replication_role = DEFAULT;

-- Finally delete from auth.users using CASCADE
DELETE FROM auth.users;