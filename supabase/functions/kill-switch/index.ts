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
    const { data: userData, error: userError } = await supabase
      .from('custom_users')
      .select('email')
      .eq('id', user.id)
      .single();

    console.log('User data check:', { userData, userError, userId: user.id });

    if (userError || !userData || userData.email !== 'emilfrobergww@gmail.com') {
      console.log('Access denied - email check failed');
      return new Response(
        JSON.stringify({ error: "Unauthorized - Access restricted" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log('Access granted for:', userData.email);

    // Parse body once
    const body = await req.json();
    const { action, active } = body;

    console.log('Kill switch request:', { action, active });

    if (action === "status") {
      // Get current kill switch status
      const { data: settings } = await supabase
        .from('server_settings')
        .select('setting_value')
        .eq('setting_key', 'general_settings')
        .single();

      const killSwitchActive = settings?.setting_value?.kill_switch_active || false;

      // Check if Linux webhook is configured
      const webhookUrl = Deno.env.get('LINUX_WEBHOOK_URL');
      const webhookToken = Deno.env.get('LINUX_WEBHOOK_TOKEN');
      let linuxServerStatus = { success: false, error: null };

      if (webhookUrl && webhookToken) {
        linuxServerStatus.success = true;
        linuxServerStatus.error = null;
      } else {
        linuxServerStatus.error = 'Webhook not configured';
      }

      return new Response(
        JSON.stringify({ 
          active: killSwitchActive,
          linux_server: linuxServerStatus
        }),
        { headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (action === "toggle") {
      console.log('Toggling kill switch to:', active);
      
      // Get current settings
      const { data: currentSettings, error: settingsError } = await supabase
        .from('server_settings')
        .select('setting_value')
        .eq('setting_key', 'general_settings')
        .single();

      if (settingsError) {
        console.error('Error fetching settings:', settingsError);
        throw new Error('Failed to fetch settings');
      }

      // Update kill switch status
      const updatedSettings = {
        ...(currentSettings?.setting_value || {}),
        kill_switch_active: active
      };

      console.log('Updating settings:', updatedSettings);

      const { error: updateError } = await supabase
        .from('server_settings')
        .update({ setting_value: updatedSettings })
        .eq('setting_key', 'general_settings');

      if (updateError) {
        console.error('Error updating settings:', updateError);
        throw new Error('Failed to update settings');
      }

      console.log('Kill switch updated successfully');

      // Send webhook to Linux server
      const webhookUrl = Deno.env.get('LINUX_WEBHOOK_URL');
      const webhookToken = Deno.env.get('LINUX_WEBHOOK_TOKEN');
      let linuxServerResponse = { success: false, error: null };

      if (webhookUrl && webhookToken) {
        try {
          console.log('Sending webhook to Linux server:', webhookUrl);
          
          const webhookResponse = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              action: active ? 'shutdown' : 'startup',
              token: webhookToken,
              timestamp: new Date().toISOString(),
              triggered_by: userData.email
            })
          });

          if (webhookResponse.ok) {
            console.log('Linux server webhook successful');
            linuxServerResponse.success = true;
          } else {
            const errorText = await webhookResponse.text();
            console.error('Linux server webhook failed:', errorText);
            linuxServerResponse.error = `HTTP ${webhookResponse.status}: ${errorText}`;
          }
        } catch (webhookError: any) {
          console.error('Error calling Linux server webhook:', webhookError);
          linuxServerResponse.error = webhookError.message;
        }
      } else {
        console.log('Linux webhook not configured, skipping...');
        linuxServerResponse.error = 'Webhook not configured';
      }

      // Send Discord notification if configured
      const discordWebhook = Deno.env.get('DISCORD_WEBHOOK_URL');
      if (discordWebhook) {
        try {
          await fetch(discordWebhook, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              embeds: [{
                title: `🚨 Kill Switch ${active ? 'ACTIVATED' : 'DEACTIVATED'}`,
                description: active 
                  ? '⚠️ Emergency shutdown initiated - All services are being stopped'
                  : '✅ Services are being restored',
                color: active ? 15158332 : 3066993, // Red or Green
                fields: [
                  { name: 'Triggered by', value: userData.email, inline: true },
                  { name: 'Website', value: active ? 'Offline' : 'Online', inline: true },
                  { name: 'Linux Server', value: linuxServerResponse.success ? (active ? 'Shutdown' : 'Starting') : 'Error', inline: true }
                ],
                timestamp: new Date().toISOString()
              }]
            })
          });
        } catch (discordError) {
          console.error('Failed to send Discord notification:', discordError);
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          active,
          linux_server: linuxServerResponse
        }),
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
