import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useSimpleNotifications } from "@/hooks/useSimpleNotifications";
import { Bell, Volume2, Mail, Settings } from "lucide-react";
import { useTranslation } from 'react-i18next';

export const TranslatedNotificationSettings = () => {
  const { t } = useTranslation();
  const { 
    settings, 
    setSettings, 
    hasPermission, 
    isAway, 
    requestPermissions,
    playNotificationSound
  } = useSimpleNotifications();

  const testNotification = () => {
    if (!hasPermission) {
      requestPermissions();
      return;
    }

    // Test desktop notification
    new Notification(t('chat.test_notifications'), {
      body: t('chat.new_message_received'),
      icon: '/favicon.ico'
    });

    // Test sound
    playNotificationSound('message');
  };

  return (
    <Card className="p-6 bg-gaming-card border-gaming-border">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Bell className="h-5 w-5 text-neon-teal" />
          <h3 className="text-lg font-semibold text-foreground">{t('chat.notification_settings')}</h3>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={isAway ? "destructive" : "default"}>
            {isAway ? t('common.away') : t('common.online')}
          </Badge>
          {hasPermission ? (
            <Badge variant="default" className="bg-green-500">{t('common.enabled')}</Badge>
          ) : (
            <Badge variant="destructive">{t('common.disabled')}</Badge>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {/* Desktop Notifications */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Bell className="h-4 w-4 text-neon-teal" />
              <div>
                <Label className="text-foreground font-medium">{t('chat.desktop_notifications')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('chat.desktop_notifications')}
                </p>
              </div>
            </div>
            <Switch
              checked={settings.desktop}
              onCheckedChange={(checked) => {
                if (checked && !hasPermission) {
                  requestPermissions();
                } else {
                  setSettings(prev => ({ ...prev, desktop: checked }));
                }
              }}
            />
          </div>

          {!hasPermission && settings.desktop && (
            <div className="ml-7 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <p className="text-sm text-yellow-600">
                {t('chat.browser_not_supported')}
                <Button 
                  variant="link" 
                  className="p-0 h-auto text-yellow-600 underline ml-1"
                  onClick={requestPermissions}
                >
                  {t('chat.enable_notifications')}
                </Button>
              </p>
            </div>
          )}
        </div>

        {/* Sound Alerts */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Volume2 className="h-4 w-4 text-neon-teal" />
            <div>
              <Label className="text-foreground font-medium">{t('chat.sound_alerts')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('chat.sound_alerts')}
              </p>
            </div>
          </div>
          <Switch
            checked={settings.sound}
            onCheckedChange={(checked) => 
              setSettings(prev => ({ ...prev, sound: checked }))
            }
          />
        </div>

        {/* Email Notifications */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Mail className="h-4 w-4 text-neon-teal" />
            <div>
              <Label className="text-foreground font-medium">{t('chat.email_notifications')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('chat.email_notifications')}
              </p>
            </div>
          </div>
          <Switch
            checked={settings.email}
            onCheckedChange={(checked) => 
              setSettings(prev => ({ ...prev, email: checked }))
            }
          />
        </div>

        {/* Away Timeout */}
        <div className="space-y-2">
          <Label className="text-foreground font-medium">{t('chat.away_timeout')}</Label>
          <p className="text-sm text-muted-foreground">
            {t('chat.away_timeout')}
          </p>
          <Input
            type="number"
            min="1"
            max="60"
            value={settings.awayTimeout}
            onChange={(e) => 
              setSettings(prev => ({ 
                ...prev, 
                awayTimeout: parseInt(e.target.value) || 5 
              }))
            }
            className="bg-gaming-dark border-gaming-border w-32"
          />
        </div>

        {/* Test Notifications */}
        <div className="pt-4 border-t border-gaming-border">
          <Button
            onClick={testNotification}
            variant="outline"
            className="border-neon-teal text-neon-teal hover:bg-neon-teal hover:text-white"
          >
            <Settings className="h-4 w-4 mr-2" />
            {t('chat.test_notifications')}
          </Button>
        </div>
      </div>
    </Card>
  );
};