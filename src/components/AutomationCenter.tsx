import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Bot, 
  Zap, 
  Clock, 
  FileText,
  Users,
  MessageCircle,
  Mail,
  BarChart,
  Server,
  Settings,
  Play,
  Pause,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Calendar,
  UserCheck,
  Database,
  Shield
} from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AutomationCenterProps {
  serverSettings: any;
  setServerSettings: (settings: any) => void;
  handleSettingUpdate: (settingType: string, value: any) => void;
}

interface AutomationTask {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  frequency: string;
  lastRun?: Date;
  nextRun?: Date;
  status: 'active' | 'paused' | 'error';
  category: string;
}

export const AutomationCenter = ({ serverSettings, setServerSettings, handleSettingUpdate }: AutomationCenterProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [automationTasks, setAutomationTasks] = useState<AutomationTask[]>([]);

  const automationSettings = serverSettings.automation_settings || {};

  useEffect(() => {
    initializeAutomationTasks();
  }, []);

  const initializeAutomationTasks = () => {
    const defaultTasks: AutomationTask[] = [
      {
        id: 'auto-applications',
        name: 'Auto Application Review',
        description: 'Automatically review and approve/reject applications based on criteria',
        enabled: automationSettings.auto_applications || false,
        frequency: 'every-5-minutes',
        status: 'active',
        category: 'applications'
      },
      {
        id: 'chat-assignment',
        name: 'Smart Chat Assignment',
        description: 'Automatically assign support chats to available staff members',
        enabled: automationSettings.chat_assignment || false,
        frequency: 'realtime',
        status: 'active',
        category: 'support'
      },
      {
        id: 'discord-sync',
        name: 'Discord Role Sync',
        description: 'Automatically sync user roles with Discord server',
        enabled: automationSettings.discord_sync || false,
        frequency: 'every-15-minutes',
        status: 'active',
        category: 'discord'
      },
      {
        id: 'email-notifications',
        name: 'Auto Email Notifications',
        description: 'Send automated emails for important events',
        enabled: automationSettings.email_notifications || false,
        frequency: 'event-triggered',
        status: 'active',
        category: 'notifications'
      },
      {
        id: 'user-cleanup',
        name: 'Inactive User Cleanup',
        description: 'Archive or delete inactive user accounts automatically',
        enabled: automationSettings.user_cleanup || false,
        frequency: 'daily',
        status: 'active',
        category: 'maintenance'
      },
      {
        id: 'server-monitoring',
        name: 'Server Health Monitoring',
        description: 'Monitor server stats and alert staff of issues',
        enabled: automationSettings.server_monitoring || false,
        frequency: 'every-minute',
        status: 'active',
        category: 'monitoring'
      },
      {
        id: 'analytics-reports',
        name: 'Automated Analytics Reports',
        description: 'Generate and send weekly analytics reports to staff',
        enabled: automationSettings.analytics_reports || false,
        frequency: 'weekly',
        status: 'active',
        category: 'analytics'
      },
      {
        id: 'backup-cleanup',
        name: 'Database Maintenance',
        description: 'Automatically clean up old logs and optimize database',
        enabled: automationSettings.backup_cleanup || false,
        frequency: 'daily',
        status: 'active',
        category: 'maintenance'
      }
    ];

    setAutomationTasks(defaultTasks);
  };

  const updateAutomationSetting = (key: string, value: any) => {
    const newSettings = {
      ...automationSettings,
      [key]: value
    };
    
    setServerSettings({
      ...serverSettings,
      automation_settings: newSettings
    });
    handleSettingUpdate('automation_settings', newSettings);
  };

  const toggleTask = (taskId: string, enabled: boolean) => {
    updateAutomationSetting(taskId, enabled);
    
    setAutomationTasks(prev => 
      prev.map(task => 
        task.id === taskId 
          ? { ...task, enabled }
          : task
      )
    );

    toast({
      title: enabled ? "Automation Enabled" : "Automation Disabled",
      description: `${automationTasks.find(t => t.id === taskId)?.name} has been ${enabled ? 'enabled' : 'disabled'}`,
    });
  };

  const runTaskManually = async (taskId: string) => {
    setLoading(true);
    try {
      // Simulate running the task
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const taskName = automationTasks.find(t => t.id === taskId)?.name;
      toast({
        title: "Task Completed",
        description: `${taskName} has been executed successfully`,
      });

      // Update last run time
      setAutomationTasks(prev => 
        prev.map(task => 
          task.id === taskId 
            ? { ...task, lastRun: new Date() }
            : task
        )
      );
    } catch (error) {
      toast({
        title: "Task Failed",
        description: "Failed to execute the automation task",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const enableAllRecommended = () => {
    const recommendedSettings = {
      auto_applications: true,
      chat_assignment: true,
      discord_sync: true,
      email_notifications: true,
      server_monitoring: true,
      analytics_reports: true
    };

    setServerSettings({
      ...serverSettings,
      automation_settings: { ...automationSettings, ...recommendedSettings }
    });
    handleSettingUpdate('automation_settings', { ...automationSettings, ...recommendedSettings });

    setAutomationTasks(prev => 
      prev.map(task => ({
        ...task,
        enabled: recommendedSettings[task.id as keyof typeof recommendedSettings] || task.enabled
      }))
    );

    toast({
      title: "Automation Enabled",
      description: "All recommended automation features have been enabled",
    });
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'applications': return <FileText className="h-4 w-4" />;
      case 'support': return <MessageCircle className="h-4 w-4" />;
      case 'discord': return <Users className="h-4 w-4" />;
      case 'notifications': return <Mail className="h-4 w-4" />;
      case 'maintenance': return <Database className="h-4 w-4" />;
      case 'monitoring': return <Server className="h-4 w-4" />;
      case 'analytics': return <BarChart className="h-4 w-4" />;
      default: return <Settings className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (task: AutomationTask) => {
    if (!task.enabled) {
      return <Badge variant="secondary">Disabled</Badge>;
    }
    
    switch (task.status) {
      case 'active':
        return <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Active</Badge>;
      case 'paused':
        return <Badge variant="outline"><Pause className="h-3 w-3 mr-1" />Paused</Badge>;
      case 'error':
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Error</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const groupedTasks = automationTasks.reduce((acc, task) => {
    if (!acc[task.category]) {
      acc[task.category] = [];
    }
    acc[task.category].push(task);
    return acc;
  }, {} as Record<string, AutomationTask[]>);

  return (
    <div className="space-y-6">
      {/* Header with Quick Actions */}
      <Card className="bg-gaming-card border-gaming-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bot className="h-6 w-6 text-neon-green" />
              <div>
                <CardTitle>Automation Center</CardTitle>
                <CardDescription>Automatically handle repetitive tasks and workflows</CardDescription>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button onClick={enableAllRecommended} className="bg-neon-blue hover:bg-neon-blue/80">
                <Zap className="h-4 w-4 mr-2" />
                Enable Recommended
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-neon-green">
                {automationTasks.filter(t => t.enabled).length}
              </div>
              <p className="text-sm text-muted-foreground">Active Tasks</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-neon-blue">
                {automationTasks.filter(t => t.enabled && t.status === 'active').length}
              </div>
              <p className="text-sm text-muted-foreground">Running</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-500">
                {automationTasks.filter(t => t.status === 'error').length}
              </div>
              <p className="text-sm text-muted-foreground">Errors</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">24/7</div>
              <p className="text-sm text-muted-foreground">Monitoring</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Automation Tasks by Category */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-6 bg-gaming-card">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="applications">Applications</TabsTrigger>
          <TabsTrigger value="support">Support</TabsTrigger>
          <TabsTrigger value="discord">Discord</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {Object.entries(groupedTasks).map(([category, tasks]) => (
            <Card key={category} className="bg-gaming-card border-gaming-border">
              <CardHeader>
                <CardTitle className="flex items-center capitalize">
                  {getCategoryIcon(category)}
                  <span className="ml-2">{category} Automation</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {tasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-4 border border-gaming-border rounded-lg">
                    <div className="flex items-center space-x-4">
                      {getCategoryIcon(task.category)}
                      <div>
                        <h4 className="font-medium text-foreground">{task.name}</h4>
                        <p className="text-sm text-muted-foreground">{task.description}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          {getStatusBadge(task)}
                          <Badge variant="outline" className="text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            {task.frequency}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={task.enabled}
                        onCheckedChange={(checked) => toggleTask(task.id, checked)}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => runTaskManually(task.id)}
                        disabled={loading}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Individual category tabs */}
        {Object.entries(groupedTasks).map(([category, tasks]) => (
          <TabsContent key={category} value={category} className="space-y-4">
            <Card className="bg-gaming-card border-gaming-border">
              <CardHeader>
                <CardTitle className="flex items-center capitalize">
                  {getCategoryIcon(category)}
                  <span className="ml-2">{category} Automation</span>
                </CardTitle>
                <CardDescription>
                  Configure automated tasks for {category} management
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {tasks.map((task) => (
                  <div key={task.id} className="space-y-4 p-4 border border-gaming-border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base font-medium">{task.name}</Label>
                        <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                      </div>
                      <div className="flex items-center space-x-4">
                        {getStatusBadge(task)}
                        <Switch
                          checked={task.enabled}
                          onCheckedChange={(checked) => toggleTask(task.id, checked)}
                        />
                      </div>
                    </div>
                    
                    {task.enabled && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gaming-border">
                        <div>
                          <Label className="text-sm">Frequency</Label>
                          <Select defaultValue={task.frequency}>
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="realtime">Real-time</SelectItem>
                              <SelectItem value="every-minute">Every Minute</SelectItem>
                              <SelectItem value="every-5-minutes">Every 5 Minutes</SelectItem>
                              <SelectItem value="every-15-minutes">Every 15 Minutes</SelectItem>
                              <SelectItem value="hourly">Hourly</SelectItem>
                              <SelectItem value="daily">Daily</SelectItem>
                              <SelectItem value="weekly">Weekly</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label className="text-sm">Last Run</Label>
                          <p className="text-sm text-muted-foreground mt-1">
                            {task.lastRun ? task.lastRun.toLocaleString() : 'Never'}
                          </p>
                        </div>
                        
                        <div className="flex items-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => runTaskManually(task.id)}
                            disabled={loading}
                            className="w-full"
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Run Now
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Advanced Automation Settings */}
      <Card className="bg-gaming-card border-gaming-border">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Settings className="h-5 w-5 text-neon-purple" />
            <CardTitle>Advanced Automation</CardTitle>
          </div>
          <CardDescription>Configure advanced automation behaviors and workflows</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Smart Scheduling</Label>
                  <p className="text-sm text-muted-foreground">Automatically adjust task frequency based on load</p>
                </div>
                <Switch
                  checked={automationSettings.smart_scheduling || false}
                  onCheckedChange={(checked) => updateAutomationSetting('smart_scheduling', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Error Recovery</Label>
                  <p className="text-sm text-muted-foreground">Automatically retry failed tasks</p>
                </div>
                <Switch
                  checked={automationSettings.error_recovery || false}
                  onCheckedChange={(checked) => updateAutomationSetting('error_recovery', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Load Balancing</Label>
                  <p className="text-sm text-muted-foreground">Distribute tasks across available resources</p>
                </div>
                <Switch
                  checked={automationSettings.load_balancing || false}
                  onCheckedChange={(checked) => updateAutomationSetting('load_balancing', checked)}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Max Concurrent Tasks</Label>
                <Select 
                  value={automationSettings.max_concurrent?.toString() || "5"}
                  onValueChange={(value) => updateAutomationSetting('max_concurrent', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 task</SelectItem>
                    <SelectItem value="3">3 tasks</SelectItem>
                    <SelectItem value="5">5 tasks</SelectItem>
                    <SelectItem value="10">10 tasks</SelectItem>
                    <SelectItem value="20">20 tasks</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Task Timeout (minutes)</Label>
                <Input
                  type="number"
                  value={automationSettings.task_timeout || 30}
                  onChange={(e) => updateAutomationSetting('task_timeout', parseInt(e.target.value))}
                  className="bg-gaming-dark border-gaming-border"
                />
              </div>

              <div className="space-y-2">
                <Label>Retry Attempts</Label>
                <Select 
                  value={automationSettings.retry_attempts?.toString() || "3"}
                  onValueChange={(value) => updateAutomationSetting('retry_attempts', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 retry</SelectItem>
                    <SelectItem value="3">3 retries</SelectItem>
                    <SelectItem value="5">5 retries</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};