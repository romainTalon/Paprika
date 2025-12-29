/**
 * Recipe Detail Screen
 *
 * Full recipe display with ingredients, steps, and nutrition.
 * Supports interactive checkboxes, servings multiplier, and favorite toggle.
 *
 * @module app/recipes/[id]
 */

import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  ScrollView,
  Image,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Text, Button } from "@/components/ui";
import { BackButton } from "@/components/navigation";
import { colors, spacing, fontSizes, fontWeights, shadows } from "@/theme";
import { useRecipe, useToggleFavorite, useDeleteRecipe } from "@/hooks/useRecipes";
import { useAddIngredientsFromRecipe } from "@/hooks/useGroceryList";
import { useAuth } from "@/hooks/useAuth";
import type { RecipeIngredient, RecipeStep } from "@/types/database";

const DEFAULT_COVER = "https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=800";

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const recipeId = id as string;
  const { user } = useAuth();

  // Data Fetching
  const { data: recipe, isLoading, error, refetch } = useRecipe(recipeId, user?.id);
  const toggleFavorite = useToggleFavorite();
  const deleteRecipe = useDeleteRecipe();
  const addToGroceryList = useAddIngredientsFromRecipe();

  // Local State
  const [servingsMultiplier, setServingsMultiplier] = useState(1);
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set());
  const [checkedSteps, setCheckedSteps] = useState<Set<number>>(new Set());

  // Handlers
  const handleFavoriteToggle = useCallback(() => {
    if (!recipe || !user?.id) return;
    toggleFavorite.mutate({
      recipeId: recipe.id,
      userId: user.id,
    });
  }, [recipe, user, toggleFavorite]);

  const handleServingsChange = useCallback((delta: number) => {
    setServingsMultiplier((prev) => Math.max(0.5, prev + delta));
  }, []);

  const handleIngredientToggle = useCallback((index: number) => {
    setCheckedIngredients((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }, []);

  const handleStepToggle = useCallback((index: number) => {
    setCheckedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }, []);

  const handleEdit = useCallback(() => {
    if (!recipe) return;
    router.push(`/recipes/${recipe.id}/edit`);
  }, [recipe]);

  const handleDelete = useCallback(() => {
    if (!recipe || !user?.id) return;

    Alert.alert(
      "Supprimer la recette",
      `Êtes-vous sûr de vouloir supprimer "${recipe.title}" ? Cette action est irréversible.`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteRecipe.mutateAsync({
                recipeId: recipe.id,
                userId: user.id,
                cookbookId: recipe.cookbookId || undefined,
              });
              Alert.alert("Succès", "Recette supprimée", [
                {
                  text: "OK",
                  onPress: () => router.back(),
                },
              ]);
            } catch (error) {
              Alert.alert("Erreur", "Impossible de supprimer la recette");
            }
          },
        },
      ]
    );
  }, [recipe, user, deleteRecipe]);

  // Computed Values
  const adjustedIngredients = useMemo(() => {
    if (!recipe?.ingredients) return [];
    return recipe.ingredients.map((ing) => ({
      ...ing,
      quantity: ing.quantity * servingsMultiplier,
    }));
  }, [recipe?.ingredients, servingsMultiplier]);

  const adjustedServings = useMemo(() => {
    if (!recipe?.servings) return 0;
    return Math.round(recipe.servings * servingsMultiplier);
  }, [recipe?.servings, servingsMultiplier]);

  const totalTime = useMemo(() => {
    if (!recipe) return 0;
    return (recipe.prepTime || 0) + (recipe.cookTime || 0);
  }, [recipe]);

  // Grocery list handler (after adjustedIngredients is defined)
  const handleAddToGroceryList = useCallback(() => {
    if (!recipe || !user?.id || !adjustedIngredients.length) return;

    Alert.alert(
      "Ajouter aux courses",
      `Ajouter ${adjustedIngredients.length} ingrédient${adjustedIngredients.length > 1 ? "s" : ""} à votre liste de courses ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Ajouter",
          onPress: async () => {
            try {
              const result = await addToGroceryList.mutateAsync({
                userId: user.id,
                recipeId: recipe.id,
                ingredients: adjustedIngredients,
              });

              const { added, merged } = result.stats;
              let message = "";
              if (added > 0 && merged > 0) {
                message = `${added} ajouté${added > 1 ? "s" : ""}, ${merged} fusionné${merged > 1 ? "s" : ""}`;
              } else if (added > 0) {
                message = `${added} ingrédient${added > 1 ? "s" : ""} ajouté${added > 1 ? "s" : ""}`;
              } else {
                message = `${merged} ingrédient${merged > 1 ? "s" : ""} fusionné${merged > 1 ? "s" : ""}`;
              }

              Alert.alert("Succès", message);
            } catch (error) {
              Alert.alert(
                "Erreur",
                error instanceof Error
                  ? error.message
                  : "Impossible d'ajouter les ingrédients"
              );
            }
          },
        },
      ]
    );
  }, [recipe, user, adjustedIngredients, addToGroceryList]);

  // Loading State
  if (isLoading) {
    return (
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        <View style={styles.container}>
          <BackButton />
          <View style={styles.centered}>
            <Text variant="body" color="neutral">
              Chargement...
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Error State
  if (error) {
    return (
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        <View style={styles.container}>
          <BackButton />
          <View style={styles.centered}>
            <Text variant="h2" style={styles.errorTitle}>
              Erreur
            </Text>
            <Text variant="body" color="neutral" style={styles.errorMessage}>
              Impossible de charger la recette
            </Text>
            <Button variant="primary" onPress={() => refetch()}>
              Réessayer
            </Button>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Not Found State
  if (!recipe) {
    return (
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        <View style={styles.container}>
          <BackButton />
          <View style={styles.centered}>
            <Text variant="h1" style={{ fontSize: 64, lineHeight: 72 }}>
              🔍
            </Text>
            <Text variant="h2" style={styles.errorTitle}>
              Recette introuvable
            </Text>
            <Text variant="body" color="neutral" style={styles.errorMessage}>
              Cette recette n'existe pas ou a été supprimée
            </Text>
            <Button variant="primary" onPress={() => router.back()}>
              Retour
            </Button>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Format time display
  const formatTime = (minutes: number | undefined) => {
    if (!minutes) return null;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0 && m > 0) return `${h}h${m}`;
    if (h > 0) return `${h}h`;
    return `${m}min`;
  };

  // Format difficulty
  const difficultyLabels: Record<string, string> = {
    easy: "Facile",
    medium: "Moyen",
    hard: "Difficile",
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <BackButton />

        {/* Cover Image */}
        <View style={styles.coverContainer}>
          <Image
            source={{ uri: recipe.coverImageUrl || DEFAULT_COVER }}
            style={styles.coverImage}
            resizeMode="cover"
          />
        </View>

        {/* Action Icons Bar */}
        <View style={styles.actionsBar}>
          <View style={styles.actionsRow}>
            {/* Favorite */}
            <TouchableOpacity
              onPress={handleFavoriteToggle}
              style={styles.actionButton}
              accessibilityRole="button"
              accessibilityLabel={recipe.isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
            >
              <Text style={styles.actionIcon}>{recipe.isFavorite ? "❤️" : "🤍"}</Text>
            </TouchableOpacity>

            {/* Grocery List (conditional) */}
            {adjustedIngredients.length > 0 && (
              <TouchableOpacity
                onPress={handleAddToGroceryList}
                disabled={addToGroceryList.isPending}
                style={[styles.actionButton, addToGroceryList.isPending && styles.actionButtonDisabled]}
                accessibilityRole="button"
                accessibilityLabel="Ajouter les ingrédients aux courses"
              >
                <Text style={styles.actionIcon}>🛒</Text>
              </TouchableOpacity>
            )}

            {/* Edit */}
            <TouchableOpacity
              onPress={handleEdit}
              style={styles.actionButton}
              accessibilityRole="button"
              accessibilityLabel="Modifier la recette"
            >
              <Text style={styles.actionIcon}>✏️</Text>
            </TouchableOpacity>

            {/* Delete */}
            <TouchableOpacity
              onPress={handleDelete}
              disabled={deleteRecipe.isPending}
              style={[styles.actionButton, deleteRecipe.isPending && styles.actionButtonDisabled]}
              accessibilityRole="button"
              accessibilityLabel="Supprimer la recette"
            >
              <Text style={styles.actionIcon}>🗑️</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Text variant="h1" style={styles.title}>
            {recipe.title}
          </Text>

          {recipe.description && (
            <Text variant="body" color="neutral" style={styles.description}>
              {recipe.description}
            </Text>
          )}
        </View>

        {/* Metadata Bar */}
        <View style={styles.metadataBar}>
          {/* Servings with Multiplier */}
          <View style={styles.metadataItem}>
            <Text variant="caption" color="neutral" style={styles.metadataLabel}>
              Portions
            </Text>
            <View style={styles.servingsStepper}>
              <TouchableOpacity
                style={styles.servingsButton}
                onPress={() => handleServingsChange(-0.5)}
                disabled={servingsMultiplier <= 0.5}
                accessibilityRole="button"
                accessibilityLabel="Réduire les portions"
              >
                <Text style={styles.servingsButtonText}>−</Text>
              </TouchableOpacity>
              <Text variant="body" style={styles.servingsValue}>
                {adjustedServings}
              </Text>
              <TouchableOpacity
                style={styles.servingsButton}
                onPress={() => handleServingsChange(0.5)}
                accessibilityRole="button"
                accessibilityLabel="Augmenter les portions"
              >
                <Text style={styles.servingsButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Prep Time */}
          {recipe.prepTime && (
            <View style={styles.metadataItem}>
              <Text variant="caption" color="neutral" style={styles.metadataLabel}>
                Préparation
              </Text>
              <Text variant="body" style={styles.metadataValue}>
                {formatTime(recipe.prepTime)}
              </Text>
            </View>
          )}

          {/* Cook Time */}
          {recipe.cookTime && (
            <View style={styles.metadataItem}>
              <Text variant="caption" color="neutral" style={styles.metadataLabel}>
                Cuisson
              </Text>
              <Text variant="body" style={styles.metadataValue}>
                {formatTime(recipe.cookTime)}
              </Text>
            </View>
          )}

          {/* Total Time */}
          {totalTime > 0 && (
            <View style={styles.metadataItem}>
              <Text variant="caption" color="neutral" style={styles.metadataLabel}>
                Total
              </Text>
              <Text variant="body" style={styles.metadataValue}>
                {formatTime(totalTime)}
              </Text>
            </View>
          )}

          {/* Difficulty */}
          {recipe.difficulty && (
            <View style={styles.metadataItem}>
              <Text variant="caption" color="neutral" style={styles.metadataLabel}>
                Difficulté
              </Text>
              <Text variant="body" style={styles.metadataValue}>
                {difficultyLabels[recipe.difficulty] || recipe.difficulty}
              </Text>
            </View>
          )}
        </View>

        {/* Ingredients Section */}
        {adjustedIngredients.length > 0 && (
          <View style={styles.section}>
            <Text variant="h3" style={styles.sectionTitle}>
              Ingrédients
            </Text>
            {adjustedIngredients.map((ingredient, index) => (
              <TouchableOpacity
                key={index}
                style={styles.ingredientRow}
                onPress={() => handleIngredientToggle(index)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: checkedIngredients.has(index) }}
              >
                <View style={styles.checkbox}>
                  {checkedIngredients.has(index) && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </View>
                <Text
                  variant="body"
                  style={[
                    styles.ingredientText,
                    checkedIngredients.has(index) && styles.checkedText,
                  ]}
                >
                  {ingredient.quantity > 0 && `${ingredient.quantity.toFixed(1).replace(/\.0$/, "")} `}
                  {ingredient.unit && `${ingredient.unit} `}
                  {ingredient.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Steps Section */}
        {recipe.steps && recipe.steps.length > 0 && (
          <View style={styles.section}>
            <Text variant="h3" style={styles.sectionTitle}>
              Étapes
            </Text>
            {recipe.steps.map((step, index) => (
              <TouchableOpacity
                key={index}
                style={styles.stepRow}
                onPress={() => handleStepToggle(index)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: checkedSteps.has(index) }}
              >
                <View style={styles.stepNumber}>
                  <Text variant="bodySmall" style={styles.stepNumberText}>
                    {step.order}
                  </Text>
                </View>
                <View style={styles.stepContent}>
                  <Text
                    variant="body"
                    style={[
                      styles.stepText,
                      checkedSteps.has(index) && styles.checkedText,
                    ]}
                  >
                    {step.instruction}
                  </Text>
                  <View style={styles.stepCheckbox}>
                    {checkedSteps.has(index) && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Nutrition Section */}
        {recipe.nutrition && (
          <View style={styles.section}>
            <Text variant="h3" style={styles.sectionTitle}>
              Informations nutritionnelles
            </Text>
            <View style={styles.nutritionCard}>
              <View style={styles.nutritionRow}>
                <Text variant="body" style={styles.nutritionLabel}>
                  Calories
                </Text>
                <Text variant="body" style={styles.nutritionValue}>
                  {recipe.nutrition.calories} kcal
                </Text>
              </View>
              {recipe.nutrition.protein !== undefined && (
                <View style={styles.nutritionRow}>
                  <Text variant="body" style={styles.nutritionLabel}>
                    Protéines
                  </Text>
                  <Text variant="body" style={styles.nutritionValue}>
                    {recipe.nutrition.protein}g
                  </Text>
                </View>
              )}
              {recipe.nutrition.carbs !== undefined && (
                <View style={styles.nutritionRow}>
                  <Text variant="body" style={styles.nutritionLabel}>
                    Glucides
                  </Text>
                  <Text variant="body" style={styles.nutritionValue}>
                    {recipe.nutrition.carbs}g
                  </Text>
                </View>
              )}
              {recipe.nutrition.fat !== undefined && (
                <View style={styles.nutritionRow}>
                  <Text variant="body" style={styles.nutritionLabel}>
                    Lipides
                  </Text>
                  <Text variant="body" style={styles.nutritionValue}>
                    {recipe.nutrition.fat}g
                  </Text>
                </View>
              )}
              {recipe.nutrition.fiber !== undefined && (
                <View style={styles.nutritionRow}>
                  <Text variant="body" style={styles.nutritionLabel}>
                    Fibres
                  </Text>
                  <Text variant="body" style={styles.nutritionValue}>
                    {recipe.nutrition.fiber}g
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.cream.DEFAULT,
  },
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl, // Normal padding
  },

  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
    gap: spacing.lg,
  },

  errorTitle: {
    marginBottom: spacing.sm,
    color: colors.warm.brown,
  },

  errorMessage: {
    textAlign: "center",
    marginBottom: spacing.lg,
  },

  coverContainer: {
    width: "100%",
    height: 250,
    backgroundColor: colors.gray[200],
  },

  coverImage: {
    width: "100%",
    height: "100%",
  },

  actionsBar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    backgroundColor: colors.cream.DEFAULT,
  },

  actionsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "center",
    justifyContent: "flex-end",
  },

  header: {
    padding: spacing.lg,
    gap: spacing.sm,
  },

  title: {
    color: colors.warm.brown,
  },

  actionButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },

  actionButtonDisabled: {
    opacity: 0.4,
  },

  actionIcon: {
    fontSize: 24,
    lineHeight: 32,
  },

  description: {
    marginTop: spacing.xs,
  },

  metadataBar: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.gray[200],
    backgroundColor: colors.cream[50],
  },

  metadataItem: {
    gap: spacing.xs,
  },

  metadataLabel: {
    textTransform: "uppercase",
    fontSize: fontSizes.xs,
  },

  metadataValue: {
    fontWeight: fontWeights.semibold as any,
    color: colors.warm.brown,
  },

  servingsStepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },

  servingsButton: {
    width: 32,
    height: 32,
    borderRadius: spacing.sm,
    backgroundColor: colors.primary.DEFAULT,
    justifyContent: "center",
    alignItems: "center",
  },

  servingsButtonText: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.white,
    lineHeight: 24,
  },

  servingsValue: {
    minWidth: 40,
    textAlign: "center",
    fontWeight: fontWeights.semibold as any,
    color: colors.warm.brown,
  },

  section: {
    padding: spacing.lg,
    gap: spacing.md,
  },

  sectionTitle: {
    color: colors.warm.brown,
    marginBottom: spacing.xs,
  },

  ingredientRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },

  checkbox: {
    width: 24,
    height: 24,
    borderRadius: spacing.xs,
    borderWidth: 2,
    borderColor: colors.primary.DEFAULT,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.white,
  },

  checkmark: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.primary.DEFAULT,
    lineHeight: 20,
  },

  ingredientText: {
    flex: 1,
    color: colors.warm.brown,
  },

  checkedText: {
    textDecorationLine: "line-through",
    opacity: 0.5,
  },

  stepRow: {
    flexDirection: "row",
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },

  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary.DEFAULT,
    justifyContent: "center",
    alignItems: "center",
  },

  stepNumberText: {
    fontWeight: fontWeights.bold as any,
    color: colors.white,
  },

  stepContent: {
    flex: 1,
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "flex-start",
  },

  stepText: {
    flex: 1,
    color: colors.warm.brown,
  },

  stepCheckbox: {
    width: 24,
    height: 24,
    borderRadius: spacing.xs,
    borderWidth: 2,
    borderColor: colors.primary.DEFAULT,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.white,
  },

  nutritionCard: {
    backgroundColor: colors.cream[50],
    borderRadius: spacing.md,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },

  nutritionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.xs,
  },

  nutritionLabel: {
    color: colors.warm.gray,
  },

  nutritionValue: {
    fontWeight: fontWeights.semibold as any,
    color: colors.warm.brown,
  },
});
