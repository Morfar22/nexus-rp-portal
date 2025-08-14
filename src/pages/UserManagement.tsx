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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Users, Search, UserCheck, Crown, Shield, User, Calendar, Mail, UserX, Trash2, Ban, UserMinus } from 'lucide-react';
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
  email: string | null;
  banned: boolean;
  banned_at: string | null;
  banned_by: string | null;
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
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

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

      // Combine the data - email is now stored in profiles table
      const usersWithRoles: UserWithRole[] = (profiles || []).map(profile => {
        const userRoles = (roles || []).filter(role => role.user_id === profile.id);
        
        return {
          ...profile,
          roles: userRoles
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

  const banUser = async (userId: string, ban: boolean) => {
    console.log('🚨 BAN FUNCTION CALLED:', { userId, ban });
    
    try {
      const userToBan = users.find(u => u.id === userId);
      console.log('🔍 Found user to ban:', userToBan);
      
      if (!userToBan) {
        throw new Error('User not found');
      }

      const updateData = ban 
        ? { banned: true, banned_at: new Date().toISOString(), banned_by: user?.id }
        : { banned: false, banned_at: null, banned_by: null };

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId);

      if (error) throw error;

      // Send ban/unban notification email
      console.log('User to ban/unban:', { 
        id: userToBan.id, 
        email: userToBan.email, 
        username: userToBan.username,
        full_name: userToBan.full_name 
      });
      
      if (!userToBan.email) {
        console.error('User email is null, cannot send notification');
        toast({
          title: "Warning",
          description: `User ${ban ? 'banned' : 'unbanned'} but no email notification sent - user has no email`,
          variant: "destructive",
        });
      } else {
        try {
          const result = await supabase.functions.invoke('send-ban-notification', {
            body: {
              userEmail: userToBan.email,
              userName: userToBan.full_name || userToBan.username || 'User',
              isBanned: ban,
              staffName: user?.email || 'Staff Member'
            }
          });
          console.log('Ban notification result:', result);
          console.log('Ban notification email sent successfully');
        } catch (emailError) {
          console.error('Failed to send ban notification email:', emailError);
          // Don't fail the ban action if email fails
        }
      }

      toast({
        title: "Success",
        description: `User ${ban ? 'banned' : 'unbanned'} successfully${ban ? ' and notified via email' : ' and notified via email'}`,
      });

      fetchUsers(); // Refresh the list
    } catch (error) {
      console.error('Error updating ban status:', error);
      toast({
        title: "Error",
        description: `Failed to ${ban ? 'ban' : 'unban'} user`,
        variant: "destructive",
      });
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      // First delete from profiles (this will cascade to user_roles due to foreign key)
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "User account deleted successfully",
      });

      setIsDeleteDialogOpen(false);
      setSelectedUser(null);
      fetchUsers(); // Refresh the list
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: "Failed to delete user account",
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

  const getBannedBadge = (banned: boolean) => {
    if (banned) return <Badge variant="destructive" className="bg-red-500 hover:bg-red-600">Banned</Badge>;
    return null;
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = 
      selectedRole === 'all' || 
      selectedRole === 'banned' && user.banned ||
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
              <SelectItem value="all">All Users</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="moderator">Moderator</SelectItem>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="banned">Banned Users</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Users Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((userProfile) => (
            <Card key={userProfile.id} className={`bg-gaming-card border-gaming-border hover:border-neon-purple/50 transition-all duration-300 ${userProfile.banned ? 'opacity-75 border-red-500/50' : ''}`}>
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
                  <div className="flex items-center space-x-2">
                    {getUserRoleBadge(userProfile.roles)}
                    {getBannedBadge(userProfile.banned)}
                  </div>
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

                {userProfile.banned && userProfile.banned_at && (
                  <div className="text-xs text-red-400">
                    Banned: {new Date(userProfile.banned_at).toLocaleDateString()}
                  </div>
                )}

                {userProfile.discord_id && (
                  <div className="text-xs text-muted-foreground">
                    Discord: {userProfile.discord_id}
                  </div>
                )}

                <div className="flex space-x-2">
                  <Dialog open={isRoleDialogOpen && selectedUser?.id === userProfile.id} onOpenChange={(open) => {
                    setIsRoleDialogOpen(open);
                    if (!open) setSelectedUser(null);
                  }}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => setSelectedUser(userProfile)}
                        disabled={userProfile.id === user?.id} // Can't change own role
                      >
                        <UserCheck className="w-4 h-4 mr-2" />
                        {userProfile.id === user?.id ? 'Your Account' : 'Role'}
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

                  {userProfile.id !== user?.id && (
                    <>
                      <Button
                        variant={userProfile.banned ? "default" : "destructive"}
                        size="sm"
                        onClick={() => banUser(userProfile.id, !userProfile.banned)}
                        className="flex-1"
                      >
                        {userProfile.banned ? (
                          <>
                            <UserCheck className="w-4 h-4 mr-2" />
                            Unban
                          </>
                        ) : (
                          <>
                            <Ban className="w-4 h-4 mr-2" />
                            Ban
                          </>
                        )}
                      </Button>

                      <AlertDialog open={isDeleteDialogOpen && selectedUser?.id === userProfile.id} onOpenChange={(open) => {
                        setIsDeleteDialogOpen(open);
                        if (!open) setSelectedUser(null);
                      }}>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedUser(userProfile)}
                            className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-gaming-card border-gaming-border">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-foreground">Delete User Account</AlertDialogTitle>
                            <AlertDialogDescription className="text-muted-foreground">
                              Are you sure you want to delete {userProfile.full_name || userProfile.username}'s account? 
                              This action cannot be undone and will permanently remove all user data.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteUser(userProfile.id)}
                              className="bg-red-500 hover:bg-red-600"
                            >
                              Delete Account
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  )}
                </div>
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