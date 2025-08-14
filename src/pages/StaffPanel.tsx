import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navbar from "@/components/Navbar";
import { CheckCircle, XCircle, Clock, Users, FileText, Settings } from "lucide-react";

const StaffPanel = () => {
  // Mock data - in real implementation, this would come from your backend
  const pendingApplications = [
    {
      id: 1,
      playerName: "John_Doe",
      discordTag: "JohnDoe#1234",
      submitDate: "2024-01-15",
      status: "pending"
    },
    {
      id: 2,
      playerName: "Jane_Smith",
      discordTag: "JaneSmith#5678",
      submitDate: "2024-01-14",
      status: "pending"
    }
  ];

  const recentActions = [
    {
      id: 1,
      action: "Application Approved",
      player: "Mike_Johnson",
      staff: "Admin_Alex",
      timestamp: "2 hours ago"
    },
    {
      id: 2,
      action: "Player Warned",
      player: "Bad_Player",
      staff: "Mod_Sarah",
      timestamp: "4 hours ago"
    }
  ];

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

        <Tabs defaultValue="applications" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-gaming-card border-gaming-border">
            <TabsTrigger value="applications" className="data-[state=active]:bg-neon-purple/20">
              Applications
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
                {pendingApplications.map((app) => (
                  <Card key={app.id} className="p-4 bg-gaming-dark border-gaming-border">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h3 className="font-semibold text-foreground">{app.playerName}</h3>
                        <p className="text-sm text-muted-foreground">{app.discordTag}</p>
                        <p className="text-xs text-muted-foreground">Submitted: {app.submitDate}</p>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button variant="gaming" size="sm">
                          <FileText className="h-4 w-4 mr-1" />
                          Review
                        </Button>
                        <Button variant="neon" size="sm">
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button variant="destructive" size="sm">
                          <XCircle className="h-4 w-4 mr-1" />
                          Deny
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
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
                {recentActions.map((action) => (
                  <div key={action.id} className="flex items-center justify-between p-3 bg-gaming-dark rounded-lg border border-gaming-border">
                    <div>
                      <p className="font-medium text-foreground">{action.action}</p>
                      <p className="text-sm text-muted-foreground">
                        Player: {action.player} | Staff: {action.staff}
                      </p>
                    </div>
                    <Badge variant="outline">{action.timestamp}</Badge>
                  </div>
                ))}
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