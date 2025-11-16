/**
 * Authentication Types
 *
 * TypeScript interfaces and types for authentication-related functionality.
 */

import type { User, Session } from "@supabase/supabase-js";

/**
 * Authentication state
 */
export interface AuthState {
  /** Current authenticated user */
  user: User | null;
  /** Current session */
  session: Session | null;
  /** Whether auth state is currently being loaded */
  loading: boolean;
  /** Whether user is authenticated */
  isAuthenticated: boolean;
}

/**
 * Sign up credentials
 */
export interface SignUpCredentials {
  email: string;
  password: string;
  fullName?: string;
}

/**
 * Sign in credentials
 */
export interface SignInCredentials {
  email: string;
  password: string;
}

/**
 * Password reset request
 */
export interface PasswordResetRequest {
  email: string;
}

/**
 * Password update
 */
export interface PasswordUpdate {
  newPassword: string;
}

/**
 * Auth error response
 */
export interface AuthError {
  message: string;
  status?: number;
}

/**
 * Auth context value
 */
export interface AuthContextValue extends AuthState {
  /** Sign up with email and password */
  signUp: (credentials: SignUpCredentials) => Promise<void>;
  /** Sign in with email and password */
  signIn: (credentials: SignInCredentials) => Promise<void>;
  /** Sign out */
  signOut: () => Promise<void>;
  /** Request password reset */
  requestPasswordReset: (request: PasswordResetRequest) => Promise<void>;
  /** Update password */
  updatePassword: (update: PasswordUpdate) => Promise<void>;
}
