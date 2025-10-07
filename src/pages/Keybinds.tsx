import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Keyboard, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Keybind {
  id: string;
  key_name: string;
  key_code: string;
  action_name: string;
  description: string | null;
  category: string;
  is_active: boolean;
  order_index: number;
}

const KeyboardKey = ({ keybind }: { keybind: Keybind }) => {
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      general: 'bg-blue-500/20 border-blue-500/50 hover:border-blue-500',
      vehicle: 'bg-green-500/20 border-green-500/50 hover:border-green-500',
      communication: 'bg-purple-500/20 border-purple-500/50 hover:border-purple-500',
      emotes: 'bg-pink-500/20 border-pink-500/50 hover:border-pink-500',
      movement: 'bg-orange-500/20 border-orange-500/50 hover:border-orange-500',
    };
    return colors[category] || 'bg-gray-500/20 border-gray-500/50 hover:border-gray-500';
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className={`
              relative p-4 rounded-lg border-2 transition-all cursor-pointer
              min-w-[100px] flex flex-col items-center justify-center gap-2
              ${getCategoryColor(keybind.category)}
              hover:scale-105 hover:shadow-lg
            `}
          >
            <div className="text-2xl font-bold text-foreground">
              {keybind.key_name}
            </div>
            <div className="text-xs text-center text-muted-foreground font-medium">
              {keybind.action_name}
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-1">
            <p className="font-semibold">{keybind.action_name}</p>
            {keybind.description && (
              <p className="text-sm text-muted-foreground">{keybind.description}</p>
            )}
            <Badge variant="outline" className="mt-2">
              {keybind.category}
            </Badge>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default function Keybinds() {
  const [keybinds, setKeybinds] = useState<Keybind[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchKeybinds = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('keybinds')
        .select('*')
        .eq('is_active', true)
        .order('order_index');

      if (error) throw error;
      setKeybinds(data || []);
    } catch (error: any) {
      console.error('Error fetching keybinds:', error);
      toast({
        title: 'Error',
        description: 'Failed to load keybinds',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeybinds();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('keybinds_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'keybinds' },
        () => {
          fetchKeybinds();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const categories = Array.from(new Set(keybinds.map(k => k.category)));

  const getKeybindsByCategory = (category: string) => {
    return keybinds.filter(k => k.category === category);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gaming-dark via-background to-gaming-dark">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Keyboard className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">Server Keybinds</h1>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Lær alle taster og kommandoer til at navigere på serveren. Hover over tasterne for at se detaljeret information.
          </p>
        </div>

        <Card className="p-6 bg-gaming-card border-gaming-border">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-2 lg:grid-cols-3 mb-6">
                <TabsTrigger value="all">Alle Taster</TabsTrigger>
                {categories.slice(0, 2).map((category) => (
                  <TabsTrigger key={category} value={category} className="capitalize">
                    {category}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="all" className="space-y-6">
                {categories.map((category) => {
                  const categoryKeybinds = getKeybindsByCategory(category);
                  return (
                    <div key={category}>
                      <h3 className="text-xl font-semibold mb-4 capitalize flex items-center gap-2">
                        <Badge variant="outline">{category}</Badge>
                        <span className="text-muted-foreground text-sm">
                          ({categoryKeybinds.length} taster)
                        </span>
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {categoryKeybinds.map((keybind) => (
                          <KeyboardKey key={keybind.id} keybind={keybind} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </TabsContent>

              {categories.map((category) => (
                <TabsContent key={category} value={category}>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {getKeybindsByCategory(category).map((keybind) => (
                      <KeyboardKey key={keybind.id} keybind={keybind} />
                    ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          )}

          <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-200">
                <p className="font-semibold mb-1">Tip:</p>
                <p>Hover over hver tast for at se detaljeret information om funktionen. Tasterne er opdelt i kategorier for lettere navigation.</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
