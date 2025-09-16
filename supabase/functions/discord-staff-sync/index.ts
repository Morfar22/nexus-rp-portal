import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const discordBotToken = Deno.env.get('DISCORD_BOT_TOKEN');

const supabase = createClient(supabaseUrl, supabaseKey);

interface DiscordMember {
  user: {
    id: string;
    username: string;
    discriminator: string;
    avatar?: string;
  };
  roles: string[];
  nick?: string;
  joined_at: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('=== DISCORD STAFF SYNC FUNCTION START ===');

  try {
    if (!discordBotToken) {
      throw new Error('Discord bot token not configured');
    }

    const { action, guildId } = await req.json();
    console.log('Discord staff sync action:', action, 'guildId:', guildId);

    let result;
    switch (action) {
      case 'fetch_guild_members':
        result = await fetchGuildMembers(guildId);
        break;
      case 'sync_staff_members':
        result = await syncStaffMembers(guildId);
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Discord staff sync error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

async function makeDiscordRequest(endpoint: string, options: RequestInit = {}) {
  const url = `https://discord.com/api/v10${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bot ${discordBotToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error(`Discord API error (${response.status}):`, errorData);
    
    let errorMessage = `Discord API error: ${response.status} - ${errorData}`;
    
    // Provide more helpful error messages for common issues
    if (response.status === 404) {
      const errorObj = JSON.parse(errorData);
      if (errorObj.code === 10004) {
        errorMessage = 'Discord server not found. Please check your Discord Server ID or ensure the bot has been added to your server.';
      }
    } else if (response.status === 403) {
      errorMessage = 'Discord bot lacks permissions. Please ensure the bot has "View Server Members" permission in your Discord server.';
    } else if (response.status === 401) {
      errorMessage = 'Discord bot token is invalid. Please check your Discord bot configuration.';
    }
    
    throw new Error(errorMessage);
  }

  return response.json();
}

async function fetchGuildMembers(guildId: string): Promise<DiscordMember[]> {
  console.log(`Fetching guild members for guild ID: ${guildId}`);
  
  if (!guildId || guildId.trim() === '') {
    throw new Error('Guild ID is required. Please configure your Discord Server ID in the settings.');
  }
  
  // First verify the bot can access the guild
  try {
    await makeDiscordRequest(`/guilds/${guildId}`);
  } catch (error) {
    console.error('Failed to access guild:', error);
    throw new Error(`Cannot access Discord server with ID ${guildId}. ${error.message}`);
  }
  
  const members = await makeDiscordRequest(`/guilds/${guildId}/members?limit=1000`);
  console.log(`Successfully fetched ${members.length} guild members`);
  
  return members;
}

async function syncStaffMembers(guildId: string) {
  console.log(`Syncing staff members for guild ${guildId}`);

  // Get Discord settings to determine which roles are staff roles
  const { data: settings } = await supabase
    .from('server_settings')
    .select('setting_value')
    .eq('setting_key', 'discord_settings')
    .single();

  console.log('Discord settings retrieved:', JSON.stringify(settings, null, 2));

  // Get staff role mappings from Discord settings
  let staffRoleMappings = settings.setting_value.staff_role_mappings;
  
  // If no dedicated staff role mappings, create them from admin/moderator roles only (exclude user roles)
  if (!staffRoleMappings) {
    console.log('No staff_role_mappings found, using admin/moderator roles only...');
    const roleMappings = settings.setting_value.role_mappings;
    if (roleMappings) {
      staffRoleMappings = {};
      
      // Only map admin and moderator Discord roles to staff positions
      if (roleMappings.admin) {
        staffRoleMappings['Admin'] = roleMappings.admin;
      }
      
      if (roleMappings.moderator && roleMappings.moderator !== roleMappings.admin) {
        staffRoleMappings['Moderator'] = roleMappings.moderator;
      }
      
      console.log('Using admin/moderator role mappings only:', JSON.stringify(staffRoleMappings, null, 2));
    }
  }
  
  console.log('Final staff role mappings:', JSON.stringify(staffRoleMappings, null, 2));
  
  if (!staffRoleMappings) {
    console.log('Discord staff role mappings not configured yet');
    return {
      success: false,
      error: 'Discord role mappings not configured. Please configure role mappings in the Discord Bot Settings first.',
      requiresConfiguration: true
    };
  }

  console.log('Staff role mappings found:', JSON.stringify(staffRoleMappings, null, 2));
  
  // Check if any role mappings are actually set
  const hasValidMappings = Object.values(staffRoleMappings).some((roleId: any) => 
    roleId && typeof roleId === 'string' && roleId.trim() !== ''
  );
  
  if (!hasValidMappings) {
    console.log('No valid staff role mappings configured');
    return {
      success: false,
      error: 'No Discord role IDs configured in the staff role mappings. Please add at least one Discord role ID.',
      requiresConfiguration: true
    };
  }
  
  // Get all staff roles from database
  const { data: staffRoles } = await supabase
    .from('staff_roles')
    .select('*')
    .eq('is_active', true);

  if (!staffRoles || staffRoles.length === 0) {
    throw new Error('No active staff roles found. Please create staff roles first.');
  }

  // Fetch Discord guild members
  const discordMembers = await fetchGuildMembers(guildId);
  
  // Get the configured Discord role IDs (only sync members who have these specific roles)
  const configuredDiscordRoleIds = Object.values(staffRoleMappings).filter(roleId => 
    roleId && typeof roleId === 'string' && roleId.trim() !== ''
  );
  
  console.log('Configured Discord role IDs to sync:', configuredDiscordRoleIds);
  
  // Filter members who have ANY of the configured staff roles
  const staffMembers = discordMembers.filter(member => 
    member.roles.some(roleId => configuredDiscordRoleIds.includes(roleId))
  );

  console.log(`Found ${staffMembers.length} staff members with configured roles in Discord`);

  let syncedCount = 0;
  let skippedCount = 0;

  for (const discordMember of staffMembers) {
    // Find which configured Discord roles this member has
    const memberConfiguredRoleIds = discordMember.roles.filter(roleId => 
      configuredDiscordRoleIds.includes(roleId)
    );
    
    console.log(`Processing member ${discordMember.user.username} with configured Discord roles: ${memberConfiguredRoleIds.join(', ')}`);
    
    // Process each configured Discord role this member has
    for (const memberDiscordRoleId of memberConfiguredRoleIds) {
      // Find the staff role mapping for this Discord role ID
      const [staffRoleName] = Object.entries(staffRoleMappings).find(
        ([_, discordRoleId]) => discordRoleId === memberDiscordRoleId
      ) || [];
      
      if (!staffRoleName) {
        console.log(`No staff role mapping found for Discord role ID: ${memberDiscordRoleId}`);
        continue;
      }
      
      // Find matching database staff role
      const dbStaffRole = staffRoles.find(role => 
        role.name === staffRoleName ||
        role.display_name === staffRoleName ||
        role.name.toLowerCase() === staffRoleName.toLowerCase() ||
        role.display_name.toLowerCase() === staffRoleName.toLowerCase()
      );

      if (!dbStaffRole) {
        console.log(`No matching database staff role found for: ${staffRoleName}`);
        continue;
      }

      // Check if team member already exists with this role
      const { data: existingMember } = await supabase
        .from('team_members')
        .select('*')
        .eq('discord_id', discordMember.user.id)
        .eq('staff_role_id', dbStaffRole.id)
        .single();

      if (existingMember) {
        console.log(`Member ${discordMember.user.username} already exists with role ${staffRoleName}`);
        skippedCount++;
        continue;
      }

      const memberData = {
        name: discordMember.nick || discordMember.user.username,
        role: staffRoleName, // Add the required role column
        staff_role_id: dbStaffRole.id,
        discord_id: discordMember.user.id,
        auto_synced: true,
        last_discord_sync: new Date().toISOString(),
        image_url: discordMember.user.avatar 
          ? `https://cdn.discordapp.com/avatars/${discordMember.user.id}/${discordMember.user.avatar}.png`
          : null,
        is_active: true
      };

      // Create new team member
      const { error } = await supabase
        .from('team_members')
        .insert(memberData);

      if (error) {
        console.error(`Failed to create team member ${discordMember.user.username} with role ${staffRoleName}:`, error);
      } else {
        syncedCount++;
        console.log(`Created team member: ${discordMember.user.username} as ${staffRoleName}`);
      }
    }
  }

  console.log(`Sync completed: ${syncedCount} synced, ${skippedCount} skipped`);
  
  return {
    totalDiscordMembers: discordMembers.length,
    staffMembersFound: staffMembers.length,
    syncedCount,
    skippedCount
  };
}