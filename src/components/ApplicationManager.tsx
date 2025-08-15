import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Eye, CheckCircle, XCircle, Clock, Trash2 } from "lucide-react";
import ApplicationTypesManager from "./ApplicationTypesManager";

const ApplicationManager = () => {
  const [applications, setApplications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          profiles:user_id (username, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApplications(data || []);
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
      const { error } = await supabase
        .from('applications')
        .update({
          status,
          review_notes: notes,
          reviewed_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', applicationId);

      if (error) throw error;

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
      case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/30';
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
      <TabsList className="grid w-full grid-cols-2 bg-gaming-card border-gaming-border">
        <TabsTrigger value="applications">Applications</TabsTrigger>
        <TabsTrigger value="types">Application Types</TabsTrigger>
      </TabsList>

      <TabsContent value="applications">
        <ApplicationsList 
          applications={applications}
          updateApplicationStatus={updateApplicationStatus}
          deleteApplication={deleteApplication}
          getStatusColor={getStatusColor}
        />
      </TabsContent>

      <TabsContent value="types">
        <ApplicationTypesManager />
      </TabsContent>
    </Tabs>
  );
};

const ApplicationsList = ({ applications, updateApplicationStatus, deleteApplication, getStatusColor }: any) => {
  const [selectedApp, setSelectedApp] = useState<any>(null);
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
                    <h3 className="font-medium text-foreground">{app.profiles?.username}</h3>
                    <Badge className={getStatusColor(app.status)}>
                      {app.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Discord: {app.discord_name} • Steam: {app.steam_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Applied: {new Date(app.created_at).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center space-x-2">
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
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-gaming-card border-gaming-border">
                      <DialogHeader>
                        <DialogTitle className="text-foreground">Application Details</DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                          Review application from {selectedApp?.profiles?.username}
                        </DialogDescription>
                      </DialogHeader>
                      
                      {selectedApp && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-foreground">Username</Label>
                              <p className="text-sm text-muted-foreground">{selectedApp.profiles?.username}</p>
                            </div>
                            <div>
                              <Label className="text-foreground">Email</Label>
                              <p className="text-sm text-muted-foreground">{selectedApp.profiles?.email}</p>
                            </div>
                            <div>
                              <Label className="text-foreground">Discord Name</Label>
                              <p className="text-sm text-muted-foreground">{selectedApp.discord_name}</p>
                            </div>
                            <div>
                              <Label className="text-foreground">Steam Name</Label>
                              <p className="text-sm text-muted-foreground">{selectedApp.steam_name}</p>
                            </div>
                            <div>
                              <Label className="text-foreground">FiveM Name</Label>
                              <p className="text-sm text-muted-foreground">{selectedApp.fivem_name}</p>
                            </div>
                            <div>
                              <Label className="text-foreground">Age</Label>
                              <p className="text-sm text-muted-foreground">{selectedApp.age}</p>
                            </div>
                          </div>
                          
                          <div>
                            <Label className="text-foreground">Character Backstory</Label>
                            <p className="text-sm text-muted-foreground mt-1 p-3 bg-gaming-dark rounded border">
                              {selectedApp.character_backstory}
                            </p>
                          </div>
                          
                          <div>
                            <Label className="text-foreground">RP Experience</Label>
                            <p className="text-sm text-muted-foreground mt-1 p-3 bg-gaming-dark rounded border">
                              {selectedApp.rp_experience}
                            </p>
                          </div>

                          {selectedApp.review_notes && (
                            <div>
                              <Label className="text-foreground">Review Notes</Label>
                              <p className="text-sm text-muted-foreground mt-1 p-3 bg-gaming-dark rounded border">
                                {selectedApp.review_notes}
                              </p>
                            </div>
                          )}

                          {selectedApp.status === 'pending' && (
                            <div className="space-y-2">
                              <Label className="text-foreground">Review Notes</Label>
                              <Textarea
                                value={reviewNotes}
                                onChange={(e) => setReviewNotes(e.target.value)}
                                placeholder="Add review notes..."
                                className="bg-gaming-dark border-gaming-border text-foreground"
                              />
                            </div>
                          )}

                          <div className="flex justify-end space-x-2">
                            {selectedApp.status === 'pending' && (
                              <>
                                <Button
                                  onClick={() => {
                                    updateApplicationStatus(selectedApp.id, 'approved', reviewNotes);
                                    setReviewNotes("");
                                  }}
                                  className="bg-green-600 hover:bg-green-700"
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

export default ApplicationManager;