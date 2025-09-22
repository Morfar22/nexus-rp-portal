import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Star, Award, Crown, Users, Calendar, MessageCircle, Shield, Vote } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useCustomAuth } from "@/hooks/useCustomAuth";
import DynamicIcon from '@/components/DynamicIcon';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  points: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  requirements: any;
  is_active: boolean;
  earned?: boolean;
  earned_at?: string;
  progress?: number;
}

interface UserAchievement {
  user_id: string;
  achievement_id: string;
  earned_at: string;
  progress: number;
}

const AchievementSystem = () => {
  const { t } = useTranslation();
  const { user } = useCustomAuth();
  
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [totalPoints, setTotalPoints] = useState(0);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    fetchAchievements();
    if (user) {
      fetchUserAchievements();
    }
  }, [user]);

  const fetchAchievements = async (retry: boolean = false) => {
    try {
      setError(null);
      if (!retry) setIsLoading(true);
      
      console.log('🏆 Fetching achievements...');
      
      // Check if user is authenticated for better error handling
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      console.log('🔐 Current user:', currentUser?.id);
      
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .eq('is_active', true)
        .order('points', { ascending: true });

      if (error) throw error;
      console.log('🏆 Achievements fetched:', data?.length || 0);
      setAchievements((data || []) as Achievement[]);
      setRetryCount(0);
    } catch (error: any) {
      console.error('❌ Error fetching achievements:', error);
      const errorMessage = error?.message || error?.toString() || 'Unknown error';
      
      // Handle specific error types
      if (error?.code === 'PGRST301' || errorMessage.includes('401') || errorMessage.includes('JWT')) {
        setError('Authentication expired. Please refresh the page and try again.');
      } else if (errorMessage.includes('HTTP Error 0')) {
        setError('Connection lost. Please check your internet connection.');
      } else {
        setError(`Error loading achievements: ${errorMessage}`);
      }
      
      // Auto-retry for network errors (but not auth errors)
      if (retryCount < 3 && !errorMessage.includes('401') && !errorMessage.includes('JWT') && 
          (errorMessage.includes('HTTP Error 0') || errorMessage.includes('NetworkError') || errorMessage.includes('fetch'))) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          fetchAchievements(true);
        }, 1000 * (retryCount + 1));
      }
    } finally {
      if (!retry) setIsLoading(false);
    }
  };

  const fetchUserAchievements = async () => {
    if (!user) return;

    try {
      console.log('👤 Fetching user achievements for:', user.id);
      const { data, error } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      console.log('👤 User achievements fetched:', data?.length || 0, data);
      setUserAchievements(data || []);
      
      // Calculate total points
      const points = (data || []).reduce((sum, ua) => {
        const achievement = achievements.find(a => a.id === ua.achievement_id);
        return sum + (achievement?.points || 0);
      }, 0);
      console.log('📊 Total points calculated:', points);
      setTotalPoints(points);
    } catch (error: any) {
      console.error('❌ Error fetching user achievements:', error);
      const errorMessage = error?.message || error?.toString() || 'Unknown error';
      setError(`Error loading user achievements: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    setRetryCount(0);
    setError(null);
    
    // If it's an auth error, try to refresh the session
    if (error?.includes('Authentication expired') || error?.includes('401')) {
      window.location.reload();
      return;
    }
    
    fetchAchievements();
    if (user) {
      fetchUserAchievements();
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'bg-gray-500';
      case 'uncommon': return 'bg-green-500';
      case 'rare': return 'bg-blue-500';
      case 'epic': return 'bg-purple-500';
      case 'legendary': return 'bg-golden-light';
      default: return 'bg-gray-500';
    }
  };

  const getRarityBorder = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'border-gray-500/30';
      case 'uncommon': return 'border-green-500/30';
      case 'rare': return 'border-blue-500/30';
      case 'epic': return 'border-purple-500/30';
      case 'legendary': return 'border-golden-light/30';
      default: return 'border-gray-500/30';
    }
  };

  const getCategories = () => {
    const categories = [...new Set(achievements.map(a => a.category))];
    return ['all', ...categories];
  };

  const getFilteredAchievements = () => {
    let filtered = achievements;
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(a => a.category === selectedCategory);
    }

    // Add earned status and progress
    return filtered.map(achievement => {
      const userAchievement = userAchievements.find(ua => ua.achievement_id === achievement.id);
      return {
        ...achievement,
        earned: !!userAchievement,
        earned_at: userAchievement?.earned_at,
        progress: userAchievement?.progress || 0
      };
    });
  };

  const getCompletionPercentage = () => {
    const earnedCount = userAchievements.length;
    const totalCount = achievements.length;
    return totalCount > 0 ? Math.round((earnedCount / totalCount) * 100) : 0;
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">
          {retryCount > 0 ? `Retrying... (${retryCount}/3)` : t('achievements.loading')}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 max-w-md mx-auto">
          <div className="text-destructive font-medium mb-2">
            {error.includes('Authentication expired') ? '🔐 Session Expired' : 
             error.includes('Connection lost') ? '🌐 Connection Error' : 
             '⚠️ Error'}
          </div>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <button
            onClick={handleRetry}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            {error.includes('Authentication expired') ? 'Refresh Page' : 'Try Again'}
          </button>
        </div>
      </div>
    );
  }

  const filteredAchievements = getFilteredAchievements();
  const earnedAchievements = filteredAchievements.filter(a => a.earned);
  const unEarnedAchievements = filteredAchievements.filter(a => !a.earned);

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold text-foreground">{t('achievements.achievement_system')}</h2>
        <p className="text-muted-foreground">{t('achievements.system_description')}</p>
        
        {user && (
          <div className="flex items-center justify-center space-x-8">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{totalPoints}</div>
              <div className="text-sm text-muted-foreground">{t('achievements.total_points')}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{userAchievements.length}</div>
              <div className="text-sm text-muted-foreground">{t('achievements.earned_achievements')}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{getCompletionPercentage()}%</div>
              <div className="text-sm text-muted-foreground">{t('achievements.completion')}</div>
            </div>
          </div>
        )}
        
        {user && (
          <div className="max-w-md mx-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">{t('achievements.progress')}</span>
              <span className="text-sm font-medium">{userAchievements.length}/{achievements.length}</span>
            </div>
            <Progress value={getCompletionPercentage()} className="h-3" />
          </div>
        )}
      </div>

      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="all">{t('achievements.all')}</TabsTrigger>
          {getCategories().slice(1, 6).map(category => (
            <TabsTrigger key={category} value={category} className="text-xs">
              {t(`achievements.category_${category.toLowerCase()}`) || category}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedCategory} className="space-y-6">
          {user && earnedAchievements.length > 0 && (
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Trophy className="h-5 w-5 text-golden-light" />
                <h3 className="text-xl font-semibold text-foreground">
                  {t('achievements.earned')} ({earnedAchievements.length})
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {earnedAchievements.map((achievement) => (
                  <Card 
                    key={achievement.id} 
                    className={`p-4 bg-gaming-card border-2 ${getRarityBorder(achievement.rarity)} relative overflow-hidden group hover:shadow-lg transition-all duration-300`}
                  >
                    <div className="absolute top-0 right-0 w-16 h-16 -mr-8 -mt-8 rotate-45 bg-golden-light opacity-20"></div>
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-lg ${getRarityColor(achievement.rarity)} bg-opacity-20`}>
                        <DynamicIcon 
                          name={achievement.icon} 
                          className={`h-6 w-6 text-${achievement.rarity === 'legendary' ? 'golden-light' : 'foreground'}`} 
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-semibold text-foreground">{achievement.name}</h4>
                          <Badge 
                            variant="secondary" 
                            className={`${getRarityColor(achievement.rarity)} text-white text-xs`}
                          >
                            {t(`achievements.rarity_${achievement.rarity}`)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {achievement.description}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-primary font-medium">
                            +{achievement.points} {t('achievements.points')}
                          </span>
                          {achievement.earned_at && (
                            <span className="text-xs text-muted-foreground">
                              {new Date(achievement.earned_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <Trophy className="h-5 w-5 text-golden-light" />
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {unEarnedAchievements.length > 0 && (
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Star className="h-5 w-5 text-muted-foreground" />
                <h3 className="text-xl font-semibold text-foreground">
                  {user ? t('achievements.not_earned') : t('achievements.available')} ({unEarnedAchievements.length})
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {unEarnedAchievements.map((achievement) => (
                  <Card 
                    key={achievement.id} 
                    className={`p-4 bg-gaming-card border ${getRarityBorder(achievement.rarity)} opacity-75 hover:opacity-100 transition-opacity duration-300`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-lg bg-muted`}>
                        <DynamicIcon 
                          name={achievement.icon} 
                          className="h-6 w-6 text-muted-foreground" 
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-semibold text-foreground">{achievement.name}</h4>
                          <Badge 
                            variant="outline" 
                            className="text-xs"
                          >
                            {t(`achievements.rarity_${achievement.rarity}`)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {achievement.description}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-primary font-medium">
                            +{achievement.points} {t('achievements.points')}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            {t(`achievements.category_${achievement.category.toLowerCase()}`) || achievement.category}
                          </Badge>
                        </div>
                        {achievement.progress > 0 && achievement.progress < 100 && (
                          <div className="mt-2">
                            <Progress value={achievement.progress} className="h-2" />
                            <span className="text-xs text-muted-foreground">
                              {achievement.progress}% {t('achievements.progress')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {!user && (
        <Card className="p-8 text-center bg-gaming-card border-gaming-border">
          <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {t('achievements.login_required')}
          </h3>
          <p className="text-muted-foreground">
            {t('achievements.login_description')}
          </p>
        </Card>
      )}
    </div>
  );
};

export default AchievementSystem;