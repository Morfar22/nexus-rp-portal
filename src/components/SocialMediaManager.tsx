import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useCustomAuth } from '@/hooks/useCustomAuth';
import { Instagram, Facebook, Youtube, Music } from 'lucide-react';
import { Loader2 } from 'lucide-react';

interface SocialMediaSettings {
  instagram_enabled: boolean;
  instagram_url: string;
  facebook_enabled: boolean;
  facebook_url: string;
  tiktok_enabled: boolean;
  tiktok_url: string;
  youtube_enabled: boolean;
  youtube_url: string;
  show_in_footer: boolean;
  show_in_hero: boolean;
  animation_enabled: boolean;
}

const defaultSettings: SocialMediaSettings = {
  instagram_enabled: false,
  instagram_url: '',
  facebook_enabled: false,
  facebook_url: '',
  tiktok_enabled: false,
  tiktok_url: '',
  youtube_enabled: false,
  youtube_url: '',
  show_in_footer: true,
  show_in_hero: false,
  animation_enabled: true,
};

export default function SocialMediaManager() {
  const [settings, setSettings] = useState<SocialMediaSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { user } = useCustomAuth();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('server_settings')
        .select('setting_value')
        .eq('setting_key', 'social_media_settings')
        .maybeSingle();

      if (error) throw error;

      if (data?.setting_value) {
        setSettings({ ...defaultSettings, ...(data.setting_value as any) });
      }
    } catch (error) {
      console.error('Error fetching social media settings:', error);
      toast({
        title: "Error",
        description: "Failed to load social media settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('server_settings')
        .upsert({
          setting_key: 'social_media_settings',
          setting_value: settings as any,
          created_by: user?.id,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'setting_key'
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Social media settings saved successfully",
      });
    } catch (error) {
      console.error('Error saving social media settings:', error);
      toast({
        title: "Error",
        description: "Failed to save social media settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: keyof SocialMediaSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Instagram className="h-5 w-5" />
            Social Media Settings
          </CardTitle>
          <CardDescription>
            Manage your social media links and display settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Instagram Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Instagram className="h-4 w-4 text-pink-500" />
                <Label htmlFor="instagram-enabled">Instagram</Label>
              </div>
              <Switch
                id="instagram-enabled"
                checked={settings.instagram_enabled}
                onCheckedChange={(checked) => updateSetting('instagram_enabled', checked)}
              />
            </div>
            {settings.instagram_enabled && (
              <div className="pl-6">
                <Label htmlFor="instagram-url">Instagram URL</Label>
                <Input
                  id="instagram-url"
                  type="url"
                  placeholder="https://instagram.com/yourusername"
                  value={settings.instagram_url}
                  onChange={(e) => updateSetting('instagram_url', e.target.value)}
                />
              </div>
            )}
          </div>

          <Separator />

          {/* Facebook Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Facebook className="h-4 w-4 text-blue-600" />
                <Label htmlFor="facebook-enabled">Facebook</Label>
              </div>
              <Switch
                id="facebook-enabled"
                checked={settings.facebook_enabled}
                onCheckedChange={(checked) => updateSetting('facebook_enabled', checked)}
              />
            </div>
            {settings.facebook_enabled && (
              <div className="pl-6">
                <Label htmlFor="facebook-url">Facebook URL</Label>
                <Input
                  id="facebook-url"
                  type="url"
                  placeholder="https://facebook.com/yourpage"
                  value={settings.facebook_url}
                  onChange={(e) => updateSetting('facebook_url', e.target.value)}
                />
              </div>
            )}
          </div>

          <Separator />

          {/* TikTok Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Music className="h-4 w-4 text-black dark:text-white" />
                <Label htmlFor="tiktok-enabled">TikTok</Label>
              </div>
              <Switch
                id="tiktok-enabled"
                checked={settings.tiktok_enabled}
                onCheckedChange={(checked) => updateSetting('tiktok_enabled', checked)}
              />
            </div>
            {settings.tiktok_enabled && (
              <div className="pl-6">
                <Label htmlFor="tiktok-url">TikTok URL</Label>
                <Input
                  id="tiktok-url"
                  type="url"
                  placeholder="https://tiktok.com/@yourusername"
                  value={settings.tiktok_url}
                  onChange={(e) => updateSetting('tiktok_url', e.target.value)}
                />
              </div>
            )}
          </div>

          <Separator />

          {/* YouTube Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Youtube className="h-4 w-4 text-red-600" />
                <Label htmlFor="youtube-enabled">YouTube</Label>
              </div>
              <Switch
                id="youtube-enabled"
                checked={settings.youtube_enabled}
                onCheckedChange={(checked) => updateSetting('youtube_enabled', checked)}
              />
            </div>
            {settings.youtube_enabled && (
              <div className="pl-6">
                <Label htmlFor="youtube-url">YouTube URL</Label>
                <Input
                  id="youtube-url"
                  type="url"
                  placeholder="https://youtube.com/@yourchannel"
                  value={settings.youtube_url}
                  onChange={(e) => updateSetting('youtube_url', e.target.value)}
                />
              </div>
            )}
          </div>

          <Separator />

          {/* Display Settings */}
          <div className="space-y-4">
            <h4 className="font-semibold">Display Settings</h4>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="show-footer">Show in Footer</Label>
              <Switch
                id="show-footer"
                checked={settings.show_in_footer}
                onCheckedChange={(checked) => updateSetting('show_in_footer', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="show-hero">Show in Hero Section</Label>
              <Switch
                id="show-hero"
                checked={settings.show_in_hero}
                onCheckedChange={(checked) => updateSetting('show_in_hero', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="animation-enabled">Enable Animations</Label>
              <Switch
                id="animation-enabled"
                checked={settings.animation_enabled}
                onCheckedChange={(checked) => updateSetting('animation_enabled', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={saveSettings}
          disabled={saving}
          className="bg-gradient-primary hover:opacity-90"
        >
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Settings
        </Button>
      </div>
    </div>
  );
}