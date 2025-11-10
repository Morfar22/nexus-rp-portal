import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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

// Keyboard layout definition - each row of keys
const keyboardLayout = [
  // Number row
  ['Esc', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', 'Backspace'],
  // Top letter row
  ['Tab', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '[', ']', '\\'],
  // Home row
  ['Caps', 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';', "'", 'Enter'],
  // Bottom row
  ['Left Shift', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', '/', 'Right Shift'],
  // Space row
  ['Ctrl', 'Alt', 'Space', 'Alt', 'Ctrl']
];

const KeyboardKey = ({ 
  keyName, 
  keybind, 
  isWide = false, 
  isExtraWide = false 
}: { 
  keyName: string; 
  keybind?: Keybind; 
  isWide?: boolean;
  isExtraWide?: boolean;
}) => {
  const getCategoryColor = (category?: string) => {
    if (!category) return 'bg-gaming-darker/50 border-gaming-border hover:border-gaming-border/80';
    
    const colors: Record<string, string> = {
      general: 'bg-blue-500/20 border-blue-500/50 hover:border-blue-500 hover:shadow-blue-500/50',
      vehicle: 'bg-green-500/20 border-green-500/50 hover:border-green-500 hover:shadow-green-500/50',
      communication: 'bg-purple-500/20 border-purple-500/50 hover:border-purple-500 hover:shadow-purple-500/50',
      emotes: 'bg-pink-500/20 border-pink-500/50 hover:border-pink-500 hover:shadow-pink-500/50',
      movement: 'bg-orange-500/20 border-orange-500/50 hover:border-orange-500 hover:shadow-orange-500/50',
    };
    return colors[category] || 'bg-gray-500/20 border-gray-500/50 hover:border-gray-500 hover:shadow-gray-500/50';
  };

  const getKeyWidth = () => {
    if (keyName === 'Space') return 'w-64';
    if (keyName === 'Backspace' || keyName === 'Enter') return 'w-20';
    if (keyName === 'Tab' || keyName === 'Caps') return 'w-16';
    if (keyName.includes('Shift')) return 'w-24';
    if (isExtraWide) return 'w-24';
    if (isWide) return 'w-16';
    return 'w-12';
  };

  const KeyContent = (
    <div 
      className={`
        relative rounded border-2 transition-all duration-200 cursor-pointer
        h-12 flex items-center justify-center
        ${getKeyWidth()}
        ${getCategoryColor(keybind?.category)}
        ${keybind ? 'hover:scale-105 hover:shadow-lg animate-fade-in' : 'opacity-50'}
      `}
    >
      <div className="text-center">
        <div className={`font-bold ${keyName.length > 3 ? 'text-xs' : 'text-sm'} text-foreground`}>
          {keyName}
        </div>
        {keybind && (
          <div className="text-[10px] text-muted-foreground font-medium mt-0.5 truncate max-w-full px-1">
            {keybind.action_name}
          </div>
        )}
      </div>
    </div>
  );

  if (!keybind) {
    return KeyContent;
  }

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          {KeyContent}
        </TooltipTrigger>
        <TooltipContent 
          side="top" 
          className="max-w-xs p-4 bg-gaming-card border-gaming-border shadow-xl animate-scale-in"
        >
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-foreground">{keyName}</span>
              <Badge variant="outline" className="capitalize">
                {keybind.category}
              </Badge>
            </div>
            <p className="font-semibold text-primary">{keybind.action_name}</p>
            {keybind.description && (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {keybind.description}
              </p>
            )}
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

  // Create a map for quick keybind lookup
  const keybindMap = new Map(
    keybinds.map(kb => [kb.key_name.toLowerCase(), kb])
  );

  // Get keybind for a key name
  const getKeybind = (keyName: string): Keybind | undefined => {
    return keybindMap.get(keyName.toLowerCase());
  };

  const categories = Array.from(new Set(keybinds.map(k => k.category)));

  return (
    <div className="min-h-screen bg-gradient-hero">
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

        <Card className="p-8 bg-gaming-card border-gaming-border overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Legend */}
              <div className="flex flex-wrap items-center justify-center gap-4 mb-8 pb-6 border-b border-gaming-border">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-blue-500/20 border-2 border-blue-500/50"></div>
                  <span className="text-sm text-muted-foreground">General</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-green-500/20 border-2 border-green-500/50"></div>
                  <span className="text-sm text-muted-foreground">Vehicle</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-purple-500/20 border-2 border-purple-500/50"></div>
                  <span className="text-sm text-muted-foreground">Communication</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-pink-500/20 border-2 border-pink-500/50"></div>
                  <span className="text-sm text-muted-foreground">Emotes</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-orange-500/20 border-2 border-orange-500/50"></div>
                  <span className="text-sm text-muted-foreground">Movement</span>
                </div>
              </div>

              {/* Keyboard Layout */}
              <div className="inline-block mx-auto">
                <div className="space-y-2 p-6 bg-gaming-darker/30 rounded-xl border border-gaming-border/50">
                  {keyboardLayout.map((row, rowIndex) => (
                    <div key={rowIndex} className="flex gap-2 justify-center">
                      {row.map((key, keyIndex) => (
                        <KeyboardKey
                          key={`${rowIndex}-${keyIndex}`}
                          keyName={key}
                          keybind={getKeybind(key)}
                          isWide={key === 'Tab' || key === 'Caps'}
                          isExtraWide={key.includes('Shift') || key === 'Backspace' || key === 'Enter'}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {/* Active Keybinds List */}
              <div className="mt-8 space-y-4">
                <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
                  <Keyboard className="h-5 w-5 text-primary" />
                  Aktive Keybinds
                  <Badge variant="outline">{keybinds.length} taster</Badge>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {categories.map((category) => {
                    const categoryKeybinds = keybinds.filter(k => k.category === category);
                    return categoryKeybinds.map((keybind) => (
                      <div 
                        key={keybind.id}
                        className="p-3 bg-gaming-darker/50 rounded-lg border border-gaming-border hover:border-primary/50 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="px-3 py-1.5 bg-gaming-card rounded font-bold text-sm border border-gaming-border">
                            {keybind.key_name}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-foreground truncate">
                              {keybind.action_name}
                            </p>
                            <p className="text-xs text-muted-foreground capitalize">
                              {keybind.category}
                            </p>
                          </div>
                        </div>
                      </div>
                    ));
                  })}
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg animate-fade-in">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-200">
                <p className="font-semibold mb-1">Tip:</p>
                <p>Hold musen over tasterne på keyboardet for at se detaljeret information. Farverne indikerer forskellige kategorier af keybinds.</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
