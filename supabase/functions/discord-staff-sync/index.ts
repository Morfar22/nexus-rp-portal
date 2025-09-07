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

  // Check both staff_role_mappings and role_mappings for backward compatibility
  let staffRoleMappings = settings.setting_value.staff_role_mappings;
  
  // If no dedicated staff role mappings, check if we can use role_mappings
  if (!staffRoleMappings) {
    console.log('No staff_role_mappings found, checking role_mappings...');
    const roleMappings = settings.setting_value.role_mappings;
    if (roleMappings) {
      // Map Discord role IDs directly to staff role names that exist in database
      staffRoleMappings = {};
      
      // Map admin Discord role to highest level roles
      if (roleMappings.admin) {
        staffRoleMappings['Admin'] = roleMappings.admin;
        staffRoleMappings['Head Admin'] = roleMappings.admin;
        staffRoleMappings['Projekt Manager'] = roleMappings.admin;
      }
      
      // Map moderator Discord role to staff support roles
      if (roleMappings.moderator) {
        staffRoleMappings['Community Manager'] = roleMappings.moderator;
        staffRoleMappings['Supporter'] = roleMappings.moderator;
        staffRoleMappings['Prøve Supporter'] = roleMappings.moderator;
        staffRoleMappings['Head Udvikler'] = roleMappings.moderator;
        staffRoleMappings['Hjælpe udvikler'] = roleMappings.moderator;
        staffRoleMappings['Projekt Leder'] = roleMappings.moderator;
        staffRoleMappings['Designer'] = roleMappings.moderator;
        staffRoleMappings['Allowlist modtager'] = roleMappings.moderator;
      }
      
      // Map user Discord role to lower level roles  
      if (roleMappings.user) {
        staffRoleMappings['Prøve Supporter'] = roleMappings.user;
        staffRoleMappings['Allowlist modtager'] = roleMappings.user;
      }
      
      console.log('Using general role_mappings as staff mappings:', JSON.stringify(staffRoleMappings, null, 2));
    }
  }
  
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
  
  // Filter members who have staff roles
  const staffMembers = discordMembers.filter(member => 
    member.roles.some(roleId => Object.values(staffRoleMappings).includes(roleId))
  );

  console.log(`Found ${staffMembers.length} staff members in Discord`);

  let syncedCount = 0;
  let skippedCount = 0;

  for (const discordMember of staffMembers) {
    // Find which staff role this member should have
    const memberDiscordRoleIds = discordMember.roles.filter(roleId => 
      Object.values(staffRoleMappings).includes(roleId)
    );
    
    console.log(`Processing member ${discordMember.user.username} with staff roles: ${memberDiscordRoleIds.join(', ')}`);
    
    // Process each staff role this member has
    for (const memberStaffRoleId of memberDiscordRoleIds) {
      // Find all staff role mappings for this Discord role
      const matchingMappings = Object.entries(staffRoleMappings).filter(
        ([_, discordRoleId]) => discordRoleId === memberStaffRoleId
      );
      
      // Try each mapping until we find a matching database role
      for (const [staffRoleName, _] of matchingMappings) {
        const dbStaffRole = staffRoles.find(role => 
          role.name === staffRoleName ||
          role.display_name === staffRoleName ||
          role.name.toLowerCase() === staffRoleName.toLowerCase() ||
          role.display_name.toLowerCase() === staffRoleName.toLowerCase()
        );

        if (!dbStaffRole) {
          console.log(`No matching staff role found for: ${staffRoleName}`);
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
          continue;
        }

        const memberData = {
          name: discordMember.nick || discordMember.user.username,
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
        
        // Break after first successful role assignment
        break;
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