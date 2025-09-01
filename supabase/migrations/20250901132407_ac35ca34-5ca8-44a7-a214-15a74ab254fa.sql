-- Purge all users from the system
-- Set all user references to NULL first, then delete user records

-- Set all created_by fields to NULL where they exist
UPDATE application_types SET created_by = NULL WHERE created_by IS NOT NULL;
UPDATE email_templates SET created_by = NULL WHERE created_by IS NOT NULL;
UPDATE server_settings SET created_by = NULL WHERE created_by IS NOT NULL;
UPDATE packages SET created_by = NULL WHERE created_by IS NOT NULL;
UPDATE partners SET created_by = NULL WHERE created_by IS NOT NULL;
UPDATE rules SET created_by = NULL WHERE created_by IS NOT NULL;
UPDATE laws SET created_by = NULL WHERE created_by IS NOT NULL;
UPDATE servers SET created_by = NULL WHERE created_by IS NOT NULL;
UPDATE canned_responses SET created_by = NULL WHERE created_by IS NOT NULL;

-- Update any banned_by references
UPDATE profiles SET banned_by = NULL WHERE banned_by IS NOT NULL;
UPDATE custom_users SET banned_by = NULL WHERE banned_by IS NOT NULL;
UPDATE chat_banned_users SET banned_by = NULL WHERE banned_by IS NOT NULL;

-- Update any other user references
UPDATE applications SET reviewed_by = NULL WHERE reviewed_by IS NOT NULL;
UPDATE applications SET closed_by = NULL WHERE closed_by IS NOT NULL;

-- Now delete all user-related data in dependency order
DELETE FROM supporters;
DELETE FROM applications;
DELETE FROM character_profiles;
DELETE FROM chat_sessions;
DELETE FROM chat_messages;
DELETE FROM chat_ai_interactions;
DELETE FROM chat_file_attachments;
DELETE FROM chat_typing_indicators;
DELETE FROM chat_banned_users;
DELETE FROM community_votes;
DELETE FROM community_vote_responses;
DELETE FROM rp_events;
DELETE FROM event_participants;
DELETE FROM push_subscriptions;
DELETE FROM audit_logs;
DELETE FROM missed_chats;
DELETE FROM email_verification_tokens;
DELETE FROM password_reset_tokens;
DELETE FROM failed_login_attempts;
DELETE FROM application_rate_limits;

-- Delete user role and permission data
DELETE FROM user_role_assignments;
DELETE FROM user_roles;

-- Delete user profile and session data
DELETE FROM custom_sessions;
DELETE FROM profiles;
DELETE FROM custom_users;

-- Finally delete from auth.users
DELETE FROM auth.users;