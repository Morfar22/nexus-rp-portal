-- Add discord_sync column to team_members table
ALTER TABLE team_members 
ADD COLUMN discord_id TEXT,
ADD COLUMN auto_synced BOOLEAN DEFAULT false,
ADD COLUMN last_discord_sync TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create index for faster Discord ID lookups
CREATE INDEX idx_team_members_discord_id ON team_members(discord_id) WHERE discord_id IS NOT NULL;