-- Purge all users from the system by deleting everything
-- Use CASCADE where possible and handle dependencies properly

-- Disable all triggers temporarily to avoid cascading issues
SET session_replication_role = replica;

-- Delete all data from tables that reference users, in dependency order
TRUNCATE TABLE supporters CASCADE;
TRUNCATE TABLE applications CASCADE;
TRUNCATE TABLE character_profiles CASCADE;
TRUNCATE TABLE chat_sessions CASCADE;
TRUNCATE TABLE chat_messages CASCADE;
TRUNCATE TABLE chat_ai_interactions CASCADE;
TRUNCATE TABLE chat_file_attachments CASCADE;
TRUNCATE TABLE chat_typing_indicators CASCADE;
TRUNCATE TABLE chat_banned_users CASCADE;
TRUNCATE TABLE community_votes CASCADE;
TRUNCATE TABLE community_vote_responses CASCADE;
TRUNCATE TABLE rp_events CASCADE;
TRUNCATE TABLE event_participants CASCADE;
TRUNCATE TABLE push_subscriptions CASCADE;
TRUNCATE TABLE audit_logs CASCADE;
TRUNCATE TABLE missed_chats CASCADE;
TRUNCATE TABLE email_verification_tokens CASCADE;
TRUNCATE TABLE password_reset_tokens CASCADE;
TRUNCATE TABLE failed_login_attempts CASCADE;
TRUNCATE TABLE application_rate_limits CASCADE;

-- Find and truncate any other tables with user_id
DO $$
DECLARE
    rec RECORD;
BEGIN
    FOR rec IN 
        SELECT DISTINCT table_name
        FROM information_schema.columns 
        WHERE column_name = 'user_id'
        AND table_schema = 'public'
        AND table_name NOT IN ('custom_users', 'profiles', 'user_roles', 'user_role_assignments')
    LOOP
        BEGIN
            EXECUTE format('TRUNCATE TABLE %I CASCADE', rec.table_name);
        EXCEPTION WHEN OTHERS THEN
            -- Continue if truncate fails
            NULL;
        END;
    END LOOP;
END $$;

-- Set created_by fields to NULL where they exist and are nullable
DO $$ 
DECLARE
    rec RECORD;
BEGIN
    FOR rec IN 
        SELECT table_name, column_name
        FROM information_schema.columns 
        WHERE column_name IN ('created_by', 'updated_by', 'banned_by', 'reviewed_by', 'closed_by', 'assigned_to')
        AND table_schema = 'public'
        AND is_nullable = 'YES'
        AND table_name NOT IN ('custom_users', 'profiles', 'user_roles', 'user_role_assignments')
    LOOP
        BEGIN
            EXECUTE format('UPDATE %I SET %I = NULL WHERE %I IS NOT NULL', rec.table_name, rec.column_name, rec.column_name);
        EXCEPTION WHEN OTHERS THEN
            -- Continue if update fails
            NULL;
        END;
    END LOOP;
END $$;

-- Delete user role and permission data
TRUNCATE TABLE user_role_assignments CASCADE;
TRUNCATE TABLE user_roles CASCADE;

-- Delete user profile and session data
TRUNCATE TABLE custom_sessions CASCADE;
TRUNCATE TABLE profiles CASCADE;
TRUNCATE TABLE custom_users CASCADE;

-- Finally delete from auth.users
DELETE FROM auth.users;

-- Re-enable triggers
SET session_replication_role = DEFAULT;