import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Users, RefreshCw, Download, Settings } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface DiscordStaffSyncProps {
  serverSettings: any;
  setServerSettings: (settings: any) => void;
  handleSettingUpdate: (key: string, value: any) => Promise<void>;
}

const DiscordStaffSync = ({ 
  serverSettings, 
  setServerSettings, 
  handleSettingUpdate 
}: DiscordStaffSyncProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [syncStats, setSyncStats] = useState<any>(null);

  const handleFetchDiscordMembers = async () => {
    try {
      setIsLoading(true);
      
      if (!serverSettings.discord_settings?.server_id) {
        toast({
          title: "Error",
          description: "Please configure Discord Server ID first",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('discord-staff-sync', {
        body: {
          action: 'fetch_guild_members',
          guildId: serverSettings.discord_settings.server_id
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Discord Members Fetched",
          description: `Found ${data.data.length} members in Discord server`,
        });
      } else {
        // Handle configuration errors with more helpful messages
        if (data.requiresConfiguration) {
          toast({
            title: "Configuration Required",
            description: data.error || "Please configure Discord role mappings below",
            variant: "destructive",
          });
        } else {
          throw new Error(data.error);
        }
      }
    } catch (error) {
      console.error('Discord fetch error:', error);
      toast({
        title: "Fetch Failed",
        description: error.message || "Failed to fetch Discord members",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncStaffMembers = async () => {
    try {
      setIsLoading(true);
      
      if (!serverSettings.discord_settings?.server_id) {
        toast({
          title: "Error",
          description: "Please configure Discord Server ID first",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('discord-staff-sync', {
        body: {
          action: 'sync_staff_members',
          guildId: serverSettings.discord_settings.server_id
        }
      });

      if (error) throw error;

      if (data.success) {
        setSyncStats(data.data);
        toast({
          title: "Staff Sync Completed",
          description: `Synced ${data.data.syncedCount} staff members from Discord`,
        });
      } else {
        // Handle configuration errors with more helpful messages
        if (data.requiresConfiguration) {
          toast({
            title: "Configuration Required",
            description: data.error || "Please configure Discord role mappings below",
            variant: "destructive",
          });
        } else {
          throw new Error(data.error);
        }
      }
    } catch (error) {
      console.error('Discord sync error:', error);
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to sync Discord staff members",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-gaming-card border-gaming-border">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-foreground">
          <Users className="h-5 w-5 text-neon-blue" />
          <span>Discord Staff Auto-Sync</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Auto-sync toggle */}
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-foreground">Enable Auto Staff Sync</Label>
            <p className="text-sm text-muted-foreground">Automatically sync Discord members with staff roles</p>
          </div>
          <Switch
            checked={serverSettings.discord_settings?.auto_staff_sync || false}
            onCheckedChange={(checked) => {
              const newSettings = {
                ...serverSettings.discord_settings,
                auto_staff_sync: checked
              };
              setServerSettings({
                ...serverSettings,
                discord_settings: newSettings
              });
              handleSettingUpdate('discord_settings', newSettings);
            }}
          />
        </div>

        {/* Staff Role Mappings */}
        {serverSettings.discord_settings?.auto_staff_sync && (
          <div className="space-y-4 bg-gaming-dark/50 p-4 rounded-lg border border-gaming-border">
            <div className="flex items-center space-x-2">
              <Settings className="h-4 w-4 text-neon-green" />
              <h3 className="font-semibold text-foreground">Staff Role Mappings</h3>
            </div>
            
            <div className="text-sm text-muted-foreground">
              Map Discord roles to your staff positions. Only members with these Discord roles will be synced as staff.
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-foreground">Admin Discord Role ID</Label>
                <Input
                  placeholder="Discord role ID for admins"
                  value={serverSettings.discord_settings?.staff_role_mappings?.admin || ''}
                  onChange={(e) => {
                    const newSettings = {
                      ...serverSettings.discord_settings,
                      staff_role_mappings: {
                        ...serverSettings.discord_settings?.staff_role_mappings,
                        admin: e.target.value
                      }
                    };
                    setServerSettings({
                      ...serverSettings,
                      discord_settings: newSettings
                    });
                  }}
                  onBlur={() => handleSettingUpdate('discord_settings', serverSettings.discord_settings)}
                  className="bg-gaming-card border-gaming-border"
                />
              </div>
              
              <div>
                <Label className="text-foreground">Moderator Discord Role ID</Label>
                <Input
                  placeholder="Discord role ID for moderators"
                  value={serverSettings.discord_settings?.staff_role_mappings?.moderator || ''}
                  onChange={(e) => {
                    const newSettings = {
                      ...serverSettings.discord_settings,
                      staff_role_mappings: {
                        ...serverSettings.discord_settings?.staff_role_mappings,
                        moderator: e.target.value
                      }
                    };
                    setServerSettings({
                      ...serverSettings,
                      discord_settings: newSettings
                    });
                  }}
                  onBlur={() => handleSettingUpdate('discord_settings', serverSettings.discord_settings)}
                  className="bg-gaming-card border-gaming-border"
                />
              </div>
              
              <div>
                <Label className="text-foreground">Staff Discord Role ID</Label>
                <Input
                  placeholder="Discord role ID for general staff"
                  value={serverSettings.discord_settings?.staff_role_mappings?.staff || ''}
                  onChange={(e) => {
                    const newSettings = {
                      ...serverSettings.discord_settings,
                      staff_role_mappings: {
                        ...serverSettings.discord_settings?.staff_role_mappings,
                        staff: e.target.value
                      }
                    };
                    setServerSettings({
                      ...serverSettings,
                      discord_settings: newSettings
                    });
                  }}
                  onBlur={() => handleSettingUpdate('discord_settings', serverSettings.discord_settings)}
                  className="bg-gaming-card border-gaming-border"
                />
              </div>
              
              <div>
                <Label className="text-foreground">Developer Discord Role ID</Label>
                <Input
                  placeholder="Discord role ID for developers"
                  value={serverSettings.discord_settings?.staff_role_mappings?.developer || ''}
                  onChange={(e) => {
                    const newSettings = {
                      ...serverSettings.discord_settings,
                      staff_role_mappings: {
                        ...serverSettings.discord_settings?.staff_role_mappings,
                        developer: e.target.value
                      }
                    };
                    setServerSettings({
                      ...serverSettings,
                      discord_settings: newSettings
                    });
                  }}
                  onBlur={() => handleSettingUpdate('discord_settings', serverSettings.discord_settings)}
                  className="bg-gaming-card border-gaming-border"
                />
              </div>
            </div>
          </div>
        )}

        {/* Sync Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            variant="outline"
            onClick={handleFetchDiscordMembers}
            disabled={isLoading || !serverSettings.discord_settings?.server_id}
            className="flex-1 border-gaming-border hover:bg-gaming-dark"
          >
            <Download className="h-4 w-4 mr-2" />
            Preview Discord Members
          </Button>
          
          <Button
            onClick={handleSyncStaffMembers}
            disabled={isLoading || !serverSettings.discord_settings?.server_id || !serverSettings.discord_settings?.auto_staff_sync}
            className="flex-1"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Syncing...' : 'Sync Staff from Discord'}
          </Button>
        </div>

        {/* Sync Statistics */}
        {syncStats && (
          <div className="bg-gaming-dark/30 p-4 rounded-lg border border-gaming-border">
            <h4 className="font-semibold text-foreground mb-3">Last Sync Results</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-neon-blue">{syncStats.totalDiscordMembers}</div>
                <div className="text-xs text-muted-foreground">Total Members</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-neon-green">{syncStats.staffMembersFound}</div>
                <div className="text-xs text-muted-foreground">Staff Found</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-neon-purple">{syncStats.syncedCount}</div>
                <div className="text-xs text-muted-foreground">Synced</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-500">{syncStats.skippedCount}</div>
                <div className="text-xs text-muted-foreground">Skipped</div>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="text-sm text-muted-foreground bg-blue-500/10 border border-blue-500/20 rounded p-3">
          <strong>Setup Instructions:</strong><br />
          1. Create staff roles in the Team Management section first<br />
          2. Map Discord role IDs to your staff positions above<br />
          3. Enable auto-sync and click "Sync Staff from Discord"<br />
          4. Staff members will be automatically added to your team based on their Discord roles
        </div>
      </CardContent>
    </Card>
  );
};

export default DiscordStaffSync;