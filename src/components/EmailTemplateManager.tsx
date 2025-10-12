import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Mail, Save, Eye, AlertCircle } from 'lucide-react';

interface EmailTemplate {
  id: string;
  template_type: string;
  subject: string;
  body: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const EmailTemplateManager = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const templateTypes = [
    { 
      key: 'application_submitted', 
      label: 'Application Submitted', 
      description: 'Sent when someone submits an application',
      defaultSubject: 'Application Received - {{server_name}}',
      defaultBody: `Hello {{applicant_name}},

Thank you for submitting your application for {{application_type}} at {{server_name}}.

We have received your application and our team will review it shortly. You should hear back from us within 48 hours.

Application Details:
- Discord: {{discord_name}}
- Steam: {{steam_name}}
- FiveM: {{fivem_name}}
- Submitted: {{today_date}}

If you have any questions in the meantime, feel free to reach out to us on Discord.

Best regards,
{{server_name}} Team`
    },
    { 
      key: 'application_accepted', 
      label: 'Application Accepted', 
      description: 'Sent when an application is approved',
      defaultSubject: '🎉 Application Approved - Welcome to {{server_name}}!',
      defaultBody: `Congratulations {{applicant_name}}!

We are pleased to inform you that your application for {{application_type}} has been APPROVED!

Welcome to {{server_name}}! You can now join our server and start your adventure.

{{#if review_notes}}
Staff Notes: {{review_notes}}
{{/if}}

Next Steps:
1. Join our Discord server if you haven't already
2. Read our server rules carefully
3. Connect to the FiveM server and start playing!

We look forward to seeing you in the city!

Best regards,
{{server_name}} Team`
    },
    { 
      key: 'application_denied', 
      label: 'Application Denied', 
      description: 'Sent when an application is rejected',
      defaultSubject: 'Application Update - {{server_name}}',
      defaultBody: `Hello {{applicant_name}},

Thank you for your interest in {{application_type}} at {{server_name}}.

Unfortunately, after careful review, we are unable to approve your application at this time.

{{#if review_notes}}
Feedback: {{review_notes}}
{{/if}}

You are welcome to reapply in the future. Please take the staff feedback into consideration and feel free to reach out if you have any questions.

We appreciate your understanding.

Best regards,
{{server_name}} Team`
    }
  ];

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .order('template_type');

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast({
        title: "Error",
        description: "Failed to load email templates",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateTemplate = async (templateType: string, subject: string, body: string) => {
    setSaving(true);
    try {
      // Use upsert to either update existing or create new template
      const { error } = await supabase
        .from('email_templates')
        .upsert({ 
          template_type: templateType,
          subject, 
          body, 
          is_active: true,
          updated_at: new Date().toISOString() 
        }, {
          onConflict: 'template_type'
        });

      if (error) throw error;

      await fetchTemplates();
      toast({
        title: "Success",
        description: "Email template saved successfully"
      });
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: "Error",
        description: "Failed to save email template",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const testTemplate = async (templateType: string) => {
    try {
      const { error } = await supabase.functions.invoke('test-email', {
        body: { templateType, testEmail: 'test@example.com' }
      });

      if (error) throw error;

      toast({
        title: "Test Email Sent",
        description: "Check the logs to see if the email was sent successfully"
      });
    } catch (error) {
      console.error('Error sending test email:', error);
      toast({
        title: "Error",
        description: "Failed to send test email",
        variant: "destructive"
      });
    }
  };

  const getTemplate = (templateType: string) => {
    return templates.find(t => t.template_type === templateType);
  };

  const TemplateForm = ({ templateType, label }: { templateType: string; label: string }) => {
    const template = getTemplate(templateType);
    const templateConfig = templateTypes.find(t => t.key === templateType);
    const [subject, setSubject] = useState(template?.subject || templateConfig?.defaultSubject || '');
    const [body, setBody] = useState(template?.body || templateConfig?.defaultBody || '');

    useEffect(() => {
      if (template) {
        setSubject(template.subject);
        setBody(template.body);
      }
    }, [template]);

    const handleReset = () => {
      if (templateConfig) {
        setSubject(templateConfig.defaultSubject || '');
        setBody(templateConfig.defaultBody || '');
      }
    };

    const handleSave = () => {
      updateTemplate(templateType, subject, body);
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">{label}</h3>
            <p className="text-sm text-muted-foreground">
              {templateTypes.find(t => t.key === templateType)?.description}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
            >
              Reset to Default
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => testTemplate(templateType)}
              disabled={!template}
            >
              <Eye className="h-4 w-4 mr-2" />
              Test
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              size="sm"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor={`subject-${templateType}`}>Email Subject</Label>
            <Input
              id={`subject-${templateType}`}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter email subject..."
            />
          </div>

          <div>
            <Label htmlFor={`body-${templateType}`}>Email Body</Label>
            <Textarea
              id={`body-${templateType}`}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Enter email body..."
              rows={12}
              className="font-mono text-sm"
            />
          </div>

          <div className="bg-muted p-4 rounded-lg space-y-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-blue-500" />
              <span className="font-medium text-sm">Available Variables</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <Badge variant="secondary">{'{{applicant_name}}'}</Badge>
              <Badge variant="secondary">{'{{application_type}}'}</Badge>
              <Badge variant="secondary">{'{{review_notes}}'}</Badge>
              <Badge variant="secondary">{'{{discord_name}}'}</Badge>
              <Badge variant="secondary">{'{{steam_name}}'}</Badge>
              <Badge variant="secondary">{'{{fivem_name}}'}</Badge>
              <Badge variant="secondary">{'{{server_name}}'}</Badge>
              <Badge variant="secondary">{'{{today_date}}'}</Badge>
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>• Variables will be replaced with actual values when emails are sent</p>
              <p>• Use {'{{'} and {'}}'}  to wrap variable names</p>
              <p>• Line breaks will be preserved in plain text emails</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Email Template Manager
        </CardTitle>
        <CardDescription>
          Configure email templates for application responses. These will be sent automatically when applications are processed.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="application_submitted" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="application_submitted">Submitted</TabsTrigger>
            <TabsTrigger value="application_accepted">Accepted</TabsTrigger>
            <TabsTrigger value="application_denied">Denied</TabsTrigger>
          </TabsList>

          {templateTypes.map((type) => (
            <TabsContent key={type.key} value={type.key} className="mt-6">
              <TemplateForm templateType={type.key} label={type.label} />
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};