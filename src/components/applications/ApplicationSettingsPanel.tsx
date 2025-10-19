import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Settings } from "lucide-react";
import { useServerSettings } from "@/hooks/useServerSettings";
import { ApplicationPermissionsManager } from "./ApplicationPermissionsManager";
import { PermissionGate } from "@/components/PermissionGate";

export const ApplicationSettingsPanel = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { settings, updateSetting } = useServerSettings();

  const handleSettingChange = async (key: string, value: any) => {
    setLoading(true);
    try {
      const newApplicationSettings = { 
        ...settings.application_settings, 
        [key]: value 
      };
      await updateSetting('application_settings', newApplicationSettings);
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

  return (
    <div className="space-y-6">
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
            checked={settings.application_settings?.accept_applications !== false}
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
            checked={settings.application_settings?.multiple_applications_allowed || false}
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
            checked={settings.application_settings?.auto_close_applications || false}
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
            checked={settings.application_settings?.require_age_verification || false}
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
            value={settings.application_settings?.cooldown_days || 0}
            onChange={(e) => handleSettingChange('cooldown_days', parseInt(e.target.value) || 0)}
            disabled={loading}
            className="w-32 bg-gaming-dark border-gaming-border text-foreground"
          />
        </div>
      </CardContent>
    </Card>

    {/* Show to all staff members, not just those with specific permission */}
    <ApplicationPermissionsManager />
    </div>
  );
};