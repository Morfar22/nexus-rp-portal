import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Server, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const CFXServerSettings = () => {
  const [cfxServerCode, setCfxServerCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchCFXSettings();
  }, []);

  const fetchCFXSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('server_settings')
        .select('setting_value')
        .eq('setting_key', 'cfxre_server_code')
        .maybeSingle();

      if (error) throw error;
      if (data?.setting_value) {
        setCfxServerCode(String(data.setting_value));
      }
    } catch (error) {
      console.error('Error fetching CFX settings:', error);
    }
  };

  const testConnection = async () => {
    if (!cfxServerCode.trim()) {
      toast({
        title: "Fejl",
        description: "Indtast venligst en CFX.re server kode",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setTestResult(null);

    try {
      const response = await fetch(
        `https://servers-frontend.fivem.net/api/servers/single/${cfxServerCode.trim()}`
      );

      if (!response.ok) {
        throw new Error(`API svarede med status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data?.Data) {
        setTestResult({
          success: true,
          serverName: data.Data.hostname,
          players: data.Data.clients || 0,
          maxPlayers: data.Data.sv_maxclients || 64,
          status: 'online',
          gametype: data.Data.gametype,
          mapname: data.Data.mapname,
          resources: data.Data.resources?.length || 0,
          tags: data.Data.tags?.length || 0
        });

        toast({
          title: "Forbindelse OK!",
          description: `Forbundet til ${data.Data.hostname}`,
        });
      } else {
        throw new Error("Ingen server data modtaget");
      }
    } catch (error) {
      console.error('Test connection error:', error);
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : "Ukendt fejl"
      });

      toast({
        title: "Forbindelsesfejl",
        description: "Kunne ikke forbinde til serveren. Tjek at CFX.re koden er korrekt.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveCFXSettings = async () => {
    if (!cfxServerCode.trim()) {
      toast({
        title: "Fejl",
        description: "Indtast venligst en CFX.re server kode",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Check if record exists
      const { data: existingData } = await supabase
        .from('server_settings')
        .select('id')
        .eq('setting_key', 'cfxre_server_code')
        .maybeSingle();

      if (existingData) {
        // Update existing
        const { error } = await supabase
          .from('server_settings')
          .update({
            setting_value: cfxServerCode.trim(),
            updated_at: new Date().toISOString()
          })
          .eq('setting_key', 'cfxre_server_code');

        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('server_settings')
          .insert({
            setting_key: 'cfxre_server_code',
            setting_value: cfxServerCode.trim()
          });

        if (error) throw error;
      }

      toast({
        title: "Gemt!",
        description: "CFX.re server kode er gemt",
      });
    } catch (error) {
      console.error('Error saving CFX settings:', error);
      toast({
        title: "Fejl",
        description: "Kunne ikke gemme indstillingerne",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 bg-gaming-card border-gaming-border">
      <div className="flex items-center space-x-2 mb-6">
        <Server className="h-5 w-5 text-neon-purple" />
        <h2 className="text-xl font-semibold text-foreground">CFX.re Server Indstillinger</h2>
      </div>

      <Alert className="mb-6">
        <Info className="h-4 w-4" />
        <AlertDescription>
          Find din server kode på <a href="https://servers.fivem.net/" target="_blank" rel="noopener noreferrer" className="text-neon-blue hover:underline">servers.fivem.net</a>. 
          Server koden findes i URL'en når du åbner din server (f.eks. "abc123" fra servers.fivem.net/servers/detail/abc123)
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        <div>
          <Label htmlFor="cfx-code" className="text-foreground">CFX.re Server Kode</Label>
          <Input
            id="cfx-code"
            value={cfxServerCode}
            onChange={(e) => setCfxServerCode(e.target.value)}
            placeholder="abc123"
            className="mt-2 bg-gaming-dark border-gaming-border text-foreground"
            disabled={loading}
          />
          <p className="text-sm text-muted-foreground mt-1">
            Indtast kun koden, ikke hele URL'en
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={testConnection}
            disabled={loading || !cfxServerCode.trim()}
            variant="outline"
            className="border-neon-blue text-neon-blue hover:bg-neon-blue/10"
          >
            {loading ? "Tester..." : "Test Forbindelse"}
          </Button>

          <Button
            onClick={saveCFXSettings}
            disabled={loading || !cfxServerCode.trim()}
            className="bg-neon-purple hover:bg-neon-purple/80"
          >
            {loading ? "Gemmer..." : "Gem Indstillinger"}
          </Button>
        </div>

        {testResult && (
          <Alert className={testResult.success ? "border-green-500" : "border-red-500"}>
            {testResult.success ? (
              <div>
                <h3 className="font-semibold text-green-500 mb-2">✓ Forbindelse OK</h3>
                <div className="text-sm space-y-1">
                  <p><strong>Server:</strong> {testResult.serverName}</p>
                  <p><strong>Spillere:</strong> {testResult.players}/{testResult.maxPlayers}</p>
                  <p><strong>Gametype:</strong> {testResult.gametype || 'N/A'}</p>
                  <p><strong>Map:</strong> {testResult.mapname || 'N/A'}</p>
                  {testResult.resources > 0 && (
                    <p><strong>Resources:</strong> {testResult.resources}</p>
                  )}
                  {testResult.tags > 0 && (
                    <p><strong>Tags:</strong> {testResult.tags}</p>
                  )}
                  <p><strong>Status:</strong> <span className="text-green-500">Online</span></p>
                </div>
              </div>
            ) : (
              <div>
                <h3 className="font-semibold text-red-500 mb-2">✗ Forbindelsesfejl</h3>
                <p className="text-sm">{testResult.error}</p>
              </div>
            )}
          </Alert>
        )}
      </div>
    </Card>
  );
};

export default CFXServerSettings;
