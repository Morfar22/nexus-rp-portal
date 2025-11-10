import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Server, Clock, Zap, Globe, Activity, Wifi, WifiOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CFXServerStats {
  hostname: string;
  clients: number;
  sv_maxclients: number;
  players: any[];
  gametype: string;
  mapname: string;
  server: string;
  connectEndPoint: string;
}

interface ServerData {
  hostname: string;
  connectEndPoint: string;
  stats: {
    players_online: number;
    max_players: number;
    server_online: boolean;
    gametype: string;
    mapname: string;
    last_updated: string;
  };
}

interface ServerDashboardProps {
  showTitle?: boolean;
  compactMode?: boolean;
}

const ServerDashboard = ({ showTitle = true, compactMode = false }: ServerDashboardProps) => {
  const [serverData, setServerData] = useState<ServerData | null>(null);
  const [serverInfo, setServerInfo] = useState({
    displayIp: 'connect adventure-rp.com',
    discordUrl: 'https://discord.gg/adventure-rp',
    status: 'online'
  });
  const [cfxServerCode, setCfxServerCode] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchCFXSettings();
    fetchServerInfo();
  }, []);

  useEffect(() => {
    if (cfxServerCode) {
      fetchServerStats();
      const interval = setInterval(fetchServerStats, 60000); // Update every minute
      return () => clearInterval(interval);
    }
  }, [cfxServerCode]);

  const fetchCFXSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('server_settings')
        .select('setting_value')
        .eq('setting_key', 'cfxre_server_code')
        .maybeSingle();

      if (error) throw error;
      if (data?.setting_value) {
        setCfxServerCode(String(data.setting_value));
      }
    } catch (error) {
      console.error('Error fetching CFX settings:', error);
    }
  };

  const fetchServerStats = async () => {
    if (!cfxServerCode) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `https://servers-frontend.fivem.net/api/servers/single/${cfxServerCode}`
      );

      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data?.Data) {
        const cfxData: CFXServerStats = data.Data;
        setServerData({
          hostname: cfxData.hostname,
          connectEndPoint: cfxData.connectEndPoint || '',
          stats: {
            players_online: cfxData.clients,
            max_players: cfxData.sv_maxclients,
            server_online: true,
            gametype: cfxData.gametype || 'N/A',
            mapname: cfxData.mapname || 'N/A',
            last_updated: new Date().toISOString(),
          }
        });
      }
    } catch (error) {
      console.error('Error fetching server stats:', error);
      setServerData(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchServerInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('server_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['server_display_ip', 'discord_url', 'server_status']);

      if (error) {
        console.error('Error fetching server info:', error);
        return;
      }

      if (data) {
        const settings: any = {};
        data.forEach(setting => {
          settings[setting.setting_key] = setting.setting_value;
        });

        setServerInfo({
          displayIp: settings.server_display_ip || 'connect adventure-rp.com',
          discordUrl: settings.discord_url || 'https://discord.gg/adventure-rp',
          status: settings.server_status || 'online'
        });
      }
    } catch (error) {
      console.error('Error fetching server info:', error);
    }
  };

  const handleRefreshStats = async () => {
    try {
      await fetchServerStats();
      await fetchServerInfo();
      
      toast({
        title: "Success",
        description: "Server stats refreshed successfully",
      });
    } catch (error) {
      console.error("Error refreshing stats:", error);
      toast({
        title: "Error", 
        description: "Failed to refresh server stats",
        variant: "destructive",
      });
    }
  };

  const getServerStatusIcon = (isOnline: boolean) => {
    return isOnline ? (
      <Wifi className="h-4 w-4 text-neon-green" />
    ) : (
      <WifiOff className="h-4 w-4 text-red-500" />
    );
  };

  const getStatusBadge = (isOnline: boolean, players: number) => {
    if (!isOnline) {
      return (
        <Badge className="bg-red-500/20 text-red-500 border-red-500/30">
          Offline
        </Badge>
      );
    }
    
    if (players > 0) {
      return (
        <Badge className="bg-neon-green/20 text-neon-green border-neon-green/30">
          Active
        </Badge>
      );
    }
    
    return (
      <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">
        Online
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {showTitle && (
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground font-orbitron">Server Status</h2>
          </div>
        )}
        <div className="grid gap-4">
          {[...Array(2)].map((_, i) => (
            <Card key={i} className="p-6 bg-gaming-card border-gaming-border animate-pulse">
              <div className="space-y-4">
                <div className="h-6 bg-gaming-dark rounded w-1/3" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[...Array(4)].map((_, j) => (
                    <div key={j} className="h-16 bg-gaming-dark rounded" />
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!cfxServerCode && !loading) {
    return (
      <Card className="p-8 bg-gaming-card/50 border-gaming-border text-center">
        <Server className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-muted-foreground mb-2">No CFX Server Configured</h3>
        <p className="text-sm text-muted-foreground">
          Configure your CFX.re server code in Server Management to display live statistics.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {showTitle && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Server className="h-6 w-6 text-neon-teal" />
            <h2 className="text-2xl font-bold text-foreground font-orbitron">Server Status</h2>
          </div>
          <Button
            onClick={handleRefreshStats}
            variant="outline"
            size="sm"
            className="border-neon-teal/30 hover:border-neon-teal"
          >
            <Activity className="h-4 w-4 mr-2" />
            Refresh Stats
          </Button>
        </div>
      )}

      <div className="grid gap-6">
        {serverData && (
          <Card className="p-6 bg-gaming-card/90 backdrop-blur-sm border-2 border-gaming-border hover:border-neon-teal/50 transition-all duration-300 hover:shadow-lg hover:shadow-neon-teal/20">
            <div className="space-y-4">
              {/* Server Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getServerStatusIcon(serverData.stats.server_online)}
                  <div>
                    <h3 className="text-xl font-semibold text-foreground font-orbitron">
                      {serverData.hostname}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {serverData.connectEndPoint || 'FiveM Server'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusBadge(serverData.stats.server_online, serverData.stats.players_online)}
                  <span className="text-xs text-muted-foreground">
                    Updated: {new Date(serverData.stats.last_updated).toLocaleTimeString()}
                  </span>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Players */}
                <div className="flex items-center space-x-3 p-3 bg-gaming-darker/50 rounded-lg border border-gaming-border/50">
                  <Users className="h-6 w-6 text-neon-green" />
                  <div>
                    <p className="text-lg font-semibold text-foreground">
                      {serverData.stats.players_online}/{serverData.stats.max_players}
                    </p>
                    <p className="text-xs text-muted-foreground">Players</p>
                  </div>
                </div>

                {/* Gametype */}
                <div className="flex items-center space-x-3 p-3 bg-gaming-darker/50 rounded-lg border border-gaming-border/50">
                  <Zap className="h-6 w-6 text-neon-blue" />
                  <div>
                    <p className="text-lg font-semibold text-foreground truncate">
                      {serverData.stats.gametype}
                    </p>
                    <p className="text-xs text-muted-foreground">Gametype</p>
                  </div>
                </div>

                {/* Map */}
                <div className="flex items-center space-x-3 p-3 bg-gaming-darker/50 rounded-lg border border-gaming-border/50">
                  <Globe className="h-6 w-6 text-neon-purple" />
                  <div>
                    <p className="text-lg font-semibold text-foreground truncate">
                      {serverData.stats.mapname}
                    </p>
                    <p className="text-xs text-muted-foreground">Map</p>
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center space-x-3 p-3 bg-gaming-darker/50 rounded-lg border border-gaming-border/50">
                  <Activity className="h-6 w-6 text-neon-green" />
                  <div>
                    <p className="text-lg font-semibold text-foreground">
                      Online
                    </p>
                    <p className="text-xs text-muted-foreground">Status</p>
                  </div>
                </div>
              </div>

              {/* Player Capacity Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Server Capacity</span>
                  <span>
                    {Math.round((serverData.stats.players_online / serverData.stats.max_players) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-gaming-dark rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-neon-green to-neon-teal h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${(serverData.stats.players_online / serverData.stats.max_players) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* Server Connection Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gaming-border/30">
                <div className="flex items-center justify-between p-3 bg-gaming-darker/30 rounded-lg">
                  <span className="text-sm text-muted-foreground">Server IP:</span>
                  <code className="text-sm bg-gaming-dark px-2 py-1 rounded text-neon-teal border border-neon-teal/30">
                    {serverInfo.displayIp}
                  </code>
                </div>
                <div className="flex items-center justify-between p-3 bg-gaming-darker/30 rounded-lg">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <Badge className={
                    serverInfo.status === 'online' ? 'bg-neon-green/20 text-neon-green border-neon-green/30' :
                    serverInfo.status === 'maintenance' ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30' :
                    'bg-red-500/20 text-red-500 border-red-500/30'
                  }>
                    {serverInfo.status.toUpperCase()}
                  </Badge>
                </div>
              </div>
            </div>
          </Card>
        )}

        {!serverData && !loading && (
          <Card className="p-8 bg-gaming-card/50 border-gaming-border text-center">
            <Server className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">No Server Data</h3>
            <p className="text-sm text-muted-foreground">
              Unable to fetch server statistics. Please check your CFX.re server code.
            </p>
          </Card>
        )}
      </div>

      {/* Auto-refresh indicator */}
      {cfxServerCode && (
        <div className="flex items-center justify-center text-xs text-muted-foreground">
          <Activity className="h-3 w-3 mr-1 animate-pulse" />
          Auto-refreshes every 60 seconds
        </div>
      )}
    </div>
  );
};

export default ServerDashboard;