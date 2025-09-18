import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Shield, 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  UserPlus,
  Check,
  Search,
  Crown,
  Star,
  Save,
  X
} from "lucide-react";
import { useCustomAuth } from "@/hooks/useCustomAuth";

interface StaffRole {
  id: string;
  name: string;
  display_name: string;
  description: string;
  color: string;
  hierarchy_level: number;
  is_active: boolean;
  created_at: string;
  permissions?: string[];
}

interface Permission {
  id: string;
  name: string;
  display_name: string;
  description: string;
  category: string;
}

interface UserRoleAssignment {
  id: string;
  user_id: string;
  role_id: string;
  assigned_at: string;
  expires_at: string | null;
  is_active: boolean;
  profiles: {
    username: string;
    email: string;
  };
  staff_roles: {
    display_name: string;
    color: string;
    hierarchy_level: number;
  };
}

export function RoleManagement() {
  const [roles, setRoles] = useState<StaffRole[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [userAssignments, setUserAssignments] = useState<UserRoleAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<StaffRole | null>(null);
  const [rolePermissions, setRolePermissions] = useState<string[]>([]);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [editingRole, setEditingRole] = useState<Partial<StaffRole>>({});
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedRoleForAssign, setSelectedRoleForAssign] = useState("");
  const { toast } = useToast();
  const { user } = useCustomAuth();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchRoles(),
        fetchPermissions(),
        fetchUserAssignments()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    const { data, error } = await supabase
      .rpc('get_staff_roles_data');

    if (error) {
      console.error('Error fetching roles:', error);
      toast({
        title: "Fejl",
        description: "Kunne ikke hente roller",
        variant: "destructive",
      });
      return;
    }
    
    setRoles(data || []);
  };

  const fetchPermissions = async () => {
    const { data, error } = await supabase
      .rpc('get_permissions_data');

    if (error) {
      console.error('Error fetching permissions:', error);
      return;
    }
    
    setPermissions(data || []);
  };

  const fetchUserAssignments = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_user_role_assignments_data');

      if (error) throw error;

      const enrichedData = await Promise.all(
        (data || []).map(async (assignment) => {
          // Use the security definer function to get user data safely
          const { data: userData, error: userError } = await supabase
            .rpc('get_user_data', { user_uuid: assignment.user_id });

          const userDetails = userData && userData.length > 0 ? userData[0] : null;

          return {
            ...assignment,
            staff_roles: {
              display_name: assignment.display_name,
              color: assignment.color,
              hierarchy_level: assignment.hierarchy_level
            },
            profiles: userDetails ? { 
              username: userDetails.username || 'Ukendt Bruger', 
              email: userDetails.email || 'Ukendt' 
            } : { username: 'Ukendt Bruger', email: 'Ukendt' }
          };
        })
      );

      setUserAssignments(enrichedData);
    } catch (error) {
      console.error('Error fetching user assignments:', error);
      setUserAssignments([]);
    }
  };

  const fetchRolePermissions = async (roleId: string) => {
    try {
      const { data, error } = await supabase
        .rpc('get_role_permissions_data', { role_uuid: roleId });

      if (error) {
        console.error('Error fetching role permissions:', error);
        return [];
      }
      
      return data?.map(item => item.permission_name) || [];
    } catch (error) {
      console.error('Error fetching role permissions:', error);
      return [];
    }
  };

  const handleSelectRole = async (role: StaffRole) => {
    setSelectedRole(role);
    const perms = await fetchRolePermissions(role.id);
    setRolePermissions(perms);
  };

  const saveRole = async () => {
    try {
      if (editingRole.id) {
        const { error } = await supabase
          .from('staff_roles')
          .update({
            name: editingRole.name,
            display_name: editingRole.display_name,
            description: editingRole.description,
            color: editingRole.color,
            hierarchy_level: editingRole.hierarchy_level,
            is_active: editingRole.is_active
          })
          .eq('id', editingRole.id);
        if (error) throw error;
      } else {
        // Create new role - convert display_name to name
        const name = editingRole.display_name?.toLowerCase().replace(/\s+/g, '_') || '';
        const insertData = {
          name,
          display_name: editingRole.display_name!,
          description: editingRole.description || '',
          color: editingRole.color || '#6366f1',
          hierarchy_level: editingRole.hierarchy_level || 50,
          is_active: editingRole.is_active ?? true,
          created_by: user?.id
        };
        const { error } = await supabase
          .from('staff_roles')
          .insert(insertData);
        if (error) throw error;
      }
      
      await fetchRoles();
      setShowRoleDialog(false);
      setEditingRole({});
      toast({
        title: "Succes",
        description: `Rolle ${editingRole.id ? 'opdateret' : 'oprettet'} succesfuldt`,
      });
    } catch (error: any) {
      toast({
        title: "Fejl",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteRole = async (roleId: string) => {
    try {
      const { error } = await supabase
        .from('staff_roles')
        .update({ is_active: false })
        .eq('id', roleId);
      
      if (error) throw error;
      
      await fetchRoles();
      setSelectedRole(null);
      toast({
        title: "Succes",
        description: "Rolle deaktiveret succesfuldt",
      });
    } catch (error: any) {
      toast({
        title: "Fejl",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const updateRolePermissions = async () => {
    if (!selectedRole) return;

    try {
      await supabase
        .from('role_permissions')
        .delete()
        .eq('role_id', selectedRole.id);

      if (rolePermissions.length > 0) {
        const permissionRecords = rolePermissions.map(permName => {
          const permission = permissions.find(p => p.name === permName);
          return {
            role_id: selectedRole.id,
            permission_id: permission?.id
          };
        }).filter(p => p.permission_id);

        const { error } = await supabase
          .from('role_permissions')
          .insert(permissionRecords);
        
        if (error) throw error;
      }

      toast({
        title: "Succes",
        description: "Rolle tilladelser opdateret succesfuldt",
      });
    } catch (error: any) {
      toast({
        title: "Fejl",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const searchUsers = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .rpc('search_users_data', { search_query: query });

      if (error) {
        console.error('Error searching users:', error);
        return;
      }

      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchResults([]);
    }
  };

  const assignRole = async (userId: string, roleId: string) => {
    try {
      // Map staff role to simple role value for custom_users table
      const selectedStaffRole = roles.find(r => r.id === roleId);
      let simpleRole = 'user';
      
      if (selectedStaffRole) {
        // Map based on hierarchy level or name
        if (selectedStaffRole.hierarchy_level >= 80) {
          simpleRole = 'admin';
        } else if (selectedStaffRole.hierarchy_level >= 60) {
          simpleRole = 'staff';
        } else {
          simpleRole = 'moderator';
        }
      }

      // Update user role in custom_users table with simple role value
      const { error } = await supabase
        .from('custom_users')
        .update({ role: simpleRole })
        .eq('id', userId);

      if (error) throw error;

      await fetchUserAssignments();
      setShowAssignDialog(false);
      setUserSearchQuery("");
      setSearchResults([]);
      setSelectedRoleForAssign("");
      
      toast({
        title: "Succes",
        description: "Rolle tildelt succesfuldt",
      });
    } catch (error: any) {
      toast({
        title: "Fejl",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const removeRoleAssignment = async (assignmentId: string) => {
    try {
      // Find the assignment and reset user role to 'user'
      const assignment = userAssignments.find(a => a.id === assignmentId);
      if (assignment) {
        const { error } = await supabase
          .from('custom_users')
          .update({ role: 'user' })
          .eq('id', assignment.user_id);

        if (error) throw error;
      }

      await fetchUserAssignments();
      
      toast({
        title: "Succes",
        description: "Rolle fjernet succesfuldt",
      });
    } catch (error: any) {
      toast({
        title: "Fejl",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getRoleIcon = (hierarchyLevel: number) => {
    if (hierarchyLevel <= 10) return Crown;
    if (hierarchyLevel <= 25) return Star;
    if (hierarchyLevel <= 40) return Shield;
    return Users;
  };

  const permissionsByCategory = permissions.reduce((acc, perm) => {
    if (!acc[perm.category]) acc[perm.category] = [];
    acc[perm.category].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  if (loading) {
    return (
      <Card className="p-6 bg-gaming-card border-gaming-border">
        <div className="text-center">
          <p className="text-foreground">Indlæser rolle administration...</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Shield className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Rolle & Tilladelser Administration</h1>
        </div>
        <Button onClick={() => {
          setEditingRole({});
          setShowRoleDialog(true);
        }} className="bg-primary hover:bg-primary/80">
          <Plus className="h-4 w-4 mr-2" />
          Opret Rolle
        </Button>
      </div>

      <Tabs defaultValue="roles" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-gaming-card border-gaming-border">
          <TabsTrigger value="roles" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Shield className="h-4 w-4 mr-2" />
            Roller
          </TabsTrigger>
          <TabsTrigger value="permissions" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Check className="h-4 w-4 mr-2" />
            Tilladelser
          </TabsTrigger>
          <TabsTrigger value="assignments" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Users className="h-4 w-4 mr-2" />
            Brugertildelinger
          </TabsTrigger>
        </TabsList>

        <TabsContent value="roles" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Roles List */}
            <Card className="p-6 bg-gaming-card border-gaming-border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">Tilgængelige Roller</h3>
                <Badge variant="outline" className="text-primary border-primary/50">
                  {roles.filter(r => r.is_active).length} aktive
                </Badge>
              </div>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {roles.filter(r => r.is_active).map((role) => {
                  const RoleIcon = getRoleIcon(role.hierarchy_level);
                  
                  return (
                    <div
                      key={role.id}
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        selectedRole?.id === role.id
                          ? 'border-primary bg-primary/10'
                          : 'border-gaming-border bg-gaming-darker/50 hover:bg-gaming-darker'
                      }`}
                      onClick={() => handleSelectRole(role)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 rounded-full" style={{ backgroundColor: `${role.color}20`, border: `2px solid ${role.color}` }}>
                            <RoleIcon className="h-4 w-4" style={{ color: role.color }} />
                          </div>
                          <div>
                            <h4 className="font-medium text-foreground">{role.display_name}</h4>
                            <p className="text-sm text-muted-foreground">Niveau {role.hierarchy_level}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingRole(role);
                              setShowRoleDialog(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-gaming-card border-gaming-border">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-foreground">Deaktiver Rolle</AlertDialogTitle>
                                <AlertDialogDescription className="text-muted-foreground">
                                  Er du sikker på, at du vil deaktivere rollen "{role.display_name}"?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuller</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteRole(role.id)}>
                                  Deaktiver
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                      {role.description && (
                        <p className="text-sm text-muted-foreground mt-2">{role.description}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Role Permissions */}
            {selectedRole && (
              <Card className="p-6 bg-gaming-card border-gaming-border">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-foreground">
                    Tilladelser for {selectedRole.display_name}
                  </h3>
                  <Button onClick={updateRolePermissions} size="sm">
                    <Save className="h-4 w-4 mr-2" />
                    Gem Ændringer
                  </Button>
                </div>
                
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {Object.entries(permissionsByCategory).map(([category, perms]) => (
                    <div key={category} className="space-y-2">
                      <h4 className="font-medium text-foreground capitalize">{category}</h4>
                      {perms.map((perm) => (
                        <div key={perm.name} className="flex items-start space-x-2 p-2 rounded border border-gaming-border/50">
                          <Switch
                            checked={rolePermissions.includes(perm.name)}
                            onCheckedChange={(checked) => {
                              setRolePermissions(prev =>
                                checked
                                  ? [...prev, perm.name]
                                  : prev.filter(p => p !== perm.name)
                              );
                            }}
                          />
                          <div>
                            <Label className="text-sm font-medium text-foreground">{perm.display_name}</Label>
                            <p className="text-xs text-muted-foreground">{perm.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          <Card className="p-6 bg-gaming-card border-gaming-border">
            <h3 className="text-lg font-semibold mb-4 text-foreground">System Tilladelser</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(permissionsByCategory).map(([category, perms]) => (
                <div key={category} className="space-y-3">
                  <h4 className="font-medium text-primary capitalize border-b border-gaming-border pb-2">{category}</h4>
                  <div className="space-y-2">
                    {perms.map((perm) => (
                      <div key={perm.name} className="p-3 rounded border border-gaming-border/50 bg-gaming-darker/30">
                        <h5 className="font-medium text-foreground text-sm">{perm.display_name}</h5>
                        <p className="text-xs text-muted-foreground">{perm.description}</p>
                        <Badge variant="outline" className="text-xs mt-1">{perm.name}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="assignments" className="space-y-4">
          <div className="flex justify-between items-center">
            <Badge variant="outline" className="text-primary border-primary/50">
              {userAssignments.length} tildelinger
            </Badge>
            
            <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Tildel Rolle
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg bg-gaming-card border-gaming-border">
                <DialogHeader>
                  <DialogTitle className="text-foreground">Tildel Rolle til Bruger</DialogTitle>
                  <DialogDescription className="text-muted-foreground">
                    Søg efter en bruger og tildel en rolle
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <Label className="text-foreground">Søg Bruger (email)</Label>
                    <div className="flex space-x-2">
                      <Input
                        value={userSearchQuery}
                        onChange={(e) => {
                          setUserSearchQuery(e.target.value);
                          searchUsers(e.target.value);
                        }}
                        placeholder="bruger@example.com"
                        className="bg-gaming-dark border-gaming-border text-foreground"
                      />
                      <Button onClick={() => searchUsers(userSearchQuery)}>
                        <Search className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {searchResults.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-foreground">Vælg Bruger og Rolle</Label>
                      {searchResults.map((user) => (
                        <div key={user.id} className="flex items-center justify-between p-2 bg-gaming-dark rounded border border-gaming-border">
                          <div>
                            <p className="text-foreground font-medium">{user.username || user.email}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                          <Select onValueChange={(roleId) => assignRole(user.id, roleId)}>
                            <SelectTrigger className="w-40 bg-gaming-darker border-gaming-border">
                              <SelectValue placeholder="Vælg rolle" />
                            </SelectTrigger>
                            <SelectContent className="bg-gaming-dark border-gaming-border">
                              {roles.filter(r => r.is_active).map((role) => (
                                <SelectItem key={role.id} value={role.id}>
                                  <span style={{ color: role.color }}>{role.display_name}</span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-2">
            {userAssignments.length === 0 ? (
              <Card className="p-8 bg-gaming-card border-gaming-border text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Ingen rolle tildelinger fundet</p>
              </Card>
            ) : (
              userAssignments.map((assignment) => {
                const RoleIcon = getRoleIcon(assignment.staff_roles.hierarchy_level);
                
                return (
                  <Card key={assignment.id} className="p-4 bg-gaming-dark border-gaming-border hover:border-primary/30 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 rounded-full" style={{ backgroundColor: `${assignment.staff_roles.color}20`, border: `2px solid ${assignment.staff_roles.color}` }}>
                          <RoleIcon className="h-4 w-4" style={{ color: assignment.staff_roles.color }} />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {assignment.profiles?.username || assignment.profiles?.email}
                          </p>
                          <p className="text-sm text-muted-foreground">{assignment.profiles?.email}</p>
                        </div>
                        <Badge 
                          variant="outline"
                          style={{ 
                            backgroundColor: `${assignment.staff_roles.color}20`, 
                            color: assignment.staff_roles.color, 
                            borderColor: assignment.staff_roles.color 
                          }}
                        >
                          {assignment.staff_roles.display_name}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span>Tildelt {new Date(assignment.assigned_at).toLocaleDateString('da-DK')}</span>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-gaming-card border-gaming-border">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-foreground">Fjern Rolle</AlertDialogTitle>
                              <AlertDialogDescription className="text-muted-foreground">
                                Er du sikker på, at du vil fjerne denne rolle fra brugeren?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuller</AlertDialogCancel>
                              <AlertDialogAction onClick={() => removeRoleAssignment(assignment.id)}>
                                Fjern Rolle
                              </AlertDialogAction>
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
        </TabsContent>
      </Tabs>

      {/* Create/Edit Role Dialog */}
      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent className="max-w-md bg-gaming-card border-gaming-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {editingRole.id ? 'Rediger Rolle' : 'Opret Ny Rolle'}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {editingRole.id ? 'Rediger rolle detaljer' : 'Opret en ny staff rolle'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label className="text-foreground">Rolle Navn</Label>
              <Input
                value={editingRole.display_name || ''}
                onChange={(e) => setEditingRole({ ...editingRole, display_name: e.target.value })}
                placeholder="f.eks. Senior Moderator"
                className="bg-gaming-dark border-gaming-border text-foreground"
              />
            </div>
            
            <div>
              <Label className="text-foreground">Beskrivelse</Label>
              <Textarea
                value={editingRole.description || ''}
                onChange={(e) => setEditingRole({ ...editingRole, description: e.target.value })}
                placeholder="Beskrivelse af rollen..."
                className="bg-gaming-dark border-gaming-border text-foreground"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-foreground">Farve</Label>
                <Input
                  type="color"
                  value={editingRole.color || '#6366f1'}
                  onChange={(e) => setEditingRole({ ...editingRole, color: e.target.value })}
                  className="bg-gaming-dark border-gaming-border h-10"
                />
              </div>
              
              <div>
                <Label className="text-foreground">Hierarki Niveau</Label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={editingRole.hierarchy_level || 50}
                  onChange={(e) => setEditingRole({ ...editingRole, hierarchy_level: parseInt(e.target.value) || 50 })}
                  placeholder="1-100"
                  className="bg-gaming-dark border-gaming-border text-foreground"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                checked={editingRole.is_active ?? true}
                onCheckedChange={(checked) => setEditingRole({ ...editingRole, is_active: checked })}
              />
              <Label className="text-foreground">Aktiv</Label>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowRoleDialog(false)}>
              Annuller
            </Button>
            <Button onClick={saveRole}>
              <Save className="h-4 w-4 mr-2" />
              {editingRole.id ? 'Gem' : 'Opret'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}