import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Search, UserCheck, Crown, Shield, User, Calendar, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Navbar from '@/components/Navbar';

interface UserProfile {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  website: string | null;
  discord_id: string | null;
  steam_id: string | null;
  created_at: string;
  updated_at: string;
}

interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'moderator' | 'user';
  created_at: string;
}

interface UserWithRole extends UserProfile {
  roles: UserRole[];
  email?: string;
}

export default function UserManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // First get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Then get all user roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) throw rolesError;

      // Get auth users to get email addresses (staff only)
      let authUsers: any = null;
      try {
        const result = await supabase.auth.admin.listUsers();
        authUsers = result.data;
      } catch (authError) {
        console.warn('Could not fetch auth users (admin only):', authError);
      }

      // Combine the data
      const usersWithRoles: UserWithRole[] = (profiles || []).map(profile => {
        const userRoles = (roles || []).filter(role => role.user_id === profile.id);
        const authUser = authUsers?.users?.find((au: any) => au.id === profile.id);
        
        return {
          ...profile,
          roles: userRoles,
          email: authUser?.email
        };
      });

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: 'admin' | 'moderator' | 'user') => {
    try {
      // Remove existing roles
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      // Add new role
      const { error } = await supabase
        .from('user_roles')
        .insert([{ user_id: userId, role: newRole }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: `User role updated to ${newRole}`,
      });

      setIsRoleDialogOpen(false);
      fetchUsers(); // Refresh the list
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive",
      });
    }
  };

  const getUserRoleIcon = (roles: UserRole[]) => {
    if (roles.some(r => r.role === 'admin')) return <Crown className="w-4 h-4 text-yellow-500" />;
    if (roles.some(r => r.role === 'moderator')) return <Shield className="w-4 h-4 text-blue-500" />;
    return <User className="w-4 h-4 text-gray-500" />;
  };

  const getUserRoleBadge = (roles: UserRole[]) => {
    if (roles.some(r => r.role === 'admin')) return <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600">Admin</Badge>;
    if (roles.some(r => r.role === 'moderator')) return <Badge variant="default" className="bg-blue-500 hover:bg-blue-600">Moderator</Badge>;
    return <Badge variant="secondary">User</Badge>;
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = 
      selectedRole === 'all' || 
      user.roles.some(role => role.role === selectedRole);

    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-purple mx-auto mb-4"></div>
              <p className="text-foreground">Loading users...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">User Management</h1>
            <p className="text-muted-foreground">Manage registered users and their roles</p>
            <div className="flex items-center mt-2">
              <Badge variant="secondary" className="bg-neon-purple/20 text-neon-purple border-neon-purple/50">
                Staff Only
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Users className="w-6 h-6 text-neon-purple" />
            <span className="text-2xl font-bold text-foreground">{users.length}</span>
            <span className="text-muted-foreground">Total Users</span>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by username, name, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-background border-input"
            />
          </div>
          
          <Select value={selectedRole} onValueChange={setSelectedRole}>
            <SelectTrigger className="w-full sm:w-48 bg-background border-input">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="moderator">Moderator</SelectItem>
              <SelectItem value="user">User</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Users Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((userProfile) => (
            <Card key={userProfile.id} className="bg-gaming-card border-gaming-border hover:border-neon-purple/50 transition-all duration-300">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={userProfile.avatar_url || undefined} />
                      <AvatarFallback>
                        {userProfile.username?.slice(0, 2).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-foreground text-lg">
                        {userProfile.full_name || userProfile.username}
                      </CardTitle>
                      <CardDescription className="text-muted-foreground">
                        @{userProfile.username}
                      </CardDescription>
                    </div>
                  </div>
                  {getUserRoleIcon(userProfile.roles)}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Role:</span>
                  {getUserRoleBadge(userProfile.roles)}
                </div>

                {userProfile.email && (
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-foreground truncate">{userProfile.email}</span>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Joined {new Date(userProfile.created_at).toLocaleDateString()}
                  </span>
                </div>

                {userProfile.discord_id && (
                  <div className="text-xs text-muted-foreground">
                    Discord: {userProfile.discord_id}
                  </div>
                )}

                <Dialog open={isRoleDialogOpen && selectedUser?.id === userProfile.id} onOpenChange={(open) => {
                  setIsRoleDialogOpen(open);
                  if (!open) setSelectedUser(null);
                }}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => setSelectedUser(userProfile)}
                      disabled={userProfile.id === user?.id} // Can't change own role
                    >
                      <UserCheck className="w-4 h-4 mr-2" />
                      {userProfile.id === user?.id ? 'Your Account' : 'Manage Role'}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-gaming-card border-gaming-border">
                    <DialogHeader>
                      <DialogTitle className="text-foreground">Change User Role</DialogTitle>
                      <DialogDescription className="text-muted-foreground">
                        Update the role for {userProfile.full_name || userProfile.username}
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 gap-2">
                        <Button
                          variant={userProfile.roles.some(r => r.role === 'user') ? "default" : "outline"}
                          onClick={() => updateUserRole(userProfile.id, 'user')}
                          className="justify-start"
                        >
                          <User className="w-4 h-4 mr-2" />
                          User
                        </Button>
                        <Button
                          variant={userProfile.roles.some(r => r.role === 'moderator') ? "default" : "outline"}
                          onClick={() => updateUserRole(userProfile.id, 'moderator')}
                          className="justify-start"
                        >
                          <Shield className="w-4 h-4 mr-2" />
                          Moderator
                        </Button>
                        <Button
                          variant={userProfile.roles.some(r => r.role === 'admin') ? "default" : "outline"}
                          onClick={() => updateUserRole(userProfile.id, 'admin')}
                          className="justify-start"
                        >
                          <Crown className="w-4 h-4 mr-2" />
                          Admin
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No users found</h3>
            <p className="text-muted-foreground">
              {searchTerm || selectedRole !== 'all' 
                ? 'Try adjusting your search or filter criteria' 
                : 'No users have registered yet'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}