import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isBanned: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBanned, setIsBanned] = useState(false);

  const cleanupAuthState = () => {
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        localStorage.removeItem(key);
      }
    });
  };

  const signOut = async () => {
    try {
      cleanupAuthState();
      
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        // Continue even if this fails
      }
      
      window.location.href = '/auth';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Check if user is banned when they sign in
          await checkBanStatus(session.user.id);
        } else {
          setIsBanned(false);
        }
        
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // Check if user is banned for existing session
        await checkBanStatus(session.user.id);
      } else {
        setIsBanned(false);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Real-time ban checking - listen for profile changes
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('profile-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,
        },
        async (payload) => {
          console.log('🔄 Profile updated:', payload);
          // Check if the user was banned
          if (payload.new?.banned && !payload.old?.banned) {
            console.log('🚨 User was banned, signing out...');
            setIsBanned(true);
            await signOut();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const checkBanStatus = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('banned')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error checking ban status:', error);
        return;
      }

      if (profile?.banned) {
        setIsBanned(true);
        // Only auto-signout if NOT on the auth page (let auth page handle it)
        if (window.location.pathname !== '/auth') {
          console.log('🚨 User is banned, signing out...');
          await signOut();
        } else {
          console.log('🚨 User is banned but on auth page, letting auth page handle it');
        }
      } else {
        setIsBanned(false);
      }
    } catch (error) {
      console.error('Error checking ban status:', error);
    }
  };

  const value = {
    user,
    session,
    loading,
    isBanned,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};