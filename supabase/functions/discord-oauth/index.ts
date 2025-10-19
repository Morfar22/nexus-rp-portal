import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[DISCORD-OAUTH] ${step}${detailsStr}`);
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const discordClientId = Deno.env.get('DISCORD_CLIENT_ID');
const discordClientSecret = Deno.env.get('DISCORD_CLIENT_SECRET');

logStep("Environment check", {
  hasSupabaseUrl: !!supabaseUrl,
  hasSupabaseKey: !!supabaseKey,
  hasDiscordClientId: !!discordClientId,
  hasDiscordClientSecret: !!discordClientSecret
});

const supabase = createClient(supabaseUrl, supabaseKey);

Deno.serve(async (req) => {
  logStep("Function started", { method: req.method, url: req.url });
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    logStep("CORS preflight handled");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, data } = await req.json();
    logStep("Request parsed", { action, hasData: !!data });

    let result;
    switch (action) {
      case 'get_auth_url':
        logStep("Processing get_auth_url action", { redirectUri: data.redirectUri });
        result = await getDiscordAuthUrl(data.redirectUri);
        break;
      case 'exchange_code':
        logStep("Processing exchange_code action", { hasCode: !!data.code, redirectUri: data.redirectUri, userId: data.userId });
        result = await exchangeCodeForTokens(data.code, data.redirectUri, data.userId);
        break;
      case 'refresh_token':
        logStep("Processing refresh_token action", { hasRefreshToken: !!data.refreshToken });
        result = await refreshDiscordToken(data.refreshToken);
        break;
      case 'disconnect':
        logStep("Processing disconnect action", { userId: data.userId });
        result = await disconnectDiscord(data.userId);
        break;
      default:
        logStep("ERROR: Unknown action", { action });
        throw new Error(`Unknown action: ${action}`);
    }

    logStep("Action completed successfully", { action, resultType: typeof result });
    return new Response(
      JSON.stringify({ success: true, data: result }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    logStep("ERROR in discord-oauth", { message: errorMessage, stack: errorStack });
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

async function getDiscordAuthUrl(redirectUri: string) {
  if (!discordClientId) {
    throw new Error('Discord client ID not configured');
  }

  const params = new URLSearchParams({
    client_id: discordClientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'identify',
    state: crypto.randomUUID(),
  });

  const authUrl = `https://discord.com/oauth2/authorize?${params.toString()}`;
  
  return { authUrl };
}

async function exchangeCodeForTokens(code: string, redirectUri: string, userId?: string) {
  if (!discordClientId || !discordClientSecret) {
    throw new Error('Discord OAuth credentials not configured');
  }

  const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: discordClientId,
      client_secret: discordClientSecret,
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!tokenResponse.ok) {
    const errorData = await tokenResponse.text();
    throw new Error(`Failed to exchange code: ${errorData}`);
  }

  const tokens = await tokenResponse.json();

  // Get user info from Discord
  const userResponse = await fetch('https://discord.com/api/users/@me', {
    headers: {
      Authorization: `Bearer ${tokens.access_token}`,
    },
  });

  if (!userResponse.ok) {
    throw new Error('Failed to get Discord user info');
  }

  const discordUser = await userResponse.json();
  
  // Build Discord avatar URL
  const avatarUrl = discordUser.avatar 
    ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
    : null;

  // Get email from Discord
  const discordEmail = discordUser.email || `${discordUser.id}@discord.user`;

  // If userId is provided, just update existing user with Discord info
  if (userId) {
    const { error } = await supabase
      .from('custom_users')
      .update({
        discord_id: discordUser.id,
        discord_username: discordUser.username,
        discord_discriminator: discordUser.discriminator,
        discord_access_token: tokens.access_token,
        discord_refresh_token: tokens.refresh_token,
        discord_connected_at: new Date().toISOString(),
        username: discordUser.username,
        avatar_url: avatarUrl,
      })
      .eq('id', userId);

    if (error) {
      throw new Error(`Failed to save Discord connection: ${error.message}`);
    }

    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresIn: tokens.expires_in,
      user: {
        id: discordUser.id,
        username: discordUser.username,
        discriminator: discordUser.discriminator,
        avatar: discordUser.avatar,
      },
    };
  }

  // No userId provided - this is a login/signup flow
  // Check if user exists by Discord ID first
  let { data: existingUser } = await supabase
    .from('custom_users')
    .select('*')
    .eq('discord_id', discordUser.id)
    .maybeSingle();

  // If not found by Discord ID, try by email
  if (!existingUser && discordUser.email) {
    const { data: emailUser } = await supabase
      .from('custom_users')
      .select('*')
      .eq('email', discordUser.email.toLowerCase())
      .maybeSingle();
    
    if (emailUser) {
      existingUser = emailUser;
    }
  }

  let customUser;

  if (existingUser) {
    // User exists - update with Discord info if not already connected
    if (!existingUser.discord_id) {
      const { data: updatedUser, error: updateError } = await supabase
        .from('custom_users')
        .update({
          discord_id: discordUser.id,
          discord_username: discordUser.username,
          discord_discriminator: discordUser.discriminator,
          discord_access_token: tokens.access_token,
          discord_refresh_token: tokens.refresh_token,
          discord_connected_at: new Date().toISOString(),
          username: existingUser.username || discordUser.username,
          avatar_url: existingUser.avatar_url || avatarUrl,
          email_verified: true, // Auto-verify if coming from Discord
        })
        .eq('id', existingUser.id)
        .select()
        .single();

      if (updateError) {
        throw new Error(`Failed to update user: ${updateError.message}`);
      }
      customUser = updatedUser;
    } else {
      customUser = existingUser;
    }

    // Check if user is banned
    if (customUser.banned) {
      throw new Error('Account suspended');
    }
  } else {
    // User doesn't exist - create new account
    const { data: newUser, error: createError } = await supabase
      .from('custom_users')
      .insert({
        email: discordEmail.toLowerCase(),
        username: discordUser.username,
        discord_id: discordUser.id,
        discord_username: discordUser.username,
        discord_discriminator: discordUser.discriminator,
        discord_access_token: tokens.access_token,
        discord_refresh_token: tokens.refresh_token,
        discord_connected_at: new Date().toISOString(),
        avatar_url: avatarUrl,
        email_verified: true, // Auto-verify Discord users
        password_hash: crypto.randomUUID(), // Random password - they'll use Discord to login
      })
      .select()
      .single();

    if (createError) {
      throw new Error(`Failed to create user: ${createError.message}`);
    }
    customUser = newUser;
  }

  // Create session for the user
  const sessionToken = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const { error: sessionError } = await supabase
    .from('custom_sessions')
    .insert({
      user_id: customUser.id,
      session_token: sessionToken,
      expires_at: expiresAt.toISOString(),
    });

  if (sessionError) {
    throw new Error(`Failed to create session: ${sessionError.message}`);
  }

  // Update last login
  await supabase
    .from('custom_users')
    .update({ last_login: new Date().toISOString() })
    .eq('id', customUser.id);

  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresIn: tokens.expires_in,
    sessionToken: sessionToken,
    customUser: {
      id: customUser.id,
      email: customUser.email,
      username: customUser.username,
      role: customUser.role,
      avatar_url: customUser.avatar_url,
      email_verified: customUser.email_verified,
      created_at: customUser.created_at,
    },
    discordUser: {
      id: discordUser.id,
      username: discordUser.username,
      discriminator: discordUser.discriminator,
      avatar: discordUser.avatar,
    },
  };
}

async function refreshDiscordToken(refreshToken: string) {
  if (!discordClientId || !discordClientSecret) {
    throw new Error('Discord OAuth credentials not configured');
  }

  const response = await fetch('https://discord.com/api/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: discordClientId,
      client_secret: discordClientSecret,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Failed to refresh token: ${errorData}`);
  }

  const tokens = await response.json();

  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresIn: tokens.expires_in,
  };
}

async function disconnectDiscord(userId: string) {
  const { error } = await supabase
    .from('custom_users')
    .update({
      discord_id: null,
      discord_username: null,
      discord_discriminator: null,
      discord_access_token: null,
      discord_refresh_token: null,
      discord_connected_at: null,
    })
    .eq('id', userId);

  if (error) {
    throw new Error(`Failed to disconnect Discord: ${error.message}`);
  }

  return { disconnected: true };
}