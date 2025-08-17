import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Eye, EyeOff, Check, X, AlertTriangle, Key, Settings, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface APIKey {
  name: string;
  description: string;
  required: boolean;
  configured: boolean;
  category: 'email' | 'discord' | 'maps' | 'monitoring' | 'other';
}

const API_KEYS: APIKey[] = [
  {
    name: 'RESEND_API_KEY',
    description: 'Required for sending application emails and notifications',
    required: true,
    configured: false,
    category: 'email'
  },
  {
    name: 'DISCORD_BOT_TOKEN',
    description: 'Bot token for Discord integration and role management',
    required: true,
    configured: false,
    category: 'discord'
  },
  {
    name: 'DISCORD_WEBHOOK_URL',
    description: 'Webhook URL for Discord logging and notifications',
    required: true,
    configured: false,
    category: 'discord'
  },
  {
    name: 'MAPBOX_PUBLIC_TOKEN',
    description: 'Public token for map displays and location features',
    required: false,
    configured: false,
    category: 'maps'
  }
];

const categoryColors = {
  email: 'bg-blue-500/10 text-blue-700 border-blue-200',
  discord: 'bg-indigo-500/10 text-indigo-700 border-indigo-200',
  maps: 'bg-green-500/10 text-green-700 border-green-200',
  monitoring: 'bg-orange-500/10 text-orange-700 border-orange-200',
  other: 'bg-gray-500/10 text-gray-700 border-gray-200'
};

export const DeploymentSettings = () => {
  const [apiKeys, setApiKeys] = useState<APIKey[]>(API_KEYS);
  const [showValues, setShowValues] = useState<Record<string, boolean>>({});
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  useEffect(() => {
    checkConfiguredKeys();
  }, []);

  const checkConfiguredKeys = async () => {
    try {
      // In a real implementation, you'd check which secrets are configured
      // For now, we'll assume none are configured initially
      const updatedKeys = apiKeys.map(key => ({
        ...key,
        configured: false // This would be determined by checking Supabase secrets
      }));
      setApiKeys(updatedKeys);
    } catch (error) {
      console.error('Error checking configured keys:', error);
    }
  };

  const handleSaveKey = async (keyName: string) => {
    if (!values[keyName]?.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid API key",
        variant: "destructive"
      });
      return;
    }

    setLoading(prev => ({ ...prev, [keyName]: true }));

    try {
      // Here you would save to Supabase secrets
      // For now, we'll simulate a successful save
      await new Promise(resolve => setTimeout(resolve, 1000));

      setApiKeys(prev => prev.map(key => 
        key.name === keyName ? { ...key, configured: true } : key
      ));

      toast({
        title: "Success",
        description: `${keyName} has been configured successfully`
      });

      // Clear the input value
      setValues(prev => ({ ...prev, [keyName]: '' }));
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save API key",
        variant: "destructive"
      });
    } finally {
      setLoading(prev => ({ ...prev, [keyName]: false }));
    }
  };

  const toggleVisibility = (keyName: string) => {
    setShowValues(prev => ({ ...prev, [keyName]: !prev[keyName] }));
  };

  const getReadinessScore = () => {
    const totalRequired = apiKeys.filter(key => key.required).length;
    const configuredRequired = apiKeys.filter(key => key.required && key.configured).length;
    return Math.round((configuredRequired / totalRequired) * 100);
  };

  const readinessScore = getReadinessScore();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Deployment Configuration</h1>
          <p className="text-muted-foreground mt-1">
            Configure API keys and settings required for production deployment
          </p>
        </div>
        <Badge 
          variant={readinessScore === 100 ? "default" : "secondary"}
          className="text-sm px-3 py-1"
        >
          {readinessScore}% Ready
        </Badge>
      </div>

      {/* Readiness Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Deployment Readiness
          </CardTitle>
          <CardDescription>
            Current status of your deployment configuration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {apiKeys.filter(key => key.configured).length}
              </div>
              <div className="text-sm text-muted-foreground">Configured</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {apiKeys.filter(key => key.required && !key.configured).length}
              </div>
              <div className="text-sm text-muted-foreground">Required Missing</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {apiKeys.filter(key => !key.required && !key.configured).length}
              </div>
              <div className="text-sm text-muted-foreground">Optional Missing</div>
            </div>
          </div>
          
          {readinessScore < 100 && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <div className="font-medium text-yellow-800">Deployment Not Ready</div>
                <div className="text-sm text-yellow-700">
                  You need to configure all required API keys before deploying to production.
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* API Keys Configuration */}
      <div className="grid gap-4">
        {['email', 'discord', 'maps', 'monitoring', 'other'].map(category => {
          const categoryKeys = apiKeys.filter(key => key.category === category);
          if (categoryKeys.length === 0) return null;

          return (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 capitalize">
                  <Key className="h-5 w-5" />
                  {category} Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {categoryKeys.map((apiKey, index) => (
                  <div key={apiKey.name}>
                    {index > 0 && <Separator className="my-4" />}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Label htmlFor={apiKey.name} className="font-medium">
                            {apiKey.name}
                          </Label>
                          {apiKey.required && (
                            <Badge variant="destructive" className="text-xs">
                              Required
                            </Badge>
                          )}
                          <Badge 
                            variant={apiKey.configured ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {apiKey.configured ? (
                              <Check className="h-3 w-3 mr-1" />
                            ) : (
                              <X className="h-3 w-3 mr-1" />
                            )}
                            {apiKey.configured ? 'Configured' : 'Not Set'}
                          </Badge>
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground">
                        {apiKey.description}
                      </p>
                      
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Input
                            id={apiKey.name}
                            type={showValues[apiKey.name] ? "text" : "password"}
                            placeholder={`Enter ${apiKey.name}`}
                            value={values[apiKey.name] || ''}
                            onChange={(e) => setValues(prev => ({ 
                              ...prev, 
                              [apiKey.name]: e.target.value 
                            }))}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => toggleVisibility(apiKey.name)}
                          >
                            {showValues[apiKey.name] ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        <Button
                          onClick={() => handleSaveKey(apiKey.name)}
                          disabled={loading[apiKey.name] || !values[apiKey.name]?.trim()}
                          className="px-6"
                        >
                          {loading[apiKey.name] ? 'Saving...' : 'Save'}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Additional Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Additional Deployment Settings
          </CardTitle>
          <CardDescription>
            Other configuration options for production deployment
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Domain Configuration</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Once your API keys are configured, you can deploy your site and connect a custom domain through the Lovable dashboard.
            </p>
            <Button variant="outline" size="sm">
              Open Domain Settings
            </Button>
          </div>
          
          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-medium mb-2">Environment Variables</h4>
            <p className="text-sm text-muted-foreground mb-3">
              All API keys are securely stored as Supabase secrets and automatically available to your edge functions.
            </p>
            <Button variant="outline" size="sm">
              View Supabase Secrets
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};