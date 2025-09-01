import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Edit, Trash2, Save, X, Crown, Shield, Star, Users, Settings } from "lucide-react";

const RoleManager = () => {
  const [staffRoles, setStaffRoles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);
  const [newRole, setNewRole] = useState({
    display_name: "",
    color: "#6b7280",
    hierarchy_level: 50,
    is_active: true
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchStaffRoles();
  }, []);

  const fetchStaffRoles = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('staff_roles')
        .select('*')
        .order('hierarchy_level', { ascending: true });

      if (error) throw error;
      setStaffRoles(data || []);
    } catch (error) {
      console.error('Error fetching staff roles:', error);
      toast({
        title: "Error",
        description: "Failed to fetch staff roles",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createRole = async () => {
    try {
      const { error } = await supabase
        .from('staff_roles')
        .insert({
          ...newRole,
          name: newRole.display_name
        });

      if (error) throw error;

      await fetchStaffRoles();
      setIsCreating(false);
      setNewRole({
        display_name: "",
        color: "#6b7280",
        hierarchy_level: 50,
        is_active: true
      });
      toast({
        title: "Success",
        description: "Staff role created successfully",
      });
    } catch (error) {
      console.error('Error creating role:', error);
      toast({
        title: "Error",
        description: "Failed to create staff role",
        variant: "destructive",
      });
    }
  };

  const updateRole = async () => {
    if (!editingRole) return;
    
    try {
      const { error } = await supabase
        .from('staff_roles')
        .update({
          display_name: editingRole.display_name,
          color: editingRole.color,
          hierarchy_level: editingRole.hierarchy_level,
          is_active: editingRole.is_active
        })
        .eq('id', editingRole.id);

      if (error) throw error;

      await fetchStaffRoles();
      setEditingRole(null);
      toast({
        title: "Success",
        description: "Staff role updated successfully",
      });
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: "Error",
        description: "Failed to update staff role",
        variant: "destructive",
      });
    }
  };

  const deleteRole = async (roleId: string) => {
    try {
      const { error } = await supabase
        .from('staff_roles')
        .delete()
        .eq('id', roleId);

      if (error) throw error;

      await fetchStaffRoles();
      toast({
        title: "Success",
        description: "Staff role deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting role:', error);
      toast({
        title: "Error",
        description: "Failed to delete staff role",
        variant: "destructive",
      });
    }
  };

  const getRoleIcon = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('owner') || lowerName.includes('founder')) return Crown;
    if (lowerName.includes('admin')) return Star;
    if (lowerName.includes('moderator') || lowerName.includes('mod')) return Shield;
    return Users;
  };

  if (isLoading) {
    return (
      <Card className="p-6 bg-gaming-card border-gaming-border">
        <div className="text-center">
          <p className="text-foreground">Loading staff roles...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-gaming-card border-gaming-border">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Settings className="h-5 w-5 text-neon-purple" />
          <h2 className="text-xl font-semibold text-foreground">Staff Roles</h2>
          <Badge variant="outline" className="text-neon-purple border-neon-purple/50">
            {staffRoles.length} roles
          </Badge>
        </div>
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Role
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg bg-gaming-card border-gaming-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Create Staff Role</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Create a new staff role with position hierarchy
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="role-name" className="text-foreground">Role Name</Label>
                <Input
                  id="role-name"
                  value={newRole.display_name}
                  onChange={(e) => setNewRole({ ...newRole, display_name: e.target.value })}
                  placeholder="e.g., Projekt Leder"
                  className="bg-gaming-dark border-gaming-border text-foreground"
                />
              </div>

              <div>
                <Label htmlFor="hierarchy" className="text-foreground">Position (Lower = Higher Priority)</Label>
                <Input
                  id="hierarchy"
                  type="number"
                  value={newRole.hierarchy_level}
                  onChange={(e) => setNewRole({ ...newRole, hierarchy_level: parseInt(e.target.value) || 50 })}
                  placeholder="1-100"
                  className="bg-gaming-dark border-gaming-border text-foreground"
                />
              </div>

              <div>
                <Label htmlFor="color" className="text-foreground">Role Color</Label>
                <Input
                  id="color"
                  type="color"
                  value={newRole.color}
                  onChange={(e) => setNewRole({ ...newRole, color: e.target.value })}
                  className="bg-gaming-dark border-gaming-border h-10"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={newRole.is_active}
                  onCheckedChange={(checked) => setNewRole({ ...newRole, is_active: checked })}
                />
                <Label className="text-foreground">Active Role</Label>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
              <Button onClick={createRole}>
                <Save className="h-4 w-4 mr-2" />
                Create Role
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {staffRoles.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No staff roles found</p>
        ) : (
          staffRoles.map((role) => {
            const RoleIcon = getRoleIcon(role.display_name);
            
            return (
              <Card key={role.id} className="p-4 bg-gaming-dark border-gaming-border hover:border-neon-purple/30 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 rounded-full" style={{ backgroundColor: `${role.color}20`, border: `1px solid ${role.color}30` }}>
                      <RoleIcon className="h-4 w-4" style={{ color: role.color }} />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">{role.display_name}</h4>
                      <p className="text-sm text-muted-foreground">Position: {role.hierarchy_level}</p>
                    </div>
                    <Badge variant={role.is_active ? "default" : "secondary"}>
                      {role.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Dialog open={editingRole?.id === role.id} onOpenChange={(open) => !open && setEditingRole(null)}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => setEditingRole({...role})}>
                          <Edit className="h-3 w-3" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-lg bg-gaming-card border-gaming-border">
                        <DialogHeader>
                          <DialogTitle className="text-foreground">Edit Staff Role</DialogTitle>
                        </DialogHeader>

                        {editingRole && (
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="edit-role-name" className="text-foreground">Role Name</Label>
                              <Input
                                id="edit-role-name"
                                value={editingRole.display_name}
                                onChange={(e) => setEditingRole({ ...editingRole, display_name: e.target.value })}
                                className="bg-gaming-dark border-gaming-border text-foreground"
                              />
                            </div>

                            <div>
                              <Label htmlFor="edit-hierarchy" className="text-foreground">Position</Label>
                              <Input
                                id="edit-hierarchy"
                                type="number"
                                value={editingRole.hierarchy_level}
                                onChange={(e) => setEditingRole({ ...editingRole, hierarchy_level: parseInt(e.target.value) || 50 })}
                                className="bg-gaming-dark border-gaming-border text-foreground"
                              />
                            </div>

                            <div>
                              <Label htmlFor="edit-color" className="text-foreground">Role Color</Label>
                              <Input
                                id="edit-color"
                                type="color"
                                value={editingRole.color}
                                onChange={(e) => setEditingRole({ ...editingRole, color: e.target.value })}
                                className="bg-gaming-dark border-gaming-border h-10"
                              />
                            </div>

                            <div className="flex items-center space-x-2">
                              <Switch
                                checked={editingRole.is_active}
                                onCheckedChange={(checked) => setEditingRole({ ...editingRole, is_active: checked })}
                              />
                              <Label className="text-foreground">Active Role</Label>
                            </div>
                          </div>
                        )}

                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" onClick={() => setEditingRole(null)}>
                            Cancel
                          </Button>
                          <Button onClick={updateRole}>
                            <Save className="h-4 w-4 mr-2" />
                            Update Role
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-gaming-card border-gaming-border">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-foreground">Delete Role</AlertDialogTitle>
                          <AlertDialogDescription className="text-muted-foreground">
                            Are you sure you want to delete this role? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteRole(role.id)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </Card>
  );
};

export default RoleManager;