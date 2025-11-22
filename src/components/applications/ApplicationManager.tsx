import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { usePermissions } from "@/hooks/usePermissions";
import { supabase } from "@/integrations/supabase/client";
import { ApplicationsOverview } from "./ApplicationsOverview";
import { ApplicationsList } from "./ApplicationsList";
import { ApplicationSettingsPanel } from "./ApplicationSettingsPanel";
import ApplicationTypesManager from "../ApplicationTypesManager";
import ClosedApplications from "../ClosedApplications";
import { Application } from "./types";
import { useCustomAuth } from "@/hooks/useCustomAuth";
import { PermissionGate } from "@/components/PermissionGate";

const ApplicationManager = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { roleAssignments, permissions } = usePermissions();
  const { user } = useCustomAuth();

  useEffect(() => {
    fetchApplications();
  }, []);

  // Filter applications based on user permissions
  useEffect(() => {
    if (!applications || applications.length === 0) {
      setFilteredApplications([]);
      return;
    }

    // If user has applications.view permission, show all
    if (permissions.includes('applications.view')) {
      setFilteredApplications(applications);
      return;
    }

    // If user is admin or has admin role assignments, show all
    if (user?.role === 'admin' || roleAssignments.some(ra => ra.staff_roles?.name === 'admin')) {
      setFilteredApplications(applications);
      return;
    }

    // If user is staff or has staff role assignments, show all
    if (user?.role === 'staff' || roleAssignments.some(ra => ra.staff_roles?.name === 'staff')) {
      setFilteredApplications(applications);
      return;
    }

    // If user has role assignments with specific permissions
    if (roleAssignments.length > 0) {
      const userRoleNames = roleAssignments.map(ra => ra.staff_roles?.name).filter(Boolean);
      
      const filtered = applications.filter(app => {
        if (!app.required_permissions || app.required_permissions.length === 0) {
          return true; // Show apps with no required permissions
        }
        return app.required_permissions.some(perm => userRoleNames.includes(perm));
      });
      setFilteredApplications(filtered);
      return;
    }

    setFilteredApplications([]);
  }, [applications, user, roleAssignments, permissions]);

  const fetchApplications = async () => {
    try {
      setIsLoading(true);
      
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
        .eq('closed', false)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch user profiles
      const userIds = Array.from(new Set(data?.map((a: any) => a.user_id).filter(Boolean))) || [];
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

      const merged = (data || []).map((a: any) => {
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
        
        return {
          ...a,
          profiles: profileMap[a.user_id] || null
        };
      });

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

  const updateApplicationStatus = async (applicationId: string, status: string, notes?: string) => {
    try {
      console.log('ApplicationManager: Attempting to update application with user role:', user?.role);
      console.log('ApplicationManager: User object:', user);
      
      // Use the custom auth user ID instead of supabase auth
      const reviewerId = user?.id;
      console.log('ApplicationManager: Reviewer ID from custom auth:', reviewerId);

      if (!reviewerId) {
        console.error('ApplicationManager: No user ID available for review - user object:', user);
        toast({
          title: "Error",
          description: "Unable to identify reviewer - please refresh and try again",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('applications')
        .update({
          status,
          notes,
          reviewed_by: reviewerId,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', applicationId);

      if (error) {
        console.error('ApplicationManager: Database error:', error);
        throw error;
      }

      // Update local state
      setApplications(prev => prev.map(app => 
        app.id === applicationId 
          ? { ...app, status: status as any, notes, reviewed_by: reviewerId, reviewed_at: new Date().toISOString() }
          : app
      ));

      // Send email notification for approved/rejected applications
      if (status === 'approved' || status === 'rejected') {
        try {
          console.log('ApplicationManager: Attempting to send email notification for status:', status);
          const application = applications.find(app => app.id === applicationId);
          console.log('ApplicationManager: Found application:', application);
          
          if (application) {
            const templateType = status === 'approved' ? 'application_approved' : 'application_denied';
            
            // Extract data from form_data - try multiple field name variations
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

            const steamName = findFieldValue(application.form_data, [
              'steam_name', 'steamName', 'steam', 'Steam Name', 'steamname'
            ]) || application.profiles?.username || '';

            const fivemName = findFieldValue(application.form_data, [
              'fivem_name', 'fivemName', 'fivem', 'FiveM Name', 'fivemname', 'fivem_username'
            ]) || steamName || '';

            const discordName = findFieldValue(application.form_data, [
              'discord_name', 'discordName', 'discord_tag', 'discordTag', 'discord', 'Discord Tag', 'Discord Name'
            ]) || application.discord_name || '';
            
            const applicantEmail = application.profiles?.email || 
              findFieldValue(application.form_data, ['email', 'Email', 'e-mail', 'e_mail']) || '';

            const applicantName = application.profiles?.username || 
              application.profiles?.full_name || 
              steamName || 
              'Applicant';
            
            const emailPayload = {
              applicationId,
              templateType,
              recipientEmail: applicantEmail,
              applicantName,
              applicationType: application.application_types?.name || 'Application',
              reviewNotes: notes,
              discordName,
              steamName,
              fivemName
            };
            
            console.log('ApplicationManager: Sending email with payload:', emailPayload);
            
            const emailResult = await supabase.functions.invoke('send-application-email', {
              body: emailPayload
            });
            
            console.log('ApplicationManager: Email function result:', emailResult);
            
            if (emailResult.error) {
              throw new Error(`Email function error: ${emailResult.error.message}`);
            }
            
            // Send Discord notification
            try {
              // Get Discord ID if user has connected Discord
              let discordId = null;
              if (application.user_id) {
                const { data: userData } = await supabase
                  .from('custom_users')
                  .select('discord_id')
                  .eq('id', application.user_id)
                  .single();
                discordId = userData?.discord_id || null;
              }

              const discordEventType = status === 'approved' ? 'application_approved' : 'application_denied';
              const discordResult = await supabase.functions.invoke('discord-logger', {
                body: {
                  type: discordEventType,
                  data: {
                    steam_name: steamName || 'Not provided',
                    fivem_name: fivemName || 'Not provided',
                    discord_name: discordName || 'Not provided',
                    discord_tag: discordName || 'Not provided',
                    discord_id: discordId,
                    applicant_name: applicantName,
                    user_email: applicantEmail,
                    applicantEmail: applicantEmail,
                    application_type: emailPayload.applicationType,
                    review_notes: notes || 'No notes provided',
                    reason: notes || 'No reason provided',
                    form_data: application.form_data
                  }
                }
              });
              
              if (discordResult.error) {
                console.error('Discord notification error:', discordResult.error);
              } else {
                console.log('ApplicationManager: Discord notification sent successfully');
              }
            } catch (discordError) {
              console.error('Failed to send Discord notification:', discordError);
            }
            
            console.log('ApplicationManager: Email sent successfully');
          } else {
            console.error('ApplicationManager: Application not found in local state:', applicationId);
          }
        } catch (emailError) {
          console.error('Failed to send notification email:', emailError);
          // Don't block the status update if email fails
          toast({
            title: "Warning",
            description: "Application updated but email notification failed to send",
            variant: "destructive",
          });
        }
      }

      toast({
        title: "Application Updated",
        description: `Application has been ${status}${status === 'approved' || status === 'rejected' ? ' and notification email sent' : ''}`,
      });

      console.log('ApplicationManager: Successfully updated application');

    } catch (error) {
      console.error('Error updating application status:', error);
      toast({
        title: "Error",
        description: "Failed to update application status",
        variant: "destructive",
      });
    }
  };

  const deleteApplication = async (applicationId: string) => {
    try {
      console.log('ApplicationManager: Attempting to delete application with user role:', user?.role);
      
      const { error } = await supabase
        .from('applications')
        .delete()
        .eq('id', applicationId);

      if (error) {
        console.error('ApplicationManager: Delete error:', error);
        throw error;
      }

      setApplications(prev => prev.filter(app => app.id !== applicationId));
      
      toast({
        title: "Application Deleted",
        description: "The application has been permanently deleted",
      });

      console.log('ApplicationManager: Successfully deleted application');
    } catch (error) {
      console.error('Error deleting application:', error);
      toast({
        title: "Error",
        description: "Failed to delete application",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="applications" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-gaming-card">
          <TabsTrigger value="applications">Applications</TabsTrigger>
          <TabsTrigger value="types">Application Types</TabsTrigger>
          <TabsTrigger value="closed">Closed Applications</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="applications" className="space-y-6">
          <ApplicationsOverview applications={filteredApplications} />
          <ApplicationsList
            applications={filteredApplications}
            isLoading={isLoading}
            onStatusUpdate={updateApplicationStatus}
            onDelete={deleteApplication}
            onRefresh={fetchApplications}
          />
        </TabsContent>

            <TabsContent value="types">
              <PermissionGate permission="applications.types_manage">
                <ApplicationTypesManager />
              </PermissionGate>
            </TabsContent>

        <TabsContent value="closed">
          <ClosedApplications />
        </TabsContent>

        <TabsContent value="settings">
          <ApplicationSettingsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ApplicationManager;