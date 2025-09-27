import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useCustomAuth } from "@/hooks/useCustomAuth";
import { Plus } from "lucide-react";

interface ApplicationType {
  id: string;
  name: string;
  form_fields: any;
}

interface CreateApplicationDialogProps {
  onApplicationCreated: () => void;
}

export const CreateApplicationDialog = ({ onApplicationCreated }: CreateApplicationDialogProps) => {
  const [open, setOpen] = useState(false);
  const [applicationTypes, setApplicationTypes] = useState<ApplicationType[]>([]);
  const [selectedType, setSelectedType] = useState<string>("");
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useCustomAuth();

  useEffect(() => {
    if (open) {
      fetchApplicationTypes();
    }
  }, [open]);

  const fetchApplicationTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('application_types')
        .select('id, name, form_fields')
        .eq('is_active', true);

      if (error) throw error;
      setApplicationTypes(data || []);
    } catch (error) {
      console.error('Error fetching application types:', error);
      toast({
        title: "Error",
        description: "Failed to fetch application types",
        variant: "destructive",
      });
    }
  };

  const handleTypeChange = (typeId: string) => {
    setSelectedType(typeId);
    const type = applicationTypes.find(t => t.id === typeId);
    if (type?.form_fields) {
      const initialData: Record<string, any> = {};
      const formFields = Array.isArray(type.form_fields) ? type.form_fields : [];
      formFields.forEach((field: any) => {
        initialData[field.name || field.key] = '';
      });
      setFormData(initialData);
    }
  };

  const handleSubmit = async () => {
    if (!selectedType || !user) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('applications')
        .insert({
          user_id: user.id,
          application_type_id: selectedType,
          form_data: formData,
          discord_name: formData.discord_name || '',
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Application Created",
        description: "Staff application has been created successfully",
      });

      setOpen(false);
      setSelectedType("");
      setFormData({});
      onApplicationCreated();
    } catch (error) {
      console.error('Error creating application:', error);
      toast({
        title: "Error",
        description: "Failed to create application",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const selectedTypeData = applicationTypes.find(t => t.id === selectedType);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-neon-blue hover:bg-neon-blue/80">
          <Plus className="h-4 w-4 mr-2" />
          Create Application
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-gaming-card border-gaming-border">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Plus className="h-5 w-5 text-neon-blue" />
            <span>Create New Application</span>
          </DialogTitle>
          <DialogDescription>
            Create an application as staff member
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label className="text-foreground">Application Type</Label>
            <Select value={selectedType} onValueChange={handleTypeChange}>
              <SelectTrigger className="bg-gaming-dark border-gaming-border">
                <SelectValue placeholder="Select application type" />
              </SelectTrigger>
              <SelectContent className="bg-gaming-dark border-gaming-border">
                {applicationTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedTypeData && selectedTypeData.form_fields && (
            <Card className="bg-gaming-dark border-gaming-border">
              <CardHeader>
                <CardTitle className="text-sm">Application Fields</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Array.isArray(selectedTypeData.form_fields) ? selectedTypeData.form_fields.map((field: any, index: number) => {
                  const fieldName = field.name || field.key || `field_${index}`;
                  const fieldLabel = field.label || fieldName.replace(/_/g, ' ');
                  
                  return (
                    <div key={fieldName} className="space-y-2">
                      <Label className="text-foreground capitalize">
                        {fieldLabel}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      {field.type === 'textarea' ? (
                        <Textarea
                          value={formData[fieldName] || ''}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            [fieldName]: e.target.value
                          }))}
                          placeholder={field.placeholder || `Enter ${fieldLabel.toLowerCase()}`}
                          className="bg-gaming-card border-gaming-border text-foreground"
                        />
                      ) : field.type === 'select' && field.options ? (
                        <Select
                          value={formData[fieldName] || ''}
                          onValueChange={(value) => setFormData(prev => ({
                            ...prev,
                            [fieldName]: value
                          }))}
                        >
                          <SelectTrigger className="bg-gaming-card border-gaming-border">
                            <SelectValue placeholder={field.placeholder || `Select ${fieldLabel.toLowerCase()}`} />
                          </SelectTrigger>
                          <SelectContent>
                            {field.options.map((option: string, optIndex: number) => (
                              <SelectItem key={optIndex} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          type={field.type || 'text'}
                          value={formData[fieldName] || ''}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            [fieldName]: e.target.value
                          }))}
                          placeholder={field.placeholder || `Enter ${fieldLabel.toLowerCase()}`}
                          className="bg-gaming-card border-gaming-border text-foreground"
                        />
                      )}
                    </div>
                  );
                }) : (
                  <p className="text-muted-foreground text-sm">No form fields configured for this application type.</p>
                )}
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!selectedType || isLoading}
              className="bg-neon-blue hover:bg-neon-blue/80"
            >
              {isLoading ? 'Creating...' : 'Create Application'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};