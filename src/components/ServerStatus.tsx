import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Server, Globe, Activity, Wifi, WifiOff, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ServerData {
  id: string;
  name: string;
  hostname: string;
  ip_address: string;
  port: number;
  gametype: string;
  mapname: string;
  display_ip: string;
  discord_url: string;
  max_players: number;
  cfx_server_code: string;
  is_active: boolean;
}

interface CFXLiveStats {
  clients: number;
  sv_maxclients: number;
}

interface ServerStatusProps {
  showTitle?: boolean;
}

const ServerStatus = ({ showTitle = true }: ServerStatusProps) => {
  const { t } = useTranslation();
  const [servers, setServers] = useState<ServerData[]>([]);
  const [liveStats, setLiveStats] = useState<Record<string, CFXLiveStats>>({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchServers();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('servers-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'servers' }, fetchServers)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (servers.length > 0) {
      fetchLiveStats();
      const interval = setInterval(fetchLiveStats, 60000); // Update every minute
      return () => clearInterval(interval);
    }
  }, [servers]);

  const fetchServers = async () => {
    try {
      const { data, error } = await supabase
        .from('servers')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setServers(data || []);
    } catch (error) {
      console.error('Error fetching servers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLiveStats = async () => {
    const newStats: Record<string, CFXLiveStats> = {};
    
    for (const server of servers) {
      if (server.cfx_server_code) {
        try {
          const response = await fetch(
            `https://servers-frontend.fivem.net/api/servers/single/${server.cfx_server_code}`
          );
          
          if (response.ok) {
            const data = await response.json();
            if (data?.Data) {
              newStats[server.id] = {
                clients: data.Data.clients || 0,
                sv_maxclients: data.Data.sv_maxclients || server.max_players
              };
            }
          }
        } catch (error) {
          console.error(`Error fetching live stats for ${server.name}:`, error);
        }
      }
    }
    
    setLiveStats(newStats);
  };

  const handleRefreshStats = async () => {
    try {
      await fetchLiveStats();
      toast({
        title: t('common.success'),
        description: t('server_status.stats_refreshed'),
      });
    } catch (error) {
      console.error("Error refreshing stats:", error);
      toast({
        title: t('common.error'), 
        description: t('server_status.stats_refresh_failed'),
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (server: ServerData, playersOnline: number, hasStats: boolean) => {
    // If no CFX code and no way to verify, show unknown status
    if (!server.cfx_server_code) {
      return (
        <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">
          {t('server_status.status_unknown')}
        </Badge>
      );
    }

    // If CFX code exists but no stats received, server is offline
    if (!hasStats) {
      return (
        <Badge className="bg-red-500/20 text-red-500 border-red-500/30">
          {t('server_status.status_offline')}
        </Badge>
      );
    }

    // If we have stats and players online, server is active
    if (playersOnline > 0) {
      return (
        <Badge className="bg-neon-green/20 text-neon-green border-neon-green/30">
          {t('server_status.status_active')}
        </Badge>
      );
    }
    
    // If we have stats but no players, server is online but empty
    return (
      <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">
        {t('server_status.status_online')}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {showTitle && (
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground font-orbitron">{t('server_status.title')}</h2>
          </div>
        )}
        <div className="grid gap-4">
          {[...Array(1)].map((_, i) => (
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

  if (servers.length === 0) {
    return (
      <Card className="p-8 bg-gaming-card/50 border-gaming-border text-center">
        <Server className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-muted-foreground mb-2">{t('server_status.no_servers_configured')}</h3>
        <p className="text-sm text-muted-foreground">
          {t('server_status.configure_servers_description')}
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
            <h2 className="text-2xl font-bold text-foreground font-orbitron">{t('server_status.title')}</h2>
          </div>
          <Button
            onClick={handleRefreshStats}
            variant="outline"
            size="sm"
            className="border-neon-teal/30 hover:border-neon-teal"
          >
            <Activity className="h-4 w-4 mr-2" />
            {t('server_status.refresh_stats')}
          </Button>
        </div>
      )}

      <div className="grid gap-6">
        {servers.map((server) => {
          const live = liveStats[server.id];
          const playersOnline = live?.clients || 0;
          const maxPlayers = live?.sv_maxclients || server.max_players;
          const hasStats = !!live;

          return (
            <Card key={server.id} className="p-6 bg-gaming-card/90 backdrop-blur-sm border-2 border-gaming-border hover:border-neon-teal/50 transition-all duration-300 hover:shadow-lg hover:shadow-neon-teal/20">
              <div className="space-y-4">
                {/* Server Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {hasStats || server.cfx_server_code ? (
                      <Wifi className="h-4 w-4 text-neon-green" />
                    ) : (
                      <WifiOff className="h-4 w-4 text-gray-400" />
                    )}
                    <div>
                      <h3 className="text-xl font-semibold text-foreground font-orbitron">
                        {server.hostname || server.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {t('server_status.fivem_server')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(server, playersOnline, hasStats)}
                    <span className="text-xs text-muted-foreground">
                      {t('server_status.updated')}: {new Date().toLocaleTimeString()}
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
                        {playersOnline}/{maxPlayers}
                      </p>
                      <p className="text-xs text-muted-foreground">{t('server_status.players')}</p>
                    </div>
                  </div>

                  {/* Gametype */}
                  <div className="flex items-center space-x-3 p-3 bg-gaming-darker/50 rounded-lg border border-gaming-border/50">
                    <Zap className="h-6 w-6 text-neon-blue" />
                    <div>
                      <p className="text-lg font-semibold text-foreground truncate">
                        {server.gametype}
                      </p>
                      <p className="text-xs text-muted-foreground">{t('server_status.gametype')}</p>
                    </div>
                  </div>

                  {/* Map */}
                  <div className="flex items-center space-x-3 p-3 bg-gaming-darker/50 rounded-lg border border-gaming-border/50">
                    <Globe className="h-6 w-6 text-neon-purple" />
                    <div>
                      <p className="text-lg font-semibold text-foreground truncate">
                        {server.mapname}
                      </p>
                      <p className="text-xs text-muted-foreground">{t('server_status.map')}</p>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="flex items-center space-x-3 p-3 bg-gaming-darker/50 rounded-lg border border-gaming-border/50">
                    <Activity className={`h-6 w-6 ${hasStats ? 'text-neon-green' : 'text-red-500'}`} />
                    <div>
                      <p className="text-lg font-semibold text-foreground">
                        {!server.cfx_server_code ? t('server_status.unknown') : hasStats ? t('common.online') : t('common.offline')}
                      </p>
                      <p className="text-xs text-muted-foreground">{t('server_status.status')}</p>
                    </div>
                  </div>
                </div>

                {/* Player Capacity Bar - Only show if we have stats */}
                {hasStats && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>{t('server_status.server_capacity')}</span>
                      <span>
                        {Math.round((playersOnline / maxPlayers) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-gaming-dark rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-neon-green to-neon-teal h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${(playersOnline / maxPlayers) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Server Connection Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gaming-border/30">
                  <div className="flex items-center justify-between p-3 bg-gaming-darker/30 rounded-lg">
                    <span className="text-sm text-muted-foreground">{t('server_status.server_ip')}:</span>
                    <code className="text-sm bg-gaming-dark px-2 py-1 rounded text-neon-teal border border-neon-teal/30">
                      {server.display_ip || `${server.ip_address}:${server.port}`}
                    </code>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gaming-darker/30 rounded-lg">
                    <span className="text-sm text-muted-foreground">{t('server_status.status')}:</span>
                    {!server.cfx_server_code ? (
                      <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">
                        {t('server_status.unknown').toUpperCase()}
                      </Badge>
                    ) : hasStats ? (
                      <Badge className="bg-neon-green/20 text-neon-green border-neon-green/30">
                        {t('common.online').toUpperCase()}
                      </Badge>
                    ) : (
                      <Badge className="bg-red-500/20 text-red-500 border-red-500/30">
                        {t('common.offline').toUpperCase()}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Auto-refresh indicator */}
      {servers.some(s => s.cfx_server_code) && (
        <div className="flex items-center justify-center text-xs text-muted-foreground">
          <Activity className="h-3 w-3 mr-1 animate-pulse" />
          {t('server_status.auto_refresh')}
        </div>
      )}
    </div>
  );
};

export default ServerStatus;
