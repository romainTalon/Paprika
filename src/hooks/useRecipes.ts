/**
 * useRecipes Hook
 *
 * Custom hook for managing recipes with TanStack Query.
 * Provides data fetching, caching, and mutations for recipe operations.
 *
 * @module hooks/useRecipes
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RecipeService, CookbookService } from "@/services";
import { supabase } from "@/lib/supabase";
import type { ServiceResponse } from "@/types/database";
import type { RecipeIngredient, RecipeStep } from "@/types/database";
import type { ImportedRecipeData, ImportStrategy } from "@/types/ai";

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

// =============================================================================
// RECIPE IMPORT HOOKS
// =============================================================================

/**
 * Hook to import a recipe from web URL via Edge Function
 *
 * This calls the Supabase Edge Function that implements the 3-tier scraping strategy.
 * The hook returns the imported recipe data WITHOUT saving it to the database.
 * Use useSaveImportedRecipe() to save the recipe after user preview/edit.
 *
 * @returns Mutation function and status
 *
 * @example
 * ```typescript
 * const importRecipe = useImportRecipe();
 *
 * const handleImport = async () => {
 *   const result = await importRecipe.mutateAsync({
 *     url: "https://example.com/recipe",
 *     userId: user.id,
 *     onProgress: (progress) => console.log(`${progress}%`)
 *   });
 *
 *   // Navigate to preview screen with result.recipe
 * };
 * ```
 */
export function useImportRecipe() {
  return useMutation({
    mutationFn: async (params: {
      url: string;
      userId: string;
      cookbookId?: string;
      onProgress?: (progress: number) => void;
    }) => {
      const { url, userId, cookbookId, onProgress } = params;

      // Call Edge Function
      const { data, error } = await supabase.functions.invoke("recipe-import", {
        body: { url, userId, cookbookId },
      });

      // Check data first (contains detailed error message from Edge Function)
      if (data && !data.success) {
        console.error("❌ Data error detected:", data.error);

        // Check if it's a limit error
        if (data.limitReached) {
          console.error("🚫 Import limit reached");
          throw new Error(data.error || "Import limit reached");
        }

        // Prefix error message with flag if it's a social media error
        const errorMessage = data.socialMediaError
          ? `SOCIAL_MEDIA_ERROR: ${data.error}`
          : data.error;
        throw new Error(errorMessage || "Import failed");
      }

      // Then check generic error
      if (error) {
        console.error("❌ Generic error detected:", error.message);
        console.error("📋 Full error object:", JSON.stringify(error, null, 2));

        // Try to extract the actual error message from the response
        // Supabase wraps Edge Function errors in a generic message
        // The real error is usually in error.context or the data object
        let detailedMessage = error.message;

        // If data exists but has an error, use that message
        if (data && data.error) {
          detailedMessage = data.error;
          if (data.limitReached) {
            console.error("🚫 Import limit reached (from error path)");
          }
        } else {
          // Otherwise try to find it in error properties
          detailedMessage = error.context?.message || error.details || error.message;
        }

        throw new Error(detailedMessage || "Failed to import recipe");
      }

      onProgress?.(100); // Done!

      return data as {
        success: true;
        recipe: ImportedRecipeData;
        strategy: ImportStrategy;
        cost: number;
        duration: number;
      };
    },
    // No cache invalidation - recipe not saved yet
  });
}

/**
 * Hook to save imported recipe to database
 *
 * After importing a recipe via useImportRecipe(), the user can preview and edit
 * the recipe data. This hook saves the final recipe to the database.
 *
 * @returns Mutation function and status
 *
 * @example
 * ```typescript
 * const saveRecipe = useSaveImportedRecipe();
 *
 * const handleSave = async () => {
 *   const recipe = await saveRecipe.mutateAsync({
 *     userId: user.id,
 *     cookbookId: selectedCookbookId,
 *     recipe: importedRecipeData,
 *   });
 *
 *   router.push(`/recipes/${recipe.id}`);
 * };
 * ```
 */
export function useSaveImportedRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      userId: string;
      cookbookId?: string;
      recipe: ImportedRecipeData;
      isPremium?: boolean; // Add isPremium flag
    }) => {
      const { userId, recipe } = params;
      let { cookbookId } = params;

      // If no cookbook selected, get or create default import cookbook
      if (!cookbookId) {
        const { data: defaultCookbook, error: cookbookError } =
          await CookbookService.getOrCreateDefaultImportCookbook(userId);

        if (cookbookError || !defaultCookbook) {
          console.error("❌ Failed to get/create default import cookbook:", cookbookError);
          throw cookbookError || new Error("Failed to create default import cookbook");
        }

        cookbookId = defaultCookbook.id;
        console.log("📥 Using default import cookbook:", defaultCookbook.name);
      }

      const { data, error } = await RecipeService.createRecipe(userId, {
        title: recipe.title,
        description: recipe.description,
        cookbookId: cookbookId,
        coverImageUrl: recipe.coverImageUrl,
        servings: recipe.servings,
        prepTime: recipe.prepTime,
        cookTime: recipe.cookTime,
        difficulty: recipe.difficulty,
        tags: recipe.tags,
        ingredients: recipe.ingredients,
        steps: recipe.steps,
        importSource: recipe.importSource,
        importUrl: recipe.importUrl,
      });

      if (error) throw error;
      if (!data) throw new Error("Failed to save recipe");

      return data as Recipe;
    },
    onSuccess: (data, variables) => {
      // Invalidate recipes cache
      queryClient.invalidateQueries({ queryKey: ["recipes", variables.userId] });

      // Invalidate cookbooks cache (in case default import cookbook was created)
      queryClient.invalidateQueries({ queryKey: ["cookbooks", variables.userId] });

      // Invalidate cookbook recipes cache (using the final cookbookId from the saved recipe)
      if (data.cookbookId) {
        queryClient.invalidateQueries({
          queryKey: ["cookbook-recipes", data.cookbookId],
        });
      }

      // AUTO-TRIGGER: Calculate nutrition in background (Premium only)
      if (variables.isPremium) {
        console.log("🎁 Auto-calculating nutrition for Premium user...");
        supabase.functions
          .invoke("nutrition-calculate", {
            body: {
              recipeId: data.id,
              userId: variables.userId,
              ingredients: data.ingredients.map((ing) => ({
                name: ing.name,
                quantity: ing.quantity,
                unit: ing.unit,
              })),
              servings: data.servings,
            },
          })
          .then((result) => {
            if (result.error) {
              console.error("❌ Background nutrition calculation failed:", result.error);
            } else {
              console.log("✅ Background nutrition calculated automatically");
              // Invalidate recipe to update UI
              queryClient.invalidateQueries({ queryKey: ["recipe", data.id] });
            }
          });
      } else {
        console.log("ℹ️ Nutrition not calculated (Premium feature)");
      }
    },
  });
}
