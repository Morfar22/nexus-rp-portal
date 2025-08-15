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
import Navbar from "@/components/Navbar";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
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
  RefreshCw
} from "lucide-react";
import HomepageContentManager from "@/components/HomepageContentManager";
import ClosedApplications from "@/components/ClosedApplications";

const StaffPanel = () => {
  const [applications, setApplications] = useState<any[]>([]);
  const [recentActions, setRecentActions] = useState<any[]>([]);
  const [rules, setRules] = useState<any[]>([]);
  const [staffMembers, setStaffMembers] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [serverStats, setServerStats] = useState<any>({
    players_online: 0,
    max_players: 300,
    queue_count: 0,
    uptime_percentage: 99.9,
    ping_ms: 15
  });
  const [players, setPlayers] = useState<any[]>([]);
  const [applicationTypes, setApplicationTypes] = useState<any[]>([]);
  const [serverSettings, setServerSettings] = useState<any>({});
  const [serverJoinLink, setServerJoinLink] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Debug logging for isSubmitting state
  useEffect(() => {
    console.log('isSubmitting state changed:', isSubmitting);
  }, [isSubmitting]);
  const [error, setError] = useState("");
  const [editingRule, setEditingRule] = useState<any>(null);
  const [newRule, setNewRule] = useState({ category: "", title: "", description: "" });
  const [showStaffDialog, setShowStaffDialog] = useState(false);
  const [newStaffEmail, setNewStaffEmail] = useState("");
  const [newStaffRole, setNewStaffRole] = useState("moderator");
  
  // Team Member Management
  const [newTeamMember, setNewTeamMember] = useState({
    name: "",
    role: "",
    bio: "",
    image_url: "",
    order_index: 0
  });
  const [showTeamMemberDialog, setShowTeamMemberDialog] = useState(false);
  const [editingTeamMember, setEditingTeamMember] = useState<any>(null);
  
  // Application Type Management
  const [newApplicationType, setNewApplicationType] = useState({
    name: "",
    description: "",
    formFields: [
      { name: "steam_name", label: "Steam Name", type: "text", required: true, placeholder: "" },
      { name: "discord_tag", label: "Discord Tag", type: "text", required: true, placeholder: "username#1234" },
      { name: "discord_name", label: "Discord User ID", type: "text", required: true, placeholder: "123456789012345678" },
      { name: "fivem_name", label: "FiveM Name", type: "text", required: true, placeholder: "" },
      { name: "age", label: "Age", type: "number", required: true, placeholder: "" }
    ]
  });
  const [showApplicationTypeDialog, setShowApplicationTypeDialog] = useState(false);
  const [editingApplicationType, setEditingApplicationType] = useState<any>(null);

  // Homepage Content Management
  const [homepageFeatures, setHomepageFeatures] = useState<any[]>([]);
  const [homepageCta, setHomepageCta] = useState<any>({
    title: "",
    description: "",
    features: []
  });
  const [editingFeature, setEditingFeature] = useState<any>(null);
  const [showFeatureDialog, setShowFeatureDialog] = useState(false);
  const [newFeature, setNewFeature] = useState({
    title: "",
    description: "",
    icon: "Users",
    color: "text-neon-purple"
  });

  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && user) {
      fetchData();
    }
  }, [user, authLoading]);

  const fetchData = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      // Fetch staff members using a working approach
      const { data: staffRolesData, error: staffError } = await supabase
        .from('user_roles')
        .select('id, role, created_at, user_id')
        .in('role', ['admin', 'moderator']);

      console.log('Staff roles data:', staffRolesData, 'Error:', staffError);

      // Process staff members with profile lookup
      let processedStaffMembers = [];
      if (staffRolesData && staffRolesData.length > 0) {
        // Get all user IDs
        const userIds = staffRolesData.map(role => role.user_id);
        
        // Fetch corresponding profiles
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, username, full_name')
          .in('id', userIds);

        console.log('Profiles data:', profilesData, 'Error:', profilesError);

        // Combine staff roles with profiles
        processedStaffMembers = staffRolesData.map(staff => {
          const profile = profilesData?.find(p => p.id === staff.user_id);
          return {
            ...staff,
            profiles: profile || {
              id: staff.user_id,
              username: `User ${staff.user_id.slice(0, 8)}`,
              full_name: null
            }
          };
        });
      }

      console.log('Final processed staff members:', processedStaffMembers);

      const [applicationsRes, rulesRes, typesRes, settingsRes, teamMembersRes, serverStatsRes] = await Promise.all([
        supabase.from('applications').select('*').eq('closed', false).order('created_at', { ascending: false }),
        supabase.from('rules').select('*').order('category', { ascending: true }),
        supabase.from('application_types').select('*'),
        supabase.from('server_settings').select('*').maybeSingle(),
        supabase.from('team_members').select('*').order('order_index', { ascending: true }),
        supabase.from('server_stats').select('*').order('last_updated', { ascending: false }).limit(1).maybeSingle()
      ]);

      // Get homepage content settings
      const homepageFeaturesRes = await supabase
        .from('server_settings')
        .select('setting_value')
        .eq('setting_key', 'homepage_features')
        .maybeSingle();

      const homepageCtaRes = await supabase
        .from('server_settings')
        .select('setting_value')
        .eq('setting_key', 'homepage_cta_section')
        .maybeSingle();

      // Get server join link from settings
      const joinLinkSetting = await supabase
        .from('server_settings')
        .select('setting_value')
        .eq('setting_key', 'server_join_link')
        .maybeSingle();

      // Get FiveM server settings and server information
      const allSettings = await supabase
        .from('server_settings')
        .select('setting_key, setting_value')
        .in('setting_key', [
          'fivem_server_ip', 
          'fivem_server_port', 
          'fivem_server_name',
          'server_display_ip',
          'discord_url',
          'server_status',
          'discord_logging',
          'discord_settings',
          'general_settings',
          'application_settings',
          'security_settings',
          'performance_settings',
          'logging_settings'
        ]);

      if (applicationsRes.data) setApplications(applicationsRes.data);
      if (rulesRes.data) setRules(rulesRes.data);
      if (processedStaffMembers) {
        console.log('Staff members loaded:', processedStaffMembers);
        setStaffMembers(processedStaffMembers);
      }
      if (typesRes.data) setApplicationTypes(typesRes.data);
      if (settingsRes.data) setServerSettings(settingsRes.data);
      if (teamMembersRes.data) setTeamMembers(teamMembersRes.data);
      if (serverStatsRes.data) setServerStats(serverStatsRes.data);
      if (joinLinkSetting.data) setServerJoinLink(joinLinkSetting.data.setting_value as string);
      
      // Process all settings
      if (allSettings.data) {
        const configSettings: any = {};
        allSettings.data.forEach(setting => {
          configSettings[setting.setting_key] = setting.setting_value;
        });
        setServerSettings(prev => ({ ...prev, ...configSettings }));
      }

      // Set homepage content
      if (homepageFeaturesRes.data) {
        setHomepageFeatures(homepageFeaturesRes.data.setting_value as any[]);
      }
      if (homepageCtaRes.data) {
        setHomepageCta(homepageCtaRes.data.setting_value);
      }
      
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplicationAction = async (applicationId: string, action: string) => {
    if (!user) return;
    
    try {
      setIsSubmitting(true);
      
      // Get the application data first
      const { data: applicationData, error: fetchError } = await supabase
        .from('applications')
        .select('*')
        .eq('id', applicationId)
        .single();

      if (fetchError) throw fetchError;

      // Update the application status
      const { error } = await supabase
        .from('applications')
        .update({ 
          status: action,
          review_notes: reviewNotes,
          reviewed_by: user.id
        })
        .eq('id', applicationId);

      if (error) throw error;

      // Send email notification for status change
      if (action === 'approved' || action === 'denied' || action === 'under_review') {
        try {
          // Send email notification
          const { error: emailError } = await supabase.functions.invoke('send-application-email', {
            body: {
              type: action,
              userId: applicationData.user_id,
              applicationData: {
                steam_name: applicationData.steam_name,
                discord_tag: applicationData.discord_tag,
                fivem_name: applicationData.fivem_name,
                review_notes: reviewNotes
              }
            }
          });

          if (emailError) {
            console.error('Email sending failed:', emailError);
          } else {
            console.log('Email notification sent successfully');
          }

          // Send Discord notification (direct application notification)
          const { error: discordError } = await supabase.functions.invoke('discord-logger', {
            body: {
              type: `application_${action}`,
              data: {
                steam_name: applicationData.steam_name,
                discord_tag: applicationData.discord_tag,
                discord_name: applicationData.discord_name,
                fivem_name: applicationData.fivem_name,
                review_notes: reviewNotes
              }
            }
          });

          // Also send admin action log (respects Discord logging settings)
          await sendDiscordLog('application_action', {
            action: action,
            admin: user?.email,
            applicant: {
              steam_name: applicationData.steam_name,
              discord_tag: applicationData.discord_tag,
              discord_name: applicationData.discord_name,
              fivem_name: applicationData.fivem_name
            },
            review_notes: reviewNotes
          });

          if (discordError) {
            console.error('Discord notification failed:', discordError);
          } else {
            console.log('Discord notification sent successfully');
          }
        } catch (notificationError) {
          console.error('Error sending notifications:', notificationError);
        }
      }

      toast({
        title: "Success",
        description: `Application ${action} successfully. Email and Discord notifications sent.`,
      });

      setSelectedApplication(null);
      setReviewNotes("");
      fetchData();
      
    } catch (error) {
      console.error('Error updating application:', error);
      toast({
        title: "Error",
        description: "Failed to update application",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseApplication = async (applicationId: string) => {
    if (!user) return;
    
    try {
      setIsSubmitting(true);
      
      const { error } = await supabase
        .from('applications')
        .update({ 
          closed: true,
          closed_at: new Date().toISOString(),
          closed_by: user.id
        })
        .eq('id', applicationId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Application closed successfully",
      });

      setSelectedApplication(null);
      fetchData();
      
    } catch (error) {
      console.error('Error closing application:', error);
      toast({
        title: "Error",
        description: "Failed to close application",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    try {
      // Get the rule details before deleting
      const ruleToDelete = rules.find(rule => rule.id === ruleId);
      
      const { error } = await supabase
        .from('rules')
        .delete()
        .eq('id', ruleId);

      if (error) throw error;

      // Log rule change to Discord with full details
      await sendDiscordLog('rule_change', {
        action: 'rule_deleted',
        rule: {
          id: ruleId,
          title: ruleToDelete?.title || 'Unknown Rule',
          description: ruleToDelete?.description || 'No description',
          category: ruleToDelete?.category || 'No category'
        },
        admin: user?.email
      });

      toast({
        title: "Success",
        description: "Rule deleted successfully",
      });

      fetchData();
    } catch (error) {
      console.error('Error deleting rule:', error);
      toast({
        title: "Error",
        description: "Failed to delete rule",
        variant: "destructive",
      });
    }
  };

  const handleSaveRule = async () => {
    if (!newRule.title || !newRule.description || !newRule.category) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      if (editingRule) {
        const { error } = await supabase
          .from('rules')
          .update(newRule)
          .eq('id', editingRule.id);

        if (error) throw error;

        console.log('Rule updated, calling Discord log...');
        // Log rule change to Discord
        await sendDiscordLog('rule_change', {
          action: 'rule_updated',
          rule: newRule,
          admin: user?.email
        });

        toast({
          title: "Success",
          description: "Rule updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('rules')
          .insert([newRule]);

        if (error) throw error;

        console.log('Rule created, calling Discord log...');
        // Log rule change to Discord
        await sendDiscordLog('rule_change', {
          action: 'rule_created',
          rule: newRule,
          admin: user?.email
        });

        toast({
          title: "Success",
          description: "Rule created successfully",
        });
      }

      setNewRule({ category: "", title: "", description: "" });
      setEditingRule(null);
      fetchData();
      
    } catch (error) {
      console.error('Error saving rule:', error);
      toast({
        title: "Error",
        description: "Failed to save rule",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddStaff = async () => {
    if (!newStaffEmail) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // First, get the user ID by email using our database function
      const { data: userId, error: userError } = await supabase
        .rpc('get_user_id_by_email', { _email: newStaffEmail });

      if (userError || !userId) {
        toast({
          title: "Error",
          description: "User not found. The user must have an account first.",
          variant: "destructive",
        });
        return;
      }

      // Check if user already has a staff role
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .in('role', ['admin', 'moderator'])
        .maybeSingle();

      if (existingRole) {
        toast({
          title: "Error",
          description: "This user is already a staff member",
          variant: "destructive",
        });
        return;
      }

      // Add the role to user_roles table
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: newStaffRole as 'admin' | 'moderator' | 'user'
        });

      if (error) throw error;

      // Log user action to Discord
      await sendDiscordLog('user_action', {
        action: 'staff_added',
        user_email: newStaffEmail,
        role: newStaffRole,
        admin: user?.email
      });

      toast({
        title: "Success",
        description: "Staff member added successfully",
      });

      setNewStaffEmail("");
      setNewStaffRole("moderator");
      setShowStaffDialog(false);
      fetchData();
      
    } catch (error) {
      console.error('Error adding staff:', error);
      toast({
        title: "Error",
        description: "Failed to add staff member",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveStaff = async (staffId: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', staffId);

      if (error) throw error;

      // Log user action to Discord
      await sendDiscordLog('user_action', {
        action: 'staff_removed',
        staff_id: staffId,
        admin: user?.email
      });

      toast({
        title: "Success",
        description: "Staff member removed successfully",
      });

      fetchData();
    } catch (error) {
      console.error('Error removing staff:', error);
      toast({
        title: "Error",
        description: "Failed to remove staff member",
        variant: "destructive",
      });
    }
  };

  const handleSaveApplicationType = async () => {
    if (!newApplicationType.name || !newApplicationType.description) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      if (editingApplicationType) {
        const { error } = await supabase
          .from('application_types')
          .update({
            name: newApplicationType.name,
            description: newApplicationType.description,
            form_fields: newApplicationType.formFields
          })
          .eq('id', editingApplicationType.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Application type updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('application_types')
          .insert([{
            name: newApplicationType.name,
            description: newApplicationType.description,
            form_fields: newApplicationType.formFields
          }]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Application type created successfully",
        });
      }

      setNewApplicationType({
        name: "",
        description: "",
        formFields: [
          { name: "steam_name", label: "Steam Name", type: "text", required: true, placeholder: "" },
          { name: "discord_tag", label: "Discord Tag", type: "text", required: true, placeholder: "username#1234" },
          { name: "discord_name", label: "Discord User ID", type: "text", required: true, placeholder: "123456789012345678" },
          { name: "fivem_name", label: "FiveM Name", type: "text", required: true, placeholder: "" },
          { name: "age", label: "Age", type: "number", required: true, placeholder: "" }
        ]
      });
      setEditingApplicationType(null);
      setShowApplicationTypeDialog(false);
      fetchData();
      
    } catch (error) {
      console.error('Error saving application type:', error);
      toast({
        title: "Error",
        description: "Failed to save application type",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleApplicationType = async (typeId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('application_types')
        .update({ is_active: !currentStatus })
        .eq('id', typeId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Application type ${!currentStatus ? 'activated' : 'deactivated'} successfully`,
      });

      fetchData();
    } catch (error) {
      console.error('Error toggling application type:', error);
      toast({
        title: "Error", 
        description: "Failed to update application type status",
        variant: "destructive",
      });
    }
  };

  const handleDeleteApplicationType = async (typeId: string) => {
    try {
      const { error } = await supabase
        .from('application_types')
        .delete()
        .eq('id', typeId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Application type deleted successfully",
      });

      fetchData();
    } catch (error) {
      console.error('Error deleting application type:', error);
      toast({
        title: "Error",
        description: "Failed to delete application type",
        variant: "destructive",
      });
    }
  };

  const handleDeleteApplication = async (applicationId: string) => {
    try {
      const { error } = await supabase
        .from('applications')
        .delete()
        .eq('id', applicationId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Application deleted successfully",
      });

      fetchData();
    } catch (error) {
      console.error('Error deleting application:', error);
      toast({
        title: "Error",
        description: "Failed to delete application",
        variant: "destructive",
      });
    }
  };

  // Discord logging helper function
  const sendDiscordLog = async (type: string, data: any) => {
    try {
      console.log('sendDiscordLog called with:', { type, data, serverSettings: serverSettings.discord_logging });
      
      // Check if Discord logging is enabled
      if (!serverSettings.discord_logging?.enabled) {
        console.log('Discord logging is not enabled');
        return;
      }

      // Check specific log type settings
      const logTypeEnabled = {
        'user_action': serverSettings.discord_logging?.log_user_actions,
        'application_action': serverSettings.discord_logging?.log_application_actions,
        'system_change': serverSettings.discord_logging?.log_system_changes,
        'rule_change': serverSettings.discord_logging?.log_rule_changes,
      };

      console.log('Log type enabled check:', { type, enabled: logTypeEnabled[type] });

      if (!logTypeEnabled[type]) {
        console.log(`Discord logging for ${type} is disabled`);
        return;
      }

      console.log('Calling discord-logger function...');

      // Call the Discord logger function
      const { data: result, error } = await supabase.functions.invoke('discord-logger', {
        body: {
          type: `admin_${type}`,
          data: {
            ...data,
            admin_user: user?.email || 'Unknown Admin',
            timestamp: new Date().toISOString()
          }
        }
      });

      if (error) {
        console.error('Discord logger function error:', error);
      } else {
        console.log('Discord logger function result:', result);
      }
    } catch (error) {
      console.error('Failed to send Discord log:', error);
    }
  };

  const handleSettingUpdate = async (settingType: string, value: any) => {
    try {
      // Use upsert to handle both insert and update cases
      const { error } = await supabase
        .from('server_settings')
        .upsert({
          setting_key: settingType,
          setting_value: value,
          updated_at: new Date().toISOString(),
          created_by: user?.id
        }, {
          onConflict: 'setting_key'
        });

      if (error) throw error;

      // Log system change to Discord
      await sendDiscordLog('system_change', {
        action: 'setting_updated',
        setting_key: settingType,
        setting_value: JSON.stringify(value),
        user: user?.email
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

  const pendingApplications = applications.filter(app => app.status === 'pending');
  console.log('All applications:', applications);
  console.log('Pending applications:', pendingApplications);

  // Emergency reset function for stuck states
  const resetStates = () => {
    setIsSubmitting(false);
    setIsLoading(false);
    console.log('Emergency reset: States reset to false');
    toast({
      title: "States Reset",
      description: "UI states have been reset. Buttons should work now.",
    });
  };

  if (isLoading) {
  return (
    <div className="min-h-screen bg-gradient-hero">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        {/* Emergency Reset Button - Always Visible */}
        <div className="mb-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-blue-400 font-medium">UI Controls</span>
              <p className="text-sm text-muted-foreground">Having issues with buttons or toggles?</p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={resetStates}
                variant="secondary"
                size="sm"
              >
                Reset UI States
              </Button>
              <Button
                onClick={() => {
                  // Reset Discord logging settings to false
                  const resetDiscordSettings = {
                    enabled: false,
                    webhook_url: serverSettings.discord_logging?.webhook_url || "",
                    log_rule_changes: false,
                    log_user_actions: false,
                    log_application_actions: false,
                    log_system_changes: false
                  };
                  setServerSettings({
                    ...serverSettings,
                    discord_logging: resetDiscordSettings
                  });
                  toast({
                    title: "Discord Logging Reset",
                    description: "All Discord logging toggles have been turned off.",
                  });
                }}
                variant="outline"
                size="sm"
              >
                Reset Discord Toggles
              </Button>
            </div>
          </div>
        </div>

        {/* Emergency Reset Button for when buttons are disabled */}
        {isSubmitting && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-red-400">Buttons disabled? UI might be stuck.</span>
              <Button
                onClick={resetStates}
                variant="destructive"
                size="sm"
              >
                Emergency Reset
              </Button>
            </div>
          </div>
        )}
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-purple mx-auto"></div>
            <p className="text-muted-foreground mt-4">Loading staff panel...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-4">
            Staff Management Panel
          </h1>
          <p className="text-muted-foreground text-lg">
            Manage applications, rules, and server settings
          </p>
        </div>

        {error && (
          <Alert className="mb-6 border-red-500/50 bg-red-500/10">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-red-400">{error}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="pending" className="space-y-6">
          <div className="flex justify-center overflow-x-auto">
            <TabsList className="bg-gaming-card border-gaming-border flex-wrap">
              <TabsTrigger value="pending" className="data-[state=active]:bg-gaming-dark">
                Pending Applications ({pendingApplications.length})
              </TabsTrigger>
              <TabsTrigger value="all-applications" className="data-[state=active]:bg-gaming-dark">
                Open Applications ({applications.filter(app => !app.closed).length})
              </TabsTrigger>
              <TabsTrigger value="closed-applications" className="data-[state=active]:bg-gaming-dark">
                Closed Applications ({applications.filter(app => app.closed).length})
              </TabsTrigger>
              <TabsTrigger value="app-types" className="data-[state=active]:bg-gaming-dark">
                Application Types
              </TabsTrigger>
              <TabsTrigger value="rules" className="data-[state=active]:bg-gaming-dark">
                Rules Management
              </TabsTrigger>
              <TabsTrigger value="staff" className="data-[state=active]:bg-gaming-dark">
                Staff Management
              </TabsTrigger>
              <TabsTrigger value="settings" className="data-[state=active]:bg-gaming-dark">
                Settings
              </TabsTrigger>
              <TabsTrigger value="content" className="data-[state=active]:bg-gaming-dark text-neon-purple">
                🎨 Homepage Content
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Pending Applications Tab */}
          <TabsContent value="pending" className="space-y-4">
            {pendingApplications.length === 0 ? (
              <Card className="p-8 text-center bg-gaming-card border-gaming-border shadow-gaming">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No Pending Applications</h3>
                <p className="text-muted-foreground">All applications have been reviewed!</p>
              </Card>
            ) : (
              pendingApplications.map((application) => (
                <Card key={application.id} className="p-6 bg-gaming-card border-gaming-border shadow-gaming">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-foreground">{application.steam_name}</h3>
                        <Badge variant="outline" className="border-yellow-500 text-yellow-500">
                          Pending Review
                        </Badge>
                      </div>
                      <p className="text-muted-foreground text-sm">
                        Submitted {new Date(application.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedApplication(application)}
                      className="border-gaming-border hover:border-neon-purple/50"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Review
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Discord:</span>
                      <p className="text-foreground">{application.discord_tag}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Age:</span>
                      <p className="text-foreground">{application.age}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">FiveM:</span>
                      <p className="text-foreground">{application.fivem_name}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Type:</span>
                      <p className="text-foreground">{application.application_type}</p>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          {/* All Applications Tab */}
          <TabsContent value="all-applications" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-foreground">All Applications</h2>
              <div className="flex gap-2">
               <Badge variant="outline" className="border-green-500 text-green-500">
                  Approved: {applications.filter(app => app.status === 'approved' && !app.closed).length}
                </Badge>
                <Badge variant="outline" className="border-red-500 text-red-500">
                  Denied: {applications.filter(app => app.status === 'denied' && !app.closed).length}
                </Badge>
                <Badge variant="outline" className="border-yellow-500 text-yellow-500">
                  Pending: {applications.filter(app => app.status === 'pending' && !app.closed).length}
                </Badge>
                <Badge variant="outline" className="border-blue-500 text-blue-500">
                  Under Review: {applications.filter(app => app.status === 'under_review' && !app.closed).length}
                </Badge>
                <Badge variant="outline" className="border-gray-500 text-gray-500">
                  Closed: {applications.filter(app => app.closed).length}
                </Badge>
              </div>
            </div>
            
            {applications.length === 0 ? (
              <Card className="p-8 text-center bg-gaming-card border-gaming-border shadow-gaming">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No Applications</h3>
                <p className="text-muted-foreground">No applications have been submitted yet.</p>
              </Card>
            ) : (
              applications.filter(app => !app.closed).map((application) => (
                <Card key={application.id} className="p-6 bg-gaming-card border-gaming-border shadow-gaming">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-foreground">{application.steam_name}</h3>
                        <Badge 
                          variant="outline" 
                          className={
                            application.status === 'approved' 
                              ? "border-green-500 text-green-500" 
                              : application.status === 'denied'
                              ? "border-red-500 text-red-500"
                              : application.status === 'under_review'
                              ? "border-blue-500 text-blue-500"
                              : "border-yellow-500 text-yellow-500"
                          }
                        >
                          {application.status === 'approved' && <CheckCircle className="h-3 w-3 mr-1" />}
                          {application.status === 'denied' && <XCircle className="h-3 w-3 mr-1" />}
                          {application.status === 'under_review' && <Eye className="h-3 w-3 mr-1" />}
                          {application.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                          {application.status.charAt(0).toUpperCase() + application.status.slice(1).replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground text-sm">
                        Submitted {new Date(application.created_at).toLocaleDateString()}
                        {application.reviewed_by && (
                          <span> • Reviewed by staff</span>
                        )}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedApplication(application)}
                        className="border-gaming-border hover:border-neon-purple/50"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCloseApplication(application.id)}
                        className="border-orange-500 text-orange-500 hover:bg-orange-500/10"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Close
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-red-500 text-red-500 hover:bg-red-500/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-gaming-card border-gaming-border">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-foreground">Delete Application</AlertDialogTitle>
                            <AlertDialogDescription className="text-muted-foreground">
                              Are you sure you want to delete this application from {application.steam_name}? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="border-gaming-border hover:border-neon-purple/50">
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteApplication(application.id)}
                              className="bg-red-500 hover:bg-red-600"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Discord:</span>
                      <p className="text-foreground">{application.discord_tag}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Age:</span>
                      <p className="text-foreground">{application.age}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">FiveM:</span>
                      <p className="text-foreground">{application.fivem_name}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Type:</span>
                      <p className="text-foreground">{application.application_type}</p>
                    </div>
                  </div>
                  
                  {application.review_notes && (
                    <div className="mt-4 p-3 bg-gaming-dark rounded-lg">
                      <span className="text-muted-foreground text-sm">Review Notes:</span>
                      <p className="text-foreground text-sm mt-1">{application.review_notes}</p>
                    </div>
                  )}
                </Card>
              ))
            )}
          </TabsContent>

          {/* Closed Applications Tab */}
          <TabsContent value="closed-applications" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-foreground">Closed Applications</h2>
              <Badge variant="outline" className="border-gray-500 text-gray-500">
                Total: {applications.filter(app => app.closed).length}
              </Badge>
            </div>
            
            {applications.filter(app => app.closed).length === 0 ? (
              <Card className="p-8 text-center bg-gaming-card border-gaming-border shadow-gaming">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No Closed Applications</h3>
                <p className="text-muted-foreground">No applications have been closed yet.</p>
              </Card>
            ) : (
              applications.filter(app => app.closed).map((application) => (
                <Card key={application.id} className="p-6 bg-gaming-card border-gaming-border shadow-gaming opacity-75">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-foreground">{application.steam_name}</h3>
                        <Badge variant="outline" className="border-gray-500 text-gray-500">
                          <XCircle className="h-3 w-3 mr-1" />
                          Closed
                        </Badge>
                        <Badge 
                          variant="outline" 
                          className={
                            application.status === 'approved' 
                              ? "border-green-500 text-green-500" 
                              : application.status === 'denied'
                              ? "border-red-500 text-red-500"
                              : application.status === 'under_review'
                              ? "border-blue-500 text-blue-500"
                              : "border-yellow-500 text-yellow-500"
                          }
                        >
                          {application.status.charAt(0).toUpperCase() + application.status.slice(1).replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground text-sm">
                        Submitted {new Date(application.created_at).toLocaleDateString()}
                        {application.closed_at && (
                          <span> • Closed {new Date(application.closed_at).toLocaleDateString()}</span>
                        )}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedApplication(application)}
                        className="border-gaming-border hover:bg-gaming-dark"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCloseApplication(application.id)}
                        className="border-orange-500 text-orange-500 hover:bg-orange-500/10"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Close
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          try {
                            const { error } = await supabase
                              .from('applications')
                              .update({ 
                                closed: false,
                                closed_at: null,
                                closed_by: null
                              })
                              .eq('id', application.id);

                            if (error) throw error;

                            toast({
                              title: "Success",
                              description: "Application reopened successfully",
                            });

                            fetchData();
                          } catch (error) {
                            console.error('Error reopening application:', error);
                            toast({
                              title: "Error",
                              description: "Failed to reopen application",
                              variant: "destructive",
                            });
                          }
                        }}
                        className="border-green-500 text-green-500 hover:bg-green-500/10"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Reopen
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Discord:</span>
                      <p className="text-foreground">{application.discord_tag}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">FiveM:</span>
                      <p className="text-foreground">{application.fivem_name}</p>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Application Types Tab */}
          <TabsContent value="app-types" className="space-y-4">
            <Card className="p-6 bg-gaming-card border-gaming-border shadow-gaming">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-foreground">Application Types</h2>
                <Dialog open={showApplicationTypeDialog} onOpenChange={setShowApplicationTypeDialog}>
                  <DialogTrigger asChild>
                    <Button variant="neon">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Type
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-gaming-card border-gaming-border">
                    <DialogHeader>
                      <DialogTitle className="text-foreground">
                        {editingApplicationType ? "Edit Application Type" : "Create Application Type"}
                      </DialogTitle>
                      <DialogDescription className="text-muted-foreground">
                        Define the application type and form fields
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                      <div>
                        <Label className="text-foreground">Type Name</Label>
                        <Input
                          value={newApplicationType.name}
                          onChange={(e) => setNewApplicationType(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="e.g., Police Officer, EMS, etc."
                          className="bg-gaming-dark border-gaming-border text-foreground"
                        />
                      </div>
                      
                      <div>
                        <Label className="text-foreground">Description</Label>
                        <Textarea
                          value={newApplicationType.description}
                          onChange={(e) => setNewApplicationType(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Description of this application type..."
                          className="bg-gaming-dark border-gaming-border text-foreground"
                        />
                      </div>
                      
                      <div>
                        <Label className="text-foreground">Form Fields</Label>
                        <div className="space-y-2">
                          {newApplicationType.formFields.map((field, index) => (
                            <div key={index} className="flex gap-2 items-center p-3 bg-gaming-dark rounded-lg">
                              <div className="flex-1">
                                <Input
                                  value={field.label}
                                  onChange={(e) => {
                                    const updatedFields = [...newApplicationType.formFields];
                                    updatedFields[index].label = e.target.value;
                                    setNewApplicationType(prev => ({ ...prev, formFields: updatedFields }));
                                  }}
                                  placeholder="Field Label"
                                  className="mb-2"
                                />
                                <div className="flex gap-2">
                                  <Input
                                    value={field.name}
                                    onChange={(e) => {
                                      const updatedFields = [...newApplicationType.formFields];
                                      updatedFields[index].name = e.target.value;
                                      setNewApplicationType(prev => ({ ...prev, formFields: updatedFields }));
                                    }}
                                    placeholder="Field Name"
                                    className="flex-1"
                                  />
                                  <select
                                    value={field.type}
                                    onChange={(e) => {
                                      const updatedFields = [...newApplicationType.formFields];
                                      updatedFields[index].type = e.target.value;
                                      setNewApplicationType(prev => ({ ...prev, formFields: updatedFields }));
                                    }}
                                    className="px-3 py-2 bg-gaming-dark border border-gaming-border rounded-md text-foreground"
                                  >
                                    <option value="text">Text</option>
                                    <option value="email">Email</option>
                                    <option value="number">Number</option>
                                    <option value="textarea">Textarea</option>
                                  </select>
                                </div>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const updatedFields = newApplicationType.formFields.filter((_, i) => i !== index);
                                  setNewApplicationType(prev => ({ ...prev, formFields: updatedFields }));
                                }}
                                className="border-red-500 text-red-500 hover:bg-red-500/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                        
                        <Button
                          variant="outline"
                          onClick={() => {
                            setNewApplicationType(prev => ({
                              ...prev,
                              formFields: [
                                ...prev.formFields,
                                { name: "", label: "", type: "text", required: true, placeholder: "" }
                              ]
                            }));
                          }}
                          className="w-full mt-2 border-gaming-border hover:border-neon-purple/50"
                        >
                          Add Form Field
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2 pt-4">
                      <Button 
                        variant="neon" 
                        onClick={handleSaveApplicationType}
                        disabled={isSubmitting || !newApplicationType.name}
                        className="flex-1"
                      >
                        {isSubmitting ? "Saving..." : (editingApplicationType ? "Update" : "Create")}
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => {
                          setShowApplicationTypeDialog(false);
                          setEditingApplicationType(null);
                          setNewApplicationType({
                            name: "",
                            description: "",
                            formFields: [
                              { name: "steam_name", label: "Steam Name", type: "text", required: true, placeholder: "" },
                              { name: "discord_tag", label: "Discord Tag", type: "text", required: true, placeholder: "username#1234" },
                              { name: "discord_name", label: "Discord User ID", type: "text", required: true, placeholder: "123456789012345678" },
                              { name: "fivem_name", label: "FiveM Name", type: "text", required: true, placeholder: "" },
                              { name: "age", label: "Age", type: "number", required: true, placeholder: "" }
                            ]
                          });
                        }}
                        disabled={isSubmitting}
                        className="flex-1 border-gaming-border hover:border-neon-purple/50"
                      >
                        Cancel
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {applicationTypes.length === 0 ? (
                  <div className="col-span-full text-center py-8">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No application types created yet.</p>
                  </div>
                ) : (
                  applicationTypes.map((type) => (
                    <Card key={type.id} className="p-4 bg-gaming-dark border-gaming-border">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground">{type.name}</h3>
                          <Badge variant={type.is_active ? "default" : "secondary"} className="text-xs">
                            {type.is_active ? "Active" : "Closed"}
                          </Badge>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingApplicationType(type);
                              setNewApplicationType({
                                name: type.name,
                                description: type.description,
                                formFields: type.form_fields || []
                              });
                              setShowApplicationTypeDialog(true);
                            }}
                            className="h-8 w-8 p-0 border-gaming-border hover:border-neon-purple/50"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleApplicationType(type.id, type.is_active)}
                            className={`h-8 w-8 p-0 border-gaming-border ${
                              type.is_active 
                                ? 'text-yellow-500 hover:bg-yellow-500/10 hover:border-yellow-500/50' 
                                : 'text-green-500 hover:bg-green-500/10 hover:border-green-500/50'
                            }`}
                            title={type.is_active ? 'Close Application Type' : 'Open Application Type'}
                          >
                            {type.is_active ? <XCircle className="h-3 w-3" /> : <CheckCircle className="h-3 w-3" />}
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0 border-red-500 text-red-500 hover:bg-red-500/10"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-gaming-card border-gaming-border">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-foreground">Delete Application Type</AlertDialogTitle>
                                <AlertDialogDescription className="text-muted-foreground">
                                  Are you sure you want to delete "{type.name}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="border-gaming-border hover:border-neon-purple/50">
                                  Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteApplicationType(type.id)}
                                  className="bg-red-500 hover:bg-red-600"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                      <p className="text-muted-foreground text-sm mb-3">{type.description}</p>
                      <div className="text-xs text-muted-foreground">
                        {(type.form_fields || []).length} form fields
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </Card>
          </TabsContent>

          {/* Rules Management Tab */}
          <TabsContent value="rules" className="space-y-4">
            <Card className="p-6 bg-gaming-card border-gaming-border shadow-gaming">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-foreground">Rules Management</h2>
                <Button
                  variant="neon"
                  onClick={() => {
                    setEditingRule(null);
                    setNewRule({ category: "", title: "", description: "" });
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Rule
                </Button>
              </div>
              
              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-foreground">Category</Label>
                    <Input
                      value={newRule.category}
                      onChange={(e) => setNewRule(prev => ({ ...prev, category: e.target.value }))}
                      placeholder="e.g., General, RP Rules"
                      className="bg-gaming-dark border-gaming-border text-foreground"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-foreground">Title</Label>
                    <Input
                      value={newRule.title}
                      onChange={(e) => setNewRule(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Rule title"
                      className="bg-gaming-dark border-gaming-border text-foreground"
                    />
                  </div>
                </div>
                
                <div>
                  <Label className="text-foreground">Description</Label>
                  <Textarea
                    value={newRule.description}
                    onChange={(e) => setNewRule(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Detailed rule description..."
                    className="bg-gaming-dark border-gaming-border text-foreground"
                    rows={3}
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="neon"
                    onClick={handleSaveRule}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Saving..." : (editingRule ? "Update Rule" : "Add Rule")}
                  </Button>
                  {editingRule && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditingRule(null);
                        setNewRule({ category: "", title: "", description: "" });
                      }}
                      className="border-gaming-border hover:border-neon-purple/50"
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="space-y-4">
                {rules.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No rules created yet.</p>
                  </div>
                ) : (
                  rules.map((rule) => (
                    <Card key={rule.id} className="p-4 bg-gaming-dark border-gaming-border">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="border-neon-purple text-neon-purple">
                              {rule.category}
                            </Badge>
                            <h3 className="font-semibold text-foreground">{rule.title}</h3>
                          </div>
                          <p className="text-muted-foreground text-sm">{rule.description}</p>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingRule(rule);
                              setNewRule({
                                category: rule.category,
                                title: rule.title,
                                description: rule.description
                              });
                            }}
                            className="border-gaming-border hover:border-neon-purple/50"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-red-500 text-red-500 hover:bg-red-500/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-gaming-card border-gaming-border">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-foreground">Delete Rule</AlertDialogTitle>
                                <AlertDialogDescription className="text-muted-foreground">
                                  Are you sure you want to delete this rule? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="border-gaming-border hover:border-neon-purple/50">
                                  Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteRule(rule.id)}
                                  className="bg-red-500 hover:bg-red-600"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </Card>
          </TabsContent>

          {/* Staff Management Tab */}
          <TabsContent value="staff" className="space-y-4">
            <Card className="p-6 bg-gaming-card border-gaming-border shadow-gaming">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-foreground">Staff Management</h2>
                <Dialog open={showStaffDialog} onOpenChange={setShowStaffDialog}>
                  <DialogTrigger asChild>
                    <Button variant="neon">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Staff
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-gaming-card border-gaming-border">
                    <DialogHeader>
                      <DialogTitle className="text-foreground">Add Staff Member</DialogTitle>
                      <DialogDescription className="text-muted-foreground">
                        Add a new staff member to the team
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                      <div>
                        <Label className="text-foreground">Email Address</Label>
                        <Input
                          type="email"
                          value={newStaffEmail}
                          onChange={(e) => setNewStaffEmail(e.target.value)}
                          placeholder="staff@example.com"
                          className="bg-gaming-dark border-gaming-border text-foreground"
                        />
                      </div>
                      
                      <div>
                        <Label className="text-foreground">Role</Label>
                        <select
                          value={newStaffRole}
                          onChange={(e) => setNewStaffRole(e.target.value)}
                          className="w-full px-3 py-2 bg-gaming-dark border border-gaming-border rounded-md text-foreground"
                        >
                          <option value="moderator">Moderator</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2 pt-4">
                      <Button
                        variant="neon"
                        onClick={handleAddStaff}
                        disabled={isSubmitting || !newStaffEmail}
                        className="flex-1"
                      >
                        {isSubmitting ? "Adding..." : "Add Staff"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowStaffDialog(false);
                          setNewStaffEmail("");
                          setNewStaffRole("moderator");
                        }}
                        disabled={isSubmitting}
                        className="flex-1 border-gaming-border hover:border-neon-purple/50"
                      >
                        Cancel
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {staffMembers.length === 0 ? (
                  <div className="col-span-full text-center py-8">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No staff members added yet.</p>
                  </div>
                ) : (
                  staffMembers.map((staff) => (
                    <Card key={staff.id} className="p-4 bg-gaming-dark border-gaming-border">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground">
                            {staff.profiles?.full_name || staff.profiles?.username || 'Unknown User'}
                          </h3>
                          <Badge
                            variant="outline"
                            className={
                              staff.role === 'admin'
                                ? "border-red-500 text-red-500"
                                : "border-green-500 text-green-500"
                            }
                          >
                            {staff.role}
                          </Badge>
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-red-500 text-red-500 hover:bg-red-500/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-gaming-card border-gaming-border">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-foreground">Remove Staff Member</AlertDialogTitle>
                              <AlertDialogDescription className="text-muted-foreground">
                                Are you sure you want to remove {staff.profiles?.full_name || staff.profiles?.username} from the staff team?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="border-gaming-border hover:border-neon-purple/50">
                                Cancel
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleRemoveStaff(staff.id)}
                                className="bg-red-500 hover:bg-red-600"
                              >
                                Remove
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                      <p className="text-muted-foreground text-xs">
                        Added {new Date(staff.created_at).toLocaleDateString()}
                      </p>
                    </Card>
                  ))
                )}
              </div>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* General Settings */}
              <Card className="p-6 bg-gaming-card border-gaming-border shadow-gaming">
                <div className="flex items-center space-x-2 mb-6">
                  <Settings className="h-5 w-5 text-neon-purple" />
                  <h2 className="text-xl font-semibold text-foreground">General Settings</h2>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label className="text-foreground">Server Name</Label>
                    <Input
                      value={serverSettings.general_settings?.server_name || ''}
                      onChange={(e) => {
                        const newSettings = {
                          ...serverSettings.general_settings,
                          server_name: e.target.value
                        };
                        setServerSettings({
                          ...serverSettings,
                          general_settings: newSettings
                        });
                      }}
                      onBlur={() => handleSettingUpdate('general_settings', {
                        ...serverSettings.general_settings,
                        server_name: serverSettings.general_settings?.server_name || ''
                      })}
                      placeholder="Enter server name..."
                      className="bg-gaming-dark border-gaming-border text-foreground"
                    />
                  </div>

                  <div>
                    <Label className="text-foreground">Welcome Message</Label>
                    <Textarea
                      value={serverSettings.general_settings?.welcome_message || ''}
                      onChange={(e) => {
                        const newSettings = {
                          ...serverSettings.general_settings,
                          welcome_message: e.target.value
                        };
                        setServerSettings({
                          ...serverSettings,
                          general_settings: newSettings
                        });
                      }}
                      onBlur={() => handleSettingUpdate('general_settings', {
                        ...serverSettings.general_settings,
                        welcome_message: serverSettings.general_settings?.welcome_message || ''
                      })}
                      placeholder="Welcome message for new users..."
                      className="bg-gaming-dark border-gaming-border text-foreground"
                      rows={3}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-foreground">Maintenance Mode</Label>
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

                  <div>
                    <Label className="text-foreground">Max Server Population</Label>
                    <Input
                      type="number"
                      value={serverSettings.general_settings?.max_population || 128}
                      onChange={(e) => {
                        const newSettings = {
                          ...serverSettings.general_settings,
                          max_population: parseInt(e.target.value) || 128
                        };
                        setServerSettings({
                          ...serverSettings,
                          general_settings: newSettings
                        });
                      }}
                      onBlur={() => handleSettingUpdate('general_settings', {
                        ...serverSettings.general_settings,
                        max_population: serverSettings.general_settings?.max_population || 128
                      })}
                      className="bg-gaming-dark border-gaming-border text-foreground"
                    />
                  </div>
                </div>
              </Card>

              {/* Application Settings */}
              <Card className="p-6 bg-gaming-card border-gaming-border shadow-gaming">
                <div className="flex items-center space-x-2 mb-6">
                  <FileText className="h-5 w-5 text-neon-purple" />
                  <h2 className="text-xl font-semibold text-foreground">Application Settings</h2>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-foreground">Accept New Applications</Label>
                    <Switch
                      checked={serverSettings.application_settings?.accept_applications !== false}
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

                  <div className="flex items-center justify-between">
                    <Label className="text-foreground">Allow Multiple Applications</Label>
                    <Switch
                      checked={serverSettings.application_settings?.allow_multiple_applications || false}
                      onCheckedChange={(checked) => {
                        const newSettings = {
                          ...serverSettings.application_settings,
                          allow_multiple_applications: checked
                        };
                        setServerSettings({
                          ...serverSettings,
                          application_settings: newSettings
                        });
                        handleSettingUpdate('application_settings', newSettings);
                      }}
                    />
                  </div>

                  <div>
                    <Label className="text-foreground">Application Cooldown (days)</Label>
                    <Input
                      type="number"
                      value={serverSettings.application_settings?.application_cooldown_days || 7}
                      onChange={(e) => {
                        const newSettings = {
                          ...serverSettings.application_settings,
                          application_cooldown_days: parseInt(e.target.value) || 7
                        };
                        setServerSettings({
                          ...serverSettings,
                          application_settings: newSettings
                        });
                      }}
                      onBlur={() => handleSettingUpdate('application_settings', {
                        ...serverSettings.application_settings,
                        application_cooldown_days: serverSettings.application_settings?.application_cooldown_days || 7
                      })}
                      className="bg-gaming-dark border-gaming-border text-foreground"
                    />
                  </div>

                  <div>
                    <Label className="text-foreground">Auto-Reject After (days)</Label>
                    <Input
                      type="number"
                      value={serverSettings.application_settings?.auto_reject_days || 30}
                      onChange={(e) => {
                        const newSettings = {
                          ...serverSettings.application_settings,
                          auto_reject_days: parseInt(e.target.value) || 30
                        };
                        setServerSettings({
                          ...serverSettings,
                          application_settings: newSettings
                        });
                      }}
                      onBlur={() => handleSettingUpdate('application_settings', {
                        ...serverSettings.application_settings,
                        auto_reject_days: serverSettings.application_settings?.auto_reject_days || 30
                      })}
                      className="bg-gaming-dark border-gaming-border text-foreground"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-foreground">Require Whitelist for Applications</Label>
                    <Switch
                      checked={serverSettings.application_settings?.require_whitelist || false}
                      onCheckedChange={(checked) => {
                        const newSettings = {
                          ...serverSettings.application_settings,
                          require_whitelist: checked
                        };
                        setServerSettings({
                          ...serverSettings,
                          application_settings: newSettings
                        });
                        handleSettingUpdate('application_settings', newSettings);
                      }}
                    />
                  </div>
                </div>
              </Card>

              {/* Discord Integration */}
              <Card className="p-6 bg-gaming-card border-gaming-border shadow-gaming">
                <div className="flex items-center space-x-2 mb-6">
                  <Users className="h-5 w-5 text-neon-purple" />
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
                      onBlur={() => handleSettingUpdate('discord_settings', {
                        ...serverSettings.discord_settings,
                        server_id: serverSettings.discord_settings?.server_id || ''
                      })}
                      placeholder="Discord server ID..."
                      className="bg-gaming-dark border-gaming-border text-foreground"
                    />
                  </div>

                  <div>
                    <Label className="text-foreground">Discord Webhook URL</Label>
                    <Input
                      value={serverSettings.discord_settings?.webhook_url || ''}
                      onChange={(e) => {
                        const newSettings = {
                          ...serverSettings.discord_settings,
                          webhook_url: e.target.value
                        };
                        setServerSettings({
                          ...serverSettings,
                          discord_settings: newSettings
                        });
                      }}
                      onBlur={() => handleSettingUpdate('discord_settings', {
                        ...serverSettings.discord_settings,
                        webhook_url: serverSettings.discord_settings?.webhook_url || ''
                      })}
                      placeholder="https://discord.com/api/webhooks/..."
                      className="bg-gaming-dark border-gaming-border text-foreground"
                    />
                  </div>

                  <div>
                    <Label className="text-foreground">Application Notification Channel</Label>
                    <Input
                      value={serverSettings.discord_settings?.application_channel || ''}
                      onChange={(e) => {
                        const newSettings = {
                          ...serverSettings.discord_settings,
                          application_channel: e.target.value
                        };
                        setServerSettings({
                          ...serverSettings,
                          discord_settings: newSettings
                        });
                      }}
                      onBlur={() => handleSettingUpdate('discord_settings', {
                        ...serverSettings.discord_settings,
                        application_channel: serverSettings.discord_settings?.application_channel || ''
                      })}
                      placeholder="Channel ID for application notifications..."
                      className="bg-gaming-dark border-gaming-border text-foreground"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-foreground">Auto-Role Assignment</Label>
                    <Switch
                      checked={serverSettings.discord_settings?.auto_roles || false}
                      onCheckedChange={(checked) => {
                        const newSettings = {
                          ...serverSettings.discord_settings,
                          auto_roles: checked
                        };
                        setServerSettings({
                          ...serverSettings,
                          discord_settings: newSettings
                        });
                        handleSettingUpdate('discord_settings', newSettings);
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-foreground">Sync Discord Roles</Label>
                    <Switch
                      checked={serverSettings.discord_settings?.sync_roles || false}
                      onCheckedChange={(checked) => {
                        const newSettings = {
                          ...serverSettings.discord_settings,
                          sync_roles: checked
                        };
                        setServerSettings({
                          ...serverSettings,
                          discord_settings: newSettings
                        });
                        handleSettingUpdate('discord_settings', newSettings);
                      }}
                    />
                  </div>

                  <div>
                    <Label className="text-foreground">Approved Role ID</Label>
                    <Input
                      value={serverSettings.discord_settings?.approved_role_id || ''}
                      onChange={(e) => {
                        const newSettings = {
                          ...serverSettings.discord_settings,
                          approved_role_id: e.target.value
                        };
                        setServerSettings({
                          ...serverSettings,
                          discord_settings: newSettings
                        });
                      }}
                      onBlur={() => handleSettingUpdate('discord_settings', {
                        ...serverSettings.discord_settings,
                        approved_role_id: serverSettings.discord_settings?.approved_role_id || ''
                      })}
                      placeholder="Role ID to assign to approved members..."
                      className="bg-gaming-dark border-gaming-border text-foreground"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-foreground">Send Application Notifications</Label>
                    <Switch
                      checked={serverSettings.discord_settings?.send_notifications || true}
                      onCheckedChange={(checked) => {
                        const newSettings = {
                          ...serverSettings.discord_settings,
                          send_notifications: checked
                        };
                        setServerSettings({
                          ...serverSettings,
                          discord_settings: newSettings
                        });
                        handleSettingUpdate('discord_settings', newSettings);
                      }}
                    />
                  </div>
                </div>
              </Card>

              {/* Discord Admin Action Logging */}
              <Card className="p-6 bg-gaming-card border-gaming-border shadow-gaming">
                <div className="flex items-center space-x-2 mb-6">
                  <FileText className="h-5 w-5 text-neon-purple" />
                  <h2 className="text-xl font-semibold text-foreground">Discord Admin Action Logging</h2>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-foreground">Enable Discord Logging</Label>
                    <Switch
                      checked={serverSettings.discord_logging?.enabled || false}
                      onCheckedChange={(checked) => {
                        const newSettings = {
                          ...serverSettings.discord_logging,
                          enabled: checked
                        };
                        setServerSettings({
                          ...serverSettings,
                          discord_logging: newSettings
                        });
                        handleSettingUpdate('discord_logging', newSettings);
                      }}
                    />
                  </div>

                  <div>
                    <Label className="text-foreground">Admin Actions Webhook URL</Label>
                    <Input
                      value={serverSettings.discord_logging?.webhook_url || ''}
                      onChange={(e) => {
                        const newSettings = {
                          ...serverSettings.discord_logging,
                          webhook_url: e.target.value
                        };
                        setServerSettings({
                          ...serverSettings,
                          discord_logging: newSettings
                        });
                      }}
                      onBlur={() => handleSettingUpdate('discord_logging', {
                        ...serverSettings.discord_logging,
                        webhook_url: serverSettings.discord_logging?.webhook_url || ''
                      })}
                      placeholder="https://discord.com/api/webhooks/..."
                      className="bg-gaming-dark border-gaming-border text-foreground"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-foreground">Log User Management Actions</Label>
                      <Switch
                        checked={serverSettings.discord_logging?.log_user_actions || false}
                        onCheckedChange={(checked) => {
                          const newSettings = {
                            ...serverSettings.discord_logging,
                            log_user_actions: checked
                          };
                          setServerSettings({
                            ...serverSettings,
                            discord_logging: newSettings
                          });
                          handleSettingUpdate('discord_logging', newSettings);
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label className="text-foreground">Log Application Actions</Label>
                      <Switch
                        checked={serverSettings.discord_logging?.log_application_actions || false}
                        onCheckedChange={(checked) => {
                          const newSettings = {
                            ...serverSettings.discord_logging,
                            log_application_actions: checked
                          };
                          setServerSettings({
                            ...serverSettings,
                            discord_logging: newSettings
                          });
                          handleSettingUpdate('discord_logging', newSettings);
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label className="text-foreground">Log System Changes</Label>
                      <Switch
                        checked={serverSettings.discord_logging?.log_system_changes || false}
                        onCheckedChange={(checked) => {
                          const newSettings = {
                            ...serverSettings.discord_logging,
                            log_system_changes: checked
                          };
                          setServerSettings({
                            ...serverSettings,
                            discord_logging: newSettings
                          });
                          handleSettingUpdate('discord_logging', newSettings);
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label className="text-foreground">Log Rule Changes</Label>
                      <Switch
                        checked={serverSettings.discord_logging?.log_rule_changes || false}
                        onCheckedChange={(checked) => {
                          const newSettings = {
                            ...serverSettings.discord_logging,
                            log_rule_changes: checked
                          };
                          setServerSettings({
                            ...serverSettings,
                            discord_logging: newSettings
                          });
                          handleSettingUpdate('discord_logging', newSettings);
                        }}
                      />
                    </div>
                  </div>

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Admin actions will be automatically logged to Discord when enabled. Make sure the webhook URL has proper permissions.
                    </AlertDescription>
                  </Alert>
                </div>
              </Card>

              {/* Security Settings */}
              <Card className="p-6 bg-gaming-card border-gaming-border shadow-gaming">
                <div className="flex items-center space-x-2 mb-6">
                  <AlertCircle className="h-5 w-5 text-neon-purple" />
                  <h2 className="text-xl font-semibold text-foreground">Security Settings</h2>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-foreground">Enable IP Whitelist</Label>
                    <Switch
                      checked={serverSettings.security_settings?.ip_whitelist || false}
                      onCheckedChange={(checked) => {
                        const newSettings = {
                          ...serverSettings.security_settings,
                          ip_whitelist: checked
                        };
                        setServerSettings({
                          ...serverSettings,
                          security_settings: newSettings
                        });
                        handleSettingUpdate('security_settings', newSettings);
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-foreground">Two-Factor Authentication Required</Label>
                    <Switch
                      checked={serverSettings.security_settings?.require_2fa || false}
                      onCheckedChange={(checked) => {
                        const newSettings = {
                          ...serverSettings.security_settings,
                          require_2fa: checked
                        };
                        setServerSettings({
                          ...serverSettings,
                          security_settings: newSettings
                        });
                        handleSettingUpdate('security_settings', newSettings);
                      }}
                    />
                  </div>

                  <div>
                    <Label className="text-foreground">Max Login Attempts</Label>
                    <Input
                      type="number"
                      value={serverSettings.security_settings?.max_login_attempts || 5}
                      onChange={(e) => {
                        const newSettings = {
                          ...serverSettings.security_settings,
                          max_login_attempts: parseInt(e.target.value) || 5
                        };
                        setServerSettings({
                          ...serverSettings,
                          security_settings: newSettings
                        });
                      }}
                      onBlur={() => handleSettingUpdate('security_settings', {
                        ...serverSettings.security_settings,
                        max_login_attempts: serverSettings.security_settings?.max_login_attempts || 5
                      })}
                      className="bg-gaming-dark border-gaming-border text-foreground"
                    />
                  </div>

                  <div>
                    <Label className="text-foreground">Session Timeout (minutes)</Label>
                    <Input
                      type="number"
                      value={serverSettings.security_settings?.session_timeout || 60}
                      onChange={(e) => {
                        const newSettings = {
                          ...serverSettings.security_settings,
                          session_timeout: parseInt(e.target.value) || 60
                        };
                        setServerSettings({
                          ...serverSettings,
                          security_settings: newSettings
                        });
                      }}
                      onBlur={() => handleSettingUpdate('security_settings', {
                        ...serverSettings.security_settings,
                        session_timeout: serverSettings.security_settings?.session_timeout || 60
                      })}
                      className="bg-gaming-dark border-gaming-border text-foreground"
                    />
                  </div>
                </div>
              </Card>

              {/* Performance Settings */}
              <Card className="p-6 bg-gaming-card border-gaming-border shadow-gaming">
                <div className="flex items-center space-x-2 mb-6">
                  <Settings className="h-5 w-5 text-neon-purple" />
                  <h2 className="text-xl font-semibold text-foreground">Performance Settings</h2>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label className="text-foreground">Server Tick Rate</Label>
                    <select
                      value={serverSettings.performance_settings?.tick_rate || 30}
                      onChange={(e) => {
                        const newSettings = {
                          ...serverSettings.performance_settings,
                          tick_rate: parseInt(e.target.value)
                        };
                        setServerSettings({
                          ...serverSettings,
                          performance_settings: newSettings
                        });
                        handleSettingUpdate('performance_settings', newSettings);
                      }}
                      className="w-full px-3 py-2 bg-gaming-dark border border-gaming-border rounded-md text-foreground"
                    >
                      <option value={15}>15 Hz</option>
                      <option value={30}>30 Hz</option>
                      <option value={60}>60 Hz</option>
                      <option value={120}>120 Hz</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-foreground">Auto-Restart Enabled</Label>
                    <Switch
                      checked={serverSettings.performance_settings?.auto_restart || false}
                      onCheckedChange={(checked) => {
                        const newSettings = {
                          ...serverSettings.performance_settings,
                          auto_restart: checked
                        };
                        setServerSettings({
                          ...serverSettings,
                          performance_settings: newSettings
                        });
                        handleSettingUpdate('performance_settings', newSettings);
                      }}
                    />
                  </div>

                  <div>
                    <Label className="text-foreground">Restart Interval (hours)</Label>
                    <Input
                      type="number"
                      value={serverSettings.performance_settings?.restart_interval || 6}
                      onChange={(e) => {
                        const newSettings = {
                          ...serverSettings.performance_settings,
                          restart_interval: parseInt(e.target.value) || 6
                        };
                        setServerSettings({
                          ...serverSettings,
                          performance_settings: newSettings
                        });
                      }}
                      onBlur={() => handleSettingUpdate('performance_settings', {
                        ...serverSettings.performance_settings,
                        restart_interval: serverSettings.performance_settings?.restart_interval || 6
                      })}
                      className="bg-gaming-dark border-gaming-border text-foreground"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-foreground">Performance Monitoring</Label>
                    <Switch
                      checked={serverSettings.performance_settings?.monitoring || true}
                      onCheckedChange={(checked) => {
                        const newSettings = {
                          ...serverSettings.performance_settings,
                          monitoring: checked
                        };
                        setServerSettings({
                          ...serverSettings,
                          performance_settings: newSettings
                        });
                        handleSettingUpdate('performance_settings', newSettings);
                      }}
                    />
                  </div>
                </div>
              </Card>

              {/* Logging & Analytics */}
              <Card className="p-6 bg-gaming-card border-gaming-border shadow-gaming">
                <div className="flex items-center space-x-2 mb-6">
                  <FileText className="h-5 w-5 text-neon-purple" />
                  <h2 className="text-xl font-semibold text-foreground">Logging & Analytics</h2>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-foreground">Enable Detailed Logging</Label>
                    <Switch
                      checked={serverSettings.logging_settings?.detailed_logs || true}
                      onCheckedChange={(checked) => {
                        const newSettings = {
                          ...serverSettings.logging_settings,
                          detailed_logs: checked
                        };
                        setServerSettings({
                          ...serverSettings,
                          logging_settings: newSettings
                        });
                        handleSettingUpdate('logging_settings', newSettings);
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-foreground">Log Player Actions</Label>
                    <Switch
                      checked={serverSettings.logging_settings?.player_actions || true}
                      onCheckedChange={(checked) => {
                        const newSettings = {
                          ...serverSettings.logging_settings,
                          player_actions: checked
                        };
                        setServerSettings({
                          ...serverSettings,
                          logging_settings: newSettings
                        });
                        handleSettingUpdate('logging_settings', newSettings);
                      }}
                    />
                  </div>

                  <div>
                    <Label className="text-foreground">Log Retention (days)</Label>
                    <Input
                      type="number"
                      value={serverSettings.logging_settings?.retention_days || 30}
                      onChange={(e) => {
                        const newSettings = {
                          ...serverSettings.logging_settings,
                          retention_days: parseInt(e.target.value) || 30
                        };
                        setServerSettings({
                          ...serverSettings,
                          logging_settings: newSettings
                        });
                      }}
                      onBlur={() => handleSettingUpdate('logging_settings', {
                        ...serverSettings.logging_settings,
                        retention_days: serverSettings.logging_settings?.retention_days || 30
                      })}
                      className="bg-gaming-dark border-gaming-border text-foreground"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-foreground">Analytics Enabled</Label>
                    <Switch
                      checked={serverSettings.logging_settings?.analytics || true}
                      onCheckedChange={(checked) => {
                        const newSettings = {
                          ...serverSettings.logging_settings,
                          analytics: checked
                        };
                        setServerSettings({
                          ...serverSettings,
                          logging_settings: newSettings
                        });
                        handleSettingUpdate('logging_settings', newSettings);
                      }}
                    />
                  </div>
                </div>
              </Card>
              
              {/* Server Join Link Management */}
              <Card className="bg-gaming-card border-gaming-border">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    Server Join Link
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="joinLink" className="text-foreground">
                        Server Join Link
                      </Label>
                      <div className="flex space-x-2 mt-2">
                        <Input
                          id="joinLink"
                          value={serverJoinLink}
                          onChange={(e) => setServerJoinLink(e.target.value)}
                          placeholder="Enter server join link (e.g., fivem://connect/ip:port)"
                          className="bg-gaming-dark border-gaming-border text-foreground"
                        />
                        <Button
                          onClick={async () => {
                            try {
                              // First try to update existing record
                              const { data: existingData } = await supabase
                                .from('server_settings')
                                .select('id')
                                .eq('setting_key', 'server_join_link')
                                .single();

                              if (existingData) {
                                // Update existing record
                                const { error } = await supabase
                                  .from('server_settings')
                                  .update({
                                    setting_value: serverJoinLink,
                                    updated_at: new Date().toISOString()
                                  })
                                  .eq('setting_key', 'server_join_link');
                                if (error) throw error;
                              } else {
                                // Insert new record
                                const { error } = await supabase
                                  .from('server_settings')
                                  .insert({
                                    setting_key: 'server_join_link',
                                    setting_value: serverJoinLink,
                                    created_by: user?.id
                                  });
                                if (error) throw error;
                              }
                              
                              if (error) throw error;
                              
                              toast({
                                title: "Success",
                                description: "Server join link updated successfully",
                              });
                            } catch (error) {
                              console.error('Error updating join link:', error);
                              toast({
                                title: "Error",
                                description: "Failed to update server join link",
                                variant: "destructive",
                              });
                            }
                          }}
                          className="bg-neon-purple hover:bg-neon-purple/80"
                        >
                          Save
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        This link will be used for "Connect Now" buttons throughout the site
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Server IP Configuration */}
              <Card className="bg-gaming-card border-gaming-border">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    FiveM Server Configuration
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="serverIp" className="text-foreground">
                        Server IP:Port
                      </Label>
                      <div className="flex space-x-2 mt-2">
                        <Input
                          id="serverIp"
                          value={serverSettings.server_ip || ''}
                          onChange={(e) => setServerSettings({ 
                            ...serverSettings, 
                            server_ip: e.target.value 
                          })}
                          placeholder="Enter server IP:port (e.g., 127.0.0.1:30120)"
                          className="bg-gaming-dark border-gaming-border text-foreground"
                        />
                        <Button
                          onClick={async () => {
                            try {
                              // First try to update existing record
                              const { data: existingSetting } = await supabase
                                .from('server_settings')
                                .select('id')
                                .eq('setting_key', 'server_ip')
                                .maybeSingle();

                              let error;
                              if (existingSetting) {
                                // Update existing record
                                const result = await supabase
                                  .from('server_settings')
                                  .update({ setting_value: serverSettings.server_ip || '' })
                                  .eq('setting_key', 'server_ip');
                                error = result.error;
                              } else {
                                // Insert new record
                                const result = await supabase
                                  .from('server_settings')
                                  .insert({
                                    setting_key: 'server_ip',
                                    setting_value: serverSettings.server_ip || ''
                                  });
                                error = result.error;
                              }
                              
                              if (error) throw error;
                              
                              toast({
                                title: "Success",
                                description: "Server IP updated successfully",
                              });
                            } catch (error) {
                              console.error('Error updating server IP:', error);
                              toast({
                                title: "Error",
                                description: "Failed to update server IP",
                                variant: "destructive",
                              });
                            }
                          }}
                          className="bg-neon-purple hover:bg-neon-purple/80"
                        >
                          Save
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Enter your FiveM server's IP and port for live stats fetching
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* FiveM Server Configuration */}
              <Card className="bg-gaming-card border-gaming-border">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    FiveM Server Configuration
                  </h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="serverIp" className="text-foreground">
                          Server IP Address
                        </Label>
                        <Input
                          id="serverIp"
                          value={serverSettings.fivem_server_ip || ''}
                          onChange={(e) => setServerSettings(prev => ({ ...prev, fivem_server_ip: e.target.value }))}
                          placeholder="192.168.1.100 or your.domain.com"
                          className="bg-gaming-dark border-gaming-border text-foreground mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="serverPort" className="text-foreground">
                          Server Port
                        </Label>
                        <Input
                          id="serverPort"
                          type="number"
                          value={serverSettings.fivem_server_port || '30120'}
                          onChange={(e) => setServerSettings(prev => ({ ...prev, fivem_server_port: e.target.value }))}
                          placeholder="30120"
                          className="bg-gaming-dark border-gaming-border text-foreground mt-1"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="serverName" className="text-foreground">
                        Server Name
                      </Label>
                      <Input
                        id="serverName"
                        value={serverSettings.fivem_server_name || ''}
                        onChange={(e) => setServerSettings(prev => ({ ...prev, fivem_server_name: e.target.value }))}
                        placeholder="Dreamlight RP - Main Server"
                        className="bg-gaming-dark border-gaming-border text-foreground mt-1"
                      />
                    </div>
                    <Button
                      onClick={async () => {
                        try {
                          // Save FiveM server configuration
                          const settings = [
                            { key: 'fivem_server_ip', value: serverSettings.fivem_server_ip },
                            { key: 'fivem_server_port', value: serverSettings.fivem_server_port },
                            { key: 'fivem_server_name', value: serverSettings.fivem_server_name }
                          ];

                          for (const setting of settings) {
                            const { data: existingData } = await supabase
                              .from('server_settings')
                              .select('id')
                              .eq('setting_key', setting.key)
                              .single();

                            if (existingData) {
                              await supabase
                                .from('server_settings')
                                .update({
                                  setting_value: setting.value,
                                  updated_at: new Date().toISOString()
                                })
                                .eq('setting_key', setting.key);
                            } else {
                              await supabase
                                .from('server_settings')
                                .insert({
                                  setting_key: setting.key,
                                  setting_value: setting.value,
                                  created_by: user?.id
                                });
                            }
                          }

                          toast({
                            title: "Success",
                            description: "FiveM server configuration updated successfully",
                          });
                        } catch (error) {
                          console.error('Error updating FiveM server config:', error);
                          toast({
                            title: "Error",
                            description: "Failed to update FiveM server configuration",
                            variant: "destructive",
                          });
                        }
                      }}
                      className="bg-neon-purple hover:bg-neon-purple/80"
                    >
                      Save Server Configuration
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Server Information Management */}
              <Card className="bg-gaming-card border-gaming-border">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    Server Information (Home Page)
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="serverDisplayIp" className="text-foreground">
                        Server Connect Command
                      </Label>
                      <Input
                        id="serverDisplayIp"
                        value={serverSettings.server_display_ip || ''}
                        onChange={(e) => setServerSettings(prev => ({ ...prev, server_display_ip: e.target.value }))}
                        placeholder="connect dreamlight-rp.com"
                        className="bg-gaming-dark border-gaming-border text-foreground mt-1"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        This will be displayed on the home page as the server connect command
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="discordUrl" className="text-foreground">
                        Discord Invite URL
                      </Label>
                      <Input
                        id="discordUrl"
                        value={serverSettings.discord_url || ''}
                        onChange={(e) => setServerSettings(prev => ({ ...prev, discord_url: e.target.value }))}
                        placeholder="https://discord.gg/your-invite"
                        className="bg-gaming-dark border-gaming-border text-foreground mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="serverStatus" className="text-foreground">
                        Server Status
                      </Label>
                      <select
                        id="serverStatus"
                        value={serverSettings.server_status || 'online'}
                        onChange={(e) => setServerSettings(prev => ({ ...prev, server_status: e.target.value }))}
                        className="bg-gaming-dark border-gaming-border text-foreground mt-1 w-full rounded-md px-3 py-2"
                      >
                        <option value="online">Online</option>
                        <option value="offline">Offline</option>
                        <option value="maintenance">Maintenance</option>
                      </select>
                    </div>
                    <Button
                      onClick={async () => {
                        try {
                          // Save server information settings
                          const settings = [
                            { key: 'server_display_ip', value: serverSettings.server_display_ip },
                            { key: 'discord_url', value: serverSettings.discord_url },
                            { key: 'server_status', value: serverSettings.server_status }
                          ];

                          for (const setting of settings) {
                            const { data: existingData } = await supabase
                              .from('server_settings')
                              .select('id')
                              .eq('setting_key', setting.key)
                              .maybeSingle();

                            if (existingData) {
                              await supabase
                                .from('server_settings')
                                .update({
                                  setting_value: setting.value,
                                  updated_at: new Date().toISOString()
                                })
                                .eq('setting_key', setting.key);
                            } else {
                              await supabase
                                .from('server_settings')
                                .insert({
                                  setting_key: setting.key,
                                  setting_value: setting.value,
                                  created_by: user?.id
                                });
                            }
                          }

                          toast({
                            title: "Success",
                            description: "Server information updated successfully",
                          });
                        } catch (error) {
                          console.error('Error updating server information:', error);
                          toast({
                            title: "Error",
                            description: "Failed to update server information",
                            variant: "destructive",
                          });
                        }
                      }}
                      className="bg-neon-purple hover:bg-neon-purple/80"
                    >
                      Save Server Information
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
            
            {/* Server Stats Management */}
            <div className="space-y-6">
              <Card className="bg-gaming-card border-gaming-border">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-foreground">
                      Live Server Statistics
                    </h3>
                    <Button
                      onClick={async () => {
                        try {
                          setIsSubmitting(true);
                          
                          const { data, error } = await supabase.functions.invoke('fetch-server-stats');
                          
                          if (error) throw error;
                          
                          toast({
                            title: "Success",
                            description: "Live server stats fetched successfully!",
                          });
                          
                          // Refresh the data
                          fetchData();
                        } catch (error) {
                          console.error('Error fetching live stats:', error);
                          toast({
                            title: "Error",
                            description: "Failed to fetch live server stats. Check server IP configuration.",
                            variant: "destructive",
                          });
                        } finally {
                          setIsSubmitting(false);
                        }
                      }}
                      disabled={isSubmitting}
                      className="bg-neon-green hover:bg-neon-green/80"
                    >
                      {isSubmitting ? "Fetching..." : "Fetch Live Stats"}
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <Card className="p-4 bg-gaming-dark border-gaming-border">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-neon-green">
                          {serverStats.players_online}/{serverStats.max_players}
                        </p>
                        <p className="text-sm text-muted-foreground">Players Online</p>
                      </div>
                    </Card>
                    <Card className="p-4 bg-gaming-dark border-gaming-border">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-neon-blue">
                          {serverStats.uptime_percentage}%
                        </p>
                        <p className="text-sm text-muted-foreground">Uptime</p>
                      </div>
                    </Card>
                    <Card className="p-4 bg-gaming-dark border-gaming-border">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-neon-purple">
                          {serverStats.queue_count}
                        </p>
                        <p className="text-sm text-muted-foreground">Queue</p>
                      </div>
                    </Card>
                    <Card className="p-4 bg-gaming-dark border-gaming-border">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-neon-green">
                          {serverStats.ping_ms}ms
                        </p>
                        <p className="text-sm text-muted-foreground">Ping</p>
                      </div>
                    </Card>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="playersOnline" className="text-foreground">
                        Players Online
                      </Label>
                      <Input
                        id="playersOnline"
                        type="number"
                        value={serverStats.players_online}
                        onChange={(e) => setServerStats({ ...serverStats, players_online: parseInt(e.target.value) || 0 })}
                        className="bg-gaming-dark border-gaming-border text-foreground"
                        min="0"
                        max={serverStats.max_players}
                      />
                    </div>
                    <div>
                      <Label htmlFor="maxPlayers" className="text-foreground">
                        Max Players
                      </Label>
                      <Input
                        id="maxPlayers"
                        type="number"
                        value={serverStats.max_players}
                        onChange={(e) => setServerStats({ ...serverStats, max_players: parseInt(e.target.value) || 300 })}
                        className="bg-gaming-dark border-gaming-border text-foreground"
                        min="1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="queueCount" className="text-foreground">
                        Queue Count
                      </Label>
                      <Input
                        id="queueCount"
                        type="number"
                        value={serverStats.queue_count}
                        onChange={(e) => setServerStats({ ...serverStats, queue_count: parseInt(e.target.value) || 0 })}
                        className="bg-gaming-dark border-gaming-border text-foreground"
                        min="0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="ping" className="text-foreground">
                        Ping (ms)
                      </Label>
                      <Input
                        id="ping"
                        type="number"
                        value={serverStats.ping_ms}
                        onChange={(e) => setServerStats({ ...serverStats, ping_ms: parseInt(e.target.value) || 0 })}
                        className="bg-gaming-dark border-gaming-border text-foreground"
                        min="0"
                      />
                    </div>
                    <div>
                      <Label htmlFor="uptime" className="text-foreground">
                        Uptime (%)
                      </Label>
                      <Input
                        id="uptime"
                        type="number"
                        step="0.1"
                        value={serverStats.uptime_percentage}
                        onChange={(e) => setServerStats({ ...serverStats, uptime_percentage: parseFloat(e.target.value) || 0 })}
                        className="bg-gaming-dark border-gaming-border text-foreground"
                        min="0"
                        max="100"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        onClick={async () => {
                          try {
                            const { error } = await supabase
                              .from('server_stats')
                              .update({
                                players_online: serverStats.players_online,
                                max_players: serverStats.max_players,
                                queue_count: serverStats.queue_count,
                                uptime_percentage: serverStats.uptime_percentage,
                                ping_ms: serverStats.ping_ms,
                                last_updated: new Date().toISOString()
                              })
                              .eq('id', serverStats.id);
                            
                            if (error) throw error;
                            
                            toast({
                              title: "Success",
                              description: "Server stats updated successfully",
                            });
                            
                            fetchData();
                          } catch (error) {
                            console.error('Error updating server stats:', error);
                            toast({
                              title: "Error",
                              description: "Failed to update server stats",
                              variant: "destructive",
                            });
                          }
                        }}
                        className="w-full bg-neon-purple hover:bg-neon-purple/80"
                      >
                        Update Server Stats
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-gaming-dark p-4 rounded-lg">
                      <h4 className="text-foreground font-semibold mb-2">Automatic Live Updates</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Enable automatic fetching of live server stats every 2 minutes. This will keep your homepage updated with real player counts.
                      </p>
                      <div className="flex items-center space-x-4">
                        <Button
                          onClick={async () => {
                            try {
                              // First try to update existing record
                              const { data: existingSetting } = await supabase
                                .from('server_settings')
                                .select('id')
                                .eq('setting_key', 'auto_fetch_enabled')
                                .maybeSingle();

                              let error;
                              if (existingSetting) {
                                // Update existing record
                                const result = await supabase
                                  .from('server_settings')
                                  .update({ setting_value: true })
                                  .eq('setting_key', 'auto_fetch_enabled');
                                error = result.error;
                              } else {
                                // Insert new record
                                const result = await supabase
                                  .from('server_settings')
                                  .insert({
                                    setting_key: 'auto_fetch_enabled',
                                    setting_value: true
                                  });
                                error = result.error;
                              }
                              
                              if (error) throw error;
                              
                              // Trigger the first auto-fetch
                              await supabase.functions.invoke('auto-fetch-server-stats');
                              
                              toast({
                                title: "Success",
                                description: "Auto-fetch enabled! Stats will update every 2 minutes.",
                              });
                              
                              fetchData();
                            } catch (error) {
                              console.error('Error enabling auto-fetch:', error);
                              toast({
                                title: "Error",
                                description: "Failed to enable auto-fetch",
                                variant: "destructive",
                              });
                            }
                          }}
                          className="bg-neon-green hover:bg-neon-green/80"
                        >
                          Enable Auto-Fetch
                        </Button>
                        <Button
                          onClick={async () => {
                            try {
                              // First try to update existing record
                              const { data: existingSetting } = await supabase
                                .from('server_settings')
                                .select('id')
                                .eq('setting_key', 'auto_fetch_enabled')
                                .maybeSingle();

                              let error;
                              if (existingSetting) {
                                // Update existing record
                                const result = await supabase
                                  .from('server_settings')
                                  .update({ setting_value: false })
                                  .eq('setting_key', 'auto_fetch_enabled');
                                error = result.error;
                              } else {
                                // Insert new record
                                const result = await supabase
                                  .from('server_settings')
                                  .insert({
                                    setting_key: 'auto_fetch_enabled',
                                    setting_value: false
                                  });
                                error = result.error;
                              }
                              
                              if (error) throw error;
                              
                              toast({
                                title: "Success",
                                description: "Auto-fetch disabled.",
                              });
                              
                              fetchData();
                            } catch (error) {
                              console.error('Error disabling auto-fetch:', error);
                              toast({
                                title: "Error",
                                description: "Failed to disable auto-fetch",
                                variant: "destructive",
                              });
                            }
                          }}
                          variant="outline"
                          className="border-gaming-border text-foreground hover:bg-gaming-dark"
                        >
                          Disable Auto-Fetch
                        </Button>
                      </div>
                    </div>
                    
                    <div className="bg-gaming-dark p-4 rounded-lg">
                      <h4 className="text-foreground font-semibold mb-2">Manual Override</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        If needed, you can still manually update stats below.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="playersOnline" className="text-foreground">
                            Players Online
                          </Label>
                          <Input
                            id="playersOnline"
                            type="number"
                            value={serverStats.players_online}
                            onChange={(e) => setServerStats({ ...serverStats, players_online: parseInt(e.target.value) || 0 })}
                            className="bg-gaming-darker border-gaming-border text-foreground"
                            min="0"
                            max={serverStats.max_players}
                          />
                        </div>
                        <div>
                          <Label htmlFor="maxPlayers" className="text-foreground">
                            Max Players
                          </Label>
                          <Input
                            id="maxPlayers"
                            type="number"
                            value={serverStats.max_players}
                            onChange={(e) => setServerStats({ ...serverStats, max_players: parseInt(e.target.value) || 300 })}
                            className="bg-gaming-darker border-gaming-border text-foreground"
                            min="1"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Button
                            onClick={async () => {
                              try {
                                const { error } = await supabase
                                  .from('server_stats')
                                  .update({
                                    players_online: serverStats.players_online,
                                    max_players: serverStats.max_players,
                                    queue_count: serverStats.queue_count,
                                    uptime_percentage: serverStats.uptime_percentage,
                                    ping_ms: serverStats.ping_ms,
                                    last_updated: new Date().toISOString()
                                  })
                                  .eq('id', serverStats.id);
                                
                                if (error) throw error;
                                
                                toast({
                                  title: "Success",
                                  description: "Server stats updated manually",
                                });
                                
                                fetchData();
                              } catch (error) {
                                console.error('Error updating server stats:', error);
                                toast({
                                  title: "Error",
                                  description: "Failed to update server stats",
                                  variant: "destructive",
                                });
                              }
                            }}
                            variant="outline"
                            className="w-full border-gaming-border text-foreground hover:bg-gaming-dark"
                          >
                            Manual Update
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 p-4 bg-neon-purple/10 border border-neon-purple/30 rounded-lg">
                    <p className="text-sm text-foreground">
                      <strong>Live Stats:</strong> The system now fetches real player count and server data directly from your FiveM server.
                      Configure your server IP above and click "Fetch Live Stats" to get real-time data!
                    </p>
                  </div>
                </div>
              </Card>
            </div>
            
            {/* Team Members Management */}
            <div className="space-y-6">
              <Card className="bg-gaming-card border-gaming-border">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-foreground">
                      Team Members
                    </h3>
                    <Dialog open={showTeamMemberDialog} onOpenChange={setShowTeamMemberDialog}>
                      <DialogTrigger asChild>
                        <Button className="bg-neon-purple hover:bg-neon-purple/80">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Team Member
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-gaming-card border-gaming-border">
                        <DialogHeader>
                          <DialogTitle className="text-foreground">
                            {editingTeamMember ? 'Edit Team Member' : 'Add Team Member'}
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="memberName" className="text-foreground">Name</Label>
                            <Input
                              id="memberName"
                              value={newTeamMember.name}
                              onChange={(e) => setNewTeamMember({ ...newTeamMember, name: e.target.value })}
                              className="bg-gaming-dark border-gaming-border text-foreground"
                              placeholder="Enter team member name"
                            />
                          </div>
                          <div>
                            <Label htmlFor="memberRole" className="text-foreground">Role</Label>
                            <Input
                              id="memberRole"
                              value={newTeamMember.role}
                              onChange={(e) => setNewTeamMember({ ...newTeamMember, role: e.target.value })}
                              className="bg-gaming-dark border-gaming-border text-foreground"
                              placeholder="Enter role (e.g., Server Owner, Admin, Developer)"
                            />
                          </div>
                          <div>
                            <Label htmlFor="memberBio" className="text-foreground">Bio (Optional)</Label>
                            <Textarea
                              id="memberBio"
                              value={newTeamMember.bio}
                              onChange={(e) => setNewTeamMember({ ...newTeamMember, bio: e.target.value })}
                              className="bg-gaming-dark border-gaming-border text-foreground"
                              placeholder="Enter a short bio"
                              rows={3}
                            />
                          </div>
                          <div>
                            <Label htmlFor="memberImage" className="text-foreground">Image URL</Label>
                            <Input
                              id="memberImage"
                              value={newTeamMember.image_url}
                              onChange={(e) => setNewTeamMember({ ...newTeamMember, image_url: e.target.value })}
                              className="bg-gaming-dark border-gaming-border text-foreground"
                              placeholder="Enter image URL (e.g., https://example.com/avatar.jpg)"
                            />
                          </div>
                          <div>
                            <Label htmlFor="memberOrder" className="text-foreground">Display Order</Label>
                            <Input
                              id="memberOrder"
                              type="number"
                              value={newTeamMember.order_index}
                              onChange={(e) => setNewTeamMember({ ...newTeamMember, order_index: parseInt(e.target.value) || 0 })}
                              className="bg-gaming-dark border-gaming-border text-foreground"
                              placeholder="Enter display order (0 = first)"
                            />
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              onClick={async () => {
                                if (!newTeamMember.name || !newTeamMember.role) {
                                  toast({
                                    title: "Error",
                                    description: "Please fill in name and role",
                                    variant: "destructive",
                                  });
                                  return;
                                }
                                
                                try {
                                  if (editingTeamMember) {
                                    const { error } = await supabase
                                      .from('team_members')
                                      .update(newTeamMember)
                                      .eq('id', editingTeamMember.id);
                                    
                                    if (error) throw error;
                                    
                                    toast({
                                      title: "Success",
                                      description: "Team member updated successfully",
                                    });
                                  } else {
                                    const { error } = await supabase
                                      .from('team_members')
                                      .insert([newTeamMember]);
                                    
                                    if (error) throw error;
                                    
                                    toast({
                                      title: "Success",
                                      description: "Team member added successfully",
                                    });
                                  }
                                  
                                  setNewTeamMember({ name: "", role: "", bio: "", image_url: "", order_index: 0 });
                                  setEditingTeamMember(null);
                                  setShowTeamMemberDialog(false);
                                  fetchData();
                                } catch (error) {
                                  console.error('Error saving team member:', error);
                                  toast({
                                    title: "Error",
                                    description: "Failed to save team member",
                                    variant: "destructive",
                                  });
                                }
                              }}
                              className="flex-1 bg-neon-purple hover:bg-neon-purple/80"
                            >
                              {editingTeamMember ? 'Update' : 'Add'} Team Member
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => {
                                setNewTeamMember({ name: "", role: "", bio: "", image_url: "", order_index: 0 });
                                setEditingTeamMember(null);
                                setShowTeamMemberDialog(false);
                              }}
                              className="border-gaming-border text-foreground hover:bg-gaming-dark"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  
                  <div className="space-y-3">
                    {teamMembers.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">
                        No team members added yet. Add team members to display on the Our Team page.
                      </p>
                    ) : (
                      teamMembers.map((member) => (
                        <div key={member.id} className="flex items-center justify-between p-4 bg-gaming-dark rounded-lg">
                          <div className="flex items-center space-x-4">
                            <div className="h-12 w-12 rounded-full bg-neon-purple/20 flex items-center justify-center">
                              {member.image_url ? (
                                <img src={member.image_url} alt={member.name} className="h-12 w-12 rounded-full object-cover" />
                              ) : (
                                <span className="text-neon-purple font-semibold">
                                  {member.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                                </span>
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-foreground">{member.name}</p>
                              <p className="text-sm text-muted-foreground">{member.role}</p>
                              <p className="text-xs text-muted-foreground">Order: {member.order_index}</p>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setNewTeamMember(member);
                                setEditingTeamMember(member);
                                setShowTeamMemberDialog(true);
                              }}
                              className="border-gaming-border text-foreground hover:bg-gaming-dark"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm" className="border-red-500 text-red-500 hover:bg-red-500/10">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="bg-gaming-card border-gaming-border">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="text-foreground">Remove Team Member</AlertDialogTitle>
                                  <AlertDialogDescription className="text-muted-foreground">
                                    Are you sure you want to remove {member.name} from the team? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="border-gaming-border text-foreground hover:bg-gaming-dark">
                                    Cancel
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={async () => {
                                      try {
                                        const { error } = await supabase
                                          .from('team_members')
                                          .delete()
                                          .eq('id', member.id);
                                        
                                        if (error) throw error;
                                        
                                        toast({
                                          title: "Success",
                                          description: "Team member removed successfully",
                                        });
                                        
                                        fetchData();
                                      } catch (error) {
                                        console.error('Error removing team member:', error);
                                        toast({
                                          title: "Error",
                                          description: "Failed to remove team member",
                                          variant: "destructive",
                                        });
                                      }
                                    }}
                                    className="bg-red-500 hover:bg-red-600"
                                  >
                                    Remove
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>


          <TabsContent value="content" className="space-y-6">
            <HomepageContentManager userId={user?.id} />
          </TabsContent>
        </Tabs>

        {/* Application Review Dialog */}
        <Dialog open={!!selectedApplication} onOpenChange={() => setSelectedApplication(null)}>
          <DialogContent className="max-w-2xl bg-gaming-card border-gaming-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Application Review</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Review and take action on this application
              </DialogDescription>
            </DialogHeader>
            
            {selectedApplication && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Steam Name</Label>
                    <p className="text-foreground">{selectedApplication.steam_name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Discord Tag</Label>
                    <p className="text-foreground">{selectedApplication.discord_tag}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Discord User ID</Label>
                    <p className="text-foreground">{selectedApplication.discord_name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">FiveM Name</Label>
                    <p className="text-foreground">{selectedApplication.fivem_name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Age</Label>
                    <p className="text-foreground">{selectedApplication.age}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Application Type</Label>
                    <p className="text-foreground">{selectedApplication.application_type}</p>
                  </div>
                </div>
                
                {selectedApplication.previous_experience && (
                  <div>
                    <Label className="text-muted-foreground">Previous Experience</Label>
                    <p className="text-foreground">{selectedApplication.previous_experience}</p>
                  </div>
                )}
                
                {selectedApplication.why_interested && (
                  <div>
                    <Label className="text-muted-foreground">Why Interested</Label>
                    <p className="text-foreground">{selectedApplication.why_interested}</p>
                  </div>
                )}
                
                {selectedApplication.additional_info && (
                  <div>
                    <Label className="text-muted-foreground">Additional Information</Label>
                    <p className="text-foreground">{selectedApplication.additional_info}</p>
                  </div>
                )}
                
                <div>
                  <Label className="text-muted-foreground">Submitted</Label>
                  <p className="text-foreground">{new Date(selectedApplication.created_at).toLocaleString()}</p>
                </div>
                
                <div>
                  <Label className="text-foreground">Review Notes</Label>
                  <Textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Add your review notes here..."
                    className="bg-gaming-dark border-gaming-border text-foreground"
                    rows={3}
                  />
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => handleApplicationAction(selectedApplication.id, 'approved')}
                    disabled={isSubmitting}
                    className="flex-1 border-green-500 text-green-500 hover:bg-green-500/10"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {isSubmitting ? "Processing..." : "Approve"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleApplicationAction(selectedApplication.id, 'under_review')}
                    disabled={isSubmitting}
                    className="flex-1 border-blue-500 text-blue-500 hover:bg-blue-500/10"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    {isSubmitting ? "Processing..." : "Under Review"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleApplicationAction(selectedApplication.id, 'denied')}
                    disabled={isSubmitting}
                    className="flex-1 border-red-500 text-red-500 hover:bg-red-500/10"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    {isSubmitting ? "Processing..." : "Deny"}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default StaffPanel;
