import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Server, Mail, AlertCircle } from "lucide-react";

interface PasswordResetFormProps {
  onBack: () => void;
  serverName: string;
}

const PasswordResetForm = ({ onBack, serverName }: PasswordResetFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const { toast } = useToast();

  const handlePasswordResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // Try custom auth system first
      const { data, error: customError } = await supabase.functions.invoke('reset-user-password', {
        body: { email: resetEmail }
      });

      if (customError) {
        // Fallback to Supabase auth
        const { error: supabaseError } = await supabase.auth.resetPasswordForEmail(resetEmail, {
          redirectTo: `${window.location.origin}/auth#type=recovery`,
        });

        if (supabaseError) {
          setError(supabaseError.message);
          return;
        }
      } else if (data && !data.success) {
        setError(data.error || "Failed to send reset email");
        return;
      }

      toast({
        title: "Reset Email Sent",
        description: "Check your email for a password reset link.",
      });

      onBack();
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
            Enter your email to receive a password reset link
          </p>
        </div>

        <Card className="bg-gaming-card border-gaming-border shadow-gaming">
          <CardHeader>
            <CardTitle className="text-center text-foreground">Reset Password</CardTitle>
            <CardDescription className="text-center">
              We'll send you a link to reset your password
            </CardDescription>
          </CardHeader>

          <CardContent>
            {error && (
              <Alert className="mb-4 border-destructive/50 bg-destructive/10">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handlePasswordResetRequest} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email" className="text-foreground">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="Enter your email address"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="pl-10 bg-gaming-dark border-gaming-border focus:border-neon-purple"
                    required
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
                  {isLoading ? "Sending..." : "Send Reset Link"}
                </Button>

                <Button 
                  type="button"
                  variant="outline" 
                  className="w-full border-gaming-border hover:bg-gaming-dark"
                  onClick={onBack}
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

export default PasswordResetForm;