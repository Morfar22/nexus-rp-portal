import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RefreshCw, Server, Users, Cpu, HardDrive, Wifi } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ServerStats {
  onlineUsers: number;
  maxUsers: number;
  cpuUsage: number;
  ramUsage: number;
  uptime: string;
  serverStatus: 'online' | 'offline' | 'maintenance';
  responseTime: number;
}

export const ServerPerformanceOverview = () => {
  const [stats, setStats] = useState<ServerStats>({
    onlineUsers: 0,
    maxUsers: 64,
    cpuUsage: 0,
    ramUsage: 0,
    uptime: "0h 0m",
    serverStatus: 'offline',
    responseTime: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchServerStats();
    const interval = setInterval(fetchServerStats, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchServerStats = async () => {
    try {
      // Fetch server stats from enhanced server stats edge function
      const { data, error } = await supabase.functions.invoke('enhanced-server-stats', {
        body: { server_id: 'main' }
      });

      if (error) throw error;

      if (data?.success && data.data) {
        const serverData = data.data;
        setStats({
          onlineUsers: serverData.players_online || 0,
          maxUsers: serverData.max_players || 64,
          cpuUsage: serverData.cpu_usage || 0,
          ramUsage: serverData.ram_usage || 0,
          uptime: serverData.uptime_formatted || "Unknown",
          serverStatus: serverData.status === 'online' ? 'online' : 
                       serverData.status === 'maintenance' ? 'maintenance' : 'offline',
          responseTime: serverData.response_time || 0
        });
      }
    } catch (error) {
      console.error('Error fetching server stats:', error);
      // Keep existing fallback data on error
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-emerald-400';
      case 'maintenance': return 'text-amber-400';
      case 'offline': return 'text-red-400';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'online': return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Online</Badge>;
      case 'maintenance': return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Maintenance</Badge>;
      case 'offline': return <Badge variant="destructive">Offline</Badge>;
      default: return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  return (
    <Card className="bg-gaming-card border-gaming-border">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Server className="h-5 w-5 text-neon-blue" />
            <span>Server Performance</span>
          </div>
          <button 
            onClick={fetchServerStats}
            className="p-1 hover:bg-gaming-dark rounded transition-colors"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''} text-muted-foreground`} />
          </button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Server Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Status</span>
          {getStatusBadge(stats.serverStatus)}
        </div>

        {/* Online Players */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-neon-green" />
              <span className="text-sm text-muted-foreground">Players Online</span>
            </div>
            <span className="font-medium text-foreground">{stats.onlineUsers}/{stats.maxUsers}</span>
          </div>
          <Progress value={(stats.onlineUsers / stats.maxUsers) * 100} className="h-2" />
        </div>

        {/* CPU Usage */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Cpu className="h-4 w-4 text-amber-400" />
              <span className="text-sm text-muted-foreground">CPU Usage</span>
            </div>
            <span className="font-medium text-foreground">{stats.cpuUsage}%</span>
          </div>
          <Progress value={stats.cpuUsage} className="h-2" />
        </div>

        {/* RAM Usage */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <HardDrive className="h-4 w-4 text-purple-400" />
              <span className="text-sm text-muted-foreground">RAM Usage</span>
            </div>
            <span className="font-medium text-foreground">{stats.ramUsage}%</span>
          </div>
          <Progress value={stats.ramUsage} className="h-2" />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gaming-border">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1 mb-1">
              <Wifi className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Response</span>
            </div>
            <p className="text-sm font-medium text-foreground">{stats.responseTime}ms</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1 mb-1">
              <Server className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Uptime</span>
            </div>
            <p className="text-sm font-medium text-foreground">{stats.uptime}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};