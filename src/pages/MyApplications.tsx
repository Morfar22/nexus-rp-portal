import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import Navbar from "@/components/Navbar";
import { useCustomAuth } from "@/hooks/useCustomAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  FileText, Clock, CheckCircle, XCircle, AlertCircle, 
  TrendingUp, Calendar, RefreshCw, Eye, Lock, Unlock
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Application, ApplicationStatus } from "@/components/applications/types";
import { ApplicationsOverview } from "@/components/applications/ApplicationsOverview";
import { getStatusColor, formatDate, formatRelativeTime } from "@/components/applications/utils";

const MyApplications = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "open" | "closed">("all");
  const { user } = useCustomAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchApplications();
    }
  }, [user]);

  const fetchApplications = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          application_types (
            id,
            name,
            description,
            form_fields,
            is_active,
            created_at,
            updated_at
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApplications(data as unknown as Application[]);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast({
        title: "Error",
        description: "Failed to load your applications",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: ApplicationStatus) => {
    switch (status) {
      case 'pending': return Clock;
      case 'approved': return CheckCircle;
      case 'rejected': return XCircle;
      case 'under_review': return AlertCircle;
      default: return FileText;
    }
  };

  const getFilteredApplications = () => {
    switch (activeTab) {
      case "open":
        return applications.filter(app => !app.closed);
      case "closed":
        return applications.filter(app => app.closed);
      default:
        return applications;
    }
  };

  const filteredApplications = getFilteredApplications();
  const openApplications = applications.filter(app => !app.closed);
  const closedApplications = applications.filter(app => app.closed);

  if (!user) {
    return (
      <div className="min-h-screen bg-gaming-dark flex flex-col">
        <Navbar />
        <div className="flex-1 container mx-auto px-4 py-8 flex items-center justify-center">
          <Card className="max-w-md w-full bg-gaming-card border-gaming-border">
            <CardHeader className="text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-neon-blue" />
              <CardTitle className="text-foreground">Login Required</CardTitle>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  You must be logged in to view your applications.
                </AlertDescription>
              </Alert>
              <Button 
                onClick={() => navigate('/auth')} 
                className="w-full mt-4"
                variant="neon"
              >
                Go to Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gaming-dark">
      <Navbar />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
                My Applications
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base lg:text-lg">
                Track and manage your application submissions
              </p>
            </div>
            <Button
              onClick={fetchApplications}
              variant="outline"
              size="sm"
              className="hover:border-neon-blue/50 w-full sm:w-auto"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Statistics Overview */}
          <div className="lg:col-span-1">
            <ApplicationsOverview applications={applications} />
            
            {/* Quick Stats */}
            <Card className="mt-4 sm:mt-6 bg-gaming-card border-gaming-border">
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <Unlock className="h-4 w-4 text-neon-blue" />
                    <span className="text-muted-foreground">Open Applications</span>
                  </div>
                  <span className="font-semibold text-neon-blue">{openApplications.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Closed Applications</span>
                  </div>
                  <span className="font-semibold text-foreground">{closedApplications.length}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Applications List */}
          <div className="lg:col-span-2">
            <Card className="bg-gaming-card border-gaming-border">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                  <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
                    <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-neon-blue" />
                    <span>Your Applications</span>
                  </CardTitle>
                  <Button
                    onClick={() => navigate('/application-form')}
                    variant="neon"
                    size="sm"
                    className="w-full sm:w-auto"
                  >
                    New Application
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
                  <TabsList className="grid w-full grid-cols-3 mb-4 sm:mb-6">
                    <TabsTrigger value="all">
                      All ({applications.length})
                    </TabsTrigger>
                    <TabsTrigger value="open">
                      Open ({openApplications.length})
                    </TabsTrigger>
                    <TabsTrigger value="closed">
                      Closed ({closedApplications.length})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value={activeTab} className="space-y-3 sm:space-y-4">
                    {isLoading ? (
                      <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="h-32 bg-gaming-dark animate-pulse rounded-lg" />
                        ))}
                      </div>
                    ) : filteredApplications.length === 0 ? (
                      <Alert>
                        <FileText className="h-4 w-4" />
                        <AlertDescription className="text-sm">
                          {activeTab === "all" 
                            ? "You haven't submitted any applications yet."
                            : activeTab === "open"
                            ? "You don't have any open applications."
                            : "You don't have any closed applications."}
                        </AlertDescription>
                      </Alert>
                    ) : (
                      filteredApplications.map((app) => {
                        const StatusIcon = getStatusIcon(app.status);
                        const statusColor = getStatusColor(app.status);
                        
                        return (
                          <Card 
                            key={app.id} 
                            className="bg-gaming-dark border-gaming-border hover:border-gaming-border/60 transition-all"
                          >
                            <CardContent className="p-4 sm:p-6">
                              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
                                <div className="flex-1">
                                  <div className="flex flex-wrap items-center gap-2 mb-2">
                                    <h3 className="font-semibold text-foreground text-base sm:text-lg">
                                      {app.application_types?.name || 'Application'}
                                    </h3>
                                    {app.closed && (
                                      <Badge variant="secondary" className="text-xs">
                                        <Lock className="h-3 w-3 mr-1" />
                                        Closed
                                      </Badge>
                                    )}
                                  </div>
                                  {app.application_types?.description && (
                                    <p className="text-xs sm:text-sm text-muted-foreground mb-3">
                                      {app.application_types.description}
                                    </p>
                                  )}
                                </div>
                                <Badge className={`${statusColor} whitespace-nowrap`}>
                                  <StatusIcon className="h-3 w-3 mr-1" />
                                  <span className="text-xs">{app.status.replace('_', ' ')}</span>
                                </Badge>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 text-sm">
                                <div className="flex items-center space-x-2 text-muted-foreground">
                                  <Calendar className="h-4 w-4 flex-shrink-0" />
                                  <div>
                                    <p className="text-xs text-muted-foreground">Submitted</p>
                                    <p className="font-medium text-foreground text-xs sm:text-sm">
                                      {formatRelativeTime(app.created_at)}
                                    </p>
                                  </div>
                                </div>
                                
                                {app.reviewed_at && (
                                  <div className="flex items-center space-x-2 text-muted-foreground">
                                    <Eye className="h-4 w-4 flex-shrink-0" />
                                    <div>
                                      <p className="text-xs text-muted-foreground">Reviewed</p>
                                      <p className="font-medium text-foreground text-xs sm:text-sm">
                                        {formatRelativeTime(app.reviewed_at)}
                                      </p>
                                    </div>
                                  </div>
                                )}

                                {app.closed_at && (
                                  <div className="flex items-center space-x-2 text-muted-foreground">
                                    <Lock className="h-4 w-4 flex-shrink-0" />
                                    <div>
                                      <p className="text-xs text-muted-foreground">Closed</p>
                                      <p className="font-medium text-foreground text-xs sm:text-sm">
                                        {formatRelativeTime(app.closed_at)}
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {app.notes && (
                                <div className="mt-4 p-3 bg-gaming-darker rounded-lg border border-gaming-border">
                                  <p className="text-xs text-muted-foreground mb-1 font-medium">Staff Notes:</p>
                                  <p className="text-xs sm:text-sm text-foreground break-words">{app.notes}</p>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyApplications;
