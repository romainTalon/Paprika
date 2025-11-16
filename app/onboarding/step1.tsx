/**
 * Onboarding Step 1 - Welcome
 *
 * First onboarding slide introducing Paprika
 */

import { View, StyleSheet } from "react-native";
import { router } from "expo-router";
import { Container, Text, Button } from "@/components/ui";
import { colors, spacing } from "@/theme";

export default function OnboardingStep1() {
  return (
    <Container centered>
      <View style={styles.content}>
        {/* Emoji Icon */}
        <Text style={styles.emoji}>🍳</Text>

        {/* Title */}
        <Text variant="h1" color="primary" style={styles.title}>
          Bienvenue dans Paprika
        </Text>

        {/* Description */}
        <Text variant="bodyLarge" style={styles.description}>
          Votre assistant culinaire intelligent pour simplifier la vie en cuisine
        </Text>

        {/* Illustration placeholder */}
        <View style={styles.illustration}>
          <Text style={styles.illustrationEmoji}>📱✨</Text>
        </View>
      </View>

      {/* Navigation */}
      <View style={styles.navigation}>
        {/* Dots indicator */}
        <View style={styles.dots}>
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>

        {/* Buttons */}
        <View style={styles.buttons}>
          <Button
            variant="outline"
            onPress={() => router.replace("/(auth)/login")}
            style={styles.skipButton}
          >
            Passer
          </Button>
          <Button
            variant="primary"
            size="lg"
            onPress={() => router.push("/onboarding/step2")}
            style={styles.nextButton}
          >
            Suivant
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
  },

  illustrationEmoji: {
    fontSize: 64,
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

  skipButton: {
    flex: 1,
  },

  nextButton: {
    flex: 2,
  },
});
