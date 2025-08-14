import { Card } from "@/components/ui/card";
import { Users, Clock, Globe, Zap } from "lucide-react";

const ServerStats = () => {
  // Mock data - in real implementation, this would come from FiveM API
  const stats = {
    online: 247,
    maxPlayers: 300,
    uptime: "99.9%",
    queue: 12,
    ping: "15ms"
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card className="p-4 bg-gaming-card border-gaming-border hover:border-neon-purple/50 transition-all duration-300">
        <div className="flex items-center space-x-3">
          <Users className="h-8 w-8 text-neon-green" />
          <div>
            <p className="text-2xl font-bold text-foreground">{stats.online}</p>
            <p className="text-sm text-muted-foreground">Players Online</p>
          </div>
        </div>
      </Card>
      
      <Card className="p-4 bg-gaming-card border-gaming-border hover:border-neon-blue/50 transition-all duration-300">
        <div className="flex items-center space-x-3">
          <Clock className="h-8 w-8 text-neon-blue" />
          <div>
            <p className="text-2xl font-bold text-foreground">{stats.uptime}</p>
            <p className="text-sm text-muted-foreground">Uptime</p>
          </div>
        </div>
      </Card>
      
      <Card className="p-4 bg-gaming-card border-gaming-border hover:border-neon-purple/50 transition-all duration-300">
        <div className="flex items-center space-x-3">
          <Globe className="h-8 w-8 text-neon-purple" />
          <div>
            <p className="text-2xl font-bold text-foreground">{stats.queue}</p>
            <p className="text-sm text-muted-foreground">Queue</p>
          </div>
        </div>
      </Card>
      
      <Card className="p-4 bg-gaming-card border-gaming-border hover:border-neon-green/50 transition-all duration-300">
        <div className="flex items-center space-x-3">
          <Zap className="h-8 w-8 text-neon-green" />
          <div>
            <p className="text-2xl font-bold text-foreground">{stats.ping}</p>
            <p className="text-sm text-muted-foreground">Ping</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ServerStats;