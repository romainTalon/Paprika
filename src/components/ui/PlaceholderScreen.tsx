/**
 * Placeholder Screen Component
 *
 * Used for screens that are not yet implemented.
 * Displays a title, description, and optional action button.
 */

import React from "react";
import { View, StyleSheet } from "react-native";
import { Text } from "./Text";
import { Button } from "./Button";
import { Container } from "./Container";
import { colors, spacing } from "@/theme";

interface PlaceholderScreenProps {
  title: string;
  description?: string;
  icon?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function PlaceholderScreen({
  title,
  description,
  icon = "🚧",
  actionLabel,
  onAction,
}: PlaceholderScreenProps) {
  return (
    <Container centered useSafeArea>
      <Text style={styles.icon}>{icon}</Text>
      <Text variant="h1" style={styles.title}>
        {title}
      </Text>
      {description && (
        <Text variant="body" color="neutral" style={styles.description}>
          {description}
        </Text>
      )}
      {actionLabel && onAction && (
        <Button
          variant="primary"
          onPress={onAction}
          style={styles.actionButton}
        >
          {actionLabel}
        </Button>
      )}
      <View style={styles.badge}>
        <Text variant="caption" color="neutral">
          Coming Soon
        </Text>
      </View>
    </Container>
  );
}

const styles = StyleSheet.create({
  icon: {
    fontSize: 80,
    marginBottom: spacing.lg,
    lineHeight: 88, // Line height plus grande pour éviter le clip vertical
  },
  title: {
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  description: {
    marginBottom: spacing.xl,
    textAlign: "center",
    paddingHorizontal: spacing.xl,
  },
  actionButton: {
    minWidth: 200,
    marginBottom: spacing.lg,
  },
  badge: {
    position: "absolute",
    bottom: spacing.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.gray[200],
    borderRadius: spacing.sm,
  },
});
