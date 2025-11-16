/**
 * Index Screen - Entry Point
 *
 * Checks auth state and redirects accordingly:
 * - First time user → Onboarding
 * - Not authenticated → Onboarding → Login
 * - Authenticated → Cookbooks
 */

import { useEffect, useState } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@/hooks/useAuth";
import { Container, Text } from "@/components/ui";
import { colors, spacing } from "@/theme";

const ONBOARDING_COMPLETE_KEY = "@paprika_onboarding_complete";

export default function Index() {
  const { isAuthenticated, loading } = useAuth();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function checkOnboardingStatus() {
      try {
        // Check if user has completed onboarding
        const hasSeenOnboarding = await AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY);

        if (!loading) {
          if (isAuthenticated) {
            // User is logged in → go to app
            router.replace("/(tabs)/cookbooks");
          } else if (hasSeenOnboarding) {
            // User has seen onboarding but not logged in → go to login
            router.replace("/(auth)/login");
          } else {
            // First time user → show onboarding
            router.replace("/onboarding/step1");
          }
        }
      } catch (error) {
        console.error("Error checking onboarding status:", error);
        // On error, default to onboarding
        router.replace("/onboarding/step1");
      } finally {
        setChecking(false);
      }
    }

    checkOnboardingStatus();
  }, [isAuthenticated, loading]);

  // Show loading screen while checking
  if (loading || checking) {
    return (
      <Container centered>
        <View style={styles.loadingContainer}>
          <Text style={styles.emoji}>🍳</Text>
          <ActivityIndicator size="large" color={colors.primary.DEFAULT} style={styles.spinner} />
          <Text variant="body" color="neutral" style={styles.loadingText}>
            Chargement...
          </Text>
        </View>
      </Container>
    );
  }

  // This should never be visible as we redirect, but needed for TS
  return null;
}

const styles = StyleSheet.create({
  loadingContainer: {
    alignItems: "center",
  },

  emoji: {
    fontSize: 80,
    marginBottom: spacing.lg,
  },

  spinner: {
    marginBottom: spacing.md,
  },

  loadingText: {
    marginTop: spacing.sm,
  },
});
