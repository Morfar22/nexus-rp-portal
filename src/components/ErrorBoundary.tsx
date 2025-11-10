import React, { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  async componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    
    // Log error to Supabase
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      await supabase.from('error_logs').insert({
        user_id: user?.id || null,
        error_message: error.message,
        error_stack: error.stack || '',
        component_stack: errorInfo.componentStack || '',
        url: window.location.href,
        user_agent: navigator.userAgent,
      });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
  }

  handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-hero flex items-center justify-center px-4">
          <Card className="max-w-lg w-full p-8 bg-gaming-card border-gaming-border text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 rounded-full bg-red-500/20">
                <AlertTriangle className="h-12 w-12 text-red-500" />
              </div>
            </div>
            
            <h1 className="text-2xl font-bold text-foreground mb-3">
              Noget gik galt
            </h1>
            
            <p className="text-muted-foreground mb-6">
              Vi beklager! Der opstod en uventet fejl. Vores team er blevet notificeret og arbejder på en løsning.
            </p>
            
            {this.state.error && (
              <div className="mb-6 p-4 bg-gaming-darker/50 rounded-lg border border-gaming-border text-left">
                <p className="text-sm text-muted-foreground font-mono break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={this.handleGoHome}
                className="bg-neon-purple hover:bg-neon-purple/80"
              >
                <Home className="h-4 w-4 mr-2" />
                Gå til Forsiden
              </Button>
              
              <Button
                onClick={this.handleReload}
                variant="outline"
                className="border-gaming-border hover:bg-gaming-darker"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Genindlæs Siden
              </Button>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;