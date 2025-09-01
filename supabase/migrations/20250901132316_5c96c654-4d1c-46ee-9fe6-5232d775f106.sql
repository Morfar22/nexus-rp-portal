-- Purge all users from the system
-- Delete all user-related data in proper dependency order to avoid foreign key violations

-- First, delete all data that references user tables
DELETE FROM supporters;
DELETE FROM applications;
DELETE FROM character_profiles;
DELETE FROM chat_sessions;
DELETE FROM chat_messages;
DELETE FROM chat_ai_interactions;
DELETE FROM chat_file_attachments;
DELETE FROM chat_typing_indicators;
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

-- Delete user role and permission data
DELETE FROM user_role_assignments;
DELETE FROM user_roles;

-- Delete user profile and session data
DELETE FROM custom_sessions;
DELETE FROM profiles;
DELETE FROM custom_users;

-- Finally delete from auth.users (this will cascade to related auth tables)
DELETE FROM auth.users;