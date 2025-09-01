-- Purge all users from the system
-- Delete everything in the correct order without trying to NULL required fields

-- First set optional user reference fields to NULL
UPDATE application_types SET created_by = NULL WHERE created_by IS NOT NULL;
UPDATE email_templates SET created_by = NULL WHERE created_by IS NOT NULL;
UPDATE server_settings SET created_by = NULL WHERE created_by IS NOT NULL;
UPDATE packages SET created_by = NULL WHERE created_by IS NOT NULL;
UPDATE partners SET created_by = NULL WHERE created_by IS NOT NULL;
UPDATE rules SET created_by = NULL WHERE created_by IS NOT NULL;
UPDATE laws SET created_by = NULL WHERE created_by IS NOT NULL;
UPDATE servers SET created_by = NULL WHERE created_by IS NOT NULL;
UPDATE canned_responses SET created_by = NULL WHERE created_by IS NOT NULL;
UPDATE profiles SET banned_by = NULL WHERE banned_by IS NOT NULL;
UPDATE custom_users SET banned_by = NULL WHERE banned_by IS NOT NULL;
UPDATE chat_banned_users SET banned_by = NULL WHERE banned_by IS NOT NULL;
UPDATE applications SET reviewed_by = NULL WHERE reviewed_by IS NOT NULL;
UPDATE applications SET closed_by = NULL WHERE closed_by IS NOT NULL;
UPDATE chat_sessions SET assigned_to = NULL WHERE assigned_to IS NOT NULL;

-- Delete all tables that reference users (in dependency order)
-- Start with the most dependent tables first
DELETE FROM chat_file_attachments;
DELETE FROM chat_typing_indicators;
DELETE FROM chat_ai_interactions;
DELETE FROM chat_messages;
DELETE FROM missed_chats;
DELETE FROM chat_sessions;
DELETE FROM chat_banned_users;

DELETE FROM event_participants;
DELETE FROM community_vote_responses;
DELETE FROM character_profiles;
DELETE FROM applications;
DELETE FROM supporters;
DELETE FROM rp_events;
DELETE FROM community_votes;

DELETE FROM push_subscriptions;
DELETE FROM email_verification_tokens;
DELETE FROM password_reset_tokens;
DELETE FROM failed_login_attempts;
DELETE FROM application_rate_limits;

-- Delete from any other tables that might exist
DELETE FROM staff_members WHERE true;
DELETE FROM team_members WHERE true;

-- Delete audit logs and analytics
DELETE FROM audit_logs;

-- Delete user role and permission data
DELETE FROM user_role_assignments;
DELETE FROM user_roles;

-- Delete user profile and session data
DELETE FROM custom_sessions;
DELETE FROM profiles;
DELETE FROM custom_users;

-- Finally delete from auth.users
DELETE FROM auth.users;