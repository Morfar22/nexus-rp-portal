import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Settings } from "lucide-react";
import { ApplicationSettings } from "./types";

export const ApplicationSettingsPanel = () => {
  const [settings, setSettings] = useState<ApplicationSettings>({});
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('server_settings')
        .select('setting_value')
        .eq('setting_key', 'application_settings')
        .maybeSingle();

      if (error) throw error;
      setSettings((data?.setting_value as any) || {});
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const updateSettings = async (newSettings: ApplicationSettings) => {
    setLoading(true);
    try {
      const { data: existing } = await supabase
        .from('server_settings')
        .select('id')
        .eq('setting_key', 'application_settings')
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('server_settings')
          .update({
            setting_value: JSON.stringify(newSettings) as any,
            updated_at: new Date().toISOString()
          })
          .eq('setting_key', 'application_settings');
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('server_settings')
          .insert([{
            setting_key: 'application_settings',
            setting_value: JSON.stringify(newSettings) as any,
            created_by: (await supabase.auth.getUser()).data.user?.id
          }]);
        if (error) throw error;
      }
      
      setSettings(newSettings);
      toast({
        title: "Settings Updated",
        description: "Application settings have been saved successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update application settings.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (key: keyof ApplicationSettings, value: any) => {
    const newSettings = { ...settings, [key]: value };
    updateSettings(newSettings);
  };

  return (
    <Card className="bg-gaming-card border-gaming-border">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Settings className="h-5 w-5 text-neon-purple" />
          <span>Application Settings</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base text-foreground">Accept Applications</Label>
            <div className="text-sm text-muted-foreground">
              Allow users to submit new applications
            </div>
          </div>
          <Switch
            checked={settings.accept_applications !== false}
            onCheckedChange={(checked) => handleSettingChange('accept_applications', checked)}
            disabled={loading}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base text-foreground">Multiple Applications</Label>
            <div className="text-sm text-muted-foreground">
              Allow users to submit multiple applications
            </div>
          </div>
          <Switch
            checked={settings.multiple_applications_allowed || false}
            onCheckedChange={(checked) => handleSettingChange('multiple_applications_allowed', checked)}
            disabled={loading}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base text-foreground">Auto Close Applications</Label>
            <div className="text-sm text-muted-foreground">
              Automatically close applications after approval/rejection
            </div>
          </div>
          <Switch
            checked={settings.auto_close_applications || false}
            onCheckedChange={(checked) => handleSettingChange('auto_close_applications', checked)}
            disabled={loading}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base text-foreground">Age Verification Required</Label>
            <div className="text-sm text-muted-foreground">
              Require users to verify they are 18+ before applying
            </div>
          </div>
          <Switch
            checked={settings.require_age_verification || false}
            onCheckedChange={(checked) => handleSettingChange('require_age_verification', checked)}
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-base text-foreground">Application Cooldown (Days)</Label>
          <div className="text-sm text-muted-foreground mb-2">
            How long users must wait before reapplying after rejection
          </div>
          <Input
            type="number"
            min="0"
            max="365"
            value={settings.cooldown_days || 0}
            onChange={(e) => handleSettingChange('cooldown_days', parseInt(e.target.value) || 0)}
            disabled={loading}
            className="w-32 bg-gaming-dark border-gaming-border text-foreground"
          />
        </div>
      </CardContent>
    </Card>
  );
};