import { useServerSettings } from '@/hooks/useServerSettings';
import { Card } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

const KillSwitch = () => {
  const { settings } = useServerSettings();

  const killSwitchActive = settings.general_settings && 'kill_switch_active' in settings.general_settings 
    ? (settings.general_settings as any).kill_switch_active 
    : false;

  if (!killSwitchActive) {
    return null;
  }

  // Kill switch is active - block entire site
  return (
    <div className="fixed inset-0 z-[9999] bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 text-center bg-gaming-card border-red-500">
        <AlertTriangle className="h-24 w-24 text-red-500 mx-auto mb-6 animate-pulse" />
        <h1 className="text-3xl font-bold text-foreground mb-4">
          Service Unavailable
        </h1>
        <p className="text-muted-foreground text-lg">
          The site is currently unavailable due to an emergency shutdown. 
          Please check back later.
        </p>
      </Card>
    </div>
  );
};

export default KillSwitch;
