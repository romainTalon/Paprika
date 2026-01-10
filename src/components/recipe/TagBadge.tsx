/**
 * TagBadge Component
 *
 * Display a recipe tag as a small pill/badge.
 * Supports different sizes and optional removal.
 */

import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Text } from "@/components/ui";
import { colors, spacing, fontSizes } from "@/theme";

interface TagBadgeProps {
  /** Tag text to display */
  tag: string;
  /** Size variant */
  size?: "sm" | "md";
  /** Show remove button */
  removable?: boolean;
  /** Callback when remove is pressed */
  onRemove?: () => void;
}

export function TagBadge({
  tag,
  size = "md",
  removable = false,
  onRemove,
}: TagBadgeProps) {
  return (
    <View style={[styles.badge, size === "sm" ? styles.badgeSm : styles.badgeMd]}>
      <Text
        style={[
          styles.badgeText,
          size === "sm" ? styles.badgeTextSm : styles.badgeTextMd,
        ]}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {tag}
      </Text>
      {removable && onRemove && (
        <TouchableOpacity
          onPress={onRemove}
          style={styles.removeButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel={`Retirer le tag ${tag}`}
        >
          <Text style={styles.removeIcon}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary[100],
    borderRadius: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary[200],
    gap: spacing.xs,
  },
  badgeSm: {
    paddingVertical: spacing.xs / 2,
    paddingHorizontal: spacing.sm,
  },
  badgeMd: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  badgeText: {
    color: colors.primary[700],
    fontWeight: "600",
  },
  badgeTextSm: {
    fontSize: 11,
    lineHeight: 16,
  },
  badgeTextMd: {
    fontSize: fontSizes.xs,
    lineHeight: 18,
  },
  removeButton: {
    marginLeft: spacing.xs / 2,
  },
  removeIcon: {
    fontSize: 12,
    lineHeight: 12,
    color: colors.primary[700],
    fontWeight: "bold",
  },
});
