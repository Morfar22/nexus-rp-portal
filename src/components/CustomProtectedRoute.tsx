import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useCustomAuth } from '@/hooks/useCustomAuth';
import { Card } from '@/components/ui/card';
import { Loader2, Ban } from 'lucide-react';

interface CustomProtectedRouteProps {
  children: ReactNode;
}

const CustomProtectedRoute = ({ children }: CustomProtectedRouteProps) => {
  const { user, loading, isBanned } = useCustomAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <Card className="p-8 bg-gaming-card border-gaming-border">
          <div className="flex items-center space-x-4">
            <Loader2 className="h-6 w-6 animate-spin text-neon-purple" />
            <span className="text-foreground">Loading...</span>
          </div>
        </Card>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (isBanned) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <Card className="p-8 bg-gaming-card border-red-500/50 text-center max-w-md">
          <div className="space-y-4">
            <Ban className="h-12 w-12 text-red-500 mx-auto" />
            <h2 className="text-2xl font-bold text-red-400">Account Suspended</h2>
            <p className="text-muted-foreground">
              Your account has been suspended and you cannot access this application. 
              Please contact support if you believe this is an error.
            </p>
            <div className="pt-4">
              <a 
                href="/auth" 
                className="text-neon-purple hover:text-neon-purple/80 underline"
              >
                Return to Login
              </a>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};

export default CustomProtectedRoute;