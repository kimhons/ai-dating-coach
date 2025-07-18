import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import {Session, User as SupabaseUser} from '@supabase/supabase-js';
import {supabase} from '@/services/supabase';
import type {User, PersonaType, GoalType} from '@/types';
import {showToast} from '@/utils/toast';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  completeOnboarding: (
    persona: PersonaType,
    goals: GoalType[],
  ) => Promise<void>;
  hasCompletedOnboarding: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({children}) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!session?.user;
  const hasCompletedOnboarding = !!user?.persona_type;

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({data: {session}}) => {
      setSession(session);
      if (session?.user) {
        loadUserProfile(session.user);
      } else {
        setIsLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: {subscription},
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      
      if (session?.user) {
        await loadUserProfile(session.user);
      } else {
        setUser(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (supabaseUser: SupabaseUser) => {
    try {
      const {data, error} = await supabase
        .from('users')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      if (error && error.code === 'PGRST116') {
        // User doesn't exist in our users table, create them
        const newUser: Omit<User, 'created_at' | 'updated_at'> = {
          id: supabaseUser.id,
          email: supabaseUser.email!,
          full_name: supabaseUser.user_metadata?.full_name || '',
          avatar_url: supabaseUser.user_metadata?.avatar_url || '',
          subscription_tier: 'spark',
          subscription_status: 'active',
        };

        const {data: createdUser, error: createError} = await supabase
          .from('users')
          .insert(newUser)
          .select()
          .single();

        if (createError) throw createError;
        setUser(createdUser);
      } else if (error) {
        throw error;
      } else {
        setUser(data);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      showToast('Error loading profile', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
  ): Promise<void> => {
    try {
      setIsLoading(true);
      const {error} = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) throw error;
      showToast('Check your email for verification link', 'success');
    } catch (error: any) {
      console.error('Sign up error:', error);
      showToast(error.message || 'Failed to sign up', 'error');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string): Promise<void> => {
    try {
      setIsLoading(true);
      const {error} = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      showToast('Welcome back!', 'success');
    } catch (error: any) {
      console.error('Sign in error:', error);
      showToast(error.message || 'Failed to sign in', 'error');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      setIsLoading(true);
      const {error} = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      setSession(null);
      showToast('Signed out successfully', 'success');
    } catch (error: any) {
      console.error('Sign out error:', error);
      showToast(error.message || 'Failed to sign out', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (email: string): Promise<void> => {
    try {
      setIsLoading(true);
      const {error} = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'aidatingcoach://reset-password',
      });

      if (error) throw error;
      showToast('Password reset email sent', 'success');
    } catch (error: any) {
      console.error('Reset password error:', error);
      showToast(error.message || 'Failed to send reset email', 'error');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<User>): Promise<void> => {
    if (!user) throw new Error('No user logged in');

    try {
      setIsLoading(true);
      const {data, error} = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;
      setUser(data);
      showToast('Profile updated successfully', 'success');
    } catch (error: any) {
      console.error('Update profile error:', error);
      showToast(error.message || 'Failed to update profile', 'error');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const completeOnboarding = async (
    persona: PersonaType,
    goals: GoalType[],
  ): Promise<void> => {
    if (!user) throw new Error('No user logged in');

    try {
      setIsLoading(true);

      // Update user persona
      await updateProfile({persona_type: persona});

      // Create user goals
      const goalInserts = goals.map(goalType => ({
        user_id: user.id,
        goal_type: goalType,
        target_value: 100,
        current_value: 0,
      }));

      const {error: goalsError} = await supabase
        .from('user_goals')
        .insert(goalInserts);

      if (goalsError) throw goalsError;
      showToast('Welcome to AI Dating Coach!', 'success');
    } catch (error: any) {
      console.error('Complete onboarding error:', error);
      showToast(error.message || 'Failed to complete onboarding', 'error');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    session,
    user,
    isLoading,
    isAuthenticated,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updateProfile,
    completeOnboarding,
    hasCompletedOnboarding,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};