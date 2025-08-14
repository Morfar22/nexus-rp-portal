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

  const checkBanStatus = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('banned')
        .eq('id', userId)
        .maybeSingle();
      
      if (error) {
        console.error('Error checking ban status:', error);
        return false;
      }
      
      return data?.banned || false;
    } catch (error) {
      console.error('Error checking ban status:', error);
      return false;
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Check ban status if user is signed in
        if (session?.user) {
          const banned = await checkBanStatus(session.user.id);
          setIsBanned(banned);
          
          // If user is banned, sign them out immediately
          if (banned) {
            setTimeout(async () => {
              await signOut();
            }, 0);
            return;
          }
        } else {
          setIsBanned(false);
        }
        
        setLoading(false);
      }
    );

    // THEN check for existing session
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          const banned = await checkBanStatus(session.user.id);
          setIsBanned(banned);
          
          // If user is banned, sign them out immediately
          if (banned) {
            setTimeout(async () => {
              await signOut();
            }, 0);
            return;
          }
        } else {
          setIsBanned(false);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error during auth initialization:', error);
        setLoading(false);
      }
    };
    
    initAuth();

    return () => subscription.unsubscribe();
  }, []);

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