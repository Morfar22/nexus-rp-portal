import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, UserCheck, UserX, FileText, Shield, Settings, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ActivityItem {
  id: string;
  type: 'application' | 'staff_action' | 'security' | 'system' | 'user';
  title: string;
  description: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high';
  actor?: string;
}

export const RecentActivityTimeline = () => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentActivity();
    const interval = setInterval(fetchRecentActivity, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const fetchRecentActivity = async () => {
    try {
      // Fetch recent audit logs from backend
      const { data, error } = await supabase.functions.invoke('staff-analytics', {
        body: { action: 'getAuditLogs' }
      });

      if (error) throw error;

      let activityItems: ActivityItem[] = [];

      if (data?.success && data.data) {
        // Convert audit logs to activity items
        activityItems = data.data.map((log: any) => ({
          id: log.id,
          type: log.activity_type,
          title: log.title,
          description: log.description,
          timestamp: new Date(log.created_at),
          severity: log.severity,
          actor: log.actor_name
        }));
      }

      // Also fetch recent applications for activity
      const { data: applications } = await supabase
        .from('applications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      // Add application activities
      applications?.forEach(app => {
        if (app.status === 'approved' && app.reviewed_at) {
          activityItems.push({
            id: `app-approved-${app.id}`,
            type: 'application',
            title: 'Application Approved',
            description: `${app.steam_name} was approved for whitelist`,
            timestamp: new Date(app.reviewed_at),
            severity: 'low',
            actor: 'Staff Team'
          });
        } else if (app.status === 'denied' && app.reviewed_at) {
          activityItems.push({
            id: `app-denied-${app.id}`,
            type: 'application',
            title: 'Application Denied',
            description: `${app.steam_name}'s application was denied`,
            timestamp: new Date(app.reviewed_at),
            severity: 'medium',
            actor: 'Staff Team'
          });
        } else if (app.status === 'pending') {
          activityItems.push({
            id: `app-submitted-${app.id}`,
            type: 'application',
            title: 'New Application',
            description: `${app.steam_name} submitted an application`,
            timestamp: new Date(app.created_at),
            severity: 'low'
          });
        }
      });

      // Sort by timestamp (newest first) and limit to 10
      const sortedActivities = activityItems
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 10);

      setActivities(sortedActivities);
    } catch (error) {
      console.error('Error fetching activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'application': return FileText;
      case 'staff_action': return UserCheck;
      case 'security': return Shield;
      case 'system': return Settings;
      case 'user': return UserCheck;
      default: return Clock;
    }
  };

  const getActivityColor = (type: string, severity: string) => {
    if (severity === 'high') return 'text-red-400';
    if (severity === 'medium') return 'text-amber-400';
    
    switch (type) {
      case 'application': return 'text-neon-blue';
      case 'staff_action': return 'text-neon-purple';
      case 'security': return 'text-red-400';
      case 'system': return 'text-neon-green';
      case 'user': return 'text-neon-teal';
      default: return 'text-muted-foreground';
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'high': return <Badge variant="destructive">High</Badge>;
      case 'medium': return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Medium</Badge>;
      case 'low': return <Badge variant="secondary">Low</Badge>;
    }
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  return (
    <Card className="bg-gaming-card border-gaming-border col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Clock className="h-5 w-5 text-neon-orange" />
          <span>Recent Activity</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3 p-3 bg-gaming-dark rounded-lg animate-pulse">
                <div className="w-8 h-8 bg-gaming-border rounded-full"></div>
                <div className="flex-1 space-y-1">
                  <div className="h-4 bg-gaming-border rounded w-3/4"></div>
                  <div className="h-3 bg-gaming-border rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : activities.length > 0 ? (
          <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar">
            {activities.map((activity, index) => {
              const Icon = getActivityIcon(activity.type);
              const color = getActivityColor(activity.type, activity.severity);
              
              return (
                <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gaming-dark rounded-lg hover:bg-gaming-card transition-colors">
                  <div className="relative">
                    <Icon className={`h-4 w-4 ${color}`} />
                    {index < activities.length - 1 && (
                      <div className="absolute top-6 left-2 w-px h-6 bg-gaming-border"></div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-medium text-foreground truncate">
                        {activity.title}
                      </h4>
                      <div className="flex items-center space-x-2 ml-2">
                        {activity.severity !== 'low' && getSeverityBadge(activity.severity)}
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatTimeAgo(activity.timestamp)}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-xs text-muted-foreground mb-1">
                      {activity.description}
                    </p>
                    
                    {activity.actor && (
                      <p className="text-xs text-muted-foreground">
                        by {activity.actor}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <Clock className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No recent activity</p>
          </div>
        )}

        {/* Quick Filter Pills */}
        <div className="flex flex-wrap gap-2 pt-3 border-t border-gaming-border">
          <Badge variant="outline" className="cursor-pointer hover:bg-gaming-card text-xs">
            All Activity
          </Badge>
          <Badge variant="outline" className="cursor-pointer hover:bg-gaming-card text-xs">
            Security Only
          </Badge>
          <Badge variant="outline" className="cursor-pointer hover:bg-gaming-card text-xs">
            Applications
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};