-- Purge all users from the system
-- Use CASCADE deletes and handle existing tables only

-- Disable foreign key checks temporarily and delete everything
SET session_replication_role = replica;

-- Delete all user-related data
TRUNCATE TABLE chat_file_attachments CASCADE;
TRUNCATE TABLE chat_typing_indicators CASCADE;
TRUNCATE TABLE chat_ai_interactions CASCADE;
TRUNCATE TABLE chat_messages CASCADE;
TRUNCATE TABLE missed_chats CASCADE;
TRUNCATE TABLE chat_sessions CASCADE;
TRUNCATE TABLE chat_banned_users CASCADE;
TRUNCATE TABLE chat_analytics CASCADE;

TRUNCATE TABLE event_participants CASCADE;
TRUNCATE TABLE community_vote_responses CASCADE;
TRUNCATE TABLE community_votes CASCADE;
TRUNCATE TABLE character_profiles CASCADE;
TRUNCATE TABLE rp_events CASCADE;

TRUNCATE TABLE applications CASCADE;
TRUNCATE TABLE supporters CASCADE;
TRUNCATE TABLE push_subscriptions CASCADE;
TRUNCATE TABLE email_verification_tokens CASCADE;
TRUNCATE TABLE password_reset_tokens CASCADE;
TRUNCATE TABLE failed_login_attempts CASCADE;
TRUNCATE TABLE application_rate_limits CASCADE;
TRUNCATE TABLE audit_logs CASCADE;

-- Clean up any created_by references
UPDATE application_types SET created_by = NULL;
UPDATE email_templates SET created_by = NULL;
UPDATE server_settings SET created_by = NULL;
UPDATE packages SET created_by = NULL;
UPDATE partners SET created_by = NULL;
UPDATE rules SET created_by = NULL;
UPDATE laws SET created_by = NULL;
UPDATE servers SET created_by = NULL;
UPDATE canned_responses SET created_by = NULL;

-- Delete user role and permission data
TRUNCATE TABLE user_role_assignments CASCADE;
TRUNCATE TABLE user_roles CASCADE;

-- Delete user profile and session data
TRUNCATE TABLE custom_sessions CASCADE;
TRUNCATE TABLE profiles CASCADE;
TRUNCATE TABLE custom_users CASCADE;

-- Finally delete from auth.users
DELETE FROM auth.users;

-- Re-enable foreign key checks
SET session_replication_role = DEFAULT;