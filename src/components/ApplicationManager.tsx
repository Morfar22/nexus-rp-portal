import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { usePermissions } from "@/hooks/usePermissions";
import { supabase } from "@/integrations/supabase/client";
import { Eye, CheckCircle, XCircle, Clock, Trash2, Webhook, Settings, Shield } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { ApplicationPermissionsManager } from "@/components/applications/ApplicationPermissionsManager";

const ApplicationSettingsPanel = () => {
  const [applicationSettings, setApplicationSettings] = useState<any>({});
  const [loadingSettings, setLoadingSettings] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchApplicationSettings();
  }, []);

  const fetchApplicationSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('server_settings')
        .select('setting_value')
        .eq('setting_key', 'application_settings')
        .maybeSingle();

      if (error) throw error;
      setApplicationSettings(data?.setting_value || {});
    } catch (error) {
      console.error('Error fetching application settings:', error);
    }
  };

  const updateApplicationSettings = async (settings: any) => {
    setLoadingSettings(true);
    try {
      // Check if record exists first
      const { data: existingData } = await supabase
        .from('server_settings')
        .select('id')
        .eq('setting_key', 'application_settings')
        .maybeSingle();

      if (existingData) {
        // Update existing record
        const { error } = await supabase
          .from('server_settings')
          .update({
            setting_value: settings,
            updated_at: new Date().toISOString()
          })
          .eq('setting_key', 'application_settings');

        if (error) throw error;
      } else {
        // Insert new record
        const { error } = await supabase
          .from('server_settings')
          .insert({
            setting_key: 'application_settings',
            setting_value: settings,
            created_by: (await supabase.auth.getUser()).data.user?.id
          });

        if (error) throw error;
      }
      
      setApplicationSettings(settings);
      toast({
        title: "Settings Updated",
        description: "Application settings have been updated successfully.",
      });
    } catch (error) {
      console.error('Error updating application settings:', error);
      toast({
        title: "Error",
        description: "Failed to update application settings.",
        variant: "destructive",
      });
    } finally {
      setLoadingSettings(false);
    }
  };

  return (
    <Card className="p-6 bg-gaming-card border-gaming-border">
      <div className="flex items-center space-x-2 mb-6">
        <Settings className="h-5 w-5 text-neon-purple" />
        <h2 className="text-xl font-semibold text-foreground">Application Settings</h2>
      </div>
      
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base text-foreground">Multiple Applications</Label>
            <div className="text-sm text-muted-foreground">
              Allow users to submit multiple applications even if they have an approved one
            </div>
          </div>
          <Switch
            checked={applicationSettings.multiple_applications_allowed || false}
            onCheckedChange={(checked) => 
              updateApplicationSettings({
                ...applicationSettings,
                multiple_applications_allowed: checked
              })
            }
            disabled={loadingSettings}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base text-foreground">Auto Close Applications</Label>
            <div className="text-sm text-muted-foreground">
              Automatically close applications after approval/rejection
            </div>
          </div>
          <Switch
            checked={applicationSettings.auto_close_applications || false}
            onCheckedChange={(checked) => 
              updateApplicationSettings({
                ...applicationSettings,
                auto_close_applications: checked
              })
            }
            disabled={loadingSettings}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base text-foreground">Require Age Verification</Label>
            <div className="text-sm text-muted-foreground">
              Require users to verify they are 18+ before applying
            </div>
          </div>
          <Switch
            checked={applicationSettings.require_age_verification || false}
            onCheckedChange={(checked) => 
              updateApplicationSettings({
                ...applicationSettings,
                require_age_verification: checked
              })
            }
            disabled={loadingSettings}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-base text-foreground">Application Cooldown (Days)</Label>
          <div className="text-sm text-muted-foreground mb-2">
            How long users must wait before reapplying after rejection
          </div>
          <Input
            type="number"
            min="0"
            max="365"
            value={applicationSettings.cooldown_days || 0}
            onChange={(e) => 
              updateApplicationSettings({
                ...applicationSettings,
                cooldown_days: parseInt(e.target.value) || 0
              })
            }
            disabled={loadingSettings}
            className="w-32 bg-gaming-dark border-gaming-border text-foreground"
          />
        </div>
      </div>
      
      {/* Application Permissions Manager */}
      <div className="mt-6">
        <ApplicationPermissionsManager />
      </div>
    </Card>
  );
};

const ApplicationManager = () => {
  const [applications, setApplications] = useState<any[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [availableRoles, setAvailableRoles] = useState<any[]>([]);
  const [discordSettings, setDiscordSettings] = useState<any>({
    enabled: false,
    staff_webhook_url: "",
    public_webhook_url: "",
    notify_submissions: true,
    notify_approvals: true,
    notify_denials: true
  });
  const { toast } = useToast();
  const { permissions, hasAnyPermission, roleAssignments } = usePermissions();

  useEffect(() => {
    fetchApplications();
    fetchDiscordSettings();
    fetchAvailableRoles();
  }, []);

  useEffect(() => {
    // Filter applications based on user's staff roles
    if (roleAssignments.length === 0) {
      setFilteredApplications([]);
      return;
    }

    // Get user's role names
    const userRoleNames = roleAssignments.map(ra => ra.staff_roles?.name).filter(Boolean);
    
    const filtered = applications.filter(app => {
      // If no required roles, everyone can see it
      if (!app.required_permissions || app.required_permissions.length === 0) {
        return true;
      }
      // Check if user has at least one of the required roles
      return app.required_permissions.some(requiredRole => userRoleNames.includes(requiredRole));
    });

    setFilteredApplications(filtered);
  }, [applications, roleAssignments]);

  const fetchAvailableRoles = async () => {
    try {
      const { data, error } = await supabase
        .from('staff_roles')
        .select('id, name, display_name, description, color, hierarchy_level')
        .eq('is_active', true)
        .order('hierarchy_level', { ascending: true });

      if (error) throw error;
      setAvailableRoles(data || []);
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  const fetchApplications = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching applications...');
      
      // Test basic query first
      const { data: basicData, error: basicError } = await supabase
        .from('applications')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('Basic applications query result:', { basicData, basicError });
      
      if (basicError) {
        console.error('Basic query failed:', basicError);
        throw basicError;
      }

      // If basic query works, fetch with joins
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          application_types (
            name,
            form_fields,
            required_permissions
          )
        `)
        .order('created_at', { ascending: false });

      console.log('Full applications query result:', { data, error });
      if (error) throw error;
      const apps = data || [];

      // Fetch related profiles in a second query and merge manually
      const userIds = Array.from(new Set(apps.map((a: any) => a.user_id).filter(Boolean)));
      let profileMap: Record<string, any> = {};
      if (userIds.length) {
        const { data: profiles } = await supabase
          .from('custom_users')
          .select('id, username, full_name, email')
          .in('id', userIds);
        (profiles || []).forEach((p: any) => {
          profileMap[p.id] = p;
        });
      }

      const merged = apps.map((a: any) => {
        // Parse form_fields if it's a string
        if (a.application_types?.form_fields) {
          try {
            if (typeof a.application_types.form_fields === 'string') {
              a.application_types.form_fields = JSON.parse(a.application_types.form_fields);
            }
          } catch (parseError) {
            console.error('Error parsing form_fields for application:', a.id, parseError);
            a.application_types.form_fields = [];
          }
        }
        // Ensure form_data is an object
        if (a.form_data && typeof a.form_data === 'string') {
          try {
            a.form_data = JSON.parse(a.form_data);
          } catch (e) {
            console.error('Error parsing form_data for application:', a.id, e);
            a.form_data = {};
          }
        }
        
        return { 
          ...a, 
          profiles: profileMap[a.user_id] || null 
        };
      });
      console.log('Final merged applications:', merged);
      setApplications(merged);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast({
        title: "Error",
        description: "Failed to fetch applications",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDiscordSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('server_settings')
        .select('setting_value')
        .eq('setting_key', 'application_discord_settings')
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data?.setting_value) {
        setDiscordSettings(data.setting_value);
      }
    } catch (error) {
      console.error('Error fetching Discord settings:', error);
    }
  };

  const updateDiscordSettings = async (newSettings: any) => {
    try {
      const { data: existingData } = await supabase
        .from('server_settings')
        .select('id')
        .eq('setting_key', 'application_discord_settings')
        .maybeSingle();

      if (existingData) {
        const { error } = await supabase
          .from('server_settings')
          .update({
            setting_value: newSettings,
            updated_at: new Date().toISOString()
          })
          .eq('setting_key', 'application_discord_settings');

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('server_settings')
          .insert({
            setting_key: 'application_discord_settings',
            setting_value: newSettings,
            created_by: (await supabase.auth.getUser()).data.user?.id
          });

        if (error) throw error;
      }

      setDiscordSettings(newSettings);
      toast({
        title: "Success",
        description: "Discord settings updated successfully",
      });
    } catch (error) {
      console.error('Error updating Discord settings:', error);
      toast({
        title: "Error",
        description: "Failed to update Discord settings",
        variant: "destructive",
      });
    }
  };

  const updateApplicationPermissions = async (applicationId: string, newPermissions: string[]) => {
    try {
      const { error } = await supabase
        .from('applications')
        .update({ required_permissions: newPermissions })
        .eq('id', applicationId);

      if (error) throw error;

      // Update local state
      setApplications(prev => prev.map(app => 
        app.id === applicationId 
          ? { ...app, required_permissions: newPermissions }
          : app
      ));

      toast({
        title: "Success",
        description: "Application permissions updated successfully",
      });
    } catch (error) {
      console.error('Error updating application permissions:', error);
      toast({
        title: "Error",
        description: "Failed to update application permissions",
        variant: "destructive",
      });
    }
  };

  const updateApplicationStatus = async (applicationId: string, status: string, notes?: string) => {
    try {
      // Get the application data first for notifications
      const { data: appData, error: fetchError } = await supabase
        .from('applications')
        .select('*')
        .eq('id', applicationId)
        .single();

      if (fetchError) throw fetchError;

      const reviewerId = (await supabase.auth.getUser()).data.user?.id;

      const { error } = await supabase
        .from('applications')
        .update({
          status,
          notes,
          reviewed_by: reviewerId,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', applicationId);

      if (error) throw error;

      // Optimistic UI update
      setApplications((prev: any[]) => prev.map(a => a.id === applicationId ? ({
        ...a,
        status,
        notes,
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString()
      }) : a));
      setSelectedApp((prev: any) => prev && prev.id === applicationId ? ({
        ...prev,
        status,
        notes,
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString()
      }) : prev);

      // Get the application type to map form fields properly
      const { data: applicationType } = await supabase
        .from('application_types')
        .select('name, form_fields')
        .eq('id', appData.application_type_id)
        .single();

      // Helper function to find field value with multiple possible names
      const findFieldValue = (formData: any, possibleNames: string[]) => {
        if (!formData) return '';
        for (const name of possibleNames) {
          const value = formData[name];
          if (value && typeof value === 'string' && value.trim()) {
            return value.trim();
          }
        }
        return '';
      };

      // Extract applicant data from form_data using flexible field matching
      let applicantName = 'Applicant';
      let discordName = '';
      let steamName = '';
      let fivemName = '';
      let userEmail = '';

      const formData = appData.form_data as any;

      // Try to extract from form_data with multiple possible field names
      steamName = findFieldValue(formData, [
        'steam_name', 'steamName', 'steam', 'Steam Name', 'steamname', 'Steam'
      ]) || appData.steam_name || '';

      fivemName = findFieldValue(formData, [
        'fivem_name', 'fivemName', 'fivem', 'FiveM Name', 'fivemname', 'fivem_username', 'FiveM'
      ]) || appData.fivem_name || steamName || '';

      discordName = findFieldValue(formData, [
        'discord_name', 'discordName', 'discord_tag', 'discordTag', 'discord', 'Discord Tag', 'Discord Name', 'Discord', 'discord_username'
      ]) || appData.discord_tag || '';

      userEmail = findFieldValue(formData, [
        'email', 'Email', 'e-mail', 'e_mail', 'Email Address'
      ]) || '';

      // Try to get a good applicant name from available data
      applicantName = findFieldValue(formData, [
        'full_name', 'fullName', 'name', 'Name', 'karakternavn'
      ]) || steamName || discordName || 'Applicant';

      // Get email from user profile if not in form_data
      if (!userEmail && appData.user_id) {
        const { data: userProfile } = await supabase
          .from('custom_users')
          .select('email')
          .eq('id', appData.user_id)
          .maybeSingle();
        userEmail = userProfile?.email || '';
      }

      // Send email notification
      try {
        // Update the application manager to use new template system
        let templateType: 'application_approved' | 'application_denied' | 'application_submitted';
        if (status === 'approved') {
          templateType = 'application_approved';
        } else if (status === 'rejected') {
          templateType = 'application_denied';
        } else {
          templateType = 'application_submitted'; // fallback
        }

        await supabase.functions.invoke('send-application-email', {
          body: {
            applicationId: applicationId,
            templateType: templateType,
            recipientEmail: userEmail,
            applicantName: applicantName,
            applicationType: applicationType?.name || 'Application',
            reviewNotes: notes || '',
            discordName: discordName,
            steamName: steamName,
            fivemName: fivemName
          }
        });
        console.log('Status update email invoked');
      } catch (emailError) {
        console.error('Error sending status update email:', emailError);
      }

      // Send Discord notification
      try {
        const discordType = status === 'approved' ? 'application_approved' : 
                          status === 'rejected' ? 'application_denied' : 
                          'application_under_review';
        
        await supabase.functions.invoke('discord-logger', {
          body: {
            type: discordType,
            data: {
              applicant_name: applicantName || 'Unknown',
              steam_name: steamName || 'Not provided',
              discord_tag: discordName || 'Not provided',
              discord_name: discordName || 'Not provided',
              fivem_name: fivemName || 'Not provided',
              applicantEmail: userEmail || 'Not provided',
              user_email: userEmail || 'Not provided',
              review_notes: notes || 'No notes provided',
              reason: notes || 'No reason provided',
              application_type: applicationType?.name || 'Application',
              form_data: appData.form_data || {}
            }
          }
        });
        console.log('Discord notification sent successfully with data:', {
          applicant_name: applicantName,
          discord_name: discordName,
          steam_name: steamName,
          fivem_name: fivemName
        });
      } catch (discordError) {
        console.error('Error sending Discord notification:', discordError);
      }

      await fetchApplications();
      toast({
        title: "Success",
        description: `Application ${status} successfully`,
      });
    } catch (error) {
      console.error('Error updating application:', error);
      toast({
        title: "Error",
        description: "Failed to update application",
        variant: "destructive",
      });
    }
  };

  const deleteApplication = async (applicationId: string) => {
    try {
      const { error } = await supabase
        .from('applications')
        .delete()
        .eq('id', applicationId);

      if (error) throw error;

      await fetchApplications();
      toast({
        title: "Success",
        description: "Application deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting application:', error);
      toast({
        title: "Error",
        description: "Failed to delete application",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'rejected':
      case 'denied': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6 bg-gaming-card border-gaming-border">
        <div className="text-center">
          <p className="text-foreground">Loading applications...</p>
        </div>
      </Card>
    );
  }

  return (
    <Tabs defaultValue="applications" className="space-y-6">
      <TabsList className="grid w-full grid-cols-3 bg-gaming-card border-gaming-border">
        <TabsTrigger value="applications">Applications</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
        <TabsTrigger value="discord">Discord Settings</TabsTrigger>
      </TabsList>

      <TabsContent value="applications">
        <ApplicationsList 
          applications={filteredApplications}
          availableRoles={availableRoles}
          updateApplicationStatus={updateApplicationStatus}
          updateApplicationPermissions={updateApplicationPermissions}
          deleteApplication={deleteApplication}
          getStatusColor={getStatusColor}
        />
      </TabsContent>

      <TabsContent value="settings">
        <ApplicationSettingsPanel />
      </TabsContent>

      <TabsContent value="discord">
        <DiscordSettingsPanel 
          settings={discordSettings}
          onUpdate={updateDiscordSettings}
        />
      </TabsContent>
    </Tabs>
  );
};

const ApplicationsList = ({ applications, availableRoles, updateApplicationStatus, updateApplicationPermissions, deleteApplication, getStatusColor }: any) => {
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [editingPermissions, setEditingPermissions] = useState<any>(null);
  const [reviewNotes, setReviewNotes] = useState("");

  return (
    <Card className="p-6 bg-gaming-card border-gaming-border">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-foreground">Application Management</h2>
        <Badge variant="outline" className="text-foreground">
          {applications.length} Total Applications
        </Badge>
      </div>

      <div className="space-y-4">
        {applications.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No applications found</p>
        ) : (
          applications.map((app) => (
            <Card key={app.id} className="p-4 bg-gaming-dark border-gaming-border">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-medium text-foreground">
                      {app.profiles?.username || app.profiles?.full_name || 
                       (app.form_data as any)?.steam_name || 
                       app.steam_name || 'Unknown User'}
                    </h3>
                    <Badge className={getStatusColor(app.status)}>
                      {app.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Type: {app.application_types?.name || 'Application'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Applied: {new Date(app.created_at).toLocaleDateString()}
                  </p>
                  {(app.required_permissions && app.required_permissions.length > 0) && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-foreground">Required Staff Roles:</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {app.required_permissions.map((roleName: string) => {
                          const role = availableRoles?.find(r => r.name === roleName);
                          return (
                            <Badge key={roleName} variant="secondary" className="text-xs flex items-center gap-1">
                              {role && (
                                <div 
                                  className="w-2 h-2 rounded-full" 
                                  style={{ backgroundColor: role.color }}
                                />
                              )}
                              {role?.display_name || roleName}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingPermissions(app)}
                      >
                        <Shield className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md bg-gaming-card border-gaming-border">
                      <DialogHeader>
                        <DialogTitle className="text-foreground">Edit Application Permissions</DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                          Vælg hvilke permissions der kræves for at se denne ansøgning
                        </DialogDescription>
                      </DialogHeader>
                      
                      {editingPermissions && (
                        <div className="space-y-4">
                          <div className="space-y-2 max-h-60 overflow-y-auto">
                            {availableRoles?.map((role) => (
                              <div key={role.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`app-role-${role.id}`}
                                  checked={editingPermissions.required_permissions?.includes(role.name) || false}
                                  onCheckedChange={(checked) => {
                                    const currentPerms = editingPermissions.required_permissions || [];
                                    if (checked) {
                                      setEditingPermissions({
                                        ...editingPermissions,
                                        required_permissions: [...currentPerms, role.name]
                                      });
                                    } else {
                                      setEditingPermissions({
                                        ...editingPermissions,
                                        required_permissions: currentPerms.filter(p => p !== role.name)
                                      });
                                    }
                                  }}
                                />
                                <Label 
                                  htmlFor={`app-role-${role.id}`}
                                  className="text-sm text-foreground cursor-pointer flex items-center gap-2"
                                >
                                  <div 
                                    className="w-3 h-3 rounded-full" 
                                    style={{ backgroundColor: role.color }}
                                  />
                                  {role.display_name}
                                </Label>
                              </div>
                            ))}
                          </div>
                          <div className="flex justify-end space-x-2">
                            <Button 
                              variant="outline" 
                              onClick={() => setEditingPermissions(null)}
                            >
                              Cancel
                            </Button>
                            <Button 
                              onClick={() => {
                                updateApplicationPermissions(
                                  editingPermissions.id, 
                                  editingPermissions.required_permissions || []
                                );
                                setEditingPermissions(null);
                              }}
                            >
                              Save
                            </Button>
                          </div>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedApp(app)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto bg-gaming-card border-gaming-border mx-auto">
                      <DialogHeader className="space-y-2">
                        <DialogTitle className="text-foreground text-lg sm:text-xl">Application Details</DialogTitle>
                        <DialogDescription className="text-muted-foreground text-sm">
                          Review application from {selectedApp?.profiles?.username || 
                            selectedApp?.profiles?.full_name || 
                            (selectedApp?.form_data as any)?.steam_name || 
                            selectedApp?.steam_name || 'Unknown User'}
                        </DialogDescription>
                      </DialogHeader>
                      
                      {selectedApp && (
                        <div className="space-y-4 sm:space-y-6">
                          {/* Dynamic form fields based on application type */}
                          {selectedApp.application_types?.form_fields && Array.isArray(selectedApp.application_types.form_fields) ? (
                            <div className="grid grid-cols-1 gap-3 sm:gap-4">
                               {selectedApp.application_types.form_fields.map((field: any, index: number) => {
                                 // Support both field.key and field.id, and handle 0/empty values correctly
                                 const fieldKey = field.key ?? field.id;
                                 let value: any = undefined;

                                 if (fieldKey && selectedApp.form_data && Object.prototype.hasOwnProperty.call(selectedApp.form_data, fieldKey)) {
                                   value = selectedApp.form_data[fieldKey];
                                 }

                                 // Fallback to top-level columns for known system fields
                                 if ((value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) && fieldKey) {
                                   const topLevel = (selectedApp as any)[fieldKey];
                                   if (topLevel !== undefined && topLevel !== null && !(typeof topLevel === 'string' && topLevel.trim() === '')) {
                                     value = topLevel;
                                   } else {
                                     if (fieldKey === 'discord_name') value = (selectedApp as any).discord_name;
                                     if (fieldKey === 'steam_name') value = (selectedApp as any).steam_name;
                                     if (fieldKey === 'fivem_name') value = (selectedApp as any).fivem_name;
                                   }
                                 }

                                 const displayValue = (value !== undefined && value !== null && !(typeof value === 'string' && value.trim() === '')) ? value : 'N/A';
                                 
                                 return (
                                   <div key={fieldKey || index} className="space-y-2">
                                     <Label className="text-foreground font-medium text-sm">{field.label}</Label>
                                     {field.type === 'textarea' ? (
                                       <div className="text-sm text-muted-foreground p-3 bg-gaming-dark rounded border min-h-[60px] break-words">
                                         {typeof displayValue === 'string' ? displayValue : JSON.stringify(displayValue)}
                                       </div>
                                     ) : (
                                       <p className="text-sm text-muted-foreground break-words">{typeof displayValue === 'string' ? displayValue : JSON.stringify(displayValue)}</p>
                                     )}
                                   </div>
                                 );
                               })}
                            </div>
                          ) : (
                            /* Fallback for old applications without dynamic form fields */
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                              <div className="space-y-2">
                                <Label className="text-foreground font-medium text-sm">Steam Name</Label>
                                <p className="text-sm text-muted-foreground break-words">
                                  {(selectedApp.form_data as any)?.steam_name || selectedApp.steam_name || 'N/A'}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-foreground font-medium text-sm">Discord Name</Label>
                                <p className="text-sm text-muted-foreground break-words">
                                  {(selectedApp.form_data as any)?.discord_name || selectedApp.discord_name || 'N/A'}
                                </p>
                              </div>
                              <div className="space-y-2 sm:col-span-2">
                                <Label className="text-foreground font-medium text-sm">FiveM Name</Label>
                                <p className="text-sm text-muted-foreground break-words">
                                  {(selectedApp.form_data as any)?.fivem_name || selectedApp.fivem_name || 'N/A'}
                                </p>
                              </div>
                            </div>
                          )}

                          {selectedApp.notes && (
                            <div className="space-y-2">
                              <Label className="text-foreground font-medium text-sm">Review Notes</Label>
                              <p className="text-sm text-muted-foreground p-3 bg-gaming-dark rounded border break-words">
                                {selectedApp.notes}
                              </p>
                            </div>
                          )}

                          {selectedApp.status === 'pending' && (
                            <div className="space-y-2">
                              <Label className="text-foreground font-medium text-sm">Review Notes</Label>
                              <Textarea
                                value={reviewNotes}
                                onChange={(e) => setReviewNotes(e.target.value)}
                                placeholder="Add review notes..."
                                className="bg-gaming-dark border-gaming-border text-foreground resize-none min-h-[80px]"
                              />
                            </div>
                          )}

                          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-2 pt-2">
                            {selectedApp.status === 'pending' && (
                              <>
                                <Button
                                  onClick={() => {
                                    updateApplicationStatus(selectedApp.id, 'approved', reviewNotes);
                                    setReviewNotes("");
                                  }}
                                  className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Approve
                                </Button>
                                <Button
                                  onClick={() => {
                                    updateApplicationStatus(selectedApp.id, 'rejected', reviewNotes);
                                    setReviewNotes("");
                                  }}
                                  variant="destructive"
                                  className="w-full sm:w-auto"
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Reject
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-gaming-card border-gaming-border">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-foreground">Delete Application</AlertDialogTitle>
                        <AlertDialogDescription className="text-muted-foreground">
                          Are you sure you want to delete this application? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteApplication(app.id)}
                          className="bg-red-600 hover:bg-red-700"
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
  );
};

const DiscordSettingsPanel = ({ settings, onUpdate }: any) => {
  const [localSettings, setLocalSettings] = useState(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSave = () => {
    onUpdate(localSettings);
  };

  const handleSettingChange = (key: string, value: any) => {
    setLocalSettings({
      ...localSettings,
      [key]: value
    });
  };

  return (
    <Card className="p-6 bg-gaming-card border-gaming-border">
      <div className="flex items-center space-x-3 mb-6">
        <Webhook className="h-6 w-6 text-neon-purple" />
        <div>
          <h2 className="text-xl font-semibold text-foreground">Application Discord Notifications</h2>
          <p className="text-sm text-muted-foreground">Configure Discord webhooks for application management (Staff Channel)</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-foreground">Enable Application Notifications</Label>
            <p className="text-sm text-muted-foreground">Send application notifications to your staff Discord channel</p>
            <p className="text-xs text-neon-purple">⚠️ Use a dedicated staff channel - contains sensitive application data</p>
          </div>
          <Switch
            checked={localSettings.enabled}
            onCheckedChange={(checked) => handleSettingChange('enabled', checked)}
          />
        </div>

        {localSettings.enabled && (
          <>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="staff-webhook-url" className="text-foreground">Staff Discord Webhook URL</Label>
                <Input
                  id="staff-webhook-url"
                  type="url"
                  placeholder="https://discord.com/api/webhooks/... (Staff Channel)"
                  value={localSettings.staff_webhook_url}
                  onChange={(e) => handleSettingChange('staff_webhook_url', e.target.value)}
                  className="bg-gaming-dark border-gaming-border text-foreground"
                />
                <p className="text-xs text-muted-foreground">
                  For new application submissions - Use a <strong>private staff channel</strong>
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="public-webhook-url" className="text-foreground">Public Discord Webhook URL</Label>
                <Input
                  id="public-webhook-url"
                  type="url"
                  placeholder="https://discord.com/api/webhooks/... (Public Channel)"
                  value={localSettings.public_webhook_url}
                  onChange={(e) => handleSettingChange('public_webhook_url', e.target.value)}
                  className="bg-gaming-dark border-gaming-border text-foreground"
                />
                <p className="text-xs text-muted-foreground">
                  For approvals/denials - Can be a <strong>public channel</strong>
                </p>
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <p className="text-xs text-amber-400">
                  <strong>Setup Guide:</strong> Create webhooks in Discord → Server Settings → Integrations → Webhooks
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-4">
                <div className="p-4 bg-gaming-dark border border-gaming-border rounded-lg">
                  <Label className="text-foreground font-medium flex items-center space-x-2">
                    <Settings className="h-4 w-4 text-neon-blue" />
                    <span>Staff Notifications</span>
                  </Label>
                  <p className="text-sm text-muted-foreground mb-4">Internal notifications for staff members only</p>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-foreground">New Application Submissions</Label>
                      <p className="text-sm text-muted-foreground">Notify staff when new applications are submitted</p>
                      <p className="text-xs text-neon-blue">📨 Sent to: <strong>Staff Webhook</strong> (Private)</p>
                    </div>
                    <Switch
                      checked={localSettings.notify_submissions}
                      onCheckedChange={(checked) => handleSettingChange('notify_submissions', checked)}
                    />
                  </div>
                </div>

                <div className="p-4 bg-gaming-dark border border-gaming-border rounded-lg">
                  <Label className="text-foreground font-medium flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-neon-green" />
                    <span>Application Status Updates</span>
                  </Label>
                  <p className="text-sm text-muted-foreground mb-4">Notifications when applications are processed</p>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-foreground">Application Approvals</Label>
                        <p className="text-sm text-muted-foreground">Notify when applications are approved</p>
                        <p className="text-xs text-neon-green">📢 Sent to: <strong>Public Webhook</strong> (Community)</p>
                      </div>
                      <Switch
                        checked={localSettings.notify_approvals}
                        onCheckedChange={(checked) => handleSettingChange('notify_approvals', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-foreground">Application Denials</Label>
                        <p className="text-sm text-muted-foreground">Notify when applications are denied</p>
                        <p className="text-xs text-red-400">📢 Sent to: <strong>Public Webhook</strong> (Community)</p>
                      </div>
                      <Switch
                        checked={localSettings.notify_denials}
                        onCheckedChange={(checked) => handleSettingChange('notify_denials', checked)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gaming-border">
              <Button onClick={handleSave} className="w-full">
                <Settings className="h-4 w-4 mr-2" />
                Save Discord Settings
              </Button>
            </div>
          </>
        )}
      </div>
    </Card>
  );
};

export default ApplicationManager;