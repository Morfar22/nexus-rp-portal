import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Users, Shield, UserCheck, Crown, Activity, Clock } from "lucide-react";

interface StaffOverviewProps {
  staffMembers: any[];
}

export const StaffOverview = ({ staffMembers }: StaffOverviewProps) => {
  // Calculate statistics for staff overview
  const totalStaff = staffMembers.length;
  
  // Group staff by their roles - unified approach for new role management system
  const roleStats = staffMembers.reduce((acc, member) => {
    // Prioritize staff_roles data over legacy role data
    const roleData = member.staff_roles || {
      name: member.role,
      display_name: member.role === 'admin' ? 'Administrator' : member.role === 'moderator' ? 'Moderator' : member.role,
      hierarchy_level: member.role === 'admin' ? 80 : member.role === 'moderator' ? 60 : 0,
      color: member.role === 'admin' ? '#ef4444' : member.role === 'moderator' ? '#3b82f6' : '#6b7280'
    };
    
    const roleName = roleData.name;
    const displayName = roleData.display_name;
    const level = roleData.hierarchy_level;
    
    if (!acc[roleName]) {
      acc[roleName] = {
        count: 0,
        displayName,
        level,
        color: roleData.color
      };
    }
    acc[roleName].count++;
    return acc;
  }, {} as Record<string, { count: number; displayName: string; level: number; color: string }>);

  // Sort roles by hierarchy level (highest first)
  const sortedRoles = Object.entries(roleStats).sort(([,a], [,b]) => 
    (b as { level: number }).level - (a as { level: number }).level
  );
  
  // Calculate role-based stats for new system
  const highLevelRoles = sortedRoles.filter(([,data]) => 
    (data as { level: number }).level >= 70
  ).reduce((sum, [,data]) => sum + (data as { count: number }).count, 0);
  
  const midLevelRoles = sortedRoles.filter(([,data]) => 
    (data as { level: number }).level >= 50 && (data as { level: number }).level < 70
  ).reduce((sum, [,data]) => sum + (data as { count: number }).count, 0);

  // Calculate active percentage (assumes all current staff are active)
  const activeStaff = totalStaff;
  const activePercentage = totalStaff > 0 ? Math.round((activeStaff / totalStaff) * 100) : 0;

  const getRoleColor = (roleInfo: { color: string }) => {
    return roleInfo.color || '#6b7280';
  };

  const getRoleIcon = (hierarchyLevel: number) => {
    // Dynamic icon selection based on hierarchy level
    if (hierarchyLevel >= 90) return Crown; // Super admin level
    if (hierarchyLevel >= 70) return Crown; // Admin level  
    if (hierarchyLevel >= 50) return Shield; // Moderator level
    if (hierarchyLevel >= 30) return UserCheck; // Helper level
    return Activity; // Trainee/other levels
  };

  return (
    <Card className="p-6 bg-gaming-card border-gaming-border">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-neon-green" />
            <h3 className="font-semibold text-foreground">Staff Team</h3>
          </div>
          <Badge variant={activeStaff === totalStaff ? "default" : "secondary"}>
            {activeStaff}/{totalStaff} Active
          </Badge>
        </div>

        {/* Main Count */}
        <div className="text-center">
          <p className="text-3xl font-bold text-foreground">{totalStaff}</p>
          <p className="text-sm text-muted-foreground">Active staff members</p>
        </div>

        {/* Role Breakdown */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-foreground">Role Distribution</h4>
          
          <div className="space-y-2">
            {sortedRoles.map(([roleName, roleData]) => {
              const roleInfo = roleData as { count: number; displayName: string; level: number; color: string };
              const RoleIcon = getRoleIcon(roleInfo.level);
              
              return (
                <div key={roleName} className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <RoleIcon 
                      className="h-3 w-3" 
                      style={{ color: roleInfo.color }} 
                    />
                    <span className="text-muted-foreground">{roleInfo.displayName}</span>
                  </div>
                  <span 
                    className="font-medium" 
                    style={{ color: roleInfo.color }}
                  >
                    {roleInfo.count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Activity Status */}
        {totalStaff > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Activity Status</span>
              <span className="font-medium text-foreground">{activePercentage}% Active</span>
            </div>
            <Progress value={activePercentage} className="h-2" />
          </div>
        )}

        {/* Quick Stats - Dynamic top 2 roles */}
        <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gaming-border">
          {sortedRoles.slice(0, 2).map(([roleName, roleData]) => {
            const roleInfo = roleData as { count: number; displayName: string; level: number; color: string };
            const RoleIcon = getRoleIcon(roleInfo.level);
            
            return (
              <div key={roleName} className="text-center">
                <RoleIcon 
                  className="h-4 w-4 mx-auto mb-1 text-muted-foreground" 
                />
                <p className="text-xs text-muted-foreground">{roleInfo.displayName}</p>
                <p 
                  className="text-sm font-medium" 
                  style={{ color: roleInfo.color }}
                >
                  {roleInfo.count}
                </p>
              </div>
            );
          })}
        </div>

        {/* Authority Distribution - Updated for new role system */}
        <div className="pt-3 border-t border-gaming-border">
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">High Authority</span>
              <span className="text-red-400">{totalStaff > 0 ? Math.round((highLevelRoles / totalStaff) * 100) : 0}%</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Mid Authority</span>
              <span className="text-blue-400">{totalStaff > 0 ? Math.round((midLevelRoles / totalStaff) * 100) : 0}%</span>
            </div>
          </div>
        </div>

        {/* Staff Health Indicator */}
        <div className="pt-3 border-t border-gaming-border">
          <div className="flex items-center space-x-2">
            <Activity className={`h-4 w-4 ${totalStaff >= 3 ? 'text-green-400' : 'text-yellow-400'}`} />
            <span className={`text-xs ${totalStaff >= 3 ? 'text-green-400' : 'text-yellow-400'}`}>
              {totalStaff >= 3 ? 'Staff levels optimal' : 'Consider recruiting more staff'}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};