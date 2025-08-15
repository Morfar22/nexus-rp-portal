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
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsBanned(false); // Reset ban status, let protected routes handle it
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsBanned(false); // Reset ban status
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Real-time ban detection - immediately kick out users when banned
  useEffect(() => {
    if (!user?.id) return;

    console.log(`🔄 Setting up real-time ban detection for user: ${user.id}`);

    const channel = supabase
      .channel('ban-detection')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,
        },
        async (payload) => {
          console.log('🔄 Profile updated for current user:', payload);
          
          // Check if the user was just banned (banned changed from false to true)
          if (payload.new?.banned && !payload.old?.banned) {
            console.log('🚨 User was banned in real-time, immediately signing out...');
            setIsBanned(true);
            
            // Immediately sign out and redirect
            try {
              await supabase.auth.signOut({ scope: 'global' });
              Object.keys(localStorage).forEach((key) => {
                if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
                  localStorage.removeItem(key);
                }
              });
              window.location.href = '/auth';
            } catch (error) {
              console.error('Error during emergency signout:', error);
              // Force refresh as fallback
              window.location.reload();
            }
          }
        }
      )
      .subscribe();

    return () => {
      console.log('🔄 Cleaning up real-time ban detection');
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

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