import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface User {
  id: string;
  email: string;
  username?: string;
  email_verified: boolean;
  role: string;
  avatar_url?: string;
  full_name?: string;
  created_at: string;
}

interface CustomAuthContextType {
  user: User | null;
  session_token: string | null;
  loading: boolean;
  isBanned: boolean;
  signUp: (email: string, password: string, username?: string) => Promise<{ error: string | null; success?: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null; success?: boolean; banned?: boolean; userInfo?: any }>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  forceRefreshUser: () => Promise<User | null>;
}

const CustomAuthContext = createContext<CustomAuthContextType | undefined>(undefined);

export const useCustomAuth = () => {
  const context = useContext(CustomAuthContext);
  if (context === undefined) {
    throw new Error('useCustomAuth must be used within a CustomAuthProvider');
  }
  return context;
};

interface CustomAuthProviderProps {
  children: ReactNode;
}

export const CustomAuthProvider = ({ children }: CustomAuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session_token, setSessionToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBanned, setIsBanned] = useState(false);

  const clearAuth = () => {
    setUser(null);
    setSessionToken(null);
    setIsBanned(false);
    localStorage.removeItem('custom_session_token');
  };

  const signUp = async (email: string, password: string, username?: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('custom-signup', {
        body: { email, password, username }
      });

      if (error) throw error;

      if (data.error) {
        return { error: data.error };
      }

      return { error: null, success: true };
    } catch (error: any) {
      return { error: error.message || 'Signup failed' };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('custom-login', {
        body: { email, password }
      });

      if (error) throw error;

      if (data.error) {
        if (data.banned) {
          return { error: data.error, banned: true, userInfo: data.userInfo };
        }
        // If login fails due to password mismatch, suggest password reset
        if (data.error.includes('Invalid credentials') || data.error.includes('Password verification failed')) {
          return { error: 'Invalid email or password. If you forgot your password, please use the "Forgot Password" option.' };
        }
        return { error: data.error };
      }

      if (data.success && data.user && data.session_token) {
        setUser(data.user);
        setSessionToken(data.session_token);
        localStorage.setItem('custom_session_token', data.session_token);
        return { error: null, success: true };
      }

      return { error: 'Login failed' };
    } catch (error: any) {
      console.error('Login error:', error);
      return { error: error.message || 'Login failed' };
    }
  };

  const signOut = async () => {
    try {
      if (session_token) {
        await supabase.functions.invoke('custom-logout', {
          body: { session_token }
        });
      }
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      clearAuth();
      window.location.href = '/auth';
    }
  };

  const forceRefreshUser = async () => {
    const token = localStorage.getItem('custom_session_token');
    if (!token) return;

    try {
      const { data, error } = await supabase.functions.invoke('validate-session', {
        body: { session_token: token }
      });

      if (error) throw error;

      if (data.valid && data.user) {
        console.log('Force refreshing user data:', data.user);
        setUser(data.user);
        setSessionToken(token);
        return data.user;
      } else {
        clearAuth();
        return null;
      }
    } catch (error) {
      console.error('Error force refreshing user:', error);
      clearAuth();
      return null;
    }
  };

  const refreshSession = async () => {
    const token = localStorage.getItem('custom_session_token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('validate-session', {
        body: { session_token: token }
      });

      if (error) throw error;

      if (data.valid && data.user) {
        // Force refresh user data from database to get latest role
        setUser({
          ...data.user,
          role: data.user.role // This will now have the updated admin role
        });
        setSessionToken(token);
      } else {
        if (data.banned) {
          setIsBanned(true);
        }
        clearAuth();
      }
    } catch (error) {
      console.error('Session validation error:', error);
      clearAuth();
    } finally {
      setLoading(false);
    }
  };

  // Also ensure loading is properly set to false on auth page
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('verified') === 'true') {
      // Clear the URL parameter
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    // If on auth page and no token, immediately set loading to false
    if (window.location.pathname === '/auth' && !localStorage.getItem('custom_session_token')) {
      setLoading(false);
    }
  }, []);

  // Initialize and validate session
  useEffect(() => {
    const initSession = async () => {
      setLoading(true);
      await refreshSession();
    };
    initSession();
  }, []);

  // Periodic session validation
  useEffect(() => {
    if (!session_token) return;

    const interval = setInterval(refreshSession, 5 * 60 * 1000); // Check every 5 minutes
    return () => clearInterval(interval);
  }, [session_token]);

  const value = {
    user,
    session_token,
    loading,
    isBanned,
    signUp,
    signIn,
    signOut,
    refreshSession,
    forceRefreshUser,
  };

  return (
    <CustomAuthContext.Provider value={value}>
      {children}
    </CustomAuthContext.Provider>
  );
};