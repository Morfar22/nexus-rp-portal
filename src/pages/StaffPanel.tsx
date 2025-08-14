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
      { name: "steam_name", label: "Steam Name", type: "text", required: true, placeholder: "" },
      { name: "discord_tag", label: "Discord Tag", type: "text", required: true, placeholder: "username#1234" },
      { name: "discord_name", label: "Discord User ID", type: "text", required: true, placeholder: "123456789012345678" },
      { name: "fivem_name", label: "FiveM Name", type: "text", required: true, placeholder: "" },
      { name: "age", label: "Age", type: "number", required: true, placeholder: "" }
    ]
  });
  
  // Create Application State
  const [showCreateApplicationDialog, setShowCreateApplicationDialog] = useState(false);
  const [newApplicationData, setNewApplicationData] = useState({
    application_type_id: "",
    steam_name: "",
    discord_tag: "",
    discord_name: "",
    fivem_name: "",
    age: 18,
    rp_experience: "",
    character_backstory: "",
    user_id: ""
  });

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

  const fetchStaffMembers = async () => {
    try {
      // First get user_roles for staff
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('id, role, created_at, user_id')
        .in('role', ['admin', 'moderator'])
        .order('created_at', { ascending: false });

      if (rolesError) throw rolesError;

      // Then get profiles for those users
      if (userRoles && userRoles.length > 0) {
        const userIds = userRoles.map(role => role.user_id);
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, username, full_name')
          .in('id', userIds);

        if (profilesError) throw profilesError;

        // Combine the data
        const staffMembersData = userRoles.map(role => ({
          ...role,
          profiles: profiles?.find(profile => profile.id === role.user_id) || null
        }));

        setStaffMembers(staffMembersData);
      } else {
        setStaffMembers([]);
      }
    } catch (error: any) {
      console.error('Error fetching staff members:', error);
      setStaffMembers([]);
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

  const handleSaveApplicationType = async () => {
    if (!user) return;
    
    setIsSubmitting(true);
    try {
      if (editingApplicationType) {
        // Update existing application type
        const { error } = await supabase
          .from('application_types')
          .update({
            name: newApplicationType.name,
            description: newApplicationType.description,
            form_fields: newApplicationType.formFields,
            is_active: true
          })
          .eq('id', editingApplicationType.id);
        
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Application type updated successfully",
        });
      } else {
        // Create new application type
        const { error } = await supabase
          .from('application_types')
          .insert({
            name: newApplicationType.name,
            description: newApplicationType.description,
            form_fields: newApplicationType.formFields,
            is_active: true,
            created_by: user.id
          });
        
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Application type created successfully",
        });
      }
      
      // Reset form and close dialog
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
      setShowApplicationTypeDialog(false);
      setEditingApplicationType(null);
      
      // Refresh application types
      fetchApplicationTypes();
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save application type",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteApplicationType = async (typeId: string) => {
    if (!user) return;
    
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
      
      fetchApplicationTypes();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete application type",
        variant: "destructive"
      });
    }
  };

  const handleCreateApplication = async () => {
    if (!newApplicationData.application_type_id || !newApplicationData.user_id) {
      toast({
        title: "Error",
        description: "Please select an application type and enter a user ID",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('applications')
        .insert({
          application_type_id: newApplicationData.application_type_id,
          user_id: newApplicationData.user_id,
          steam_name: newApplicationData.steam_name,
          discord_tag: newApplicationData.discord_tag,
          discord_name: newApplicationData.discord_name,
          fivem_name: newApplicationData.fivem_name,
          age: newApplicationData.age,
          rp_experience: newApplicationData.rp_experience,
          character_backstory: newApplicationData.character_backstory,
          status: 'pending'
        });
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Application created successfully",
      });
      
      // Reset form and close dialog
      setNewApplicationData({
        application_type_id: "",
        steam_name: "",
        discord_tag: "",
        discord_name: "",
        fivem_name: "",
        age: 18,
        rp_experience: "",
        character_backstory: "",
        user_id: ""
      });
      setShowCreateApplicationDialog(false);
      
      // Refresh applications
      fetchApplications();
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create application",
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
      const { error } = await supabase
        .from('applications')
        .delete()
        .eq('id', applicationId);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Application deleted successfully",
      });
      
      setSelectedApplication(null);
      fetchApplications();
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete application",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApplicationAction = async (applicationId: string, action: 'approved' | 'denied' | 'under_review') => {
    if (!user) return;
    
    setIsSubmitting(true);
    try {
      // Update application status
      const { error: updateError } = await supabase
        .from('applications')
        .update({
          status: action,
          reviewed_by: user.id,
          review_notes: reviewNotes || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', applicationId);
      
      if (updateError) throw updateError;
      
      // Log the action
      const { error: logError } = await supabase
        .from('application_actions')
        .insert({
          application_id: applicationId,
          staff_id: user.id,
          action: action,
          notes: reviewNotes || null
        });
      
      if (logError) throw logError;
      
      toast({
        title: "Success",
        description: `Application ${action.replace('_', ' ')} successfully`,
      });
      
      // Reset review notes
      setReviewNotes("");
      setSelectedApplication(null);
      
      // Refresh applications
      fetchApplications();
      
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
            Manage applications, users, and server settings
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
              <TabsTrigger value="players" className="data-[state=active]:bg-gaming-dark">
                Player Management
              </TabsTrigger>
              <TabsTrigger value="rules" className="data-[state=active]:bg-gaming-dark">
                Rules Management
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="pending" className="space-y-4">
            <Card className="p-6 bg-gaming-card border-gaming-border shadow-gaming">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-foreground flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-yellow-500" />
                  <span>Pending Applications</span>
                </h2>
                <Badge variant="secondary">{pendingApplications.length} pending</Badge>
              </div>

              <div className="space-y-4">
                {pendingApplications.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
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
                          <p className="text-sm text-muted-foreground">FiveM: {app.fivem_name}</p>
                          <p className="text-xs text-muted-foreground">
                            Submitted: {new Date(app.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="gaming" 
                              size="sm"
                              onClick={() => setSelectedApplication(app)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Review Application
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="bg-gaming-card border-gaming-border max-w-2xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle className="text-foreground">
                                Application Review - {app.steam_name}
                              </DialogTitle>
                              <DialogDescription>
                                Review and take action on this application
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
                                <Label htmlFor="review-notes" className="text-foreground">
                                  Review Notes (Optional)
                                </Label>
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
                                    onClick={() => selectedApplication && handleApplicationAction(selectedApplication.id, 'approved')}
                                    disabled={isSubmitting}
                                    className="flex-1"
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    {isSubmitting ? "Processing..." : "Approve"}
                                  </Button>
                                  <Button 
                                    variant="outline"
                                    onClick={() => selectedApplication && handleApplicationAction(selectedApplication.id, 'under_review')}
                                    disabled={isSubmitting}
                                    className="flex-1 hover:border-neon-blue/50"
                                  >
                                    <Clock className="h-4 w-4 mr-1" />
                                    Under Review
                                  </Button>
                                  <Button 
                                    variant="destructive" 
                                    onClick={() => selectedApplication && handleApplicationAction(selectedApplication.id, 'denied')}
                                    disabled={isSubmitting}
                                    className="flex-1"
                                  >
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Deny
                                  </Button>
                                </div>
                                <div className="flex justify-center pt-2">
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button 
                                        variant="outline"
                                        size="sm"
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
                                          Are you sure you want to permanently delete this application? This action cannot be undone.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel className="bg-gaming-dark border-gaming-border hover:bg-gaming-darker">
                                          Cancel
                                        </AlertDialogCancel>
                                        <AlertDialogAction 
                                          onClick={() => selectedApplication && handleDeleteApplication(selectedApplication.id)}
                                          className="bg-red-600 hover:bg-red-700"
                                        >
                                          Delete
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </Card>
                  ))
                )}
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
                <div className="flex items-center space-x-3">
                  <Badge variant="secondary">{applications.length} total</Badge>
                  <Dialog open={showCreateApplicationDialog} onOpenChange={setShowCreateApplicationDialog}>
                    <DialogTrigger asChild>
                      <Button variant="neon" size="sm">
                        <Plus className="h-4 w-4 mr-1" />
                        Create Application
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-gaming-card border-gaming-border max-w-2xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="text-foreground">Create New Application</DialogTitle>
                        <DialogDescription>
                          Create a test application for staff purposes
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-foreground">Application Type</Label>
                            <select
                              value={newApplicationData.application_type_id}
                              onChange={(e) => setNewApplicationData(prev => ({ ...prev, application_type_id: e.target.value }))}
                              className="w-full mt-1 p-2 bg-gaming-dark border border-gaming-border rounded text-foreground"
                            >
                              <option value="">Select Type</option>
                              {applicationTypes.map((type) => (
                                <option key={type.id} value={type.id}>{type.name}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <Label className="text-foreground">User ID</Label>
                            <Input
                              value={newApplicationData.user_id}
                              onChange={(e) => setNewApplicationData(prev => ({ ...prev, user_id: e.target.value }))}
                              placeholder="Enter user UUID"
                              className="bg-gaming-dark border-gaming-border"
                            />
                          </div>
                        </div>
                        
                        <div className="flex space-x-2 pt-4">
                          <Button 
                            variant="neon" 
                            onClick={handleCreateApplication}
                            disabled={isSubmitting}
                            className="flex-1"
                          >
                            {isSubmitting ? "Creating..." : "Create Application"}
                          </Button>
                          <Button 
                            variant="outline"
                            onClick={() => setShowCreateApplicationDialog(false)}
                            disabled={isSubmitting}
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
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
                                  Review and manage this application
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
                                  <div>
                                    <Label className="text-foreground">Status</Label>
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
                                  <div>
                                    <Label className="text-foreground">Application Type</Label>
                                    <p className="text-muted-foreground">{app.application_types?.name || 'Unknown'}</p>
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
                                    <Label className="text-foreground">Previous Review Notes</Label>
                                    <div className="mt-2 p-3 bg-gaming-dark rounded border border-gaming-border">
                                      <p className="text-muted-foreground whitespace-pre-wrap">{app.review_notes}</p>
                                    </div>
                                  </div>
                                )}
                                
                                <div>
                                  <Label htmlFor="review-notes-all" className="text-foreground">
                                    Review Notes (Optional)
                                  </Label>
                                  <Textarea
                                    id="review-notes-all"
                                    value={reviewNotes}
                                    onChange={(e) => setReviewNotes(e.target.value)}
                                    placeholder="Add notes for the applicant..."
                                    className="mt-2 bg-gaming-dark border-gaming-border focus:border-neon-purple"
                                  />
                                </div>
                                
                                <div className="flex space-x-2 pt-4">
                                  <Button 
                                    variant="neon" 
                                    onClick={() => selectedApplication && handleApplicationAction(selectedApplication.id, 'approved')}
                                    disabled={isSubmitting}
                                    className="flex-1"
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    {isSubmitting ? "Processing..." : "Approve"}
                                  </Button>
                                  <Button 
                                    variant="outline"
                                    onClick={() => selectedApplication && handleApplicationAction(selectedApplication.id, 'under_review')}
                                    disabled={isSubmitting}
                                    className="flex-1 hover:border-neon-blue/50"
                                  >
                                    <Clock className="h-4 w-4 mr-1" />
                                    Under Review
                                  </Button>
                                  <Button 
                                    variant="destructive" 
                                    onClick={() => selectedApplication && handleApplicationAction(selectedApplication.id, 'denied')}
                                    disabled={isSubmitting}
                                    className="flex-1"
                                  >
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Deny
                                  </Button>
                                </div>
                                <div className="flex justify-center pt-2">
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button 
                                        variant="outline"
                                        size="sm"
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
                                          Are you sure you want to permanently delete this application? This action cannot be undone.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel className="bg-gaming-dark border-gaming-border hover:bg-gaming-darker">
                                          Cancel
                                        </AlertDialogCancel>
                                        <AlertDialogAction 
                                          onClick={() => selectedApplication && handleDeleteApplication(selectedApplication.id)}
                                          className="bg-red-600 hover:bg-red-700"
                                        >
                                          Delete
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
                        { name: "steam_name", label: "Steam Name", type: "text", required: true, placeholder: "" },
                        { name: "discord_tag", label: "Discord Tag", type: "text", required: true, placeholder: "username#1234" },
                        { name: "discord_name", label: "Discord User ID", type: "text", required: true, placeholder: "123456789012345678" },
                        { name: "fivem_name", label: "FiveM Name", type: "text", required: true, placeholder: "" },
                        { name: "age", label: "Age", type: "number", required: true, placeholder: "" }
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
                            <Badge variant={appType.is_active ? "default" : "secondary"}>
                              {appType.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </h3>
                          <p className="text-sm text-muted-foreground">{appType.description}</p>
                          <p className="text-xs text-muted-foreground">
                            Fields: {appType.form_fields?.length || 0} • Created: {new Date(appType.created_at).toLocaleDateString()}
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
                                formFields: (appType.form_fields || []).map((field: any) => ({
                                  ...field,
                                  placeholder: field.placeholder || ""
                                }))
                              });
                              setShowApplicationTypeDialog(true);
                            }}
                            className="border-gaming-border"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-red-500/50 text-red-500 hover:bg-red-500/10"
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-gaming-card border-gaming-border">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-foreground">Delete Application Type</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{appType.name}"? This action cannot be undone and may affect existing applications.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="bg-gaming-dark border-gaming-border hover:bg-gaming-darker">
                                  Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDeleteApplicationType(appType.id)}
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
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <Button variant="outline" size="sm" className="border-gaming-border hover:bg-gaming-darker">
                        <Eye className="h-4 w-4" />
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

          <TabsContent value="rules" className="space-y-4">
            <Card className="p-6 bg-gaming-card border-gaming-border shadow-gaming">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-foreground flex items-center space-x-2">
                  <Settings className="h-5 w-5 text-neon-orange" />
                  <span>Rules Management</span>
                </h2>
                <Button variant="gaming" className="bg-neon-orange hover:bg-neon-orange/80">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Rule
                </Button>
              </div>
              
              <div className="space-y-6">
                {Object.entries(
                  rules.reduce((acc: any, rule: any) => {
                    if (!acc[rule.category]) acc[rule.category] = [];
                    acc[rule.category].push(rule);
                    return acc;
                  }, {})
                ).map(([category, categoryRules]: [string, any]) => (
                  <div key={category}>
                    <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center space-x-2">
                      <span>{category}</span>
                      <Badge variant="secondary">{(categoryRules as any[]).length}</Badge>
                    </h3>
                    <div className="space-y-3">
                      {(categoryRules as any[]).map((rule: any) => (
                        <div key={rule.id} className="p-4 bg-gaming-dark rounded border border-gaming-border">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-foreground">{rule.title}</h4>
                              <p className="text-sm text-muted-foreground mt-1">{rule.description}</p>
                            </div>
                            <div className="flex items-center space-x-2 ml-4">
                              <Button variant="outline" size="sm" className="border-gaming-border">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="sm" className="border-red-500/50 text-red-500 hover:bg-red-500/10">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Application Type Management Dialog */}
      <Dialog open={showApplicationTypeDialog} onOpenChange={setShowApplicationTypeDialog}>
        <DialogContent className="bg-gaming-card border-gaming-border max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {editingApplicationType ? 'Edit Application Type' : 'Create Application Type'}
            </DialogTitle>
            <DialogDescription>
              {editingApplicationType ? 'Modify the application type details' : 'Create a new application type for your server'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="app-type-name" className="text-foreground">Name</Label>
                <Input
                  id="app-type-name"
                  value={newApplicationType.name}
                  onChange={(e) => setNewApplicationType({...newApplicationType, name: e.target.value})}
                  placeholder="e.g., Whitelist Application"
                  className="bg-gaming-dark border-gaming-border focus:border-neon-purple"
                />
              </div>
              <div>
                <Label htmlFor="app-type-description" className="text-foreground">Description</Label>
                <Textarea
                  id="app-type-description"
                  value={newApplicationType.description}
                  onChange={(e) => setNewApplicationType({...newApplicationType, description: e.target.value})}
                  placeholder="Brief description of this application type"
                  className="bg-gaming-dark border-gaming-border focus:border-neon-purple"
                  rows={3}
                />
              </div>
            </div>
            
            <div>
              <Label className="text-foreground">Form Fields</Label>
              <div className="mt-2 space-y-3">
                {newApplicationType.formFields.map((field, index) => (
                  <div key={index} className="p-4 bg-gaming-dark border border-gaming-border rounded">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <Label className="text-sm text-foreground">Field Name</Label>
                        <Input
                          value={field.name}
                          onChange={(e) => {
                            const updatedFields = [...newApplicationType.formFields];
                            updatedFields[index] = { ...field, name: e.target.value };
                            setNewApplicationType({ ...newApplicationType, formFields: updatedFields });
                          }}
                          placeholder="field_name"
                          className="bg-gaming-darker border-gaming-border text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-sm text-foreground">Label</Label>
                        <Input
                          value={field.label}
                          onChange={(e) => {
                            const updatedFields = [...newApplicationType.formFields];
                            updatedFields[index] = { ...field, label: e.target.value };
                            setNewApplicationType({ ...newApplicationType, formFields: updatedFields });
                          }}
                          placeholder="Display Label"
                          className="bg-gaming-darker border-gaming-border text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-sm text-foreground">Type</Label>
                        <select
                          value={field.type}
                          onChange={(e) => {
                            const updatedFields = [...newApplicationType.formFields];
                            updatedFields[index] = { ...field, type: e.target.value };
                            setNewApplicationType({ ...newApplicationType, formFields: updatedFields });
                          }}
                          className="w-full bg-gaming-darker border border-gaming-border rounded px-3 py-2 text-sm text-foreground"
                        >
                          <option value="text">Text</option>
                          <option value="textarea">Textarea</option>
                          <option value="number">Number</option>
                          <option value="email">Email</option>
                          <option value="tel">Phone</option>
                        </select>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-1">
                          <input
                            type="checkbox"
                            checked={field.required}
                            onChange={(e) => {
                              const updatedFields = [...newApplicationType.formFields];
                              updatedFields[index] = { ...field, required: e.target.checked };
                              setNewApplicationType({ ...newApplicationType, formFields: updatedFields });
                            }}
                            className="rounded border-gaming-border"
                          />
                          <Label className="text-xs text-foreground">Required</Label>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const updatedFields = newApplicationType.formFields.filter((_, i) => i !== index);
                            setNewApplicationType({ ...newApplicationType, formFields: updatedFields });
                          }}
                          className="border-red-500/50 text-red-500 hover:bg-red-500/10 h-8"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    {field.placeholder && (
                      <div className="mt-2">
                        <Label className="text-sm text-foreground">Placeholder</Label>
                        <Input
                          value={field.placeholder || ""}
                          onChange={(e) => {
                            const updatedFields = [...newApplicationType.formFields];
                            updatedFields[index] = { ...field, placeholder: e.target.value };
                            setNewApplicationType({ ...newApplicationType, formFields: updatedFields });
                          }}
                          placeholder="Placeholder text"
                          className="bg-gaming-darker border-gaming-border text-sm"
                        />
                      </div>
                    )}
                  </div>
                ))}
                
                <Button
                  variant="outline"
                  onClick={() => {
                    const newField = {
                      name: `custom_field_${newApplicationType.formFields.length + 1}`,
                      label: "New Field",
                      type: "text",
                      required: false,
                      placeholder: ""
                    };
                    setNewApplicationType({
                      ...newApplicationType,
                      formFields: [...newApplicationType.formFields, newField]
                    });
                  }}
                  className="w-full border-gaming-border hover:border-neon-cyan/50"
                >
                  <Plus className="h-4 w-4 mr-2" />
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
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StaffPanel;