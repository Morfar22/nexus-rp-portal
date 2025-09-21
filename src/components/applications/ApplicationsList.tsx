import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { 
  FileText, 
  Eye, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Clock, 
  Trash2, 
  User, 
  RefreshCw 
} from "lucide-react";
import { Application } from "./types";
import { getStatusBadgeClass, formatDate } from "./utils";

interface ApplicationsListProps {
  applications: Application[];
  isLoading: boolean;
  onStatusUpdate: (id: string, status: string, notes?: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onRefresh: () => void;
}

export const ApplicationsList = ({ 
  applications, 
  isLoading, 
  onStatusUpdate, 
  onDelete, 
  onRefresh 
}: ApplicationsListProps) => {
  const [reviewNotes, setReviewNotes] = useState("");
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);

  const handleReview = (app: Application) => {
    setSelectedApp(app);
    setReviewNotes(app.notes || "");
  };

  const handleStatusUpdate = async (status: string) => {
    if (!selectedApp) return;
    
    await onStatusUpdate(selectedApp.id, status, reviewNotes);
    setSelectedApp(null);
    setReviewNotes("");
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return Clock;
      case 'under_review': return AlertCircle;
      case 'approved': return CheckCircle;
      case 'rejected': return XCircle;
      default: return FileText;
    }
  };

  return (
    <Card className="bg-gaming-card border-gaming-border">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-neon-blue" />
            <span>Active Applications</span>
            <Badge variant="secondary">{applications.length}</Badge>
          </div>
          <Button 
            onClick={onRefresh} 
            variant="outline" 
            size="sm"
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-20 bg-gaming-dark rounded-lg"></div>
              </div>
            ))}
          </div>
        ) : applications.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Applications Found</h3>
            <p className="text-muted-foreground">No applications have been submitted yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => {
              const StatusIcon = getStatusIcon(app.status);
              
              return (
                <Card key={app.id} className="bg-gaming-dark border-gaming-border hover:border-gaming-border/60 transition-all duration-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-semibold text-foreground">
                              {app.profiles?.username || 'Unknown User'}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              {app.application_types?.name || 'Unknown Type'}
                            </span>
                          </div>
                          <Badge className={getStatusBadgeClass(app.status)}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {app.status.charAt(0).toUpperCase() + app.status.slice(1).replace('_', ' ')}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground mb-3">
                          <div>
                            <span className="font-medium">Discord:</span> {app.discord_name || 'N/A'}
                          </div>
                          <div>
                            <span className="font-medium">Email:</span> {app.profiles?.email || 'N/A'}
                          </div>
                          <div>
                            <span className="font-medium">Submitted:</span> {formatDate(app.created_at)}
                          </div>
                          <div>
                            <span className="font-medium">Last Updated:</span> {formatDate(app.updated_at)}
                          </div>
                        </div>
                        
                        {app.notes && (
                          <div className="p-2 bg-gaming-card rounded text-sm border-l-4 border-neon-blue">
                            <span className="font-medium text-foreground">Staff Notes:</span> 
                            <span className="text-muted-foreground ml-2">{app.notes}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleReview(app)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Review
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-gaming-card border-gaming-border">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-foreground">Delete Application</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this application? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => onDelete(app.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Review Dialog */}
        <Dialog open={selectedApp !== null} onOpenChange={(open) => !open && setSelectedApp(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gaming-card border-gaming-border">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-neon-blue" />
                <span>Review Application</span>
              </DialogTitle>
              <DialogDescription>
                Review and manage this application submission
              </DialogDescription>
            </DialogHeader>
            
            {selectedApp && (
              <div className="space-y-6">
                {/* Applicant Information */}
                <Card className="bg-gaming-dark border-gaming-border">
                  <CardHeader>
                    <CardTitle className="text-sm">Applicant Information</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label className="text-foreground">Username</Label>
                      <p className="text-muted-foreground">{selectedApp.profiles?.username || 'Unknown'}</p>
                    </div>
                    <div>
                      <Label className="text-foreground">Email</Label>
                      <p className="text-muted-foreground">{selectedApp.profiles?.email || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-foreground">Discord Name</Label>
                      <p className="text-muted-foreground">{selectedApp.discord_name || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-foreground">Application Type</Label>
                      <p className="text-muted-foreground">{selectedApp.application_types?.name || 'Unknown'}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Form Data */}
                {selectedApp.form_data && Object.keys(selectedApp.form_data).length > 0 && (
                  <Card className="bg-gaming-dark border-gaming-border">
                    <CardHeader>
                      <CardTitle className="text-sm">Application Data</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {Object.entries(selectedApp.form_data).map(([key, value]) => (
                        <div key={key}>
                          <Label className="text-foreground capitalize">
                            {key.replace(/_/g, ' ')}
                          </Label>
                          <p className="text-muted-foreground text-sm mt-1">
                            {typeof value === 'string' ? value : JSON.stringify(value)}
                          </p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Review Actions */}
                <Card className="bg-gaming-dark border-gaming-border">
                  <CardHeader>
                    <CardTitle className="text-sm">Review Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-foreground">Review Notes</Label>
                      <Textarea
                        value={reviewNotes}
                        onChange={(e) => setReviewNotes(e.target.value)}
                        placeholder="Add your review notes here..."
                        className="bg-gaming-card border-gaming-border text-foreground mt-2"
                      />
                    </div>
                    
                    <div className="flex justify-end space-x-2">
                      <Button
                        onClick={() => handleStatusUpdate('rejected')}
                        variant="destructive"
                        className="bg-rose-600 hover:bg-rose-700"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                      <Button
                        onClick={() => handleStatusUpdate('under_review')}
                        variant="outline"
                        className="border-blue-500 text-blue-500 hover:bg-blue-500/10"
                      >
                        <AlertCircle className="h-4 w-4 mr-2" />
                        Under Review
                      </Button>
                      <Button
                        onClick={() => handleStatusUpdate('approved')}
                        className="bg-emerald-600 hover:emerald-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};