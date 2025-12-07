/**
 * CategoryPicker Component
 *
 * Horizontal scrollable picker for selecting grocery item categories.
 * Each category is displayed as a pill with emoji and label.
 */

import React, { useCallback } from "react";
import { View, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { Text } from "@/components/ui";
import { colors, spacing, fontSizes } from "@/theme";
import { GROCERY_CATEGORIES, DEFAULT_CATEGORY_ID } from "@/constants/categories";

interface CategoryPickerProps {
  selectedId: string;
  onSelect: (categoryId: string) => void;
}

export function CategoryPicker({ selectedId, onSelect }: CategoryPickerProps) {
  const handleSelect = useCallback(
    (categoryId: string) => {
      onSelect(categoryId);
    },
    [onSelect]
  );

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {GROCERY_CATEGORIES.map((category) => {
          const isSelected = selectedId === category.id;

          return (
            <TouchableOpacity
              key={category.id}
              style={[styles.pill, isSelected && styles.pillSelected]}
              onPress={() => handleSelect(category.id)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`${category.emoji} ${category.label}`}
            >
              <Text style={[styles.emoji, isSelected && styles.emojiSelected]}>
                {category.emoji}
              </Text>
              <Text
                variant="bodySmall"
                style={[styles.label, isSelected && styles.labelSelected]}
              >
                {category.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.sm,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: spacing.xl,
    backgroundColor: colors.gray[100],
    borderWidth: 1,
    borderColor: colors.gray[200],
    gap: spacing.xs,
  },
  pillSelected: {
    backgroundColor: colors.primary[100],
    borderColor: colors.primary.DEFAULT,
  },
  emoji: {
    fontSize: fontSizes.base,
    lineHeight: fontSizes.base + 8,
  },
  emojiSelected: {
    // Emoji doesn't change color, but could add scale animation later
  },
  label: {
    color: colors.warm.gray,
  },
  labelSelected: {
    color: colors.primary[700],
    fontWeight: "600",
  },
});
