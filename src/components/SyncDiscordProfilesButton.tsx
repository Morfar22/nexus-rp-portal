import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const SyncDiscordProfilesButton = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSync = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-discord-profiles');

      if (error) throw error;

      toast({
        title: "Synkronisering fuldført",
        description: `${data.updated} brugere opdateret, ${data.failed} fejlede`,
      });
    } catch (error) {
      console.error('Sync error:', error);
      toast({
        title: "Fejl",
        description: "Kunne ikke synkronisere Discord-profiler",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleSync}
      disabled={isLoading}
      variant="outline"
      size="sm"
    >
      <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
      Synkroniser Discord-profiler
    </Button>
  );
};
