/**
 * useNutrition Hook
 *
 * Custom hook for calculating recipe nutrition with TanStack Query.
 * Provides mutation for calling the nutrition-calculate Edge Function.
 *
 * @module hooks/useNutrition
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { RecipeIngredient } from "@/types/database";

interface CalculateNutritionParams {
  recipeId: string;
  userId: string;
  ingredients: RecipeIngredient[];
  servings: number;
}

interface NutritionData {
  total: {
    calories: number;
    protein: number;
    carbohydrates: number;
    fat: number;
    fiber: number;
    sugar: number;
  };
  perServing: {
    calories: number;
    protein: number;
    carbohydrates: number;
    fat: number;
    fiber: number;
    sugar: number;
  };
}

/**
 * Hook to calculate nutrition for a recipe
 *
 * Calls the nutrition-calculate Edge Function which uses a 3-tier strategy:
 * 1. Cache: Check nutrition_cache table
 * 2. OpenFoodFacts: Query free nutrition database
 * 3. AI: Estimate with DeepSeek for unknown ingredients
 *
 * @returns Mutation function and status
 *
 * @example
 * ```typescript
 * const calculateNutrition = useCalculateNutrition();
 *
 * const handleCalculate = () => {
 *   calculateNutrition.mutate({
 *     recipeId: recipe.id,
 *     userId: user.id,
 *     ingredients: recipe.ingredients,
 *     servings: recipe.servings,
 *   });
 * };
 * ```
 */
export function useCalculateNutrition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CalculateNutritionParams) => {
      const { recipeId, userId, ingredients, servings } = params;

      // Debug: Check session before calling Edge Function
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log("🔐 Session check before Edge Function call:", {
        hasSession: !!session,
        hasAccessToken: !!session?.access_token,
        userId: session?.user?.id,
        sessionError: sessionError?.message,
      });

      if (!session?.access_token) {
        console.error("❌ No valid session token available");
        throw new Error("Not authenticated. Please log in again.");
      }

      // Call Edge Function with explicit Authorization header
      console.log("📞 Calling Edge Function with authorization...");
      const { data, error } = await supabase.functions.invoke(
        "nutrition-calculate",
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          body: {
            recipeId,
            userId,
            ingredients: ingredients.map((ing) => ({
              name: ing.name,
              quantity: ing.quantity,
              unit: ing.unit,
            })),
            servings,
          },
        }
      );
      console.log("✅ Edge Function response received:", { hasData: !!data, hasError: !!error });

      if (error) {
        console.error("❌ Nutrition calculation error:", {
          message: error.message,
          status: error.status,
          statusText: error.statusText,
          context: error.context,
          details: error.details,
          fullError: error,
        });
        throw new Error(error.message || "Failed to calculate nutrition");
      }

      if (data && !data.success) {
        console.error("❌ Edge Function returned error:", data);
        throw new Error(data.error || "Failed to calculate nutrition");
      }

      return data as {
        success: true;
        recipeId: string;
        nutrition: NutritionData;
        cost: number;
      };
    },
    onSuccess: (data, variables) => {
      // Invalidate recipe to trigger refetch (updates UI)
      queryClient.invalidateQueries({ queryKey: ["recipe", variables.recipeId] });

      console.log(`💰 Nutrition calculated for €${data.cost.toFixed(4)}`);
    },
  });
}
