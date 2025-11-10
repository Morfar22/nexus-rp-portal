import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { Activity, TrendingUp, Users, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface ServerStat {
  recorded_at: string;
  players_online: number;
  max_players: number;
  server_online: boolean;
  uptime_percentage: number;
}

export const ServerStatsHistory = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ServerStat[]>([]);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('7d');

  useEffect(() => {
    fetchStats();
  }, [timeRange]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const now = new Date();
      let startDate = new Date();
      
      switch (timeRange) {
        case '24h':
          startDate.setHours(now.getHours() - 24);
          break;
        case '7d':
          startDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(now.getDate() - 30);
          break;
      }

      const { data, error } = await supabase
        .from('individual_server_stats')
        .select('recorded_at, players_online, max_players, server_online, uptime_percentage')
        .gte('recorded_at', startDate.toISOString())
        .order('recorded_at', { ascending: true });

      if (error) throw error;
      setStats(data || []);
    } catch (error) {
      console.error('Error fetching server stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatChartData = () => {
    return stats.map(stat => ({
      time: new Date(stat.recorded_at).toLocaleString('da-DK', {
        month: 'short',
        day: 'numeric',
        hour: timeRange === '24h' ? '2-digit' : undefined,
        minute: timeRange === '24h' ? '2-digit' : undefined,
      }),
      spillere: stat.players_online,
      maks: stat.max_players,
      uptime: Math.round(stat.uptime_percentage),
      online: stat.server_online ? 1 : 0,
    }));
  };

  const calculateStats = () => {
    if (stats.length === 0) return { avgPlayers: 0, peakPlayers: 0, avgUptime: 0 };
    
    const avgPlayers = Math.round(
      stats.reduce((sum, s) => sum + s.players_online, 0) / stats.length
    );
    
    const peakPlayers = Math.max(...stats.map(s => s.players_online));
    
    const avgUptime = Math.round(
      stats.reduce((sum, s) => sum + s.uptime_percentage, 0) / stats.length
    );

    return { avgPlayers, peakPlayers, avgUptime };
  };

  const chartData = formatChartData();
  const { avgPlayers, peakPlayers, avgUptime } = calculateStats();

  if (loading) {
    return (
      <Card className="bg-gaming-card border-gaming-border">
        <CardHeader>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gaming-card border-gaming-border">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Activity className="h-5 w-5 text-neon-blue" />
              Server Statistik Historik
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Detaljeret analyse af server performance over tid
            </CardDescription>
          </div>
          
          <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as any)} className="w-auto">
            <TabsList className="bg-gaming-darker">
              <TabsTrigger value="24h">24 Timer</TabsTrigger>
              <TabsTrigger value="7d">7 Dage</TabsTrigger>
              <TabsTrigger value="30d">30 Dage</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gaming-darker/50 rounded-lg border border-gaming-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Gennemsnitlige Spillere</span>
              <Users className="h-4 w-4 text-neon-blue" />
            </div>
            <p className="text-2xl font-bold text-foreground">{avgPlayers}</p>
            <p className="text-xs text-muted-foreground mt-1">Per snapshot</p>
          </div>

          <div className="p-4 bg-gaming-darker/50 rounded-lg border border-gaming-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Peak Spillere</span>
              <TrendingUp className="h-4 w-4 text-neon-green" />
            </div>
            <p className="text-2xl font-bold text-foreground">{peakPlayers}</p>
            <p className="text-xs text-muted-foreground mt-1">Højeste antal</p>
          </div>

          <div className="p-4 bg-gaming-darker/50 rounded-lg border border-gaming-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Gennemsnitlig Uptime</span>
              <Clock className="h-4 w-4 text-golden-light" />
            </div>
            <p className="text-2xl font-bold text-foreground">{avgUptime}%</p>
            <p className="text-xs text-muted-foreground mt-1">Server stabilitet</p>
          </div>
        </div>

        {/* Charts */}
        <Tabs defaultValue="players" className="w-full">
          <TabsList className="bg-gaming-darker w-full justify-start">
            <TabsTrigger value="players">Spillere Over Tid</TabsTrigger>
            <TabsTrigger value="uptime">Uptime</TabsTrigger>
            <TabsTrigger value="comparison">Sammenligning</TabsTrigger>
          </TabsList>

          <TabsContent value="players" className="mt-6">
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorSpillere" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--neon-blue))" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="hsl(var(--neon-blue))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--gaming-border))" />
                <XAxis 
                  dataKey="time" 
                  stroke="hsl(var(--muted-foreground))"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  style={{ fontSize: '12px' }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--gaming-card))',
                    border: '1px solid hsl(var(--gaming-border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--foreground))'
                  }}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="spillere" 
                  stroke="hsl(var(--neon-blue))" 
                  fillOpacity={1} 
                  fill="url(#colorSpillere)"
                  name="Spillere Online"
                />
              </AreaChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="uptime" className="mt-6">
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--gaming-border))" />
                <XAxis 
                  dataKey="time" 
                  stroke="hsl(var(--muted-foreground))"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  style={{ fontSize: '12px' }}
                  domain={[0, 100]}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--gaming-card))',
                    border: '1px solid hsl(var(--gaming-border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--foreground))'
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="uptime" 
                  stroke="hsl(var(--golden-light))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--golden-light))' }}
                  name="Uptime %"
                />
              </LineChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="comparison" className="mt-6">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--gaming-border))" />
                <XAxis 
                  dataKey="time" 
                  stroke="hsl(var(--muted-foreground))"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  style={{ fontSize: '12px' }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--gaming-card))',
                    border: '1px solid hsl(var(--gaming-border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--foreground))'
                  }}
                />
                <Legend />
                <Bar dataKey="spillere" fill="hsl(var(--neon-blue))" name="Aktuelle Spillere" />
                <Bar dataKey="maks" fill="hsl(var(--neon-green))" name="Maks Kapacitet" />
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>
        </Tabs>

        {stats.length === 0 && (
          <div className="text-center py-12">
            <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">Ingen statistik data tilgængelig for den valgte periode</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ServerStatsHistory;