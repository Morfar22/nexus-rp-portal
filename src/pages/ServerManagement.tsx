import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Server, Activity, Users, RefreshCw, Settings as SettingsIcon, Gamepad2, Globe, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Navbar from '@/components/Navbar';
import CFXServerSettings from '@/components/CFXServerSettings';

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

export default function ServerManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [serverStats, setServerStats] = useState<CFXServerStats | null>(null);
  const [cfxServerCode, setCfxServerCode] = useState('');
  const [autoFetch, setAutoFetch] = useState(true);
  const [displayIp, setDisplayIp] = useState('');
  const [discordUrl, setDiscordUrl] = useState('');
  const [isStaff, setIsStaff] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    const checkStaffRole = async () => {
      if (!user) {
        setIsStaff(false);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .rpc('is_staff', { check_user_uuid: user.id });

        if (error) {
          console.error('Error checking staff role:', error);
          setIsStaff(false);
        } else {
          setIsStaff(data);
        }
      } catch (error) {
        console.error('Error checking staff role:', error);
        setIsStaff(false);
      } finally {
        setLoading(false);
      }
    };

    checkStaffRole();
    fetchSettings();
  }, [user]);

  useEffect(() => {
    if (cfxServerCode && autoFetch) {
      fetchServerStats();
      const interval = setInterval(fetchServerStats, 60000); // Update every minute
      return () => clearInterval(interval);
    }
  }, [cfxServerCode, autoFetch]);

  const fetchSettings = async () => {
    try {
      // Fetch CFX server code
      const { data: cfxData } = await supabase
        .from('server_settings')
        .select('setting_value')
        .eq('setting_key', 'cfxre_server_code')
        .maybeSingle();

      if (cfxData?.setting_value) {
        setCfxServerCode(String(cfxData.setting_value));
      }

      // Fetch display IP
      const { data: ipData } = await supabase
        .from('server_settings')
        .select('setting_value')
        .eq('setting_key', 'server_display_ip')
        .maybeSingle();

      if (ipData?.setting_value) {
        setDisplayIp(String(ipData.setting_value));
      }

      // Fetch Discord URL
      const { data: discordData } = await supabase
        .from('server_settings')
        .select('setting_value')
        .eq('setting_key', 'discord_url')
        .maybeSingle();

      if (discordData?.setting_value) {
        setDiscordUrl(String(discordData.setting_value));
      }

      // Fetch auto-fetch setting
      const { data: autoFetchData } = await supabase
        .from('server_settings')
        .select('setting_value')
        .eq('setting_key', 'auto_fetch_stats')
        .maybeSingle();

      if (autoFetchData?.setting_value !== undefined) {
        setAutoFetch(Boolean(autoFetchData.setting_value));
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const fetchServerStats = async () => {
    if (!cfxServerCode) return;

    setIsFetching(true);
    try {
      const response = await fetch(
        `https://servers-frontend.fivem.net/api/servers/single/${cfxServerCode}`
      );

      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data?.Data) {
        setServerStats(data.Data);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Error fetching server stats:', error);
      toast({
        title: "Fejl",
        description: "Kunne ikke hente server statistik",
        variant: "destructive",
      });
    } finally {
      setIsFetching(false);
    }
  };

  const saveConfiguration = async () => {
    if (!isStaff) {
      toast({
        title: "Adgang nægtet",
        description: "Kun staff kan gemme indstillinger",
        variant: "destructive",
      });
      return;
    }

    try {
      // Save display IP
      const { data: existingIp } = await supabase
        .from('server_settings')
        .select('id')
        .eq('setting_key', 'server_display_ip')
        .maybeSingle();

      if (existingIp) {
        await supabase
          .from('server_settings')
          .update({ setting_value: displayIp })
          .eq('setting_key', 'server_display_ip');
      } else {
        await supabase
          .from('server_settings')
          .insert({ setting_key: 'server_display_ip', setting_value: displayIp });
      }

      // Save Discord URL
      const { data: existingDiscord } = await supabase
        .from('server_settings')
        .select('id')
        .eq('setting_key', 'discord_url')
        .maybeSingle();

      if (existingDiscord) {
        await supabase
          .from('server_settings')
          .update({ setting_value: discordUrl })
          .eq('setting_key', 'discord_url');
      } else {
        await supabase
          .from('server_settings')
          .insert({ setting_key: 'discord_url', setting_value: discordUrl });
      }

      // Save auto-fetch setting
      const { data: existingAutoFetch } = await supabase
        .from('server_settings')
        .select('id')
        .eq('setting_key', 'auto_fetch_stats')
        .maybeSingle();

      if (existingAutoFetch) {
        await supabase
          .from('server_settings')
          .update({ setting_value: autoFetch })
          .eq('setting_key', 'auto_fetch_stats');
      } else {
        await supabase
          .from('server_settings')
          .insert({ setting_key: 'auto_fetch_stats', setting_value: autoFetch });
      }

      toast({
        title: "Gemt!",
        description: "Server indstillinger er opdateret",
      });
    } catch (error) {
      console.error('Error saving configuration:', error);
      toast({
        title: "Fejl",
        description: "Kunne ikke gemme indstillinger",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-purple mx-auto mb-4"></div>
              <p className="text-foreground">Indlæser...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Server Management</h1>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></div>
              <p className="text-muted-foreground">Live Dashboard</p>
            </div>
          </div>
          
          {isStaff && (
            <Badge variant="secondary" className="bg-neon-purple/20 text-neon-purple border-neon-purple/50">
              Staff Access
            </Badge>
          )}
        </div>

        {/* CFX.re Server Settings - PRIMARY CONFIGURATION */}
        <Card className="mb-8 bg-gaming-card border-gaming-border">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Server className="h-5 w-5 text-neon-purple" />
              <CardTitle className="text-foreground">CFX.re Server Settings</CardTitle>
            </div>
            <CardDescription className="text-muted-foreground">
              Configure your CFX.re server code to display live statistics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CFXServerSettings />
          </CardContent>
        </Card>

        {/* Display Settings */}
        <Card className="mb-8 bg-gaming-card border-gaming-border">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <SettingsIcon className="h-5 w-5 text-neon-purple" />
              <CardTitle className="text-foreground">Display Settings</CardTitle>
            </div>
            <CardDescription className="text-muted-foreground">
              Configure how server information is displayed to users
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="display-ip" className="text-foreground">Display IP</Label>
                <Input
                  id="display-ip"
                  value={displayIp}
                  onChange={(e) => setDisplayIp(e.target.value)}
                  placeholder="connect server.example.com"
                  className="mt-2 bg-gaming-dark border-gaming-border text-foreground"
                  disabled={!isStaff}
                />
              </div>

              <div>
                <Label htmlFor="discord-url" className="text-foreground">Discord URL</Label>
                <Input
                  id="discord-url"
                  value={discordUrl}
                  onChange={(e) => setDiscordUrl(e.target.value)}
                  placeholder="https://discord.gg/your-server"
                  className="mt-2 bg-gaming-dark border-gaming-border text-foreground"
                  disabled={!isStaff}
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gaming-dark/50 rounded-lg border border-gaming-border">
              <div>
                <Label htmlFor="auto-fetch" className="text-foreground text-base">Auto-fetch Stats</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Automatically fetch server statistics every minute
                </p>
              </div>
              <Switch
                id="auto-fetch"
                checked={autoFetch}
                onCheckedChange={setAutoFetch}
                disabled={!isStaff}
              />
            </div>

            {isStaff && (
              <Button
                onClick={saveConfiguration}
                className="bg-neon-purple hover:bg-neon-purple/80"
              >
                Gem Konfiguration
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Live Server Statistics */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Live Server Statistics</h2>
              <p className="text-muted-foreground">Monitor your FiveM server in real-time using CFX.re API</p>
            </div>
            
            <Button
              onClick={fetchServerStats}
              disabled={!cfxServerCode || isFetching}
              className="bg-neon-purple hover:bg-neon-purple/80"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
              Opdater
            </Button>
          </div>
        </div>

        {/* Server Stats Display */}
        {!cfxServerCode ? (
          <Card className="bg-gaming-card border-gaming-border">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Server className="w-16 h-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">Ingen CFX server konfigureret</h3>
              <p className="text-muted-foreground text-center mb-4">
                Tilføj din CFX.re server kode i "CFX.re Server Indstillinger" sektionen ovenfor for at se live statistik
              </p>
            </CardContent>
          </Card>
        ) : serverStats ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Server Card */}
            <Card className="lg:col-span-2 bg-gaming-card border-gaming-border">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-foreground flex items-center">
                    <Server className="w-5 h-5 mr-2" />
                    {serverStats.hostname}
                  </CardTitle>
                  <Badge variant="default" className="bg-green-500/20 text-green-500 border-green-500/50">
                    <Activity className="w-3 h-3 mr-1" />
                    Online
                  </Badge>
                </div>
                <CardDescription className="text-muted-foreground">
                  {serverStats.connectEndPoint || 'FiveM Server'}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Users className="w-4 h-4 mr-1" />
                      Spillere Online
                    </div>
                    <div className="text-3xl font-bold text-foreground">
                      {serverStats.clients}/{serverStats.sv_maxclients}
                    </div>
                    <Progress 
                      value={(serverStats.clients / serverStats.sv_maxclients) * 100} 
                      className="h-2" 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Server className="w-4 h-4 mr-1" />
                      Server Info
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-foreground">
                        <span className="text-muted-foreground">Gametype:</span> {serverStats.gametype || 'N/A'}
                      </p>
                      <p className="text-sm text-foreground">
                        <span className="text-muted-foreground">Map:</span> {serverStats.mapname || 'N/A'}
                      </p>
                      <p className="text-sm text-foreground">
                        <span className="text-muted-foreground">Version:</span> {serverStats.server || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Additional Stats Grid */}
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gaming-border/30">
                  <div className="flex items-center space-x-3 p-3 bg-gaming-darker/50 rounded-lg border border-gaming-border/50">
                    <Gamepad2 className="h-6 w-6 text-neon-blue" />
                    <div>
                      <p className="text-sm font-semibold text-foreground truncate">
                        {serverStats.gametype}
                      </p>
                      <p className="text-xs text-muted-foreground">Gametype</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-3 bg-gaming-darker/50 rounded-lg border border-gaming-border/50">
                    <Globe className="h-6 w-6 text-neon-purple" />
                    <div>
                      <p className="text-sm font-semibold text-foreground truncate">
                        {serverStats.mapname}
                      </p>
                      <p className="text-xs text-muted-foreground">Map</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-3 bg-gaming-darker/50 rounded-lg border border-gaming-border/50">
                    <Zap className="h-6 w-6 text-neon-green" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {serverStats.players?.length || 0}
                      </p>
                      <p className="text-xs text-muted-foreground">Active</p>
                    </div>
                  </div>
                </div>

                {lastUpdate && (
                  <div className="text-xs text-muted-foreground bg-gaming-dark/50 p-3 rounded border border-gaming-border">
                    Sidst opdateret: {lastUpdate.toLocaleTimeString('da-DK')}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="space-y-4">
              <Card className="bg-gaming-card border-gaming-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-muted-foreground">Server Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-foreground">Online</span>
                      <Badge variant="default" className="bg-green-500/20 text-green-500 border-green-500/50">
                        Aktiv
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-foreground">Players</span>
                      <span className="text-sm font-semibold text-foreground">{serverStats.clients}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-foreground">Max Players</span>
                      <span className="text-sm font-semibold text-foreground">{serverStats.sv_maxclients}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gaming-card border-gaming-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-muted-foreground">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {displayIp && (
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => {
                        navigator.clipboard.writeText(displayIp);
                        toast({
                          title: "Kopieret!",
                          description: "Server IP kopieret til udklipsholder",
                        });
                      }}
                    >
                      <Server className="w-4 h-4 mr-2" />
                      Kopier Server IP
                    </Button>
                  )}
                  {discordUrl && (
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => window.open(discordUrl, '_blank')}
                    >
                      Åbn Discord
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <Card className="bg-gaming-card border-gaming-border">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-purple mb-4"></div>
              <p className="text-foreground">Henter server statistik...</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}