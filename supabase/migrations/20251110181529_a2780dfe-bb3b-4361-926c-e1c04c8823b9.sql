-- Add additional fields to servers table for display customization
ALTER TABLE servers 
ADD COLUMN IF NOT EXISTS hostname TEXT,
ADD COLUMN IF NOT EXISTS gametype TEXT DEFAULT 'N/A',
ADD COLUMN IF NOT EXISTS mapname TEXT DEFAULT 'N/A',
ADD COLUMN IF NOT EXISTS display_ip TEXT,
ADD COLUMN IF NOT EXISTS discord_url TEXT,
ADD COLUMN IF NOT EXISTS max_players INTEGER DEFAULT 48,
ADD COLUMN IF NOT EXISTS cfx_server_code TEXT;

-- Add comment for documentation
COMMENT ON COLUMN servers.hostname IS 'The display name shown to users on the website';
COMMENT ON COLUMN servers.gametype IS 'The game type/mode of the server';
COMMENT ON COLUMN servers.mapname IS 'The current map name';
COMMENT ON COLUMN servers.display_ip IS 'The connection string shown to users (e.g., connect panel.adventurerp.dk:30120)';
COMMENT ON COLUMN servers.discord_url IS 'Discord server invite URL';
COMMENT ON COLUMN servers.max_players IS 'Maximum number of players allowed on the server';
COMMENT ON COLUMN servers.cfx_server_code IS 'CFX.re server code for fetching live stats';