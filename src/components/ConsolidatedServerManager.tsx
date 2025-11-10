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
import CFXServerSettings from "@/components/CFXServerSettings";

interface ServerData {
  id: string;
  name: string;
  ip_address: string;
  port: number;
  is_active: boolean;
  hostname?: string;
  gametype?: string;
  mapname?: string;
  display_ip?: string;
  discord_url?: string;
  max_players?: number;
  cfx_server_code?: string;
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


export default function ConsolidatedServerManager() {
  const [servers, setServers] = useState<ServerData[]>([]);
  const [serverStats, setServerStats] = useState<Record<string, ServerStats>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingServer, setEditingServer] = useState<ServerData | null>(null);
  const [newServer, setNewServer] = useState({ 
    name: '', 
    ip_address: '', 
    port: 30120, 
    is_active: true,
    hostname: '',
    gametype: 'N/A',
    mapname: 'N/A',
    display_ip: '',
    discord_url: '',
    max_players: 48,
    cfx_server_code: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchServers();
    
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
      setNewServer({ 
        name: '', 
        ip_address: '', 
        port: 30120, 
        is_active: true,
        hostname: '',
        gametype: 'N/A',
        mapname: 'N/A',
        display_ip: '',
        discord_url: '',
        max_players: 48,
        cfx_server_code: ''
      });
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


  const openEditDialog = (server: ServerData) => {
    setEditingServer(server);
    setNewServer({ 
      name: server.name, 
      ip_address: server.ip_address, 
      port: server.port,
      is_active: server.is_active,
      hostname: server.hostname || '',
      gametype: server.gametype || 'N/A',
      mapname: server.mapname || 'N/A',
      display_ip: server.display_ip || '',
      discord_url: server.discord_url || '',
      max_players: server.max_players || 48,
      cfx_server_code: server.cfx_server_code || ''
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingServer(null);
    setNewServer({ 
      name: '', 
      ip_address: '', 
      port: 30120, 
      is_active: true,
      hostname: '',
      gametype: 'N/A',
      mapname: 'N/A',
      display_ip: '',
      discord_url: '',
      max_players: 48,
      cfx_server_code: ''
    });
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
      {/* CFX.re Server Settings */}
      <CFXServerSettings />

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
          
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">Basic Information</h3>
              
              <div>
                <Label htmlFor="name">Internal Server Name</Label>
                <Input
                  id="name"
                  value={newServer.name}
                  onChange={(e) => setNewServer({ ...newServer, name: e.target.value })}
                  placeholder="My FiveM Server"
                  className="bg-gaming-dark border-gaming-border"
                />
                <p className="text-xs text-muted-foreground mt-1">Used for internal identification</p>
              </div>
              
              <div>
                <Label htmlFor="hostname">Display Name (Hostname)</Label>
                <Input
                  id="hostname"
                  value={newServer.hostname}
                  onChange={(e) => setNewServer({ ...newServer, hostname: e.target.value })}
                  placeholder="change-me built with Obox Project by The Community!"
                  className="bg-gaming-dark border-gaming-border"
                />
                <p className="text-xs text-muted-foreground mt-1">This is shown to users on the website</p>
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t border-gaming-border">
              <h3 className="text-sm font-semibold text-foreground">Connection Details</h3>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="ip">IP Address</Label>
                  <Input
                    id="ip"
                    value={newServer.ip_address}
                    onChange={(e) => setNewServer({ ...newServer, ip_address: e.target.value })}
                    placeholder="192.168.1.100"
                    className="bg-gaming-dark border-gaming-border"
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
                    className="bg-gaming-dark border-gaming-border"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="display_ip">Display Connection String</Label>
                <Input
                  id="display_ip"
                  value={newServer.display_ip}
                  onChange={(e) => setNewServer({ ...newServer, display_ip: e.target.value })}
                  placeholder="connect panel.adventurerp.dk:30120"
                  className="bg-gaming-dark border-gaming-border"
                />
                <p className="text-xs text-muted-foreground mt-1">Connection string shown to users</p>
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t border-gaming-border">
              <h3 className="text-sm font-semibold text-foreground">Server Information</h3>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="gametype">Gametype</Label>
                  <Input
                    id="gametype"
                    value={newServer.gametype}
                    onChange={(e) => setNewServer({ ...newServer, gametype: e.target.value })}
                    placeholder="Roleplay"
                    className="bg-gaming-dark border-gaming-border"
                  />
                </div>
                
                <div>
                  <Label htmlFor="mapname">Map Name</Label>
                  <Input
                    id="mapname"
                    value={newServer.mapname}
                    onChange={(e) => setNewServer({ ...newServer, mapname: e.target.value })}
                    placeholder="Los Santos"
                    className="bg-gaming-dark border-gaming-border"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="max_players">Max Players</Label>
                <Input
                  id="max_players"
                  type="number"
                  value={newServer.max_players}
                  onChange={(e) => setNewServer({ ...newServer, max_players: parseInt(e.target.value) || 48 })}
                  placeholder="48"
                  className="bg-gaming-dark border-gaming-border"
                />
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t border-gaming-border">
              <h3 className="text-sm font-semibold text-foreground">Integration</h3>
              
              <div>
                <Label htmlFor="cfx_server_code">CFX.re Server Code (Optional)</Label>
                <Input
                  id="cfx_server_code"
                  value={newServer.cfx_server_code}
                  onChange={(e) => setNewServer({ ...newServer, cfx_server_code: e.target.value })}
                  placeholder="abc123"
                  className="bg-gaming-dark border-gaming-border"
                />
                <p className="text-xs text-muted-foreground mt-1">For auto-fetching live stats from CFX.re</p>
              </div>

              <div>
                <Label htmlFor="discord_url">Discord Invite URL</Label>
                <Input
                  id="discord_url"
                  value={newServer.discord_url}
                  onChange={(e) => setNewServer({ ...newServer, discord_url: e.target.value })}
                  placeholder="https://discord.gg/your-server"
                  className="bg-gaming-dark border-gaming-border"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2 pt-4 border-t border-gaming-border">
              <Switch
                checked={newServer.is_active}
                onCheckedChange={(checked) => setNewServer({ ...newServer, is_active: checked })}
              />
              <Label>Active Server</Label>
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
