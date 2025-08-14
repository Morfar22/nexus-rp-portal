import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Navbar from "@/components/Navbar";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle, CheckCircle, Clock } from "lucide-react";

const Apply = () => {
  const [formData, setFormData] = useState({
    steamName: "",
    discordTag: "",
    fivemName: "",
    age: "",
    rpExperience: "",
    characterBackstory: "",
    rulesAgreed: false
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [existingApplication, setExistingApplication] = useState<any>(null);
  const [error, setError] = useState("");
  
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const checkExistingApplication = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('applications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error('Error checking application:', error);
          return;
        }

        if (data) {
          setExistingApplication(data);
        }
      } catch (error) {
        console.error('Error:', error);
      }
    };

    checkExistingApplication();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!user) {
      setError("You must be logged in to submit an application");
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('applications')
        .insert({
          user_id: user.id,
          steam_name: formData.steamName,
          discord_tag: formData.discordTag,
          fivem_name: formData.fivemName,
          age: parseInt(formData.age),
          rp_experience: formData.rpExperience,
          character_backstory: formData.characterBackstory,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      setExistingApplication(data);
      toast({
        title: "Application Submitted!",
        description: "Your whitelist application has been sent to our staff team. You'll receive a notification once reviewed.",
      });

      // Reset form
      setFormData({
        steamName: "",
        discordTag: "",
        fivemName: "",
        age: "",
        rpExperience: "",
        characterBackstory: "",
        rulesAgreed: false
      });

    } catch (error: any) {
      console.error('Error submitting application:', error);
      setError(error.message || "Failed to submit application. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-neon-green" />;
      case 'denied':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'under_review':
        return <Clock className="h-5 w-5 text-neon-blue" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'text-neon-green border-neon-green/30 bg-neon-green/10';
      case 'denied':
        return 'text-red-500 border-red-500/30 bg-red-500/10';
      case 'under_review':
        return 'text-neon-blue border-neon-blue/30 bg-neon-blue/10';
      default:
        return 'text-yellow-500 border-yellow-500/30 bg-yellow-500/10';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-4">
              Whitelist Application
            </h1>
            <p className="text-muted-foreground">
              Join NightCity RP - The premier FiveM roleplay experience
            </p>
          </div>

          {/* Show existing application status if exists */}
          {existingApplication && (
            <Card className="mb-6 p-6 bg-gaming-card border-gaming-border">
              <div className="flex items-center space-x-3 mb-4">
                {getStatusIcon(existingApplication.status)}
                <h3 className="text-lg font-semibold text-foreground">Application Status</h3>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(existingApplication.status)}`}>
                    {existingApplication.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Submitted:</span>
                  <span className="text-foreground">
                    {new Date(existingApplication.created_at).toLocaleDateString()}
                  </span>
                </div>
                {existingApplication.review_notes && (
                  <div className="mt-4 p-4 bg-gaming-dark rounded-lg border border-gaming-border">
                    <h4 className="font-medium text-foreground mb-2">Staff Notes:</h4>
                    <p className="text-muted-foreground">{existingApplication.review_notes}</p>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Show form only if no approved application exists */}
          {(!existingApplication || existingApplication.status === 'denied') && (
            <Card className="p-8 bg-gaming-card border-gaming-border shadow-gaming">
              {error && (
                <Alert className="mb-6 border-destructive/50 bg-destructive/10">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="steamName">Steam Name</Label>
                  <Input
                    id="steamName"
                    value={formData.steamName}
                    onChange={(e) => setFormData({...formData, steamName: e.target.value})}
                    className="bg-gaming-dark border-gaming-border focus:border-neon-purple"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="discordTag">Discord Tag</Label>
                  <Input
                    id="discordTag"
                    value={formData.discordTag}
                    onChange={(e) => setFormData({...formData, discordTag: e.target.value})}
                    placeholder="username#1234"
                    className="bg-gaming-dark border-gaming-border focus:border-neon-purple"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fivemName">FiveM Name</Label>
                  <Input
                    id="fivemName"
                    value={formData.fivemName}
                    onChange={(e) => setFormData({...formData, fivemName: e.target.value})}
                    className="bg-gaming-dark border-gaming-border focus:border-neon-purple"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    min="16"
                    value={formData.age}
                    onChange={(e) => setFormData({...formData, age: e.target.value})}
                    className="bg-gaming-dark border-gaming-border focus:border-neon-purple"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rpExperience">Roleplay Experience</Label>
                <Textarea
                  id="rpExperience"
                  value={formData.rpExperience}
                  onChange={(e) => setFormData({...formData, rpExperience: e.target.value})}
                  placeholder="Tell us about your previous RP experience..."
                  className="bg-gaming-dark border-gaming-border focus:border-neon-purple min-h-[100px]"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="characterBackstory">Character Backstory</Label>
                <Textarea
                  id="characterBackstory"
                  value={formData.characterBackstory}
                  onChange={(e) => setFormData({...formData, characterBackstory: e.target.value})}
                  placeholder="Describe your character's background and story..."
                  className="bg-gaming-dark border-gaming-border focus:border-neon-purple min-h-[120px]"
                  required
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="rulesAgreed"
                  checked={formData.rulesAgreed}
                  onChange={(e) => setFormData({...formData, rulesAgreed: e.target.checked})}
                  className="rounded border-gaming-border"
                  required
                />
                <Label htmlFor="rulesAgreed" className="text-sm">
                  I have read and agree to follow all server rules
                </Label>
              </div>

              <Button 
                type="submit" 
                variant="hero" 
                size="lg" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? "Submitting..." : "Submit Application"}
              </Button>
            </form>
          </Card>
          )}

          {existingApplication?.status === 'approved' && (
            <Card className="p-6 bg-gaming-card border-gaming-border">
              <div className="text-center">
                <CheckCircle className="h-12 w-12 text-neon-green mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">Application Approved!</h3>
                <p className="text-muted-foreground mb-4">
                  Congratulations! Your application has been approved. You can now join the server.
                </p>
                <Button variant="neon" size="lg">
                  Join Server
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Apply;