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
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Edit, Trash2, Save, X, Settings } from "lucide-react";
import { useCustomAuth } from "@/hooks/useCustomAuth";
import FormFieldEditor from "./FormFieldEditor";
import { ApplicationType, FormField } from "./applications/types";
import { ensureDiscordField } from "./applications/utils";

const ApplicationTypesManager = () => {
  const [applicationTypes, setApplicationTypes] = useState<ApplicationType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingType, setEditingType] = useState<ApplicationType | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newType, setNewType] = useState<Partial<ApplicationType>>({
    name: "",
    description: "",
    form_fields: [],
    required_permissions: [],
    is_active: true
  });
  const [availableRoles, setAvailableRoles] = useState<any[]>([]);
  const { user } = useCustomAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchApplicationTypes();
    fetchAvailableRoles();
  }, []);

  const fetchAvailableRoles = async () => {
    try {
      const { data, error } = await supabase
        .from('staff_roles')
        .select('id, name, display_name, description, color, hierarchy_level')
        .eq('is_active', true)
        .order('hierarchy_level', { ascending: true });

      if (error) throw error;
      setAvailableRoles(data || []);
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  const fetchApplicationTypes = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('application_types')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      console.log('Raw application types data:', data);
      console.log('Number of application types found:', data?.length || 0);
      
      const processedData = data?.map((item, index) => {
        console.log(`Processing item ${index}:`, item.name, 'form_fields type:', typeof item.form_fields);
        
        let formFields = [];
        try {
          if (Array.isArray(item.form_fields)) {
            formFields = (item.form_fields as any) as FormField[];
          } else if (typeof item.form_fields === 'string') {
            formFields = JSON.parse(item.form_fields);
          } else if (item.form_fields) {
            formFields = item.form_fields as unknown as FormField[];
          }
        } catch (parseError) {
          console.error(`Error parsing form_fields for ${item.name}:`, parseError);
          formFields = [];
        }
        
        return {
          ...item,
          form_fields: formFields,
          description: item.description || "",
          required_permissions: item.required_permissions || []
        };
      }) || [];
      
      console.log('Processed application types:', processedData);
      setApplicationTypes(processedData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch application types",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createApplicationType = async () => {
    try {
      let fields = newType.form_fields && newType.form_fields.length > 0 ? newType.form_fields : [];
      fields = ensureDiscordField(fields);
      
      const typeToInsert = {
        ...newType,
        form_fields: fields,
        created_by: user?.id
      };
      
      const { error } = await supabase
        .from('application_types')
        .insert([{
          name: typeToInsert.name || "",
          description: typeToInsert.description,
          form_fields: JSON.stringify(typeToInsert.form_fields),
          required_permissions: typeToInsert.required_permissions,
          is_active: typeToInsert.is_active,
          created_by: typeToInsert.created_by
        }]);

      if (error) throw error;
      
      await fetchApplicationTypes();
      setIsCreating(false);
      setNewType({
        name: "",
        description: "",
        form_fields: [],
        required_permissions: [],
        is_active: true
      });
      
      toast({
        title: "Success",
        description: "Application type created successfully",
      });
    } catch (error) {
      console.error('Failed to create application type:', error);
      toast({
        title: "Error",
        description: "Failed to create application type",
        variant: "destructive",
      });
    }
  };

  const updateApplicationType = async (typeId: string, updates: Partial<ApplicationType>) => {
    try {
      console.log('ApplicationTypesManager: Attempting to update application type with user role:', user?.role);
      console.log('ApplicationTypesManager: User ID:', user?.id);
      console.log('ApplicationTypesManager: Update data:', updates);
      
      if (updates.form_fields) {
        updates.form_fields = ensureDiscordField(updates.form_fields);
      }
      
      const updateData = {
        ...updates,
        form_fields: updates.form_fields ? JSON.stringify(updates.form_fields) : undefined
      };
      
      console.log('ApplicationTypesManager: Final update data:', updateData);
      
      const { error } = await supabase
        .from('application_types')
        .update(updateData)
        .eq('id', typeId);
        
      if (error) {
        console.error('ApplicationTypesManager: Update error:', error);
        throw error;
      }
      
      await fetchApplicationTypes();
      setEditingType(null);
      
      toast({
        title: "Success",
        description: "Application type updated successfully",
      });

      console.log('ApplicationTypesManager: Successfully updated application type');
    } catch (error) {
      console.error('ApplicationTypesManager: Failed to update application type:', error);
      toast({
        title: "Error", 
        description: "Failed to update application type",
        variant: "destructive",
      });
    }
  };

  const deleteApplicationType = async (typeId: string) => {
    try {
      console.log('ApplicationTypesManager: Attempting to delete application type with user role:', user?.role);
      console.log('ApplicationTypesManager: User ID:', user?.id);
      console.log('ApplicationTypesManager: Type ID to delete:', typeId);
      
      const { error } = await supabase
        .from('application_types')
        .delete()
        .eq('id', typeId);
        
      if (error) {
        console.error('ApplicationTypesManager: Delete error:', error);
        throw error;
      }
      
      await fetchApplicationTypes();
      
      toast({
        title: "Success",
        description: "Application type deleted successfully",
      });

      console.log('ApplicationTypesManager: Successfully deleted application type');
    } catch (error) {
      console.error('ApplicationTypesManager: Failed to delete application type:', error);
      toast({
        title: "Error",
        description: "Failed to delete application type", 
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-gaming-card border-gaming-border">
        <CardContent className="p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-blue mx-auto mb-4"></div>
            <p className="text-foreground">Loading application types...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gaming-card border-gaming-border">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Settings className="h-5 w-5 text-neon-blue" />
            <span>Application Types</span>
          </div>
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Type
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-gaming-card border-gaming-border">
              <DialogHeader>
                <DialogTitle className="text-foreground">Create Application Type</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Create a new type of application. Discord Username will always be required.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className="text-foreground">Name</Label>
                  <Input
                    value={newType.name || ""}
                    onChange={(e) => setNewType({ ...newType, name: e.target.value })}
                    placeholder="e.g., Staff, Whitelist, Police..."
                    className="bg-gaming-dark border-gaming-border text-foreground"
                  />
                </div>
                <div>
                  <Label className="text-foreground">Description</Label>
                  <Textarea
                    value={newType.description || ""}
                    onChange={(e) => setNewType({ ...newType, description: e.target.value })}
                    placeholder="Description of this application type..."
                    className="bg-gaming-dark border-gaming-border text-foreground"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={newType.is_active}
                    onCheckedChange={(checked) => setNewType({ ...newType, is_active: checked })}
                  />
                  <Label className="text-foreground">Active</Label>
                </div>

                <div>
                  <Label className="text-foreground">Required Staff Roles</Label>
                  <div className="space-y-2 mt-2 max-h-40 overflow-y-auto">
                    {availableRoles.map((role) => (
                      <div key={role.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`role-${role.id}`}
                          checked={newType.required_permissions?.includes(role.name)}
                          onCheckedChange={(checked) => {
                            const currentPerms = newType.required_permissions || [];
                            if (checked) {
                              setNewType({
                                ...newType,
                                required_permissions: [...currentPerms, role.name]
                              });
                            } else {
                              setNewType({
                                ...newType,
                                required_permissions: currentPerms.filter(p => p !== role.name)
                              });
                            }
                          }}
                        />
                        <Label 
                          htmlFor={`role-${role.id}`}
                          className="text-sm text-foreground cursor-pointer flex items-center gap-2"
                        >
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: role.color }}
                          />
                          {role.display_name}
                        </Label>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Only staff with these roles can see and handle applications of this type
                  </p>
                </div>
                
                <div className="p-4 bg-gaming-dark rounded border">
                  <p className="text-sm text-muted-foreground">
                    <b>Note:</b> Discord Username will always be included as a required field in all application types.
                  </p>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreating(false)}>Cancel</Button>
                <Button onClick={createApplicationType}>
                  <Save className="h-4 w-4 mr-2" />
                  Create Type
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="mb-4 p-3 bg-gaming-darker rounded-lg">
          <p className="text-xs text-muted-foreground">
            Debug: Found {applicationTypes.length} application types
          </p>
          <div className="text-xs text-muted-foreground mt-1">
            Types: {applicationTypes.map(t => `${t.name}(${t.is_active ? 'active' : 'inactive'})`).join(', ')}
          </div>
        </div>
        
        {applicationTypes.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No application types found</p>
        ) : (
          applicationTypes.map((type) => (
            <Card key={type.id} className="bg-gaming-dark border-gaming-border">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-medium text-foreground">{type.name}</h4>
                      {!type.is_active && (
                        <Badge variant="secondary" className="text-xs">Inactive</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{type.description}</p>
                    
                    <div className="text-xs text-muted-foreground mb-2">
                      <p className="font-medium mb-1">
                        Form Fields: 
                        <span className="ml-2 text-amber-400">
                          (Debug: {type.form_fields?.length || 0} fields, type: {typeof type.form_fields})
                        </span>
                      </p>
                      <ul className="space-y-1">
                        {Array.isArray(type.form_fields) && type.form_fields.length > 0 ? (
                          type.form_fields.map((field, index) => {
                            console.log(`Field ${index} for ${type.name}:`, field);
                            return (
                              <li key={`${type.id}-field-${index}`}>
                                - {field.label || field.key || 'Unnamed field'}
                                {field.id === "discord_name" && (
                                  <span className="ml-1 text-neon-blue font-semibold">(required, automatic)</span>
                                )}
                                {field.required && (
                                  <span className="ml-1 text-red-400 text-xs">*</span>
                                )}
                              </li>
                            );
                          })
                        ) : (
                          <li className="text-amber-400">
                            No fields found or invalid format. Raw data: {JSON.stringify(type.form_fields)}
                          </li>
                        )}
                      </ul>
                    </div>
                    
                    {type.required_permissions && type.required_permissions.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-medium text-foreground mb-1">Required Staff Roles:</p>
                        <div className="flex flex-wrap gap-1">
                          {type.required_permissions.map((roleName) => {
                            const role = availableRoles.find(r => r.name === roleName);
                            return (
                              <Badge key={roleName} variant="outline" className="text-xs flex items-center gap-1">
                                {role && (
                                  <div 
                                    className="w-2 h-2 rounded-full" 
                                    style={{ backgroundColor: role.color }}
                                  />
                                )}
                                {role?.display_name || roleName}
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline">
                          <Settings className="h-4 w-4 mr-2" />
                          Fields
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-gaming-card border-gaming-border">
                        <DialogHeader>
                          <DialogTitle className="text-foreground">Edit Form Fields - {type.name}</DialogTitle>
                          <DialogDescription>
                            Configure the form fields for this application type. Discord Username is always required.
                          </DialogDescription>
                        </DialogHeader>
                        <FormFieldEditor
                          applicationTypeId={type.id}
                          initialFields={type.form_fields || []}
                          onSave={(fields) => updateApplicationType(type.id, { form_fields: fields })}
                        />
                      </DialogContent>
                    </Dialog>
                    
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setEditingType(type)}
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
                          <AlertDialogTitle className="text-foreground">Delete Application Type</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this application type? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteApplicationType(type.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </CardContent>

      {editingType && (
        <Dialog open={!!editingType} onOpenChange={() => setEditingType(null)}>
          <DialogContent className="max-w-2xl bg-gaming-card border-gaming-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Edit Application Type</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Update the application type settings
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-foreground">Name</Label>
                <Input
                  value={editingType.name}
                  onChange={(e) => setEditingType({ ...editingType, name: e.target.value })}
                  className="bg-gaming-dark border-gaming-border text-foreground"
                />
              </div>
              <div>
                <Label className="text-foreground">Description</Label>
                <Textarea
                  value={editingType.description || ""}
                  onChange={(e) => setEditingType({ ...editingType, description: e.target.value })}
                  className="bg-gaming-dark border-gaming-border text-foreground"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={editingType.is_active}
                  onCheckedChange={(checked) => setEditingType({ ...editingType, is_active: checked })}
                />
                <Label className="text-foreground">Active</Label>
              </div>

              <div>
                <Label className="text-foreground">Required Staff Roles</Label>
                <div className="space-y-2 mt-2 max-h-40 overflow-y-auto">
                  {availableRoles.map((role) => (
                    <div key={role.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`edit-role-${role.id}`}
                        checked={editingType.required_permissions?.includes(role.name)}
                        onCheckedChange={(checked) => {
                          const currentPerms = editingType.required_permissions || [];
                          if (checked) {
                            setEditingType({
                              ...editingType,
                              required_permissions: [...currentPerms, role.name]
                            });
                          } else {
                            setEditingType({
                              ...editingType,
                              required_permissions: currentPerms.filter(p => p !== role.name)
                            });
                          }
                        }}
                      />
                      <Label 
                        htmlFor={`edit-role-${role.id}`}
                        className="text-sm text-foreground cursor-pointer flex items-center gap-2"
                      >
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: role.color }}
                        />
                        {role.display_name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setEditingType(null)}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={() => updateApplicationType(editingType.id, editingType)}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
};

export default ApplicationTypesManager;