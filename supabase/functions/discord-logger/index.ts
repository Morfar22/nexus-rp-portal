import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Initialize Supabase client
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

serve(async (req) => {
  console.log("=== DISCORD LOGGER FUNCTION START ===")
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, data, settings } = await req.json()
    console.log("Discord logger request:", { type, data: !!data, settings: !!settings })
    console.log("FULL DATA RECEIVED:", JSON.stringify(data, null, 2))

    // Get webhook URL - check application-specific settings first for application notifications
    let webhookUrl = Deno.env.get('DISCORD_WEBHOOK_URL');
    let useApplicationWebhook = false;
    
    // For application-related notifications, check application-specific settings first
    if (type.includes('application_')) {
      try {
        const { data: appSettingsData, error: appError } = await supabaseAdmin
          .from('server_settings')
          .select('setting_value')
          .eq('setting_key', 'application_discord_settings')
          .single();

        if (!appError && appSettingsData?.setting_value?.enabled) {
          const settings = appSettingsData.setting_value;
          
          // Check if this specific notification type is enabled
          const shouldNotify = 
            (type === 'application_submitted' && settings.notify_submissions) ||
            (type === 'application_approved' && settings.notify_approvals) ||
            (type === 'application_denied' && settings.notify_denials);
          
          if (shouldNotify) {
            // Route to appropriate webhook based on notification type
            if (type === 'application_submitted') {
              // Staff notifications go to staff webhook
              webhookUrl = settings.staff_webhook_url;
              console.log("Using staff webhook for application submission");
            } else {
              // Approval/denial notifications go to public webhook
              webhookUrl = settings.public_webhook_url;
              console.log("Using public webhook for application status update");
            }
            
            if (webhookUrl) {
              useApplicationWebhook = true;
            }
          }
        }
      } catch (appError) {
        console.error("Error fetching application Discord settings:", appError);
      }
    }
    
    // Fallback to general Discord settings if no application webhook is configured
    if (!useApplicationWebhook && !webhookUrl) {
      try {
        const { data: settingsData, error } = await supabaseAdmin
          .from('server_settings')
          .select('setting_value')
          .eq('setting_key', 'discord_settings')
          .single();

        if (!error && settingsData?.setting_value?.webhook_url) {
          webhookUrl = settingsData.setting_value.webhook_url;
        }
      } catch (dbError) {
        console.error("Error fetching Discord settings from database:", dbError);
      }
    }
    
    // If no webhook URL is available, skip notification
    if (!webhookUrl) {
      console.log("No Discord webhook URL configured - skipping Discord notification")
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: "No webhook configured" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Discord embed based on type
    let embed = {}
    let content = ""

    switch (type) {
      case 'application_submitted':
        // Extract data from form_data if available, fallback to direct fields
        const steamName = data.steam_name || data.form_data?.steam_name || "Not provided";
        const discordTag = data.discord_tag || data.form_data?.discord_tag || "Not provided";
        const fivemName = data.fivem_name || data.form_data?.fivem_name || "Not provided";
        const age = data.age || data.form_data?.age || "Not provided";
        
        embed = {
          title: "🆕 New Application Submitted",
          color: 0x3498db, // Blue
          fields: [
            { name: "Steam Name", value: steamName, inline: true },
            { name: "Discord Tag", value: discordTag, inline: true },
            { name: "FiveM Name", value: fivemName, inline: true },
            { name: "Age", value: age.toString(), inline: true },
            { name: "Status", value: "Pending Review", inline: true }
          ],
          timestamp: new Date().toISOString(),
          footer: { text: "FiveM Server Application System" }
        }
        content = `📋 **New application received** from **${steamName}**${data.discord_name ? ` (<@${data.discord_name.replace(/[@<>]/g, '')}>)` : ''}`
        break

      case 'application_approved':
        const approvedSteamName = data.steam_name || data.form_data?.steam_name || "Not provided";
        const approvedDiscordTag = data.discord_tag || data.form_data?.discord_tag || "Not provided";
        const approvedFivemName = data.fivem_name || data.form_data?.fivem_name || "Not provided";
        
        embed = {
          title: "✅ Application Approved",
          color: 0x27ae60, // Green
          fields: [
            { name: "Steam Name", value: approvedSteamName, inline: true },
            { name: "Discord Tag", value: approvedDiscordTag, inline: true },
            { name: "FiveM Name", value: approvedFivemName, inline: true },
            { name: "Review Notes", value: data.review_notes || "No notes provided", inline: false }
          ],
          timestamp: new Date().toISOString(),
          footer: { text: "FiveM Server Application System" }
        }
        content = `🎉 **Application approved** for **${approvedSteamName}**${data.discord_name ? ` (<@${data.discord_name.replace(/[@<>]/g, '')}>)` : ''}! Welcome to the server!`
        break

      case 'application_denied':
        const deniedSteamName = data.steam_name || data.form_data?.steam_name || "Not provided";
        const deniedDiscordTag = data.discord_tag || data.form_data?.discord_tag || "Not provided";
        const deniedFivemName = data.fivem_name || data.form_data?.fivem_name || "Not provided";
        
        embed = {
          title: "❌ Application Denied",
          color: 0xe74c3c, // Red
          fields: [
            { name: "Steam Name", value: deniedSteamName, inline: true },
            { name: "Discord Tag", value: deniedDiscordTag, inline: true },
            { name: "FiveM Name", value: deniedFivemName, inline: true },
            { name: "Reason", value: data.review_notes || "No reason provided", inline: false }
          ],
          timestamp: new Date().toISOString(),
          footer: { text: "FiveM Server Application System" }
        }
        content = `🚫 **Application denied** for **${deniedSteamName}**${data.discord_name ? ` (<@${data.discord_name.replace(/[@<>]/g, '')}>)` : ''}`
        break

      case 'application_under_review':
        embed = {
          title: "🔍 Application Under Review",
          color: 0xf39c12, // Orange
          fields: [
            { name: "Steam Name", value: data.steam_name || "N/A", inline: true },
            { name: "Discord Tag", value: data.discord_tag || "N/A", inline: true },
            { name: "FiveM Name", value: data.fivem_name || "N/A", inline: true },
            { name: "Notes", value: data.review_notes || "No notes", inline: false }
          ],
          timestamp: new Date().toISOString(),
          footer: { text: "FiveM Server Application System" }
        }
        content = `👀 **Application under review** for **${data.steam_name}**${data.discord_name ? ` (<@${data.discord_name.replace(/[@<>]/g, '')}>)` : ''}`
        break

      case 'system_log':
        embed = {
          title: "🔧 System Log",
          color: 0x9b59b6, // Purple
          fields: [
            { name: "Event", value: data.event || "Unknown", inline: true },
            { name: "Source", value: data.source || "System", inline: true },
            { name: "Severity", value: data.severity || "INFO", inline: true },
            { name: "Message", value: data.message || "No message", inline: false }
          ],
          timestamp: new Date().toISOString(),
          footer: { text: "FiveM Server System" }
        }
        content = `🔧 **System Event**: ${data.event}`
        break

      case 'admin_user_action':
        embed = {
          title: "👥 Admin User Action",
          color: 0xe67e22, // Orange
          fields: [
            { name: "Action", value: data.action || "Unknown", inline: true },
            { name: "Admin", value: data.admin_user || "Unknown", inline: true },
            { name: "Target", value: data.user_email || data.staff_id || "Unknown", inline: true },
            { name: "Details", value: data.role ? `Role: ${data.role}` : "No additional details", inline: false }
          ],
          timestamp: new Date().toISOString(),
          footer: { text: "FiveM Server Admin Panel" }
        }
        content = `👥 **${data.action}** by **${data.admin_user}**`
        break

      case 'admin_system_change':
        embed = {
          title: "⚙️ System Setting Changed",
          color: 0x9b59b6, // Purple
          fields: [
            { name: "Setting", value: data.setting_key || "Unknown", inline: true },
            { name: "Admin", value: data.admin_user || "Unknown", inline: true },
            { name: "Action", value: data.action || "Updated", inline: true },
            { name: "Value", value: data.setting_value ? `\`${data.setting_value.substring(0, 100)}${data.setting_value.length > 100 ? '...' : ''}\`` : "Not provided", inline: false }
          ],
          timestamp: new Date().toISOString(),
          footer: { text: "FiveM Server Admin Panel" }
        }
        content = `⚙️ **Setting "${data.setting_key}" updated** by **${data.admin_user}**`
        break

      case 'admin_rule_change':
        embed = {
          title: "📋 Rule Management",
          color: 0x3498db, // Blue
          fields: [
            { name: "Action", value: data.action || "Unknown", inline: true },
            { name: "Admin", value: data.admin_user || "Unknown", inline: true },
            { name: "Rule", value: data.rule?.title || data.rule_id || "Unknown", inline: true },
            { name: "Category", value: data.rule?.category || "Not specified", inline: true }
          ],
          timestamp: new Date().toISOString(),
          footer: { text: "FiveM Server Admin Panel" }
        }
        content = `📋 **${data.action}** by **${data.admin_user}**`
        break

      case 'admin_application_action':
        embed = {
          title: "📝 Application Management",
          color: data.action === 'approved' ? 0x27ae60 : data.action === 'denied' ? 0xe74c3c : 0xf39c12,
          fields: [
            { name: "Action", value: data.action || "Unknown", inline: true },
            { name: "Admin", value: data.admin_user || "Unknown", inline: true },
            { name: "Applicant", value: data.steam_name || "Unknown", inline: true },
            { name: "Notes", value: data.review_notes || "No notes", inline: false }
          ],
          timestamp: new Date().toISOString(),
          footer: { text: "FiveM Server Admin Panel" }
        }
        content = `📝 **Application ${data.action}** by **${data.admin_user}** for **${data.steam_name}**`
        break

      case 'rule_change':
        const actionEmoji = data.action === 'rule_created' ? '➕' : data.action === 'rule_updated' ? '✏️' : '🗑️';
        const actionColor = data.action === 'rule_created' ? 0x27ae60 : data.action === 'rule_updated' ? 0xf39c12 : 0xe74c3c;
        
        embed = {
          title: `${actionEmoji} Rule ${data.action?.replace('rule_', '').replace('_', ' ').toUpperCase()}`,
          color: actionColor,
          fields: [
            { name: "Action", value: data.action?.replace('rule_', '').replace('_', ' ') || "Unknown", inline: true },
            { name: "Admin", value: data.admin || "Unknown", inline: true },
            { name: "Rule Title", value: data.rule?.title || "Unknown", inline: false },
            { name: "Category", value: data.rule?.category || "No category", inline: true },
            { name: "Description", value: data.rule?.description?.substring(0, 200) + (data.rule?.description?.length > 200 ? '...' : '') || "No description", inline: false }
          ],
          timestamp: new Date().toISOString(),
          footer: { text: "FiveM Server Admin Panel" }
        }
        content = `📋 **Rule ${data.action?.replace('rule_', '')}** by **${data.admin}**: "${data.rule?.title || 'Unknown Rule'}"`
        break

      case 'application_action':
        const appActionEmoji = data.action === 'approved' ? '✅' : data.action === 'denied' ? '❌' : '🔍';
        const appActionColor = data.action === 'approved' ? 0x27ae60 : data.action === 'denied' ? 0xe74c3c : 0xf39c12;
        
        embed = {
          title: `${appActionEmoji} Admin Application Action`,
          color: appActionColor,
          fields: [
            { name: "Action", value: data.action?.toUpperCase() || "Unknown", inline: true },
            { name: "Admin", value: data.admin || "Unknown", inline: true },
            { name: "Steam Name", value: data.steam_name || "Unknown", inline: true },
            { name: "Discord Tag", value: data.discord_tag || "Unknown", inline: true },
            { name: "FiveM Name", value: data.fivem_name || "Unknown", inline: true },
            { name: "Review Notes", value: data.review_notes || "No notes provided", inline: false }
          ],
          timestamp: new Date().toISOString(),
          footer: { text: "FiveM Server Admin Panel" }
        }
        content = `👨‍💼 **Admin ${data.action}** application for **${data.steam_name || 'Unknown'}** by **${data.admin}**`
        break

      default:
        console.log("Unknown Discord log type:", type)
        return new Response(
          JSON.stringify({ success: false, error: "Unknown log type" }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

    // Send to Discord
    const discordPayload = {
      content: content,
      embeds: [embed]
    }

    console.log("Sending to Discord webhook:", webhookUrl)
    console.log("Discord payload:", JSON.stringify(discordPayload, null, 2))

    const discordResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(discordPayload)
    })

    if (!discordResponse.ok) {
      const errorText = await discordResponse.text()
      console.error("Discord webhook error:", discordResponse.status, errorText)
      throw new Error(`Discord webhook failed: ${discordResponse.status} - ${errorText}`)
    }

    console.log("Discord message sent successfully")

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error("Discord logger error:", error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})