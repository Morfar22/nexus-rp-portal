import { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  Crown, 
  Shield, 
  Star, 
  Users, 
  Settings, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X,
  Lock,
  Unlock,
  Eye,
  FileText,
  Database,
  MessageSquare,
  Zap,
  BarChart,
  UserCheck
} from "lucide-react";

interface StaffRole {
  id: string;
  name: string;
  display_name: string;
  description: string;
  color: string;
  hierarchy_level: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
}

interface Permission {
  id: string;
  name: string;
  display_name: string;
  description: string;
  category: string;
}

interface RolePermission {
  role_id: string;
  permission_id: string;
  permission_name: string;
}

interface UserRoleAssignment {
  id: string;
  user_id: string;
  role_id: string;
  assigned_at: string;
  assigned_by: string;
  expires_at?: string;
  is_active: boolean;
  display_name: string;
  color: string;
  hierarchy_level: number;
  username?: string;
  email?: string;
}

const CustomRoleManager = () => {
  const [staffRoles, setStaffRoles] = useState<StaffRole[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
  const [userRoleAssignments, setUserRoleAssignments] = useState<UserRoleAssignment[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<StaffRole | null>(null);
  const [isCreatingRole, setIsCreatingRole] = useState(false);
  const [isEditingRole, setIsEditingRole] = useState(false);
  const [isAssigningRole, setIsAssigningRole] = useState(false);
  
  const [newRole, setNewRole] = useState({
    name: '',
    display_name: '',
    description: '',
    color: '#7c3aed',
    hierarchy_level: 10
  });

  const [assignRole, setAssignRole] = useState({
    user_id: '',
    role_id: '',
    expires_at: ''
  });

  const { toast } = useToast();

  // Permission categories for better organization
  const permissionCategories = {
    'users': { icon: Users, label: 'Brugeradministration', color: 'text-blue-500' },
    'applications': { icon: FileText, label: 'Ansøgninger', color: 'text-green-500' },
    'rules': { icon: Shield, label: 'Regler & Love', color: 'text-red-500' },
    'partners': { icon: Star, label: 'Partnere', color: 'text-yellow-500' },
    'packages': { icon: Database, label: 'Pakker', color: 'text-purple-500' },
    'homepage': { icon: Eye, label: 'Hjemmeside', color: 'text-indigo-500' },
    'staff': { icon: Crown, label: 'Staff Management', color: 'text-orange-500' },
    'server': { icon: Settings, label: 'Server Management', color: 'text-gray-500' },
    'settings': { icon: Settings, label: 'Indstillinger', color: 'text-teal-500' },
    'logs': { icon: BarChart, label: 'Logs & Analytics', color: 'text-pink-500' },
    'security': { icon: Lock, label: 'Sikkerhed', color: 'text-red-600' },
    'chat': { icon: MessageSquare, label: 'Live Chat', color: 'text-blue-600' },
    'emails': { icon: MessageSquare, label: 'E-mails', color: 'text-cyan-500' },
    'discord': { icon: MessageSquare, label: 'Discord', color: 'text-indigo-600' },
    'analytics': { icon: BarChart, label: 'Analytics', color: 'text-green-600' },
    'reports': { icon: FileText, label: 'Rapporter', color: 'text-orange-600' },
    'design': { icon: Eye, label: 'Design', color: 'text-purple-600' },
    'navbar': { icon: Settings, label: 'Navigation', color: 'text-gray-600' },
    'social': { icon: Users, label: 'Sociale Medier', color: 'text-blue-700' },
    'roles': { icon: Crown, label: 'Roller', color: 'text-red-700' },
    'content': { icon: FileText, label: 'Indhold', color: 'text-green-700' },
    'moderation': { icon: Shield, label: 'Moderation', color: 'text-yellow-700' },
    'system': { icon: Zap, label: 'System', color: 'text-purple-700' }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchStaffRoles(),
        fetchPermissions(),
        fetchRolePermissions(),
        fetchUserRoleAssignments(),
        fetchUsers()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Fejl",
        description: "Kunne ikke hente data. Prøv igen.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStaffRoles = async () => {
    const { data, error } = await supabase.functions.invoke('custom-role-management', {
      body: { action: 'get_staff_roles' }
    });
    if (error) throw error;
    setStaffRoles(data || []);
  };

  const fetchPermissions = async () => {
    const { data, error } = await supabase.functions.invoke('custom-role-management', {
      body: { action: 'get_permissions' }
    });
    if (error) throw error;
    setPermissions(data || []);
  };

  const fetchRolePermissions = async () => {
    if (!selectedRole) return;
    
    const { data, error } = await supabase.functions.invoke('custom-role-management', {
      body: { action: 'get_role_permissions', roleId: selectedRole.id }
    });
    if (error) throw error;
    setRolePermissions(data || []);
  };

  const fetchUserRoleAssignments = async () => {
    const { data, error } = await supabase.functions.invoke('custom-role-management', {
      body: { action: 'get_user_role_assignments' }
    });
    if (error) throw error;
    setUserRoleAssignments(data || []);
  };

  const fetchUsers = async () => {
    const { data, error } = await supabase.functions.invoke('custom-role-management', {
      body: { action: 'get_user_data' }
    });
    if (error) throw error;
    setUsers(data || []);
  };

  const createRole = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('custom-role-management', {
        body: { 
          action: 'create_role', 
          data: newRole
        }
      });

      if (error) throw error;

      setStaffRoles([...staffRoles, data]);
      setNewRole({
        name: '',
        display_name: '',
        description: '',
        color: '#7c3aed',
        hierarchy_level: 10
      });
      setIsCreatingRole(false);

      toast({
        title: "Rolle oprettet",
        description: `Rollen "${newRole.display_name}" er blevet oprettet.`,
      });
    } catch (error: any) {
      toast({
        title: "Fejl",
        description: `Kunne ikke oprette rolle: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const updateRole = async (role: StaffRole) => {
    try {
      const { data, error } = await supabase.functions.invoke('custom-role-management', {
        body: { 
          action: 'update_role', 
          data: role
        }
      });

      if (error) throw error;

      setStaffRoles(staffRoles.map(r => r.id === role.id ? role : r));
      
      toast({
        title: "Rolle opdateret",
        description: `Rollen "${role.display_name}" er blevet opdateret.`,
      });
    } catch (error: any) {
      toast({
        title: "Fejl",
        description: `Kunne ikke opdatere rolle: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const deleteRole = async (roleId: string) => {
    try {
      const { error } = await supabase.functions.invoke('custom-role-management', {
        body: { 
          action: 'delete_role', 
          roleId: roleId
        }
      });

      if (error) throw error;

      setStaffRoles(staffRoles.filter(r => r.id !== roleId));
      
      toast({
        title: "Rolle slettet",
        description: "Rollen er blevet slettet permanent.",
      });
    } catch (error: any) {
      toast({
        title: "Fejl",
        description: `Kunne ikke slette rolle: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const updateRolePermissions = async (roleId: string, permissionIds: string[]) => {
    try {
      const { error } = await supabase.functions.invoke('custom-role-management', {
        body: { 
          action: 'update_role_permissions',
          roleId: roleId,
          permissionIds: permissionIds
        }
      });

      if (error) throw error;

      // Refresh role permissions
      await fetchRolePermissions();

      toast({
        title: "Tilladelser opdateret",
        description: "Rolletilladelser er blevet opdateret.",
      });
    } catch (error: any) {
      toast({
        title: "Fejl",
        description: `Kunne ikke opdatere tilladelser: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const assignRoleToUser = async () => {
    try {
      const { error } = await supabase.functions.invoke('custom-role-management', {
        body: { 
          action: 'assign_role_to_user',
          data: {
            user_id: assignRole.user_id,
            role_id: assignRole.role_id,
            expires_at: assignRole.expires_at || null
          }
        }
      });

      if (error) throw error;

      await fetchUserRoleAssignments();
      setAssignRole({ user_id: '', role_id: '', expires_at: '' });
      setIsAssigningRole(false);

      toast({
        title: "Rolle tildelt",
        description: "Rollen er blevet tildelt brugeren.",
      });
    } catch (error: any) {
      toast({
        title: "Fejl",
        description: `Kunne ikke tildele rolle: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const removeUserRole = async (assignmentId: string) => {
    try {
      const { error } = await supabase.functions.invoke('custom-role-management', {
        body: { 
          action: 'remove_user_role',
          assignmentId: assignmentId
        }
      });

      if (error) throw error;

      await fetchUserRoleAssignments();

      toast({
        title: "Rolle fjernet",
        description: "Rollen er blevet fjernet fra brugeren.",
      });
    } catch (error: any) {
      toast({
        title: "Fejl",
        description: `Kunne ikke fjerne rolle: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const getRolePermissions = (roleId: string) => {
    return rolePermissions.filter(rp => rp.role_id === roleId);
  };

  const groupPermissionsByCategory = () => {
    const grouped: { [key: string]: Permission[] } = {};
    permissions.forEach(permission => {
      const category = permission.category || 'other';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(permission);
    });
    return grouped;
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
          <div className="space-y-2">
            <div className="h-16 bg-muted rounded"></div>
            <div className="h-16 bg-muted rounded"></div>
            <div className="h-16 bg-muted rounded"></div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Crown className="h-6 w-6 text-yellow-500" />
            <h2 className="text-2xl font-bold text-foreground">Staff & Rolle Management</h2>
          </div>
          <Button onClick={() => setIsCreatingRole(true)} className="bg-primary hover:bg-primary/80">
            <Plus className="h-4 w-4 mr-2" />
            Ny Rolle
          </Button>
        </div>

        <Tabs defaultValue="roles" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="roles">Roller</TabsTrigger>
            <TabsTrigger value="permissions">Tilladelser</TabsTrigger>
            <TabsTrigger value="assignments">Tildeling</TabsTrigger>
          </TabsList>

          <TabsContent value="roles" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {staffRoles.map((role) => (
                <Card key={role.id} className="p-4 hover:shadow-lg transition-shadow">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Badge 
                        style={{ backgroundColor: role.color + '20', color: role.color, borderColor: role.color + '50' }}
                        className="px-2 py-1"
                      >
                        {role.display_name}
                      </Badge>
                      <div className="flex items-center space-x-1">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setSelectedRole(role);
                            setIsEditingRole(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => deleteRole(role.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground">{role.description}</p>
                      <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                        <span>Hierarki: {role.hierarchy_level}</span>
                        <span>{role.is_active ? 'Aktiv' : 'Inaktiv'}</span>
                      </div>
                    </div>

                    <div className="text-xs">
                      <span className="font-medium">Tilladelser: </span>
                      <span>{getRolePermissions(role.id).length}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="permissions" className="space-y-4">
            {selectedRole ? (
              <RolePermissionsEditor 
                role={selectedRole}
                permissions={permissions}
                rolePermissions={getRolePermissions(selectedRole.id)}
                permissionCategories={permissionCategories}
                onUpdatePermissions={updateRolePermissions}
                onClose={() => setSelectedRole(null)}
              />
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Vælg en rolle fra "Roller" fanen for at redigere tilladelser</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="assignments" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Rolletildelinger</h3>
              <Button onClick={() => setIsAssigningRole(true)} variant="outline">
                <UserCheck className="h-4 w-4 mr-2" />
                Tildel Rolle
              </Button>
            </div>

            <div className="space-y-2">
              {userRoleAssignments.map((assignment) => {
                return (
                  <Card key={assignment.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div>
                          <p className="font-medium">{assignment.username || 'Ukendt bruger'}</p>
                          <p className="text-sm text-muted-foreground">{assignment.email || 'Ukendt email'}</p>
                        </div>
                        <Badge 
                          style={{ 
                            backgroundColor: assignment.color + '20', 
                            color: assignment.color, 
                            borderColor: assignment.color + '50' 
                          }}
                        >
                          {assignment.display_name}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-muted-foreground">
                          Tildelt: {new Date(assignment.assigned_at).toLocaleDateString()}
                        </span>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => removeUserRole(assignment.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </Card>

      {/* Create Role Dialog */}
      <Dialog open={isCreatingRole} onOpenChange={setIsCreatingRole}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Opret Ny Rolle</DialogTitle>
            <DialogDescription>
              Opret en ny custom rolle med specifikke tilladelser.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Rolle navn (system)</Label>
              <Input
                id="name"
                value={newRole.name}
                onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                placeholder="fx. senior_moderator"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="display_name">Visningsnavn</Label>
              <Input
                id="display_name"
                value={newRole.display_name}
                onChange={(e) => setNewRole({ ...newRole, display_name: e.target.value })}
                placeholder="fx. Senior Moderator"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Beskrivelse</Label>
              <Textarea
                id="description"
                value={newRole.description}
                onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                placeholder="Beskrivelse af rollens ansvar..."
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="color">Farve</Label>
                <Input
                  id="color"
                  type="color"
                  value={newRole.color}
                  onChange={(e) => setNewRole({ ...newRole, color: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="hierarchy">Hierarki Level</Label>
                <Input
                  id="hierarchy"
                  type="number"
                  value={newRole.hierarchy_level}
                  onChange={(e) => setNewRole({ ...newRole, hierarchy_level: parseInt(e.target.value) })}
                  min="1"
                  max="100"
                />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 mt-6">
            <Button variant="outline" onClick={() => setIsCreatingRole(false)}>
              Annuller
            </Button>
            <Button onClick={createRole}>
              Opret Rolle
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Role Dialog */}
      <Dialog open={isAssigningRole} onOpenChange={setIsAssigningRole}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tildel Rolle</DialogTitle>
            <DialogDescription>
              Tildel en rolle til en bruger.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="user">Bruger</Label>
              <Select value={assignRole.user_id} onValueChange={(value) => setAssignRole({ ...assignRole, user_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Vælg bruger" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.username} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="role">Rolle</Label>
              <Select value={assignRole.role_id} onValueChange={(value) => setAssignRole({ ...assignRole, role_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Vælg rolle" />
                </SelectTrigger>
                <SelectContent>
                  {staffRoles.filter(role => role.is_active).map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="expires">Udløber (valgfrit)</Label>
              <Input
                id="expires"
                type="datetime-local"
                value={assignRole.expires_at}
                onChange={(e) => setAssignRole({ ...assignRole, expires_at: e.target.value })}
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 mt-6">
            <Button variant="outline" onClick={() => setIsAssigningRole(false)}>
              Annuller
            </Button>
            <Button onClick={assignRoleToUser}>
              Tildel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Component for editing role permissions
const RolePermissionsEditor = ({ 
  role, 
  permissions, 
  rolePermissions, 
  permissionCategories,
  onUpdatePermissions, 
  onClose 
}: {
  role: StaffRole;
  permissions: Permission[];
  rolePermissions: RolePermission[];
  permissionCategories: any;
  onUpdatePermissions: (roleId: string, permissionIds: string[]) => void;
  onClose: () => void;
}) => {
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(
    rolePermissions.map(rp => rp.permission_id)
  );

  const groupedPermissions = permissions.reduce((acc, permission) => {
    const category = permission.category || 'other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(permission);
    return acc;
  }, {} as { [key: string]: Permission[] });

  const handlePermissionToggle = (permissionId: string) => {
    setSelectedPermissions(prev => 
      prev.includes(permissionId)
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const handleSave = () => {
    onUpdatePermissions(role.id, selectedPermissions);
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Badge 
            style={{ backgroundColor: role.color + '20', color: role.color, borderColor: role.color + '50' }}
            className="px-3 py-1"
          >
            {role.display_name}
          </Badge>
          <span className="text-muted-foreground">- Tilladelser</span>
        </div>
        <div className="flex space-x-2">
          <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
            <Save className="h-4 w-4 mr-2" />
            Gem
          </Button>
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Luk
          </Button>
        </div>
      </div>

      <ScrollArea className="h-96">
        <div className="space-y-6">
          {Object.entries(groupedPermissions).map(([category, categoryPermissions]) => {
            const categoryInfo = permissionCategories[category] || { 
              icon: Settings, 
              label: category, 
              color: 'text-gray-500' 
            };
            const IconComponent = categoryInfo.icon;

            return (
              <div key={category} className="space-y-3">
                <div className="flex items-center space-x-2 pb-2 border-b">
                  <IconComponent className={`h-5 w-5 ${categoryInfo.color}`} />
                  <h4 className="font-semibold text-foreground">{categoryInfo.label}</h4>
                  <Badge variant="secondary" className="ml-auto">
                    {categoryPermissions.filter(p => selectedPermissions.includes(p.id)).length}/{categoryPermissions.length}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {categoryPermissions.map((permission) => (
                    <div key={permission.id} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                      <Checkbox
                        id={permission.id}
                        checked={selectedPermissions.includes(permission.id)}
                        onCheckedChange={() => handlePermissionToggle(permission.id)}
                      />
                      <div className="space-y-1 flex-1">
                        <Label htmlFor={permission.id} className="text-sm font-medium cursor-pointer">
                          {permission.display_name}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {permission.description}
                        </p>
                        <code className="text-xs bg-muted px-1 rounded">
                          {permission.name}
                        </code>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </Card>
  );
};

export default CustomRoleManager;