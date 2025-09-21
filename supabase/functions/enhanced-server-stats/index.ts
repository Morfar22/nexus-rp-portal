import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ENHANCED-SERVER-STATS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { server_id } = await req.json();
    const serverName = server_id || 'main';
    
    logStep("Fetching server stats", { serverName });

    // Try to get real FiveM server data if available
    let serverData = null;
    const fivemToken = Deno.env.get("FIVEM_API_TOKEN");
    
    if (fivemToken) {
      try {
        // This would be the actual FiveM server endpoint
        // const response = await fetch(`https://servers-frontend.fivem.net/api/servers/single/${serverName}`, {
        //   headers: { Authorization: `Bearer ${fivemToken}` }
        // });
        // serverData = await response.json();
        logStep("FiveM API not implemented, using mock data");
      } catch (error) {
        logStep("FiveM API error, falling back to mock data", { error: error.message });
      }
    }

    // Get historical data from our database
    const { data: historicalStats } = await supabaseClient
      .from('server_performance_metrics')
      .select('*')
      .eq('server_name', serverName)
      .order('recorded_at', { ascending: false })
      .limit(10);

    // Generate or use real server stats
    const currentStats = {
      server_name: serverName,
      players_online: serverData?.players || Math.floor(Math.random() * 45),
      max_players: serverData?.maxPlayers || 64,
      cpu_usage: Math.floor(Math.random() * 80) + 10,
      ram_usage: Math.floor(Math.random() * 70) + 20,
      disk_usage: Math.floor(Math.random() * 60) + 30,
      network_latency_ms: Math.floor(Math.random() * 50) + 10,
      uptime_seconds: historicalStats?.[0]?.uptime_seconds ? 
        historicalStats[0].uptime_seconds + 300 : 86400,
      status: Math.random() > 0.05 ? 'online' : 'maintenance',
      metadata: {
        location: 'EU-West',
        version: '1.0.0',
        last_restart: new Date(Date.now() - Math.floor(Math.random() * 24 * 60 * 60 * 1000)).toISOString()
      }
    };

    // Store the new stats
    await supabaseClient.from('server_performance_metrics').insert(currentStats);

    // Calculate uptime percentage
    const uptimePercentage = historicalStats && historicalStats.length > 0 ? 
      (historicalStats.filter(s => s.status === 'online').length / historicalStats.length) * 100 : 99.9;

    const responseData = {
      ...currentStats,
      uptime_percentage: Math.round(uptimePercentage * 10) / 10,
      historical_data: historicalStats,
      response_time: Math.floor(Math.random() * 50) + 10,
      uptime_formatted: formatUptime(currentStats.uptime_seconds)
    };

    logStep("Stats generated", { players: currentStats.players_online, status: currentStats.status });

    return new Response(JSON.stringify({
      success: true,
      data: responseData
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / (24 * 60 * 60));
  const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((seconds % (60 * 60)) / 60);
  
  if (days > 0) {
    return `${days}d ${hours}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}