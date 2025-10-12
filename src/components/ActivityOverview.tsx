import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Clock, Calendar, Activity } from "lucide-react";
import { Application } from "./applications/types";
import { calculateApplicationStats } from "./applications/utils";

interface ActivityOverviewProps {
  applications: Application[];
}

export const ActivityOverview = ({ applications }: ActivityOverviewProps) => {
  const stats = calculateApplicationStats(applications);
  const avgProcessingTime = "2-3 days"; // This could be calculated from data

  return (
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
  );
};