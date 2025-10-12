import { useState, useEffect } from 'react';
import { useCustomAuth } from '@/hooks/useCustomAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Power, Shield, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Navigate } from 'react-router-dom';

const KillSwitchControl = () => {
  const { user, session_token, loading: authLoading } = useCustomAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [killSwitchActive, setKillSwitchActive] = useState(false);
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
      toast({
        title: data.active ? 'Kill Switch Activated' : 'Kill Switch Deactivated',
        description: data.active 
          ? 'The site is now completely shut down for all users except admins.'
          : 'The site is now accessible to all users.',
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
                Activating the kill switch will immediately shut down the entire site for all users.
                Only administrators will be able to access this control panel.
                Use this only in emergency situations.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center space-y-6">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">Current Status:</p>
            <div className={`inline-flex items-center px-4 py-2 rounded-full ${
              killSwitchActive 
                ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                : 'bg-green-500/20 text-green-400 border border-green-500/30'
            }`}>
              <Power className="h-5 w-5 mr-2" />
              <span className="font-semibold">
                {killSwitchActive ? 'SITE OFFLINE' : 'SITE ONLINE'}
              </span>
            </div>
          </div>

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
                {killSwitchActive ? 'Restore Site' : 'Activate Kill Switch'}
              </>
            )}
          </Button>
        </div>

        <div className="mt-8 pt-6 border-t border-gaming-border">
          <p className="text-xs text-muted-foreground text-center">
            This action is logged and can only be performed by administrators.
            The kill switch overrides maintenance mode.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default KillSwitchControl;
