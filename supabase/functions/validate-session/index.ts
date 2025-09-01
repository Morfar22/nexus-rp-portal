import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { session_token } = await req.json();

    if (!session_token) {
      return new Response(
        JSON.stringify({ valid: false, error: "Session token is required" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find session and user
    const { data: sessionData, error: sessionError } = await supabase
      .from('custom_sessions')
      .select(`
        *,
        custom_users(*)
      `)
      .eq('session_token', session_token)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (sessionError || !sessionData || !sessionData.custom_users) {
      return new Response(
        JSON.stringify({ valid: false, error: "Invalid or expired session" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if user is banned
    if (sessionData.custom_users.banned) {
      // Delete the session
      await supabase
        .from('custom_sessions')
        .delete()
        .eq('session_token', session_token);

      return new Response(
        JSON.stringify({ valid: false, error: "Account suspended", banned: true }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Update last accessed
    await supabase
      .from('custom_sessions')
      .update({ last_accessed: new Date().toISOString() })
      .eq('session_token', session_token);

    // Return user data
    const userData = {
      id: sessionData.custom_users.id,
      email: sessionData.custom_users.email,
      username: sessionData.custom_users.username,
      email_verified: sessionData.custom_users.email_verified,
      role: sessionData.custom_users.role,
      avatar_url: sessionData.custom_users.avatar_url,
      full_name: sessionData.custom_users.full_name,
      created_at: sessionData.custom_users.created_at,
    };

    return new Response(
      JSON.stringify({ 
        valid: true,
        user: userData,
        expires_at: sessionData.expires_at,
      }),
      { headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error('Error in validate-session:', error);
    return new Response(
      JSON.stringify({ valid: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});