/**
 * Meal Slot Detail Modal Component
 *
 * Bottom sheet modal displaying all recipes for a specific meal slot.
 * Allows toggling cooked status, editing servings, and deleting recipes.
 *
 * @module components/meal-plan/MealSlotDetailModal
 */

import React, { useState, useCallback } from "react";
import {
  View,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  TextInput,
} from "react-native";
import { Text } from "@/components/ui";
import { RecipeCardInModal } from "./RecipeCardInModal";
import { colors, spacing, shadows, fontSizes, fontWeights } from "@/theme";
import type { WeekDay, MealType, MealSlot } from "@/types";
import type { Recipe } from "@/hooks/useRecipes";
import { MAX_RECIPES_PER_SLOT } from "@/types";

interface MealSlotDetailModalProps {
  /** Whether modal is visible */
  visible: boolean;
  /** Day of the week */
  day?: WeekDay;
  /** Meal type */
  mealType?: MealType;
  /** Meal slots for this day/meal */
  mealSlots?: MealSlot[];
  /** All recipes */
  allRecipes?: Recipe[];
  /** Callback to close modal */
  onClose: () => void;
  /** Callback when adding a new recipe */
  onAddRecipe: () => void;
  /** Callback to toggle cooked status */
  onToggleCooked: (recipeIndex: number, currentStatus: boolean) => void;
  /** Callback to update servings */
  onUpdateServings: (recipeIndex: number, newServings: number) => void;
  /** Callback to remove recipe */
  onRemoveRecipe: (recipeIndex: number) => void;
}

// Meal type labels
const MEAL_LABELS: Record<MealType, string> = {
  breakfast: "Petit-déjeuner",
  lunch: "Déjeuner",
  dinner: "Dîner",
  snack: "Snack",
};

// Day names
const DAY_NAMES: Record<WeekDay, string> = {
  monday: "Lundi",
  tuesday: "Mardi",
  wednesday: "Mercredi",
  thursday: "Jeudi",
  friday: "Vendredi",
  saturday: "Samedi",
  sunday: "Dimanche",
};

export function MealSlotDetailModal({
  visible,
  day,
  mealType,
  mealSlots = [],
  allRecipes = [],
  onClose,
  onAddRecipe,
  onToggleCooked,
  onUpdateServings,
  onRemoveRecipe,
}: MealSlotDetailModalProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editServings, setEditServings] = useState<string>("");

  // Helper to get recipe by ID
  const getRecipe = useCallback(
    (recipeId: string) => allRecipes.find((r) => r.id === recipeId),
    [allRecipes]
  );

  // Handle edit servings
  const handleEditPress = useCallback((index: number, currentServings: number) => {
    setEditingIndex(index);
    setEditServings(currentServings.toString());
  }, []);

  // Save edited servings
  const handleSaveServings = useCallback(() => {
    if (editingIndex !== null) {
      const newServings = parseInt(editServings, 10);
      if (!isNaN(newServings) && newServings > 0 && newServings <= 50) {
        onUpdateServings(editingIndex, newServings);
        setEditingIndex(null);
        setEditServings("");
      } else {
        Alert.alert("Erreur", "Veuillez entrer un nombre entre 1 et 50");
      }
    }
  }, [editingIndex, editServings, onUpdateServings]);

  // Cancel editing
  const handleCancelEdit = useCallback(() => {
    setEditingIndex(null);
    setEditServings("");
  }, []);

  // Handle delete with confirmation
  const handleDeletePress = useCallback(
    (index: number, recipeTitle: string) => {
      Alert.alert(
        "Supprimer la recette",
        `Voulez-vous retirer "${recipeTitle}" de ce repas ?`,
        [
          { text: "Annuler", style: "cancel" },
          {
            text: "Supprimer",
            style: "destructive",
            onPress: () => onRemoveRecipe(index),
          },
        ]
      );
    },
    [onRemoveRecipe]
  );

  // Check if at max capacity
  const isAtMaxCapacity = mealSlots.length >= MAX_RECIPES_PER_SLOT;

  if (!day || !mealType) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.day}>{DAY_NAMES[day]}</Text>
              <Text style={styles.mealType}>{MEAL_LABELS[mealType]}</Text>
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Fermer"
            >
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Recipe Count */}
          <Text style={styles.recipeCount}>
            {mealSlots.length} {mealSlots.length === 1 ? "recette" : "recettes"} planifiée
            {mealSlots.length > 1 ? "s" : ""}
          </Text>

          {/* Recipe List */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator
          >
            {mealSlots.map((mealSlot, index) => {
              const recipe = getRecipe(mealSlot.recipeId);

              if (!recipe) return null;

              // Show servings editor if editing this recipe
              if (editingIndex === index) {
                return (
                  <View key={`${mealSlot.recipeId}-${index}`} style={styles.editCard}>
                    <Text variant="body" style={styles.editTitle}>
                      Modifier le nombre de portions
                    </Text>
                    <Text variant="bodySmall" style={styles.editSubtitle}>
                      {recipe.title}
                    </Text>

                    <View style={styles.editRow}>
                      <TextInput
                        style={styles.input}
                        value={editServings}
                        onChangeText={setEditServings}
                        keyboardType="number-pad"
                        maxLength={2}
                        autoFocus
                        selectTextOnFocus
                        accessibilityLabel="Nombre de portions"
                      />
                      <Text style={styles.inputLabel}>
                        {parseInt(editServings, 10) > 1 || isNaN(parseInt(editServings, 10))
                          ? "personnes"
                          : "personne"}
                      </Text>
                    </View>

                    <View style={styles.editActions}>
                      <TouchableOpacity
                        style={[styles.editActionButton, styles.cancelButton]}
                        onPress={handleCancelEdit}
                      >
                        <Text style={styles.cancelButtonText}>Annuler</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.editActionButton, styles.saveButton]}
                        onPress={handleSaveServings}
                      >
                        <Text style={styles.saveButtonText}>Enregistrer</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              }

              return (
                <RecipeCardInModal
                  key={`${mealSlot.recipeId}-${index}`}
                  mealSlot={mealSlot}
                  recipe={recipe}
                  onToggleCooked={() => onToggleCooked(index, mealSlot.isCooked)}
                  onEdit={() => handleEditPress(index, mealSlot.servings)}
                  onDelete={() => handleDeletePress(index, recipe.title)}
                />
              );
            })}
          </ScrollView>

          {/* Footer - Add Recipe Button */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.addButton,
                isAtMaxCapacity && styles.addButtonDisabled,
              ]}
              onPress={isAtMaxCapacity ? undefined : onAddRecipe}
              disabled={isAtMaxCapacity}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={
                isAtMaxCapacity
                  ? `Maximum ${MAX_RECIPES_PER_SLOT} recettes atteint`
                  : "Ajouter une recette"
              }
            >
              <Text
                style={[
                  styles.addButtonIcon,
                  isAtMaxCapacity && styles.addButtonIconDisabled,
                ]}
              >
                +
              </Text>
              <Text
                style={[
                  styles.addButtonText,
                  isAtMaxCapacity && styles.addButtonTextDisabled,
                ]}
              >
                {isAtMaxCapacity
                  ? `Maximum ${MAX_RECIPES_PER_SLOT} recettes`
                  : "Ajouter une recette"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },

  modalContainer: {
    backgroundColor: colors.white,
    borderTopLeftRadius: spacing.lg,
    borderTopRightRadius: spacing.lg,
    height: "70%",
    ...shadows.lg,
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },

  headerText: {
    flex: 1,
  },

  day: {
    fontSize: fontSizes["2xl"],
    fontWeight: fontWeights.bold as any,
    color: colors.warm.brown,
    marginBottom: spacing.xs,
  },

  mealType: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.medium as any,
    color: colors.gray[600],
  },

  closeButton: {
    padding: spacing.sm,
    marginTop: -spacing.sm,
    marginRight: -spacing.sm,
  },

  closeIcon: {
    fontSize: 24,
    lineHeight: 28,
    color: colors.gray[500],
  },

  recipeCount: {
    fontSize: fontSizes.sm,
    color: colors.gray[600],
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },

  // Scroll View
  scrollView: {
    flex: 1,
  },

  scrollContent: {
    padding: spacing.lg,
    paddingTop: spacing.sm,
  },

  // Edit Card
  editCard: {
    backgroundColor: colors.cream.DEFAULT,
    borderRadius: spacing.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },

  editTitle: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.semibold as any,
    color: colors.warm.brown,
    marginBottom: spacing.xs,
  },

  editSubtitle: {
    fontSize: fontSizes.sm,
    color: colors.gray[600],
    marginBottom: spacing.md,
  },

  editRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },

  input: {
    backgroundColor: colors.white,
    borderRadius: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.semibold as any,
    color: colors.warm.brown,
    width: 80,
    textAlign: "center",
    marginRight: spacing.md,
    ...shadows.sm,
  },

  inputLabel: {
    fontSize: fontSizes.base,
    color: colors.gray[700],
  },

  editActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },

  editActionButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: spacing.sm,
    justifyContent: "center",
    alignItems: "center",
    ...shadows.sm,
  },

  cancelButton: {
    backgroundColor: colors.white,
  },

  cancelButtonText: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.medium as any,
    color: colors.gray[700],
  },

  saveButton: {
    backgroundColor: colors.primary.DEFAULT,
  },

  saveButtonText: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.semibold as any,
    color: colors.white,
  },

  // Footer
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },

  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary.DEFAULT,
    borderRadius: spacing.md,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    ...shadows.md,
  },

  addButtonDisabled: {
    backgroundColor: colors.gray[300],
  },

  addButtonIcon: {
    fontSize: 24,
    lineHeight: 28,
    color: colors.white,
    fontWeight: fontWeights.bold as any,
  },

  addButtonIconDisabled: {
    color: colors.gray[500],
  },

  addButtonText: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.semibold as any,
    color: colors.white,
  },

  addButtonTextDisabled: {
    color: colors.gray[500],
  },
});
