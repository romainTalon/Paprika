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
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState } from "react-native";

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
 * Session persistence uses AsyncStorage for better React Native compatibility.
 * AppState listener ensures tokens refresh when app returns from background.
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
    // Use AsyncStorage for session persistence (better than default for React Native)
    storage: AsyncStorage,
    // Auto-refresh session before it expires
    autoRefreshToken: true,
    // Persist session across app restarts
    persistSession: true,
    // Detect session from URL (for OAuth callbacks)
    detectSessionInUrl: true,
  },
});

/**
 * AppState listener to refresh session when app becomes active
 * This ensures tokens are refreshed when returning from background
 */
AppState.addEventListener("change", (state) => {
  if (state === "active") {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
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
