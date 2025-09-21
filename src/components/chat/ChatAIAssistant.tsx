import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Bot, Sparkles, MessageSquare, Settings, Zap, Brain } from "lucide-react";

interface AISettings {
  enabled: boolean;
  auto_suggest: boolean;
  sentiment_analysis: boolean;
  language_detection: boolean;
  auto_translate: boolean;
  confidence_threshold: number;
}

interface ChatSession {
  id: string;
  visitor_name: string;
  status: string;
}

interface AISuggestion {
  id: string;
  type: 'response' | 'action' | 'escalation';
  content: string;
  confidence: number;
  reasoning: string;
}

export const ChatAIAssistant = ({ selectedSession }: { selectedSession: ChatSession | null }) => {
  const [aiSettings, setAISettings] = useState<AISettings>({
    enabled: false,
    auto_suggest: true,
    sentiment_analysis: true,
    language_detection: true,
    auto_translate: false,
    confidence_threshold: 0.7
  });
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [chatSentiment, setChatSentiment] = useState<'positive' | 'neutral' | 'negative' | null>(null);
  const [detectedLanguage, setDetectedLanguage] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadAISettings();
  }, []);

  useEffect(() => {
    if (selectedSession && aiSettings.enabled) {
      analyzeChat();
    }
  }, [selectedSession, aiSettings.enabled]);

  const loadAISettings = async () => {
    try {
      const { data, error } = await supabase
        .from('server_settings')
        .select('setting_value')
        .eq('setting_key', 'ai_chat_settings')
        .maybeSingle();

      if (error) throw error;

      if (data?.setting_value) {
        setAISettings(data.setting_value as unknown as AISettings);
      }
    } catch (error) {
      console.error('Error loading AI settings:', error);
    }
  };

  const saveAISettings = async () => {
    try {
      const { error } = await supabase
        .from('server_settings')
        .upsert({
          setting_key: 'ai_chat_settings',
          setting_value: aiSettings as any,
          updated_at: new Date().toISOString()
        }, { onConflict: 'setting_key' });

      if (error) throw error;

      toast({
        title: "AI Settings Saved",
        description: "Chat AI assistant settings have been updated.",
      });
    } catch (error) {
      console.error('Error saving AI settings:', error);
      toast({
        title: "Error",
        description: "Failed to save AI settings",
        variant: "destructive"
      });
    }
  };

  const analyzeChat = async () => {
    if (!selectedSession) return;

    setIsAnalyzing(true);
    try {
      // Get recent messages for analysis
      const { data: messages, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', selectedSession.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      if (messages && messages.length > 0) {
        // Call AI analysis function
        const { data: analysis, error: aiError } = await supabase.functions.invoke('chat-ai-assistant', {
          body: {
            action: 'analyze_chat',
            messages: messages,
            settings: aiSettings
          }
        });

        if (aiError) throw aiError;

        if (analysis) {
          setSuggestions(analysis.suggestions || []);
          setChatSentiment(analysis.sentiment);
          setDetectedLanguage(analysis.language);
        }
      }
    } catch (error) {
      console.error('Error analyzing chat:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateResponse = async (context: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('chat-ai-assistant', {
        body: {
          action: 'generate_response',
          context: context,
          session_id: selectedSession?.id,
          settings: aiSettings
        }
      });

      if (error) throw error;
      return data.response;
    } catch (error) {
      console.error('Error generating AI response:', error);
      return null;
    }
  };

  const getSentimentColor = (sentiment: string | null) => {
    switch (sentiment) {
      case 'positive': return 'text-green-500';
      case 'negative': return 'text-red-500';
      default: return 'text-yellow-500';
    }
  };

  const getSentimentIcon = (sentiment: string | null) => {
    switch (sentiment) {
      case 'positive': return '😊';
      case 'negative': return '😞';
      default: return '😐';
    }
  };

  return (
    <div className="space-y-4">
      {/* AI Status Header */}
      <Card className="p-4 bg-gaming-darker border-gaming-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Bot className="h-5 w-5 text-blue-500" />
            <h3 className="font-semibold text-foreground">AI Assistant</h3>
            <Badge variant={aiSettings.enabled ? "default" : "secondary"}>
              {aiSettings.enabled ? 'Active' : 'Disabled'}
            </Badge>
          </div>
          <Switch
            checked={aiSettings.enabled}
            onCheckedChange={(checked) => 
              setAISettings(prev => ({ ...prev, enabled: checked }))
            }
          />
        </div>

        {aiSettings.enabled && selectedSession && (
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Brain className="h-4 w-4 text-purple-500" />
              <span className="text-sm text-muted-foreground">Sentiment:</span>
              <span className={`text-sm font-medium ${getSentimentColor(chatSentiment)}`}>
                {getSentimentIcon(chatSentiment)} {chatSentiment || 'Analyzing...'}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-muted-foreground">Language:</span>
              <span className="text-sm font-medium text-foreground">
                {detectedLanguage || 'Detecting...'}
              </span>
            </div>
          </div>
        )}
      </Card>

      {/* AI Suggestions */}
      {aiSettings.enabled && suggestions.length > 0 && (
        <Card className="p-4 bg-gaming-darker border-gaming-border">
          <div className="flex items-center space-x-2 mb-3">
            <Sparkles className="h-4 w-4 text-yellow-500" />
            <h4 className="font-medium text-foreground">AI Suggestions</h4>
            {isAnalyzing && (
              <Badge variant="outline" className="text-xs">
                <Zap className="h-3 w-3 mr-1" />
                Analyzing...
              </Badge>
            )}
          </div>
          
          <div className="space-y-3">
            {suggestions.map((suggestion) => (
              <div key={suggestion.id} className="p-3 bg-gaming-card border border-gaming-border rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <Badge variant="outline" className="text-xs">
                    {suggestion.type}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {Math.round(suggestion.confidence * 100)}% confidence
                  </Badge>
                </div>
                
                <p className="text-sm text-foreground mb-2">{suggestion.content}</p>
                
                {suggestion.reasoning && (
                  <p className="text-xs text-muted-foreground mb-2">
                    💡 {suggestion.reasoning}
                  </p>
                )}
                
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline" className="text-xs">
                    Use Suggestion
                  </Button>
                  <Button size="sm" variant="ghost" className="text-xs">
                    Dismiss
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* AI Settings */}
      <Card className="p-4 bg-gaming-darker border-gaming-border">
        <div className="flex items-center space-x-2 mb-4">
          <Settings className="h-4 w-4 text-gray-500" />
          <h4 className="font-medium text-foreground">AI Configuration</h4>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Auto-Suggest Responses</Label>
              <p className="text-xs text-muted-foreground">Generate response suggestions</p>
            </div>
            <Switch
              checked={aiSettings.auto_suggest}
              onCheckedChange={(checked) => 
                setAISettings(prev => ({ ...prev, auto_suggest: checked }))
              }
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Sentiment Analysis</Label>
              <p className="text-xs text-muted-foreground">Analyze customer emotions</p>
            </div>
            <Switch
              checked={aiSettings.sentiment_analysis}
              onCheckedChange={(checked) => 
                setAISettings(prev => ({ ...prev, sentiment_analysis: checked }))
              }
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Language Detection</Label>
              <p className="text-xs text-muted-foreference">Detect customer's language</p>
            </div>
            <Switch
              checked={aiSettings.language_detection}
              onCheckedChange={(checked) => 
                setAISettings(prev => ({ ...prev, language_detection: checked }))
              }
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Auto-Translation</Label>
              <p className="text-xs text-muted-foreground">Translate messages automatically</p>
            </div>
            <Switch
              checked={aiSettings.auto_translate}
              onCheckedChange={(checked) => 
                setAISettings(prev => ({ ...prev, auto_translate: checked }))
              }
            />
          </div>
          
          <Button onClick={saveAISettings} className="w-full">
            Save AI Settings
          </Button>
        </div>
      </Card>
    </div>
  );
};