/**
 * useMealPlans Hook
 *
 * Custom hook for managing meal plans with TanStack Query.
 * Provides data fetching, caching, and mutations for meal planning operations.
 *
 * @module hooks/useMealPlans
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MealPlanService } from "@/services";
import type { MealPlan, MealSlot, MealType, WeekDay } from "@/types";

/**
 * Hook to fetch meal plan for a specific week
 *
 * Automatically creates an empty meal plan if none exists for the week.
 *
 * @param userId - User ID
 * @param weekStart - Monday date in YYYY-MM-DD format
 * @returns Query result with meal plan data
 *
 * @example
 * ```typescript
 * const weekStart = MealPlanService.getMondayOfWeek();
 * const { data: mealPlan, isLoading, error } = useMealPlan(userId, weekStart);
 *
 * if (isLoading) return <Loading />;
 * if (error) return <Error message={error.message} />;
 *
 * const mondayBreakfast = mealPlan.meals["monday-breakfast"];
 * ```
 */
export function useMealPlan(userId: string | undefined, weekStart: string | undefined) {
  return useQuery({
    queryKey: ["meal-plan", userId, weekStart],
    queryFn: async () => {
      if (!userId) throw new Error("User ID is required");
      if (!weekStart) throw new Error("Week start date is required");

      const { data, error } = await MealPlanService.getWeekMealPlan(userId, weekStart);

      if (error) throw error;
      if (!data) throw new Error("No data returned");

      return data as MealPlan;
    },
    enabled: !!userId && !!weekStart,
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
    gcTime: 1000 * 60 * 30, // Keep in cache for 30 minutes
  });
}

/**
 * Hook to fetch user's meal plan history
 *
 * @param userId - User ID
 * @param limit - Maximum number of meal plans to fetch (default: 10)
 * @returns Query result with meal plans array
 *
 * @example
 * ```typescript
 * const { data: mealPlans } = useMealPlanHistory(userId, 5);
 * ```
 */
export function useMealPlanHistory(userId: string | undefined, limit = 10) {
  return useQuery({
    queryKey: ["meal-plan-history", userId, limit],
    queryFn: async () => {
      if (!userId) throw new Error("User ID is required");

      const { data, error } = await MealPlanService.getUserMealPlans(userId, limit);

      if (error) throw error;
      if (!data) throw new Error("No data returned");

      return data as MealPlan[];
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 10, // Consider data fresh for 10 minutes
  });
}

/**
 * Hook to update a specific meal slot
 *
 * @returns Mutation function and status
 *
 * @example
 * ```typescript
 * const updateSlot = useUpdateMealSlot();
 *
 * const handleAddMeal = async () => {
 *   try {
 *     await updateSlot.mutateAsync({
 *       mealPlanId: "uuid-123",
 *       userId: "user-456",
 *       day: "monday",
 *       meal: "breakfast",
 *       mealSlot: {
 *         recipeId: "recipe-789",
 *         servings: 4,
 *         notes: "Extra spicy",
 *         isCooked: false
 *       }
 *     });
 *   } catch (error) {
 *     console.error("Failed:", error);
 *   }
 * };
 * ```
 */
export function useUpdateMealSlot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      mealPlanId: string;
      userId: string;
      weekStart: string;
      day: WeekDay;
      meal: MealType;
      mealSlot: MealSlot;
    }) => {
      const { data, error } = await MealPlanService.updateMealSlot(
        params.mealPlanId,
        params.userId,
        params.day,
        params.meal,
        params.mealSlot
      );

      if (error) throw error;
      if (!data) throw new Error("Failed to update meal slot");

      return data as MealPlan;
    },
    onSuccess: (data, variables) => {
      // Invalidate meal plan cache to trigger refetch
      queryClient.invalidateQueries({
        queryKey: ["meal-plan", variables.userId, variables.weekStart],
      });
    },
  });
}

/**
 * Hook to clear a specific meal slot
 *
 * @returns Mutation function and status
 *
 * @example
 * ```typescript
 * const clearSlot = useClearMealSlot();
 *
 * const handleRemove = async () => {
 *   try {
 *     await clearSlot.mutateAsync({
 *       mealPlanId: "uuid-123",
 *       userId: "user-456",
 *       day: "monday",
 *       meal: "breakfast"
 *     });
 *   } catch (error) {
 *     console.error("Failed:", error);
 *   }
 * };
 * ```
 */
export function useClearMealSlot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      mealPlanId: string;
      userId: string;
      weekStart: string;
      day: WeekDay;
      meal: MealType;
    }) => {
      const { data, error } = await MealPlanService.clearMealSlot(
        params.mealPlanId,
        params.userId,
        params.day,
        params.meal
      );

      if (error) throw error;
      if (!data) throw new Error("Failed to clear meal slot");

      return data as MealPlan;
    },
    onSuccess: (data, variables) => {
      // Invalidate meal plan cache
      queryClient.invalidateQueries({
        queryKey: ["meal-plan", variables.userId, variables.weekStart],
      });
    },
  });
}

/**
 * Hook to mark a meal as cooked/uncooked
 *
 * @returns Mutation function and status
 *
 * @example
 * ```typescript
 * const markCooked = useMarkMealCooked();
 *
 * const handleToggle = async (isCooked: boolean) => {
 *   try {
 *     await markCooked.mutateAsync({
 *       mealPlanId: "uuid-123",
 *       userId: "user-456",
 *       day: "monday",
 *       meal: "breakfast",
 *       isCooked
 *     });
 *   } catch (error) {
 *     console.error("Failed:", error);
 *   }
 * };
 * ```
 */
export function useMarkMealCooked() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      mealPlanId: string;
      userId: string;
      weekStart: string;
      day: WeekDay;
      meal: MealType;
      isCooked: boolean;
    }) => {
      const { data, error } = await MealPlanService.markMealCooked(
        params.mealPlanId,
        params.userId,
        params.day,
        params.meal,
        params.isCooked
      );

      if (error) throw error;
      if (!data) throw new Error("Failed to mark meal as cooked");

      return data as MealPlan;
    },
    onSuccess: (data, variables) => {
      // Invalidate meal plan cache
      queryClient.invalidateQueries({
        queryKey: ["meal-plan", variables.userId, variables.weekStart],
      });
    },
  });
}

/**
 * Hook to add a recipe to a meal slot (supports multiple recipes)
 *
 * @returns Mutation function and status
 *
 * @example
 * ```typescript
 * const addRecipe = useAddRecipeToSlot();
 *
 * const handleAdd = async () => {
 *   try {
 *     await addRecipe.mutateAsync({
 *       mealPlanId: "uuid-123",
 *       userId: "user-456",
 *       weekStart: "2025-01-06",
 *       day: "monday",
 *       meal: "breakfast",
 *       newRecipe: {
 *         recipeId: "recipe-789",
 *         servings: 2,
 *         isCooked: false
 *       }
 *     });
 *   } catch (error) {
 *     console.error("Failed:", error);
 *   }
 * };
 * ```
 */
export function useAddRecipeToSlot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      mealPlanId: string;
      userId: string;
      weekStart: string;
      day: WeekDay;
      meal: MealType;
      newRecipe: MealSlot;
    }) => {
      const { data, error } = await MealPlanService.addRecipeToSlot(
        params.mealPlanId,
        params.userId,
        params.day,
        params.meal,
        params.newRecipe
      );

      if (error) throw error;
      if (!data) throw new Error("Failed to add recipe to slot");

      return data as MealPlan;
    },
    onSuccess: (data, variables) => {
      // Invalidate meal plan cache
      queryClient.invalidateQueries({
        queryKey: ["meal-plan", variables.userId, variables.weekStart],
      });
    },
  });
}

/**
 * Hook to remove a specific recipe from a meal slot
 *
 * @returns Mutation function and status
 *
 * @example
 * ```typescript
 * const removeRecipe = useRemoveRecipeFromSlot();
 *
 * const handleRemove = async () => {
 *   try {
 *     await removeRecipe.mutateAsync({
 *       mealPlanId: "uuid-123",
 *       userId: "user-456",
 *       weekStart: "2025-01-06",
 *       day: "monday",
 *       meal: "breakfast",
 *       recipeId: "recipe-789"
 *     });
 *   } catch (error) {
 *     console.error("Failed:", error);
 *   }
 * };
 * ```
 */
export function useRemoveRecipeFromSlot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      mealPlanId: string;
      userId: string;
      weekStart: string;
      day: WeekDay;
      meal: MealType;
      recipeIndex: number;
    }) => {
      const { data, error } = await MealPlanService.removeRecipeFromSlot(
        params.mealPlanId,
        params.userId,
        params.day,
        params.meal,
        params.recipeIndex
      );

      if (error) throw error;
      if (!data) throw new Error("Failed to remove recipe from slot");

      return data as MealPlan;
    },
    onSuccess: (data, variables) => {
      // Invalidate meal plan cache
      queryClient.invalidateQueries({
        queryKey: ["meal-plan", variables.userId, variables.weekStart],
      });
    },
  });
}

/**
 * Hook to update a specific recipe in a meal slot (servings or isCooked)
 *
 * @returns Mutation function and status
 *
 * @example
 * ```typescript
 * const updateRecipe = useUpdateRecipeInSlot();
 *
 * const handleToggleCooked = async () => {
 *   try {
 *     await updateRecipe.mutateAsync({
 *       mealPlanId: "uuid-123",
 *       userId: "user-456",
 *       weekStart: "2025-01-06",
 *       day: "monday",
 *       meal: "breakfast",
 *       recipeId: "recipe-789",
 *       updates: { isCooked: true }
 *     });
 *   } catch (error) {
 *     console.error("Failed:", error);
 *   }
 * };
 * ```
 */
export function useUpdateRecipeInSlot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      mealPlanId: string;
      userId: string;
      weekStart: string;
      day: WeekDay;
      meal: MealType;
      recipeIndex: number;
      updates: Partial<Pick<MealSlot, "servings" | "isCooked" | "notes">>;
    }) => {
      const { data, error } = await MealPlanService.updateRecipeInSlot(
        params.mealPlanId,
        params.userId,
        params.day,
        params.meal,
        params.recipeIndex,
        params.updates
      );

      if (error) throw error;
      if (!data) throw new Error("Failed to update recipe in slot");

      return data as MealPlan;
    },
    onSuccess: (data, variables) => {
      // Invalidate meal plan cache
      queryClient.invalidateQueries({
        queryKey: ["meal-plan", variables.userId, variables.weekStart],
      });
    },
  });
}

/**
 * Hook to clear entire week meal plan
 *
 * @returns Mutation function and status
 *
 * @example
 * ```typescript
 * const clearWeek = useClearWeekMealPlan();
 *
 * const handleClearAll = async () => {
 *   try {
 *     await clearWeek.mutateAsync({
 *       mealPlanId: "uuid-123",
 *       userId: "user-456"
 *     });
 *   } catch (error) {
 *     console.error("Failed:", error);
 *   }
 * };
 * ```
 */
export function useClearWeekMealPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      mealPlanId: string;
      userId: string;
      weekStart: string;
    }) => {
      const { data, error } = await MealPlanService.clearWeekMealPlan(
        params.mealPlanId,
        params.userId
      );

      if (error) throw error;
      if (!data) throw new Error("Failed to clear week meal plan");

      return data as MealPlan;
    },
    onSuccess: (data, variables) => {
      // Invalidate meal plan cache
      queryClient.invalidateQueries({
        queryKey: ["meal-plan", variables.userId, variables.weekStart],
      });
    },
  });
}
