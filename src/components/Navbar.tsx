import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import { 
  Server, LogIn, LogOut, User, Menu, X,
  Home, FileSearch, Scale, CreditCard, Users as UsersIcon, 
  Globe, Heart, Tv, UserCheck, Trophy, Calendar, 
  Vote, FileText, BarChart3, Palette, Shield, Settings
} from "lucide-react";
import { useCustomAuth } from '@/hooks/useCustomAuth';
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNavbarOverflow } from "@/hooks/useNavbarOverflow";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import CFXStatusIndicator from "@/components/CFXStatusIndicator";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useTranslation } from 'react-i18next';

const Navbar = () => {
  const { user, signOut } = useCustomAuth();
  const { t } = useTranslation();
  const [isStaff, setIsStaff] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [configLoaded, setConfigLoaded] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [serverName, setServerName] = useState("adventure rp");
  // Navigation groups structure like the staff sidebar
  const navigationGroups = [
    {
      group: "Public",
      items: [
        { id: 'home', label: t('navigation.home'), path: '/', icon: Home, visible: true, order: 0, staffOnly: false, userOnly: false },
        { id: 'rules', label: t('navigation.rules'), path: '/rules', icon: FileSearch, visible: true, order: 1, staffOnly: false, userOnly: false },
        { id: 'laws', label: t('navigation.laws'), path: '/laws', icon: Scale, visible: true, order: 2, staffOnly: false, userOnly: false },
        { id: 'packages', label: t('navigation.packages'), path: '/packages', icon: CreditCard, visible: true, order: 3, staffOnly: false, userOnly: false },
        { id: 'live', label: t('navigation.live'), path: '/live', icon: Tv, visible: true, order: 7, staffOnly: false, userOnly: false },
      ]
    },
    {
      group: "Community", 
      items: [
        { id: 'team', label: t('navigation.team'), path: '/team', icon: UsersIcon, visible: true, order: 4, staffOnly: false, userOnly: false },
        { id: 'partners', label: t('navigation.partners'), path: '/partners', icon: Globe, visible: true, order: 5, staffOnly: false, userOnly: false },
        { id: 'supporters', label: t('navigation.supporters'), path: '/supporters', icon: Heart, visible: true, order: 6, staffOnly: false, userOnly: false },
        { id: 'characters', label: t('navigation.characters'), path: '/characters', icon: UserCheck, visible: true, order: 8, staffOnly: false, userOnly: false },
        { id: 'events', label: t('navigation.events'), path: '/events', icon: Calendar, visible: true, order: 9, staffOnly: false, userOnly: false },
        { id: 'voting', label: t('navigation.voting'), path: '/voting', icon: Vote, visible: true, order: 10, staffOnly: false, userOnly: false },
        { id: 'achievements', label: t('navigation.achievements'), path: '/achievements', icon: Trophy, visible: true, order: 11, staffOnly: false, userOnly: false },
      ]
    },
    {
      group: "User Features",
      items: [
        { id: 'apply', label: t('navigation.apply'), path: '/apply', icon: FileText, visible: true, order: 12, staffOnly: false, userOnly: true },
        { id: 'profile', label: t('navigation.profile'), path: '/profile', icon: User, visible: true, order: 13, staffOnly: false, userOnly: true },
      ]
    },
    {
      group: "Staff Tools",
      items: [
        { id: 'staff', label: t('navigation.staff_panel'), path: '/staff', icon: Shield, visible: true, order: 14, staffOnly: true, userOnly: false },
        { id: 'servers', label: t('navigation.server_management'), path: '/servers', icon: Server, visible: true, order: 15, staffOnly: true, userOnly: false },
        { id: 'analytics', label: t('navigation.analytics'), path: '/analytics', icon: BarChart3, visible: true, order: 16, staffOnly: true, userOnly: false },
        { id: 'creative-tools', label: t('navigation.creative_tools'), path: '/creative-tools', icon: Palette, visible: true, order: 17, staffOnly: true, userOnly: false }
      ]
    }
  ];

  const [navbarConfig, setNavbarConfig] = useState({
    items: navigationGroups.flatMap(group => group.items)
  });
  const isMobile = useIsMobile();

  // Get visible navigation items with proper permission filtering
  const getVisibleItems = () => {
    if (!configLoaded) return [];
    return navbarConfig.items
      .filter(item => {
        // Always show if not visible
        if (!item.visible) return false;
        
        // Filter staff-only items
        if (item.staffOnly && !isStaff) return false;
        
        // Filter user-only items (require authentication)
        if (item.userOnly && !user) return false;
        
        return true;
      })
      .sort((a, b) => a.order - b.order);
  };

  const visibleItems = getVisibleItems();
  const { isOverflowing, containerRef, contentRef } = useNavbarOverflow(visibleItems, !isMobile);
  
  // Always show desktop navigation with scrolling instead of hamburger menu on overflow
  const shouldUseHamburgerMenu = isMobile;

  // Fetch user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) {
        setUserProfile(null);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching user profile:', error);
        } else {
          setUserProfile(data);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    fetchUserProfile();

    // Set up real-time subscription for profile changes
    if (user) {
      const channel = supabase
        .channel('user-profile-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'custom_users',
            filter: `id=eq.${user.id}`
          },
          (payload) => {
            console.log('User profile updated:', payload);
            if (payload.new) {
              setUserProfile(payload.new);
            } else if (payload.eventType === 'DELETE') {
              setUserProfile(null);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  useEffect(() => {
    const checkStaffRole = async () => {
      if (!user) {
        setIsStaff(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .rpc('is_staff', { check_user_uuid: user.id });

        if (error) {
          console.error('Error checking staff role:', error);
          setIsStaff(false);
        } else {
          setIsStaff(data);
        }
      } catch (error) {
        console.error('Error checking staff role:', error);
        setIsStaff(false);
      }
    };

    checkStaffRole();
  }, [user]);

  useEffect(() => {
    const loadNavbarConfig = async () => {
      try {
        const { data } = await supabase
          .from('server_settings')
          .select('setting_value')
          .eq('setting_key', 'navbar_config')
          .maybeSingle();
          
        if (data?.setting_value) {
          console.log('Loading navbar config from database:', data.setting_value);
          // Merge database config with our navigation groups structure
          const dbConfig = data.setting_value as any;
          if (dbConfig.items && Array.isArray(dbConfig.items)) {
            const mergedItems = navigationGroups.flatMap(group => 
              group.items.map(item => {
                const dbItem = dbConfig.items.find((db: any) => db.id === item.id);
                return dbItem ? { ...item, ...dbItem, icon: item.icon } : item;
              })
            );
            setNavbarConfig({ items: mergedItems });
          }
        } else {
          console.log('No navbar config found in database, using default');
        }
        setConfigLoaded(true);
      } catch (error) {
        console.error('Error loading navbar config:', error);
        setConfigLoaded(true);
      }
    };

    const loadServerName = async () => {
      try {
        const { data } = await supabase
          .from('server_settings')
          .select('setting_value')
          .eq('setting_key', 'general_settings')
          .maybeSingle();

        if (data?.setting_value && typeof data.setting_value === 'object' && 
            data.setting_value !== null && 'server_name' in data.setting_value) {
          setServerName((data.setting_value as any).server_name);
        }
      } catch (error) {
        console.error('Error loading server name:', error);
      }
    };

    Promise.all([loadNavbarConfig(), loadServerName()]);

    // Set up real-time subscription for navbar config changes
    const navChannel = supabase
      .channel('navbar-config-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'server_settings',
          filter: 'setting_key=eq.navbar_config'
        },
        (payload) => {
          console.log('Navbar config updated:', payload);
          if (payload.new && (payload.new as any).setting_value) {
            const dbConfig = (payload.new as any).setting_value as any;
            if (dbConfig.items && Array.isArray(dbConfig.items)) {
              const mergedItems = navigationGroups.flatMap(group => 
                group.items.map(item => {
                  const dbItem = dbConfig.items.find((db: any) => db.id === item.id);
                  return dbItem ? { ...item, ...dbItem, icon: item.icon } : item;
                })
              );
              setNavbarConfig({ items: mergedItems });
            }
          }
        }
      )
      .subscribe();

    // Set up real-time subscription for server name changes
    const serverChannel = supabase
      .channel('server-name-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'server_settings',
          filter: 'setting_key=eq.general_settings'
        },
        (payload) => {
          console.log('Server settings updated:', payload);
          if (payload.new && (payload.new as any).setting_value && 
              typeof (payload.new as any).setting_value === 'object' && 
              'server_name' in (payload.new as any).setting_value) {
            setServerName((payload.new as any).setting_value.server_name);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(navChannel);
      supabase.removeChannel(serverChannel);
    };
  }, []);

  // Update navbar config items with translations when language changes
  useEffect(() => {
    if (!configLoaded) return; // Prevent updates before config is loaded
    
    const getTranslationKey = (itemId: string) => {
      switch (itemId) {
        case 'staff': return 'navigation.staff_panel';
        case 'servers': return 'navigation.server_management';
        case 'users': return 'staff.user_management';
        case 'characters': return 'navigation.characters';
        case 'events': return 'navigation.events';
        case 'voting': return 'navigation.voting';
        case 'achievements': return 'navigation.achievements';
        case 'analytics': return 'navigation.analytics';
        case 'creative-tools': return 'navigation.creative_tools';
        default: return `navigation.${itemId}`;
      }
    };

    setNavbarConfig(prev => ({
      ...prev,
      items: prev.items.map(item => ({
        ...item,
        label: t(getTranslationKey(item.id)) || item.label
      }))
    }));
  }, [t, configLoaded]); // Added configLoaded dependency

  const NavLinks = ({ forceVertical = false }: { forceVertical?: boolean } = {}) => {
    const location = useLocation();
    
    // Don't render until config is loaded
    if (!configLoaded) {
      return null;
    }

    if (forceVertical || shouldUseHamburgerMenu) {
      // Render grouped navigation for mobile/vertical layout (like sidebar)
      return (
        <>
          {navigationGroups.map((group) => {
            const groupItems = group.items.filter(item => {
              if (!item.visible) return false;
              if (item.staffOnly && !isStaff) return false;
              if (item.userOnly && !user) return false;
              return true;
            });

            if (groupItems.length === 0) return null;

            return (
              <div key={group.group} className="py-4">
                <div className="text-primary font-bold px-4 py-3 text-xs uppercase tracking-[0.1em] bg-gaming-darker/30 rounded-lg mb-2 border-l-3 border-primary/50">
                  {group.group}
                </div>
                <div className="space-y-1.5 px-1">
                  {groupItems.map((item) => (
                    <Link 
                      key={item.id}
                      to={item.path} 
                      className={`
                        flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 group relative overflow-hidden
                        ${location.pathname === item.path 
                          ? "bg-gradient-to-r from-primary/25 via-primary/15 to-secondary/25 text-primary border-l-4 border-primary shadow-xl shadow-primary/10 scale-[1.02]"
                          : "text-muted-foreground hover:text-foreground hover:bg-gaming-darker/60 hover:scale-[1.02] hover:shadow-lg hover:border-l-4 hover:border-primary/30"
                        }
                      `}
                      onClick={() => setIsOpen(false)}
                    >
                      <div className={`p-2.5 rounded-lg transition-all duration-300 mr-4 relative z-10 ${
                        location.pathname === item.path 
                          ? "bg-primary/30 text-primary shadow-md" 
                          : "group-hover:bg-primary/20 group-hover:text-primary group-hover:shadow-md"
                      }`}>
                        <item.icon className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-semibold relative z-10 tracking-wide">
                        {item.label}
                      </span>
                      {location.pathname === item.path && (
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5 animate-pulse" />
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </>
      );
    }

    // Render horizontal navigation for desktop (simplified, no groups)
    const items = visibleItems;
    return (
      <>
        {items.map((item) => {
          const IconComponent = navigationGroups
            .flatMap(g => g.items)
            .find(navItem => navItem.id === item.id)?.icon || Home;
            
          return (
            <Link 
              key={item.id}
              to={item.path} 
              className={`
                flex items-center px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 group whitespace-nowrap relative overflow-hidden
                ${location.pathname === item.path 
                  ? "bg-gradient-to-r from-primary/25 via-primary/15 to-secondary/20 text-primary border border-primary/40 shadow-lg shadow-primary/20 scale-[1.05]"
                  : "text-muted-foreground hover:text-foreground hover:bg-gaming-darker/70 hover:scale-[1.03] hover:shadow-md hover:border hover:border-primary/20"
                }
              `}
              onClick={() => setIsOpen(false)}
            >
              <div className={`p-2 rounded-lg transition-all duration-300 mr-3 relative z-10 ${
                location.pathname === item.path 
                  ? "bg-primary/30 text-primary shadow-md" 
                  : "group-hover:bg-primary/20 group-hover:text-primary group-hover:shadow-sm"
              }`}>
                <IconComponent className="h-4 w-4" />
              </div>
              <span className="text-sm font-bold tracking-wide relative z-10">
                {item.label}
              </span>
              {location.pathname === item.path && (
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5 animate-pulse" />
              )}
            </Link>
          );
        })}
      </>
    );
  };

  const UserSection = () => (
    <div className="flex flex-col md:flex-row items-start md:items-center space-y-3 md:space-y-0 md:space-x-4">
      {user ? (
        <>
          <Link to="/profile" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <Avatar className="h-8 w-8">
              <AvatarImage 
                src={userProfile?.avatar_url || user.avatar_url} 
                alt={userProfile?.username || user.username || user.email || 'User'} 
              />
              <AvatarFallback className="bg-neon-purple/20 text-neon-purple text-xs">
                {(userProfile?.username || user.username || user.email || 'U').charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-foreground">
              {userProfile?.username || user.username || user.full_name || user.email}
            </span>
          </Link>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              signOut();
              setIsOpen(false);
            }}
            className="hover:border-neon-purple/50 w-full md:w-auto"
          >
            <LogOut className="h-4 w-4 mr-1" />
            {t('common.logout')}
          </Button>
        </>
      ) : (
        <Button 
          variant="neon" 
          size="sm" 
          asChild 
          className="w-full md:w-auto"
        >
          <Link to="/auth" onClick={() => setIsOpen(false)}>
            <LogIn className="h-4 w-4 mr-1" />
            {t('common.login')}
          </Link>
        </Button>
      )}
    </div>
  );

  return (
     <nav className="border-b border-gaming-border bg-gaming-card/95 backdrop-blur-xl sticky top-0 z-50 shadow-xl shadow-gaming-darker/20">
      <div ref={containerRef} className="container mx-auto px-6 h-18 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="p-3 rounded-xl bg-gradient-to-br from-primary via-primary/90 to-secondary transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-lg shadow-primary/25">
            <Server className="h-7 w-7 text-white" />
          </div>
          <div className="animate-fade-in relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5 rounded-lg blur-xl opacity-60 animate-pulse" />
            <div className="relative z-10">
              <span className="text-2xl font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent tracking-tight drop-shadow-sm">
                {serverName}
              </span>
              <div className="flex items-center space-x-2 -mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-primary to-secondary animate-pulse" />
                <p className="text-xs text-muted-foreground/90 tracking-wider uppercase font-semibold bg-gradient-to-r from-muted-foreground/60 to-muted-foreground/90 bg-clip-text text-transparent">
                  {t('common.dashboard')}
                </p>
              </div>
            </div>
          </div>
        </Link>
        
        {shouldUseHamburgerMenu ? (
          /* Hamburger menu for mobile and desktop overflow */
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="hover:bg-gaming-darker/80 hover:scale-110 transition-all duration-300 rounded-lg"
              >
                <Menu className="h-6 w-6 text-foreground" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[380px] bg-gaming-card/95 border-gaming-border backdrop-blur-xl">
              <div className="flex flex-col mt-8">
                <div className="border-b border-gaming-border pb-6 mb-2">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-primary via-primary/90 to-secondary shadow-lg shadow-primary/25">
                      <Server className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">{serverName}</h2>
                      <p className="text-sm text-muted-foreground/80 tracking-wide font-medium">Navigation Menu</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col custom-scrollbar max-h-[55vh] overflow-y-auto pr-2">
                  <NavLinks forceVertical={true} />
                </div>
                
                <div className="border-t border-gaming-border pt-6">
                  <CFXStatusIndicator />
                </div>
                
                <div className="border-t border-gaming-border pt-6">
                  <LanguageSwitcher />
                </div>
                
                <div className="border-t border-gaming-border pt-6">
                  <UserSection />
                </div>
              </div>
            </SheetContent>
          </Sheet>
        ) : (
          /* Desktop navigation when not overflowing */
          <>
            <div ref={contentRef} className="flex items-center space-x-2 bg-gaming-card/80 rounded-2xl px-4 py-3 border border-gaming-border/60 overflow-x-auto navbar-scrollbar max-w-[60vw] backdrop-blur-md shadow-lg shadow-gaming-darker/10">
              <div className="flex items-center space-x-2 min-w-max">
                <NavLinks />
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <CFXStatusIndicator />
              <LanguageSwitcher />
              <UserSection />
            </div>
          </>
        )}
        
        {shouldUseHamburgerMenu && (
          /* Show basic user controls when using hamburger menu */
          <div className="flex items-center space-x-2">
            <CFXStatusIndicator />
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;