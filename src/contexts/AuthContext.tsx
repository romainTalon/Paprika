/**
 * Authentication Context
 *
 * Provides authentication state and methods throughout the application.
 * Manages user session, handles auth state changes, and exposes auth operations.
 *
 * @module contexts/AuthContext
 */

import React, { createContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import type {
  AuthContextValue,
  SignUpCredentials,
  SignInCredentials,
  PasswordResetRequest,
  PasswordUpdate,
} from "@/types/auth";
import type { User, Session } from "@supabase/supabase-js";

/**
 * Authentication context
 */
export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Auth Provider Props
 */
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Authentication Provider Component
 *
 * Wraps the app and provides authentication state and methods.
 *
 * @example
 * ```tsx
 * <AuthProvider>
 *   <App />
 * </AuthProvider>
 * ```
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("🔐 Initial session:", session?.user?.email ?? "No session");
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("🔐 Auth state changed:", event, "User:", session?.user?.email ?? "No user");
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  /**
   * Sign up with email and password
   */
  const signUp = async ({ email, password, fullName }: SignUpCredentials) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) throw error;

    // Note: User will need to confirm email before they can sign in
    // Supabase automatically sends confirmation email
  };

  /**
   * Sign in with email and password
   */
  const signIn = async ({ email, password }: SignInCredentials) => {
    console.log("🔐 AuthContext: signIn called for", email);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("🔐 AuthContext: signIn error:", error.message);
      throw error;
    }

    console.log("🔐 AuthContext: signIn successful, session:", data.session?.user?.email);
    // Auth state will be updated via onAuthStateChange listener
  };

  /**
   * Sign out current user
   */
  const signOut = async () => {
    console.log("🔐 AuthContext: signOut called");
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("🔐 AuthContext: signOut error:", error.message);
      throw error;
    }

    console.log("🔐 AuthContext: signOut successful");
    // Auth state will be updated via onAuthStateChange listener
  };

  /**
   * Request password reset email
   */
  const requestPasswordReset = async ({ email }: PasswordResetRequest) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "paprika://reset-password", // Deep link back to app
    });

    if (error) throw error;
  };

  /**
   * Update user password
   */
  const updatePassword = async ({ newPassword }: PasswordUpdate) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw error;
  };

  const value: AuthContextValue = {
    user,
    session,
    loading,
    isAuthenticated: !!user,
    signUp,
    signIn,
    signOut,
    requestPasswordReset,
    updatePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
