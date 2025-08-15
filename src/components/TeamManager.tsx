import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Edit, Trash2, Save, X, Users, Image } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const TeamManager = () => {
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingMember, setEditingMember] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newMember, setNewMember] = useState({
    name: "",
    role: "",
    bio: "",
    image_url: "",
    order_index: 0,
    is_active: true
  });
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) throw error;
      setTeamMembers(data || []);
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

  const createTeamMember = async () => {
    try {
      const { error } = await supabase
        .from('team_members')
        .insert({
          ...newMember,
          created_by: user?.id
        });

      if (error) throw error;

      await fetchTeamMembers();
      setIsCreating(false);
      setNewMember({
        name: "",
        role: "",
        bio: "",
        image_url: "",
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
      const { error } = await supabase
        .from('team_members')
        .update(updates)
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
    <Card className="p-6 bg-gaming-card border-gaming-border">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Users className="h-5 w-5 text-neon-green" />
          <h2 className="text-xl font-semibold text-foreground">Team Members</h2>
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
              <div>
                <Label className="text-foreground">Name</Label>
                <Input
                  value={newMember.name}
                  onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                  placeholder="Team member name..."
                  className="bg-gaming-dark border-gaming-border text-foreground"
                />
              </div>
              
              <div>
                <Label className="text-foreground">Role</Label>
                <Input
                  value={newMember.role}
                  onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                  placeholder="e.g., Owner, Developer, Moderator..."
                  className="bg-gaming-dark border-gaming-border text-foreground"
                />
              </div>
              
              <div>
                <Label className="text-foreground">Bio</Label>
                <Textarea
                  value={newMember.bio}
                  onChange={(e) => setNewMember({ ...newMember, bio: e.target.value })}
                  placeholder="Short bio about this team member..."
                  className="bg-gaming-dark border-gaming-border text-foreground"
                />
              </div>
              
              <div>
                <Label className="text-foreground">Image URL</Label>
                <Input
                  value={newMember.image_url}
                  onChange={(e) => setNewMember({ ...newMember, image_url: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                  className="bg-gaming-dark border-gaming-border text-foreground"
                />
              </div>

              <div>
                <Label className="text-foreground">Order Index</Label>
                <Input
                  type="number"
                  value={newMember.order_index}
                  onChange={(e) => setNewMember({ ...newMember, order_index: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                  className="bg-gaming-dark border-gaming-border text-foreground"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  checked={newMember.is_active}
                  onCheckedChange={(checked) => setNewMember({ ...newMember, is_active: checked })}
                />
                <Label className="text-foreground">Active</Label>
              </div>
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
        {teamMembers.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No team members found</p>
        ) : (
          teamMembers.map((member) => (
            <Card key={member.id} className="p-4 bg-gaming-dark border-gaming-border">
              {editingMember?.id === member.id ? (
                <div className="space-y-3">
                  <Input
                    value={editingMember.name}
                    onChange={(e) => setEditingMember({ ...editingMember, name: e.target.value })}
                    placeholder="Name"
                    className="bg-gaming-card border-gaming-border text-foreground"
                  />
                  <Input
                    value={editingMember.role}
                    onChange={(e) => setEditingMember({ ...editingMember, role: e.target.value })}
                    placeholder="Role"
                    className="bg-gaming-card border-gaming-border text-foreground"
                  />
                  <Textarea
                    value={editingMember.bio}
                    onChange={(e) => setEditingMember({ ...editingMember, bio: e.target.value })}
                    placeholder="Bio"
                    className="bg-gaming-card border-gaming-border text-foreground"
                  />
                  <Input
                    value={editingMember.image_url}
                    onChange={(e) => setEditingMember({ ...editingMember, image_url: e.target.value })}
                    placeholder="Image URL"
                    className="bg-gaming-card border-gaming-border text-foreground"
                  />
                  <Input
                    type="number"
                    value={editingMember.order_index}
                    onChange={(e) => setEditingMember({ ...editingMember, order_index: parseInt(e.target.value) || 0 })}
                    placeholder="Order"
                    className="bg-gaming-card border-gaming-border text-foreground"
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={editingMember.is_active}
                        onCheckedChange={(checked) => setEditingMember({ ...editingMember, is_active: checked })}
                      />
                      <Label className="text-foreground">Active</Label>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        onClick={() => updateTeamMember(member.id, editingMember)}
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingMember(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    {member.image_url && (
                      <img
                        src={member.image_url}
                        alt={member.name}
                        className="w-16 h-16 rounded-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium text-foreground">{member.name}</h4>
                        <Badge className="bg-neon-blue/20 text-neon-blue border-neon-blue/30">
                          {member.role}
                        </Badge>
                        {!member.is_active && (
                          <Badge variant="secondary" className="text-xs">
                            Inactive
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{member.bio}</p>
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <span>Order: {member.order_index}</span>
                        <span>Added: {new Date(member.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingMember(member)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-gaming-card border-gaming-border">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-foreground">Delete Team Member</AlertDialogTitle>
                          <AlertDialogDescription className="text-muted-foreground">
                            Are you sure you want to delete {member.name}? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteTeamMember(member.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </Card>
  );
};

export default TeamManager;