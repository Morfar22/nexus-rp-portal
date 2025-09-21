import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import Navbar from "@/components/Navbar";
import { useCustomAuth } from "@/hooks/useCustomAuth";
import { useToast } from "@/hooks/use-toast";
import { useServerSettings } from "@/hooks/useServerSettings";
import { supabase } from "@/integrations/supabase/client";
import { Send, FileText, AlertCircle, CheckCircle, User, Clock, Star, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ApplicationForm = () => {
  const [applicationTypes, setApplicationTypes] = useState<any[]>([]);
  const [selectedType, setSelectedType] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasExistingApplication, setHasExistingApplication] = useState(false);
  const [formProgress, setFormProgress] = useState(0);
  const [validationErrors, setValidationErrors] = useState<any>({});
  const { user } = useCustomAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const { settings: serverSettings } = useServerSettings();
  const discordName = user?.username || "";

  useEffect(() => {
    if (user) {
      fetchApplicationTypes();
      checkExistingApplication();
    }
  }, [user]);

  useEffect(() => {
    calculateProgress();
  }, [formData, selectedType]);

  const calculateProgress = () => {
    if (!selectedType?.form_fields) {
      setFormProgress(0);
      return;
    }

    const requiredFields = selectedType.form_fields.filter((field: any) => field.required);
    const completedFields = requiredFields.filter((field: any) => {
      const fieldKey = field.key || field.id;
      return formData[fieldKey]?.trim();
    });

    const progress = requiredFields.length > 0 ? (completedFields.length / requiredFields.length) * 100 : 0;
    setFormProgress(Math.round(progress));
  };

  const fetchApplicationTypes = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('application_types')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setApplicationTypes(data || []);
    } catch (error) {
      toast({ title: "Error", description: "Failed to fetch application types", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const checkExistingApplication = async () => {
    try {
      const { data } = await supabase
        .from('applications')
        .select('*')
        .eq('user_id', user?.id)
        .eq('status', 'pending')
        .single();
      if (data) setHasExistingApplication(true);
    } catch {}
  };

  const handleTypeSelect = (typeId: string) => {
    const type = applicationTypes.find(t => t.id === typeId);
    setSelectedType(type);
    setValidationErrors({});

    const initialData: any = {};
    type?.form_fields?.forEach((field: any) => {
      const fieldKey = field.key || field.id;
      if (fieldKey === "discord_name") initialData[fieldKey] = discordName;
      else initialData[fieldKey] = '';
    });
    setFormData(initialData);
  };

  const handleFieldChange = (fieldId: string, value: string) => {
    if (fieldId === "discord_name") return;
    
    setFormData({ ...formData, [fieldId]: value });
    
    // Clear validation error for this field
    if (validationErrors[fieldId]) {
      setValidationErrors({ ...validationErrors, [fieldId]: null });
    }
  };

  const validateForm = () => {
    if (!selectedType) return false;
    
    const errors: any = {};
    let isValid = true;

    for (const field of selectedType.form_fields) {
      const fieldKey = field.key || field.id;
      const value = formData[fieldKey]?.trim();
      
      if (field.required && !value) {
        errors[fieldKey] = `${field.label} is required`;
        isValid = false;
      } else if (field.type === 'email' && value && !/\S+@\S+\.\S+/.test(value)) {
        errors[fieldKey] = 'Please enter a valid email address';
        isValid = false;
      } else if (field.type === 'number' && value && isNaN(Number(value))) {
        errors[fieldKey] = 'Please enter a valid number';
        isValid = false;
      }
    }

    setValidationErrors(errors);
    
    if (!isValid) {
      toast({ 
        title: "Validation Error", 
        description: "Please fix the errors in the form", 
        variant: "destructive" 
      });
    }
    
    return isValid;
  };

  const submitApplication = async () => {
    if (!validateForm()) return;
    
    try {
      setIsSubmitting(true);
      
      const submission = {
        user_id: user.id,
        application_type_id: selectedType.id,
        status: "pending",
        form_data: formData,
        discord_name: discordName
      };
      
      const { error } = await supabase.from('applications').insert(submission);
      if (error) throw error;

      // Send email notification
      try {
        await supabase.functions.invoke('send-application-email', {
          body: {
            applicationId: 'temp-submission-id',
            templateType: 'application_submitted',
            recipientEmail: user.email,
            applicantName: formData.karakternavn || user.username || 'Applicant',
            applicationType: selectedType.name,
            discordName: discordName,
            steamName: formData.steam_name || '',
            fivemName: formData.fivem_name || ''
          }
        });
      } catch (emailError) {
        console.error('Error sending email:', emailError);
      }

      // Send Discord notification
      try {
        await supabase.functions.invoke('discord-logger', {
          body: {
            type: 'application_submitted',
            data: {
              user_id: user.id,
              application_type: selectedType.name,
              applicant_name: formData.karakternavn || user.username || 'Applicant',
              discord_name: discordName,
              form_data: formData
            }
          }
        });
      } catch (discordError) {
        console.error('Error sending Discord notification:', discordError);
      }

      toast({ 
        title: "Application Submitted!", 
        description: "Your application has been submitted successfully. You'll receive updates via email." 
      });
      navigate('/');
    } catch (error) {
      toast({ 
        title: "Submission Failed", 
        description: "Failed to submit application. Please try again.", 
        variant: "destructive" 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFieldIcon = (fieldType: string) => {
    switch (fieldType) {
      case 'text': return User;
      case 'email': return User;
      case 'textarea': return FileText;
      default: return FileText;
    }
  };

  const renderFormField = (field: any) => {
    const fieldKey = field.key || field.id;
    const value = formData[fieldKey] || '';
    const hasError = validationErrors[fieldKey];
    const FieldIcon = getFieldIcon(field.type);

    if (fieldKey === "discord_name") {
      return (
        <div className="relative">
          <div className="absolute left-3 top-3 z-10">
            <User className="h-4 w-4 text-neon-blue" />
          </div>
          <Input 
            value={discordName} 
            disabled 
            className="pl-10 bg-gaming-dark/50 border-gaming-border text-foreground"
          />
          <Badge className="absolute right-2 top-2 bg-neon-blue/20 text-neon-blue border-neon-blue">
            Auto-filled
          </Badge>
        </div>
      );
    }

    const baseInputClasses = `pl-10 bg-gaming-dark border-gaming-border text-foreground transition-all duration-200 ${
      hasError ? 'border-red-400 focus:border-red-400' : 'focus:border-neon-blue'
    }`;

    switch (field.type) {
      case 'text':
      case 'email':
      case 'number':
        return (
          <div className="relative">
            <div className="absolute left-3 top-3 z-10">
              <FieldIcon className={`h-4 w-4 ${hasError ? 'text-red-400' : 'text-muted-foreground'}`} />
            </div>
            <Input
              type={field.type}
              value={value}
              onChange={e => handleFieldChange(fieldKey, e.target.value)}
              placeholder={`Enter your ${field.label.toLowerCase()}...`}
              className={baseInputClasses}
              required={field.required}
            />
          </div>
        );
      case 'textarea':
        return (
          <div className="relative">
            <div className="absolute left-3 top-3 z-10">
              <FieldIcon className={`h-4 w-4 ${hasError ? 'text-red-400' : 'text-muted-foreground'}`} />
            </div>
            <Textarea
              value={value}
              onChange={e => handleFieldChange(fieldKey, e.target.value)}
              placeholder={`Enter your ${field.label.toLowerCase()}...`}
              className={`pl-10 bg-gaming-dark border-gaming-border text-foreground min-h-[120px] ${
                hasError ? 'border-red-400 focus:border-red-400' : 'focus:border-neon-blue'
              }`}
              required={field.required}
            />
          </div>
        );
      case 'select':
        return (
          <Select value={value} onValueChange={val => handleFieldChange(fieldKey, val)}>
            <SelectTrigger className={baseInputClasses}>
              <SelectValue placeholder={`Select ${field.label.toLowerCase()}...`} />
            </SelectTrigger>
            <SelectContent className="bg-gaming-card border-gaming-border">
              {field.options?.map((option: any) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      default:
        return (
          <div className="relative">
            <div className="absolute left-3 top-3 z-10">
              <FieldIcon className={`h-4 w-4 ${hasError ? 'text-red-400' : 'text-muted-foreground'}`} />
            </div>
            <Input
              value={value}
              onChange={e => handleFieldChange(fieldKey, e.target.value)}
              placeholder={`Enter your ${field.label.toLowerCase()}...`}
              className={baseInputClasses}
              required={field.required}
            />
          </div>
        );
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gaming-dark flex flex-col">
        <Navbar />
        <div className="flex-1 container mx-auto px-4 py-8 flex items-center justify-center">
          <Card className="max-w-md w-full bg-gaming-card border-gaming-border">
            <CardHeader className="text-center">
              <Shield className="h-12 w-12 mx-auto mb-4 text-neon-blue" />
              <CardTitle className="text-foreground">Authentication Required</CardTitle>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>You must be logged in to submit an application.</AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (hasExistingApplication && !serverSettings?.application_settings?.multiple_applications_allowed) {
    return (
      <div className="min-h-screen bg-gaming-dark flex flex-col">
        <Navbar />
        <div className="flex-1 container mx-auto px-4 py-8 flex items-center justify-center">
          <Card className="max-w-md w-full bg-gaming-card border-gaming-border">
            <CardHeader className="text-center">
              <Clock className="h-12 w-12 mx-auto mb-4 text-amber-400" />
              <CardTitle className="text-foreground">Application Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  You already have a pending application. Please wait for it to be reviewed before submitting another.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gaming-dark">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-4">
              Submit Application
            </h1>
            <p className="text-muted-foreground text-lg">
              Join our community by filling out the application form below
            </p>
          </div>

          {/* Progress Bar */}
          {selectedType && (
            <Card className="mb-6 bg-gaming-card border-gaming-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">Application Progress</span>
                  <span className="text-sm text-muted-foreground">{formProgress}% Complete</span>
                </div>
                <Progress value={formProgress} className="h-2" />
              </CardContent>
            </Card>
          )}

          {isLoading ? (
            <Card className="p-8 bg-gaming-card border-gaming-border">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-blue mx-auto mb-4"></div>
                <p className="text-foreground">Loading application types...</p>
              </div>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Application Type Selection */}
              <Card className="bg-gaming-card border-gaming-border">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="h-5 w-5 text-neon-blue" />
                    <span>Choose Application Type</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {applicationTypes.length === 0 ? (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>No application types are currently available.</AlertDescription>
                    </Alert>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                      {applicationTypes.map((type) => (
                        <Card
                          key={type.id}
                          className={`cursor-pointer transition-all duration-200 hover:scale-105 ${
                            selectedType?.id === type.id
                              ? 'border-neon-blue bg-neon-blue/10 shadow-lg shadow-neon-blue/20'
                              : 'border-gaming-border hover:border-gaming-border/60 bg-gaming-dark'
                          }`}
                          onClick={() => handleTypeSelect(type.id)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="font-semibold text-foreground">{type.name}</h3>
                              {selectedType?.id === type.id && (
                                <CheckCircle className="h-5 w-5 text-neon-blue" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">{type.description}</p>
                            <div className="flex items-center space-x-2">
                              <Star className="h-4 w-4 text-amber-400" />
                              <span className="text-xs text-muted-foreground">
                                {type.form_fields?.length || 0} fields
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Application Form */}
              {selectedType && (
                <Card className="bg-gaming-card border-gaming-border">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <FileText className="h-5 w-5 text-neon-green" />
                      <span>{selectedType.name} Application</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {selectedType.form_fields?.map((field: any, index: number) => (
                      <div key={field.key || field.id || index} className="space-y-2">
                        <Label className="text-foreground font-medium flex items-center space-x-2">
                          <span>{field.label}</span>
                          {field.required && <span className="text-red-400">*</span>}
                        </Label>
                        {renderFormField(field)}
                        {validationErrors[field.key || field.id] && (
                          <p className="text-red-400 text-sm flex items-center space-x-1">
                            <AlertCircle className="h-3 w-3" />
                            <span>{validationErrors[field.key || field.id]}</span>
                          </p>
                        )}
                      </div>
                    ))}

                    <div className="pt-6 border-t border-gaming-border">
                      <Button
                        onClick={submitApplication}
                        disabled={isSubmitting || formProgress < 100}
                        className="w-full bg-gradient-primary hover:opacity-90 text-white font-semibold py-3"
                        size="lg"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Submitting Application...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            Submit Application
                          </>
                        )}
                      </Button>
                      {formProgress < 100 && (
                        <p className="text-center text-sm text-muted-foreground mt-2">
                          Please complete all required fields to submit
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApplicationForm;
