/**
 * useRecipes Hook
 *
 * Custom hook for managing recipes with TanStack Query.
 * Provides data fetching, caching, and mutations for recipe operations.
 *
 * @module hooks/useRecipes
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RecipeService } from "@/services";
import type { ServiceResponse } from "@/types/database";
import type { RecipeIngredient, RecipeStep } from "@/types/database";

/**
 * Recipe data structure
 * Note: Matches the database schema exactly
 */
export interface Recipe {
  id: string;
  userId: string;
  cookbookId: string | null;
  title: string;
  description: string | null;
  coverImageUrl: string | null;
  servings: number;
  prepTime: number | null;
  cookTime: number | null;
  difficulty: "easy" | "medium" | "hard" | null;
  tags: string[] | null;
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  nutrition: any | null;
  isFavorite: boolean;
  isArchived: boolean;
  viewsCount: number;
  importSource: string | null;
  importUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Hook to fetch all recipes for a specific cookbook
 *
 * @param cookbookId - Cookbook ID
 * @param userId - User ID
 * @returns Query result with recipes data
 *
 * @example
 * ```typescript
 * const { data: recipes, isLoading, error } = useCookbookRecipes(cookbookId, userId);
 *
 * if (isLoading) return <Loading />;
 * if (error) return <Error message={error.message} />;
 *
 * return recipes.map(recipe => <RecipeCard key={recipe.id} {...recipe} />);
 * ```
 */
export function useCookbookRecipes(
  cookbookId: string | undefined,
  userId: string | undefined
) {
  return useQuery({
    queryKey: ["cookbook-recipes", cookbookId, userId],
    queryFn: async () => {
      if (!cookbookId || !userId) throw new Error("Cookbook ID and User ID are required");

      const { data, error } = await RecipeService.getCookbookRecipes(cookbookId, userId);

      if (error) throw error;
      if (!data) throw new Error("No data returned");

      return data as Recipe[];
    },
    enabled: !!cookbookId && !!userId,
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
    gcTime: 1000 * 60 * 30, // Keep in cache for 30 minutes
  });
}

/**
 * Hook to fetch all recipes for current user
 *
 * @param userId - User ID
 * @returns Query result with all user recipes
 */
export function useRecipes(userId: string | undefined) {
  return useQuery({
    queryKey: ["recipes", userId],
    queryFn: async () => {
      if (!userId) throw new Error("User ID is required");

      const { data, error } = await RecipeService.getUserRecipes(userId);

      if (error) throw error;
      if (!data) throw new Error("No data returned");

      return data as Recipe[];
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
}

/**
 * Hook to fetch a single recipe by ID
 *
 * @param recipeId - Recipe ID
 * @param userId - User ID
 * @returns Query result with recipe data
 */
export function useRecipe(recipeId: string | undefined, userId: string | undefined) {
  return useQuery({
    queryKey: ["recipe", recipeId],
    queryFn: async () => {
      if (!recipeId || !userId) throw new Error("Recipe ID and User ID are required");

      const { data, error } = await RecipeService.getRecipe(recipeId, userId);

      if (error) throw error;
      if (!data) throw new Error("Recipe not found");

      return data as Recipe;
    },
    enabled: !!recipeId && !!userId,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook to fetch favorite recipes
 *
 * @param userId - User ID
 * @returns Query result with favorite recipes
 */
export function useFavoriteRecipes(userId: string | undefined) {
  return useQuery({
    queryKey: ["recipes", "favorites", userId],
    queryFn: async () => {
      if (!userId) throw new Error("User ID is required");

      const { data, error } = await RecipeService.getFavoriteRecipes(userId);

      if (error) throw error;
      if (!data) throw new Error("No data returned");

      return data as Recipe[];
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 2, // Refresh favorites more often
  });
}

/**
 * Hook to create a new recipe
 *
 * @returns Mutation function and status
 *
 * @example
 * ```typescript
 * const createRecipe = useCreateRecipe();
 *
 * const handleCreate = async () => {
 *   try {
 *     const recipe = await createRecipe.mutateAsync({
 *       userId,
 *       title: "Pasta Carbonara",
 *       ingredients: [...],
 *       steps: [...]
 *     });
 *     console.log("Created:", recipe.id);
 *   } catch (error) {
 *     console.error("Failed:", error);
 *   }
 * };
 * ```
 */
export function useCreateRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      userId: string;
      title: string;
      description?: string;
      cookbookId?: string;
      coverImageUrl?: string;
      servings: number;
      prepTime?: number;
      cookTime?: number;
      difficulty?: "easy" | "medium" | "hard";
      tags?: string[];
      ingredients: RecipeIngredient[];
      steps: RecipeStep[];
    }) => {
      const { data, error } = await RecipeService.createRecipe(params.userId, {
        title: params.title,
        description: params.description,
        cookbookId: params.cookbookId,
        coverImageUrl: params.coverImageUrl,
        servings: params.servings,
        prepTime: params.prepTime,
        cookTime: params.cookTime,
        difficulty: params.difficulty,
        tags: params.tags,
        ingredients: params.ingredients,
        steps: params.steps,
        importSource: "manual", // Manual creation
      });

      if (error) throw error;
      if (!data) throw new Error("Failed to create recipe");

      return data as Recipe;
    },
    onSuccess: (data, variables) => {
      // Invalidate recipes list to trigger refetch
      queryClient.invalidateQueries({ queryKey: ["recipes", variables.userId] });
      // Invalidate cookbook recipes if assigned to cookbook
      if (variables.cookbookId) {
        queryClient.invalidateQueries({
          queryKey: ["cookbook-recipes", variables.cookbookId],
        });
      }
    },
  });
}

/**
 * Hook to update an existing recipe
 *
 * @returns Mutation function and status
 */
export function useUpdateRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      recipeId: string;
      userId: string;
      cookbookId?: string; // Track old cookbook for cache invalidation
      updates: {
        title?: string;
        description?: string;
        cookbookId?: string;
        coverImageUrl?: string;
        servings?: number;
        prepTime?: number;
        cookTime?: number;
        difficulty?: "easy" | "medium" | "hard";
        tags?: string[];
        ingredients?: RecipeIngredient[];
        steps?: RecipeStep[];
        isFavorite?: boolean;
        isArchived?: boolean;
      };
    }) => {
      const { data, error } = await RecipeService.updateRecipe(
        params.recipeId,
        params.userId,
        params.updates
      );

      if (error) throw error;
      if (!data) throw new Error("Failed to update recipe");

      return data as Recipe;
    },
    onSuccess: (data, variables) => {
      // Invalidate the recipe itself
      queryClient.invalidateQueries({ queryKey: ["recipe", variables.recipeId] });
      // Invalidate user's recipes list
      queryClient.invalidateQueries({ queryKey: ["recipes", variables.userId] });
      // Invalidate old cookbook's recipes if cookbook changed
      if (variables.cookbookId) {
        queryClient.invalidateQueries({
          queryKey: ["cookbook-recipes", variables.cookbookId],
        });
      }
      // Invalidate new cookbook's recipes if cookbook changed
      if (variables.updates.cookbookId) {
        queryClient.invalidateQueries({
          queryKey: ["cookbook-recipes", variables.updates.cookbookId],
        });
      }
    },
  });
}

/**
 * Hook to delete a recipe
 *
 * @returns Mutation function and status
 */
export function useDeleteRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      recipeId: string;
      userId: string;
      cookbookId?: string;
    }) => {
      const { error } = await RecipeService.deleteRecipe(params.recipeId, params.userId);

      if (error) throw error;

      return params.recipeId;
    },
    onSuccess: (recipeId, variables) => {
      // Invalidate recipes lists
      queryClient.invalidateQueries({ queryKey: ["recipes", variables.userId] });
      if (variables.cookbookId) {
        queryClient.invalidateQueries({
          queryKey: ["cookbook-recipes", variables.cookbookId],
        });
      }
      // Remove recipe from cache
      queryClient.removeQueries({ queryKey: ["recipe", recipeId] });
    },
  });
}

/**
 * Hook to toggle favorite status
 *
 * @returns Mutation function and status
 */
export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { recipeId: string; userId: string }) => {
      const { data, error } = await RecipeService.toggleFavorite(
        params.recipeId,
        params.userId
      );

      if (error) throw error;
      if (!data) throw new Error("Failed to toggle favorite");

      return data as Recipe;
    },
    onSuccess: (data, variables) => {
      // Update the recipe in cache optimistically
      queryClient.setQueryData(["recipe", variables.recipeId], data);
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: ["recipes", variables.userId] });
      queryClient.invalidateQueries({ queryKey: ["recipes", "favorites", variables.userId] });
      if (data.cookbookId) {
        queryClient.invalidateQueries({
          queryKey: ["cookbook-recipes", data.cookbookId],
        });
      }
    },
  });
}
