import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Zap, Search, Settings, MessageSquare, AlertTriangle, Shield, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const QuickActionsPanel = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const { toast } = useToast();

  // Load current maintenance mode status on mount
  useEffect(() => {
    const loadMaintenanceStatus = async () => {
      try {
        const { data } = await supabase
          .from('server_settings')
          .select('setting_value')
          .eq('setting_key', 'server_status')
          .maybeSingle();
        
        setMaintenanceMode(data?.setting_value === 'maintenance');
      } catch (error) {
        console.error('Error loading maintenance status:', error);
      }
    };
    
    loadMaintenanceStatus();
  }, []);

  const performQuickSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      // Search in users
      const { data: users } = await supabase
        .from('custom_users')
        .select('id, username, email, role, banned')
        .or(`username.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
        .limit(5);

      // Search in applications  
      const { data: applications } = await supabase
        .from('applications')
        .select('id, steam_name, discord_tag, status')
        .or(`steam_name.ilike.%${searchQuery}%,discord_tag.ilike.%${searchQuery}%`)
        .limit(5);

      const results = [
        ...(users || []).map(u => ({ type: 'user', data: u })),
        ...(applications || []).map(a => ({ type: 'application', data: a }))
      ];

      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search Error",
        description: "Failed to perform search",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const toggleMaintenanceMode = async () => {
    try {
      const newMode = !maintenanceMode;
      
      const { error } = await supabase
        .from('server_settings')
        .update({ 
          setting_value: newMode ? "maintenance" : "online" 
        })
        .eq('setting_key', 'server_status');

      if (error) throw error;

      setMaintenanceMode(newMode);
      toast({
        title: newMode ? "Maintenance Mode Enabled" : "Maintenance Mode Disabled",
        description: newMode 
          ? "Server is now in maintenance mode" 
          : "Server is back online",
        variant: newMode ? "destructive" : "default"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to toggle maintenance mode",
        variant: "destructive"
      });
    }
  };

  const sendBroadcast = async () => {
    if (!broadcastMessage.trim()) return;

    try {
      // In a real app, this would send to Discord webhook or in-game chat
      await supabase.functions.invoke('discord-logger', {
        body: {
          type: 'broadcast',
          data: {
            message: broadcastMessage,
            sender: 'Staff Team',
            timestamp: new Date().toISOString()
          }
        }
      });

      setBroadcastMessage("");
      toast({
        title: "Broadcast Sent",
        description: "Message has been sent to all channels"
      });
    } catch (error) {
      toast({
        title: "Broadcast Failed",
        description: "Failed to send broadcast message",
        variant: "destructive"
      });
    }
  };

  const quickActions = [
    {
      title: "User Management",
      icon: Shield,
      color: "text-neon-blue",
      action: () => window.location.hash = "#users"
    },
    {
      title: "Applications",
      icon: MessageSquare,
      color: "text-neon-green",  
      action: () => window.location.hash = "#applications"
    },
    {
      title: "Live Chat",
      icon: MessageSquare,
      color: "text-neon-cyan",
      action: () => window.location.hash = "#live-chat"
    },
    {
      title: "Server Settings",
      icon: Settings,
      color: "text-neon-purple",
      action: () => window.location.hash = "#settings"
    }
  ];

  return (
    <Card className="bg-gaming-card border-gaming-border">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Zap className="h-5 w-5 text-neon-yellow" />
          <span>Quick Actions</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Search */}
        <div className="space-y-2">
          <div className="flex space-x-2">
            <Input
              placeholder="Search users, applications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && performQuickSearch()}
              className="flex-1 bg-gaming-dark border-gaming-border"
            />
            <Button 
              size="sm" 
              onClick={performQuickSearch}
              disabled={isSearching}
              className="bg-neon-blue hover:bg-neon-blue/80"
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
          
          {searchResults.length > 0 && (
            <div className="max-h-32 overflow-y-auto bg-gaming-dark rounded-lg p-2 space-y-1">
              {searchResults.map((result, index) => (
                <div key={index} className="flex items-center justify-between text-sm p-2 hover:bg-gaming-card rounded cursor-pointer">
                  <div>
                    <span className="text-foreground">
                      {result.type === 'user' 
                        ? result.data.username 
                        : result.data.steam_name
                      }
                    </span>
                    <Badge variant="outline" className="ml-2 text-xs">
                      {result.type}
                    </Badge>
                  </div>
                  {result.type === 'user' && result.data.banned && (
                    <Badge variant="destructive" className="text-xs">Banned</Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Emergency Controls */}
        <div className="space-y-3 pt-3 border-t border-gaming-border">
          <h4 className="text-sm font-medium text-foreground">Emergency Controls</h4>
          
          <Button
            variant={maintenanceMode ? "destructive" : "outline"}
            size="sm"
            onClick={toggleMaintenanceMode}
            className="w-full"
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            {maintenanceMode ? "Disable Maintenance" : "Enable Maintenance"}
          </Button>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="w-full">
                <MessageSquare className="h-4 w-4 mr-2" />
                Broadcast Message
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Send Broadcast Message</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Textarea
                  placeholder="Enter your broadcast message..."
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  className="bg-gaming-dark border-gaming-border"
                />
                <Button onClick={sendBroadcast} className="w-full">
                  Send Broadcast
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Quick Navigation */}
        <div className="space-y-3 pt-3 border-t border-gaming-border">
          <h4 className="text-sm font-medium text-foreground">Quick Access</h4>
          
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={action.action}
                className="flex flex-col items-center p-3 bg-gaming-dark hover:bg-gaming-card rounded-lg transition-colors text-center"
              >
                <action.icon className={`h-5 w-5 ${action.color} mb-1`} />
                <span className="text-xs text-muted-foreground">{action.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* System Actions */}
        <div className="pt-3 border-t border-gaming-border">
          <div className="space-y-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh All Data
            </Button>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-full">
                  <Settings className="h-4 w-4 mr-2" />
                  Admin Tools
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Admin Tools</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    Seed realistic data for testing and demonstration:
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={async () => {
                        try {
                          await supabase.functions.invoke('data-seeder', {
                            body: { action: 'seedAnalytics' }
                          });
                          toast({ title: "Analytics data seeded successfully" });
                        } catch (error) {
                          toast({ title: "Failed to seed analytics", variant: "destructive" });
                        }
                      }}
                    >
                      Seed Analytics
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={async () => {
                        try {
                          await supabase.functions.invoke('data-seeder', {
                            body: { action: 'seedFinancialData' }
                          });
                          toast({ title: "Financial data seeded successfully" });
                        } catch (error) {
                          toast({ title: "Failed to seed financial data", variant: "destructive" });
                        }
                      }}
                    >
                      Seed Financial
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={async () => {
                        try {
                          await supabase.functions.invoke('data-seeder', {
                            body: { action: 'seedServerPerformance' }
                          });
                          toast({ title: "Server data seeded successfully" });
                        } catch (error) {
                          toast({ title: "Failed to seed server data", variant: "destructive" });
                        }
                      }}
                    >
                      Seed Server Data
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={async () => {
                        try {
                          await supabase.functions.invoke('data-seeder', {
                            body: { action: 'seedActivityLogs' }
                          });
                          toast({ title: "Activity logs seeded successfully" });
                        } catch (error) {
                          toast({ title: "Failed to seed activity logs", variant: "destructive" });
                        }
                      }}
                    >
                      Seed Activity
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};