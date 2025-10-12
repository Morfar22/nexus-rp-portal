import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, User, Calendar, Briefcase, Heart, Edit, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useCustomAuth } from '@/hooks/useCustomAuth';
import { useToast } from '@/hooks/use-toast';

interface Character {
  id: string;
  character_name: string;
  character_description: string;
  character_backstory: string;
  character_image_url: string;
  age: number;
  occupation: string;
  personality_traits: string[];
  relationships: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  is_active?: boolean;
  profiles?: {
    username: string;
    avatar_url: string;
  } | null;
}

const CharacterGallery = () => {
  const { t } = useTranslation();
  const { user } = useCustomAuth();
  const { toast } = useToast();
  
  const [characters, setCharacters] = useState<Character[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);

  const [formData, setFormData] = useState({
    character_name: '',
    character_description: '',
    character_backstory: '',
    character_image_url: '',
    age: 25,
    occupation: '',
    personality_traits: [] as string[],
    relationships: ''
  });

  useEffect(() => {
    fetchCharacters();
  }, []);

  const fetchCharacters = async () => {
    try {
      const { data, error } = await supabase
        .from('character_profiles')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const charactersWithProfiles = (data || []).map(character => ({
        ...character,
        personality_traits: character.personality_traits || [],
        profiles: null
      }));

      setCharacters(charactersWithProfiles);
    } catch (error) {
      console.error('Error fetching characters:', error);
      toast({
        title: t('common.error'),
        description: t('characters.fetch_failed'),
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCharacter = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('character_profiles')
        .insert({
          user_id: user.id,
          ...formData
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: t('common.success'),
        description: t('characters.character_created')
      });

      setFormData({
        character_name: '',
        character_description: '',
        character_backstory: '',
        character_image_url: '',
        age: 25,
        occupation: '',
        personality_traits: [],
        relationships: ''
      });
      setIsCreateDialogOpen(false);
      fetchCharacters();
    } catch (error) {
      console.error('Error creating character:', error);
      toast({
        title: t('common.error'),
        description: t('characters.create_failed'),
        variant: 'destructive'
      });
    }
  };

  const handleUpdateCharacter = async () => {
    if (!editingCharacter) return;

    try {
      const { error } = await supabase
        .from('character_profiles')
        .update(formData)
        .eq('id', editingCharacter.id);

      if (error) throw error;

      toast({
        title: t('common.success'),
        description: t('characters.character_updated')
      });

      setIsEditDialogOpen(false);
      setEditingCharacter(null);
      fetchCharacters();
    } catch (error) {
      console.error('Error updating character:', error);
      toast({
        title: t('common.error'),
        description: t('characters.update_failed'),
        variant: 'destructive'
      });
    }
  };

  const handleDeleteCharacter = async (characterId: string) => {
    try {
      const { error } = await supabase
        .from('character_profiles')
        .update({ is_active: false })
        .eq('id', characterId);

      if (error) throw error;

      toast({
        title: t('common.success'),
        description: t('characters.character_deleted')
      });

      fetchCharacters();
    } catch (error) {
      console.error('Error deleting character:', error);
      toast({
        title: t('common.error'),
        description: t('characters.delete_failed'),
        variant: 'destructive'
      });
    }
  };

  const openEditDialog = (character: Character) => {
    setEditingCharacter(character);
    setFormData({
      character_name: character.character_name,
      character_description: character.character_description || '',
      character_backstory: character.character_backstory || '',
      character_image_url: character.character_image_url || '',
      age: character.age || 25,
      occupation: character.occupation || '',
      personality_traits: character.personality_traits || [],
      relationships: character.relationships || ''
    });
    setIsEditDialogOpen(true);
  };

  const getRarityColor = (traits: string[]) => {
    if (!traits || traits.length === 0) return 'bg-gray-500';
    if (traits.length <= 2) return 'bg-green-500';
    if (traits.length <= 4) return 'bg-blue-500';
    if (traits.length <= 6) return 'bg-purple-500';
    return 'bg-golden-light';
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">{t('characters.loading')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">{t('characters.character_gallery')}</h2>
          <p className="text-muted-foreground">{t('characters.gallery_description')}</p>
        </div>
        {user && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-primary to-secondary hover:from-primary/80 hover:to-secondary/80">
                <Plus className="h-4 w-4 mr-2" />
                {t('characters.create_character')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{t('characters.create_character')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t('characters.character_name')}</Label>
                    <Input
                      value={formData.character_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, character_name: e.target.value }))}
                      placeholder={t('characters.name_placeholder')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('characters.age')}</Label>
                    <Input
                      type="number"
                      min="18"
                      max="100"
                      value={formData.age}
                      onChange={(e) => setFormData(prev => ({ ...prev, age: parseInt(e.target.value) }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{t('characters.occupation')}</Label>
                  <Input
                    value={formData.occupation}
                    onChange={(e) => setFormData(prev => ({ ...prev, occupation: e.target.value }))}
                    placeholder={t('characters.occupation_placeholder')}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('characters.character_image')}</Label>
                  <Input
                    value={formData.character_image_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, character_image_url: e.target.value }))}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('characters.description')}</Label>
                  <Textarea
                    value={formData.character_description}
                    onChange={(e) => setFormData(prev => ({ ...prev, character_description: e.target.value }))}
                    placeholder={t('characters.description_placeholder')}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('characters.backstory')}</Label>
                  <Textarea
                    value={formData.character_backstory}
                    onChange={(e) => setFormData(prev => ({ ...prev, character_backstory: e.target.value }))}
                    placeholder={t('characters.backstory_placeholder')}
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('characters.relationships')}</Label>
                  <Textarea
                    value={formData.relationships}
                    onChange={(e) => setFormData(prev => ({ ...prev, relationships: e.target.value }))}
                    placeholder={t('characters.relationships_placeholder')}
                    rows={3}
                  />
                </div>
                <Button onClick={handleCreateCharacter} className="w-full">
                  {t('characters.create_character')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {characters.length === 0 ? (
        <div className="text-center py-12">
          <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">{t('characters.no_characters')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {characters.map((character) => (
            <Card key={character.id} className="group overflow-hidden bg-gaming-card border-gaming-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/20">
              <div className="relative">
                <div className="aspect-square overflow-hidden">
                  <img
                    src={character.character_image_url || '/placeholder.svg'}
                    alt={character.character_name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder.svg';
                    }}
                  />
                </div>
                <div className="absolute top-2 right-2 flex space-x-2">
                  {user?.id === character.user_id && (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="bg-black/50 hover:bg-black/70 text-white"
                        onClick={() => openEditDialog(character)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="bg-black/50 hover:bg-red-600 text-white"
                        onClick={() => handleDeleteCharacter(character.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
                <div className={`absolute top-2 left-2 w-3 h-3 rounded-full ${getRarityColor(character.personality_traits)}`} />
              </div>

              <div className="p-4 space-y-3">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{character.character_name}</h3>
                  <div className="flex items-center text-sm text-muted-foreground space-x-2">
                    <Calendar className="h-3 w-3" />
                    <span>{character.age} {t('characters.years_old')}</span>
                    {character.occupation && (
                      <>
                        <span>•</span>
                        <Briefcase className="h-3 w-3" />
                        <span>{character.occupation}</span>
                      </>
                    )}
                  </div>
                </div>

                {character.character_description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {character.character_description}
                  </p>
                )}

                {character.personality_traits && character.personality_traits.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {character.personality_traits.slice(0, 3).map((trait, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {trait}
                      </Badge>
                    ))}
                    {character.personality_traits.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{character.personality_traits.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={character.profiles?.avatar_url} />
                      <AvatarFallback className="text-xs">
                        {character.profiles?.username?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-muted-foreground">
                      {character.profiles?.username}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedCharacter(character)}
                  >
                    {t('characters.view_details')}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Character Details Dialog */}
      <Dialog open={!!selectedCharacter} onOpenChange={() => setSelectedCharacter(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedCharacter && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl">{selectedCharacter.character_name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <img
                    src={selectedCharacter.character_image_url || '/placeholder.svg'}
                    alt={selectedCharacter.character_name}
                    className="w-32 h-32 rounded-lg object-cover"
                  />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedCharacter.age} {t('characters.years_old')}</span>
                    </div>
                    {selectedCharacter.occupation && (
                      <div className="flex items-center space-x-2">
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedCharacter.occupation}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={selectedCharacter.profiles?.avatar_url} />
                        <AvatarFallback className="text-xs">
                          {selectedCharacter.profiles?.username?.[0] || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{t('characters.created_by')} {selectedCharacter.profiles?.username}</span>
                    </div>
                  </div>
                </div>

                {selectedCharacter.character_description && (
                  <div>
                    <h4 className="font-semibold mb-2">{t('characters.description')}</h4>
                    <p className="text-muted-foreground">{selectedCharacter.character_description}</p>
                  </div>
                )}

                {selectedCharacter.character_backstory && (
                  <div>
                    <h4 className="font-semibold mb-2">{t('characters.backstory')}</h4>
                    <p className="text-muted-foreground">{selectedCharacter.character_backstory}</p>
                  </div>
                )}

                {selectedCharacter.personality_traits && selectedCharacter.personality_traits.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">{t('characters.personality_traits')}</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedCharacter.personality_traits.map((trait, index) => (
                        <Badge key={index} variant="secondary">
                          {trait}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {selectedCharacter.relationships && (
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center">
                      <Heart className="h-4 w-4 mr-2" />
                      {t('characters.relationships')}
                    </h4>
                    <p className="text-muted-foreground">{selectedCharacter.relationships}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Character Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('characters.edit_character')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('characters.character_name')}</Label>
                <Input
                  value={formData.character_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, character_name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('characters.age')}</Label>
                <Input
                  type="number"
                  min="18"
                  max="100"
                  value={formData.age}
                  onChange={(e) => setFormData(prev => ({ ...prev, age: parseInt(e.target.value) }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('characters.occupation')}</Label>
              <Input
                value={formData.occupation}
                onChange={(e) => setFormData(prev => ({ ...prev, occupation: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('characters.character_image')}</Label>
              <Input
                value={formData.character_image_url}
                onChange={(e) => setFormData(prev => ({ ...prev, character_image_url: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('characters.description')}</Label>
              <Textarea
                value={formData.character_description}
                onChange={(e) => setFormData(prev => ({ ...prev, character_description: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('characters.backstory')}</Label>
              <Textarea
                value={formData.character_backstory}
                onChange={(e) => setFormData(prev => ({ ...prev, character_backstory: e.target.value }))}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('characters.relationships')}</Label>
              <Textarea
                value={formData.relationships}
                onChange={(e) => setFormData(prev => ({ ...prev, relationships: e.target.value }))}
                rows={3}
              />
            </div>
            <Button onClick={handleUpdateCharacter} className="w-full">
              {t('characters.update_character')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CharacterGallery;