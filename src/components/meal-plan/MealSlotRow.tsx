/**
 * Meal Slot Row Component
 *
 * Displays a single meal row with 3 visual states:
 * - Empty: Shows "+ Ajouter" button
 * - Single recipe: Shows recipe title and servings
 * - Multiple recipes: Shows count badge and "X recettes" text
 *
 * @module components/meal-plan/MealSlotRow
 */

import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Text } from "@/components/ui";
import { colors, spacing, shadows, fontSizes, fontWeights } from "@/theme";
import type { MealSlot, MealType } from "@/types";
import type { Recipe } from "@/hooks/useRecipes";

interface MealSlotRowProps {
  /** Meal type (breakfast, lunch, dinner, snack) */
  mealType: MealType;
  /** Meal type icon emoji */
  icon: string;
  /** Meal type label (e.g., "Petit-déj") */
  label: string;
  /** Array of meal slots for this meal */
  mealSlots?: MealSlot[] | null;
  /** All recipes (to map recipeId to recipe data) */
  allRecipes?: Recipe[];
  /** Callback when row is pressed */
  onPress: () => void;
}

export function MealSlotRow({
  mealType,
  icon,
  label,
  mealSlots,
  allRecipes = [],
  onPress,
}: MealSlotRowProps) {
  // Helper to get recipe by ID
  const getRecipe = (recipeId: string) => allRecipes.find((r) => r.id === recipeId);

  // Determine visual state
  const isEmpty = !mealSlots || mealSlots.length === 0;
  const isSingle = mealSlots && mealSlots.length === 1;
  const isMultiple = mealSlots && mealSlots.length > 1;

  // Get first recipe (for single state)
  const firstRecipe = isSingle ? getRecipe(mealSlots[0].recipeId) : null;
  const firstSlot = isSingle ? mealSlots[0] : null;

  return (
    <TouchableOpacity
      style={[
        styles.row,
        isEmpty && styles.rowEmpty,
        !isEmpty && styles.rowFilled,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${
        isEmpty
          ? "Ajouter un repas"
          : isMultiple
          ? `${mealSlots!.length} recettes planifiées`
          : firstRecipe?.title || "Recette"
      }`}
    >
      {/* Meal Icon & Label */}
      <View style={styles.mealInfo}>
        <Text style={styles.icon}>{icon}</Text>
        <Text variant="body" style={styles.mealLabel}>
          {label}:
        </Text>
      </View>

      {/* Content (varies by state) */}
      <View style={styles.content}>
        {/* Empty State */}
        {isEmpty && (
          <View style={styles.emptyContent}>
            <Text style={styles.addIcon}>+</Text>
            <Text variant="caption" style={styles.addText}>
              Ajouter
            </Text>
          </View>
        )}

        {/* Single Recipe State */}
        {isSingle && firstRecipe && firstSlot && (
          <View style={styles.singleContent}>
            <Text variant="body" numberOfLines={1} style={styles.recipeTitle}>
              {firstRecipe.title}
            </Text>
            <Text variant="caption" style={styles.servings}>
              ({firstSlot.servings}p)
            </Text>
          </View>
        )}

        {/* Multiple Recipes State */}
        {isMultiple && (
          <View style={styles.multipleContent}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{mealSlots!.length}</Text>
            </View>
            <Text variant="body" style={styles.multipleText}>
              {mealSlots!.length} recettes
            </Text>
          </View>
        )}
      </View>

      {/* Arrow Icon (only for filled states) */}
      {!isEmpty && (
        <Text style={styles.arrowIcon}>→</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    height: 60,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: spacing.sm,
    marginBottom: spacing.xs,
  },

  rowEmpty: {
    backgroundColor: colors.cream.DEFAULT,
    borderWidth: 1.5,
    borderColor: colors.gray[300],
    borderStyle: "dashed",
  },

  rowFilled: {
    backgroundColor: colors.white,
    ...shadows.sm,
  },

  // Meal Info (Icon + Label)
  mealInfo: {
    flexDirection: "row",
    alignItems: "center",
    minWidth: 110,
  },

  icon: {
    fontSize: 20,
    lineHeight: 24,
    marginRight: spacing.xs,
  },

  mealLabel: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.semibold as any,
    color: colors.gray[700],
  },

  // Content Area
  content: {
    flex: 1,
    marginRight: spacing.sm,
  },

  // Empty State
  emptyContent: {
    flexDirection: "row",
    alignItems: "center",
  },

  addIcon: {
    fontSize: 18,
    lineHeight: 20,
    color: colors.gray[500],
    marginRight: spacing.xs,
  },

  addText: {
    fontSize: fontSizes.sm,
    color: colors.gray[600],
    fontWeight: fontWeights.medium as any,
  },

  // Single Recipe State
  singleContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  recipeTitle: {
    flex: 1,
    fontSize: fontSizes.base,
    fontWeight: fontWeights.medium as any,
    color: colors.warm.brown,
    marginRight: spacing.xs,
  },

  servings: {
    fontSize: fontSizes.sm,
    color: colors.gray[600],
  },

  // Multiple Recipes State
  multipleContent: {
    flexDirection: "row",
    alignItems: "center",
  },

  badge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary.DEFAULT,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.sm,
    ...shadows.sm,
  },

  badgeText: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold as any,
    color: colors.white,
    lineHeight: 14,
  },

  multipleText: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.medium as any,
    color: colors.warm.brown,
  },

  // Arrow Icon
  arrowIcon: {
    fontSize: 20,
    lineHeight: 24,
    color: colors.gray[400],
  },
});
