/**
 * Cookbook Detail Screen (Recipe List)
 *
 * Displays all recipes from a specific cookbook.
 * Allows viewing, creating, editing, and deleting recipes.
 *
 * @module app/cookbooks/[id]
 */

import React, { useCallback, useState } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Text, Button, Container } from "@/components/ui";
import { BackButton } from "@/components/navigation";
import RecipeCard from "@/components/recipe/RecipeCard";
import { colors, spacing, shadows } from "@/theme";
import {
  useCookbookRecipes,
  useToggleFavorite,
  useDeleteRecipe,
  type Recipe,
} from "@/hooks/useRecipes";
import { useCookbook } from "@/hooks/useCookbooks";
import { useAuth } from "@/hooks/useAuth";

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

  // Mutations
  const toggleFavorite = useToggleFavorite();
  const deleteRecipe = useDeleteRecipe();

  // Handlers - MUST be declared before any conditional returns
  const handleCreatePress = useCallback(() => {
    router.push(`/recipes/create?cookbookId=${id}`);
  }, [id]);

  const handleRecipePress = useCallback((recipeId: string) => {
    router.push(`/recipes/${recipeId}`);
  }, []);

  const handleEditRecipe = useCallback((recipeId: string) => {
    router.push(`/recipes/edit/${recipeId}`);
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
        onToggleFavorite={() => handleToggleFavorite(item.id)}
        onEdit={() => handleEditRecipe(item.id)}
        onDelete={() => handleDeleteRecipe(item.id)}
      />
    ),
    [handleRecipePress, handleToggleFavorite, handleEditRecipe, handleDeleteRecipe]
  );

  // Conditional returns AFTER all hooks
  // Loading state
  if (isCookbookLoading || isRecipesLoading) {
    return (
      <Container centered useSafeArea>
        <BackButton />
        <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
        <Text variant="body" color="neutral" style={{ marginTop: spacing.md }}>
          Chargement...
        </Text>
      </Container>
    );
  }

  // Error state
  if (cookbookError || recipesError) {
    return (
      <Container useSafeArea>
        <BackButton />
        <ErrorState
          error={(cookbookError || recipesError) as Error}
          onRetry={() => refetch()}
        />
      </Container>
    );
  }

  // Empty state
  if (!recipes || recipes.length === 0) {
    return (
      <Container useSafeArea>
        <BackButton />
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
    );
  }

  return (
    <Container useSafeArea>
      <BackButton />
      <FlatList
        data={recipes}
        renderItem={renderRecipe}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.header}>
            <View>
              <Text variant="h1">{cookbook?.name || "Livre de Recettes"}</Text>
              <Text variant="bodySmall" color="neutral">
                {recipes.length} recette{recipes.length > 1 ? "s" : ""}
              </Text>
            </View>
          </View>
        }
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
    </Container>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.lg,
  },

  listContent: {
    paddingBottom: 80, // Space for FAB
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
  },
});
