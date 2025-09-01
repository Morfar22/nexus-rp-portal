import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, MapPin, Users, Plus, Edit, Trash2, UserPlus, UserMinus, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useCustomAuth } from '@/hooks/useCustomAuth';
import { useToast } from '@/hooks/use-toast';

interface RPEvent {
  id: string;
  title: string;
  description: string;
  event_date: string;
  duration_minutes: number;
  max_participants: number;
  location: string;
  event_type: string;
  created_by: string;
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  requirements: string;
  rewards: string;
  is_public: boolean;
  created_at: string;
  participant_count?: number;
  is_participant?: boolean;
  creator_name?: string;
}

const RPEventCalendar = () => {
  const { t } = useTranslation();
  const { user } = useCustomAuth();
  const { toast } = useToast();
  
  const [events, setEvents] = useState<RPEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<RPEvent | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<RPEvent | null>(null);
  const [viewFilter, setViewFilter] = useState<'all' | 'upcoming' | 'my-events'>('upcoming');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_date: '',
    duration_minutes: 120,
    max_participants: 20,
    location: '',
    event_type: 'general',
    requirements: '',
    rewards: '',
    is_public: true
  });

  useEffect(() => {
    fetchEvents();
  }, [user, viewFilter]);

  const fetchEvents = async () => {
    try {
      let query = supabase
        .from('rp_events')
        .select('*');

      // Apply filters based on viewFilter
      if (viewFilter === 'upcoming') {
        query = query.gte('event_date', new Date().toISOString());
      } else if (viewFilter === 'my-events' && user) {
        query = query.eq('created_by', user.id);
      }

      const { data, error } = await query.order('event_date', { ascending: true });

      if (error) throw error;

      // Get creator usernames and participant data for each event
      const eventsWithParticipants = await Promise.all(
        (data || []).map(async (event) => {
          // Get creator username
          const { data: creatorProfile } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', event.created_by)
            .maybeSingle();

          // Get participant count
          const { count } = await supabase
            .from('event_participants')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', event.id);

          let is_participant = false;
          if (user) {
            const { data: participantData } = await supabase
              .from('event_participants')
              .select('id')
              .eq('event_id', event.id)
              .eq('user_id', user.id)
              .maybeSingle();
            
            is_participant = !!participantData;
          }

          return {
            ...event,
            status: event.status as 'scheduled' | 'ongoing' | 'completed' | 'cancelled',
            participant_count: count || 0,
            is_participant,
            creator_name: creatorProfile?.username || 'Unknown'
          };
        })
      );

      setEvents(eventsWithParticipants);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast({
        title: t('common.error'),
        description: t('events.fetch_failed'),
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateEvent = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('rp_events')
        .insert({
          ...formData,
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: t('common.success'),
        description: t('events.event_created')
      });

      setFormData({
        title: '',
        description: '',
        event_date: '',
        duration_minutes: 120,
        max_participants: 20,
        location: '',
        event_type: 'general',
        requirements: '',
        rewards: '',
        is_public: true
      });
      setIsCreateDialogOpen(false);
      fetchEvents();
    } catch (error) {
      console.error('Error creating event:', error);
      toast({
        title: t('common.error'),
        description: t('events.create_failed'),
        variant: 'destructive'
      });
    }
  };

  const handleJoinEvent = async (eventId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('event_participants')
        .insert({
          event_id: eventId,
          user_id: user.id
        });

      if (error) throw error;

      toast({
        title: t('common.success'),
        description: t('events.joined_event')
      });

      fetchEvents();
    } catch (error) {
      console.error('Error joining event:', error);
      toast({
        title: t('common.error'),
        description: t('events.join_failed'),
        variant: 'destructive'
      });
    }
  };

  const handleLeaveEvent = async (eventId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('event_participants')
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: t('common.success'),
        description: t('events.left_event')
      });

      fetchEvents();
    } catch (error) {
      console.error('Error leaving event:', error);
      toast({
        title: t('common.error'),
        description: t('events.leave_failed'),
        variant: 'destructive'
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-500';
      case 'ongoing': return 'bg-green-500';
      case 'completed': return 'bg-gray-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'general': return 'bg-primary';
      case 'racing': return 'bg-red-500';
      case 'business': return 'bg-green-500';
      case 'criminal': return 'bg-purple-500';
      case 'police': return 'bg-blue-500';
      case 'medical': return 'bg-pink-500';
      default: return 'bg-primary';
    }
  };

  const isEventFull = (event: RPEvent) => {
    return event.max_participants && event.participant_count >= event.max_participants;
  };

  const isEventPast = (event: RPEvent) => {
    return new Date(event.event_date) < new Date();
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">{t('events.loading')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">{t('events.rp_events')}</h2>
          <p className="text-muted-foreground">{t('events.calendar_description')}</p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={viewFilter} onValueChange={(value: any) => setViewFilter(value)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="upcoming">{t('events.upcoming_events')}</SelectItem>
              <SelectItem value="all">{t('events.all_events')}</SelectItem>
              {user && <SelectItem value="my-events">{t('events.my_events')}</SelectItem>}
            </SelectContent>
          </Select>
          
          {user && (
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-primary to-secondary hover:from-primary/80 hover:to-secondary/80">
                  <Plus className="h-4 w-4 mr-2" />
                  {t('events.create_event')}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{t('events.create_event')}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>{t('events.event_title')}</Label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder={t('events.title_placeholder')}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t('events.event_date')}</Label>
                      <Input
                        type="datetime-local"
                        value={formData.event_date}
                        onChange={(e) => setFormData(prev => ({ ...prev, event_date: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t('events.duration')}</Label>
                      <Select
                        value={formData.duration_minutes.toString()}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, duration_minutes: parseInt(value) }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="60">1 {t('events.hour')}</SelectItem>
                          <SelectItem value="120">2 {t('events.hours')}</SelectItem>
                          <SelectItem value="180">3 {t('events.hours')}</SelectItem>
                          <SelectItem value="240">4 {t('events.hours')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t('events.event_type')}</Label>
                      <Select
                        value={formData.event_type}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, event_type: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">{t('events.type_general')}</SelectItem>
                          <SelectItem value="racing">{t('events.type_racing')}</SelectItem>
                          <SelectItem value="business">{t('events.type_business')}</SelectItem>
                          <SelectItem value="criminal">{t('events.type_criminal')}</SelectItem>
                          <SelectItem value="police">{t('events.type_police')}</SelectItem>
                          <SelectItem value="medical">{t('events.type_medical')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>{t('events.max_participants')}</Label>
                      <Input
                        type="number"
                        min="1"
                        max="100"
                        value={formData.max_participants}
                        onChange={(e) => setFormData(prev => ({ ...prev, max_participants: parseInt(e.target.value) }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>{t('events.location')}</Label>
                    <Input
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      placeholder={t('events.location_placeholder')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{t('events.description')}</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder={t('events.description_placeholder')}
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{t('events.requirements')}</Label>
                    <Textarea
                      value={formData.requirements}
                      onChange={(e) => setFormData(prev => ({ ...prev, requirements: e.target.value }))}
                      placeholder={t('events.requirements_placeholder')}
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{t('events.rewards')}</Label>
                    <Input
                      value={formData.rewards}
                      onChange={(e) => setFormData(prev => ({ ...prev, rewards: e.target.value }))}
                      placeholder={t('events.rewards_placeholder')}
                    />
                  </div>

                  <Button onClick={handleCreateEvent} className="w-full">
                    {t('events.create_event')}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">{t('events.no_events')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <Card key={event.id} className="group overflow-hidden bg-gaming-card border-gaming-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/20">
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground line-clamp-1">{event.title}</h3>
                    <p className="text-sm text-muted-foreground">By {event.creator_name}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={`${getStatusColor(event.status)} text-white text-xs`}>
                      {t(`events.status_${event.status}`)}
                    </Badge>
                    <Badge className={`${getEventTypeColor(event.event_type)} text-white text-xs`}>
                      {t(`events.type_${event.event_type}`)}
                    </Badge>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground line-clamp-2">
                  {event.description}
                </p>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(event.event_date).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{event.duration_minutes} {t('events.minutes')}</span>
                  </div>
                  {event.location && (
                    <div className="flex items-center space-x-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span className="line-clamp-1">{event.location}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{event.participant_count}/{event.max_participants || '∞'} {t('events.participants')}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedEvent(event)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    {t('events.view_details')}
                  </Button>

                  {user && !isEventPast(event) && event.status === 'scheduled' && (
                    <div className="flex space-x-2">
                      {event.is_participant ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-500 border-red-500 hover:bg-red-500 hover:text-white"
                          onClick={() => handleLeaveEvent(event.id)}
                        >
                          <UserMinus className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => handleJoinEvent(event.id)}
                          disabled={isEventFull(event)}
                        >
                          <UserPlus className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                {user?.id === event.created_by && (
                  <div className="flex space-x-2 pt-2 border-t border-gaming-border">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="flex-1"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      {t('common.edit')}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="flex-1 text-red-500 hover:bg-red-500 hover:text-white"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      {t('common.delete')}
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Event Details Dialog */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedEvent && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">{selectedEvent.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <Badge className={`${getStatusColor(selectedEvent.status)} text-white`}>
                    {t(`events.status_${selectedEvent.status}`)}
                  </Badge>
                  <Badge className={`${getEventTypeColor(selectedEvent.event_type)} text-white`}>
                    {t(`events.type_${selectedEvent.event_type}`)}
                  </Badge>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">{t('events.description')}</h4>
                  <p className="text-muted-foreground">{selectedEvent.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      {t('events.event_date')}
                    </h4>
                    <p className="text-muted-foreground">
                      {new Date(selectedEvent.event_date).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      {t('events.duration')}
                    </h4>
                    <p className="text-muted-foreground">
                      {selectedEvent.duration_minutes} {t('events.minutes')}
                    </p>
                  </div>
                </div>

                {selectedEvent.location && (
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center">
                      <MapPin className="h-4 w-4 mr-2" />
                      {t('events.location')}
                    </h4>
                    <p className="text-muted-foreground">{selectedEvent.location}</p>
                  </div>
                )}

                <div>
                  <h4 className="font-semibold mb-2 flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    {t('events.participants')}
                  </h4>
                  <p className="text-muted-foreground">
                    {selectedEvent.participant_count}/{selectedEvent.max_participants || '∞'} {t('events.registered')}
                  </p>
                </div>

                {selectedEvent.requirements && (
                  <div>
                    <h4 className="font-semibold mb-2">{t('events.requirements')}</h4>
                    <p className="text-muted-foreground">{selectedEvent.requirements}</p>
                  </div>
                )}

                {selectedEvent.rewards && (
                  <div>
                    <h4 className="font-semibold mb-2">{t('events.rewards')}</h4>
                    <p className="text-muted-foreground">{selectedEvent.rewards}</p>
                  </div>
                )}

                <div className="text-sm text-muted-foreground">
                  <p>{t('events.created_by')} {selectedEvent.creator_name}</p>
                  <p>{t('events.created_at')} {new Date(selectedEvent.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RPEventCalendar;