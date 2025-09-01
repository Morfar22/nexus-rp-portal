import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { MessageSquare, Search, Zap } from 'lucide-react';

interface CannedResponse {
  id: string;
  category: string;
  title: string;
  message: string;
  shortcut?: string;
}

interface CannedResponsesProps {
  onSelectResponse: (message: string) => void;
  isOpen: boolean;
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

export default function CannedResponses({ 
  onSelectResponse, 
  isOpen, 
  searchTerm, 
  onSearchChange 
}: CannedResponsesProps) {
  const [responses, setResponses] = useState<CannedResponse[]>([]);
  const [filteredResponses, setFilteredResponses] = useState<CannedResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchCannedResponses();
  }, []);

  useEffect(() => {
    if (!searchTerm) {
      setFilteredResponses(responses);
      return;
    }

    const filtered = responses.filter(response => 
      response.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      response.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      response.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      response.shortcut?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setFilteredResponses(filtered);
  }, [searchTerm, responses]);

  const fetchCannedResponses = async () => {
    try {
      const { data, error } = await supabase
        .from('canned_responses')
        .select('*')
        .eq('is_active', true)
        .order('category')
        .order('title');

      if (error) throw error;
      
      setResponses(data || []);
      setFilteredResponses(data || []);
    } catch (error) {
      console.error('Error fetching canned responses:', error);
      toast({
        title: "Error",
        description: "Failed to load canned responses",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResponseClick = (response: CannedResponse) => {
    onSelectResponse(response.message);
    onSearchChange(''); // Clear search
    toast({
      title: "Response Added",
      description: `"${response.title}" has been added to your message`,
    });
  };

  if (!isOpen) return null;

  // Group responses by category
  const groupedResponses = filteredResponses.reduce((groups, response) => {
    const category = response.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(response);
    return groups;
  }, {} as Record<string, CannedResponse[]>);

  return (
    <Card className="absolute bottom-full left-0 right-0 mb-2 bg-gaming-card border-gaming-border shadow-xl z-50 max-h-80">
      <div className="p-3 border-b border-gaming-border">
        <div className="flex items-center space-x-2">
          <MessageSquare className="h-4 w-4 text-neon-teal" />
          <span className="font-medium text-foreground">Quick Responses</span>
        </div>
        <div className="flex items-center space-x-2 mt-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search responses or type /shortcut"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="bg-gaming-dark border-gaming-border text-sm"
          />
        </div>
      </div>

      <ScrollArea className="max-h-60">
        {loading ? (
          <div className="p-4 text-center text-muted-foreground">
            Loading responses...
          </div>
        ) : filteredResponses.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            {searchTerm ? 'No responses match your search' : 'No responses available'}
          </div>
        ) : (
          <div className="p-3 space-y-3">
            {Object.entries(groupedResponses).map(([category, categoryResponses]) => (
              <div key={category}>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  {category}
                </h4>
                <div className="space-y-1">
                  {categoryResponses.map((response) => (
                    <Button
                      key={response.id}
                      variant="ghost"
                      className="w-full justify-start h-auto p-3 text-left hover:bg-gaming-darker"
                      onClick={() => handleResponseClick(response)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-foreground truncate">
                            {response.title}
                          </span>
                          {response.shortcut && (
                            <Badge 
                              variant="secondary" 
                              className="ml-2 text-xs bg-neon-teal/20 text-neon-teal"
                            >
                              <Zap className="h-3 w-3 mr-1" />
                              {response.shortcut}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {response.message}
                        </p>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </Card>
  );
}