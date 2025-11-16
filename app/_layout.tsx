/**
 * Root Layout
 *
 * Wraps the entire app with necessary providers (Auth, TanStack Query, etc.)
 * and sets up the navigation structure.
 */

import { Stack } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { AuthProvider } from "@/contexts/AuthContext";

export default function RootLayout() {
  // Create QueryClient instance
  // Use useState to ensure it's only created once per app lifecycle
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Consider data stale after 5 minutes
            staleTime: 1000 * 60 * 5,
            // Keep unused data in cache for 30 minutes
            gcTime: 1000 * 60 * 30,
            // Retry failed requests 3 times with exponential backoff
            retry: 3,
            // Don't refetch on window focus by default (mobile doesn't need this)
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
        </Stack>
      </QueryClientProvider>
    </AuthProvider>
  );
}
