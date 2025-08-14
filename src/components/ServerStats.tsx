import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Users, Clock, Globe, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ServerStats {
  players_online: number;
  max_players: number;
  queue_count: number;
  uptime_percentage: number;
  ping_ms: number;
  last_updated: string;
}

const ServerStats = () => {
  const [stats, setStats] = useState<ServerStats>({
    players_online: 0,
    max_players: 300,
    queue_count: 0,
    uptime_percentage: 99.9,
    ping_ms: 15,
    last_updated: new Date().toISOString()
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchServerStats();

    // Set up real-time subscription for server stats updates
    const channel = supabase
      .channel('server-stats-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'server_stats'
        },
        (payload) => {
          console.log('Server stats updated:', payload);
          if (payload.new) {
            setStats(payload.new as ServerStats);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchServerStats = async () => {
    try {
      const { data, error } = await supabase
        .from('server_stats')
        .select('*')
        .order('last_updated', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching server stats:', error);
        return;
      }

      if (data) {
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching server stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-4 bg-gaming-card border-gaming-border animate-pulse">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-gaming-dark rounded" />
              <div>
                <div className="h-6 w-12 bg-gaming-dark rounded mb-1" />
                <div className="h-4 w-16 bg-gaming-dark rounded" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card className="p-4 bg-gaming-card border-gaming-border hover:border-neon-green/50 transition-all duration-300">
        <div className="flex items-center space-x-3">
          <Users className="h-8 w-8 text-neon-green" />
          <div>
            <p className="text-2xl font-bold text-foreground">
              {stats.players_online}/{stats.max_players}
            </p>
            <p className="text-sm text-muted-foreground">Players Online</p>
          </div>
        </div>
      </Card>
      
      <Card className="p-4 bg-gaming-card border-gaming-border hover:border-neon-blue/50 transition-all duration-300">
        <div className="flex items-center space-x-3">
          <Clock className="h-8 w-8 text-neon-blue" />
          <div>
            <p className="text-2xl font-bold text-foreground">{stats.uptime_percentage}%</p>
            <p className="text-sm text-muted-foreground">Uptime</p>
          </div>
        </div>
      </Card>
      
      <Card className="p-4 bg-gaming-card border-gaming-border hover:border-neon-purple/50 transition-all duration-300">
        <div className="flex items-center space-x-3">
          <Globe className="h-8 w-8 text-neon-purple" />
          <div>
            <p className="text-2xl font-bold text-foreground">{stats.queue_count}</p>
            <p className="text-sm text-muted-foreground">Queue</p>
          </div>
        </div>
      </Card>
      
      <Card className="p-4 bg-gaming-card border-gaming-border hover:border-neon-green/50 transition-all duration-300">
        <div className="flex items-center space-x-3">
          <Zap className="h-8 w-8 text-neon-green" />
          <div>
            <p className="text-2xl font-bold text-foreground">{stats.ping_ms}ms</p>
            <p className="text-sm text-muted-foreground">Ping</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ServerStats;