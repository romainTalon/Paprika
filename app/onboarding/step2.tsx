/**
 * Onboarding Step 2 - Recipe Import
 *
 * Second onboarding slide explaining recipe import feature
 */

import { View, StyleSheet, useWindowDimensions } from "react-native";
import { router } from "expo-router";
import { Container, Text, Button } from "@/components/ui";
import { colors, spacing } from "@/theme";

export default function OnboardingStep2() {
  const { width, height } = useWindowDimensions();

  // Responsive sizing
  const isSmallScreen = height < 700;
  const emojiSize = isSmallScreen ? 64 : 80;
  const illustrationSize = isSmallScreen ? 160 : 200;
  const illustrationEmojiSize = isSmallScreen ? 40 : 48;
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
          🤖
        </Text>

        {/* Title */}
        <Text variant="h1" color="primary" style={styles.title}>
          Import automatique
        </Text>

        {/* Description */}
        <Text variant="bodyLarge" style={styles.description}>
          Importez des recettes depuis n'importe quel site web en un clic grâce à l'IA
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
            🔗📋
          </Text>
          <Text variant="bodySmall" style={styles.illustrationText}>
            Collez un lien{"\n"}→{"\n"}Recette structurée
          </Text>
        </View>
      </View>

      {/* Navigation */}
      <View style={styles.navigation}>
        {/* Dots indicator */}
        <View style={styles.dots}>
          <View style={styles.dot} />
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
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
            onPress={() => router.push("/onboarding/step3")}
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
    padding: spacing.md,
  },

  illustrationEmoji: {
    // fontSize et lineHeight définis dynamiquement pour la responsivité
    marginBottom: spacing.sm,
  },

  illustrationText: {
    textAlign: "center",
    color: colors.warm.gray,
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

  nextButton: {
    flex: 2,
  },
});
