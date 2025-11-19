/**
 * Back Button Component
 *
 * Reusable back navigation button for standalone screens
 */

import React from "react";
import { TouchableOpacity, StyleSheet } from "react-native";
import { router } from "expo-router";
import { Text } from "@/components/ui";
import { colors, spacing } from "@/theme";

interface BackButtonProps {
  /** Optional custom onPress handler (default: router.back()) */
  onPress?: () => void;
  /** Optional label text (default: "← Retour") */
  label?: string;
  /** Optional style override */
  style?: any;
}

export function BackButton({ onPress, label = "← Retour", style }: BackButtonProps) {
  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.back();
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={[styles.button, style]}
      accessibilityLabel="Retour"
      accessibilityRole="button"
    >
      <Text variant="body" style={styles.text}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    alignSelf: "flex-start",
    marginBottom: spacing.sm,
  },
  text: {
    color: colors.primary.DEFAULT,
    fontSize: 16,
    fontWeight: "600",
  },
});
