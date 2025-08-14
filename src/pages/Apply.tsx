import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import Navbar from "@/components/Navbar";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

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
  
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Application Submitted!",
      description: "Your whitelist application has been sent to our staff team. You'll receive a Discord notification once reviewed.",
    });
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

          <Card className="p-8 bg-gaming-card border-gaming-border shadow-gaming">
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

              <Button type="submit" variant="hero" size="lg" className="w-full">
                Submit Application
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Apply;