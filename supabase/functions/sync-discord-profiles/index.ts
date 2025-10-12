import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const discordClientId = Deno.env.get('DISCORD_CLIENT_ID');
const discordClientSecret = Deno.env.get('DISCORD_CLIENT_SECRET');

const supabase = createClient(supabaseUrl, supabaseKey);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('=== SYNC DISCORD PROFILES START ===');

  try {
    // Get all users with Discord connected
    const { data: users, error: fetchError } = await supabase
      .from('custom_users')
      .select('id, discord_id, discord_username, discord_refresh_token, discord_access_token')
      .not('discord_id', 'is', null);

    if (fetchError) throw fetchError;

    console.log(`Found ${users?.length || 0} users with Discord connected`);

    let updated = 0;
    let failed = 0;

    for (const user of users || []) {
      try {
        console.log(`Processing user: ${user.id}`);

        // Try to refresh token first if we have one
        let accessToken = user.discord_access_token;
        
        if (user.discord_refresh_token && discordClientId && discordClientSecret) {
          try {
            const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: new URLSearchParams({
                client_id: discordClientId,
                client_secret: discordClientSecret,
                grant_type: 'refresh_token',
                refresh_token: user.discord_refresh_token,
              }),
            });

            if (tokenResponse.ok) {
              const tokens = await tokenResponse.json();
              accessToken = tokens.access_token;
              console.log(`Refreshed token for user ${user.id}`);
            }
          } catch (refreshError) {
            console.warn(`Failed to refresh token for user ${user.id}:`, refreshError);
          }
        }

        if (!accessToken) {
          console.log(`No access token for user ${user.id}, skipping`);
          failed++;
          continue;
        }

        // Get Discord user info
        const userResponse = await fetch('https://discord.com/api/users/@me', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!userResponse.ok) {
          console.warn(`Failed to get Discord info for user ${user.id}`);
          failed++;
          continue;
        }

        const discordUser = await userResponse.json();

        // Build avatar URL
        const avatarUrl = discordUser.avatar 
          ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
          : null;

        // Update user
        const { error: updateError } = await supabase
          .from('custom_users')
          .update({
            username: discordUser.username,
            avatar_url: avatarUrl,
            discord_username: discordUser.username,
            discord_discriminator: discordUser.discriminator,
          })
          .eq('id', user.id);

        if (updateError) {
          console.error(`Failed to update user ${user.id}:`, updateError);
          failed++;
        } else {
          console.log(`Updated user ${user.id}: ${discordUser.username}`);
          updated++;
        }

      } catch (userError) {
        console.error(`Error processing user ${user.id}:`, userError);
        failed++;
      }
    }

    console.log(`=== SYNC COMPLETE: ${updated} updated, ${failed} failed ===`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        updated,
        failed,
        total: users?.length || 0
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Sync error:', error);
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
