/**
 * Cookbook Detail Screen (Recipe List)
 *
 * Displays all recipes from a specific cookbook.
 * Allows viewing, creating, editing, and deleting recipes.
 *
 * @module app/cookbooks/[id]
 */

import React, { useCallback, useState, useMemo } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  ActionSheetIOS,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Text, Button, Container } from "@/components/ui";
import { AppHeader } from "@/components/navigation";
import RecipeCard from "@/components/recipe/RecipeCard";
import { TagFilterSheet } from "@/components/recipe/TagFilterSheet";
import { tagsMatch } from "@/constants/recipeTags";
import { colors, spacing, shadows } from "@/theme";
import {
  useCookbookRecipes,
  useToggleFavorite,
  useDeleteRecipe,
  type Recipe,
} from "@/hooks/useRecipes";
import { useCookbook, useDeleteCookbook } from "@/hooks/useCookbooks";
import { useAuth } from "@/hooks/useAuth";
import CreateCookbookModal from "@/components/modals/CreateCookbookModal";

/**
 * Empty State Component
 */
interface EmptyStateProps {
  onCreatePress: () => void;
}

function EmptyState({ onCreatePress }: EmptyStateProps) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>📖</Text>
      <Text variant="h2" style={styles.emptyTitle}>
        Aucune recette
      </Text>
      <Text variant="body" color="neutral" style={styles.emptyDescription}>
        Ce livre ne contient pas encore de recettes.
        {"\n"}
        Commencez par en créer une !
      </Text>
      <Button variant="primary" size="lg" onPress={onCreatePress} style={styles.emptyButton}>
        Créer ma première recette
      </Button>
    </View>
  );
}

/**
 * Error State Component
 */
interface ErrorStateProps {
  error: Error;
  onRetry: () => void;
}

function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <View style={styles.errorState}>
      <Text style={styles.errorIcon}>⚠️</Text>
      <Text variant="h2" style={styles.errorTitle}>
        Erreur de chargement
      </Text>
      <Text variant="body" color="neutral" style={styles.errorDescription}>
        {error.message || "Impossible de charger les recettes"}
      </Text>
      <Button variant="outline" onPress={onRetry} style={styles.errorButton}>
        Réessayer
      </Button>
    </View>
  );
}

export default function CookbookDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const userId = user?.id;

  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [filterSheetVisible, setFilterSheetVisible] = useState(false);

  // Fetch cookbook details
  const {
    data: cookbook,
    isLoading: isCookbookLoading,
    error: cookbookError,
  } = useCookbook(id);

  // Fetch recipes
  const {
    data: recipes,
    isLoading: isRecipesLoading,
    error: recipesError,
    refetch,
  } = useCookbookRecipes(id, userId);

  // Filter recipes by tags (AND logic, case-insensitive with normalization)
  const filteredRecipes = useMemo(() => {
    if (!recipes || filterTags.length === 0) return recipes;
    return recipes.filter((recipe) => {
      if (!recipe.tags || recipe.tags.length === 0) return false;

      // Check if recipe has ALL selected tags (using tagsMatch for smart comparison)
      return filterTags.every((filterTag) =>
        recipe.tags!.some((recipeTag) => tagsMatch(recipeTag, filterTag))
      );
    });
  }, [recipes, filterTags]);

  // Mutations
  const toggleFavorite = useToggleFavorite();
  const deleteRecipe = useDeleteRecipe();
  const deleteCookbook = useDeleteCookbook();

  // Handlers - MUST be declared before any conditional returns
  const handleCreatePress = useCallback(() => {
    router.push(`/recipes/create?cookbookId=${id}`);
  }, [id]);

  const handleCookbookMenu = useCallback(() => {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Annuler", "Modifier", "Supprimer"],
          destructiveButtonIndex: 2,
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            // Modifier
            setIsEditModalVisible(true);
          } else if (buttonIndex === 2) {
            // Supprimer
            handleDeleteCookbook();
          }
        }
      );
    } else {
      // Android - Use Alert with buttons
      Alert.alert(
        "Actions",
        "Que souhaitez-vous faire ?",
        [
          { text: "Annuler", style: "cancel" },
          {
            text: "Modifier",
            onPress: () => setIsEditModalVisible(true),
          },
          {
            text: "Supprimer",
            onPress: handleDeleteCookbook,
            style: "destructive",
          },
        ]
      );
    }
  }, []);

  const handleDeleteCookbook = useCallback(() => {
    Alert.alert(
      "Supprimer le livre ?",
      `Êtes-vous sûr de vouloir supprimer "${cookbook?.name}" ? Toutes les recettes seront conservées mais ne seront plus dans ce livre.`,
      [
        {
          text: "Annuler",
          style: "cancel",
        },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            if (!userId) return;

            try {
              await deleteCookbook.mutateAsync({
                cookbookId: id,
                userId,
              });
              Alert.alert("Succès", "Livre supprimé avec succès !");
              router.back();
            } catch (error) {
              Alert.alert(
                "Erreur",
                error instanceof Error
                  ? error.message
                  : "Impossible de supprimer le livre"
              );
            }
          },
        },
      ]
    );
  }, [userId, id, cookbook?.name, deleteCookbook]);

  const handleRecipePress = useCallback((recipeId: string) => {
    router.push(`/recipes/${recipeId}`);
  }, []);

  const handleEditRecipe = useCallback((recipeId: string) => {
    router.push(`/recipes/${recipeId}/edit`);
  }, []);

  const handleToggleFavorite = useCallback(
    async (recipeId: string) => {
      if (!userId) return;

      try {
        await toggleFavorite.mutateAsync({ recipeId, userId });
      } catch (error) {
        Alert.alert(
          "Erreur",
          error instanceof Error ? error.message : "Impossible de modifier le favori"
        );
      }
    },
    [userId, toggleFavorite]
  );

  const handleDeleteRecipe = useCallback(
    async (recipeId: string) => {
      if (!userId) return;

      try {
        await deleteRecipe.mutateAsync({ recipeId, userId, cookbookId: id });
        Alert.alert("Succès", "Recette supprimée avec succès !");
      } catch (error) {
        Alert.alert(
          "Erreur",
          error instanceof Error ? error.message : "Impossible de supprimer la recette"
        );
      }
    },
    [userId, id, deleteRecipe]
  );

  // Render recipe card
  const renderRecipe = useCallback(
    ({ item }: { item: Recipe }) => (
      <RecipeCard
        recipe={item}
        onPress={() => handleRecipePress(item.id)}
      />
    ),
    [handleRecipePress]
  );

  // Conditional returns AFTER all hooks
  // Loading state
  if (isCookbookLoading || isRecipesLoading) {
    return (
      <>
        <AppHeader showBackButton />
        <Container centered useSafeArea safeAreaEdges={["bottom"]}>
          <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
          <Text variant="body" color="neutral" style={{ marginTop: spacing.md }}>
            Chargement...
          </Text>
        </Container>
      </>
    );
  }

  // Error state
  if (cookbookError || recipesError) {
    return (
      <>
        <AppHeader showBackButton />
        <Container useSafeArea safeAreaEdges={["bottom"]}>
          <ErrorState
            error={(cookbookError || recipesError) as Error}
            onRetry={() => refetch()}
          />
        </Container>
      </>
    );
  }

  // Empty state
  if (!recipes || recipes.length === 0) {
    return (
      <>
        <AppHeader showBackButton />
        <Container useSafeArea safeAreaEdges={["bottom"]}>
          <View style={styles.header}>
            <View>
              <Text variant="h1">{cookbook?.name || "Livre de Recettes"}</Text>
              <Text variant="bodySmall" color="neutral">
                0 recette
              </Text>
            </View>
          </View>

          <EmptyState onCreatePress={handleCreatePress} />
        </Container>
      </>
    );
  }

  return (
    <>
      <AppHeader showBackButton />
      <Container useSafeArea safeAreaEdges={["bottom"]}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text variant="h1">{cookbook?.name || "Livre de Recettes"}</Text>
            <Text variant="bodySmall" color="neutral">
              {filteredRecipes?.length || 0} recette{(filteredRecipes?.length || 0) > 1 ? "s" : ""}
              {filterTags.length > 0 && ` (${recipes?.length || 0} total)`}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setFilterSheetVisible(true)}
            style={styles.filterButton}
            accessibilityLabel="Filtrer par tags"
            accessibilityRole="button"
          >
            <Text style={styles.filterIcon}>🏷️</Text>
            {filterTags.length > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{filterTags.length}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleCookbookMenu}
            style={styles.menuButton}
            accessibilityLabel="Options du livre"
            accessibilityRole="button"
          >
            <Text style={styles.menuIcon}>⋮</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={filteredRecipes}
          renderItem={renderRecipe}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={10}
          initialNumToRender={10}
        />

        {/* Floating Action Button */}
        <TouchableOpacity
          style={styles.fab}
          onPress={handleCreatePress}
          activeOpacity={0.8}
          accessibilityLabel="Create new recipe"
          accessibilityRole="button"
        >
          <Text style={styles.fabIcon}>+</Text>
        </TouchableOpacity>

        {/* Edit Cookbook Modal */}
        {cookbook && (
          <CreateCookbookModal
            visible={isEditModalVisible}
            cookbook={cookbook}
            userId={userId ?? null}
            onClose={() => setIsEditModalVisible(false)}
          />
        )}

        {/* Tag Filter Modal */}
        <TagFilterSheet
          visible={filterSheetVisible}
          selectedTags={filterTags}
          onFilterChange={setFilterTags}
          onClose={() => setFilterSheetVisible(false)}
        />
      </Container>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.lg,
  },

  headerLeft: {
    flex: 1,
  },

  filterButton: {
    padding: spacing.xs,
    marginLeft: spacing.sm,
    position: "relative",
  },

  filterIcon: {
    fontSize: 28,
    lineHeight: 32,
  },

  filterBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: colors.primary.DEFAULT,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xs / 2,
  },

  filterBadgeText: {
    fontSize: 12,
    color: colors.white,
    fontWeight: "bold",
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

  listContent: {
    paddingBottom: 80, // Space for FAB
  },

  row: {
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },

  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
  },

  emptyIcon: {
    fontSize: 80,
    marginBottom: spacing.lg,
    lineHeight: 88, // Line height plus grande pour éviter le clip vertical
  },

  emptyTitle: {
    marginBottom: spacing.sm,
    textAlign: "center",
  },

  emptyDescription: {
    marginBottom: spacing.xl,
    textAlign: "center",
    lineHeight: 24,
  },

  emptyButton: {
    minWidth: 200,
  },

  // Error State
  errorState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
  },

  errorIcon: {
    fontSize: 64,
    marginBottom: spacing.lg,
    lineHeight: 72, // Line height plus grande pour éviter le clip vertical
  },

  errorTitle: {
    marginBottom: spacing.sm,
    textAlign: "center",
    color: colors.error,
  },

  errorDescription: {
    marginBottom: spacing.xl,
    textAlign: "center",
    lineHeight: 24,
  },

  errorButton: {
    minWidth: 200,
  },

  // Floating Action Button
  fab: {
    position: "absolute",
    bottom: spacing["2xl"],
    right: spacing.lg,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary.DEFAULT,
    justifyContent: "center",
    alignItems: "center",
    ...shadows.lg,
    elevation: 8,
  },

  fabIcon: {
    fontSize: 32,
    color: colors.white,
    fontWeight: "bold",
    lineHeight: 36, // Centrage vertical du symbole "+"
  },
});
