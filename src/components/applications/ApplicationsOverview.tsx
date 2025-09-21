import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FileText, Clock, CheckCircle, XCircle, AlertCircle, TrendingUp, Users, Calendar, Activity } from "lucide-react";
import { Application } from "./types";
import { calculateApplicationStats, getStatusColor } from "./utils";

interface ApplicationsOverviewProps {
  applications: Application[];
}

export const ApplicationsOverview = ({ applications }: ApplicationsOverviewProps) => {
  const stats = calculateApplicationStats(applications);
  
  // Average processing time (simplified calculation)
  const avgProcessingTime = "2-3 days"; // This could be calculated from data

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return Clock;
      case 'approved': return CheckCircle;
      case 'rejected': return XCircle;
      case 'under_review': return AlertCircle;
      default: return FileText;
    }
  };

  return (
    <Card className="bg-gaming-card border-gaming-border">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-neon-blue" />
            <span>Applications Overview</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Total Applications */}
          <div className="text-center p-4 bg-gaming-dark rounded-lg">
            <p className="text-3xl font-bold text-foreground">{stats.total}</p>
            <p className="text-sm text-muted-foreground">Total Applications</p>
            <Badge variant={stats.recentCount > 0 ? "default" : "secondary"} className="mt-2">
              {stats.recentCount} this week
            </Badge>
          </div>

          {/* Status Breakdown */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-foreground">Status Breakdown</h4>
            
            <div className="space-y-2">
              {[
                 { status: 'pending', count: stats.pending, label: 'Pending Review' },
                 { status: 'under_review', count: stats.underReview, label: 'Under Review' },
                 { status: 'approved', count: stats.approved, label: 'Approved' },
                 { status: 'rejected', count: stats.rejected, label: 'Rejected' }
              ].map(({ status, count, label }) => {
                const StatusIcon = getStatusIcon(status);
                return (
                  <div key={status} className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <StatusIcon className={`h-3 w-3 ${getStatusColor(status as any)}`} />
                      <span className="text-muted-foreground">{label}</span>
                    </div>
                    <span className={`font-medium ${getStatusColor(status as any)}`}>{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Approval Rate */}
          {(stats.approved + stats.rejected) > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Approval Rate</span>
                <span className="font-medium text-foreground">{stats.approvalRate}%</span>
              </div>
              <Progress value={stats.approvalRate} className="h-2" />
            </div>
          )}
        </CardContent>
    </Card>
  );
};