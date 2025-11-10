import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useCustomAuth } from "@/hooks/useCustomAuth";
import { FileText, Trophy, Vote, CheckCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

export const ProfileStats = () => {
  const { user } = useCustomAuth();
  const { t } = useTranslation();
  const [stats, setStats] = useState({
    applications: 0,
    achievements: 0,
    votes: 0,
    characters: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;

      try {
        const [applicationsRes, achievementsRes, votesRes, charactersRes] = await Promise.all([
          supabase.from('applications').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
          supabase.from('user_achievements').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
          supabase.from('community_vote_responses').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
          supabase.from('character_profiles').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        ]);

        setStats({
          applications: applicationsRes.count || 0,
          achievements: achievementsRes.count || 0,
          votes: votesRes.count || 0,
          characters: charactersRes.count || 0,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-6 bg-gaming-card border-gaming-border animate-pulse">
            <div className="h-16 bg-gaming-dark/50 rounded"></div>
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: t('profile.applications_count'),
      value: stats.applications,
      icon: FileText,
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
    },
    {
      title: t('profile.achievements_count'),
      value: stats.achievements,
      icon: Trophy,
      color: "text-yellow-400",
      bgColor: "bg-yellow-500/10",
    },
    {
      title: t('profile.votes_count'),
      value: stats.votes,
      icon: Vote,
      color: "text-green-400",
      bgColor: "bg-green-500/10",
    },
    {
      title: t('profile.characters_count'),
      value: stats.characters,
      icon: CheckCircle,
      color: "text-purple-400",
      bgColor: "bg-purple-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title} className="p-6 bg-gaming-card border-gaming-border hover:border-neon-purple/50 transition-all">
            <div className="flex items-center space-x-4">
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <Icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
