import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import ServerStats from "@/components/ServerStats";
import { Link } from "react-router-dom";
import { PlayCircle, Users, Shield, Map, Clock, Star } from "lucide-react";
import DynamicIcon from "@/components/DynamicIcon";
import { useToast } from "@/hooks/use-toast";
import { useServerSettings } from "@/hooks/useServerSettings";
import { supabase } from "@/integrations/supabase/client";
import heroImage from "@/assets/hero-image.jpg";

const Index = () => {
  const [serverJoinLink, setServerJoinLink] = useState('');
  const [serverInfo, setServerInfo] = useState({
    displayIp: 'connect dreamlight-rp.com',
    discordUrl: '',
    status: 'online'
  });
  const [homepageFeatures, setHomepageFeatures] = useState<any[]>([]);
  const [homepageFeaturesSection, setHomepageFeaturesSection] = useState<any>({
    title: "Why Choose Dreamlight RP?",
    description: "We've built the most immersive FiveM experience with attention to every detail"
  });
  const [homepageCta, setHomepageCta] = useState<any>({
    title: "Ready to Join the Future?",
    description: "Our whitelist application ensures quality roleplay. Tell us about your character, your RP experience, and join hundreds of players in the most advanced FiveM server.",
    features: [
      "Professional development team",
      "Weekly content updates", 
      "Active Discord community"
    ]
  });
  const { toast } = useToast();
  const { settings } = useServerSettings();

  useEffect(() => {
    // Use Promise.all to fetch all data in parallel
    const loadInitialData = async () => {
      await Promise.all([
        fetchServerJoinLink(),
        fetchServerInfo(),
        fetchHomepageContent()
      ]);
    };
    
    loadInitialData();
  }, []);

  const fetchServerJoinLink = async () => {
    try {
      const { data, error } = await supabase
        .from('server_settings')
        .select('setting_value')
        .eq('setting_key', 'server_join_link')
        .maybeSingle();

      if (error) {
        console.error('Error fetching join link:', error);
        return;
      }

      if (data) {
        setServerJoinLink(data.setting_value as string);
      }
    } catch (error) {
      console.error('Error fetching join link:', error);
    }
  };

  const fetchServerInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('server_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['server_display_ip', 'discord_url', 'server_status']);

      if (error) {
        console.error('Error fetching server info:', error);
        return;
      }

      if (data) {
        const settings: any = {};
        data.forEach(setting => {
          settings[setting.setting_key] = setting.setting_value;
        });

        setServerInfo({
          displayIp: settings.server_display_ip || 'connect dreamlight-rp.com',
          discordUrl: settings.discord_url || '',
          status: settings.server_status || 'online'
        });
      }
    } catch (error) {
      console.error('Error fetching server info:', error);
    }
  };

  const handleConnectNow = () => {
    if (!serverJoinLink) {
      toast({
        title: "Server Join Link Not Available",
        description: "The server join link has not been configured yet. Please contact staff.",
        variant: "destructive",
      });
      return;
    }

    // Try to open the FiveM link
    window.location.href = serverJoinLink;
  };

  const handleDiscordClick = () => {
    if (serverInfo.discordUrl) {
      window.open(serverInfo.discordUrl, '_blank');
    } else {
      toast({
        title: "Discord Link Not Available",
        description: "The Discord link has not been configured yet.",
        variant: "destructive",
      });
    }
  };

  const fetchHomepageContent = async () => {
    try {
      // Use Promise.all to fetch all content types in parallel
      const [featuresRes, featuresSectionRes, ctaRes] = await Promise.all([
        supabase
          .from('server_settings')
          .select('setting_value')
          .eq('setting_key', 'homepage_features')
          .maybeSingle(),
        supabase
          .from('server_settings')
          .select('setting_value')
          .eq('setting_key', 'homepage_features_section')
          .maybeSingle(),
        supabase
          .from('server_settings')
          .select('setting_value')
          .eq('setting_key', 'homepage_cta_section')
          .maybeSingle()
      ]);

      if (featuresRes.data?.setting_value) {
        setHomepageFeatures(featuresRes.data.setting_value as any[]);
      } else {
        // Fallback to default features only if no data exists
        setHomepageFeatures([
          {
            title: "Professional RP Community",
            description: "Join 300+ serious roleplayers in our whitelist-only server",
            icon: "Users",
            color: "text-neon-purple"
          },
          {
            title: "Experienced Staff Team",
            description: "24/7 moderation ensuring fair and immersive gameplay",
            icon: "Shield",
            color: "text-neon-blue"
          },
          {
            title: "Custom Content",
            description: "Unique jobs, vehicles, and locations for endless possibilities",
            icon: "Map",
            color: "text-neon-green"
          },
          {
            title: "99.9% Uptime",
            description: "Reliable server infrastructure for uninterrupted gameplay",
            icon: "Clock",
            color: "text-yellow-400"
          }
        ]);
      }

      if (featuresSectionRes.data?.setting_value) {
        setHomepageFeaturesSection(featuresSectionRes.data.setting_value);
      }

      if (ctaRes.data?.setting_value) {
        setHomepageCta(ctaRes.data.setting_value);
      }
    } catch (error) {
      console.error('Error fetching homepage content:', error);
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-neon-green/20 text-neon-green border-neon-green/30';
      case 'maintenance':
        return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30';
      case 'offline':
        return 'bg-red-500/20 text-red-500 border-red-500/30';
      default:
        return 'bg-neon-green/20 text-neon-green border-neon-green/30';
    }
  };


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
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 px-4">
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              {settings.general_settings?.server_name || 'Dreamlight RP'}
            </span>
          </h1>
          
          <p className="text-lg sm:text-xl md:text-2xl text-foreground/80 mb-8 max-w-3xl mx-auto px-4">
            {settings.general_settings?.welcome_message || 'Experience the ultimate GTA V roleplay in our cyberpunk-themed city. Professional staff, custom content, and endless possibilities await.'}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 px-4">
            <Button 
              variant="hero" 
              size="lg" 
              className="text-lg px-8"
              onClick={handleConnectNow}
            >
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
      <section className="py-12 sm:py-16 lg:py-20 bg-gaming-dark/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-4">
              {homepageFeaturesSection.title}
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
              {homepageFeaturesSection.description}
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 auto-rows-fr justify-items-center place-content-center">
            {homepageFeatures.map((feature, index) => (
              <Card key={index} className="group p-6 bg-gaming-card/80 backdrop-blur-sm border-gaming-border hover:border-neon-purple/50 transition-all duration-500 hover:shadow-glow-primary hover:scale-105 animate-fade-in flex flex-col h-full">
                <div className="flex flex-col items-center text-center flex-grow">
                  <div className="mb-4 p-3 rounded-full bg-gaming-dark/50 group-hover:bg-gaming-darker transition-colors duration-300">
                    <DynamicIcon name={feature.icon} className={`h-8 w-8 ${feature.color} group-hover:scale-110 transition-transform duration-300`} />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3 group-hover:text-neon-purple transition-colors duration-300">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Server Info Section */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="text-center lg:text-left">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-6">
                {homepageCta.title?.includes("Future") ? (
                  <>
                    {homepageCta.title.split("Future")[0]}
                    <span className="bg-gradient-primary bg-clip-text text-transparent">Future</span>
                    {homepageCta.title.split("Future")[1]}
                  </>
                ) : (
                  homepageCta.title
                )}
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground mb-8">
                {homepageCta.description}
              </p>
              <div className="space-y-4">
                {homepageCta.features?.map((feature: string, index: number) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${
                      index % 3 === 0 ? 'bg-neon-green' : 
                      index % 3 === 1 ? 'bg-neon-blue' : 'bg-neon-purple'
                    }`} />
                    <span className="text-foreground">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <Card className="p-8 bg-gaming-card border-gaming-border shadow-gaming">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-foreground mb-4">Server Information</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Server IP:</span>
                    <code className="bg-gaming-dark px-3 py-1 rounded text-neon-purple">
                      {serverInfo.displayIp}
                    </code>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Discord:</span>
                    <Button 
                      variant="neon" 
                      size="sm"
                      onClick={handleDiscordClick}
                      disabled={!serverInfo.discordUrl}
                    >
                      Join Discord
                    </Button>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge className={getStatusStyle(serverInfo.status)}>
                      {serverInfo.status.charAt(0).toUpperCase() + serverInfo.status.slice(1)}
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
