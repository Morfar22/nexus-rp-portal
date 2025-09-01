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

  useEffect(() => {
    // Check for email verification success
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('verified') === 'true') {
      toast({
        title: "Email Verified!",
        description: "Your email has been successfully verified. You can now sign in.",
      });
    }

    // Redirect if already logged in
    if (!loading && user) {
      navigate("/");
    }
  }, [user, loading, navigate, toast]);

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