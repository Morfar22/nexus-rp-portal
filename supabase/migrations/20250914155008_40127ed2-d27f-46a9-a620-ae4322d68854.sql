-- Add Discord fields to custom_users table
ALTER TABLE custom_users ADD COLUMN discord_id TEXT;
ALTER TABLE custom_users ADD COLUMN discord_username TEXT;
ALTER TABLE custom_users ADD COLUMN discord_discriminator TEXT;
ALTER TABLE custom_users ADD COLUMN discord_access_token TEXT;
ALTER TABLE custom_users ADD COLUMN discord_refresh_token TEXT;
ALTER TABLE custom_users ADD COLUMN discord_connected_at TIMESTAMP WITH TIME ZONE;

-- Create index for Discord ID lookups
CREATE INDEX IF NOT EXISTS idx_custom_users_discord_id ON custom_users(discord_id);