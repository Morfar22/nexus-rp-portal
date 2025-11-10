import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useCustomAuth } from "@/hooks/useCustomAuth";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { FileText, Trophy, Vote, User } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ActivityItem {
  id: string;
  type: 'application' | 'achievement' | 'vote' | 'profile';
  description: string;
  timestamp: string;
  metadata?: any;
}

export const ProfileActivity = () => {
  const { user } = useCustomAuth();
  const { t } = useTranslation();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivity = async () => {
      if (!user) return;

      try {
        const [applications, achievements, votes] = await Promise.all([
          supabase
            .from('applications')
            .select('id, created_at, status, application_types(name)')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(10),
          supabase
            .from('user_achievements')
            .select('id, earned_at, achievements(name)')
            .eq('user_id', user.id)
            .order('earned_at', { ascending: false })
            .limit(10),
          supabase
            .from('community_vote_responses')
            .select('id, created_at, community_votes(title)')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(10),
        ]);

        const activityList: ActivityItem[] = [];

        applications.data?.forEach((app) => {
          activityList.push({
            id: app.id,
            type: 'application',
            description: `Submitted application for ${app.application_types?.name || 'Unknown'}`,
            timestamp: app.created_at,
            metadata: { status: app.status },
          });
        });

        achievements.data?.forEach((achievement) => {
          activityList.push({
            id: achievement.id,
            type: 'achievement',
            description: `Unlocked achievement: ${achievement.achievements?.name || 'Unknown'}`,
            timestamp: achievement.earned_at,
          });
        });

        votes.data?.forEach((vote) => {
          activityList.push({
            id: vote.id,
            type: 'vote',
            description: `Voted on: ${vote.community_votes?.title || 'Unknown'}`,
            timestamp: vote.created_at,
          });
        });

        activityList.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setActivities(activityList.slice(0, 20));
      } catch (error) {
        console.error('Error fetching activity:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
  }, [user]);

  const getIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'application':
        return FileText;
      case 'achievement':
        return Trophy;
      case 'vote':
        return Vote;
      default:
        return User;
    }
  };

  const getIconColor = (type: ActivityItem['type']) => {
    switch (type) {
      case 'application':
        return 'text-blue-400 bg-blue-500/10';
      case 'achievement':
        return 'text-yellow-400 bg-yellow-500/10';
      case 'vote':
        return 'text-green-400 bg-green-500/10';
      default:
        return 'text-purple-400 bg-purple-500/10';
    }
  };

  if (loading) {
    return (
      <Card className="p-6 bg-gaming-card border-gaming-border">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4 animate-pulse">
              <div className="h-10 w-10 bg-gaming-dark/50 rounded-lg"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gaming-dark/50 rounded w-3/4"></div>
                <div className="h-3 bg-gaming-dark/50 rounded w-1/4"></div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (activities.length === 0) {
    return (
      <Card className="p-6 bg-gaming-card border-gaming-border">
        <p className="text-center text-muted-foreground">{t('profile.no_activity')}</p>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-gaming-card border-gaming-border">
      <h3 className="text-lg font-semibold text-foreground mb-4">{t('profile.recent_activity')}</h3>
      <ScrollArea className="h-[500px] pr-4">
        <div className="space-y-4">
          {activities.map((activity) => {
            const Icon = getIcon(activity.type);
            const iconColor = getIconColor(activity.type);
            
            return (
              <div key={activity.id} className="flex items-start space-x-4 pb-4 border-b border-gaming-border last:border-0">
                <div className={`p-2 rounded-lg ${iconColor}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">{activity.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </Card>
  );
};
