import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Vote, Plus, Clock, Users, TrendingUp, Eye, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useCustomAuth } from '@/hooks/useCustomAuth';
import { useToast } from '@/hooks/use-toast';

interface CommunityVote {
  id: string;
  title: string;
  description: string;
  options: string[];
  vote_type: string;
  created_by: string;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  requires_staff_approval: boolean;
  min_participation: number;
  created_at: string;
  creator_name?: string;
  user_vote?: string;
  vote_counts?: { [key: string]: number };
  total_votes?: number;
}

const CommunityVoting = () => {
  const { t } = useTranslation();
  const { user } = useCustomAuth();
  const { toast } = useToast();
  
  const [votes, setVotes] = useState<CommunityVote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVote, setSelectedVote] = useState<CommunityVote | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [viewFilter, setViewFilter] = useState<'active' | 'completed' | 'my-votes'>('active');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    options: ['', ''],
    vote_type: 'simple',
    ends_at: '',
    requires_staff_approval: false,
    min_participation: 0
  });

  const [selectedOption, setSelectedOption] = useState<string>('');

  useEffect(() => {
    fetchVotes();
  }, [user, viewFilter]);

  const fetchVotes = async () => {
    try {
      let query = supabase
        .from('community_votes')
        .select('*');

      // Apply filters
      if (viewFilter === 'active') {
        query = query.eq('is_active', true).gte('ends_at', new Date().toISOString());
      } else if (viewFilter === 'completed') {
        query = query.lt('ends_at', new Date().toISOString());
      } else if (viewFilter === 'my-votes' && user) {
        query = query.eq('created_by', user.id);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      // Get creator usernames and vote data
      const votesWithData = await Promise.all(
        (data || []).map(async (vote) => {
          // Get creator username
          const { data: creatorProfile } = await supabase
            .from('custom_users')
            .select('username')
            .eq('id', vote.created_by)
            .maybeSingle();

          // Get vote responses
          const { data: userVotes } = await supabase
            .from('community_vote_responses')
            .select('selected_option')
            .eq('vote_id', vote.id);

          const voteCounts: { [key: string]: number } = {};
          const options = Array.isArray(vote.options) 
            ? vote.options.map((opt: any) => String(opt))
            : [];
          
          options.forEach((option: string) => {
            voteCounts[option] = 0;
          });

          userVotes?.forEach((uv) => {
            if (voteCounts.hasOwnProperty(uv.selected_option)) {
              voteCounts[uv.selected_option]++;
            }
          });

          let userVote = null;
          if (user) {
            const { data: userVoteData } = await supabase
              .from('community_vote_responses')
              .select('selected_option')
              .eq('vote_id', vote.id)
              .eq('user_id', user.id)
              .maybeSingle();
            
            userVote = userVoteData?.selected_option;
          }

          return {
            ...vote,
            options: options,
            creator_name: creatorProfile?.username || 'Unknown',
            user_vote: userVote,
            vote_counts: voteCounts,
            total_votes: userVotes?.length || 0
          } as CommunityVote;
        })
      );

      setVotes(votesWithData);
    } catch (error) {
      console.error('Error fetching votes:', error);
      toast({
        title: t('common.error'),
        description: t('voting.fetch_failed'),
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateVote = async () => {
    if (!user) return;

    const filteredOptions = formData.options.filter(option => option.trim() !== '');
    
    if (filteredOptions.length < 2) {
      toast({
        title: t('common.error'),
        description: t('voting.min_options_required'),
        variant: 'destructive'
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('community_votes')
        .insert({
          ...formData,
          options: filteredOptions,
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: t('common.success'),
        description: t('voting.vote_created')
      });

      setFormData({
        title: '',
        description: '',
        options: ['', ''],
        vote_type: 'simple',
        ends_at: '',
        requires_staff_approval: false,
        min_participation: 0
      });
      setIsCreateDialogOpen(false);
      fetchVotes();
    } catch (error) {
      console.error('Error creating vote:', error);
      toast({
        title: t('common.error'),
        description: t('voting.create_failed'),
        variant: 'destructive'
      });
    }
  };

  const handleCastVote = async (voteId: string, option: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('community_vote_responses')
        .insert({
          vote_id: voteId,
          user_id: user.id,
          selected_option: option
        });

      if (error) throw error;

      toast({
        title: t('common.success'),
        description: t('voting.vote_cast')
      });

      fetchVotes();
      setSelectedVote(null);
      setSelectedOption('');
    } catch (error) {
      console.error('Error casting vote:', error);
      toast({
        title: t('common.error'),
        description: t('voting.vote_failed'),
        variant: 'destructive'
      });
    }
  };

  const addOption = () => {
    if (formData.options.length < 10) {
      setFormData(prev => ({
        ...prev,
        options: [...prev.options, '']
      }));
    }
  };

  const removeOption = (index: number) => {
    if (formData.options.length > 2) {
      setFormData(prev => ({
        ...prev,
        options: prev.options.filter((_, i) => i !== index)
      }));
    }
  };

  const updateOption = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.map((option, i) => i === index ? value : option)
    }));
  };

  const isVoteActive = (vote: CommunityVote) => {
    return vote.is_active && new Date(vote.ends_at) > new Date();
  };

  const getTimeRemaining = (endDate: string) => {
    const now = new Date().getTime();
    const end = new Date(endDate).getTime();
    const diff = end - now;
    
    if (diff <= 0) return t('voting.ended');
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return `${days} ${t('voting.days')} ${hours} ${t('voting.hours')}`;
    } else {
      return `${hours} ${t('voting.hours')}`;
    }
  };

  const getVotePercentage = (vote: CommunityVote, option: string) => {
    if (!vote.vote_counts || vote.total_votes === 0) return 0;
    return Math.round((vote.vote_counts[option] / vote.total_votes) * 100);
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">{t('voting.loading')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">{t('voting.community_voting')}</h2>
          <p className="text-muted-foreground">{t('voting.description')}</p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={viewFilter} onValueChange={(value: any) => setViewFilter(value)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">{t('voting.active_votes')}</SelectItem>
              <SelectItem value="completed">{t('voting.completed_votes')}</SelectItem>
              {user && <SelectItem value="my-votes">{t('voting.my_votes')}</SelectItem>}
            </SelectContent>
          </Select>
          
          {user && (
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-primary to-secondary hover:from-primary/80 hover:to-secondary/80">
                  <Plus className="h-4 w-4 mr-2" />
                  {t('voting.create_vote')}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{t('voting.create_vote')}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>{t('voting.vote_title')}</Label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder={t('voting.title_placeholder')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{t('voting.description')}</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder={t('voting.description_placeholder')}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{t('voting.options')}</Label>
                    {formData.options.map((option, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Input
                          value={option}
                          onChange={(e) => updateOption(index, e.target.value)}
                          placeholder={`${t('voting.option')} ${index + 1}`}
                        />
                        {formData.options.length > 2 && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeOption(index)}
                            className="text-red-500 hover:bg-red-500 hover:text-white"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    {formData.options.length < 10 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={addOption}
                        className="w-full border-dashed"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        {t('voting.add_option')}
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t('voting.vote_type')}</Label>
                      <Select
                        value={formData.vote_type}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, vote_type: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="simple">{t('voting.type_simple')}</SelectItem>
                          <SelectItem value="multiple">{t('voting.type_multiple')}</SelectItem>
                          <SelectItem value="ranked">{t('voting.type_ranked')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>{t('voting.end_date')}</Label>
                      <Input
                        type="datetime-local"
                        value={formData.ends_at}
                        onChange={(e) => setFormData(prev => ({ ...prev, ends_at: e.target.value }))}
                      />
                    </div>
                  </div>

                  <Button onClick={handleCreateVote} className="w-full">
                    {t('voting.create_vote')}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {votes.length === 0 ? (
        <div className="text-center py-12">
          <Vote className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">{t('voting.no_votes')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {votes.map((vote) => (
            <Card key={vote.id} className="group overflow-hidden bg-gaming-card border-gaming-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/20">
              <div className="p-4 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <h3 className="text-lg font-semibold text-foreground line-clamp-2">{vote.title}</h3>
                    {isVoteActive(vote) ? (
                      <Badge className="bg-green-600 text-white">
                        {t('voting.active')}
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        {t('voting.ended')}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">By {vote.creator_name}</p>
                </div>

                <p className="text-sm text-muted-foreground line-clamp-2">
                  {vote.description}
                </p>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{getTimeRemaining(vote.ends_at)}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{vote.total_votes || 0} {t('voting.votes')}</span>
                    </div>
                  </div>
                  
                  {vote.vote_counts && vote.total_votes > 0 && (
                    <div className="space-y-1">
                      <div className="text-sm font-medium text-foreground">{t('voting.results')}:</div>
                      {vote.options.slice(0, 2).map((option, index) => (
                        <div key={index} className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground line-clamp-1">{option}</span>
                          <span className="font-medium">{getVotePercentage(vote, option)}%</span>
                        </div>
                      ))}
                      {vote.options.length > 2 && (
                        <div className="text-xs text-muted-foreground">
                          +{vote.options.length - 2} {t('voting.more_options')}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedVote(vote)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    {t('voting.view_details')}
                  </Button>

                  {user && isVoteActive(vote) && !vote.user_vote && (
                    <Button
                      size="sm"
                      className="bg-primary hover:bg-primary/80"
                      onClick={() => setSelectedVote(vote)}
                    >
                      <Vote className="h-4 w-4 mr-1" />
                      {t('voting.vote_now')}
                    </Button>
                  )}

                  {vote.user_vote && (
                    <Badge className="bg-blue-600 text-white">
                      {t('voting.voted')}
                    </Badge>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Vote Details Dialog */}
      <Dialog open={!!selectedVote} onOpenChange={() => { setSelectedVote(null); setSelectedOption(''); }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedVote && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">{selectedVote.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  {isVoteActive(selectedVote) ? (
                    <Badge className="bg-green-600 text-white">
                      {t('voting.active')}
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      {t('voting.ended')}
                    </Badge>
                  )}
                  <div className="text-sm text-muted-foreground">
                    {t('voting.created_by')} {selectedVote.creator_name}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">{t('voting.description')}</h4>
                  <p className="text-muted-foreground">{selectedVote.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">{t('voting.total_votes')}:</span>
                    <span className="ml-2">{selectedVote.total_votes || 0}</span>
                  </div>
                  <div>
                    <span className="font-medium">{t('voting.ends')}:</span>
                    <span className="ml-2">{new Date(selectedVote.ends_at).toLocaleString()}</span>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-4">{t('voting.options_and_results')}</h4>
                  
                  {user && isVoteActive(selectedVote) && !selectedVote.user_vote ? (
                    <div className="space-y-4">
                      <RadioGroup value={selectedOption} onValueChange={setSelectedOption}>
                        {selectedVote.options.map((option, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <RadioGroupItem value={option} id={`option-${index}`} />
                            <Label htmlFor={`option-${index}`} className="flex-1">
                              {option}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                      
                      <Button 
                        onClick={() => handleCastVote(selectedVote.id, selectedOption)}
                        disabled={!selectedOption}
                        className="w-full"
                      >
                        <Vote className="h-4 w-4 mr-2" />
                        {t('voting.cast_vote')}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedVote.options.map((option, index) => {
                        const percentage = getVotePercentage(selectedVote, option);
                        const voteCount = selectedVote.vote_counts?.[option] || 0;
                        const isUserChoice = selectedVote.user_vote === option;
                        
                        return (
                          <div key={index} className={`p-3 rounded-lg border ${isUserChoice ? 'border-primary bg-primary/10' : 'border-gaming-border'}`}>
                            <div className="flex items-center justify-between mb-2">
                              <span className={`font-medium ${isUserChoice ? 'text-primary' : 'text-foreground'}`}>
                                {option} {isUserChoice && `(${t('voting.your_vote')})`}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {voteCount} {t('voting.votes')} ({percentage}%)
                              </span>
                            </div>
                            <Progress value={percentage} className="h-2" />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {selectedVote.user_vote && (
                  <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Vote className="h-5 w-5 text-blue-500" />
                      <span className="font-medium text-blue-600">
                        {t('voting.you_voted_for')}: {selectedVote.user_vote}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CommunityVoting;