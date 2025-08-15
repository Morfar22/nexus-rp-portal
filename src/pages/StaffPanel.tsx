import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import Navbar from "@/components/Navbar";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useServerSettings } from "@/hooks/useServerSettings";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { 
  AlertCircle, 
  FileText, 
  Eye, 
  CheckCircle, 
  Clock, 
  XCircle, 
  Trash2, 
  Users, 
  Plus, 
  Edit, 
  Settings,
  RefreshCw,
  ChevronDown,
  GripVertical,
  EyeOff,
  Shield,
  X
} from "lucide-react";
import HomepageContentManager from "@/components/HomepageContentManager";
import ClosedApplications from "@/components/ClosedApplications";
import LogsViewer from "@/components/LogsViewer";
import DiscordBotManager from "@/components/DiscordBotManager";
import IPWhitelistManager from "@/components/IPWhitelistManager";
import ApplicationManager from "@/components/ApplicationManager";
import RulesManager from "@/components/RulesManager";
import StaffManager from "@/components/StaffManager";
import UserManagementSection from "@/components/UserManagementSection";
import TeamManager from "@/components/TeamManager";
import NavbarManager from "@/components/NavbarManager";

const StaffPanel = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [serverSettings, setServerSettings] = useState<any>({});
  const { user } = useAuth();
  const { toast } = useToast();

  // Basic state variables needed for functionality
  const [applications, setApplications] = useState<any[]>([]);
  const [rules, setRules] = useState<any[]>([]);
  const [staffMembers, setStaffMembers] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      // Basic data fetching
      await Promise.all([
        fetchServerSettings(),
        fetchApplications(),
        fetchRules(),
        fetchStaffMembers()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchServerSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('server_settings')
        .select('*');

      if (error) throw error;

      const settings: any = {};
      data?.forEach(setting => {
        settings[setting.setting_key] = setting.setting_value;
      });
      setServerSettings(settings);
    } catch (error) {
      console.error('Error fetching server settings:', error);
    }
  };

  const fetchApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
    }
  };

  const fetchRules = async () => {
    try {
      const { data, error } = await supabase
        .from('rules')
        .select('*')
        .order('category', { ascending: true });

      if (error) throw error;
      setRules(data || []);
    } catch (error) {
      console.error('Error fetching rules:', error);
    }
  };

  const fetchStaffMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .in('role', ['admin', 'moderator']);

      if (error) throw error;
      setStaffMembers(data || []);
    } catch (error) {
      console.error('Error fetching staff members:', error);
    }
  };

  const testEmail = async () => {
    const email = prompt("Enter email to test:");
    if (!email) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('test-email', {
        body: { testEmail: email }
      });
      
      if (error) throw error;
      toast({
        title: "Test Email Sent",
        description: `Email sent successfully to ${email}`,
      });
    } catch (error: any) {
      toast({
        title: "Email Test Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const testApplicationEmail = async () => {
    const email = prompt("Enter email to test application email:");
    if (!email) return;
    
    try {
      const testApplicationData = {
        steam_name: "Test Player",
        age: 25,
        discord_tag: "TestUser#1234",
        rp_experience: "Test RP experience",
        character_backstory: "This is a test character backstory"
      };

      const { data, error } = await supabase.functions.invoke('send-application-email', {
        body: { 
          type: 'rp',
          userEmail: email,
          applicationData: testApplicationData
        }
      });
      
      if (error) throw error;
      toast({
        title: "Application Email Test Sent",
        description: `Test application email sent successfully to ${email}`,
      });
    } catch (error: any) {
      toast({
        title: "Application Email Test Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const testSimpleFunction = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('simple-test', {
        body: { test: 'simple function test' }
      });
      
      if (error) throw error;
      toast({
        title: "Simple Test Success",
        description: `Function working! Has Resend key: ${data.environment?.hasResendKey}`,
      });
      console.log('Simple test response:', data);
    } catch (error: any) {
      toast({
        title: "Simple Test Failed",
        description: error.message,
        variant: "destructive"
      });
      console.error('Simple test error:', error);
    }
  };

  const handleSettingUpdate = async (settingType: string, value: any) => {
    try {
      const { error } = await supabase
        .from('server_settings')
        .update({
          setting_value: value,
          updated_at: new Date().toISOString()
        })
        .eq('setting_key', settingType);

      if (error) throw error;

      // Update local state immediately
      setServerSettings({
        ...serverSettings,
        [settingType]: value
      });

      toast({
        title: "Success",
        description: "Setting updated successfully",
      });
    } catch (error) {
      console.error('Error updating setting:', error);
      toast({
        title: "Error", 
        description: "Failed to update setting",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gaming-dark">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-neon-purple" />
            <p className="text-foreground">Loading staff panel...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gaming-dark">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
            Staff Panel
          </h1>
          <p className="text-muted-foreground">
            Manage your FiveM server settings, applications, and staff members
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-10 bg-gaming-card border-gaming-border">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="applications">Applications</TabsTrigger>
            <TabsTrigger value="rules">Rules</TabsTrigger>
            <TabsTrigger value="staff">Staff</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
            <TabsTrigger value="navbar">Navbar</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="p-6 bg-gaming-card border-gaming-border">
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-neon-blue" />
                  <h3 className="font-semibold text-foreground">Applications</h3>
                </div>
                <p className="text-2xl font-bold text-foreground mt-2">{applications.length}</p>
                <p className="text-sm text-muted-foreground">Total applications</p>
              </Card>

              <Card className="p-6 bg-gaming-card border-gaming-border">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-neon-green" />
                  <h3 className="font-semibold text-foreground">Staff</h3>
                </div>
                <p className="text-2xl font-bold text-foreground mt-2">{staffMembers.length}</p>
                <p className="text-sm text-muted-foreground">Active staff members</p>
              </Card>

              <Card className="p-6 bg-gaming-card border-gaming-border">
                <div className="flex items-center space-x-2">
                  <Settings className="h-5 w-5 text-neon-purple" />
                  <h3 className="font-semibold text-foreground">Rules</h3>
                </div>
                <p className="text-2xl font-bold text-foreground mt-2">{rules.length}</p>
                <p className="text-sm text-muted-foreground">Server rules</p>
              </Card>

              <Card className="p-6 bg-gaming-card border-gaming-border">
                <div className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-yellow-500" />
                  <h3 className="font-semibold text-foreground">Security</h3>
                </div>
                <p className="text-sm font-medium text-foreground mt-2">
                  {serverSettings.security_settings?.ip_whitelist ? 'IP Whitelist ON' : 'Standard Security'}
                </p>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="applications" className="space-y-6">
            <ApplicationManager />
          </TabsContent>

          <TabsContent value="rules" className="space-y-6">
            <RulesManager />
          </TabsContent>

          <TabsContent value="staff" className="space-y-6">
            <StaffManager />
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <UserManagementSection />
          </TabsContent>

          <TabsContent value="team" className="space-y-6">
            <TeamManager />
          </TabsContent>

          <TabsContent value="navbar" className="space-y-6">
            <NavbarManager />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            {/* Email Test */}
            <Card className="p-6 bg-gaming-card border-gaming-border shadow-gaming">
              <div className="flex items-center space-x-2 mb-6">
                <Settings className="h-5 w-5 text-neon-green" />
                <h2 className="text-xl font-semibold text-foreground">Email Testing</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label className="text-foreground text-base">Test Email Function</Label>
                  <p className="text-sm text-muted-foreground mb-4">
                    Test if your Resend API key is working correctly
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    <Button onClick={testSimpleFunction} variant="outline">
                      Test Simple Function
                    </Button>
                    <Button onClick={testEmail} variant="outline">
                      Test Basic Email
                    </Button>
                    <Button onClick={testApplicationEmail} variant="outline">
                      Test Application Email
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            {/* Maintenance Mode */}
            <Card className="p-6 bg-gaming-card border-gaming-border shadow-gaming">
              <div className="flex items-center space-x-2 mb-6">
                <AlertCircle className="h-5 w-5 text-yellow-500" />
                <h2 className="text-xl font-semibold text-foreground">Maintenance Mode</h2>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-foreground text-base">Enable Maintenance Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      When enabled, only staff can access the site
                    </p>
                  </div>
                  <Switch
                    checked={serverSettings.general_settings?.maintenance_mode || false}
                    onCheckedChange={(checked) => {
                      const newSettings = {
                        ...serverSettings.general_settings,
                        maintenance_mode: checked
                      };
                      setServerSettings({
                        ...serverSettings,
                        general_settings: newSettings
                      });
                      handleSettingUpdate('general_settings', newSettings);
                    }}
                  />
                </div>
                
                <div className="p-4 bg-gaming-dark rounded border">
                  <p className="text-sm text-muted-foreground">
                    <strong>Status:</strong> Maintenance mode is currently{' '}
                    <span className={serverSettings.general_settings?.maintenance_mode ? 'text-yellow-400' : 'text-green-400'}>
                      {serverSettings.general_settings?.maintenance_mode ? 'ENABLED' : 'DISABLED'}
                    </span>
                  </p>
                </div>
              </div>
            </Card>

            {/* Application Settings */}
            <Card className="p-6 bg-gaming-card border-gaming-border shadow-gaming">
              <div className="flex items-center space-x-2 mb-6">
                <FileText className="h-5 w-5 text-neon-green" />
                <h2 className="text-xl font-semibold text-foreground">Application Settings</h2>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-foreground text-base">Accept Applications</Label>
                    <p className="text-sm text-muted-foreground">
                      Toggle whether new applications can be submitted
                    </p>
                  </div>
                  <Switch
                    checked={serverSettings.application_settings?.accept_applications || false}
                    onCheckedChange={(checked) => {
                      const newSettings = {
                        ...serverSettings.application_settings,
                        accept_applications: checked
                      };
                      setServerSettings({
                        ...serverSettings,
                        application_settings: newSettings
                      });
                      handleSettingUpdate('application_settings', newSettings);
                    }}
                  />
                </div>
                
                <div className="p-4 bg-gaming-dark rounded border">
                  <p className="text-sm text-muted-foreground">
                    <strong>Status:</strong> Applications are currently{' '}
                    <span className={serverSettings.application_settings?.accept_applications ? 'text-green-400' : 'text-red-400'}>
                      {serverSettings.application_settings?.accept_applications ? 'OPEN' : 'CLOSED'}
                    </span>
                  </p>
                </div>
              </div>
            </Card>

            {/* Discord Settings */}
            <Card className="p-6 bg-gaming-card border-gaming-border shadow-gaming">
              <div className="flex items-center space-x-2 mb-6">
                <Users className="h-5 w-5 text-neon-blue" />
                <h2 className="text-xl font-semibold text-foreground">Discord Integration</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label className="text-foreground">Discord Server ID</Label>
                  <Input
                    value={serverSettings.discord_settings?.server_id || ''}
                    onChange={(e) => {
                      const newSettings = {
                        ...serverSettings.discord_settings,
                        server_id: e.target.value
                      };
                      setServerSettings({
                        ...serverSettings,
                        discord_settings: newSettings
                      });
                    }}
                    onBlur={() => handleSettingUpdate('discord_settings', serverSettings.discord_settings)}
                    placeholder="Discord server ID..."
                    className="bg-gaming-dark border-gaming-border text-foreground"
                  />
                </div>

                <DiscordBotManager 
                  serverSettings={serverSettings}
                  setServerSettings={setServerSettings}
                  handleSettingUpdate={handleSettingUpdate}
                />
              </div>
            </Card>

            {/* Security Settings */}
            <Card className="p-6 bg-gaming-card border-gaming-border shadow-gaming">
              <div className="flex items-center space-x-2 mb-6">
                <AlertCircle className="h-5 w-5 text-neon-purple" />
                <h2 className="text-xl font-semibold text-foreground">Security Settings</h2>
              </div>
              
              <IPWhitelistManager 
                serverSettings={serverSettings}
                setServerSettings={setServerSettings}
                handleSettingUpdate={handleSettingUpdate}
              />
            </Card>
          </TabsContent>

          <TabsContent value="content" className="space-y-6">
            <HomepageContentManager />
          </TabsContent>

          <TabsContent value="logs" className="space-y-6">
            <LogsViewer />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default StaffPanel;