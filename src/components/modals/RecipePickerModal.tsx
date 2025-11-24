/**
 * Recipe Picker Modal
 *
 * Modal for selecting a recipe to add to a meal plan slot.
 * Displays user's recipes and allows servings adjustment.
 *
 * @module components/modals/RecipePickerModal
 */

import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Image,
  ActivityIndicator,
} from "react-native";
import { Text, Button } from "@/components/ui";
import { colors, spacing, shadows, fontSizes, fontWeights } from "@/theme";
import { useRecipes, type Recipe } from "@/hooks/useRecipes";
import { useCookbooks, type Cookbook } from "@/hooks/useCookbooks";

interface RecipePickerModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** User ID */
  userId: string | null;
  /** Initial recipe ID (for editing) */
  initialRecipeId?: string | null;
  /** Initial servings (for editing) */
  initialServings?: number;
  /** Callback when modal should close */
  onClose: () => void;
  /** Callback when recipe is selected */
  onSelect: (recipeId: string, servings: number) => void;
}

export default function RecipePickerModal({
  visible,
  userId,
  initialRecipeId,
  initialServings = 4,
  onClose,
  onSelect,
}: RecipePickerModalProps) {
  const [selectedCookbookId, setSelectedCookbookId] = useState<string | null>(null);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
  const [servings, setServings] = useState(initialServings);

  // Fetch user's cookbooks and recipes
  const { data: cookbooks, isLoading: cookbooksLoading, error: cookbooksError } = useCookbooks(userId ?? undefined);
  const { data: allRecipes, isLoading: recipesLoading, error: recipesError } = useRecipes(userId ?? undefined);

  // Filter recipes by selected cookbook
  const recipes = selectedCookbookId
    ? allRecipes?.filter((r) => r.cookbookId === selectedCookbookId)
    : [];

  // Reset state when modal opens/closes
  useEffect(() => {
    if (visible) {
      setSelectedRecipeId(initialRecipeId || null);
      setServings(initialServings);
      setSelectedCookbookId(null); // Always start at cookbook selection
    } else {
      setSelectedRecipeId(null);
      setServings(4);
      setSelectedCookbookId(null);
    }
  }, [visible, initialRecipeId, initialServings]);

  // Find selected recipe
  const selectedRecipe = allRecipes?.find((r) => r.id === selectedRecipeId);

  // Handlers
  const handleSelectCookbook = (cookbook: Cookbook) => {
    setSelectedCookbookId(cookbook.id);
  };

  const handleBackToCookbooks = () => {
    setSelectedCookbookId(null);
    setSelectedRecipeId(null);
  };

  const handleSelectRecipe = (recipe: Recipe) => {
    setSelectedRecipeId(recipe.id);
    // Pre-fill servings from recipe
    setServings(recipe.servings || 4);
  };

  const handleConfirm = () => {
    if (!selectedRecipeId) return;
    onSelect(selectedRecipeId, servings);
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  // Render cookbook item
  const renderCookbook = ({ item }: { item: Cookbook }) => {
    const recipeCount = allRecipes?.filter((r) => r.cookbookId === item.id).length || 0;

    return (
      <TouchableOpacity
        style={styles.cookbookItem}
        onPress={() => handleSelectCookbook(item)}
        activeOpacity={0.7}
        accessibilityLabel={`Select ${item.name} cookbook`}
        accessibilityRole="button"
      >
        {/* Cookbook Image */}
        {item.coverImageUrl ? (
          <Image
            source={{ uri: item.coverImageUrl }}
            style={styles.cookbookImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.cookbookImage, styles.imagePlaceholder]}>
            <Text style={styles.placeholderIcon}>📖</Text>
          </View>
        )}

        {/* Cookbook Info */}
        <View style={styles.cookbookInfo}>
          <Text variant="body" style={styles.cookbookTitle} numberOfLines={2}>
            {item.name}
          </Text>

          <Text variant="caption" color="neutral">
            {recipeCount} {recipeCount > 1 ? "recettes" : "recette"}
          </Text>

          {item.description && (
            <Text variant="caption" color="neutral" numberOfLines={1} style={styles.cookbookDescription}>
              {item.description}
            </Text>
          )}
        </View>

        {/* Arrow Indicator */}
        <View style={styles.arrowIndicator}>
          <Text style={styles.arrow}>→</Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Render recipe item
  const renderRecipe = ({ item }: { item: Recipe }) => {
    const isSelected = item.id === selectedRecipeId;

    return (
      <TouchableOpacity
        style={[styles.recipeItem, isSelected && styles.recipeItemSelected]}
        onPress={() => handleSelectRecipe(item)}
        activeOpacity={0.7}
        accessibilityLabel={`Select ${item.title}`}
        accessibilityRole="button"
        accessibilityState={{ selected: isSelected }}
      >
        {/* Recipe Image */}
        {item.coverImageUrl ? (
          <Image
            source={{ uri: item.coverImageUrl }}
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
          <Text variant="body" style={styles.recipeTitle} numberOfLines={2}>
            {item.title}
          </Text>

          <Text variant="caption" color="neutral">
            {item.servings} {item.servings > 1 ? "portions" : "portion"}
          </Text>

          {/* Time */}
          {(item.prepTime || item.cookTime) && (
            <Text variant="caption" color="neutral" style={styles.recipeTime}>
              ⏱️ {((item.prepTime || 0) + (item.cookTime || 0))} min
            </Text>
          )}
        </View>

        {/* Selection Indicator */}
        {isSelected && (
          <View style={styles.selectionIndicator}>
            <Text style={styles.checkmark}>✓</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleCancel}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        {/* Backdrop */}
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleCancel}
        />

        {/* Modal Content */}
        <View style={styles.modal}>
          {/* FIXED HEADER */}
          <View style={styles.header}>
            <View style={styles.headerTop}>
              {selectedCookbookId && (
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={handleBackToCookbooks}
                  accessibilityLabel="Back to cookbooks"
                  accessibilityRole="button"
                >
                  <Text style={styles.backButtonText}>← Retour</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleCancel}
                accessibilityLabel="Close"
                accessibilityRole="button"
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            {selectedCookbookId ? (
              <>
                <Text variant="h2">Choisir une recette</Text>
                <Text variant="bodySmall" color="neutral" style={styles.subtitle}>
                  Sélectionnez une recette et ajustez les portions
                </Text>
              </>
            ) : (
              <>
                <Text variant="h2">Choisir un livre</Text>
                <Text variant="bodySmall" color="neutral" style={styles.subtitle}>
                  Sélectionnez d'abord un livre de recettes
                </Text>
              </>
            )}
          </View>

          {/* SCROLLABLE CONTENT */}
          <View style={styles.scrollableContent}>
            {!selectedCookbookId ? (
              // COOKBOOK SELECTION
              cookbooksLoading ? (
                <View style={styles.centered}>
                  <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
                  <Text variant="body" color="neutral" style={{ marginTop: spacing.md }}>
                    Chargement...
                  </Text>
                </View>
              ) : cookbooksError ? (
                <View style={styles.centered}>
                  <Text style={styles.errorIcon}>⚠️</Text>
                  <Text variant="h3">Erreur</Text>
                  <Text variant="body" color="neutral" style={{ marginTop: spacing.sm }}>
                    {cookbooksError instanceof Error ? cookbooksError.message : "Impossible de charger les livres"}
                  </Text>
                </View>
              ) : !cookbooks || cookbooks.length === 0 ? (
                <View style={styles.centered}>
                  <Text style={styles.emptyIcon}>📚</Text>
                  <Text variant="h3">Aucun livre</Text>
                  <Text variant="body" color="neutral" style={{ marginTop: spacing.sm }}>
                    Créez d'abord un livre de recettes
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={cookbooks}
                  renderItem={renderCookbook}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={styles.listContent}
                  showsVerticalScrollIndicator={true}
                  removeClippedSubviews={true}
                  maxToRenderPerBatch={10}
                  windowSize={10}
                  initialNumToRender={10}
                />
              )
            ) : (
              // RECIPE SELECTION
              recipesLoading ? (
                <View style={styles.centered}>
                  <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
                  <Text variant="body" color="neutral" style={{ marginTop: spacing.md }}>
                    Chargement...
                  </Text>
                </View>
              ) : recipesError ? (
                <View style={styles.centered}>
                  <Text style={styles.errorIcon}>⚠️</Text>
                  <Text variant="h3">Erreur</Text>
                  <Text variant="body" color="neutral" style={{ marginTop: spacing.sm }}>
                    {recipesError instanceof Error ? recipesError.message : "Impossible de charger les recettes"}
                  </Text>
                </View>
              ) : !recipes || recipes.length === 0 ? (
                <View style={styles.centered}>
                  <Text style={styles.emptyIcon}>📖</Text>
                  <Text variant="h3">Aucune recette</Text>
                  <Text variant="body" color="neutral" style={{ marginTop: spacing.sm }}>
                    Ce livre ne contient aucune recette pour le moment
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={recipes}
                  renderItem={renderRecipe}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={styles.listContent}
                  showsVerticalScrollIndicator={true}
                  removeClippedSubviews={true}
                  maxToRenderPerBatch={10}
                  windowSize={10}
                  initialNumToRender={10}
                />
              )
            )}

            {/* Servings Adjustment (only if recipe selected) */}
            {selectedRecipe && (
              <View style={styles.servingsSection}>
                <View style={styles.selectedRecipeInfo}>
                  <Text variant="bodySmall" style={styles.selectedLabel}>
                    Recette sélectionnée :
                  </Text>
                  <Text variant="body" style={styles.selectedRecipeName} numberOfLines={1}>
                    {selectedRecipe.title}
                  </Text>
                </View>

                <View style={styles.servingsAdjuster}>
                  <Text variant="bodySmall" style={styles.servingsLabel}>
                    Nombre de portions
                  </Text>

                  <View style={styles.servingsControls}>
                    <TouchableOpacity
                      style={styles.servingsButton}
                      onPress={() => setServings(Math.max(1, servings - 1))}
                      disabled={servings <= 1}
                      accessibilityLabel="Decrease servings"
                      accessibilityRole="button"
                    >
                      <Text style={[styles.servingsButtonText, servings <= 1 && styles.servingsButtonDisabled]}>
                        −
                      </Text>
                    </TouchableOpacity>

                    <View style={styles.servingsDisplay}>
                      <Text variant="h3" style={styles.servingsValue}>
                        {servings}
                      </Text>
                      <Text variant="caption" color="neutral">
                        {servings > 1 ? "portions" : "portion"}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={styles.servingsButton}
                      onPress={() => setServings(Math.min(50, servings + 1))}
                      disabled={servings >= 50}
                      accessibilityLabel="Increase servings"
                      accessibilityRole="button"
                    >
                      <Text style={[styles.servingsButtonText, servings >= 50 && styles.servingsButtonDisabled]}>
                        +
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* FIXED FOOTER */}
          {selectedRecipe && (
            <View style={styles.footer}>
              <Button
                variant="outline"
                onPress={handleCancel}
                style={styles.footerButton}
              >
                Annuler
              </Button>

              <Button
                variant="primary"
                onPress={handleConfirm}
                disabled={!selectedRecipeId}
                style={styles.footerButton}
              >
                {initialRecipeId ? "Modifier" : "Ajouter au planning"}
              </Button>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-end",
  },

  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },

  modal: {
    backgroundColor: colors.white,
    borderTopLeftRadius: spacing.lg,
    borderTopRightRadius: spacing.lg,
    height: "88%",
    ...shadows.lg,
  },

  // FIXED HEADER
  header: {
    padding: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
    backgroundColor: colors.white,
  },

  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },

  backButton: {
    flexDirection: "row",
    alignItems: "center",
  },

  backButtonText: {
    fontSize: fontSizes.base,
    color: colors.primary.DEFAULT,
    fontWeight: fontWeights.semibold as any,
  },

  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.gray[200],
    justifyContent: "center",
    alignItems: "center",
  },

  closeButtonText: {
    fontSize: 20,
    lineHeight: 24,
    color: colors.warm.brown,
    fontWeight: fontWeights.bold as any,
  },

  subtitle: {
    marginTop: spacing.xs,
  },

  // SCROLLABLE CONTENT
  scrollableContent: {
    flex: 1,
  },

  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.lg,
  },

  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },

  emptyIcon: {
    fontSize: 64,
    lineHeight: 72,
    marginBottom: spacing.md,
  },

  errorIcon: {
    fontSize: 48,
    lineHeight: 56,
    marginBottom: spacing.md,
  },

  // Cookbook Item
  cookbookItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    backgroundColor: colors.white,
    borderRadius: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: colors.gray[200],
  },

  cookbookImage: {
    width: 70,
    height: 70,
    borderRadius: spacing.sm,
    backgroundColor: colors.gray[100],
  },

  cookbookInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },

  cookbookTitle: {
    fontWeight: fontWeights.semibold as any,
    color: colors.warm.brown,
    marginBottom: spacing.xs,
  },

  cookbookDescription: {
    marginTop: spacing.xs,
  },

  arrowIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary.DEFAULT,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: spacing.sm,
  },

  arrow: {
    fontSize: 20,
    lineHeight: 24,
    color: colors.white,
    fontWeight: fontWeights.bold as any,
  },

  // Recipe Item
  recipeItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    backgroundColor: colors.white,
    borderRadius: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: colors.gray[200],
  },

  recipeItemSelected: {
    borderColor: colors.primary.DEFAULT,
    backgroundColor: colors.cream.DEFAULT,
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
    marginLeft: spacing.md,
  },

  recipeTitle: {
    fontWeight: fontWeights.semibold as any,
    color: colors.warm.brown,
    marginBottom: spacing.xs,
  },

  recipeTime: {
    marginTop: spacing.xs,
  },

  selectionIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary.DEFAULT,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: spacing.sm,
  },

  checkmark: {
    fontSize: 16,
    lineHeight: 18,
    color: colors.white,
    fontWeight: fontWeights.bold as any,
  },

  // Servings Section (inside scrollable content)
  servingsSection: {
    padding: spacing.lg,
    margin: spacing.md,
    marginTop: 0,
    borderRadius: spacing.md,
    backgroundColor: colors.cream.DEFAULT,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },

  selectedRecipeInfo: {
    marginBottom: spacing.md,
  },

  selectedLabel: {
    color: colors.gray[600],
    marginBottom: spacing.xs,
  },

  selectedRecipeName: {
    fontWeight: fontWeights.semibold as any,
    color: colors.warm.brown,
  },

  // Servings Adjuster
  servingsAdjuster: {
    marginTop: spacing.md,
  },

  servingsLabel: {
    fontWeight: fontWeights.semibold as any,
    color: colors.warm.brown,
    marginBottom: spacing.sm,
  },

  servingsControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.lg,
  },

  servingsButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary.DEFAULT,
    justifyContent: "center",
    alignItems: "center",
    ...shadows.sm,
  },

  servingsButtonText: {
    fontSize: 28,
    lineHeight: 32,
    color: colors.white,
    fontWeight: fontWeights.bold as any,
  },

  servingsButtonDisabled: {
    color: colors.gray[400],
  },

  servingsDisplay: {
    alignItems: "center",
    minWidth: 100,
  },

  servingsValue: {
    color: colors.warm.brown,
    marginBottom: spacing.xs,
  },

  // FIXED FOOTER
  footer: {
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    backgroundColor: colors.white,
    // Shadow for elevation
    ...shadows.md,
  },

  footerButton: {
    flex: 1,
  },
});
