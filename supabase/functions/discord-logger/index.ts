import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log("=== DISCORD LOGGER FUNCTION START ===")
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, data, settings } = await req.json()
    console.log("Discord logger request:", { type, data: !!data, settings: !!settings })

    // If no webhook URL provided, try to get it from the request or fail silently
    let webhookUrl = settings?.discordWebhookUrl;
    
    // For now, if no webhook URL is provided, just return success (silent fail)
    // In production, you might want to store this in a database table
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
        embed = {
          title: "🆕 New Application Submitted",
          color: 0x3498db, // Blue
          fields: [
            { name: "Steam Name", value: data.steam_name || "N/A", inline: true },
            { name: "Discord Tag", value: data.discord_tag || "N/A", inline: true },
            { name: "FiveM Name", value: data.fivem_name || "N/A", inline: true },
            { name: "Age", value: data.age?.toString() || "N/A", inline: true },
            { name: "Status", value: "Pending Review", inline: true }
          ],
          timestamp: new Date().toISOString(),
          footer: { text: "FiveM Server Application System" }
        }
        content = `📋 **New application received** from **${data.steam_name}**`
        break

      case 'application_approved':
        embed = {
          title: "✅ Application Approved",
          color: 0x27ae60, // Green
          fields: [
            { name: "Steam Name", value: data.steam_name || "N/A", inline: true },
            { name: "Discord Tag", value: data.discord_tag || "N/A", inline: true },
            { name: "FiveM Name", value: data.fivem_name || "N/A", inline: true },
            { name: "Review Notes", value: data.review_notes || "No notes provided", inline: false }
          ],
          timestamp: new Date().toISOString(),
          footer: { text: "FiveM Server Application System" }
        }
        content = `🎉 **Application approved** for **${data.steam_name}**! Welcome to the server!`
        break

      case 'application_rejected':
        embed = {
          title: "❌ Application Rejected",
          color: 0xe74c3c, // Red
          fields: [
            { name: "Steam Name", value: data.steam_name || "N/A", inline: true },
            { name: "Discord Tag", value: data.discord_tag || "N/A", inline: true },
            { name: "FiveM Name", value: data.fivem_name || "N/A", inline: true },
            { name: "Reason", value: data.review_notes || "No reason provided", inline: false }
          ],
          timestamp: new Date().toISOString(),
          footer: { text: "FiveM Server Application System" }
        }
        content = `🚫 **Application rejected** for **${data.steam_name}**`
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
        content = `👀 **Application under review** for **${data.steam_name}**`
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