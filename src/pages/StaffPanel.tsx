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
  Settings 
} from "lucide-react";

const StaffPanel = () => {
  const [applications, setApplications] = useState<any[]>([]);
  const [recentActions, setRecentActions] = useState<any[]>([]);
  const [rules, setRules] = useState<any[]>([]);
  const [staffMembers, setStaffMembers] = useState<any[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [applicationTypes, setApplicationTypes] = useState<any[]>([]);
  const [serverSettings, setServerSettings] = useState<any>({});
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

      const [applicationsRes, rulesRes, typesRes, settingsRes] = await Promise.all([
        supabase.from('applications').select('*').order('created_at', { ascending: false }),
        supabase.from('rules').select('*').order('category', { ascending: true }),
        supabase.from('application_types').select('*'),
        supabase.from('server_settings').select('*').single()
      ]);

      if (applicationsRes.data) setApplications(applicationsRes.data);
      if (rulesRes.data) setRules(rulesRes.data);
      if (processedStaffMembers) {
        console.log('Staff members loaded:', processedStaffMembers);
        setStaffMembers(processedStaffMembers);
      }
      if (typesRes.data) setApplicationTypes(typesRes.data);
      if (settingsRes.data) setServerSettings(settingsRes.data);
      
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

          // Send Discord notification
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

  const handleDeleteRule = async (ruleId: string) => {
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

        toast({
          title: "Success",
          description: "Rule updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('rules')
          .insert([newRule]);

        if (error) throw error;

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

  const handleSettingUpdate = async (settingType: string, value: any) => {
    try {
      // First, check if a setting with this key already exists
      const { data: existingSetting, error: fetchError } = await supabase
        .from('server_settings')
        .select('*')
        .eq('setting_key', settingType)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (existingSetting) {
        // Update existing setting
        const { error } = await supabase
          .from('server_settings')
          .update({ 
            setting_value: value,
            updated_at: new Date().toISOString(),
            created_by: user?.id
          })
          .eq('setting_key', settingType);

        if (error) throw error;
      } else {
        // Create new setting
        const { error } = await supabase
          .from('server_settings')
          .insert({
            setting_key: settingType,
            setting_value: value,
            created_by: user?.id
          });

        if (error) throw error;
      }

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
          <div className="flex justify-center">
            <TabsList className="bg-gaming-card border-gaming-border">
              <TabsTrigger value="pending" className="data-[state=active]:bg-gaming-dark">
                Pending Applications ({pendingApplications.length})
              </TabsTrigger>
              <TabsTrigger value="all-applications" className="data-[state=active]:bg-gaming-dark">
                All Applications ({applications.length})
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
                  Approved: {applications.filter(app => app.status === 'approved').length}
                </Badge>
                <Badge variant="outline" className="border-red-500 text-red-500">
                  Denied: {applications.filter(app => app.status === 'denied').length}
                </Badge>
                <Badge variant="outline" className="border-yellow-500 text-yellow-500">
                  Pending: {applications.filter(app => app.status === 'pending').length}
                </Badge>
                <Badge variant="outline" className="border-blue-500 text-blue-500">
                  Under Review: {applications.filter(app => app.status === 'under_review').length}
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
              applications.map((application) => (
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
                        <h3 className="font-semibold text-foreground">{type.name}</h3>
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
            </div>
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
