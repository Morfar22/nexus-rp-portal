import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Users, AlertCircle, CheckCircle } from "lucide-react";
import { Application } from "./applications/types";
import { calculateApplicationStats } from "./applications/utils";

interface QuickInsightsOverviewProps {
  applications: Application[];
}

export const QuickInsightsOverview = ({ applications }: QuickInsightsOverviewProps) => {
  const stats = calculateApplicationStats(applications);

  return (
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
  );
};