/**
 * Recipe Detail Screen
 *
 * Full recipe display with ingredients, steps, and nutrition.
 * Supports interactive checkboxes, servings multiplier, and favorite toggle.
 *
 * @module app/recipes/[id]
 */

import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  View,
  ScrollView,
  Image,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  ActionSheetIOS,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Text, Button } from "@/components/ui";
import { AppHeader } from "@/components/navigation";
import { SelectGroceryListModal, CreateListModal } from "@/components/grocery";
import { NutritionSummary } from "@/components/recipe/NutritionSummary";
import { TagBadge } from "@/components/recipe/TagBadge";
import { IngredientImageAvatar } from "@/components/recipe/IngredientImageAvatar";
import { colors, spacing, fontSizes, fontWeights, shadows } from "@/theme";
import { useRecipe, useToggleFavorite, useDeleteRecipe } from "@/hooks/useRecipes";
import { useAddIngredientsFromRecipe } from "@/hooks/useGroceryList";
import { useCalculateNutrition } from "@/hooks/useNutrition";
import { useAuth } from "@/hooks/useAuth";
import { exportRecipeToPDF, RecipeService } from "@/services";
import type { RecipeIngredient, RecipeStep } from "@/types/database";
import type { GroceryList } from "@/types";

const DEFAULT_COVER = "https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=800";

/**
 * Check if unit should be displayed
 * Filters out non-informative units like "pieces", "unité", etc.
 */
function shouldDisplayUnit(unit?: string | null): boolean {
  if (!unit) return false;

  const lowerUnit = unit.toLowerCase().trim();
  const ignoredUnits = [
    "piece",
    "pieces",
    "pièce",
    "pièces",
    "unité",
    "unités",
    "unite",
    "unites",
    "x",
  ];

  return !ignoredUnits.includes(lowerUnit);
}

export default function RecipeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const recipeId = id as string;
  const { user } = useAuth();

  // Data Fetching
  const { data: recipe, isLoading, error, refetch } = useRecipe(recipeId, user?.id);
  const toggleFavorite = useToggleFavorite();
  const deleteRecipe = useDeleteRecipe();
  const addToGroceryList = useAddIngredientsFromRecipe();
  const calculateNutrition = useCalculateNutrition();

  // Track if we've already calculated nutrition for this recipe
  const calculatedRecipesRef = React.useRef<Set<string>>(new Set());

  // Local State
  const [servingsMultiplier, setServingsMultiplier] = useState(1);
  const [checkedSteps, setCheckedSteps] = useState<Set<number>>(new Set());
  const [selectListModalVisible, setSelectListModalVisible] = useState(false);
  const [createListModalVisible, setCreateListModalVisible] = useState(false);
  const [imageMigrated, setImageMigrated] = useState(false);

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

  const handleExportPDF = useCallback(async () => {
    if (!recipe || !user?.isPremium) {
      Alert.alert(
        "Fonctionnalité Premium",
        "L'export PDF est réservé aux utilisateurs Premium. Passez à Premium pour débloquer cette fonctionnalité !",
        [
          { text: "Annuler", style: "cancel" },
          { text: "Devenir Premium", onPress: () => router.push("/settings/premium") },
        ]
      );
      return;
    }

    try {
      await exportRecipeToPDF(recipe, {
        includeImage: true,
        includeNutrition: true,
      });
    } catch (error) {
      Alert.alert(
        "Erreur",
        "Impossible d'exporter le PDF. Veuillez réessayer."
      );
    }
  }, [recipe, user?.isPremium]);

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

  const handleCalculateNutrition = useCallback(() => {
    if (!recipe || !user?.id) return;

    calculateNutrition.mutate({
      recipeId: recipe.id,
      userId: user.id,
      ingredients: recipe.ingredients,
      servings: recipe.servings,
    });
  }, [recipe, user, calculateNutrition]);

  // Auto-calculate nutrition for Premium users (progressive calculation)
  useEffect(() => {
    // Only auto-calculate if:
    // 1. User is Premium
    // 2. Recipe exists and has no nutrition data yet
    // 3. Not already calculating
    // 4. Haven't already calculated for this recipe in this session
    const isPremium = user?.isPremium === true;

    if (
      isPremium &&
      recipe &&
      !recipe.nutrition &&
      !calculateNutrition.isPending &&
      !calculatedRecipesRef.current.has(recipe.id)
    ) {
      console.log("🎁 Premium auto-calculation triggered for recipe:", recipe.title);

      // Mark this recipe as calculated to prevent double triggers
      calculatedRecipesRef.current.add(recipe.id);

      // Inline the calculation logic to avoid dependency issues
      calculateNutrition.mutate({
        recipeId: recipe.id,
        userId: user.id!,
        ingredients: recipe.ingredients,
        servings: recipe.servings,
      });
    }
    // Use granular deps to avoid unnecessary re-triggers
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipe?.id, user?.isPremium, user?.id, calculateNutrition.isPending]);

  // Lazy migration of external images to Supabase Storage
  useEffect(() => {
    if (!recipe || imageMigrated) return;

    // Check if image is external (not in Supabase Storage)
    if (RecipeService.isExternalImage(recipe.coverImageUrl)) {
      console.log("🔄 Detected external image, migrating...");

      // Migrate in background (non-blocking)
      RecipeService.migrateImageToStorage(
        recipe.id,
        recipe.coverImageUrl!,
        recipe.importUrl
      )
        .then(({ data: newUrl, error }) => {
          if (newUrl) {
            console.log("✅ Image migrated to Storage:", newUrl);
            setImageMigrated(true);

            // Optionally refresh the recipe to show the new image immediately
            // The image URL in the database has been updated by the Edge Function
            refetch();
          } else {
            console.warn("⚠️ Image migration failed:", error);
          }
        });
    }
  }, [recipe, imageMigrated, refetch]);

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

  // Grocery list handlers (after adjustedIngredients is defined)
  const handleAddToGroceryList = useCallback(() => {
    if (!recipe || !user?.id || !adjustedIngredients.length) return;
    setSelectListModalVisible(true);
  }, [recipe, user?.id, adjustedIngredients]);

  const handleSelectList = useCallback(
    async (listId: string) => {
      if (!recipe || !user?.id) return;

      try {
        const result = await addToGroceryList.mutateAsync({
          userId: user.id,
          recipeId: recipe.id,
          ingredients: adjustedIngredients,
          listId,
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
    [recipe, user?.id, adjustedIngredients, addToGroceryList]
  );

  const handleCreateNewList = useCallback(() => {
    setSelectListModalVisible(false);
    setCreateListModalVisible(true);
  }, []);

  const handleListCreated = useCallback(
    (newList: GroceryList) => {
      // Auto-add ingredients to the newly created list
      handleSelectList(newList.id);
    },
    [handleSelectList]
  );

  const handleRecipeMenu = useCallback(() => {
    if (!recipe) return;

    const favoriteLabel = recipe.isFavorite ? "Retirer des favoris" : "Ajouter aux favoris";
    const pdfLabel = user?.isPremium ? "Exporter PDF" : "🔒 Exporter PDF (Premium)";

    const options = ["Annuler", favoriteLabel, "Ajouter aux courses", pdfLabel, "Modifier", "Supprimer"];

    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          destructiveButtonIndex: 5,
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            // Favori
            handleFavoriteToggle();
          } else if (buttonIndex === 2) {
            // Courses
            handleAddToGroceryList();
          } else if (buttonIndex === 3) {
            // Exporter PDF
            handleExportPDF();
          } else if (buttonIndex === 4) {
            // Modifier
            handleEdit();
          } else if (buttonIndex === 5) {
            // Supprimer
            handleDelete();
          }
        }
      );
    } else {
      // Android
      Alert.alert(
        "Actions",
        "Que souhaitez-vous faire ?",
        [
          { text: "Annuler", style: "cancel" },
          {
            text: favoriteLabel,
            onPress: handleFavoriteToggle,
          },
          {
            text: "Ajouter aux courses",
            onPress: handleAddToGroceryList,
          },
          {
            text: pdfLabel,
            onPress: handleExportPDF,
          },
          {
            text: "Modifier",
            onPress: handleEdit,
          },
          {
            text: "Supprimer",
            onPress: handleDelete,
            style: "destructive",
          },
        ]
      );
    }
  }, [recipe, handleFavoriteToggle, handleAddToGroceryList, handleExportPDF, handleEdit, handleDelete, user?.isPremium]);

  // Loading State
  if (isLoading) {
    return (
      <>
        <AppHeader showBackButton />
        <SafeAreaView edges={["bottom"]} style={styles.safeArea}>
          <View style={styles.container}>
            <View style={styles.centered}>
              <Text variant="body" color="neutral">
                Chargement...
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </>
    );
  }

  // Error State
  if (error) {
    return (
      <>
        <AppHeader showBackButton />
        <SafeAreaView edges={["bottom"]} style={styles.safeArea}>
          <View style={styles.container}>
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
      </>
    );
  }

  // Not Found State
  if (!recipe) {
    return (
      <>
        <AppHeader showBackButton />
        <SafeAreaView edges={["bottom"]} style={styles.safeArea}>
          <View style={styles.container}>
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
      </>
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
    <>
      <AppHeader showBackButton />
      <SafeAreaView edges={["bottom"]} style={styles.safeArea}>
        <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* Cover Image */}
        <View style={styles.coverContainer}>
          <Image
            source={{ uri: recipe.coverImageUrl || DEFAULT_COVER }}
            style={styles.coverImage}
            resizeMode="cover"
          />
        </View>

        {/* Title with Menu */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text variant="h1" style={styles.title}>
              {recipe.title}
            </Text>
            {recipe.isFavorite && (
              <Text style={styles.favoriteIndicator}>❤️</Text>
            )}
          </View>
          <TouchableOpacity
            onPress={handleRecipeMenu}
            style={styles.menuButton}
            accessibilityLabel="Options de la recette"
            accessibilityRole="button"
          >
            <Text style={styles.menuIcon}>⋮</Text>
          </TouchableOpacity>
        </View>

        {/* Description */}
        {recipe.description && (
          <View style={styles.descriptionContainer}>
            <Text variant="body" color="neutral" style={styles.description}>
              {recipe.description}
            </Text>
          </View>
        )}

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

        {/* Tags Section */}
        {recipe.tags && recipe.tags.length > 0 && (
          <View style={styles.tagsSection}>
            <Text variant="h3" style={styles.sectionTitle}>
              Tags
            </Text>
            <View style={styles.tagsContainer}>
              {recipe.tags.map((tag, index) => (
                <TagBadge key={`${tag}-${index}`} tag={tag} size="md" />
              ))}
            </View>
          </View>
        )}

        {/* Ingredients Section */}
        {adjustedIngredients.length > 0 && (
          <View style={styles.section}>
            <Text variant="h3" style={styles.sectionTitle}>
              Ingrédients
            </Text>
            {adjustedIngredients.map((ingredient, index) => (
              <View
                key={index}
                style={styles.ingredientRow}
              >
                <IngredientImageAvatar
                  imageUrl={ingredient.imageUrl}
                  fallbackEmoji="🍽️"
                  size={48}
                />
                <Text
                  variant="body"
                  style={styles.ingredientText}
                >
                  {ingredient.quantity > 0 && `${ingredient.quantity.toFixed(1).replace(/\.0$/, "")} `}
                  {shouldDisplayUnit(ingredient.unit) && `${ingredient.unit} `}
                  {ingredient.name}
                </Text>
              </View>
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
        <NutritionSummary
          nutrition={recipe.nutrition || null}
          isCalculating={calculateNutrition.isPending}
          onCalculate={handleCalculateNutrition}
          isPremium={user?.isPremium === true}
        />

      </ScrollView>

      {/* Select Grocery List Modal */}
      <SelectGroceryListModal
        visible={selectListModalVisible}
        userId={user?.id || null}
        onClose={() => setSelectListModalVisible(false)}
        onSelect={handleSelectList}
        onCreateNew={handleCreateNewList}
      />

      {/* Create List Modal */}
      <CreateListModal
        visible={createListModalVisible}
        userId={user?.id || null}
        onClose={() => setCreateListModalVisible(false)}
        onSuccess={handleListCreated}
      />
    </SafeAreaView>
    </>
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
    objectFit: "contain",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },

  headerLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },

  title: {
    flex: 1,
    color: colors.warm.brown,
  },

  favoriteIndicator: {
    fontSize: 20,
  },

  menuButton: {
    padding: spacing.xs,
    marginLeft: spacing.sm,
  },

  menuIcon: {
    fontSize: 32,
    color: colors.warm.brown,
    fontWeight: "bold",
    lineHeight: 32,
  },

  descriptionContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
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

  tagsSection: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },

  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.sm,
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
});
