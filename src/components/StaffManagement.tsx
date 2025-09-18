import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { UserPlus, Shield, Trash2, Search, Crown, Users, Settings } from "lucide-react";

interface StaffManagementProps {
  onRefresh?: () => void;
}

const StaffManagement = ({ onRefresh }: StaffManagementProps) => {
  const [staff, setStaff] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchEmail, setSearchEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [isAddingStaff, setIsAddingStaff] = useState(false);
  const { toast } = useToast();

  // Simple role definitions
  const staffRoles = [
    { id: 'admin', name: 'admin', display_name: 'Administrator', color: '#7c3aed', description: 'Full access to all features' },
    { id: 'staff', name: 'staff', display_name: 'Staff', color: '#2563eb', description: 'Access to most management features' },
    { id: 'moderator', name: 'moderator', display_name: 'Moderator', color: '#059669', description: 'Basic moderation permissions' }
  ];

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .rpc('get_user_data')
        .neq('role', 'user');

      if (error) throw error;

      const mappedStaff = data?.map((user: any) => ({
        id: user.id,
        user_id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        assigned_at: user.created_at,
        roleInfo: staffRoles.find(r => r.id === user.role)
      })) || [];

      setStaff(mappedStaff);
    } catch (error) {
      console.error('Error fetching staff:', error);
      toast({
        title: "Error",
        description: "Failed to fetch staff members",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const searchUsers = async () => {
    if (!searchEmail) return;
    
    try {
      const { data, error } = await supabase
        .rpc('search_users_data', { search_query: searchEmail })
        .eq('role', 'user'); // Only search regular users

      if (error) throw error;
      setAllUsers(data || []);
    } catch (error) {
      console.error('Error searching users:', error);
      toast({
        title: "Error",
        description: "Failed to search users",
        variant: "destructive",
      });
    }
  };

  const promoteUser = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('custom_users')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      const selectedRoleInfo = staffRoles.find(r => r.id === newRole);
      await fetchStaff();
      onRefresh?.();
      setIsAddingStaff(false);
      setSearchEmail("");
      setSelectedRole("");
      setAllUsers([]);
      
      toast({
        title: "Success",
        description: `User promoted to ${selectedRoleInfo?.display_name} successfully`,
      });
    } catch (error) {
      console.error('Error promoting user:', error);
      toast({
        title: "Error",
        description: "Failed to promote user",
        variant: "destructive",
      });
    }
  };

  const changeUserRole = async (member: any, newRole: string) => {
    try {
      const { error } = await supabase
        .from('custom_users')
        .update({ role: newRole })
        .eq('id', member.user_id);

      if (error) throw error;

      const newRoleInfo = staffRoles.find(r => r.id === newRole);
      await fetchStaff();
      onRefresh?.();
      
      toast({
        title: "Success",
        description: `Role changed to ${newRoleInfo?.display_name} successfully`,
      });
    } catch (error) {
      console.error('Error changing role:', error);
      toast({
        title: "Error",
        description: "Failed to change role",
        variant: "destructive",
      });
    }
  };

  const removeStaff = async (member: any) => {
    try {
      const { error } = await supabase
        .from('custom_users')
        .update({ role: 'user' })
        .eq('id', member.user_id);

      if (error) throw error;

      await fetchStaff();
      onRefresh?.();
      
      toast({
        title: "Success",
        description: "Staff member removed successfully",
      });
    } catch (error) {
      console.error('Error removing staff:', error);
      toast({
        title: "Error",
        description: "Failed to remove staff member",
        variant: "destructive",
      });
    }
  };

  const getRoleBadge = (roleInfo: any) => {
    if (!roleInfo) return null;

    const getRoleIcon = (roleName: string) => {
      switch (roleName) {
        case 'admin':
          return <Crown className="h-3 w-3 mr-1" />;
        case 'staff':
          return <Shield className="h-3 w-3 mr-1" />;
        case 'moderator':
          return <Users className="h-3 w-3 mr-1" />;
        default:
          return <Settings className="h-3 w-3 mr-1" />;
      }
    };

    return (
      <Badge 
        className="border" 
        style={{
          backgroundColor: `${roleInfo.color}20`,
          borderColor: `${roleInfo.color}50`,
          color: roleInfo.color
        }}
      >
        {getRoleIcon(roleInfo.name)}
        {roleInfo.display_name}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card className="p-6 bg-gaming-card border-gaming-border">
        <p className="text-center text-muted-foreground">Loading staff members...</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gaming-card border-gaming-border shadow-gaming">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">Staff Management</h2>
          </div>
          
          <Dialog open={isAddingStaff} onOpenChange={setIsAddingStaff}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Staff Member
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gaming-card border-gaming-border">
              <DialogHeader>
                <DialogTitle className="text-foreground">Add Staff Member</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label className="text-foreground">Search by Email/Username</Label>
                  <div className="flex space-x-2 mt-1">
                    <Input
                      placeholder="Enter email or username..."
                      value={searchEmail}
                      onChange={(e) => setSearchEmail(e.target.value)}
                      className="bg-gaming-dark border-gaming-border text-foreground"
                    />
                    <Button onClick={searchUsers} size="sm">
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="text-foreground">Select Role</Label>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger className="bg-gaming-dark border-gaming-border text-foreground">
                      <SelectValue placeholder="Choose a role" />
                    </SelectTrigger>
                    <SelectContent>
                      {staffRoles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          <div className="flex items-center space-x-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: role.color }}
                            />
                            <span>{role.display_name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {allUsers.length > 0 && (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    <Label className="text-foreground">Search Results</Label>
                    {allUsers.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-2 bg-gaming-dark rounded border">
                        <div>
                          <p className="text-sm font-medium text-foreground">{user.username}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => promoteUser(user.id, selectedRole)}
                          disabled={!selectedRole}
                        >
                          Promote
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Role Descriptions */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {staffRoles.map((role) => (
            <div key={role.id} className="p-3 bg-gaming-dark rounded border border-gaming-border">
              <div className="flex items-center space-x-2 mb-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: role.color }}
                />
                <h3 className="font-medium text-foreground">{role.display_name}</h3>
              </div>
              <p className="text-sm text-muted-foreground">{role.description}</p>
            </div>
          ))}
        </div>

        {/* Staff List */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-foreground">Current Staff ({staff.length})</h3>
          
          {staff.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No staff members found</p>
          ) : (
            staff.map((member) => (
              <Card key={member.id} className="p-4 bg-gaming-dark border-gaming-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium text-foreground">
                          {member.username || 'Unknown User'}
                        </h3>
                        {getRoleBadge(member.roleInfo)}
                      </div>
                      <p className="text-sm text-muted-foreground">{member.email}</p>
                      <p className="text-xs text-muted-foreground">
                        Assigned: {new Date(member.assigned_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Select
                      value={member.role}
                      onValueChange={(newRole) => changeUserRole(member, newRole)}
                    >
                      <SelectTrigger className="w-40 bg-gaming-card border-gaming-border text-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {staffRoles.map((role) => (
                          <SelectItem key={role.id} value={role.id}>
                            <div className="flex items-center space-x-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: role.color }}
                              />
                              <span>{role.display_name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-gaming-card border-gaming-border">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-foreground">Remove Staff Member</AlertDialogTitle>
                          <AlertDialogDescription className="text-muted-foreground">
                            Are you sure you want to remove {member.username} from staff? 
                            This will change their role back to regular user.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => removeStaff(member)}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            Remove
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
    </div>
  );
};

export default StaffManagement;