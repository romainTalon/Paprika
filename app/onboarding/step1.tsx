/**
 * Onboarding Step 1 - Welcome
 *
 * First onboarding slide introducing Paprika
 */

import { View, StyleSheet, useWindowDimensions } from "react-native";
import { router } from "expo-router";
import { Container, Text, Button } from "@/components/ui";
import { colors, spacing } from "@/theme";

export default function OnboardingStep1() {
  const { width, height } = useWindowDimensions();

  // Responsive sizing
  const isSmallScreen = height < 700;
  const emojiSize = isSmallScreen ? 64 : 80;
  const illustrationSize = isSmallScreen ? 160 : 200;
  const illustrationEmojiSize = isSmallScreen ? 48 : 64;
  return (
    <Container centered useSafeArea>
      <View style={styles.content}>
        {/* Emoji Icon */}
        <Text
          style={[
            styles.emoji,
            {
              fontSize: emojiSize,
              lineHeight: emojiSize + 8,
            },
          ]}
        >
          🍳
        </Text>

        {/* Title */}
        <Text variant="h1" color="primary" style={styles.title}>
          Bienvenue dans Paprika
        </Text>

        {/* Description */}
        <Text variant="bodyLarge" style={styles.description}>
          Votre assistant culinaire intelligent pour simplifier la vie en cuisine
        </Text>

        {/* Illustration placeholder */}
        <View
          style={[
            styles.illustration,
            {
              width: illustrationSize,
              height: illustrationSize,
            },
          ]}
        >
          <Text
            style={[
              styles.illustrationEmoji,
              {
                fontSize: illustrationEmojiSize,
                lineHeight: illustrationEmojiSize + 8,
              },
            ]}
          >
            📱✨
          </Text>
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
    marginBottom: spacing.lg,
    // fontSize et lineHeight définis dynamiquement pour la responsivité
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
    // width et height définis dynamiquement pour la responsivité
    borderRadius: spacing.lg,
    backgroundColor: colors.cream[100],
    justifyContent: "center",
    alignItems: "center",
  },

  illustrationEmoji: {
    // fontSize et lineHeight définis dynamiquement pour la responsivité
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
