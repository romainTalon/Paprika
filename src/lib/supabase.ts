/**
 * Centralized Supabase Client
 *
 * This module provides a single, shared Supabase client instance for the entire application.
 * Using a centralized client ensures consistency, reduces duplication, and makes it easier
 * to add cross-cutting concerns like logging, error handling, and monitoring.
 *
 * @module lib/supabase
 */

import { createClient } from "@supabase/supabase-js";

// Environment variables validation
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. " +
      "Please ensure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set."
  );
}

/**
 * Supabase client instance
 *
 * This client uses the anon key for client-side operations and automatically
 * enforces Row Level Security (RLS) policies based on the authenticated user.
 *
 * @example
 * ```typescript
 * import { supabase } from "@/lib/supabase";
 *
 * const { data, error } = await supabase
 *   .from("recipes")
 *   .select("*")
 *   .eq("userId", userId);
 * ```
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Auto-refresh session before it expires
    autoRefreshToken: true,
    // Persist session in local storage
    persistSession: true,
    // Detect session from URL (for OAuth callbacks)
    detectSessionInUrl: true,
  },
});

/**
 * Helper function to check if user is authenticated
 *
 * @returns Promise resolving to boolean indicating auth status
 *
 * @example
 * ```typescript
 * const isAuthenticated = await isUserAuthenticated();
 * if (!isAuthenticated) {
 *   router.push("/login");
 * }
 * ```
 */
export async function isUserAuthenticated(): Promise<boolean> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return !!session;
}

/**
 * Helper function to get current user ID
 *
 * @returns Promise resolving to user ID or null if not authenticated
 *
 * @example
 * ```typescript
 * const userId = await getCurrentUserId();
 * if (!userId) throw new Error("Not authenticated");
 * ```
 */
export async function getCurrentUserId(): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.user?.id ?? null;
}

/**
 * Helper function to get current user
 *
 * @returns Promise resolving to user object or null if not authenticated
 */
export async function getCurrentUser() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.user ?? null;
}
