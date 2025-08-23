import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Gamepad2, Globe, Award } from "lucide-react";

const ServerInfoCard = () => {
  const [serverInfo, setServerInfo] = useState({
    displayIp: 'connect dreamlight-rp.com',
    discordUrl: '',
    status: 'online'
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchServerInfo();
  }, []);

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
          displayIp: settings.server_display_ip || 'connect dreamlight-rp.com',
          discordUrl: settings.discord_url || '',
          status: settings.server_status || 'online'
        });
      }
    } catch (error) {
      console.error('Error fetching server info:', error);
    }
  };

  const handleDiscordClick = () => {
    if (serverInfo.discordUrl) {
      window.open(serverInfo.discordUrl, '_blank');
    } else {
      toast({
        title: "Discord Link Not Available",
        description: "The Discord link has not been configured yet.",
        variant: "destructive",
      });
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-neon-teal/20 text-neon-teal border-neon-teal/30';
      case 'maintenance':
        return 'bg-golden-light/20 text-golden-light border-golden-light/30';
      case 'offline':
        return 'bg-red-500/20 text-red-500 border-red-500/30';
      default:
        return 'bg-neon-teal/20 text-neon-teal border-neon-teal/30';
    }
  };

  return (
    <Card className="group p-8 bg-gaming-card/80 backdrop-blur-sm border-2 border-gaming-border hover:border-teal-primary hover:bg-gaming-card transition-all duration-300 hover:shadow-lg hover:shadow-teal-primary/30 hover:scale-105 cursor-pointer">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-foreground mb-6 font-orbitron flex items-center justify-center group-hover:text-teal-primary transition-colors duration-300">
          <Gamepad2 className="h-6 w-6 mr-2 text-teal-primary group-hover:scale-110 transition-transform duration-300" />
          SERVER INFORMATION
        </h3>
        <div className="space-y-6">
          <div className="flex justify-between items-center p-3 bg-gaming-darker/50 rounded-lg border border-gaming-border/50">
            <span className="text-muted-foreground font-inter">Server IP:</span>
            <code className="bg-gaming-dark px-4 py-2 rounded font-mono text-teal-primary border border-teal-primary/30">
              {serverInfo.displayIp}
            </code>
          </div>
          <div className="flex justify-between items-center p-3 bg-gaming-darker/50 rounded-lg border border-gaming-border/50">
            <span className="text-muted-foreground font-inter">Discord:</span>
            <Button 
              variant="neon" 
              size="sm"
              className="font-orbitron bg-gradient-to-r from-teal-primary to-teal-light hover:from-teal-light hover:to-teal-primary border-2 border-teal-primary/50 hover:border-teal-primary text-white hover:scale-105 transition-all duration-300 hover:shadow-lg hover:shadow-teal-primary/50"
              onClick={handleDiscordClick}
              disabled={!serverInfo.discordUrl}
            >
              <Globe className="h-4 w-4 mr-2" />
              JOIN DISCORD
            </Button>
          </div>
          <div className="flex justify-between items-center p-3 bg-gaming-darker/50 rounded-lg border border-gaming-border/50">
            <span className="text-muted-foreground font-inter">Status:</span>
            <Badge className={`${getStatusStyle(serverInfo.status)} font-orbitron px-4 py-2`}>
              <Award className="h-3 w-3 mr-1" />
              {serverInfo.status.toUpperCase()}
            </Badge>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ServerInfoCard;