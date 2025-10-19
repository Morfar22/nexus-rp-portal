import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Search, UserPlus, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface UserWithRole {
  id: string;
  username: string;
  email: string;
  roleAssignments: {
    id: string;
    role: {
      name: string;
      display_name: string;
      color: string;
    };
  }[];
}

interface StaffRole {
  id: string;
  name: string;
  display_name: string;
  color: string;
}

export const ApplicationPermissionsManager = () => {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [applicationRoles, setApplicationRoles] = useState<StaffRole[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchApplicationRoles();
    fetchUsersWithRoles();
  }, []);

  const fetchApplicationRoles = async () => {
    const { data, error } = await supabase
      .from('staff_roles')
      .select('id, name, display_name, color')
      .in('name', ['application_viewer', 'application_reviewer', 'application_manager'])
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching application roles:', error);
      return;
    }

    setApplicationRoles(data || []);
  };

  const fetchUsersWithRoles = async () => {
    const { data, error } = await supabase
      .from('custom_users')
      .select(`
        id,
        username,
        email,
        roleAssignments:user_role_assignments(
          id,
          role:staff_roles(name, display_name, color)
        )
      `)
      .eq('banned', false)
      .order('username');

    if (error) {
      console.error('Error fetching users:', error);
      return;
    }

    // Filter to show users with application roles
    const usersWithAppRoles = (data || []).filter(user => 
      user.roleAssignments?.some((ra: any) => 
        ['application_viewer', 'application_reviewer', 'application_manager'].includes(ra.role?.name)
      )
    );

    setUsers(usersWithAppRoles as UserWithRole[]);
  };

  const searchUsers = async () => {
    if (!searchQuery.trim()) {
      fetchUsersWithRoles();
      return;
    }

    const { data, error } = await supabase
      .from('custom_users')
      .select(`
        id,
        username,
        email,
        roleAssignments:user_role_assignments(
          id,
          role:staff_roles(name, display_name, color)
        )
      `)
      .eq('banned', false)
      .or(`username.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
      .limit(10);

    if (error) {
      console.error('Error searching users:', error);
      return;
    }

    setUsers(data as UserWithRole[] || []);
  };

  const assignRole = async (userId: string) => {
    if (!selectedRole) {
      toast({
        title: "Error",
        description: "Please select a role to assign",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_role_assignments')
        .insert({
          user_id: userId,
          role_id: selectedRole,
          is_active: true,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Role assigned successfully",
      });

      fetchUsersWithRoles();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to assign role",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const removeRole = async (assignmentId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_role_assignments')
        .delete()
        .eq('id', assignmentId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Role removed successfully",
      });

      fetchUsersWithRoles();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to remove role",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-gaming-card border-gaming-border">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Shield className="h-5 w-5 text-neon-purple" />
          <span>Application Permissions</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search and Assign */}
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users by username or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchUsers()}
                className="pl-10 bg-gaming-dark border-gaming-border"
              />
            </div>
            <Button onClick={searchUsers} variant="outline" className="border-gaming-border">
              Search
            </Button>
          </div>

          <div className="flex gap-2">
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="flex-1 bg-gaming-dark border-gaming-border">
                <SelectValue placeholder="Select role to assign..." />
              </SelectTrigger>
              <SelectContent>
                {applicationRoles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.display_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Users List */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">
            Users with Application Access ({users.length})
          </h3>
          
          {users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <UserPlus className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No users with application access</p>
              <p className="text-sm">Search for users to assign roles</p>
            </div>
          ) : (
            <div className="space-y-2">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-gaming-dark border border-gaming-border"
                >
                  <div className="space-y-1">
                    <div className="font-medium text-foreground">
                      {user.username || user.email}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {user.email}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => assignRole(user.id)}
                      disabled={loading || !selectedRole}
                      size="sm"
                      variant="outline"
                      className="border-gaming-border"
                    >
                      <UserPlus className="h-4 w-4 mr-1" />
                      Add Role
                    </Button>
                    
                    <div className="flex flex-wrap gap-2">
                      {user.roleAssignments
                        ?.filter((ra) => 
                          ['application_viewer', 'application_reviewer', 'application_manager'].includes(ra.role?.name)
                        )
                        .map((assignment) => (
                          <Badge
                            key={assignment.id}
                            style={{ backgroundColor: assignment.role.color }}
                            className="flex items-center gap-1"
                          >
                            {assignment.role.display_name}
                            <button
                              onClick={() => removeRole(assignment.id)}
                              disabled={loading}
                              className="ml-1 hover:bg-black/20 rounded-full p-0.5"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};