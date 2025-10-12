import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Shield, 
  Zap, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  Settings,
  Bot,
  RefreshCw,
  TrendingUp
} from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AutoSecurityManagerProps {
  serverSettings: any;
  setServerSettings: (settings: any) => void;
  handleSettingUpdate: (settingType: string, value: any) => void;
}

export const AutoSecurityManager = ({ serverSettings, setServerSettings, handleSettingUpdate }: AutoSecurityManagerProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [autoThreatResponse, setAutoThreatResponse] = useState(false);
  const [lastAutoCheck, setLastAutoCheck] = useState<Date | null>(null);

  const securitySettings = serverSettings.security_settings || {};
  const autoSecuritySettings = securitySettings.auto_security || {};

  useEffect(() => {
    checkAutoSecurityStatus();
    if (autoSecuritySettings.enabled) {
      startAutoSecurityMonitoring();
    }
  }, [autoSecuritySettings.enabled]);

  const checkAutoSecurityStatus = async () => {
    try {
      // Check if auto-security features are working
      const { data, error } = await supabase.functions.invoke('security-manager', {
        body: { action: 'get_security_stats' }
      });
      
      if (!error && data) {
        setLastAutoCheck(new Date());
      }
    } catch (error) {
      console.error('Auto security check failed:', error);
    }
  };

  const startAutoSecurityMonitoring = () => {
    // Start automated security monitoring
    const interval = setInterval(async () => {
      if (autoSecuritySettings.enabled) {
        await performAutoSecurityActions();
      }
    }, 5 * 60 * 1000); // Check every 5 minutes

    return () => clearInterval(interval);
  };

  const performAutoSecurityActions = async () => {
    try {
      // Auto-block suspicious IPs
      if (autoSecuritySettings.auto_block_ips) {
        await autoBlockSuspiciousIPs();
      }

      // Auto-cleanup old logs
      if (autoSecuritySettings.auto_cleanup) {
        await autoCleanupOldData();
      }

      // Auto-detect anomalies
      if (autoSecuritySettings.anomaly_detection) {
        await detectSecurityAnomalies();
      }

      setLastAutoCheck(new Date());
    } catch (error) {
      console.error('Auto security actions failed:', error);
    }
  };

  const autoBlockSuspiciousIPs = async () => {
    try {
      const { data: failedLogins } = await supabase
        .from('failed_login_attempts')
        .select('*')
        .gt('attempt_count', autoSecuritySettings.auto_block_threshold || 5)
        .is('blocked_until', null);

      if (failedLogins && failedLogins.length > 0) {
        for (const login of failedLogins) {
          const blockUntil = new Date();
          blockUntil.setHours(blockUntil.getHours() + (autoSecuritySettings.auto_block_duration || 24));

          await supabase
            .from('failed_login_attempts')
            .update({ blocked_until: blockUntil.toISOString() })
            .eq('id', login.id);
        }

        toast({
          title: "Auto-Security",
          description: `Automatically blocked ${failedLogins.length} suspicious IPs`,
        });
      }
    } catch (error) {
      console.error('Auto IP blocking failed:', error);
    }
  };

  const autoCleanupOldData = async () => {
    try {
      const cleanupDate = new Date();
      cleanupDate.setDate(cleanupDate.getDate() - (autoSecuritySettings.log_retention_days || 30));

      // Cleanup old audit logs
      await supabase
        .from('audit_logs')
        .delete()
        .lt('created_at', cleanupDate.toISOString());

      // Cleanup old failed login attempts
      await supabase
        .from('failed_login_attempts')
        .delete()
        .lt('first_attempt', cleanupDate.toISOString())
        .is('blocked_until', null);

    } catch (error) {
      console.error('Auto cleanup failed:', error);
    }
  };

  const detectSecurityAnomalies = async () => {
    try {
      // Check for unusual activity patterns
      const { data: recentLogs } = await supabase
        .from('audit_logs')
        .select('*')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (recentLogs && recentLogs.length > 100) {
        toast({
          title: "Security Alert",
          description: "Unusually high activity detected in the last 24 hours",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Anomaly detection failed:', error);
    }
  };

  const updateAutoSecuritySetting = (key: string, value: any) => {
    const newAutoSettings = {
      ...autoSecuritySettings,
      [key]: value
    };
    
    const newSecuritySettings = {
      ...securitySettings,
      auto_security: newAutoSettings
    };

    setServerSettings({
      ...serverSettings,
      security_settings: newSecuritySettings
    });
    handleSettingUpdate('security_settings', newSecuritySettings);
  };

  const enableRecommendedSecurity = async () => {
    setLoading(true);
    try {
      const recommendedSettings = {
        // Enable basic security features
        require_2fa: true,
        strong_passwords: true,
        session_timeout: 60,
        rate_limiting: true,
        audit_logging: true,
        ip_logging: true,
        failed_login_tracking: true,
        login_attempt_threshold: 5,
        require_email_verification: true,
        discord_verification: true,
        min_steam_age: 30,
        
        // Enable auto-security
        auto_security: {
          enabled: true,
          auto_block_ips: true,
          auto_block_threshold: 5,
          auto_block_duration: 24,
          auto_cleanup: true,
          log_retention_days: 30,
          anomaly_detection: true,
          threat_response: true
        }
      };

      setServerSettings({
        ...serverSettings,
        security_settings: recommendedSettings
      });
      handleSettingUpdate('security_settings', recommendedSettings);

      toast({
        title: "Security Enhanced",
        description: "Recommended security settings have been automatically applied",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to apply recommended security settings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const runSecurityAudit = async () => {
    setLoading(true);
    try {
      await performAutoSecurityActions();
      toast({
        title: "Security Audit Complete",
        description: "Automated security check completed successfully",
      });
    } catch (error) {
      toast({
        title: "Audit Failed",
        description: "Security audit encountered errors",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Auto-Security Status */}
      <Card className="bg-gaming-card border-gaming-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bot className="h-5 w-5 text-neon-green" />
              <CardTitle>Automated Security</CardTitle>
              {autoSecuritySettings.enabled && (
                <Badge variant="default" className="ml-2">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Active
                </Badge>
              )}
            </div>
            <Button 
              onClick={enableRecommendedSecurity}
              disabled={loading}
              className="bg-neon-blue hover:bg-neon-blue/80"
            >
              <Zap className="h-4 w-4 mr-2" />
              Quick Setup
            </Button>
          </div>
          <CardDescription>
            Automatically monitor and respond to security threats
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Enable Auto-Security */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Enable Automated Security</Label>
              <p className="text-sm text-muted-foreground">Automatically handle security threats and maintenance</p>
            </div>
            <Switch
              checked={autoSecuritySettings.enabled || false}
              onCheckedChange={(checked) => updateAutoSecuritySetting('enabled', checked)}
            />
          </div>

          {autoSecuritySettings.enabled && (
            <>
              {/* Auto-Block IPs */}
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Auto-Block Suspicious IPs</Label>
                  <p className="text-sm text-muted-foreground">Automatically block IPs with multiple failed attempts</p>
                </div>
                <Switch
                  checked={autoSecuritySettings.auto_block_ips || false}
                  onCheckedChange={(checked) => updateAutoSecuritySetting('auto_block_ips', checked)}
                />
              </div>

              {/* Auto-Block Threshold */}
              {autoSecuritySettings.auto_block_ips && (
                <div className="space-y-2">
                  <Label>Auto-Block Threshold</Label>
                  <Select 
                    value={autoSecuritySettings.auto_block_threshold?.toString() || "5"}
                    onValueChange={(value) => updateAutoSecuritySetting('auto_block_threshold', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 failed attempts</SelectItem>
                      <SelectItem value="5">5 failed attempts</SelectItem>
                      <SelectItem value="10">10 failed attempts</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Auto-Cleanup */}
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Auto-Cleanup Old Data</Label>
                  <p className="text-sm text-muted-foreground">Automatically remove old logs and expired data</p>
                </div>
                <Switch
                  checked={autoSecuritySettings.auto_cleanup || false}
                  onCheckedChange={(checked) => updateAutoSecuritySetting('auto_cleanup', checked)}
                />
              </div>

              {/* Anomaly Detection */}
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Anomaly Detection</Label>
                  <p className="text-sm text-muted-foreground">Detect unusual activity patterns automatically</p>
                </div>
                <Switch
                  checked={autoSecuritySettings.anomaly_detection || false}
                  onCheckedChange={(checked) => updateAutoSecuritySetting('anomaly_detection', checked)}
                />
              </div>

              {/* Threat Response */}
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Automated Threat Response</Label>
                  <p className="text-sm text-muted-foreground">Automatically respond to detected security threats</p>
                </div>
                <Switch
                  checked={autoSecuritySettings.threat_response || false}
                  onCheckedChange={(checked) => updateAutoSecuritySetting('threat_response', checked)}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Security Actions */}
      <Card className="bg-gaming-card border-gaming-border">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Settings className="h-5 w-5 text-neon-purple" />
            <CardTitle>Security Management</CardTitle>
          </div>
          <CardDescription>Manual security operations and monitoring</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              onClick={runSecurityAudit}
              disabled={loading}
              className="bg-neon-green hover:bg-neon-green/80"
            >
              <Shield className="h-4 w-4 mr-2" />
              Run Security Audit
            </Button>
            
            <Button 
              onClick={checkAutoSecurityStatus}
              disabled={loading}
              variant="outline"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Check Status
            </Button>
          </div>

          {/* Status Information */}
          {lastAutoCheck && (
            <div className="mt-4 p-3 bg-gaming-dark rounded border border-gaming-border">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Last security check:</span>
                <span className="text-sm text-foreground">{lastAutoCheck.toLocaleTimeString()}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Recommendations */}
      <Card className="bg-gaming-card border-gaming-border">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-yellow-500" />
            <CardTitle>Security Recommendations</CardTitle>
          </div>
          <CardDescription>Automated suggestions to improve your security posture</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {!securitySettings.require_2fa && (
              <div className="flex items-center justify-between p-3 bg-yellow-500/10 border border-yellow-500/20 rounded">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm">Enable Two-Factor Authentication for enhanced security</span>
                </div>
                <Badge variant="outline" className="text-xs">High Priority</Badge>
              </div>
            )}
            
            {!securitySettings.audit_logging && (
              <div className="flex items-center justify-between p-3 bg-orange-500/10 border border-orange-500/20 rounded">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  <span className="text-sm">Enable audit logging to track administrative actions</span>
                </div>
                <Badge variant="outline" className="text-xs">Medium Priority</Badge>
              </div>
            )}
            
            {!autoSecuritySettings.enabled && (
              <div className="flex items-center justify-between p-3 bg-blue-500/10 border border-blue-500/20 rounded">
                <div className="flex items-center space-x-2">
                  <Bot className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">Enable automated security for proactive threat response</span>
                </div>
                <Badge variant="outline" className="text-xs">Recommended</Badge>
              </div>
            )}

            {securitySettings.require_2fa && securitySettings.audit_logging && autoSecuritySettings.enabled && (
              <div className="flex items-center justify-center p-4 bg-green-500/10 border border-green-500/20 rounded">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm font-medium">Your security configuration looks excellent!</span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};