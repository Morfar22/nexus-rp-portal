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
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {/* Main Overview Card */}
      <Card className="bg-gaming-card border-gaming-border md:col-span-2 lg:col-span-1">
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

      {/* Activity Stats Card */}
      <Card className="bg-gaming-card border-gaming-border">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-neon-green" />
            <span>Activity Stats</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-gaming-dark rounded-lg">
              <TrendingUp className="h-6 w-6 mx-auto mb-2 text-neon-green" />
              <p className="text-lg font-bold text-foreground">{stats.recentCount}</p>
              <p className="text-xs text-muted-foreground">New This Week</p>
            </div>
            
            <div className="text-center p-3 bg-gaming-dark rounded-lg">
              <Clock className="h-6 w-6 mx-auto mb-2 text-amber-400" />
              <p className="text-lg font-bold text-foreground">{stats.pending + stats.underReview}</p>
              <p className="text-xs text-muted-foreground">Needs Review</p>
            </div>
          </div>

          <div className="p-3 bg-gaming-dark rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Avg. Processing Time</span>
            </div>
            <p className="text-lg font-semibold text-foreground">{avgProcessingTime}</p>
          </div>
        </CardContent>
      </Card>

      {/* Quick Insights Card */}
      <Card className="bg-gaming-card border-gaming-border">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-neon-purple" />
            <span>Quick Insights</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Priority Actions */}
          {(stats.pending + stats.underReview) > 0 ? (
            <div className="p-3 bg-amber-400/10 border border-amber-400/20 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <AlertCircle className="h-4 w-4 text-amber-400" />
                <span className="text-sm font-medium text-amber-400">Action Required</span>
              </div>
              <p className="text-xs text-amber-300">
                {stats.pending + stats.underReview} application{(stats.pending + stats.underReview) !== 1 ? 's' : ''} awaiting review
              </p>
            </div>
          ) : (
            <div className="p-3 bg-emerald-400/10 border border-emerald-400/20 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="h-4 w-4 text-emerald-400" />
                <span className="text-sm font-medium text-emerald-400">All Caught Up</span>
              </div>
              <p className="text-xs text-emerald-300">No pending applications to review</p>
            </div>
          )}

          {/* Performance Indicator */}
          <div className="p-3 bg-gaming-dark rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Team Performance</span>
              <Badge variant={stats.approvalRate >= 70 ? "default" : "destructive"}>
                {stats.approvalRate >= 70 ? "Good" : "Needs Attention"}
              </Badge>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Approval Rate</span>
                <span className="text-foreground">{stats.approvalRate}%</span>
              </div>
              <Progress value={stats.approvalRate} className="h-1" />
            </div>
          </div>

          {/* Recent Activity Summary */}
          <div className="p-3 bg-gaming-dark rounded-lg">
            <h5 className="text-sm font-medium text-foreground mb-2">This Week</h5>
            <div className="text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">New Applications</span>
                <span className="text-foreground font-medium">{stats.recentCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Processed</span>
                <span className="text-foreground font-medium">
                  {applications.filter(app => {
                    const reviewDate = app.reviewed_at ? new Date(app.reviewed_at) : null;
                    const oneWeekAgo = new Date();
                    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                    return reviewDate && reviewDate >= oneWeekAgo;
                  }).length}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};