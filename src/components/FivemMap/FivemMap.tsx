import { useState, useEffect } from "react";
import { MapContainer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { TileLayerWrapper } from "./TileLayerWrapper";
import { CustomCRS } from "./CustomCRS";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Settings, RefreshCw, Loader2 } from "lucide-react";

import "leaflet/dist/leaflet.css";

// Fix for default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface FivemMapProps {
  assetUrl?: string;
  minZoom?: number;
  maxZoom?: number;
  showSettings?: boolean;
  className?: string;
}

interface MapSettings {
  assetUrl: string;
  minZoom: number;
  maxZoom: number;
  defaultZoom: number;
  showPlayerMarkers: boolean;
}

// Component to handle map resize when container changes
function MapResizer() {
  const map = useMap();
  
  useEffect(() => {
    setTimeout(() => {
      map.invalidateSize();
    }, 100);
  }, [map]);
  
  return null;
}

export const FivemMap = ({
  assetUrl: defaultAssetUrl = "https://tiles.gtamap.xyz/tiles/atlas",
  minZoom: defaultMinZoom = 0,
  maxZoom: defaultMaxZoom = 5,
  showSettings = true,
  className = "",
}: FivemMapProps) => {
  const [settings, setSettings] = useState<MapSettings>({
    assetUrl: defaultAssetUrl,
    minZoom: defaultMinZoom,
    maxZoom: defaultMaxZoom,
    defaultZoom: 3,
    showPlayerMarkers: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchMapSettings();
  }, []);

  const fetchMapSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("server_settings")
        .select("setting_value")
        .eq("setting_key", "fivem_map_settings")
        .maybeSingle();

      if (error) throw error;
      
      if (data?.setting_value) {
        const savedSettings = data.setting_value as unknown as MapSettings;
        setSettings({
          assetUrl: savedSettings.assetUrl || defaultAssetUrl,
          minZoom: savedSettings.minZoom ?? defaultMinZoom,
          maxZoom: savedSettings.maxZoom ?? defaultMaxZoom,
          defaultZoom: savedSettings.defaultZoom ?? 3,
          showPlayerMarkers: savedSettings.showPlayerMarkers ?? true,
        });
      }
    } catch (error) {
      console.error("Error fetching map settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const saveMapSettings = async () => {
    setSaving(true);
    try {
      const { data: existing } = await supabase
        .from("server_settings")
        .select("id")
        .eq("setting_key", "fivem_map_settings")
        .maybeSingle();

      const settingsValue = {
        assetUrl: settings.assetUrl,
        minZoom: settings.minZoom,
        maxZoom: settings.maxZoom,
        defaultZoom: settings.defaultZoom,
        showPlayerMarkers: settings.showPlayerMarkers,
      };

      if (existing) {
        const { error } = await supabase
          .from("server_settings")
          .update({
            setting_value: settingsValue,
            updated_at: new Date().toISOString(),
          })
          .eq("setting_key", "fivem_map_settings");
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("server_settings")
          .insert([{
            setting_key: "fivem_map_settings",
            setting_value: settingsValue,
          }]);
        if (error) throw error;
      }

      toast({
        title: "Indstillinger gemt",
        description: "Kortindstillingerne er blevet gemt.",
      });
      setShowSettingsPanel(false);
    } catch (error) {
      console.error("Error saving map settings:", error);
      toast({
        title: "Fejl",
        description: "Kunne ikke gemme kortindstillingerne.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-96 bg-gaming-card rounded-lg border border-gaming-border ${className}`}>
        <div className="flex items-center gap-2 text-muted-foreground">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>Indlæser kort...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {showSettings && (
        <div className="absolute top-4 right-4 z-[1000]">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowSettingsPanel(!showSettingsPanel)}
            className="bg-gaming-card border-gaming-border hover:bg-gaming-darker"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      )}

      {showSettingsPanel && (
        <Card className="absolute top-16 right-4 z-[1000] p-4 w-80 bg-gaming-card border-gaming-border">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Kortindstillinger
          </h3>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tile URL</Label>
              <Input
                value={settings.assetUrl}
                onChange={(e) => setSettings({ ...settings, assetUrl: e.target.value })}
                placeholder="https://tiles.gtamap.xyz/tiles/atlas"
                className="bg-gaming-dark border-gaming-border"
              />
              <p className="text-xs text-muted-foreground">
                Standard: https://tiles.gtamap.xyz/tiles/atlas
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Min Zoom</Label>
                <Input
                  type="number"
                  value={settings.minZoom}
                  onChange={(e) => setSettings({ ...settings, minZoom: parseInt(e.target.value) || 0 })}
                  min={0}
                  max={10}
                  className="bg-gaming-dark border-gaming-border"
                />
              </div>
              <div className="space-y-2">
                <Label>Max Zoom</Label>
                <Input
                  type="number"
                  value={settings.maxZoom}
                  onChange={(e) => setSettings({ ...settings, maxZoom: parseInt(e.target.value) || 5 })}
                  min={0}
                  max={10}
                  className="bg-gaming-dark border-gaming-border"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Default Zoom</Label>
              <Input
                type="number"
                value={settings.defaultZoom}
                onChange={(e) => setSettings({ ...settings, defaultZoom: parseInt(e.target.value) || 3 })}
                min={settings.minZoom}
                max={settings.maxZoom}
                className="bg-gaming-dark border-gaming-border"
              />
            </div>

            <Button
              onClick={saveMapSettings}
              disabled={saving}
              className="w-full"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Gemmer...
                </>
              ) : (
                "Gem indstillinger"
              )}
            </Button>
          </div>
        </Card>
      )}

      <div 
        className="w-full h-[600px] rounded-lg overflow-hidden border border-gaming-border"
        style={{ backgroundColor: "#0fa7d0" }}
      >
        <MapContainer
          key={`${settings.assetUrl}-${settings.minZoom}-${settings.maxZoom}`}
          style={{ height: "100%", width: "100%", backgroundColor: "inherit" }}
          crs={CustomCRS}
          minZoom={settings.minZoom}
          maxZoom={settings.maxZoom}
          center={[0, 0]}
          preferCanvas={true}
          zoom={settings.defaultZoom}
        >
          <MapResizer />
          <TileLayerWrapper
            keepBuffer={64}
            noWrap={true}
            url={`${settings.assetUrl}/{z}/{x}/{y}.jpg`}
            minZoom={settings.minZoom}
            maxZoom={settings.maxZoom}
          />
        </MapContainer>
      </div>
    </div>
  );
};

export default FivemMap;
