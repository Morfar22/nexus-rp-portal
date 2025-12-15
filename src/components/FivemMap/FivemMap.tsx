import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, MapPin, RefreshCw, Settings } from "lucide-react";
import { CustomCRS } from "./CustomCRS";

import "leaflet/dist/leaflet.css";

// Fix for default marker icon assets (Leaflet + bundlers)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
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

export const FivemMap = ({
  assetUrl: defaultAssetUrl = "https://tiles.gtamap.xyz/tiles/atlas",
  minZoom: defaultMinZoom = 0,
  maxZoom: defaultMaxZoom = 5,
  showSettings = true,
  className = "",
}: FivemMapProps) => {
  const mapElRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        const saved = data.setting_value as unknown as Partial<MapSettings>;
        setSettings((prev) => ({
          ...prev,
          assetUrl: saved.assetUrl || defaultAssetUrl,
          minZoom: saved.minZoom ?? defaultMinZoom,
          maxZoom: saved.maxZoom ?? defaultMaxZoom,
          defaultZoom: saved.defaultZoom ?? prev.defaultZoom,
          showPlayerMarkers: saved.showPlayerMarkers ?? prev.showPlayerMarkers,
        }));
      }
    } catch (e) {
      console.error("Error fetching map settings:", e);
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
          .insert([
            {
              setting_key: "fivem_map_settings",
              setting_value: settingsValue,
            },
          ]);
        if (error) throw error;
      }

      toast({
        title: "Indstillinger gemt",
        description: "Kortindstillingerne er blevet gemt.",
      });
      setShowSettingsPanel(false);
    } catch (e) {
      console.error("Error saving map settings:", e);
      toast({
        title: "Fejl",
        description: "Kunne ikke gemme kortindstillingerne.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Initialize / re-initialize Leaflet map when settings change
  useEffect(() => {
    if (loading) return;
    if (!mapElRef.current) return;

    // Cleanup existing map
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
      tileLayerRef.current = null;
    }

    const map = L.map(mapElRef.current, {
      crs: CustomCRS as unknown as L.CRS,
      minZoom: settings.minZoom,
      maxZoom: settings.maxZoom,
      zoom: settings.defaultZoom,
      center: [0, 0],
      zoomControl: true,
      preferCanvas: true,
      attributionControl: false,
    });

    const url = `${settings.assetUrl}/{z}/{x}/{y}.jpg`;
    const tiles = L.tileLayer(url, {
      minZoom: settings.minZoom,
      maxZoom: settings.maxZoom,
      noWrap: true,
      keepBuffer: 64,
    });

    tiles.addTo(map);

    // FiveM tile space bounds (matches snippet)
    const maxZoom = settings.maxZoom;
    const bounds = new L.LatLngBounds(
      map.unproject([0, 8192], maxZoom),
      map.unproject([8192, 0], maxZoom)
    );
    map.setMaxBounds(bounds);

    // Ensure proper sizing after mount
    setTimeout(() => map.invalidateSize(), 50);

    mapRef.current = map;
    tileLayerRef.current = tiles;

    return () => {
      map.remove();
      mapRef.current = null;
      tileLayerRef.current = null;
    };
  }, [loading, settings.assetUrl, settings.minZoom, settings.maxZoom, settings.defaultZoom]);

  if (loading) {
    return (
      <div
        className={`flex items-center justify-center h-96 bg-gaming-card rounded-lg border border-gaming-border ${className}`}
      >
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
            onClick={() => setShowSettingsPanel((v) => !v)}
            className="bg-gaming-card border-gaming-border hover:bg-gaming-darker"
            aria-label="Åbn kortindstillinger"
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
                onChange={(e) =>
                  setSettings((s) => ({ ...s, assetUrl: e.target.value }))
                }
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
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      minZoom: parseInt(e.target.value) || 0,
                    }))
                  }
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
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      maxZoom: parseInt(e.target.value) || 5,
                    }))
                  }
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
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    defaultZoom: parseInt(e.target.value) || 3,
                  }))
                }
                min={settings.minZoom}
                max={settings.maxZoom}
                className="bg-gaming-dark border-gaming-border"
              />
            </div>

            <Button onClick={saveMapSettings} disabled={saving} className="w-full">
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
        <div
          ref={mapElRef}
          className="w-full h-full"
          aria-label="FiveM interaktivt kort"
        />
      </div>
    </div>
  );
};

export default FivemMap;
