import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Navbar from "@/components/Navbar";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, XCircle, Clock, Users, FileText, Settings, Eye, AlertCircle } from "lucide-react";

const StaffPanel = () => {
  const [applications, setApplications] = useState<any[]>([]);
  const [recentActions, setRecentActions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    console.log('StaffPanel useEffect - user:', user);
    fetchApplications();
    fetchRecentActions();
  }, [user]);

  const fetchApplications = async () => {
    console.log('Fetching applications...');
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('*')
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
        // Get user's auth data to access email
        const { data: { user: authUser } } = await supabase.auth.admin.getUserById(appData.user_id);
        
        if (authUser?.email) {
          await supabase.functions.invoke('send-application-email', {
            body: {
              type: action,
              userEmail: authUser.email,
              applicationData: {
                steam_name: appData.steam_name,
                discord_tag: appData.discord_tag,
                fivem_name: appData.fivem_name,
                status: action,
                review_notes: notes
              }
            }
          });
        }
      } catch (emailError) {
        console.error('Error sending email notification:', emailError);
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
          <TabsList className="grid w-full grid-cols-5 bg-gaming-card border-gaming-border">
            <TabsTrigger value="applications" className="data-[state=active]:bg-neon-purple/20">
              Pending ({pendingApplications.length})
            </TabsTrigger>
            <TabsTrigger value="all-applications" className="data-[state=active]:bg-neon-purple/20">
              All Apps ({applications.length})
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
            <Card className="p-6 bg-gaming-card border-gaming-border shadow-gaming">
              <h2 className="text-xl font-semibold text-foreground flex items-center space-x-2 mb-6">
                <Settings className="h-5 w-5 text-neon-purple" />
                <span>Server Settings</span>
              </h2>
              <p className="text-muted-foreground">Server configuration options coming soon...</p>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default StaffPanel;