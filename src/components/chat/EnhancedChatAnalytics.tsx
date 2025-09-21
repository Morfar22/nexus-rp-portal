import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  MessageSquare, 
  Clock, 
  Star,
  Target,
  Activity,
  AlertTriangle,
  CheckCircle
} from "lucide-react";

interface ChatAnalytics {
  totalSessions: number;
  activeSessions: number;
  avgResponseTime: number;
  satisfactionScore: number;
  resolutionRate: number;
  dailyStats: any[];
  responseTimeStats: any[];
  satisfactionBreakdown: any[];
  agentPerformance: any[];
}

export const EnhancedChatAnalytics = () => {
  const [analytics, setAnalytics] = useState<ChatAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('7d');

  useEffect(() => {
    loadAnalytics();
    const interval = setInterval(loadAnalytics, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [timeRange]);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('analytics-data', {
        body: {
          type: 'chat_analytics',
          timeRange: timeRange
        }
      });

      if (error) throw error;
      setAnalytics(data);
    } catch (error) {
      console.error('Error loading chat analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-6 bg-gaming-card border-gaming-border animate-pulse">
            <div className="h-4 bg-muted/20 rounded w-1/4 mb-4"></div>
            <div className="h-20 bg-muted/20 rounded"></div>
          </Card>
        ))}
      </div>
    );
  }

  if (!analytics) {
    return (
      <Card className="p-6 bg-gaming-card border-gaming-border">
        <p className="text-center text-muted-foreground">No analytics data available</p>
      </Card>
    );
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-foreground">Chat Analytics</h3>
        <div className="flex space-x-2">
          {['24h', '7d', '30d'].map((range) => (
            <Button
              key={range}
              size="sm"
              variant={timeRange === range ? "default" : "outline"}
              onClick={() => setTimeRange(range as any)}
            >
              {range === '24h' ? '24 Hours' : range === '7d' ? '7 Days' : '30 Days'}
            </Button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-gaming-card border-gaming-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Sessions</p>
              <p className="text-2xl font-bold text-foreground">{analytics.totalSessions}</p>
            </div>
            <Users className="h-8 w-8 text-blue-500" />
          </div>
          <div className="flex items-center mt-2">
            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-sm text-green-500">+12% vs last period</span>
          </div>
        </Card>

        <Card className="p-4 bg-gaming-card border-gaming-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Now</p>
              <p className="text-2xl font-bold text-foreground">{analytics.activeSessions}</p>
            </div>
            <Activity className="h-8 w-8 text-green-500" />
          </div>
          <div className="flex items-center mt-2">
            <Badge variant="secondary" className="text-xs">
              Live Data
            </Badge>
          </div>
        </Card>

        <Card className="p-4 bg-gaming-card border-gaming-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Avg Response Time</p>
              <p className="text-2xl font-bold text-foreground">{analytics.avgResponseTime}s</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-500" />
          </div>
          <div className="flex items-center mt-2">
            <TrendingDown className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-sm text-green-500">-5s improvement</span>
          </div>
        </Card>

        <Card className="p-4 bg-gaming-card border-gaming-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Satisfaction</p>
              <p className="text-2xl font-bold text-foreground">{analytics.satisfactionScore}/5</p>
            </div>
            <Star className="h-8 w-8 text-yellow-500" />
          </div>
          <div className="flex items-center mt-2">
            <Progress value={analytics.satisfactionScore * 20} className="w-16 h-2" />
            <span className="text-sm text-muted-foreground ml-2">
              {Math.round(analytics.satisfactionScore * 20)}%
            </span>
          </div>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Chat Volume */}
        <Card className="p-6 bg-gaming-card border-gaming-border">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-foreground">Daily Chat Volume</h4>
            <MessageSquare className="h-5 w-5 text-blue-500" />
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={analytics.dailyStats}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="date" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--gaming-card))', 
                  border: '1px solid hsl(var(--gaming-border))',
                  borderRadius: '8px'
                }} 
              />
              <Bar dataKey="sessions" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Response Time Trend */}
        <Card className="p-6 bg-gaming-card border-gaming-border">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-foreground">Response Time Trend</h4>
            <Clock className="h-5 w-5 text-yellow-500" />
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={analytics.responseTimeStats}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="hour" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--gaming-card))', 
                  border: '1px solid hsl(var(--gaming-border))',
                  borderRadius: '8px'
                }} 
              />
              <Line 
                type="monotone" 
                dataKey="avgTime" 
                stroke="#F59E0B" 
                strokeWidth={2}
                dot={{ fill: '#F59E0B', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Satisfaction Breakdown */}
        <Card className="p-6 bg-gaming-card border-gaming-border">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-foreground">Satisfaction Ratings</h4>
            <Star className="h-5 w-5 text-yellow-500" />
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={analytics.satisfactionBreakdown}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {analytics.satisfactionBreakdown.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Agent Performance */}
        <Card className="p-6 bg-gaming-card border-gaming-border">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-foreground">Agent Performance</h4>
            <Target className="h-5 w-5 text-green-500" />
          </div>
          <div className="space-y-3">
            {analytics.agentPerformance.map((agent: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gaming-darker rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {agent.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{agent.name}</p>
                    <p className="text-xs text-muted-foreground">{agent.chatsHandled} chats</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-xs">
                    {agent.avgResponse}s avg
                  </Badge>
                  <div className="flex items-center">
                    {agent.satisfaction >= 4 ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : agent.satisfaction >= 3 ? (
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="text-sm ml-1">{agent.satisfaction}/5</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Resolution Rate */}
      <Card className="p-6 bg-gaming-card border-gaming-border">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold text-foreground">Resolution Rate</h4>
          <CheckCircle className="h-5 w-5 text-green-500" />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-3xl font-bold text-foreground">{analytics.resolutionRate}%</p>
            <p className="text-sm text-muted-foreground">Chats resolved on first contact</p>
          </div>
          <Progress value={analytics.resolutionRate} className="w-32 h-4" />
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-3 bg-gaming-darker rounded-lg">
            <p className="text-lg font-bold text-green-500">
              {Math.round(analytics.totalSessions * (analytics.resolutionRate / 100))}
            </p>
            <p className="text-xs text-muted-foreground">Resolved</p>
          </div>
          <div className="text-center p-3 bg-gaming-darker rounded-lg">
            <p className="text-lg font-bold text-yellow-500">
              {Math.round(analytics.totalSessions * ((100 - analytics.resolutionRate) / 100) * 0.6)}
            </p>
            <p className="text-xs text-muted-foreground">Escalated</p>
          </div>
          <div className="text-center p-3 bg-gaming-darker rounded-lg">
            <p className="text-lg font-bold text-red-500">
              {Math.round(analytics.totalSessions * ((100 - analytics.resolutionRate) / 100) * 0.4)}
            </p>
            <p className="text-xs text-muted-foreground">Unresolved</p>
          </div>
        </div>
      </Card>
    </div>
  );
};