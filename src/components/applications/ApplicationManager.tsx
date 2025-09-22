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

const ApplicationManager = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { roleAssignments } = usePermissions();
  const { user } = useCustomAuth();

  useEffect(() => {
    fetchApplications();
  }, []);

  useEffect(() => {
    // If user has admin role in custom_users table, show all applications
    if (user?.role === 'admin' || user?.role === 'staff') {
      setFilteredApplications(applications);
      return;
    }

    // Filter applications based on user's staff roles from role assignments
    if (roleAssignments.length === 0) {
      // If no role assignments but user has staff role in custom_users, show all
      if (user?.role === 'moderator') {
        setFilteredApplications(applications);
        return;
      }
      setFilteredApplications([]);
      return;
    }

    const userRoleNames = roleAssignments.map(ra => ra.staff_roles?.name).filter(Boolean);
    
    const filtered = applications.filter(app => {
      if (!app.required_permissions || app.required_permissions.length === 0) {
        return true;
      }
      return app.required_permissions.some(requiredRole => userRoleNames.includes(requiredRole));
    });

    setFilteredApplications(filtered);
  }, [applications, roleAssignments, user?.role]);

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

      const merged = (data || []).map((a: any) => ({
        ...a,
        profiles: profileMap[a.user_id] || null
      }));

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
        throw new Error('No user ID available for review');
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

      toast({
        title: "Application Updated",
        description: `Application has been ${status}`,
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
          <ApplicationTypesManager />
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