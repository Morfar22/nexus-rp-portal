import { useState, useEffect } from 'react';
import { Instagram, Facebook, Youtube, Music } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SocialMediaSettings {
  instagram_enabled: boolean;
  instagram_url: string;
  facebook_enabled: boolean;
  facebook_url: string;
  tiktok_enabled: boolean;
  tiktok_url: string;
  youtube_enabled: boolean;
  youtube_url: string;
  show_in_footer: boolean;
  show_in_hero: boolean;
  animation_enabled: boolean;
}

interface SocialMediaLinksProps {
  variant?: 'footer' | 'hero' | 'sidebar';
  className?: string;
}

export default function SocialMediaLinks({ variant = 'footer', className = '' }: SocialMediaLinksProps) {
  const [settings, setSettings] = useState<SocialMediaSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
    
    // Subscribe to real-time changes
    const channel = supabase
      .channel('social_media_settings')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'server_settings',
          filter: 'setting_key=eq.social_media_settings'
        },
        () => {
          fetchSettings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('server_settings')
        .select('setting_value')
        .eq('setting_key', 'social_media_settings')
        .maybeSingle();

      if (error) throw error;

      if (data?.setting_value) {
        setSettings(data.setting_value as unknown as SocialMediaSettings);
      }
    } catch (error) {
      console.error('Error fetching social media settings:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !settings) return null;

  // Check if should show based on variant
  if (variant === 'footer' && !settings.show_in_footer) return null;
  if (variant === 'hero' && !settings.show_in_hero) return null;

  // Get enabled social links
  const socialLinks = [];
  
  if (settings.instagram_enabled && settings.instagram_url) {
    socialLinks.push({
      name: 'Instagram',
      url: settings.instagram_url,
      icon: Instagram,
      color: 'hover:text-pink-500 hover:shadow-[0_0_20px_rgba(236,72,153,0.5)]',
      bgColor: 'hover:bg-pink-500/10'
    });
  }

  if (settings.facebook_enabled && settings.facebook_url) {
    socialLinks.push({
      name: 'Facebook',
      url: settings.facebook_url,
      icon: Facebook,
      color: 'hover:text-blue-600 hover:shadow-[0_0_20px_rgba(37,99,235,0.5)]',
      bgColor: 'hover:bg-blue-600/10'
    });
  }

  if (settings.tiktok_enabled && settings.tiktok_url) {
    socialLinks.push({
      name: 'TikTok',
      url: settings.tiktok_url,
      icon: Music,
      color: 'hover:text-white hover:shadow-[0_0_20px_rgba(255,255,255,0.5)]',
      bgColor: 'hover:bg-white/10'
    });
  }

  if (settings.youtube_enabled && settings.youtube_url) {
    socialLinks.push({
      name: 'YouTube',
      url: settings.youtube_url,
      icon: Youtube,
      color: 'hover:text-red-600 hover:shadow-[0_0_20px_rgba(220,38,38,0.5)]',
      bgColor: 'hover:bg-red-600/10'
    });
  }

  if (socialLinks.length === 0) return null;

  const baseStyles = variant === 'footer' 
    ? 'flex items-center justify-center gap-4 mt-6' 
    : variant === 'hero'
    ? 'flex items-center justify-center gap-6'
    : 'flex items-center gap-3';

  const buttonBaseStyles = `
    group relative flex items-center justify-center 
    w-12 h-12 rounded-xl 
    bg-gaming-card/50 backdrop-blur-sm 
    border border-gaming-border 
    text-muted-foreground
    transition-all duration-300 ease-out
    hover:scale-110 hover:border-primary/50
    ${settings.animation_enabled ? 'animate-fade-in' : ''}
  `;

  const iconStyles = variant === 'hero' ? 'h-6 w-6' : 'h-5 w-5';

  return (
    <div className={`${baseStyles} ${className}`}>
      {socialLinks.map((social, index) => {
        const Icon = social.icon;
        return (
          <a
            key={social.name}
            href={social.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`${buttonBaseStyles} ${social.color} ${social.bgColor}`}
            style={{
              animationDelay: settings.animation_enabled ? `${index * 150}ms` : '0ms'
            }}
            aria-label={`Follow us on ${social.name}`}
          >
            <Icon className={`${iconStyles} transition-all duration-300 group-hover:scale-110`} />
            
            {/* Glow effect */}
            <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-transparent via-primary/5 to-transparent" />
            
            {/* Tooltip */}
            <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gaming-darker text-foreground text-xs px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none whitespace-nowrap border border-gaming-border shadow-lg z-10">
              {social.name}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-gaming-darker"></div>
            </div>
          </a>
        );
      })}
    </div>
  );
}