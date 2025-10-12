# FiveM Server Achievement Integration

## Setup

### 1. Add FiveM API Token Secret
First, add a secret called `FIVEM_API_TOKEN` in your Supabase project settings. This will be used to authenticate your FiveM server.

### 2. FiveM Server Configuration

Add this to your FiveM server's `server.cfg`:
```
set achievement_api_url "https://vqvluqwadoaerghwyohk.supabase.co/functions/v1/fivem-achievement-api"
set achievement_api_token "your_fivem_api_token_here"
```

### 3. Install HTTP Resource
Make sure your FiveM server has an HTTP resource installed (like `yarn` or `webpack`).

## Lua Implementation

### Server-side Lua Script (`server.lua`)

```lua
local API_URL = GetConvar('achievement_api_url', '')
local API_TOKEN = GetConvar('achievement_api_token', '')

-- Award achievement to a player
function AwardAchievement(playerId, achievementType, metadata)
    local player = GetPlayerName(playerId)
    local identifiers = GetPlayerIdentifiers(playerId)
    
    -- Get Discord ID if available
    local discordId = nil
    for _, id in pairs(identifiers) do
        if string.sub(id, 1, 8) == "discord:" then
            discordId = string.sub(id, 9)
            break
        end
    end
    
    if not discordId then
        print("^1[Achievements] No Discord ID found for player " .. player)
        return false
    end
    
    local postData = json.encode({
        action = "award_achievement",
        discordId = discordId,
        achievementType = achievementType,
        metadata = metadata or {}
    })
    
    PerformHttpRequest(API_URL, function(statusCode, response, headers)
        if statusCode == 200 then
            local result = json.decode(response)
            if result.success then
                print("^2[Achievements] Awarded '" .. achievementType .. "' to " .. player)
                -- Notify the player
                TriggerClientEvent('achievement:awarded', playerId, achievementType)
            else
                print("^1[Achievements] Error awarding achievement: " .. (result.error or "Unknown error"))
            end
        else
            print("^1[Achievements] HTTP Error " .. statusCode .. ": " .. response)
        end
    end, 'POST', postData, {
        ['Content-Type'] = 'application/json',
        ['x-fivem-token'] = API_TOKEN
    })
end

-- Get player achievements
function GetPlayerAchievements(playerId, callback)
    local identifiers = GetPlayerIdentifiers(playerId)
    
    local discordId = nil
    for _, id in pairs(identifiers) do
        if string.sub(id, 1, 8) == "discord:" then
            discordId = string.sub(id, 9)
            break
        end
    end
    
    if not discordId then
        callback(false, "No Discord ID found")
        return
    end
    
    local postData = json.encode({
        action = "get_user_achievements",
        discordId = discordId
    })
    
    PerformHttpRequest(API_URL, function(statusCode, response, headers)
        if statusCode == 200 then
            local result = json.decode(response)
            if result.success then
                callback(true, result.achievements)
            else
                callback(false, result.error)
            end
        else
            callback(false, "HTTP Error " .. statusCode)
        end
    end, 'POST', postData, {
        ['Content-Type'] = 'application/json',
        ['x-fivem-token'] = API_TOKEN
    })
end

-- Export functions for other resources to use
exports('AwardAchievement', AwardAchievement)
exports('GetPlayerAchievements', GetPlayerAchievements)

-- Example usage events
RegisterCommand('testachievement', function(source, args)
    if source == 0 then return end -- Console command
    
    local achievementType = args[1] or 'first_character'
    AwardAchievement(source, achievementType, {
        timestamp = os.time(),
        server = 'fivem'
    })
end, false)

-- Award achievements based on game events
AddEventHandler('playerSpawned', function(playerId)
    -- Award first spawn achievement
    AwardAchievement(playerId, 'first_character', {
        event = 'first_spawn',
        timestamp = os.time()
    })
end)

AddEventHandler('playerDied', function(playerId, reason)
    -- You could award achievements for deaths, kills, etc.
    -- AwardAchievement(playerId, 'first_death', { reason = reason })
end)
```

### Client-side Lua Script (`client.lua`)

```lua
-- Handle achievement notifications
RegisterNetEvent('achievement:awarded')
AddEventHandler('achievement:awarded', function(achievementType)
    -- Show notification to player
    SetNotificationTextEntry("STRING")
    AddTextComponentString("🏆 Achievement Unlocked: " .. achievementType)
    DrawNotification(false, false)
    
    -- Play sound
    PlaySoundFrontend(-1, "MEDAL_BRONZE", "HUD_AWARDS", false)
end)

-- Command to check achievements
RegisterCommand('myachievements', function()
    TriggerServerEvent('achievement:get_my_achievements')
end, false)

RegisterNetEvent('achievement:show_achievements')
AddEventHandler('achievement:show_achievements', function(achievements)
    -- Display achievements to player (you can create a custom UI here)
    for _, achievement in pairs(achievements) do
        print("🏆 " .. achievement.achievements.name .. " - " .. achievement.achievements.description)
    end
end)
```

### Server Event Handler

```lua
-- Add this to your server.lua
RegisterServerEvent('achievement:get_my_achievements')
AddEventHandler('achievement:get_my_achievements', function()
    local source = source
    
    GetPlayerAchievements(source, function(success, data)
        if success then
            TriggerClientEvent('achievement:show_achievements', source, data)
        else
            TriggerClientEvent('chat:addMessage', source, {
                color = {255, 0, 0},
                multiline = true,
                args = {"Achievements", "Error loading achievements: " .. data}
            })
        end
    end)
end)
```

## Available Achievement Types

- `first_character` - First character creation
- `first_vote` - First community vote
- `event_participant` - Event participation
- `community_contributor` - Community contribution

## Bulk Award Example

```lua
-- Award multiple achievements at once
function BulkAwardAchievements(achievements)
    local postData = json.encode({
        action = "bulk_award",
        achievements = achievements
    })
    
    PerformHttpRequest(API_URL, function(statusCode, response, headers)
        if statusCode == 200 then
            local result = json.decode(response)
            print("^2[Achievements] Bulk award completed: " .. #result.results .. " processed")
        end
    end, 'POST', postData, {
        ['Content-Type'] = 'application/json',
        ['x-fivem-token'] = API_TOKEN
    })
end

-- Usage example
BulkAwardAchievements({
    { discordId = "123456789", type = "first_character", metadata = {} },
    { discordId = "987654321", type = "event_participant", metadata = { event = "race_night" } }
})
```

## Security Notes

1. Keep your `FIVEM_API_TOKEN` secret and secure
2. The API uses Discord ID to identify users, so players must have Discord linked
3. All API calls are logged for security monitoring

## Testing

1. Use `/testachievement first_character` command in-game to test
2. Use `/myachievements` to view earned achievements
3. Check your website's achievement page to see them appear