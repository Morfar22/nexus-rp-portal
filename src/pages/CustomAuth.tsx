import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useCustomAuth } from "@/hooks/useCustomAuth";
import { supabase } from "@/integrations/supabase/client";
import { Server, Mail, Lock, User, AlertCircle, Shield, Ban } from "lucide-react";
import HCaptcha from '@hcaptcha/react-hcaptcha';

const CustomAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [showBannedScreen, setShowBannedScreen] = useState(false);
  const [bannedUserInfo, setBannedUserInfo] = useState<{username: string, email: string} | null>(null);
  const [serverName, setServerName] = useState("Adventure RP");
  const captchaRef = useRef<HCaptcha>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading, signIn, signUp } = useCustomAuth();

  // Handle Discord OAuth callback
  useEffect(() => {
    const handleDiscordCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      
      if (code) {
        try {
          const redirectUri = `${window.location.origin}/auth`;
          
          const { data, error } = await supabase.functions.invoke('discord-oauth', {
            body: {
              action: 'exchange_code',
              data: { code, redirectUri }
            }
          });

          if (error) throw error;

          if (data.success) {
            const discordUser = data.data.user;
            
            // Try to sign in with Discord (you'll need to implement this in your backend)
            // For now, just show success and redirect to profile
            toast({
              title: "Discord Connected!",
              description: `Welcome ${discordUser.username}! Please create an account or sign in.`,
            });

            // Clean up URL
            window.history.replaceState({}, document.title, window.location.pathname);
          } else {
            throw new Error(data.error);
          }
        } catch (error) {
          console.error('Discord callback error:', error);
          toast({
            title: "Error",
            description: "Failed to connect with Discord",
            variant: "destructive",
          });
        }
      }
    };

    handleDiscordCallback();
  }, [toast]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!captchaToken) {
      setError("Please complete the captcha verification");
      setIsLoading(false);
      return;
    }

    try {
      const result = await signIn(email, password);
      
      if (result.error) {
        if (result.banned) {
          setBannedUserInfo(result.userInfo);
          setShowBannedScreen(true);
          return;
        }
        setError(result.error);
      } else if (result.success) {
        toast({
          title: "Welcome back!",
          description: "You have successfully signed in.",
        });
        navigate("/");
      }
      
      // Reset captcha
      setCaptchaToken(null);
      captchaRef.current?.resetCaptcha();
    } catch (error: any) {
      setError(error.message || "An unexpected error occurred");
      setCaptchaToken(null);
      captchaRef.current?.resetCaptcha();
    } finally {
      setIsLoading(false);
    }
  };

  const handleDiscordLogin = async () => {
    setIsLoading(true);
    try {
      const redirectUri = `${window.location.origin}/auth`;
      
      const { data, error } = await supabase.functions.invoke('discord-oauth', {
        body: {
          action: 'get_auth_url',
          data: { redirectUri }
        }
      });

      if (error) throw error;

      if (data.success) {
        window.location.href = data.data.authUrl;
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Discord login error:', error);
      toast({
        title: "Error",
        description: "Failed to initiate Discord login",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please make sure both password fields are identical.");
      setIsLoading(false);
      return;
    }

    if (!captchaToken) {
      setError("Please complete the captcha verification");
      setIsLoading(false);
      return;
    }

    try {
      const result = await signUp(email, password, username);
      
      if (result.error) {
        setError(result.error);
      } else if (result.success) {
        toast({
          title: "Account created!",
          description: "Please check your email for a verification link.",
        });
      }
      
      // Reset captcha
      setCaptchaToken(null);
      captchaRef.current?.resetCaptcha();
    } catch (error: any) {
      setError(error.message || "An unexpected error occurred");
      setCaptchaToken(null);
      captchaRef.current?.resetCaptcha();
    } finally {
      setIsLoading(false);
    }
  };

  // Show banned screen if user is banned
  if (showBannedScreen && bannedUserInfo) {
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
          </div>

          <Card className="bg-gaming-card border-red-500/50 shadow-gaming">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
                <Ban className="h-8 w-8 text-red-500" />
              </div>
              <CardTitle className="text-red-500 text-xl">Account Suspended</CardTitle>
              <CardDescription className="text-muted-foreground">
                Your access to {serverName} has been restricted
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Shield className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-red-400">
                      Account Status: Suspended
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <strong>Username:</strong> {bannedUserInfo.username}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      <strong>Email:</strong> {bannedUserInfo.email}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>
                  Your account has been suspended and you cannot access the application at this time.
                </p>
                <p>
                  If you believe this is an error, please contact our support team.
                </p>
              </div>
              
              <div className="pt-4 space-y-3">
                <Button 
                  onClick={() => {
                    setShowBannedScreen(false);
                    setBannedUserInfo(null);
                    setEmail("");
                    setPassword("");
                    setError("");
                  }}
                  variant="outline" 
                  className="w-full border-gaming-border hover:bg-gaming-dark"
                >
                  Try Different Account
                </Button>
                
                <Button 
                  onClick={() => navigate("/")}
                  variant="secondary" 
                  className="w-full"
                >
                  Return to Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
            Sign in to your account or create a new one
          </p>
        </div>

        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="signin" className="data-[state=active]:bg-primary">Sign In</TabsTrigger>
            <TabsTrigger value="signup" className="data-[state=active]:bg-primary">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            <Card className="bg-gaming-card border-gaming-border shadow-gaming">
              <CardHeader>
                <CardTitle className="text-center text-foreground">Welcome back</CardTitle>
                <CardDescription className="text-center">
                  Enter your credentials to access your account
                </CardDescription>
              </CardHeader>

              <CardContent>
                {error && (
                  <Alert className="mb-4 border-destructive/50 bg-destructive/10">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email" className="text-foreground">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 bg-gaming-dark border-gaming-border focus:border-neon-purple"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signin-password" className="text-foreground">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signin-password"
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 bg-gaming-dark border-gaming-border focus:border-neon-purple"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex justify-center py-4">
                    <HCaptcha
                      ref={captchaRef}
                      sitekey="10000000-ffff-ffff-ffff-000000000001"
                      onVerify={setCaptchaToken}
                      onExpire={() => setCaptchaToken(null)}
                      onError={() => setCaptchaToken(null)}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    variant="hero" 
                    className="w-full" 
                    disabled={isLoading || !captchaToken}
                  >
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>

                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-gaming-border" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-gaming-card px-2 text-muted-foreground">Or continue with</span>
                    </div>
                  </div>

                  <Button 
                    type="button"
                    variant="outline" 
                    className="w-full border-discord-blue/20 text-discord-blue hover:bg-discord-blue/10"
                    onClick={() => handleDiscordLogin()}
                    disabled={isLoading}
                  >
                    <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.196.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                    </svg>
                    Continue with Discord
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="signup">
            <Card className="bg-gaming-card border-gaming-border shadow-gaming">
              <CardHeader>
                <CardTitle className="text-center text-foreground">Create Account</CardTitle>
                <CardDescription className="text-center">
                  Join our community today
                </CardDescription>
              </CardHeader>

              <CardContent>
                {error && (
                  <Alert className="mb-4 border-destructive/50 bg-destructive/10">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-foreground">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 bg-gaming-dark border-gaming-border focus:border-neon-purple"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-username" className="text-foreground">Username (Optional)</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-username"
                        type="text"
                        placeholder="Choose a username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="pl-10 bg-gaming-dark border-gaming-border focus:border-neon-purple"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-foreground">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="Create a password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
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
                        placeholder="Confirm your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-10 bg-gaming-dark border-gaming-border focus:border-neon-purple"
                        required
                        minLength={6}
                      />
                    </div>
                  </div>

                  <div className="flex justify-center py-4">
                    <HCaptcha
                      ref={captchaRef}
                      sitekey="10000000-ffff-ffff-ffff-000000000001"
                      onVerify={setCaptchaToken}
                      onExpire={() => setCaptchaToken(null)}
                      onError={() => setCaptchaToken(null)}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    variant="hero" 
                    className="w-full" 
                    disabled={isLoading || !captchaToken}
                  >
                    {isLoading ? "Creating account..." : "Create Account"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CustomAuth;