import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import ServerStats from "@/components/ServerStats";
import { Link } from "react-router-dom";
import { PlayCircle, Users, Shield, Map, Clock, Star } from "lucide-react";
import heroImage from "@/assets/hero-image.jpg";

const Index = () => {
  const features = [
    {
      icon: Users,
      title: "Professional RP Community",
      description: "Join 300+ serious roleplayers in our whitelist-only server",
      color: "text-neon-purple"
    },
    {
      icon: Shield,
      title: "Experienced Staff Team",
      description: "24/7 moderation ensuring fair and immersive gameplay",
      color: "text-neon-blue"
    },
    {
      icon: Map,
      title: "Custom Content",
      description: "Unique jobs, vehicles, and locations for endless possibilities",
      color: "text-neon-green"
    },
    {
      icon: Clock,
      title: "99.9% Uptime",
      description: "Reliable server infrastructure for uninterrupted gameplay",
      color: "text-yellow-400"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-hero">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0 bg-gaming-darker/70" />
        
        <div className="relative container mx-auto px-4 py-20 text-center">
          <Badge className="mb-6 bg-neon-purple/20 text-neon-purple border-neon-purple/30">
            <Star className="h-3 w-3 mr-1" />
            #1 Rated FiveM Server
          </Badge>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Dreamlight RP
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-foreground/80 mb-8 max-w-3xl mx-auto">
            Experience the ultimate GTA V roleplay in our cyberpunk-themed city. 
            Professional staff, custom content, and endless possibilities await.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button variant="hero" size="lg" className="text-lg px-8">
              <PlayCircle className="h-5 w-5 mr-2" />
              Connect Now
            </Button>
            <Button variant="neon" size="lg" className="text-lg px-8" asChild>
              <Link to="/apply">Apply for Whitelist</Link>
            </Button>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <ServerStats />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gaming-dark/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-4">
              Why Choose Dreamlight RP?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We've built the most immersive FiveM experience with attention to every detail
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <Card key={index} className="p-6 bg-gaming-card border-gaming-border hover:border-neon-purple/50 transition-all duration-300 hover:shadow-glow-primary">
                  <IconComponent className={`h-12 w-12 ${feature.color} mb-4`} />
                  <h3 className="text-xl font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Server Info Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                Ready to Join the <span className="bg-gradient-primary bg-clip-text text-transparent">Future</span>?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Our whitelist application ensures quality roleplay. Tell us about your character, 
                your RP experience, and join hundreds of players in the most advanced FiveM server.
              </p>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-neon-green rounded-full" />
                  <span className="text-foreground">Professional development team</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-neon-blue rounded-full" />
                  <span className="text-foreground">Weekly content updates</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-neon-purple rounded-full" />
                  <span className="text-foreground">Active Discord community</span>
                </div>
              </div>
            </div>
            
            <Card className="p-8 bg-gaming-card border-gaming-border shadow-gaming">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-foreground mb-4">Server Information</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Server IP:</span>
                    <code className="bg-gaming-dark px-3 py-1 rounded text-neon-purple">
                      connect dreamlight-rp.com
                    </code>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Discord:</span>
                    <Button variant="neon" size="sm">Join Discord</Button>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge className="bg-neon-green/20 text-neon-green border-neon-green/30">
                      Online
                    </Badge>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
