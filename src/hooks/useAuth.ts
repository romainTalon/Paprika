/**
 * useAuth Hook
 *
 * Convenient hook to access authentication context.
 *
 * @module hooks/useAuth
 */

import { useContext } from "react";
import { AuthContext } from "@/contexts/AuthContext";

/**
 * Hook to access authentication context
 *
 * @throws Error if used outside of AuthProvider
 *
 * @example
 * ```typescript
 * const { user, isAuthenticated, signIn, signOut } = useAuth();
 *
 * if (!isAuthenticated) {
 *   return <LoginScreen />;
 * }
 *
 * return <Text>Welcome, {user?.email}!</Text>;
 * ```
 */
export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
