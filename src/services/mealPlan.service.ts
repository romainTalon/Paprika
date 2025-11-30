/**
 * Meal Plan Service
 * Manage weekly meal plans with JSONB meals structure
 */

import { supabase } from "@/lib/supabase";
import type { MealPlan, NewMealPlan, ServiceResponse, WeekMeals, MealSlot, MealType, WeekDay, getMealSlotKey } from "@/types";
import { MAX_RECIPES_PER_SLOT } from "@/types";

export class MealPlanService {
  /**
   * Get meal plan for a specific week
   * @param userId User ID
   * @param weekStart Monday date (YYYY-MM-DD format)
   */
  static async getWeekMealPlan(userId: string, weekStart: string): Promise<ServiceResponse<MealPlan>> {
    try {
      const { data, error } = await supabase
        .from("meal_plans")
        .select("*")
        .eq("user_id", userId)
        .eq("week_start", weekStart)
        .single();

      if (error) {
        // If no meal plan exists, create an empty one
        if (error.code === "PGRST116") {
          return this.createWeekMealPlan(userId, weekStart);
        }
        throw error;
      }

      return { data: data as MealPlan, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  /**
   * Create a new meal plan for a week
   */
  static async createWeekMealPlan(userId: string, weekStart: string): Promise<ServiceResponse<MealPlan>> {
    try {
      const { data, error } = await supabase
        .from("meal_plans")
        .insert({
          user_id: userId,
          week_start: weekStart,
          meals: {},
        })
        .select()
        .single();

      if (error) throw error;

      return { data: data as MealPlan, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  /**
   * Get all meal plans for a user (useful for history)
   */
  static async getUserMealPlans(userId: string, limit = 10): Promise<ServiceResponse<MealPlan[]>> {
    try {
      const { data, error } = await supabase
        .from("meal_plans")
        .select("*")
        .eq("user_id", userId)
        .order("week_start", { ascending: false })
        .limit(limit);

      if (error) throw error;

      return { data: data as MealPlan[], error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  /**
   * Update a specific meal slot (replaces entire slot with single recipe)
   * @deprecated Use addRecipeToSlot for multi-recipe support
   * @param mealPlanId Meal plan ID
   * @param day Day of the week
   * @param meal Meal type (breakfast, lunch, dinner, snack)
   * @param mealSlot Meal slot data
   */
  static async updateMealSlot(
    mealPlanId: string,
    userId: string,
    day: WeekDay,
    meal: MealType,
    mealSlot: MealSlot
  ): Promise<ServiceResponse<MealPlan>> {
    try {
      // Get current meal plan
      const { data: currentPlan, error: fetchError } = await supabase
        .from("meal_plans")
        .select("meals")
        .eq("id", mealPlanId)
        .eq("user_id", userId)
        .single();

      if (fetchError) throw fetchError;

      // Update meals JSONB (replace entire slot with single recipe in array)
      const meals = (currentPlan.meals as WeekMeals) || {};
      const slotKey = `${day}-${meal}`;
      meals[slotKey] = [mealSlot]; // Now stores as array

      // Save updated meal plan
      const { data, error } = await supabase
        .from("meal_plans")
        .update({ meals })
        .eq("id", mealPlanId)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) throw error;

      return { data: data as MealPlan, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  /**
   * Remove a meal slot
   */
  static async clearMealSlot(
    mealPlanId: string,
    userId: string,
    day: WeekDay,
    meal: MealType
  ): Promise<ServiceResponse<MealPlan>> {
    try {
      // Get current meal plan
      const { data: currentPlan, error: fetchError } = await supabase
        .from("meal_plans")
        .select("meals")
        .eq("id", mealPlanId)
        .eq("user_id", userId)
        .single();

      if (fetchError) throw fetchError;

      // Remove meal slot from JSONB
      const meals = (currentPlan.meals as WeekMeals) || {};
      const slotKey = `${day}-${meal}`;
      delete meals[slotKey];

      // Save updated meal plan
      const { data, error } = await supabase
        .from("meal_plans")
        .update({ meals })
        .eq("id", mealPlanId)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) throw error;

      return { data: data as MealPlan, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  /**
   * Mark a meal as cooked
   * @deprecated Use updateRecipeInSlot to mark individual recipes as cooked
   */
  static async markMealCooked(
    mealPlanId: string,
    userId: string,
    day: WeekDay,
    meal: MealType,
    isCooked: boolean
  ): Promise<ServiceResponse<MealPlan>> {
    try {
      // Get current meal plan
      const { data: currentPlan, error: fetchError } = await supabase
        .from("meal_plans")
        .select("meals")
        .eq("id", mealPlanId)
        .eq("user_id", userId)
        .single();

      if (fetchError) throw fetchError;

      // Update cooked status for ALL recipes in slot
      const meals = (currentPlan.meals as WeekMeals) || {};
      const slotKey = `${day}-${meal}`;

      if (meals[slotKey]) {
        meals[slotKey] = meals[slotKey]!.map((slot) => ({ ...slot, isCooked }));
      }

      // Save updated meal plan
      const { data, error } = await supabase
        .from("meal_plans")
        .update({ meals })
        .eq("id", mealPlanId)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) throw error;

      return { data: data as MealPlan, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  /**
   * Update meal plan notes
   */
  static async updateNotes(mealPlanId: string, userId: string, notes: string): Promise<ServiceResponse<MealPlan>> {
    try {
      const { data, error } = await supabase
        .from("meal_plans")
        .update({ notes })
        .eq("id", mealPlanId)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) throw error;

      return { data: data as MealPlan, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  /**
   * Clear entire week meal plan
   */
  static async clearWeekMealPlan(mealPlanId: string, userId: string): Promise<ServiceResponse<MealPlan>> {
    try {
      const { data, error } = await supabase
        .from("meal_plans")
        .update({ meals: {} })
        .eq("id", mealPlanId)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) throw error;

      return { data: data as MealPlan, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  /**
   * Add a recipe to an existing meal slot
   * Supports multiple recipes per slot (max 5)
   */
  static async addRecipeToSlot(
    mealPlanId: string,
    userId: string,
    day: WeekDay,
    meal: MealType,
    newRecipe: MealSlot
  ): Promise<ServiceResponse<MealPlan>> {
    try {
      // Get current meal plan
      const { data: currentPlan, error: fetchError } = await supabase
        .from("meal_plans")
        .select("meals")
        .eq("id", mealPlanId)
        .eq("user_id", userId)
        .single();

      if (fetchError) throw fetchError;

      // Get existing recipes for this slot
      const meals = (currentPlan.meals as WeekMeals) || {};
      const slotKey = `${day}-${meal}`;
      const existingRecipes = meals[slotKey] || [];

      // Validate limit
      if (existingRecipes.length >= MAX_RECIPES_PER_SLOT) {
        throw new Error(`Maximum ${MAX_RECIPES_PER_SLOT} recettes par repas`);
      }

      // Add new recipe
      meals[slotKey] = [...existingRecipes, newRecipe];

      // Save updated meal plan
      const { data, error } = await supabase
        .from("meal_plans")
        .update({ meals })
        .eq("id", mealPlanId)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) throw error;

      return { data: data as MealPlan, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  /**
   * Remove a specific recipe from a meal slot by index
   */
  static async removeRecipeFromSlot(
    mealPlanId: string,
    userId: string,
    day: WeekDay,
    meal: MealType,
    recipeIndex: number
  ): Promise<ServiceResponse<MealPlan>> {
    try {
      // Get current meal plan
      const { data: currentPlan, error: fetchError } = await supabase
        .from("meal_plans")
        .select("meals")
        .eq("id", mealPlanId)
        .eq("user_id", userId)
        .single();

      if (fetchError) throw fetchError;

      // Remove specific recipe by index
      const meals = (currentPlan.meals as WeekMeals) || {};
      const slotKey = `${day}-${meal}`;
      const existingRecipes = meals[slotKey] || [];

      // Remove recipe at specific index
      meals[slotKey] = existingRecipes.filter((_, index) => index !== recipeIndex);

      // If no recipes left, remove the slot entirely
      if (meals[slotKey]!.length === 0) {
        delete meals[slotKey];
      }

      // Save updated meal plan
      const { data, error } = await supabase
        .from("meal_plans")
        .update({ meals })
        .eq("id", mealPlanId)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) throw error;

      return { data: data as MealPlan, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  /**
   * Update a specific recipe within a meal slot by index (servings or isCooked)
   */
  static async updateRecipeInSlot(
    mealPlanId: string,
    userId: string,
    day: WeekDay,
    meal: MealType,
    recipeIndex: number,
    updates: Partial<Pick<MealSlot, "servings" | "isCooked" | "notes">>
  ): Promise<ServiceResponse<MealPlan>> {
    try {
      // Get current meal plan
      const { data: currentPlan, error: fetchError } = await supabase
        .from("meal_plans")
        .select("meals")
        .eq("id", mealPlanId)
        .eq("user_id", userId)
        .single();

      if (fetchError) throw fetchError;

      // Update specific recipe by index
      const meals = (currentPlan.meals as WeekMeals) || {};
      const slotKey = `${day}-${meal}`;
      const existingRecipes = meals[slotKey] || [];

      meals[slotKey] = existingRecipes.map((slot, index) =>
        index === recipeIndex ? { ...slot, ...updates } : slot
      );

      // Save updated meal plan
      const { data, error } = await supabase
        .from("meal_plans")
        .update({ meals })
        .eq("id", mealPlanId)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) throw error;

      return { data: data as MealPlan, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  /**
   * Get all recipes used in a meal plan (for grocery list generation)
   */
  static async getMealPlanRecipes(mealPlanId: string, userId: string): Promise<ServiceResponse<string[]>> {
    try {
      const { data: mealPlan, error } = await supabase
        .from("meal_plans")
        .select("meals")
        .eq("id", mealPlanId)
        .eq("user_id", userId)
        .single();

      if (error) throw error;

      const meals = (mealPlan.meals as WeekMeals) || {};
      const recipeIds = Object.values(meals)
        .filter((slots): slots is MealSlot[] => slots !== undefined)
        .flat() // Flatten array of arrays
        .map((slot) => slot.recipeId);

      // Remove duplicates
      const uniqueRecipeIds = [...new Set(recipeIds)];

      return { data: uniqueRecipeIds, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  /**
   * Helper: Get Monday of current week
   */
  static getMondayOfWeek(date: Date = new Date()): string {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    const monday = new Date(date.setDate(diff));
    return monday.toISOString().split("T")[0]; // YYYY-MM-DD
  }
}
