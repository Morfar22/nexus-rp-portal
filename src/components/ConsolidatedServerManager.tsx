import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Server, 
  Activity, 
  Users, 
  Clock, 
  Wifi, 
  Plus, 
  Edit, 
  Trash2, 
  RefreshCw,
  AlertCircle,
  CheckCircle,
  WifiOff,
  MonitorSpeaker,
  Settings,
  BarChart3
} from "lucide-react";

interface ServerData {
  id: string;
  name: string;
  ip_address: string;
  port: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ServerStats {
  id: string;
  server_id: string;
  players_online: number;
  max_players: number;
  queue_count: number;
  uptime_percentage: number;
  ping_ms: number;
  server_online: boolean;
  recorded_at: string;
}

interface ServerInfo {
  server_ip: string;
  auto_fetch_enabled: boolean;
  displayIp: string;
  discordUrl: string;
  status: string;
}

export default function ConsolidatedServerManager() {
  const [servers, setServers] = useState<ServerData[]>([]);
  const [serverStats, setServerStats] = useState<Record<string, ServerStats>>({});
  const [serverInfo, setServerInfo] = useState<ServerInfo>({
    server_ip: '',
    auto_fetch_enabled: false,
    displayIp: '',
    discordUrl: '',
    status: 'online'
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingServer, setEditingServer] = useState<ServerData | null>(null);
  const [newServer, setNewServer] = useState({ name: '', ip_address: '', port: 30120, is_active: true });
  const { toast } = useToast();

  useEffect(() => {
    fetchServers();
    fetchServerInfo();
    
    // Set up real-time subscriptions
    const serverChannel = supabase
      .channel('servers-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'servers' }, fetchServers)
      .subscribe();

    const statsChannel = supabase
      .channel('server-stats-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'individual_server_stats' }, fetchServerStats)
      .subscribe();

    // Set up interval for live updates every 5 seconds
    const interval = setInterval(() => {
      fetchServerStats();
    }, 5000);

    return () => {
      supabase.removeChannel(serverChannel);
      supabase.removeChannel(statsChannel);
      clearInterval(interval);
    };
  }, []);

  const fetchServers = async () => {
    try {
      const { data, error } = await supabase
        .from('servers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setServers(data || []);
      
      if (data && data.length > 0) {
        fetchServerStats();
      }
    } catch (error) {
      console.error('Error fetching servers:', error);
      toast({
        title: "Error",
        description: "Failed to fetch servers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchServerStats = async () => {
    try {
      const { data, error } = await supabase
        .from('individual_server_stats')
        .select('*')
        .order('recorded_at', { ascending: false });

      if (error) throw error;

      // Group stats by server_id and keep only the latest
      const latestStats: Record<string, ServerStats> = {};
      data?.forEach(stat => {
        if (!latestStats[stat.server_id] || new Date(stat.recorded_at) > new Date(latestStats[stat.server_id].recorded_at)) {
          latestStats[stat.server_id] = stat;
        }
      });

      setServerStats(latestStats);
    } catch (error) {
      console.error('Error fetching server stats:', error);
    }
  };

  const fetchServerInfo = async () => {
    try {
      const [serverIpResult, autoFetchResult, displayIpResult, discordUrlResult, statusResult] = await Promise.all([
        supabase.from('server_settings').select('setting_value').eq('setting_key', 'server_ip').maybeSingle(),
        supabase.from('server_settings').select('setting_value').eq('setting_key', 'auto_fetch_enabled').maybeSingle(),
        supabase.from('server_settings').select('setting_value').eq('setting_key', 'display_ip').maybeSingle(),
        supabase.from('server_settings').select('setting_value').eq('setting_key', 'discord_url').maybeSingle(),
        supabase.from('server_settings').select('setting_value').eq('setting_key', 'server_status').maybeSingle()
      ]);

      setServerInfo({
        server_ip: (serverIpResult.data?.setting_value as string) || '',
        auto_fetch_enabled: (autoFetchResult.data?.setting_value as boolean) || false,
        displayIp: (displayIpResult.data?.setting_value as string) || '',
        discordUrl: (discordUrlResult.data?.setting_value as string) || '',
        status: (statusResult.data?.setting_value as string) || 'online'
      });
    } catch (error) {
      console.error('Error fetching server info:', error);
    }
  };

  const handleSaveServer = async () => {
    try {
      const serverData = editingServer
        ? { ...editingServer, ...newServer }
        : { ...newServer, id: crypto.randomUUID() };

      if (editingServer) {
        const { error } = await supabase
          .from('servers')
          .update(serverData)
          .eq('id', editingServer.id);
        
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Server updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('servers')
          .insert([serverData]);
        
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Server added successfully",
        });
      }

      setIsDialogOpen(false);
      setEditingServer(null);
      setNewServer({ name: '', ip_address: '', port: 30120, is_active: true });
      fetchServers();
    } catch (error) {
      console.error('Error saving server:', error);
      toast({
        title: "Error",
        description: "Failed to save server",
        variant: "destructive",
      });
    }
  };

  const handleDeleteServer = async (serverId: string) => {
    try {
      const { error } = await supabase
        .from('servers')
        .delete()
        .eq('id', serverId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Server deleted successfully",
      });
      fetchServers();
    } catch (error) {
      console.error('Error deleting server:', error);
      toast({
        title: "Error",
        description: "Failed to delete server",
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (server: ServerData) => {
    try {
      const { error } = await supabase
        .from('servers')
        .update({ is_active: !server.is_active })
        .eq('id', server.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Server ${!server.is_active ? 'activated' : 'deactivated'}`,
      });
      fetchServers();
    } catch (error) {
      console.error('Error toggling server status:', error);
      toast({
        title: "Error",
        description: "Failed to update server status",
        variant: "destructive",
      });
    }
  };

  const refreshAllStats = async () => {
    setRefreshing(true);
    try {
      const { error } = await supabase.functions.invoke('update-all-server-stats');
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Server stats refreshed successfully",
      });
      
      setTimeout(fetchServerStats, 2000);
    } catch (error) {
      console.error('Error refreshing stats:', error);
      toast({
        title: "Error", 
        description: "Failed to refresh server stats",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const saveServerSettings = async () => {
    try {
      const updates = [
        { key: 'server_ip', value: serverInfo.server_ip },
        { key: 'auto_fetch_enabled', value: serverInfo.auto_fetch_enabled },
        { key: 'display_ip', value: serverInfo.displayIp },
        { key: 'discord_url', value: serverInfo.discordUrl },
        { key: 'server_status', value: serverInfo.status }
      ];

      for (const update of updates) {
        const { data: existing } = await supabase
          .from('server_settings')
          .select('id')
          .eq('setting_key', update.key)
          .maybeSingle();

        if (existing) {
          await supabase
            .from('server_settings')
            .update({ setting_value: update.value, updated_at: new Date().toISOString() })
            .eq('setting_key', update.key);
        } else {
          await supabase
            .from('server_settings')
            .insert({
              setting_key: update.key,
              setting_value: update.value,
              created_by: (await supabase.auth.getUser()).data.user?.id
            });
        }
      }

      toast({
        title: "Success",
        description: "Server settings saved successfully",
      });
    } catch (error) {
      console.error('Error saving server settings:', error);
      toast({
        title: "Error",
        description: "Failed to save server settings",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (server: ServerData) => {
    setEditingServer(server);
    setNewServer({
      name: server.name,
      ip_address: server.ip_address,
      port: server.port,
      is_active: server.is_active
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingServer(null);
    setNewServer({ name: '', ip_address: '', port: 30120, is_active: true });
    setIsDialogOpen(true);
  };

  const getStatusColor = (online: boolean) => {
    return online ? "text-green-500" : "text-red-500";
  };

  const getPingColor = (ping: number) => {
    if (ping < 50) return "text-green-500";
    if (ping < 100) return "text-yellow-500";
    return "text-red-500";
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-6 bg-muted rounded w-1/3 mb-4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded w-1/2"></div>
                <div className="h-4 bg-muted rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Server Configuration */}
      <Card className="bg-gaming-card border-gaming-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Server Configuration
          </CardTitle>
          <CardDescription>Configure your main server settings and information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="server_ip">Server IP</Label>
              <Input
                id="server_ip"
                value={serverInfo.server_ip}
                onChange={(e) => setServerInfo({ ...serverInfo, server_ip: e.target.value })}
                placeholder="192.168.1.100"
              />
            </div>
            <div>
              <Label htmlFor="display_ip">Display IP</Label>
              <Input
                id="display_ip"
                value={serverInfo.displayIp}
                onChange={(e) => setServerInfo({ ...serverInfo, displayIp: e.target.value })}
                placeholder="connect server.example.com"
              />
            </div>
            <div>
              <Label htmlFor="discord_url">Discord URL</Label>
              <Input
                id="discord_url"
                value={serverInfo.discordUrl}
                onChange={(e) => setServerInfo({ ...serverInfo, discordUrl: e.target.value })}
                placeholder="https://discord.gg/your-server"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={serverInfo.auto_fetch_enabled}
                onCheckedChange={(checked) => setServerInfo({ ...serverInfo, auto_fetch_enabled: checked })}
              />
              <Label>Auto-fetch Stats</Label>
            </div>
          </div>
          <Button onClick={saveServerSettings}>Save Configuration</Button>
        </CardContent>
      </Card>

      {/* Live Server Management */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Live Server Management</h2>
          <p className="text-muted-foreground">Monitor and manage your FiveM servers in real-time</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={refreshAllStats} 
            disabled={refreshing}
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh All
          </Button>
          <Button onClick={openCreateDialog} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Server
          </Button>
        </div>
      </div>

      {servers.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <MonitorSpeaker className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No servers configured</h3>
            <p className="text-muted-foreground mb-4">Add your first server to start monitoring</p>
            <Button onClick={openCreateDialog} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Server
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {servers.map((server) => {
            const stats = serverStats[server.id];
            return (
              <Card key={server.id} className="bg-gaming-card border-gaming-border">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-foreground">
                        <Server className="h-5 w-5" />
                        {server.name}
                        {!server.is_active && <Badge variant="secondary">Inactive</Badge>}
                      </CardTitle>
                      <CardDescription>
                        {server.ip_address}:{server.port}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        {stats?.server_online ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <WifiOff className="h-4 w-4 text-red-500" />
                        )}
                        <span className={`text-sm font-medium ${getStatusColor(stats?.server_online || false)}`}>
                          {stats?.server_online ? 'Online' : 'Offline'}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {stats ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-blue-500" />
                        <div>
                          <p className="text-sm text-muted-foreground">Players</p>
                          <p className="font-semibold text-foreground">
                            {stats.players_online}/{stats.max_players}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-purple-500" />
                        <div>
                          <p className="text-sm text-muted-foreground">Queue</p>
                          <p className="font-semibold text-foreground">{stats.queue_count}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-green-500" />
                        <div>
                          <p className="text-sm text-muted-foreground">Uptime</p>
                          <p className="font-semibold text-foreground">{stats.uptime_percentage.toFixed(1)}%</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Wifi className="h-4 w-4 text-yellow-500" />
                        <div>
                          <p className="text-sm text-muted-foreground">Ping</p>
                          <p className={`font-semibold ${getPingColor(stats.ping_ms)}`}>
                            {stats.ping_ms}ms
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-center">
                        <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-muted-foreground">No stats available</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between pt-4 border-t border-gaming-border">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={server.is_active}
                        onCheckedChange={() => handleToggleActive(server)}
                      />
                      <span className="text-sm text-muted-foreground">
                        {server.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(server)}
                        className="gap-1"
                      >
                        <Edit className="h-3 w-3" />
                        Edit
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm" className="gap-1">
                            <Trash2 className="h-3 w-3" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Server</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{server.name}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteServer(server.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingServer ? 'Edit Server' : 'Add New Server'}
            </DialogTitle>
            <DialogDescription>
              Configure your FiveM server details for monitoring
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Server Name</Label>
              <Input
                id="name"
                value={newServer.name}
                onChange={(e) => setNewServer({ ...newServer, name: e.target.value })}
                placeholder="My FiveM Server"
              />
            </div>
            
            <div>
              <Label htmlFor="ip">IP Address</Label>
              <Input
                id="ip"
                value={newServer.ip_address}
                onChange={(e) => setNewServer({ ...newServer, ip_address: e.target.value })}
                placeholder="192.168.1.100"
              />
            </div>
            
            <div>
              <Label htmlFor="port">Port</Label>
              <Input
                id="port"
                type="number"
                value={newServer.port}
                onChange={(e) => setNewServer({ ...newServer, port: parseInt(e.target.value) || 30120 })}
                placeholder="30120"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                checked={newServer.is_active}
                onCheckedChange={(checked) => setNewServer({ ...newServer, is_active: checked })}
              />
              <Label>Active</Label>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveServer}>
              {editingServer ? 'Update' : 'Add'} Server
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
