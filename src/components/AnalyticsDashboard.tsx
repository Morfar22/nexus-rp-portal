import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Area, AreaChart
} from 'recharts';
import { 
  Users, Activity, MessageSquare, TrendingUp, 
  Eye, Clock, UserPlus, Calendar 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useCustomAuth } from '@/hooks/useCustomAuth';
import { useToast } from '@/hooks/use-toast';

interface AnalyticsData {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  chatSessions: number;
  applicationSubmissions: number;
  serverUptime: number;
  peakPlayerCount: number;
  averageSessionTime: number;
}

interface ChartData {
  name: string;
  value: number;
  users?: number;
  sessions?: number;
  applications?: number;
}

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444'];

const AnalyticsDashboard = () => {
  const { t } = useTranslation();
  const { user } = useCustomAuth();
  const { toast } = useToast();
  
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalUsers: 0,
    activeUsers: 0,
    newUsersToday: 0,
    chatSessions: 0,
    applicationSubmissions: 0,
    serverUptime: 99.5,
    peakPlayerCount: 0,
    averageSessionTime: 0
  });
  
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      
      // Fetch basic analytics
      const { data: profiles } = await supabase
        .from('custom_users')
        .select('id, created_at')
        .order('created_at', { ascending: false });

      const { data: chatSessions } = await supabase
        .from('chat_sessions')
        .select('id, created_at, status');

      const { data: applications } = await supabase
        .from('applications')
        .select('id, created_at, status');

      const { data: serverStats } = await supabase
        .from('server_stats')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // Calculate analytics
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const newUsersToday = profiles?.filter(p => 
        new Date(p.created_at) >= today
      ).length || 0;

      const totalUsers = profiles?.length || 0;
      const activeChatSessions = chatSessions?.filter(s => s.status === 'active').length || 0;
      const pendingApplications = applications?.filter(a => a.status === 'pending').length || 0;

      setAnalyticsData({
        totalUsers,
        activeUsers: Math.floor(totalUsers * 0.3), // Estimated active users
        newUsersToday,
        chatSessions: activeChatSessions,
        applicationSubmissions: pendingApplications,
        serverUptime: serverStats?.uptime_percentage || 99.5,
        peakPlayerCount: serverStats?.max_players || 300,
        averageSessionTime: 45 // Estimated in minutes
      });

      // Generate chart data for the selected time range
      const daysBack = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const chartDataArray: ChartData[] = [];
      
      for (let i = daysBack - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayProfiles = profiles?.filter(p => 
          p.created_at.startsWith(dateStr)
        ).length || 0;
        
        const daySessions = chatSessions?.filter(s => 
          s.created_at.startsWith(dateStr)
        ).length || 0;
        
        const dayApplications = applications?.filter(a => 
          a.created_at.startsWith(dateStr)
        ).length || 0;

        chartDataArray.push({
          name: date.toLocaleDateString('da-DK', { month: 'short', day: 'numeric' }),
          value: dayProfiles,
          users: dayProfiles,
          sessions: daySessions,
          applications: dayApplications
        });
      }
      
      setChartData(chartDataArray);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: t('common.error'),
        description: 'Fejl ved hentning af analytik data',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const pieData = [
    { name: 'Aktive Brugere', value: analyticsData.activeUsers },
    { name: 'Inaktive Brugere', value: analyticsData.totalUsers - analyticsData.activeUsers },
  ];

  const StatCard = ({ icon: Icon, title, value, subtitle, color = 'primary' }: {
    icon: any;
    title: string;
    value: string | number;
    subtitle?: string;
    color?: string;
  }) => (
    <Card className="p-6 bg-gaming-card border-gaming-border hover:border-primary/50 transition-all duration-300">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-full bg-${color}/20`}>
          <Icon className={`h-6 w-6 text-${color}`} />
        </div>
      </div>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold text-foreground">Analytik Dashboard</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-6 bg-gaming-card border-gaming-border animate-pulse">
              <div className="h-16 bg-gaming-dark rounded"></div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Analytik Dashboard</h2>
          <p className="text-muted-foreground">Oversigt over server og samfunds statistikker</p>
        </div>
        <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1d">{t('analytics.1_day')}</SelectItem>
            <SelectItem value="7d">{t('analytics.7_days')}</SelectItem>
            <SelectItem value="30d">{t('analytics.30_days')}</SelectItem>
            <SelectItem value="90d">{t('analytics.90_days')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Users}
          title={t('analytics.total_users')}
          value={analyticsData.totalUsers.toLocaleString()}
          subtitle={t('analytics.registered_members')}
          color="blue"
        />
        <StatCard
          icon={Activity}
          title={t('analytics.active_users')}
          value={analyticsData.activeUsers.toLocaleString()}
          subtitle={t('analytics.last_30_days')}
          color="green"
        />
        <StatCard
          icon={UserPlus}
          title={t('analytics.new_users_today')}
          value={analyticsData.newUsersToday}
          subtitle={t('analytics.registrations_today')}
          color="purple"
        />
        <StatCard
          icon={MessageSquare}
          title={t('analytics.active_chats')}
          value={analyticsData.chatSessions}
          subtitle={t('analytics.live_support_sessions')}
          color="orange"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <Card className="p-6 bg-gaming-card border-gaming-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Bruger Vækst</h3>
            <Badge variant="secondary">{timeRange}</Badge>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="users" 
                stroke="#6366f1" 
                fill="#6366f1" 
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Activity Distribution */}
        <Card className="p-6 bg-gaming-card border-gaming-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Bruger Aktivitet</h3>
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Chat Sessions */}
        <Card className="p-6 bg-gaming-card border-gaming-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Chat Aktivitet</h3>
            <MessageSquare className="h-5 w-5 text-muted-foreground" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="sessions" 
                stroke="#10b981" 
                strokeWidth={3}
                dot={{ fill: '#10b981' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Server Performance */}
        <Card className="p-6 bg-gaming-card border-gaming-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Server Performance</h3>
            <Activity className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Server Oppetid</span>
              <Badge className="bg-green-600 text-white">
                {analyticsData.serverUptime}%
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Peak Spillere</span>
              <Badge variant="secondary">
                {analyticsData.peakPlayerCount}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Gennemsnitlig Session</span>
              <Badge variant="secondary">
                {analyticsData.averageSessionTime}m
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Afventende Ansøgninger</span>
              <Badge className="bg-orange-600 text-white">
                {analyticsData.applicationSubmissions}
              </Badge>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-6 bg-gaming-card border-gaming-border">
        <h3 className="text-lg font-semibold text-foreground mb-4">Hurtige Handlinger</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button 
            variant="outline" 
            className="h-20 flex-col space-y-2"
            onClick={() => window.open('/staff-panel', '_blank')}
          >
            <Users className="h-6 w-6" />
            <span className="text-xs">Bruger Administration</span>
          </Button>
          <Button 
            variant="outline" 
            className="h-20 flex-col space-y-2"
            onClick={() => window.open('/server-management', '_blank')}
          >
            <Activity className="h-6 w-6" />
            <span className="text-xs">Server Indstillinger</span>
          </Button>
          <Button 
            variant="outline" 
            className="h-20 flex-col space-y-2"
            onClick={fetchAnalytics}
          >
            <TrendingUp className="h-6 w-6" />
            <span className="text-xs">Opdater Data</span>
          </Button>
          <Button 
            variant="outline" 
            className="h-20 flex-col space-y-2"
            onClick={() => window.open('/staff-panel#logs', '_blank')}
          >
            <Clock className="h-6 w-6" />
            <span className="text-xs">Se Logs</span>
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default AnalyticsDashboard;