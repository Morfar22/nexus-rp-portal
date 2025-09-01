-- Purge all users from the system
-- Handle all possible foreign key constraints

-- First, set all possible created_by, updated_by, banned_by, and other user reference fields to NULL
DO $$ 
DECLARE
    rec RECORD;
BEGIN
    -- Update all created_by fields to NULL across all tables
    FOR rec IN 
        SELECT table_name, column_name
        FROM information_schema.columns 
        WHERE column_name IN ('created_by', 'updated_by', 'banned_by', 'reviewed_by', 'closed_by', 'assigned_to', 'user_id')
        AND table_schema = 'public'
        AND table_name NOT IN ('custom_users', 'profiles', 'user_roles', 'user_role_assignments')
    LOOP
        EXECUTE format('UPDATE %I SET %I = NULL WHERE %I IS NOT NULL', rec.table_name, rec.column_name, rec.column_name);
    END LOOP;
END $$;

-- Delete all user-related data
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

-- Try to delete from any other potential tables that might reference users
DO $$
DECLARE
    rec RECORD;
BEGIN
    -- Delete from tables that have user_id columns
    FOR rec IN 
        SELECT DISTINCT table_name
        FROM information_schema.columns 
        WHERE column_name = 'user_id'
        AND table_schema = 'public'
        AND table_name NOT IN ('custom_users', 'profiles', 'user_roles', 'user_role_assignments', 'supporters', 'applications', 'character_profiles', 'chat_sessions', 'chat_messages', 'chat_ai_interactions', 'chat_file_attachments', 'chat_typing_indicators', 'chat_banned_users', 'community_votes', 'community_vote_responses', 'rp_events', 'event_participants', 'push_subscriptions', 'audit_logs', 'missed_chats', 'email_verification_tokens', 'password_reset_tokens', 'failed_login_attempts', 'application_rate_limits')
    LOOP
        EXECUTE format('DELETE FROM %I', rec.table_name);
    END LOOP;
END $$;

-- Delete user role and permission data
DELETE FROM user_role_assignments;
DELETE FROM user_roles;

-- Delete user profile and session data
DELETE FROM custom_sessions;
DELETE FROM profiles;
DELETE FROM custom_users;

-- Finally delete from auth.users
DELETE FROM auth.users;