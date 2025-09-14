import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Server, Lock, AlertCircle } from "lucide-react";

const ResetPassword = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [serverName, setServerName] = useState("Adventure RP");
  const [resetToken, setResetToken] = useState("");
  const [email, setEmail] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const loadServerName = async () => {
      try {
        const { data } = await supabase
          .from('server_settings')
          .select('setting_value')
          .eq('setting_key', 'general_settings')
          .maybeSingle();

        if (data?.setting_value && typeof data.setting_value === 'object' && 
            data.setting_value !== null && 'server_name' in data.setting_value) {
          setServerName((data.setting_value as any).server_name);
        }
      } catch (error) {
        console.error('Error loading server name:', error);
      }
    };

    // Get reset token from URL parameters
    const token = searchParams.get('token');
    const userEmail = searchParams.get('email');
    
    if (token) {
      setResetToken(token);
    }
    if (userEmail) {
      setEmail(userEmail);
    }

    loadServerName();
  }, [searchParams]);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long");
      setIsLoading(false);
      return;
    }

    try {
      // Try custom auth reset first
      if (resetToken && email) {
        const { data, error: customError } = await supabase.functions.invoke('reset-password', {
          body: { 
            email: email,
            newPassword: newPassword,
            token: resetToken
          }
        });

        if (customError) {
          setError(customError.message);
          return;
        }

        if (data.success) {
          toast({
            title: "Password Updated",
            description: "Your password has been successfully reset!",
          });
          navigate("/auth");
          return;
        } else {
          setError(data.error || "Failed to reset password");
          return;
        }
      }

      // Fallback to Supabase auth
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        setError(error.message);
        return;
      }

      toast({
        title: "Password Updated",
        description: "Your password has been successfully reset!",
      });

      navigate("/auth");
    } catch (error: any) {
      setError(error.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2 mb-4">
            <Server className="h-8 w-8 text-neon-purple" />
            <span className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              {serverName}
            </span>
          </Link>
          <p className="text-muted-foreground">
            Create a new password for your account
          </p>
        </div>

        <Card className="bg-gaming-card border-gaming-border shadow-gaming">
          <CardHeader>
            <CardTitle className="text-center text-foreground">Reset Password</CardTitle>
            <CardDescription className="text-center">
              Enter your new password below
            </CardDescription>
          </CardHeader>

          <CardContent>
            {error && (
              <Alert className="mb-4 border-destructive/50 bg-destructive/10">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password" className="text-foreground">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="Enter new password (min. 6 characters)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-10 bg-gaming-dark border-gaming-border focus:border-neon-purple"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-foreground">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 bg-gaming-dark border-gaming-border focus:border-neon-purple"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Button 
                  type="submit" 
                  variant="hero" 
                  className="w-full" 
                  disabled={isLoading}
                >
                  {isLoading ? "Updating..." : "Update Password"}
                </Button>

                <Button 
                  type="button"
                  variant="outline" 
                  className="w-full border-gaming-border hover:bg-gaming-dark"
                  onClick={() => navigate("/auth")}
                >
                  Back to Sign In
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;