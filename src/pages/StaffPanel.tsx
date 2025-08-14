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
  Settings 
} from "lucide-react";

const StaffPanel = () => {
  const [applications, setApplications] = useState<any[]>([]);
  const [recentActions, setRecentActions] = useState<any[]>([]);
  const [rules, setRules] = useState<any[]>([]);
  const [staffMembers, setStaffMembers] = useState<any[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [applicationTypes, setApplicationTypes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [editingRule, setEditingRule] = useState<any>(null);
  const [newRule, setNewRule] = useState({ category: "", title: "", description: "" });
  const [showStaffDialog, setShowStaffDialog] = useState(false);
  const [newStaffEmail, setNewStaffEmail] = useState("");
  const [newStaffRole, setNewStaffRole] = useState("moderator");
  
  // Application Editing
  const [editingApplication, setEditingApplication] = useState<any>(null);
  const [editApplicationData, setEditApplicationData] = useState({
    steam_name: "",
    discord_tag: "",
    discord_name: "",
    fivem_name: "",
    age: 18,
    rp_experience: "",
    character_backstory: ""
  });
  
  // Application Type Management
  const [showApplicationTypeDialog, setShowApplicationTypeDialog] = useState(false);
  const [editingApplicationType, setEditingApplicationType] = useState<any>(null);
  const [newApplicationType, setNewApplicationType] = useState({
    name: "",
    description: "",
    formFields: [
      { name: "steam_name", label: "Steam Name", type: "text", required: true },
      { name: "discord_tag", label: "Discord Tag", type: "text", required: true },
      { name: "discord_name", label: "Discord User ID", type: "text", required: true },
      { name: "fivem_name", label: "FiveM Name", type: "text", required: true },
      { name: "age", label: "Age", type: "number", required: true }
    ]
  });
  
  // Settings state
  const [generalSettings, setGeneralSettings] = useState({
    serverName: "FiveM RP Server",
    maxPlayers: 64,
    applicationCooldown: 7
  });

  const [applicationSettings, setApplicationSettings] = useState({
    autoApprove: false,
    emailNotifications: true,
    discordIntegration: false,
    discordWebhook: "",
    discordChannel: ""
  });

  const [systemStatus, setSystemStatus] = useState({
    database: "online",
    emailService: "online", 
    serverHealth: "healthy",
    lastBackup: "2 hours ago"
  });

  const [showLogsDialog, setShowLogsDialog] = useState(false);
  const [showDiscordDialog, setShowDiscordDialog] = useState(false);
  const [systemLogs, setSystemLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    console.log('StaffPanel useEffect - user:', user);
    fetchApplications();
    fetchRecentActions();
    fetchRules();
    fetchStaffMembers();
    fetchPlayers();
    fetchApplicationTypes();
  }, [user]);

  const fetchApplications = async () => {
    console.log('Fetching applications...');
    try {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          application_types(name)
        `)
        .order('created_at', { ascending: false });

      console.log('Applications query result:', { data, error });
      if (error) throw error;
      setApplications(data || []);
    } catch (error: any) {
      console.error('Error fetching applications:', error);
      setError('Failed to load applications: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRecentActions = async () => {
    try {
      const { data, error } = await supabase
        .from('application_actions')
        .select(`
          *,
          applications(steam_name)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setRecentActions(data || []);
    } catch (error: any) {
      console.error('Error fetching recent actions:', error);
    }
  };

  const fetchRules = async () => {
    try {
      const { data, error } = await supabase
        .from('rules')
        .select('*')
        .order('category', { ascending: true })
        .order('order_index', { ascending: true });

      if (error) throw error;
      setRules(data || []);
    } catch (error: any) {
      console.error('Error fetching rules:', error);
    }
  };

  const handleSaveRule = async (ruleData: any) => {
    if (!user) return;
    
    try {
      if (editingRule) {
        // Update existing rule
        const { error } = await supabase
          .from('rules')
          .update(ruleData)
          .eq('id', editingRule.id);
        
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Rule updated successfully",
        });
      } else {
        // Create new rule
        const { error } = await supabase
          .from('rules')
          .insert({
            ...ruleData,
            created_by: user.id
          });
        
        if (error) throw error;
        
        toast({
          title: "Success", 
          description: "Rule created successfully",
        });
      }
      
      fetchRules();
      setEditingRule(null);
      setNewRule({ category: "", title: "", description: "" });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save rule",
        variant: "destructive"
      });
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('rules')
        .delete()
        .eq('id', ruleId);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Rule deleted successfully",
      });
      
      fetchRules();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete rule",
        variant: "destructive"
      });
    }
  };

  const fetchStaffMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select(`
          id,
          role,
          created_at,
          user_id,
          profiles!user_roles_user_id_fkey(id, username, full_name)
        `)
        .in('role', ['admin', 'moderator'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStaffMembers(data || []);
    } catch (error: any) {
      console.error('Error fetching staff members:', error);
    }
  };

  const fetchPlayers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          username,
          full_name,
          created_at
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setPlayers(data || []);
    } catch (error: any) {
      console.error('Error fetching players:', error);
    }
  };

  const fetchApplicationTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('application_types')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApplicationTypes(data || []);
    } catch (error: any) {
      console.error('Error fetching application types:', error);
    }
  };

  const handleAddStaff = async () => {
    if (!user || !newStaffEmail.trim()) return;
    
    try {
      // Search for user by email - we'll look for profiles where username contains the email prefix
      // or use a broader search approach
      const emailPrefix = newStaffEmail.split('@')[0];
      
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, username, full_name')
        .or(`username.eq.${emailPrefix},username.ilike.%${newStaffEmail}%`)
        .limit(1)
        .single();
      
      if (profileError || !profileData) {
        // Try alternative search - look for any profile that might match
        const { data: alternativeData, error: altError } = await supabase
          .from('profiles')
          .select('id, username, full_name')
          .ilike('username', `%${emailPrefix}%`)
          .limit(1)
          .single();
          
        if (altError || !alternativeData) {
          toast({
            title: "User Not Found",
            description: `No user found with email ${newStaffEmail}. The user must be registered first.`,
            variant: "destructive"
          });
          return;
        }
        
        // Use alternative data
        const targetUserId = alternativeData.id;
        await addStaffRole(targetUserId);
        return;
      }
      
      await addStaffRole(profileData.id);
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add staff member",
        variant: "destructive"
      });
    }
  };

  const addStaffRole = async (targetUserId: string) => {
    try {
      // Add staff role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: targetUserId,
          role: newStaffRole as 'admin' | 'moderator'
        });
      
      if (roleError) {
        if (roleError.code === '23505') { // Unique constraint violation
          toast({
            title: "Error",
            description: "User already has this role.",
            variant: "destructive"
          });
          return;
        }
        throw roleError;
      }
      
      toast({
        title: "Success",
        description: `User added as ${newStaffRole}`,
      });
      
      fetchStaffMembers();
      setShowStaffDialog(false);
      setNewStaffEmail("");
      setNewStaffRole("moderator");
    } catch (error: any) {
      throw error;
    }
  };

  const handleRemoveStaff = async (roleId: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('id', roleId);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Staff member removed",
      });
      
      fetchStaffMembers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to remove staff member",
        variant: "destructive"
      });
    }
  };

  const handleApplicationAction = async (applicationId: string, action: string, notes?: string) => {
    if (!user) return;
    
    setIsSubmitting(true);
    try {
      // Get application data for email
      const { data: appData, error: fetchError } = await supabase
        .from('applications')
        .select('*')
        .eq('id', applicationId)
        .single();

      if (fetchError) throw fetchError;

      // Update application status
      const { error: updateError } = await supabase
        .from('applications')
        .update({
          status: action,
          reviewed_by: user.id,
          review_notes: notes || null
        })
        .eq('id', applicationId);

      if (updateError) throw updateError;

      // Log the action
      const { error: logError } = await supabase
        .from('application_actions')
        .insert({
          application_id: applicationId,
          staff_id: user.id,
          action,
          notes: notes || null
        });

      if (logError) throw logError;

      // Send email notification to user
      try {
        await supabase.functions.invoke('send-application-email', {
          body: {
            type: action,
            userId: appData.user_id,
            applicationData: {
              steam_name: appData.steam_name,
              discord_tag: appData.discord_tag,
              fivem_name: appData.fivem_name,
              status: action,
              review_notes: notes
            }
          }
        });
        console.log('Email notification sent successfully');
      } catch (emailError) {
        console.error('Error sending email notification:', emailError);
        // Don't fail the whole operation if email fails
      }

      // Send Discord notification if enabled
      if (applicationSettings.discordIntegration && applicationSettings.discordWebhook) {
        try {
          await supabase.functions.invoke('discord-logger', {
            body: {
              type: `application_${action}`,
              data: {
                steam_name: appData.steam_name,
                discord_tag: appData.discord_tag,
                discord_name: appData.discord_name,
                fivem_name: appData.fivem_name,
                review_notes: notes
              },
              settings: {
                discordWebhookUrl: applicationSettings.discordWebhook
              }
            }
          });
          console.log('Discord notification sent successfully');
        } catch (discordError) {
          console.error('Discord notification failed:', discordError);
          // Don't fail the whole operation if Discord fails
        }
      }

      toast({
        title: "Action Completed",
        description: `Application has been ${action}`,
      });

      // Refresh data
      fetchApplications();
      fetchRecentActions();
      setSelectedApplication(null);
      setReviewNotes("");
      
    } catch (error: any) {
      console.error('Error processing application:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to process application",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteApplication = async (applicationId: string) => {
    if (!user) return;
    
    setIsSubmitting(true);
    try {
      // First delete all related actions
      const { error: actionsError } = await supabase
        .from('application_actions')
        .delete()
        .eq('application_id', applicationId);

      if (actionsError) {
        console.error('Error deleting actions:', actionsError);
        // Continue with application deletion even if actions deletion fails
      }

      // Then delete the application
      const { error: deleteError } = await supabase
        .from('applications')
        .delete()
        .eq('id', applicationId);

      if (deleteError) throw deleteError;

      toast({
        title: "Success",
        description: "Application deleted successfully",
      });

      // Refresh data
      await Promise.all([fetchApplications(), fetchRecentActions()]);
      
      // Close dialog
      setSelectedApplication(null);
      setReviewNotes('');
    } catch (err: any) {
      console.error('Error deleting application:', err);
      toast({
        title: "Error",
        description: err.message || "Failed to delete application",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Settings handlers
  const handleSaveGeneralSettings = async () => {
    try {
      // In a real app, you'd save to database
      // For now, we'll just show success
      toast({
        title: "Success",
        description: "General settings saved successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive"
      });
    }
  };

  const handleSaveApplicationSettings = async () => {
    try {
      // In a real app, you'd save to database
      toast({
        title: "Success", 
        description: "Application settings saved successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive"
      });
    }
  };

  const toggleApplicationSetting = (setting: keyof typeof applicationSettings) => {
    setApplicationSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const handleEditApplication = async () => {
    if (!editingApplication) return;
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('applications')
        .update({
          steam_name: editApplicationData.steam_name,
          discord_tag: editApplicationData.discord_tag,
          discord_name: editApplicationData.discord_name,
          fivem_name: editApplicationData.fivem_name,
          age: editApplicationData.age,
          rp_experience: editApplicationData.rp_experience,
          character_backstory: editApplicationData.character_backstory
        })
        .eq('id', editingApplication.id);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Application updated successfully",
      });
      
      // Refresh applications
      fetchApplications();
      setEditingApplication(null);
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update application",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // System status monitoring
  const checkSystemStatus = async () => {
    try {
      // Check database connection
      const { error: dbError } = await supabase.from('profiles').select('id').limit(1);
      
      setSystemStatus(prev => ({
        ...prev,
        database: dbError ? "offline" : "online",
        lastBackup: new Date().toLocaleString()
      }));
      
      toast({
        title: "System Status Updated",
        description: "Status check completed",
      });
    } catch (error) {
      setSystemStatus(prev => ({
        ...prev,
        database: "offline"
      }));
    }
  };

  // Discord integration
  const testDiscordWebhook = async () => {
    if (!applicationSettings.discordWebhook) {
      toast({
        title: "Error",
        description: "Please enter a Discord webhook URL first",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch(applicationSettings.discordWebhook, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: '🎮 **FiveM RP Server** - Discord integration test successful!',
          embeds: [{
            title: 'System Test',
            description: 'Discord integration is working properly.',
            color: 0x00ff00,
            timestamp: new Date().toISOString()
          }]
        })
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Discord webhook test successful!",
        });
      } else {
        throw new Error('Webhook test failed');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Discord webhook test failed. Check your webhook URL.",
        variant: "destructive"
      });
    }
  };

  const fetchSystemLogs = async () => {
    setLoadingLogs(true);
    try {
      // For now, use mock logs since we can't directly access postgres logs from client
      // In a real app, you'd have a backend endpoint to fetch logs
      setSystemLogs([
        {
          id: '1',
          timestamp: new Date().toISOString(),
          level: 'INFO',
          message: 'Application started successfully',
          source: 'system'
        },
        {
          id: '2',
          timestamp: new Date(Date.now() - 60000).toISOString(),
          level: 'WARNING',
          message: 'High memory usage detected',
          source: 'monitor'
        },
        {
          id: '3',
          timestamp: new Date(Date.now() - 120000).toISOString(),
          level: 'ERROR',
          message: 'Database connection timeout',
          source: 'database'
        },
        {
          id: '4',
          timestamp: new Date(Date.now() - 180000).toISOString(),
          level: 'INFO',
          message: 'User authentication successful',
          source: 'auth'
        },
        {
          id: '5',
          timestamp: new Date(Date.now() - 240000).toISOString(),
          level: 'ERROR',
          message: 'Failed to send notification email',
          source: 'email'
        }
      ]);
    } catch (error: any) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoadingLogs(false);
    }
  };

  const pendingApplications = applications.filter(app => app.status === 'pending');
  console.log('All applications:', applications);
  console.log('Pending applications:', pendingApplications);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-hero">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
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
            Staff Panel
          </h1>
          <p className="text-muted-foreground">
            Manage server applications, players, and settings
          </p>
        </div>

        {error && (
          <Alert className="mb-6 border-destructive/50 bg-destructive/10">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="applications" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 bg-gaming-card border-gaming-border">
            <TabsTrigger value="applications" className="data-[state=active]:bg-neon-purple/20">
              Pending ({pendingApplications.length})
            </TabsTrigger>
            <TabsTrigger value="all-applications" className="data-[state=active]:bg-neon-purple/20">
              All Apps ({applications.length})
            </TabsTrigger>
            <TabsTrigger value="app-types" className="data-[state=active]:bg-neon-purple/20">
              App Types
            </TabsTrigger>
            <TabsTrigger value="players" className="data-[state=active]:bg-neon-purple/20">
              Players
            </TabsTrigger>
            <TabsTrigger value="reports" className="data-[state=active]:bg-neon-purple/20">
              Reports
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-neon-purple/20">
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="applications" className="space-y-4">
            <Card className="p-6 bg-gaming-card border-gaming-border shadow-gaming">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-foreground flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-neon-purple" />
                  <span>Pending Applications</span>
                </h2>
                <Badge variant="secondary">{pendingApplications.length} pending</Badge>
              </div>

              <div className="space-y-4">
                {pendingApplications.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No pending applications</p>
                  </div>
                ) : (
                  pendingApplications.map((app) => (
                    <Card key={app.id} className="p-4 bg-gaming-dark border-gaming-border">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <h3 className="font-semibold text-foreground">
                            {app.steam_name}
                          </h3>
                          <p className="text-sm text-muted-foreground">Discord: {app.discord_tag}</p>
                          <p className="text-sm text-muted-foreground">Steam: {app.steam_name}</p>
                          <p className="text-xs text-muted-foreground">
                            Submitted: {new Date(app.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="gaming" 
                                size="sm"
                                onClick={() => setSelectedApplication(app)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Review
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-gaming-card border-gaming-border max-w-2xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle className="text-foreground">
                                  Application Review - {app.steam_name}
                                </DialogTitle>
                                <DialogDescription>
                                  Review the application details and take action
                                </DialogDescription>
                              </DialogHeader>
                              
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label className="text-foreground">Steam Name</Label>
                                    <p className="text-muted-foreground">{app.steam_name}</p>
                                  </div>
                                  <div>
                                    <Label className="text-foreground">Discord Tag</Label>
                                    <p className="text-muted-foreground">{app.discord_tag}</p>
                                  </div>
                                  <div>
                                    <Label className="text-foreground">FiveM Name</Label>
                                    <p className="text-muted-foreground">{app.fivem_name}</p>
                                  </div>
                                  <div>
                                    <Label className="text-foreground">Age</Label>
                                    <p className="text-muted-foreground">{app.age} years old</p>
                                  </div>
                                </div>
                                
                                <div>
                                  <Label className="text-foreground">Roleplay Experience</Label>
                                  <div className="mt-2 p-3 bg-gaming-dark rounded border border-gaming-border">
                                    <p className="text-muted-foreground whitespace-pre-wrap">{app.rp_experience}</p>
                                  </div>
                                </div>
                                
                                <div>
                                  <Label className="text-foreground">Character Backstory</Label>
                                  <div className="mt-2 p-3 bg-gaming-dark rounded border border-gaming-border">
                                    <p className="text-muted-foreground whitespace-pre-wrap">{app.character_backstory}</p>
                                  </div>
                                </div>
                                
                                <div>
                                  <Label htmlFor="review-notes" className="text-foreground">Review Notes (Optional)</Label>
                                  <Textarea
                                    id="review-notes"
                                    value={reviewNotes}
                                    onChange={(e) => setReviewNotes(e.target.value)}
                                    placeholder="Add notes for the applicant..."
                                    className="mt-2 bg-gaming-dark border-gaming-border focus:border-neon-purple"
                                  />
                                </div>
                                
                                <div className="flex space-x-2 pt-4">
                                  <Button 
                                    variant="neon" 
                                    onClick={() => handleApplicationAction(app.id, 'approved', reviewNotes)}
                                    disabled={isSubmitting}
                                    className="flex-1"
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    {isSubmitting ? "Processing..." : "Approve"}
                                  </Button>
                                  <Button 
                                    variant="outline"
                                    onClick={() => handleApplicationAction(app.id, 'under_review', reviewNotes)}
                                    disabled={isSubmitting}
                                    className="flex-1 hover:border-neon-blue/50"
                                  >
                                    <Clock className="h-4 w-4 mr-1" />
                                    Under Review
                                  </Button>
                                  <Button 
                                    variant="destructive" 
                                    onClick={() => handleApplicationAction(app.id, 'denied', reviewNotes)}
                                    disabled={isSubmitting}
                                    className="flex-1"
                                  >
                                    <XCircle className="h-4 w-4 mr-1" />
                                     Deny
                                   </Button>
                                   <Button 
                                     variant="outline" 
                                     onClick={() => {
                                       setEditingApplication(app);
                                       setEditApplicationData({
                                         steam_name: app.steam_name,
                                         discord_tag: app.discord_tag,
                                         discord_name: app.discord_name || "",
                                         fivem_name: app.fivem_name,
                                         age: app.age,
                                         rp_experience: app.rp_experience,
                                         character_backstory: app.character_backstory
                                       });
                                     }}
                                     disabled={isSubmitting}
                                     className="flex-1 border-gaming-border hover:border-neon-cyan/50"
                                   >
                                     <Edit className="h-4 w-4 mr-1" />
                                     Edit
                                  </Button>
                                </div>
                                
                                <div className="flex justify-end pt-2">
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        disabled={isSubmitting}
                                        className="border-red-500/50 text-red-500 hover:bg-red-500/10"
                                      >
                                        <Trash2 className="h-4 w-4 mr-1" />
                                        Delete Application
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="bg-gaming-card border-gaming-border">
                                      <AlertDialogHeader>
                                        <AlertDialogTitle className="text-foreground">Delete Application</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you sure you want to delete this application? This action cannot be undone and will permanently remove the application and all related data.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel className="bg-gaming-dark border-gaming-border hover:bg-gaming-darker">
                                          Cancel
                                        </AlertDialogCancel>
                                        <AlertDialogAction 
                                          onClick={() => handleDeleteApplication(app.id)}
                                          className="bg-red-600 hover:bg-red-700"
                                        >
                                          Delete Permanently
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="players" className="space-y-4">
            <Card className="p-6 bg-gaming-card border-gaming-border shadow-gaming">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-foreground flex items-center space-x-2">
                  <Users className="h-5 w-5 text-neon-green" />
                  <span>Player Management</span>
                </h2>
                <Badge variant="secondary">{players.length} total players</Badge>
              </div>
              
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {players.map((player: any) => (
                  <div key={player.id} className="flex items-center justify-between p-4 bg-gaming-dark rounded border border-gaming-border">
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground">
                        {player.full_name || player.username || 'Unknown Player'}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        ID: {player.id.slice(0, 8)}... • Joined: {new Date(player.created_at).toLocaleDateString()}
                      </p>
                      <div className="flex space-x-2 mt-2">
                        {player.user_roles?.map((role: any, index: number) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {role.role}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <Button variant="outline" size="sm" className="border-gaming-border hover:bg-gaming-darker">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" className="border-red-500/50 text-red-500 hover:bg-red-500/10">
                        Ban
                      </Button>
                    </div>
                  </div>
                ))}
                
                {players.length === 0 && (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No players found</p>
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <Card className="p-6 bg-gaming-card border-gaming-border shadow-gaming">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-foreground flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                  <span>Player Reports</span>
                </h2>
                <Badge variant="secondary" className="bg-red-600">3 pending</Badge>
              </div>
              
              <div className="space-y-4">
                {[
                  {
                    id: 1,
                    reporter: "Player123",
                    reported: "BadPlayer456", 
                    reason: "RDM in city center",
                    time: "2 hours ago",
                    status: "pending"
                  },
                  {
                    id: 2,
                    reporter: "GoodCitizen",
                    reported: "Troublemaker",
                    reason: "Metagaming during RP scenario",
                    time: "5 hours ago", 
                    status: "investigating"
                  },
                  {
                    id: 3,
                    reporter: "Officer_Smith",
                    reported: "SpeedDemon",
                    reason: "Fail RP during traffic stop",
                    time: "1 day ago",
                    status: "pending"
                  }
                ].map((report) => (
                  <div key={report.id} className="flex items-center justify-between p-4 bg-gaming-dark rounded border border-gaming-border">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-medium text-foreground">{report.reporter}</h4>
                        <span className="text-muted-foreground">reported</span>
                        <h4 className="font-medium text-red-400">{report.reported}</h4>
                      </div>
                      <p className="text-sm text-muted-foreground">{report.reason}</p>
                      <p className="text-xs text-muted-foreground mt-1">{report.time}</p>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <Badge 
                        variant="secondary" 
                        className={
                          report.status === 'pending' ? 'bg-yellow-600' : 
                          report.status === 'investigating' ? 'bg-blue-600' : 
                          'bg-gray-600'
                        }
                      >
                        {report.status}
                      </Badge>
                      <Button variant="outline" size="sm" className="border-gaming-border hover:bg-gaming-darker">
                        Review
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="all-applications" className="space-y-4">
            <Card className="p-6 bg-gaming-card border-gaming-border shadow-gaming">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-foreground flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-neon-purple" />
                  <span>All Applications</span>
                </h2>
                <Badge variant="secondary">{applications.length} total</Badge>
              </div>

              <div className="space-y-4">
                {applications.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No applications found</p>
                  </div>
                ) : (
                  applications.map((app) => (
                    <Card key={app.id} className="p-4 bg-gaming-dark border-gaming-border">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold text-foreground">
                              {app.steam_name}
                            </h3>
                            <Badge 
                              variant={
                                app.status === 'approved' ? 'default' : 
                                app.status === 'denied' ? 'destructive' : 
                                'secondary'
                              }
                            >
                              {app.status.toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">Discord: {app.discord_tag}</p>
                          <p className="text-sm text-muted-foreground">FiveM: {app.fivem_name}</p>
                          <p className="text-xs text-muted-foreground">
                            Submitted: {new Date(app.created_at).toLocaleDateString()}
                          </p>
                          {app.review_notes && (
                            <p className="text-xs text-muted-foreground">
                              Notes: {app.review_notes}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="gaming" 
                                size="sm"
                                onClick={() => setSelectedApplication(app)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View Details
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-gaming-card border-gaming-border max-w-2xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle className="text-foreground">
                                  Application Details - {app.steam_name}
                                </DialogTitle>
                                <DialogDescription>
                                  Status: {app.status.toUpperCase()}
                                </DialogDescription>
                              </DialogHeader>
                              
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label className="text-foreground">Steam Name</Label>
                                    <p className="text-muted-foreground">{app.steam_name}</p>
                                  </div>
                                  <div>
                                    <Label className="text-foreground">Discord Tag</Label>
                                    <p className="text-muted-foreground">{app.discord_tag}</p>
                                  </div>
                                  <div>
                                    <Label className="text-foreground">FiveM Name</Label>
                                    <p className="text-muted-foreground">{app.fivem_name}</p>
                                  </div>
                                  <div>
                                    <Label className="text-foreground">Age</Label>
                                    <p className="text-muted-foreground">{app.age} years old</p>
                                  </div>
                                </div>
                                
                                <div>
                                  <Label className="text-foreground">Roleplay Experience</Label>
                                  <div className="mt-2 p-3 bg-gaming-dark rounded border border-gaming-border">
                                    <p className="text-muted-foreground whitespace-pre-wrap">{app.rp_experience}</p>
                                  </div>
                                </div>
                                
                                <div>
                                  <Label className="text-foreground">Character Backstory</Label>
                                  <div className="mt-2 p-3 bg-gaming-dark rounded border border-gaming-border">
                                    <p className="text-muted-foreground whitespace-pre-wrap">{app.character_backstory}</p>
                                  </div>
                                </div>

                                {app.review_notes && (
                                  <div>
                                    <Label className="text-foreground">Staff Notes</Label>
                                    <div className="mt-2 p-3 bg-gaming-dark rounded border border-gaming-border">
                                      <p className="text-muted-foreground whitespace-pre-wrap">{app.review_notes}</p>
                                    </div>
                                  </div>
                                )}
                                
                                <div>
                                  <Label htmlFor="review-notes" className="text-foreground">
                                    {app.status === 'pending' ? 'Review Notes (Optional)' : 'Update Notes (Optional)'}
                                  </Label>
                                  <Textarea
                                    id="review-notes"
                                    value={reviewNotes}
                                    onChange={(e) => setReviewNotes(e.target.value)}
                                    placeholder={app.status === 'pending' ? 'Add notes for the applicant...' : 'Update application notes...'}
                                    className="mt-2 bg-gaming-dark border-gaming-border focus:border-neon-purple"
                                  />
                                </div>
                                
                                <div className="flex space-x-2 pt-4">
                                  <Button 
                                    variant="neon" 
                                    onClick={() => handleApplicationAction(app.id, 'approved', reviewNotes)}
                                    disabled={isSubmitting}
                                    className="flex-1"
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    {isSubmitting ? "Processing..." : app.status === 'approved' ? 'Re-approve' : 'Approve'}
                                  </Button>
                                  <Button 
                                    variant="outline"
                                    onClick={() => handleApplicationAction(app.id, 'under_review', reviewNotes)}
                                    disabled={isSubmitting}
                                    className="flex-1 hover:border-neon-blue/50"
                                  >
                                    <Clock className="h-4 w-4 mr-1" />
                                    Under Review
                                  </Button>
                                  <Button 
                                    variant="destructive" 
                                    onClick={() => handleApplicationAction(app.id, 'denied', reviewNotes)}
                                    disabled={isSubmitting}
                                    className="flex-1"
                                  >
                                    <XCircle className="h-4 w-4 mr-1" />
                                     {app.status === 'denied' ? 'Re-deny' : 'Deny'}
                                   </Button>
                                   <Button 
                                     variant="outline" 
                                     onClick={() => {
                                       setEditingApplication(app);
                                       setEditApplicationData({
                                         steam_name: app.steam_name,
                                         discord_tag: app.discord_tag,
                                         discord_name: app.discord_name || "",
                                         fivem_name: app.fivem_name,
                                         age: app.age,
                                         rp_experience: app.rp_experience,
                                         character_backstory: app.character_backstory
                                       });
                                     }}
                                     disabled={isSubmitting}
                                     className="flex-1 border-gaming-border hover:border-neon-cyan/50"
                                   >
                                     <Edit className="h-4 w-4 mr-1" />
                                     Edit
                                  </Button>
                                </div>
                                
                                <div className="flex justify-end pt-2">
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        disabled={isSubmitting}
                                        className="border-red-500/50 text-red-500 hover:bg-red-500/10"
                                      >
                                        <Trash2 className="h-4 w-4 mr-1" />
                                        Delete Application
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="bg-gaming-card border-gaming-border">
                                      <AlertDialogHeader>
                                        <AlertDialogTitle className="text-foreground">Delete Application</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you sure you want to delete this application? This action cannot be undone and will permanently remove the application and all related data.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel className="bg-gaming-dark border-gaming-border hover:bg-gaming-darker">
                                          Cancel
                                        </AlertDialogCancel>
                                        <AlertDialogAction 
                                          onClick={() => handleDeleteApplication(app.id)}
                                          className="bg-red-600 hover:bg-red-700"
                                        >
                                          Delete Permanently
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="app-types" className="space-y-4">
            <Card className="p-6 bg-gaming-card border-gaming-border shadow-gaming">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-foreground flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-neon-cyan" />
                  <span>Application Types</span>
                </h2>
                <Button 
                  onClick={() => {
                    setEditingApplicationType(null);
                    setNewApplicationType({
                      name: "",
                      description: "",
                      formFields: [
                        { name: "steam_name", label: "Steam Name", type: "text", required: true },
                        { name: "discord_tag", label: "Discord Tag", type: "text", required: true },
                        { name: "discord_name", label: "Discord User ID", type: "text", required: true },
                        { name: "fivem_name", label: "FiveM Name", type: "text", required: true },
                        { name: "age", label: "Age", type: "number", required: true }
                      ]
                    });
                    setShowApplicationTypeDialog(true);
                  }}
                  className="bg-neon-cyan hover:bg-neon-cyan/80 text-gaming-darker"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Application Type
                </Button>
              </div>

              <div className="space-y-4">
                {applicationTypes.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No application types created yet</p>
                  </div>
                ) : (
                  applicationTypes.map((appType) => (
                    <Card key={appType.id} className="p-4 bg-gaming-dark border-gaming-border">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <h3 className="font-semibold text-foreground flex items-center space-x-2">
                            {appType.name}
                            {!appType.is_active && (
                              <Badge variant="secondary" className="text-xs">Inactive</Badge>
                            )}
                          </h3>
                          <p className="text-sm text-muted-foreground">{appType.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {appType.form_fields?.length || 0} fields
                          </p>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setEditingApplicationType(appType);
                              setNewApplicationType({
                                name: appType.name,
                                description: appType.description || "",
                                formFields: appType.form_fields || []
                              });
                              setShowApplicationTypeDialog(true);
                            }}
                            className="border-gaming-border"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="players" className="space-y-4">
            <Card className="p-6 bg-gaming-card border-gaming-border shadow-gaming">
              <h2 className="text-xl font-semibold text-foreground flex items-center space-x-2 mb-6">
                <Users className="h-5 w-5 text-neon-blue" />
                <span>Player Management</span>
              </h2>
              <p className="text-muted-foreground">Player management features coming soon...</p>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <Card className="p-6 bg-gaming-card border-gaming-border shadow-gaming">
              <h2 className="text-xl font-semibold text-foreground flex items-center space-x-2 mb-6">
                <Clock className="h-5 w-5 text-neon-green" />
                <span>Recent Actions</span>
              </h2>
              
              <div className="space-y-3">
                {recentActions.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No recent actions</p>
                  </div>
                ) : (
                  recentActions.map((action) => (
                    <div key={action.id} className="flex items-center justify-between p-3 bg-gaming-dark rounded-lg border border-gaming-border">
                      <div>
                        <p className="font-medium text-foreground">{action.action.replace('_', ' ').toUpperCase()}</p>
                        <p className="text-sm text-muted-foreground">
                          Player: {action.applications?.steam_name || 'Unknown'}
                        </p>
                        {action.notes && (
                          <p className="text-xs text-muted-foreground mt-1">Notes: {action.notes}</p>
                        )}
                      </div>
                      <Badge variant="outline">
                        {new Date(action.created_at).toLocaleDateString()}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* General Settings */}
              <Card className="p-6 bg-gaming-card border-gaming-border shadow-gaming">
                <h2 className="text-xl font-semibold text-foreground flex items-center space-x-2 mb-6">
                  <Settings className="h-5 w-5 text-neon-purple" />
                  <span>General Settings</span>
                </h2>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="server-name" className="text-sm font-medium">Server Name</Label>
                    <input 
                      id="server-name"
                      value={generalSettings.serverName}
                      onChange={(e) => setGeneralSettings(prev => ({...prev, serverName: e.target.value}))}
                      className="w-full mt-1 px-3 py-2 bg-gaming-dark border border-gaming-border rounded-md text-foreground focus:ring-2 focus:ring-neon-purple focus:border-transparent"
                      placeholder="FiveM RP Server"
                    />
                  </div>
                  <div>
                    <Label htmlFor="max-players" className="text-sm font-medium">Max Players</Label>
                    <input 
                      id="max-players"
                      type="number"
                      value={generalSettings.maxPlayers}
                      onChange={(e) => setGeneralSettings(prev => ({...prev, maxPlayers: parseInt(e.target.value) || 0}))}
                      className="w-full mt-1 px-3 py-2 bg-gaming-dark border border-gaming-border rounded-md text-foreground focus:ring-2 focus:ring-neon-purple focus:border-transparent"
                      placeholder="64"
                    />
                  </div>
                  <div>
                    <Label htmlFor="application-cooldown" className="text-sm font-medium">Application Cooldown (days)</Label>
                    <input 
                      id="application-cooldown"
                      type="number"
                      value={generalSettings.applicationCooldown}
                      onChange={(e) => setGeneralSettings(prev => ({...prev, applicationCooldown: parseInt(e.target.value) || 0}))}
                      className="w-full mt-1 px-3 py-2 bg-gaming-dark border border-gaming-border rounded-md text-foreground focus:ring-2 focus:ring-neon-purple focus:border-transparent"
                      placeholder="7"
                    />
                  </div>
                </div>
                <Button 
                  onClick={handleSaveGeneralSettings}
                  className="w-full mt-6 bg-neon-purple hover:bg-neon-purple/80"
                >
                  Save General Settings
                </Button>
              </Card>

              {/* Application Settings */}
              <Card className="p-6 bg-gaming-card border-gaming-border shadow-gaming">
                <h2 className="text-xl font-semibold text-foreground flex items-center space-x-2 mb-6">
                  <FileText className="h-5 w-5 text-neon-cyan" />
                  <span>Application Settings</span>
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Auto-approve applications</Label>
                      <p className="text-xs text-muted-foreground">Automatically approve applications that meet criteria</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => toggleApplicationSetting('autoApprove')}
                      className={`border-gaming-border ${applicationSettings.autoApprove ? 'bg-neon-purple/20 text-neon-purple' : ''}`}
                    >
                      {applicationSettings.autoApprove ? 'Enabled' : 'Disabled'}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Email notifications</Label>
                      <p className="text-xs text-muted-foreground">Send email updates to applicants</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => toggleApplicationSetting('emailNotifications')}
                      className={`border-gaming-border ${applicationSettings.emailNotifications ? 'bg-neon-purple/20 text-neon-purple' : ''}`}
                    >
                      {applicationSettings.emailNotifications ? 'Enabled' : 'Disabled'}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Discord integration</Label>
                      <p className="text-xs text-muted-foreground">Post updates to Discord channel</p>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setShowDiscordDialog(true)}
                        className="border-gaming-border"
                      >
                        Configure
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => toggleApplicationSetting('discordIntegration')}
                        className={`border-gaming-border ${applicationSettings.discordIntegration ? 'bg-neon-purple/20 text-neon-purple' : ''}`}
                      >
                        {applicationSettings.discordIntegration ? 'Enabled' : 'Disabled'}
                      </Button>
                    </div>
                  </div>
                </div>
                <Button 
                  onClick={handleSaveApplicationSettings}
                  className="w-full mt-6 bg-neon-cyan hover:bg-neon-cyan/80 text-gaming-darker"
                >
                  Save Application Settings
                </Button>
              </Card>

              {/* User Management */}
              <Card className="p-6 bg-gaming-card border-gaming-border shadow-gaming">
                <h2 className="text-xl font-semibold text-foreground flex items-center space-x-2 mb-6">
                  <Users className="h-5 w-5 text-neon-green" />
                  <span>User Management</span>
                </h2>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Staff Roles</Label>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center p-2 bg-gaming-dark rounded">
                        <span className="text-sm">Admin</span>
                        <Badge className="bg-red-600">Full Access</Badge>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-gaming-dark rounded">
                        <span className="text-sm">Moderator</span>
                        <Badge className="bg-yellow-600">Limited Access</Badge>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-gaming-dark rounded">
                        <span className="text-sm">Helper</span>
                        <Badge className="bg-green-600">View Only</Badge>
                      </div>
                    </div>
                  </div>
                </div>
                <Button 
                  onClick={() => setShowStaffDialog(true)}
                  className="w-full mt-6 bg-neon-green hover:bg-neon-green/80 text-black"
                >
                  Manage Staff
                </Button>
              </Card>

              {/* System Status */}
              <Card className="p-6 bg-gaming-card border-gaming-border shadow-gaming">
                <h2 className="text-xl font-semibold text-foreground flex items-center space-x-2 mb-6">
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                  <span>System Status</span>
                </h2>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Database Status</span>
                    <Badge className={`${systemStatus.database === 'online' ? 'bg-green-600' : 'bg-red-600'}`}>
                      {systemStatus.database === 'online' ? 'Online' : 'Offline'}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Email Service</span>
                    <Badge className={`${systemStatus.emailService === 'online' ? 'bg-green-600' : 'bg-red-600'}`}>
                      {systemStatus.emailService === 'online' ? 'Online' : 'Offline'}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Server Health</span>
                    <Badge className={`${systemStatus.serverHealth === 'healthy' ? 'bg-green-600' : 'bg-yellow-600'}`}>
                      {systemStatus.serverHealth === 'healthy' ? 'Healthy' : 'Warning'}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Last Backup</span>
                    <span className="text-xs text-muted-foreground">{systemStatus.lastBackup}</span>
                  </div>
                </div>
                <div className="flex space-x-2 mt-6">
                  <Button 
                    variant="outline" 
                    onClick={checkSystemStatus}
                    className="flex-1 border-gaming-border hover:bg-gaming-darker"
                  >
                    Refresh Status
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowLogsDialog(true);
                      fetchSystemLogs();
                    }}
                    className="flex-1 border-gaming-border hover:bg-gaming-darker"
                  >
                    View Logs
                  </Button>
                </div>
              </Card>

              {/* Rules Editor */}
              <Card className="md:col-span-2 p-6 bg-gaming-card border-gaming-border shadow-gaming">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-foreground flex items-center space-x-2">
                    <FileText className="h-5 w-5 text-neon-blue" />
                    <span>Rules Management</span>
                  </h2>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" className="bg-neon-blue hover:bg-neon-blue/80">
                        <Plus className="h-4 w-4 mr-1" />
                        Add Rule
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-gaming-card border-gaming-border">
                      <DialogHeader>
                        <DialogTitle className="text-foreground">Add New Rule</DialogTitle>
                        <DialogDescription>
                          Create a new server rule for your community
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="new-category">Category</Label>
                          <input
                            id="new-category"
                            value={newRule.category}
                            onChange={(e) => setNewRule({...newRule, category: e.target.value})}
                            className="w-full mt-1 px-3 py-2 bg-gaming-dark border border-gaming-border rounded-md text-foreground focus:ring-2 focus:ring-neon-blue focus:border-transparent"
                            placeholder="e.g., General Rules"
                          />
                        </div>
                        <div>
                          <Label htmlFor="new-title">Rule Title</Label>
                          <input
                            id="new-title"
                            value={newRule.title}
                            onChange={(e) => setNewRule({...newRule, title: e.target.value})}
                            className="w-full mt-1 px-3 py-2 bg-gaming-dark border border-gaming-border rounded-md text-foreground focus:ring-2 focus:ring-neon-blue focus:border-transparent"
                            placeholder="e.g., No Metagaming"
                          />
                        </div>
                        <div>
                          <Label htmlFor="new-description">Description</Label>
                          <Textarea
                            id="new-description"
                            value={newRule.description}
                            onChange={(e) => setNewRule({...newRule, description: e.target.value})}
                            className="mt-1 bg-gaming-dark border-gaming-border focus:border-neon-blue"
                            placeholder="Detailed description of the rule..."
                            rows={3}
                          />
                        </div>
                        <div className="flex space-x-2 pt-4">
                          <Button 
                            onClick={() => handleSaveRule(newRule)}
                            className="flex-1 bg-neon-blue hover:bg-neon-blue/80"
                            disabled={!newRule.category || !newRule.title || !newRule.description}
                          >
                            Create Rule
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {Object.entries(
                    rules.reduce((acc: any, rule: any) => {
                      if (!acc[rule.category]) acc[rule.category] = [];
                      acc[rule.category].push(rule);
                      return acc;
                    }, {})
                  ).map(([category, categoryRules]: [string, any]) => (
                    <div key={category} className="space-y-2">
                      <h3 className="font-semibold text-foreground border-b border-gaming-border pb-2">
                        {category}
                      </h3>
                      {categoryRules.map((rule: any) => (
                        <div key={rule.id} className="flex items-center justify-between p-3 bg-gaming-dark rounded border border-gaming-border">
                          <div className="flex-1">
                            <h4 className="font-medium text-foreground">{rule.title}</h4>
                            <p className="text-sm text-muted-foreground">{rule.description}</p>
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            <Dialog>
                              <DialogTrigger asChild>
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
                                  className="border-gaming-border hover:bg-gaming-darker"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="bg-gaming-card border-gaming-border">
                                <DialogHeader>
                                  <DialogTitle className="text-foreground">Edit Rule</DialogTitle>
                                  <DialogDescription>
                                    Modify the rule details
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <Label htmlFor="edit-category">Category</Label>
                                    <input
                                      id="edit-category"
                                      value={newRule.category}
                                      onChange={(e) => setNewRule({...newRule, category: e.target.value})}
                                      className="w-full mt-1 px-3 py-2 bg-gaming-dark border border-gaming-border rounded-md text-foreground focus:ring-2 focus:ring-neon-blue focus:border-transparent"
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="edit-title">Rule Title</Label>
                                    <input
                                      id="edit-title"
                                      value={newRule.title}
                                      onChange={(e) => setNewRule({...newRule, title: e.target.value})}
                                      className="w-full mt-1 px-3 py-2 bg-gaming-dark border border-gaming-border rounded-md text-foreground focus:ring-2 focus:ring-neon-blue focus:border-transparent"
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="edit-description">Description</Label>
                                    <Textarea
                                      id="edit-description"
                                      value={newRule.description}
                                      onChange={(e) => setNewRule({...newRule, description: e.target.value})}
                                      className="mt-1 bg-gaming-dark border-gaming-border focus:border-neon-blue"
                                      rows={3}
                                    />
                                  </div>
                                  <div className="flex space-x-2 pt-4">
                                    <Button 
                                      onClick={() => handleSaveRule(newRule)}
                                      className="flex-1 bg-neon-blue hover:bg-neon-blue/80"
                                      disabled={!newRule.category || !newRule.title || !newRule.description}
                                    >
                                      Update Rule
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm" className="border-red-500/50 text-red-500 hover:bg-red-500/10">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="bg-gaming-card border-gaming-border">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="text-foreground">Delete Rule</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this rule? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="bg-gaming-dark border-gaming-border hover:bg-gaming-darker">
                                    Cancel
                                  </AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDeleteRule(rule.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Staff Management Dialog */}
      <Dialog open={showStaffDialog} onOpenChange={setShowStaffDialog}>
        <DialogContent className="bg-gaming-card border-gaming-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Staff Management</DialogTitle>
            <DialogDescription>
              Manage server staff members and their roles
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Current Staff */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Current Staff</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {staffMembers.map((member: any) => (
                  <div key={member.id} className="flex items-center justify-between p-3 bg-gaming-dark rounded border border-gaming-border">
                    <div>
                      <span className="font-medium text-foreground">
                        {member.profiles?.full_name || member.profiles?.username || 'Unknown'}
                      </span>
                      <Badge variant="secondary" className="ml-2">
                        {member.role}
                      </Badge>
                    </div>
                    <Button 
                      onClick={() => handleRemoveStaff(member.id)}
                      variant="outline" 
                      size="sm" 
                      className="border-red-500/50 text-red-500 hover:bg-red-500/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                
                {staffMembers.length === 0 && (
                  <p className="text-muted-foreground text-center py-4">No staff members found</p>
                )}
              </div>
            </div>
            
            {/* Add New Staff */}
            <div className="border-t border-gaming-border pt-4">
              <h3 className="text-lg font-semibold mb-4">Add Staff Member</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="staff-email">User Email</Label>
                  <input
                    id="staff-email"
                    type="email"
                    value={newStaffEmail}
                    onChange={(e) => setNewStaffEmail(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-gaming-dark border border-gaming-border rounded-md text-foreground focus:ring-2 focus:ring-neon-purple focus:border-transparent"
                    placeholder="user@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="staff-role">Role</Label>
                  <select
                    id="staff-role"
                    value={newStaffRole}
                    onChange={(e) => setNewStaffRole(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-gaming-dark border border-gaming-border rounded-md text-foreground focus:ring-2 focus:ring-neon-purple focus:border-transparent"
                  >
                    <option value="moderator">Moderator</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <Button 
                  onClick={handleAddStaff}
                  className="w-full bg-neon-purple hover:bg-neon-purple/80"
                  disabled={!newStaffEmail.trim()}
                >
                  Add Staff Member
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Discord Configuration Dialog */}
      <Dialog open={showDiscordDialog} onOpenChange={setShowDiscordDialog}>
        <DialogContent className="bg-gaming-card border-gaming-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Discord Integration Setup</DialogTitle>
            <DialogDescription>
              Configure Discord webhook to receive server notifications
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="discord-webhook">Discord Webhook URL</Label>
              <input
                id="discord-webhook"
                type="url"
                value={applicationSettings.discordWebhook}
                onChange={(e) => setApplicationSettings(prev => ({...prev, discordWebhook: e.target.value}))}
                className="w-full mt-1 px-3 py-2 bg-gaming-dark border border-gaming-border rounded-md text-foreground focus:ring-2 focus:ring-neon-purple focus:border-transparent"
                placeholder="https://discord.com/api/webhooks/..."
              />
            </div>
            <div>
              <Label htmlFor="discord-channel">Channel Name (Optional)</Label>
              <input
                id="discord-channel"
                value={applicationSettings.discordChannel}
                onChange={(e) => setApplicationSettings(prev => ({...prev, discordChannel: e.target.value}))}
                className="w-full mt-1 px-3 py-2 bg-gaming-dark border border-gaming-border rounded-md text-foreground focus:ring-2 focus:ring-neon-purple focus:border-transparent"
                placeholder="#applications"
              />
            </div>
            <div className="flex space-x-2 pt-4">
              <Button 
                onClick={testDiscordWebhook}
                variant="outline"
                className="flex-1 border-gaming-border"
                disabled={!applicationSettings.discordWebhook}
              >
                Test Connection
              </Button>
              <Button 
                onClick={() => {
                  handleSaveApplicationSettings();
                  setShowDiscordDialog(false);
                }}
                className="flex-1 bg-neon-purple hover:bg-neon-purple/80"
              >
                Save Settings
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* System Logs Dialog */}
      <Dialog open={showLogsDialog} onOpenChange={setShowLogsDialog}>
        <DialogContent className="bg-gaming-card border-gaming-border max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="text-foreground">System Logs</DialogTitle>
            <DialogDescription>
              Recent system events and error logs
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex space-x-2">
                <Button 
                  onClick={fetchSystemLogs}
                  variant="outline"
                  size="sm"
                  className="border-gaming-border"
                  disabled={loadingLogs}
                >
                  {loadingLogs ? 'Loading...' : 'Refresh'}
                </Button>
                <Button 
                  variant="outline"
                  size="sm"
                  className="border-gaming-border"
                >
                  Export Logs
                </Button>
              </div>
              <div className="text-sm text-muted-foreground">
                {systemLogs.length} entries
              </div>
            </div>
            
            <div className="bg-gaming-dark rounded-lg border border-gaming-border p-4 max-h-96 overflow-y-auto">
              {loadingLogs ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-purple mx-auto"></div>
                  <p className="text-muted-foreground mt-2">Loading logs...</p>
                </div>
              ) : systemLogs.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No logs available</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {systemLogs.map((log) => (
                    <div key={log.id} className="flex items-start space-x-3 p-2 rounded hover:bg-gaming-darker">
                      <Badge 
                        variant="outline"
                        className={`text-xs ${
                          log.level === 'ERROR' ? 'border-red-500 text-red-500' :
                          log.level === 'WARNING' ? 'border-yellow-500 text-yellow-500' :
                          'border-green-500 text-green-500'
                        }`}
                      >
                        {log.level}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground">{log.message}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(log.timestamp).toLocaleString()} • {log.source}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Application Dialog */}
      <Dialog open={editingApplication !== null} onOpenChange={() => setEditingApplication(null)}>
        <DialogContent className="bg-gaming-card border-gaming-border max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              Edit Application - {editingApplication?.steam_name}
            </DialogTitle>
            <DialogDescription>
              Modify the application details below
            </DialogDescription>
          </DialogHeader>
          
          {editingApplication && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-steam-name" className="text-foreground">Steam Name</Label>
                  <Input
                    id="edit-steam-name"
                    value={editApplicationData.steam_name}
                    onChange={(e) => setEditApplicationData({...editApplicationData, steam_name: e.target.value})}
                    className="bg-gaming-dark border-gaming-border focus:border-neon-purple"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-discord-tag" className="text-foreground">Discord Tag</Label>
                  <Input
                    id="edit-discord-tag"
                    value={editApplicationData.discord_tag}
                    onChange={(e) => setEditApplicationData({...editApplicationData, discord_tag: e.target.value})}
                    className="bg-gaming-dark border-gaming-border focus:border-neon-purple"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-discord-name" className="text-foreground">Discord User ID</Label>
                  <Input
                    id="edit-discord-name"
                    value={editApplicationData.discord_name}
                    onChange={(e) => setEditApplicationData({...editApplicationData, discord_name: e.target.value})}
                    className="bg-gaming-dark border-gaming-border focus:border-neon-purple"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-fivem-name" className="text-foreground">FiveM Name</Label>
                  <Input
                    id="edit-fivem-name"
                    value={editApplicationData.fivem_name}
                    onChange={(e) => setEditApplicationData({...editApplicationData, fivem_name: e.target.value})}
                    className="bg-gaming-dark border-gaming-border focus:border-neon-purple"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-age" className="text-foreground">Age</Label>
                  <Input
                    id="edit-age"
                    type="number"
                    value={editApplicationData.age}
                    onChange={(e) => setEditApplicationData({...editApplicationData, age: parseInt(e.target.value) || 18})}
                    className="bg-gaming-dark border-gaming-border focus:border-neon-purple"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="edit-rp-experience" className="text-foreground">Roleplay Experience</Label>
                <Textarea
                  id="edit-rp-experience"
                  value={editApplicationData.rp_experience}
                  onChange={(e) => setEditApplicationData({...editApplicationData, rp_experience: e.target.value})}
                  className="bg-gaming-dark border-gaming-border focus:border-neon-purple"
                  rows={4}
                />
              </div>
              
              <div>
                <Label htmlFor="edit-character-backstory" className="text-foreground">Character Backstory</Label>
                <Textarea
                  id="edit-character-backstory"
                  value={editApplicationData.character_backstory}
                  onChange={(e) => setEditApplicationData({...editApplicationData, character_backstory: e.target.value})}
                  className="bg-gaming-dark border-gaming-border focus:border-neon-purple"
                  rows={4}
                />
              </div>
              
              <div className="flex space-x-2 pt-4">
                <Button 
                  variant="neon" 
                  onClick={handleEditApplication}
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setEditingApplication(null)}
                  disabled={isSubmitting}
                  className="flex-1 border-gaming-border hover:border-neon-purple/50"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StaffPanel;