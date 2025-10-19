import { useState, useEffect } from 'react';
import { useCustomAuth } from '@/hooks/useCustomAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Power, Shield, Loader2, Server } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Navigate } from 'react-router-dom';

const KillSwitchControl = () => {
  const { user, session_token, loading: authLoading } = useCustomAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [killSwitchActive, setKillSwitchActive] = useState(false);
  const [linuxServerStatus, setLinuxServerStatus] = useState<{
    success: boolean;
    error: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user?.id) {
        setIsAdmin(false);
        setCheckingAdmin(false);
        return;
      }

      try {
        // Only allow access to specific email
        const { data: userData } = await supabase
          .from('custom_users')
          .select('email')
          .eq('id', user.id)
          .single();

        const isAuthorized = userData?.email === 'emilfrobergww@gmail.com';
        setIsAdmin(isAuthorized);
      } catch (error) {
        console.error('Error checking access:', error);
        setIsAdmin(false);
      } finally {
        setCheckingAdmin(false);
      }
    };

    checkAdminStatus();
  }, [user?.id]);

  useEffect(() => {
    const fetchStatus = async () => {
      if (!isAdmin || !session_token) return;

      try {
        const { data, error } = await supabase.functions.invoke('kill-switch', {
          body: { action: 'status' },
          headers: {
            Authorization: `Bearer ${session_token}`
          }
        });

        if (error) throw error;
        setKillSwitchActive(data.active);
        if (data.linux_server) {
          setLinuxServerStatus(data.linux_server);
        }
      } catch (error) {
        console.error('Error fetching kill switch status:', error);
      }
    };

    fetchStatus();
  }, [isAdmin, session_token]);

  const toggleKillSwitch = async () => {
    if (!session_token) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('kill-switch', {
        body: { 
          action: 'toggle',
          active: !killSwitchActive 
        },
        headers: {
          Authorization: `Bearer ${session_token}`
        }
      });

      if (error) throw error;

      setKillSwitchActive(data.active);
      setLinuxServerStatus(data.linux_server || null);
      
      const linuxStatus = data.linux_server?.success 
        ? '✅ Linux server updated' 
        : data.linux_server?.error 
          ? `⚠️ Linux server: ${data.linux_server.error}`
          : '⚠️ Linux server not configured';
      
      toast({
        title: data.active ? 'Kill Switch Activated' : 'Kill Switch Deactivated',
        description: (
          <div className="space-y-1">
            <p>{data.active 
              ? 'Website is now offline for all users.' 
              : 'Website is now accessible to all users.'}</p>
            <p className="text-sm text-muted-foreground">{linuxStatus}</p>
          </div>
        ),
      });
    } catch (error: any) {
      console.error('Error toggling kill switch:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to toggle kill switch',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || checkingAdmin) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <Card className="p-8 bg-gaming-card border-gaming-border">
          <Loader2 className="h-8 w-8 animate-spin text-neon-purple" />
        </Card>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center bg-gaming-card border-red-500">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-4">
            Access Denied
          </h1>
          <p className="text-muted-foreground">
            This emergency control panel is restricted to authorized personnel only.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full p-8 bg-gaming-card border-gaming-border">
        <div className="flex items-center justify-center mb-6">
          <Shield className="h-12 w-12 text-neon-purple mr-4" />
          <h1 className="text-3xl font-bold text-foreground">Emergency Kill Switch</h1>
        </div>

        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 mb-6">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-6 w-6 text-red-500 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-red-400 mb-2">Warning</h3>
              <p className="text-muted-foreground">
                Activating the kill switch will immediately shut down the website and send shutdown commands to the Linux server.
                Use this only in emergency situations.
              </p>
            </div>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div className={`p-4 rounded-lg border ${
            killSwitchActive 
              ? 'bg-red-500/10 border-red-500/30' 
              : 'bg-green-500/10 border-green-500/30'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Website Status</p>
                <p className={`font-semibold ${killSwitchActive ? 'text-red-400' : 'text-green-400'}`}>
                  {killSwitchActive ? 'OFFLINE' : 'ONLINE'}
                </p>
              </div>
              <Power className={`h-8 w-8 ${killSwitchActive ? 'text-red-400' : 'text-green-400'}`} />
            </div>
          </div>

          <div className={`p-4 rounded-lg border ${
            linuxServerStatus?.success 
              ? (killSwitchActive ? 'bg-red-500/10 border-red-500/30' : 'bg-green-500/10 border-green-500/30')
              : 'bg-yellow-500/10 border-yellow-500/30'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Linux Server</p>
                <p className={`font-semibold ${
                  linuxServerStatus?.success 
                    ? (killSwitchActive ? 'text-red-400' : 'text-green-400')
                    : 'text-yellow-400'
                }`}>
                  {linuxServerStatus?.success ? (
                    killSwitchActive ? 'SHUTDOWN' : 'RUNNING'
                  ) : linuxServerStatus?.error ? (
                    'ERROR'
                  ) : (
                    'NOT CONFIGURED'
                  )}
                </p>
                {linuxServerStatus?.error && (
                  <p className="text-xs text-yellow-400 mt-1">{linuxServerStatus.error}</p>
                )}
              </div>
              <Server className={`h-8 w-8 ${
                linuxServerStatus?.success 
                  ? (killSwitchActive ? 'text-red-400' : 'text-green-400')
                  : 'text-yellow-400'
              }`} />
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center space-y-6">
          <Button
            onClick={toggleKillSwitch}
            disabled={loading}
            size="lg"
            variant={killSwitchActive ? "default" : "destructive"}
            className="w-full max-w-xs"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Power className="h-5 w-5 mr-2" />
                {killSwitchActive ? 'Restore All Services' : 'Activate Kill Switch'}
              </>
            )}
          </Button>
        </div>

        <div className="mt-8 pt-6 border-t border-gaming-border">
          <div className="space-y-2 text-xs text-muted-foreground">
            <p>• This action is logged and requires administrator privileges</p>
            <p>• Website shutdown is immediate</p>
            <p>• Linux server commands are sent via webhook</p>
            <p>• Discord notifications are sent (if configured)</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default KillSwitchControl;
