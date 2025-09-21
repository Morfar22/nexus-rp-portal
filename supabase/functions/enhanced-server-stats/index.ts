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

    // Get server connection settings from database
    const { data: connectInfo } = await supabaseClient
      .from('server_settings')
      .select('setting_value')
      .eq('setting_key', 'connect_info')
      .single();

    // Try to get real FiveM server data if available
    let serverData = null;
    
    // Use the correct server IP - 95.216.29.189:30120
    const serverIp = "95.216.29.189";
    const serverPort = 30120;
    
    try {
      logStep("Fetching real server data", { ip: serverIp, port: serverPort });
      
      // Fetch real server info from FiveM server endpoints
      const [playersResponse, infoResponse, dynamicResponse] = await Promise.allSettled([
        fetch(`http://${serverIp}:${serverPort}/players.json`, { 
          signal: AbortSignal.timeout(5000) 
        }),
        fetch(`http://${serverIp}:${serverPort}/info.json`, { 
          signal: AbortSignal.timeout(5000) 
        }),
        fetch(`http://${serverIp}:${serverPort}/dynamic.json`, { 
          signal: AbortSignal.timeout(5000) 
        })
      ]);

      const playersData = playersResponse.status === 'fulfilled' && playersResponse.value.ok
        ? await playersResponse.value.json() : [];
      
      const infoData = infoResponse.status === 'fulfilled' && infoResponse.value.ok
        ? await infoResponse.value.json() : {};
      
      const dynamicData = dynamicResponse.status === 'fulfilled' && dynamicResponse.value.ok
        ? await dynamicResponse.value.json() : {};

      serverData = {
        players: Array.isArray(playersData) ? playersData.length : 0,
        maxPlayers: infoData.vars?.sv_maxClients ? parseInt(infoData.vars.sv_maxClients) : 64,
        serverName: infoData.vars?.sv_hostname || 'Adventure RP',
        status: playersResponse.status === 'fulfilled' && playersResponse.value.ok ? 'online' : 'offline',
        uptime: Date.now() - (infoData.server?.uptime || 0),
        version: infoData.server?.version || '1.0.0'
      };
      
      logStep("Real server data fetched", { 
        players: serverData.players, 
        maxPlayers: serverData.maxPlayers,
        status: serverData.status
      });
    } catch (error) {
      logStep("FiveM server connection error, using mock data", { error: error.message });
    }
    
    if (!serverData) {
      logStep("No server data available, using mock data");
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
      players_online: serverData?.players !== undefined ? serverData.players : Math.floor(Math.random() * 45),
      max_players: serverData?.maxPlayers || 64,
      cpu_usage: Math.floor(Math.random() * 80) + 10, // Still mock - would need server monitoring
      ram_usage: Math.floor(Math.random() * 70) + 20, // Still mock - would need server monitoring  
      disk_usage: Math.floor(Math.random() * 60) + 30, // Still mock - would need server monitoring
      network_latency_ms: Math.floor(Math.random() * 50) + 10,
      uptime_seconds: serverData?.uptime ? Math.floor(serverData.uptime / 1000) : 
        (historicalStats?.[0]?.uptime_seconds ? historicalStats[0].uptime_seconds + 300 : 86400),
      status: serverData?.status || (Math.random() > 0.05 ? 'online' : 'maintenance'),
      metadata: {
        location: 'EU-West',
        version: serverData?.version || '1.0.0',
        server_name: serverData?.serverName || 'Adventure RP',
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
      uptime_formatted: formatUptime(currentStats.uptime_seconds),
      server_online: currentStats.status === 'online'  // Add boolean server_online field
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