/**
 * Recipe Card In Modal Component
 *
 * Displays a recipe card inside the MealSlotDetailModal.
 * Horizontal layout with image, info, and action buttons.
 *
 * @module components/meal-plan/RecipeCardInModal
 */

import React from "react";
import { View, Image, TouchableOpacity, StyleSheet } from "react-native";
import { Text } from "@/components/ui";
import { colors, spacing, shadows, fontSizes, fontWeights } from "@/theme";
import type { MealSlot } from "@/types";
import type { Recipe } from "@/hooks/useRecipes";

interface RecipeCardInModalProps {
  /** Meal slot data */
  mealSlot: MealSlot;
  /** Recipe data */
  recipe: Recipe;
  /** Callback when cooked status is toggled */
  onToggleCooked: () => void;
  /** Callback when edit servings is pressed */
  onEdit: () => void;
  /** Callback when delete is pressed */
  onDelete: () => void;
}

export function RecipeCardInModal({
  mealSlot,
  recipe,
  onToggleCooked,
  onEdit,
  onDelete,
}: RecipeCardInModalProps) {
  return (
    <View style={styles.card}>
      {/* Recipe Image & Info */}
      <View style={styles.topSection}>
        {/* Image */}
        {recipe.coverImageUrl ? (
          <Image
            source={{ uri: recipe.coverImageUrl }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Text style={styles.placeholderIcon}>🍽️</Text>
          </View>
        )}

        {/* Info */}
        <View style={styles.info}>
          <Text variant="body" numberOfLines={2} style={styles.title}>
            {recipe.title}
          </Text>
          <Text variant="caption" style={styles.servings}>
            {mealSlot.servings} {mealSlot.servings > 1 ? "personnes" : "personne"}
          </Text>
        </View>
      </View>

      {/* Actions Row */}
      <View style={styles.actionsRow}>
        {/* Cooked Toggle */}
        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.cookedButton,
            mealSlot.isCooked && styles.cookedButtonActive,
          ]}
          onPress={onToggleCooked}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={
            mealSlot.isCooked ? "Marquer comme non cuisiné" : "Marquer comme cuisiné"
          }
        >
          <Text
            style={[
              styles.actionButtonText,
              mealSlot.isCooked && styles.actionButtonTextActive,
            ]}
          >
            {mealSlot.isCooked ? "✓ Cuisiné" : "À cuisiner"}
          </Text>
        </TouchableOpacity>

        {/* Edit Servings */}
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={onEdit}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Modifier le nombre de portions"
        >
          <Text style={styles.actionButtonText}>Modifier</Text>
        </TouchableOpacity>

        {/* Delete */}
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={onDelete}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Supprimer cette recette"
        >
          <Text style={styles.deleteIcon}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cream.DEFAULT,
    borderRadius: spacing.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    minHeight: 140,
  },

  // Top Section (Image + Info)
  topSection: {
    flexDirection: "row",
    marginBottom: spacing.md,
  },

  image: {
    width: 80,
    height: 80,
    borderRadius: spacing.sm,
    backgroundColor: colors.gray[100],
  },

  imagePlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },

  placeholderIcon: {
    fontSize: 32,
    lineHeight: 36,
  },

  info: {
    flex: 1,
    marginLeft: spacing.md,
    justifyContent: "center",
  },

  title: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.semibold as any,
    color: colors.warm.brown,
    marginBottom: spacing.xs,
    lineHeight: 20,
  },

  servings: {
    fontSize: fontSizes.sm,
    color: colors.gray[600],
  },

  // Actions Row
  actionsRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },

  actionButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: spacing.sm,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.white,
    ...shadows.sm,
    minHeight: 44,
  },

  actionButtonText: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium as any,
    color: colors.gray[700],
  },

  // Cooked Button
  cookedButton: {
    flex: 1.5,
  },

  cookedButtonActive: {
    backgroundColor: colors.success,
  },

  actionButtonTextActive: {
    color: colors.white,
  },

  // Edit Button
  editButton: {
    flex: 1.2,
  },

  // Delete Button
  deleteButton: {
    flex: 0.8,
  },

  deleteIcon: {
    fontSize: 20,
    lineHeight: 24,
  },
});
