/**
 * Onboarding Step 3 - Organization & Planning
 *
 * Third and final onboarding slide explaining organization features
 */

import { View, StyleSheet } from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Container, Text, Button } from "@/components/ui";
import { colors, spacing } from "@/theme";

const ONBOARDING_COMPLETE_KEY = "@paprika_onboarding_complete";

export default function OnboardingStep3() {
  const handleStart = async () => {
    // Mark onboarding as complete
    await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, "true");
    router.replace("/(auth)/signup");
  };

  return (
    <Container centered>
      <View style={styles.content}>
        {/* Emoji Icon */}
        <Text style={styles.emoji}>📚</Text>

        {/* Title */}
        <Text variant="h1" color="primary" style={styles.title}>
          Organisation & Planning
        </Text>

        {/* Description */}
        <Text variant="bodyLarge" style={styles.description}>
          Organisez vos recettes en livres thématiques et planifiez vos repas de la semaine
        </Text>

        {/* Illustration placeholder */}
        <View style={styles.illustration}>
          <Text style={styles.illustrationEmoji}>📅🛒</Text>
          <Text variant="bodySmall" style={styles.illustrationText}>
            Meal plans{"\n"}Liste de courses{"\n"}Nutrition
          </Text>
        </View>
      </View>

      {/* Navigation */}
      <View style={styles.navigation}>
        {/* Dots indicator */}
        <View style={styles.dots}>
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={[styles.dot, styles.dotActive]} />
        </View>

        {/* Buttons */}
        <View style={styles.buttons}>
          <Button
            variant="outline"
            onPress={() => router.back()}
            style={styles.backButton}
          >
            Retour
          </Button>
          <Button
            variant="primary"
            size="lg"
            onPress={handleStart}
            style={styles.startButton}
          >
            Commencer
          </Button>
        </View>
      </View>
    </Container>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
  },

  emoji: {
    fontSize: 80,
    marginBottom: spacing.lg,
  },

  title: {
    textAlign: "center",
    marginBottom: spacing.md,
  },

  description: {
    textAlign: "center",
    color: colors.warm.gray,
    marginBottom: spacing.xl,
  },

  illustration: {
    width: 200,
    height: 200,
    borderRadius: spacing.lg,
    backgroundColor: colors.cream[100],
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.md,
  },

  illustrationEmoji: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },

  illustrationText: {
    textAlign: "center",
    color: colors.warm.gray,
    lineHeight: 24,
  },

  navigation: {
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    width: "100%",
  },

  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.gray[300],
  },

  dotActive: {
    backgroundColor: colors.primary.DEFAULT,
    width: 24,
  },

  buttons: {
    flexDirection: "row",
    gap: spacing.md,
  },

  backButton: {
    flex: 1,
  },

  startButton: {
    flex: 2,
  },
});
