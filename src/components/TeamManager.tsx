import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Edit, Trash2, Save, X, Users, Image, Crown, Shield, Star, Calendar, Activity, TrendingUp, Award, Eye, MapPin } from "lucide-react";
import { useCustomAuth } from "@/hooks/useCustomAuth";

const TeamManager = () => {
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [staffRoles, setStaffRoles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingMember, setEditingMember] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newMember, setNewMember] = useState({
    name: "",
    staff_role_id: "",
    bio: "",
    image_url: "",
    location: "",
    order_index: 0,
    is_active: true
  });
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    admins: 0,
    mods: 0,
    recent: 0
  });
  const { user } = useCustomAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchStaffRoles();
    fetchTeamMembers();
  }, []);

  const fetchStaffRoles = async () => {
    try {
      const { data, error } = await supabase
        .from('staff_roles')
        .select('*')
        .eq('is_active', true)
        .order('hierarchy_level', { ascending: true });

      if (error) throw error;
      setStaffRoles(data || []);
    } catch (error) {
      console.error('Error fetching staff roles:', error);
    }
  };

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('team_members')
        .select(`
          *,
          staff_roles!fk_team_members_staff_role (
            id,
            display_name,
            color,
            hierarchy_level
          )
        `)
        .order('order_index', { ascending: true });

      if (error) throw error;
      const members = data || [];
      setTeamMembers(members);

      // Calculate stats
      const activeMembers = members.filter(m => m.is_active);
      const highLevelRoles = members.filter(m => m.staff_roles?.hierarchy_level <= 25);
      const midLevelRoles = members.filter(m => m.staff_roles?.hierarchy_level > 25 && m.staff_roles?.hierarchy_level <= 40);
      const recentlyAdded = members.filter(m => {
        const memberDate = new Date(m.created_at);
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return memberDate > weekAgo;
      });

      setStats({
        total: members.length,
        active: activeMembers.length,
        admins: highLevelRoles.length,
        mods: midLevelRoles.length,
        recent: recentlyAdded.length
      });
    } catch (error) {
      console.error('Error fetching team members:', error);
      toast({
        title: "Error",
        description: "Failed to fetch team members",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Gruppér team members efter role
  const groupedMembers = teamMembers.reduce((groups, member) => {
    const roleName = member.staff_roles?.display_name || member.role || 'Unknown';
    if (!groups[roleName]) {
      groups[roleName] = [];
    }
    groups[roleName].push(member);
    return groups;
  }, {} as Record<string, typeof teamMembers>);

  // Sorter roller efter hierarchy_level
  const sortedRoleNames = staffRoles
    .filter(role => groupedMembers[role.display_name])
    .sort((a, b) => a.hierarchy_level - b.hierarchy_level)
    .map(role => role.display_name);

  const createTeamMember = async () => {
    try {
      const selectedRole = staffRoles.find(role => role.id === newMember.staff_role_id);
      const roleDisplayName = selectedRole?.display_name || 'Staff';

      const { error } = await supabase
        .from('team_members')
        .insert({
          ...newMember,
          role: roleDisplayName
        });

      if (error) throw error;

      await fetchTeamMembers();
      setIsCreating(false);
      setNewMember({
        name: "",
        staff_role_id: "",
        bio: "",
        image_url: "",
        location: "",
        order_index: 0,
        is_active: true
      });
      toast({
        title: "Success",
        description: "Team member created successfully",
      });
    } catch (error) {
      console.error('Error creating team member:', error);
      toast({
        title: "Error",
        description: "Failed to create team member",
        variant: "destructive",
      });
    }
  };

  const updateTeamMember = async (memberId: string, updates: any) => {
    try {
      const { staff_roles, created_at, updated_at, id, ...updateData } = updates;

      const { error } = await supabase
        .from('team_members')
        .update(updateData)
        .eq('id', memberId);

      if (error) throw error;

      await fetchTeamMembers();
      setEditingMember(null);
      toast({
        title: "Success",
        description: "Team member updated successfully",
      });
    } catch (error) {
      console.error('Error updating team member:', error);
      toast({
        title: "Error",
        description: "Failed to update team member",
        variant: "destructive",
      });
    }
  };

  const deleteTeamMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      await fetchTeamMembers();
      toast({
        title: "Success",
        description: "Team member deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting team member:', error);
      toast({
        title: "Error",
        description: "Failed to delete team member",
        variant: "destructive",
      });
    }
  };

  const getRoleIcon = (role: string) => {
    const lowerRole = role.toLowerCase();
    if (lowerRole.includes('owner') || lowerRole.includes('founder')) return Crown;
    if (lowerRole.includes('admin')) return Star;
    if (lowerRole.includes('developer')) return Activity;
    if (lowerRole.includes('head') || lowerRole.includes('senior')) return Award;
    if (lowerRole.includes('moderator') || lowerRole.includes('mod')) return Shield;
    if (lowerRole.includes('helper') || lowerRole.includes('supporter')) return Users;
    return Users;
  };

  const getRoleColor = (role: string) => {
    const lowerRole = role.toLowerCase();
    if (lowerRole.includes('owner') || lowerRole.includes('founder')) return 'text-primary border-primary/30 bg-primary/10';
    if (lowerRole.includes('admin')) return 'text-secondary border-secondary/30 bg-secondary/10';
    if (lowerRole.includes('developer')) return 'text-accent border-accent/30 bg-accent/10';
    if (lowerRole.includes('head') || lowerRole.includes('senior')) return 'text-neon-purple border-neon-purple/30 bg-neon-purple/10';
    if (lowerRole.includes('moderator') || lowerRole.includes('mod')) return 'text-neon-blue border-neon-blue/30 bg-neon-blue/10';
    if (lowerRole.includes('helper') || lowerRole.includes('supporter')) return 'text-neon-green border-neon-green/30 bg-neon-green/10';
    return 'text-muted-foreground border-muted/30 bg-muted/10';
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <Card className="p-6 bg-gaming-card border-gaming-border">
        <div className="text-center">
          <p className="text-foreground">Loading team members...</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Team Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="bg-gaming-card border-gaming-border">
          <CardContent className="p-4 text-center">
            <Users className="h-6 w-6 text-neon-blue mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total Members</p>
          </CardContent>
        </Card>

        <Card className="bg-gaming-card border-gaming-border">
          <CardContent className="p-4 text-center">
            <Activity className="h-6 w-6 text-neon-green mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{stats.active}</p>
            <p className="text-xs text-muted-foreground">Active</p>
          </CardContent>
        </Card>

        <Card className="bg-gaming-card border-gaming-border">
          <CardContent className="p-4 text-center">
            <Crown className="h-6 w-6 text-yellow-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{stats.admins}</p>
            <p className="text-xs text-muted-foreground">Admins</p>
          </CardContent>
        </Card>

        <Card className="bg-gaming-card border-gaming-border">
          <CardContent className="p-4 text-center">
            <Shield className="h-6 w-6 text-blue-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{stats.mods}</p>
            <p className="text-xs text-muted-foreground">Moderators</p>
          </CardContent>
        </Card>

        <Card className="bg-gaming-card border-gaming-border">
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-6 w-6 text-neon-purple mx-auto mb-2" />
            <p className="text-2xl font-bold text-foreground">{stats.recent}</p>
            <p className="text-xs text-muted-foreground">Recent (7d)</p>
          </CardContent>
        </Card>
      </div>

      {/* Activity Progress */}
      <Card className="bg-gaming-card border-gaming-border">
        <CardContent className="p-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Team Activity Rate</span>
            <span className="text-foreground">{Math.round((stats.active / Math.max(stats.total, 1)) * 100)}% Active</span>
          </div>
          <Progress value={(stats.active / Math.max(stats.total, 1)) * 100} className="h-2" />
        </CardContent>
      </Card>

      <Card className="p-6 bg-gaming-card border-gaming-border">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-neon-green" />
            <h2 className="text-xl font-semibold text-foreground">Team Members</h2>
            <Badge variant="outline" className="text-neon-blue border-neon-blue/50">
              {stats.total} total
            </Badge>
          </div>
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Member
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg bg-gaming-card border-gaming-border">
              <DialogHeader>
                <DialogTitle className="text-foreground">Create Team Member</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Add a new team member to the public team page
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* Form inputs... */}
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreating(false)}>
                  Cancel
                </Button>
                <Button onClick={createTeamMember}>
                  <Save className="h-4 w-4 mr-2" />
                  Create Member
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-4">
          {sortedRoleNames.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No team members found</p>
          ) : (
            sortedRoleNames.map((roleName) => (
              <div key={roleName}>
                <h3 className="text-lg font-semibold text-foreground mb-2">{roleName}</h3>
                {groupedMembers[roleName].map((member) => {
                  const memberRole = member.staff_roles || { display_name: member.role || 'Unknown', color: '#6b7280', hierarchy_level: 50 };
                  const RoleIcon = getRoleIcon(memberRole.display_name);
                  const roleColorClass = getRoleColor(memberRole.display_name);

                  return (
                    <Card key={member.id} className="p-4 bg-gaming-dark border-gaming-border hover:border-neon-purple/30 transition-colors mb-4">
                      {/* Render member info like avatar, name, badges, bio, etc. */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          <div className="relative">
                            <Avatar className="h-16 w-16 ring-2 ring-gaming-border">
                              <AvatarImage src={member.image_url} alt={member.name} className="object-cover" />
                              <AvatarFallback className="bg-gradient-to-br from-neon-purple/30 to-neon-blue/30 text-white font-bold">
                                {getInitials(member.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-gaming-dark ${member.is_active ? 'bg-green-400' : 'bg-gray-500'}`} />
                            <div className={`absolute -bottom-1 -right-1 p-1 rounded-full bg-gaming-dark border ${roleColorClass.split(' ')[1]}`}>
                              <RoleIcon className={`h-3 w-3 ${roleColorClass.split(' ')[0]}`} />
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h4 className="font-medium text-foreground text-lg">{member.name}</h4>
                              <Badge className={`${roleColorClass} font-medium`}>
                                <RoleIcon className="h-3 w-3 mr-1" />
                                {memberRole.display_name}
                              </Badge>
                              {!member.is_active && (
                                <Badge variant="secondary" className="text-xs bg-gray-500/20 text-gray-400">
                                  Inactive
                                </Badge>
                              )}
                            </div>
                            {member.bio && <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{member.bio}</p>}
                            <div className="grid grid-cols-2 gap-4 text-xs">
                              <div className="flex items-center space-x-2 text-muted-foreground">
                                <Award className="h-3 w-3" />
                                <span>Position: #{member.order_index}</span>
                              </div>
                              <div className="flex items-center space-x-2 text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                <span>Added: {new Date(member.created_at).toLocaleDateString()}</span>
                              </div>
                              {member.location && (
                                <div className="flex items-center space-x-2 text-muted-foreground">
                                  <MapPin className="h-3 w-3" />
                                  <span>{member.location}</span>
                                </div>
                              )}
                              <div className="flex items-center space-x-2 text-muted-foreground">
                                <Eye className="h-3 w-3" />
                                <span>Public: {member.is_active ? 'Visible' : 'Hidden'}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};

export default TeamManager;
