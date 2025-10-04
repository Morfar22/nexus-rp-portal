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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    
    // Validate session
    const { data: sessionData, error: sessionError } = await supabase.functions.invoke(
      'validate-session',
      { body: { session_token: token } }
    );

    if (sessionError || !sessionData?.valid) {
      return new Response(
        JSON.stringify({ error: "Invalid session" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const user = sessionData.user;

    // CRITICAL: Only allow access to specific email for kill switch control
    const { data: userData } = await supabase
      .from('custom_users')
      .select('email')
      .eq('id', user.id)
      .single();

    if (userData?.email !== 'emilfrobergww@gmail.com') {
      return new Response(
        JSON.stringify({ error: "Unauthorized - Access restricted" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Parse body once
    const body = await req.json();
    const { action, active } = body;

    if (action === "status") {
      // Get current kill switch status
      const { data: settings } = await supabase
        .from('server_settings')
        .select('setting_value')
        .eq('setting_key', 'general_settings')
        .single();

      const killSwitchActive = settings?.setting_value?.kill_switch_active || false;

      return new Response(
        JSON.stringify({ active: killSwitchActive }),
        { headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (action === "toggle") {
      // Get current settings
      const { data: currentSettings } = await supabase
        .from('server_settings')
        .select('setting_value')
        .eq('setting_key', 'general_settings')
        .single();

      // Update kill switch status
      const updatedSettings = {
        ...(currentSettings?.setting_value || {}),
        kill_switch_active: active
      };

      await supabase
        .from('server_settings')
        .update({ setting_value: updatedSettings })
        .eq('setting_key', 'general_settings');

      return new Response(
        JSON.stringify({ success: true, active }),
        { headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error('Kill switch error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
