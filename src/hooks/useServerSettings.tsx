import { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCustomAuth } from './useCustomAuth';

interface ServerSettings {
  general_settings: {
    server_name: string;
    tagline: string;
    welcome_message: string;
    maintenance_mode: boolean;
  };
  application_settings: {
    accept_applications: boolean;
    multiple_applications_allowed?: boolean;
    auto_close_applications?: boolean;
    require_age_verification?: boolean;
    cooldown_days?: number;
  };
  security_settings: {
    require_2fa: boolean;
    ip_whitelist: boolean;
    whitelisted_ips?: string[];
  };
  performance_settings: {
    monitoring: boolean;
  };
  discord_settings: {
    server_id: string;
    auto_roles: boolean;
    sync_roles: boolean;
  };
  discord_logging: {
    enabled: boolean;
    webhook_url: string;
    log_rule_changes: boolean;
    log_user_actions: boolean;
    log_system_changes: boolean;
    log_application_actions: boolean;
  };
  social_media_settings: {
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
  };
}

interface ServerSettingsContextType {
  settings: ServerSettings;
  loading: boolean;
  updateSetting: (key: keyof ServerSettings, value: any) => Promise<void>;
  refreshSettings: () => Promise<void>;
}

const defaultSettings: ServerSettings = {
  general_settings: {
    server_name: 'Adventure rp',
    tagline: '#1 PREMIUM FIVEM EXPERIENCE',
    welcome_message: 'Welcome to our server!',
    maintenance_mode: false,
  },
  application_settings: {
    accept_applications: true,
    multiple_applications_allowed: false,
    auto_close_applications: false,
    require_age_verification: false,
    cooldown_days: 0,
  },
  security_settings: {
    require_2fa: false,
    ip_whitelist: false,
    whitelisted_ips: [],
  },
  performance_settings: {
    monitoring: false,
  },
  discord_settings: {
    server_id: '',
    auto_roles: false,
    sync_roles: false,
  },
  discord_logging: {
    enabled: false,
    webhook_url: '',
    log_rule_changes: true,
    log_user_actions: true,
    log_system_changes: true,
    log_application_actions: true,
  },
  social_media_settings: {
    instagram_enabled: false,
    instagram_url: '',
    facebook_enabled: false,
    facebook_url: '',
    tiktok_enabled: false,
    tiktok_url: '',
    youtube_enabled: false,
    youtube_url: '',
    show_in_footer: true,
    show_in_hero: false,
    animation_enabled: true,
  },
};

const ServerSettingsContext = createContext<ServerSettingsContextType | undefined>(undefined);

export const ServerSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<ServerSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const { user } = useCustomAuth();

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('server_settings')
        .select('setting_key, setting_value')
        .in('setting_key', [
          'general_settings',
          'application_settings', 
          'security_settings',
          'performance_settings',
          'discord_settings',
          'discord_logging',
          'social_media_settings'
        ]);

      if (error) throw error;

      const newSettings = { ...defaultSettings };
      
      data?.forEach(setting => {
        const key = setting.setting_key as keyof ServerSettings;
        const value = setting.setting_value as any;
        if (value && typeof value === 'object') {
          // Merge with defaults so missing flags (like accept_applications) keep default values
          newSettings[key] = { ...(defaultSettings[key] as any), ...value } as any;
        }
      });

      setSettings(newSettings);
    } catch (error) {
      console.error('Error fetching server settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: keyof ServerSettings, value: any) => {
    try {
      const { error } = await supabase
        .from('server_settings')
        .upsert({
          setting_key: key,
          setting_value: value,
          created_by: user?.id,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'setting_key'
        });

      if (error) throw error;

      setSettings(prev => ({
        ...prev,
        [key]: value
      }));
    } catch (error) {
      console.error('Error updating setting:', error);
      throw error;
    }
  };

  const refreshSettings = async () => {
    setLoading(true);
    await fetchSettings();
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return (
    <ServerSettingsContext.Provider value={{
      settings,
      loading,
      updateSetting,
      refreshSettings
    }}>
      {children}
    </ServerSettingsContext.Provider>
  );
};

export const useServerSettings = () => {
  const context = useContext(ServerSettingsContext);
  if (context === undefined) {
    throw new Error('useServerSettings must be used within a ServerSettingsProvider');
  }
  return context;
};