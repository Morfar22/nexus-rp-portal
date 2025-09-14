import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import ServerStats from "@/components/ServerStats";
import ServerDashboard from "@/components/ServerDashboard";
import ParticleBackground from "@/components/ParticleBackground";
import { Link } from "react-router-dom";
import { PlayCircle, Users, Shield, Map, Clock, Star, Zap, Gamepad2, Globe, Award } from "lucide-react";
import DynamicIcon from "@/components/DynamicIcon";
import { useToast } from "@/hooks/use-toast";
import { useServerSettings } from "@/hooks/useServerSettings";
import { supabase } from "@/integrations/supabase/client";
import heroImage from "@/assets/hero-image.webp";
import LiveChatWidget from "@/components/LiveChatWidget";
import GoogleAd from "@/components/GoogleAds";
import SocialMediaLinks from "@/components/SocialMediaLinks";
import { useTranslation } from 'react-i18next';

const Index = () => {
  const { t } = useTranslation();
  const [serverJoinLink, setServerJoinLink] = useState('');
  const [serverInfo, setServerInfo] = useState({
    displayIp: 'connect panel.adventurerp.dk:30120',
    discordUrl: '',
    status: 'online'
  });
  const [homepageFeatures, setHomepageFeatures] = useState<any[]>([]);
  const [homepageFeaturesSection, setHomepageFeaturesSection] = useState<any>({
    title: t('homepage.why_choose_us'),
    description: t('homepage.immersive_experience')
  });
  const [homepageCta, setHomepageCta] = useState<any>({
    title: t('homepage.ready_to_join'),
    description: t('homepage.whitelist_description'),
    features: [
      t('homepage.professional_team'),
      t('homepage.weekly_updates'), 
      t('homepage.active_community')
    ]
  });
  const [designSettings, setDesignSettings] = useState<any>({});
  const { toast } = useToast();
  const { settings } = useServerSettings();

  useEffect(() => {
    // Use Promise.all to fetch all data in parallel
    const loadInitialData = async () => {
      await Promise.all([
        fetchServerJoinLink(),
        fetchServerInfo(),
        fetchHomepageContent(),
        fetchDesignSettings()
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
          displayIp: settings.server_display_ip || 'connect panel.adventurerp.dk:30120',
          discordUrl: settings.discord_url || '',
          status: settings.server_status || 'online'
        });
      }
    } catch (error) {
      console.error('Error fetching server info:', error);
    }
  };

  const handleConnectNow = async () => {
    try {
      // Fetch connect settings from database
      const { data: connectData } = await supabase
        .from('server_settings')
        .select('setting_value')
        .eq('setting_key', 'connect_info')
        .maybeSingle();

      let connectInfo = {
        connect_ip: 'join.dlrp.dk',
        connect_port: 30121,
        connect_enabled: true
      };

      if (connectData?.setting_value) {
        connectInfo = JSON.parse(connectData.setting_value as string);
      }

      if (!connectInfo.connect_enabled) {
        toast({
          title: t('homepage.server_unavailable'),
          description: t('homepage.connection_disabled'),
          variant: "destructive",
        });
        return;
      }

      const connectCommand = `connect ${connectInfo.connect_ip}:${connectInfo.connect_port}`;
      await navigator.clipboard.writeText(connectCommand);
      
      toast({
        title: t('homepage.connect_copied'),
        description: t('homepage.press_f8_instruction', { command: connectCommand }),
      });
    } catch (error) {
      console.error('Error copying connect command:', error);
      toast({
        title: t('common.error'),
        description: t('homepage.copy_failed'),
        variant: "destructive",
      });
    }
  };

  const handleDiscordClick = () => {
    if (serverInfo.discordUrl) {
      window.open(serverInfo.discordUrl, '_blank');
    } else {
      toast({
        title: t('homepage.discord_unavailable'),
        description: t('homepage.discord_not_configured'),
        variant: "destructive",
      });
    }
  };

  const fetchDesignSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('server_settings')
        .select('setting_value')
        .eq('setting_key', 'design_settings')
        .maybeSingle();

      if (error) {
        console.error('Error fetching design settings:', error);
        return;
      }

      if (data?.setting_value) {
        setDesignSettings(data.setting_value);
      }
    } catch (error) {
      console.error('Error fetching design settings:', error);
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
            title: "Professionelt Staff Team",
            description: "Erfarne moderatorer og administratorer sørger for en fair og sjov oplevelse",
            icon: "Shield",
            color: "text-neon-teal"
          },
          {
            title: "Custom Indhold",
            description: "Unikke scripts, køretøjer og lokationer skabt specielt til vores server",
            icon: "Zap",
            color: "text-neon-gold"
          },
          {
            title: "Aktiv Community",
            description: "Levende Discord fællesskab med events og aktiviteter hver dag",
            icon: "Users",
            color: "text-neon-purple"
          },
          {
            title: "Stabil Performance",
            description: "Optimerede servere med minimal lag og maksimal oppetid",
            icon: "Clock",
            color: "text-neon-blue"
          },
          {
            title: "Regular Updates",
            description: "Ugentlige opdateringer med nyt indhold og fejlrettelser",
            icon: "Gamepad2",
            color: "text-golden-light"
          },
          {
            title: "Realistic Economy",
            description: "Balanceret økonomi system med jobs, forretninger og investeringer",
            icon: "Award",
            color: "text-teal-primary"
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
        return 'bg-neon-teal/20 text-neon-teal border-neon-teal/30';
      case 'maintenance':
        return 'bg-golden-light/20 text-golden-light border-golden-light/30';
      case 'offline':
        return 'bg-red-500/20 text-red-500 border-red-500/30';
      default:
        return 'bg-neon-teal/20 text-neon-teal border-neon-teal/30';
    }
  };


  return (
    <div className="min-h-screen bg-gradient-hero relative overflow-hidden">
      <ParticleBackground />
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${designSettings.hero_image_url || heroImage})` }}
          data-hero-bg
        />
        <div className="absolute inset-0 bg-gaming-darker/70" />
        
        <div className="relative container mx-auto px-4 py-20 text-center z-10">
          <Badge className="mb-6 bg-gradient-to-r from-golden-light to-neon-teal text-gaming-darker border-none px-6 py-2 text-sm font-orbitron hover-glow animate-fade-in">
            <Star className="h-4 w-4 mr-2" />
            {settings.general_settings?.tagline || '#1 PREMIUM FIVEM EXPERIENCE'}
          </Badge>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-bold mb-6 px-4 font-orbitron">
            <span className="bg-gradient-to-r from-golden-light via-neon-gold to-neon-teal bg-clip-text text-transparent text-glow animate-fade-in">
              {settings.general_settings?.server_name || 'Adventure rp'}
            </span>
          </h1>
          
          <p className="text-lg sm:text-xl md:text-2xl text-foreground/90 mb-8 max-w-3xl mx-auto px-4 font-inter">
            {settings.general_settings?.welcome_message || 'Experience the ultimate GTA V roleplay in our cyberpunk-themed city. Professional staff, custom content, and endless possibilities await.'}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 px-4">
            <Button 
              variant="hero" 
              size="lg" 
              className="text-xl px-10 py-4 font-orbitron font-bold text-white bg-gradient-to-r from-golden-light to-golden-dark hover:from-golden-dark hover:to-golden-light border-2 border-golden-light/50 hover:border-golden-light shadow-lg hover:shadow-golden-light/50 hover:scale-105 transition-all duration-300"
              onClick={handleConnectNow}
            >
              <PlayCircle className="h-6 w-6 mr-2" />
              {t('homepage.connect_now')}
            </Button>
            <Button 
              variant="hero" 
              size="lg" 
              className="text-xl px-10 py-4 font-orbitron font-bold text-white bg-gradient-to-r from-teal-primary to-teal-light hover:from-teal-light hover:to-teal-primary border-2 border-teal-primary/50 hover:border-teal-primary shadow-lg hover:shadow-teal-primary/50 hover:scale-105 transition-all duration-300"
              asChild
            >
              <Link to="/apply">
                <Zap className="h-6 w-6 mr-2" />
                {t('homepage.apply_whitelist')}
              </Link>
            </Button>
          </div>

          {/* Social Media Links in Hero */}
          <SocialMediaLinks variant="hero" className="mt-8" />
          
          {/* Detailed Server Dashboard */}
          <div className="max-w-6xl mx-auto mt-12">
            <ServerDashboard />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gaming-dark/80 backdrop-blur-sm relative z-10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-golden-light to-neon-teal bg-clip-text text-transparent mb-4 font-orbitron">
              {homepageFeaturesSection.title}
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto font-inter">
              {homepageFeaturesSection.description}
            </p>
          </div>
          
           <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 auto-rows-fr justify-items-center place-content-center">
            {homepageFeatures.map((feature, index) => (
                <Card 
                  key={index} 
                  className="group p-6 bg-gaming-card/80 backdrop-blur-sm border-2 border-gaming-border hover:border-golden-light hover:bg-gaming-card transition-all duration-300 hover:shadow-lg hover:shadow-golden-light/30 hover:scale-105 animate-fade-in flex flex-col h-full cursor-pointer"
                  style={{ animationDelay: `${index * 200}ms` }}
                >
                  <div className="flex flex-col items-center text-center flex-grow">
                    <div className="mb-4 p-4 rounded-full bg-gaming-darker/50 group-hover:bg-golden-light/20 transition-all duration-300 border border-golden-light/30 group-hover:border-golden-light">
                      <DynamicIcon name={feature.icon} className={`h-8 w-8 ${feature.color} group-hover:scale-125 group-hover:text-golden-light transition-all duration-300`} />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-3 group-hover:text-golden-light transition-colors duration-300 font-orbitron">{feature.title}</h3>
                    <p className="text-muted-foreground group-hover:text-foreground/90 leading-relaxed font-inter transition-colors duration-300">{feature.description}</p>
                  </div>
                </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Server Info Section */}
      <section className="py-12 sm:py-16 lg:py-20 relative z-10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="text-center lg:text-left">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-6 font-orbitron">
                {homepageCta.title?.includes("Future") ? (
                  <>
                    {homepageCta.title.split("Future")[0]}
                    <span className="bg-gradient-cyber bg-clip-text text-transparent">FUTURE</span>
                    {homepageCta.title.split("Future")[1]}
                  </>
                ) : (
                  homepageCta.title
                )}
              </h2>
              <p className="text-base sm:text-lg text-muted-foreground mb-8 font-inter leading-relaxed">
                {homepageCta.description}
              </p>
              <div className="space-y-4">
                {homepageCta.features?.map((feature: string, index: number) => (
                  <div key={index} className="flex items-center space-x-3 group">
                    <div className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      index % 3 === 0 ? 'bg-neon-teal shadow-[0_0_10px_hsl(var(--neon-teal))]' : 
                      index % 3 === 1 ? 'bg-neon-gold shadow-[0_0_10px_hsl(var(--neon-gold))]' : 'bg-neon-blue shadow-[0_0_10px_hsl(var(--neon-blue))]'
                    } group-hover:scale-125`} />
                    <span className="text-foreground font-inter group-hover:text-golden-primary transition-colors">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <Card className="group p-8 bg-gaming-card/80 backdrop-blur-sm border-2 border-gaming-border hover:border-teal-primary hover:bg-gaming-card transition-all duration-300 hover:shadow-lg hover:shadow-teal-primary/30 hover:scale-105 cursor-pointer">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-foreground mb-6 font-orbitron flex items-center justify-center group-hover:text-teal-primary transition-colors duration-300">
                  <Gamepad2 className="h-6 w-6 mr-2 text-teal-primary group-hover:scale-110 transition-transform duration-300" />
                  {t('homepage.server_information')}
                </h3>
                <div className="space-y-6">
                  <div className="flex justify-between items-center p-3 bg-gaming-darker/50 rounded-lg border border-gaming-border/50">
                    <span className="text-muted-foreground font-inter">{t('homepage.server_ip')}:</span>
                    <code className="bg-gaming-dark px-4 py-2 rounded font-mono text-teal-primary border border-teal-primary/30">
                      {serverInfo.displayIp}
                    </code>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gaming-darker/50 rounded-lg border border-gaming-border/50">
                    <span className="text-muted-foreground font-inter">{t('homepage.discord')}:</span>
                    <Button 
                      variant="neon" 
                      size="sm"
                      className="font-orbitron bg-gradient-to-r from-teal-primary to-teal-light hover:from-teal-light hover:to-teal-primary border-2 border-teal-primary/50 hover:border-teal-primary text-white hover:scale-105 transition-all duration-300 hover:shadow-lg hover:shadow-teal-primary/50"
                      onClick={handleDiscordClick}
                      disabled={!serverInfo.discordUrl}
                    >
                      <Globe className="h-4 w-4 mr-2" />
                      {t('homepage.join_discord')}
                    </Button>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gaming-darker/50 rounded-lg border border-gaming-border/50">
                    <span className="text-muted-foreground font-inter">{t('homepage.status')}:</span>
                    <Badge className={`${getStatusStyle(serverInfo.status)} font-orbitron px-4 py-2`}>
                      <Award className="h-3 w-3 mr-1" />
                      {t(`homepage.status_${serverInfo.status}`)}
                    </Badge>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>
      
      {/* Live Chat Widget */}
      <LiveChatWidget />
    </div>
  );
};

export default Index;
