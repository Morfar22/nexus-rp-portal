import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useCustomAuth } from "@/hooks/useCustomAuth";
import { Shield, Lock, LogOut, Monitor } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export const ProfileSecurity = () => {
  const { user } = useCustomAuth();
  const { toast } = useToast();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    fetchSessions();
  }, [user]);

  const fetchSessions = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('custom_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('last_accessed', { ascending: false });

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoadingSessions(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords don't match",
        variant: "destructive",
      });
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast({
        title: "Error",
        description: "Password must be at least 8 characters long",
        variant: "destructive",
      });
      return;
    }

    setChangingPassword(true);
    try {
      const { data, error } = await supabase.functions.invoke('reset-user-password', {
        body: {
          userId: user?.id,
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        },
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Success",
          description: "Password changed successfully",
        });
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        throw new Error(data.error || 'Failed to change password');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to change password",
        variant: "destructive",
      });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLogoutSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('custom_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Session logged out successfully",
      });
      fetchSessions();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to logout session",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Password Change */}
      <Card className="p-6 bg-gaming-card border-gaming-border">
        <div className="flex items-center space-x-3 mb-4">
          <Lock className="h-5 w-5 text-neon-purple" />
          <h3 className="text-lg font-semibold text-foreground">Change Password</h3>
        </div>
        
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <Label htmlFor="current-password" className="text-foreground">Current Password</Label>
            <Input
              id="current-password"
              type="password"
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
              className="bg-gaming-dark border-gaming-border text-foreground mt-2"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="new-password" className="text-foreground">New Password</Label>
            <Input
              id="new-password"
              type="password"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              className="bg-gaming-dark border-gaming-border text-foreground mt-2"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="confirm-password" className="text-foreground">Confirm New Password</Label>
            <Input
              id="confirm-password"
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              className="bg-gaming-dark border-gaming-border text-foreground mt-2"
              required
            />
          </div>
          
          <Button type="submit" disabled={changingPassword}>
            <Shield className="h-4 w-4 mr-2" />
            {changingPassword ? "Changing..." : "Change Password"}
          </Button>
        </form>
      </Card>

      {/* Active Sessions */}
      <Card className="p-6 bg-gaming-card border-gaming-border">
        <div className="flex items-center space-x-3 mb-4">
          <Monitor className="h-5 w-5 text-neon-purple" />
          <h3 className="text-lg font-semibold text-foreground">Active Sessions</h3>
        </div>

        {loadingSessions ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-4 bg-gaming-dark/50 rounded-lg animate-pulse">
                <div className="h-4 bg-gaming-dark rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gaming-dark rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <p className="text-muted-foreground">No active sessions</p>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <div key={session.id} className="p-4 bg-gaming-dark/30 rounded-lg flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{session.user_agent || 'Unknown Device'}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    IP: {session.ip_address || 'Unknown'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Last active: {formatDistanceToNow(new Date(session.last_accessed), { addSuffix: true })}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleLogoutSession(session.id)}
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
