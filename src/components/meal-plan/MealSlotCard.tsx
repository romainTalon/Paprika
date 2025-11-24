/**
 * Meal Slot Card Component
 *
 * Displays a single meal slot in the meal planning grid.
 * Shows empty state with add button, or filled state with recipe details.
 *
 * @module components/meal-plan/MealSlotCard
 */

import React from "react";
import {
  View,
  TouchableOpacity,
  Image,
  StyleSheet,
} from "react-native";
import { Text } from "@/components/ui";
import { colors, spacing, shadows, fontSizes, fontWeights } from "@/theme";
import type { MealSlot, MealType, WeekDay } from "@/types";
import type { Recipe } from "@/hooks/useRecipes";

interface MealSlotCardProps {
  /** Meal slot data (undefined if empty) */
  mealSlot?: MealSlot | null;
  /** Day of the week */
  day: WeekDay;
  /** Meal type (breakfast, lunch, dinner, snack) */
  mealType: MealType;
  /** Recipe data (fetched separately) */
  recipe?: Recipe;
  /** Callback when card is pressed (add or edit) */
  onPress: () => void;
  /** Callback to toggle cooked status */
  onToggleCooked?: () => void;
  /** Callback to remove meal slot */
  onRemove?: () => void;
}

const DEFAULT_PLACEHOLDER = "https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=400";

export function MealSlotCard({
  mealSlot,
  day,
  mealType,
  recipe,
  onPress,
  onToggleCooked,
  onRemove,
}: MealSlotCardProps) {
  // Empty state
  if (!mealSlot || !recipe) {
    return (
      <TouchableOpacity
        style={styles.emptyCard}
        onPress={onPress}
        activeOpacity={0.7}
        accessibilityLabel={`Add meal for ${day} ${mealType}`}
        accessibilityRole="button"
      >
        <Text style={styles.emptyIcon}>+</Text>
        <Text variant="caption" color="neutral" style={styles.emptyText}>
          Ajouter
        </Text>
      </TouchableOpacity>
    );
  }

  // Filled state
  return (
    <View style={styles.filledCard}>
      {/* Tap to Edit */}
      <TouchableOpacity
        style={styles.cardContent}
        onPress={onPress}
        activeOpacity={0.7}
        accessibilityLabel={`Edit ${recipe.title} for ${day} ${mealType}`}
        accessibilityRole="button"
      >
        {/* Recipe Image */}
        {recipe.coverImageUrl ? (
          <Image
            source={{ uri: recipe.coverImageUrl }}
            style={styles.recipeImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.recipeImage, styles.imagePlaceholder]}>
            <Text style={styles.placeholderIcon}>🍽️</Text>
          </View>
        )}

        {/* Recipe Info */}
        <View style={styles.recipeInfo}>
          <Text variant="bodySmall" numberOfLines={2} style={styles.recipeTitle}>
            {recipe.title}
          </Text>

          <Text variant="caption" color="neutral" style={styles.servings}>
            {mealSlot.servings} {mealSlot.servings > 1 ? "portions" : "portion"}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Action Row */}
      <View style={styles.actionRow}>
        {/* Cooked Checkbox */}
        <TouchableOpacity
          style={styles.cookedButton}
          onPress={onToggleCooked}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel={mealSlot.isCooked ? "Mark as uncooked" : "Mark as cooked"}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: mealSlot.isCooked }}
        >
          <View style={[styles.checkbox, mealSlot.isCooked && styles.checkboxChecked]}>
            {mealSlot.isCooked && (
              <Text style={styles.checkmark}>✓</Text>
            )}
          </View>
          <Text variant="caption" color="neutral" style={styles.cookedLabel}>
            {mealSlot.isCooked ? "Cuisiné" : "À cuisiner"}
          </Text>
        </TouchableOpacity>

        {/* Remove Button */}
        <TouchableOpacity
          style={styles.removeButton}
          onPress={onRemove}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel="Remove meal"
          accessibilityRole="button"
        >
          <Text style={styles.removeIcon}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Empty State
  emptyCard: {
    height: 120,
    backgroundColor: colors.white,
    borderRadius: spacing.sm,
    borderWidth: 2,
    borderColor: colors.gray[300],
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.sm,
  },

  emptyIcon: {
    fontSize: 32,
    lineHeight: 36,
    color: colors.gray[400],
    marginBottom: spacing.xs,
  },

  emptyText: {
    textAlign: "center",
  },

  // Filled State
  filledCard: {
    height: 120,
    backgroundColor: colors.white,
    borderRadius: spacing.sm,
    overflow: "hidden",
    ...shadows.sm,
  },

  cardContent: {
    flex: 1,
    flexDirection: "row",
    padding: spacing.sm,
  },

  recipeImage: {
    width: 60,
    height: 60,
    borderRadius: spacing.xs,
    backgroundColor: colors.gray[100],
  },

  imagePlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },

  placeholderIcon: {
    fontSize: 28,
    lineHeight: 32,
  },

  recipeInfo: {
    flex: 1,
    marginLeft: spacing.sm,
    justifyContent: "center",
  },

  recipeTitle: {
    fontWeight: fontWeights.semibold as any,
    color: colors.warm.brown,
    marginBottom: spacing.xs,
  },

  servings: {
    fontSize: fontSizes.xs,
  },

  // Action Row
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    paddingTop: spacing.xs,
  },

  cookedButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },

  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.gray[400],
    backgroundColor: colors.white,
    justifyContent: "center",
    alignItems: "center",
  },

  checkboxChecked: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },

  checkmark: {
    fontSize: 12,
    lineHeight: 14,
    color: colors.white,
    fontWeight: fontWeights.bold as any,
  },

  cookedLabel: {
    fontSize: fontSizes.xs,
  },

  removeButton: {
    padding: spacing.xs,
  },

  removeIcon: {
    fontSize: 16,
    lineHeight: 18,
    color: colors.error,
    fontWeight: fontWeights.bold as any,
  },
});
