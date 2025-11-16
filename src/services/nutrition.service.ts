/**
 * Nutrition Service
 *
 * Calculates nutritional information for recipes using a hybrid approach:
 * 1. Check nutrition cache (instant, free)
 * 2. Query OpenFoodFacts API (free, extensive French database)
 * 3. Fallback to Claude AI estimation (~€0.001 per ingredient)
 *
 * This approach minimizes costs while providing accurate nutrition data.
 *
 * @module services/nutrition
 */

import axios from "axios";
import { supabase } from "@/lib/supabase";
import { estimateNutrition, extractJSON } from "@/lib/anthropic";
import {
  openFoodFactsSearchSchema,
  aiNutritionEstimateSchema,
  safeParseAIResponse,
} from "@/lib/validators";
import type {
  NutritionCalculationResult,
  IngredientNutrition,
  NutritionCalculationOptions,
  ServiceResponse,
} from "@/types/ai";
import type {
  OpenFoodFactsSearchResponse,
  OpenFoodFactsProduct,
} from "@/types/api";
import type { NutritionInfo, RecipeIngredient } from "@/types/database";

/**
 * OpenFoodFacts API base URL
 */
const OPENFOODFACTS_API = "https://world.openfoodfacts.org";

/**
 * Unit conversion factors to grams
 * Used to normalize ingredient quantities for nutrition calculation
 */
const UNIT_TO_GRAMS: Record<string, number> = {
  // Weight units
  g: 1,
  gramme: 1,
  grammes: 1,
  kg: 1000,
  kilogramme: 1000,
  kilogrammes: 1000,
  mg: 0.001,
  milligramme: 0.001,
  milligrammes: 0.001,

  // Volume units (approximate, varies by ingredient density)
  ml: 1,
  millilitre: 1,
  millilitres: 1,
  l: 1000,
  litre: 1000,
  litres: 1000,
  cl: 10,
  centilitre: 10,
  centilitres: 10,

  // Common cooking measures (approximate)
  tasse: 240,
  cup: 240,
  "cuillère à soupe": 15,
  "cuillères à soupe": 15,
  "c. à soupe": 15,
  "cuillère à café": 5,
  "cuillères à café": 5,
  "c. à café": 5,
  pincée: 0.5,
  pincées: 0.5,

  // Count-based units (very approximate)
  unité: 100, // Assume 100g per unit (varies wildly)
  unités: 100,
  pièce: 100,
  pièces: 100,
  tranche: 30,
  tranches: 30,
};

/**
 * NutritionService
 *
 * Main service for calculating nutrition information for recipes.
 */
export class NutritionService {
  /**
   * Calculate nutrition for an entire recipe
   *
   * @param options - Nutrition calculation options
   * @returns Promise resolving to nutrition calculation result
   *
   * @example
   * ```typescript
   * const result = await NutritionService.calculateRecipeNutrition({
   *   ingredients: recipe.ingredients,
   *   servings: recipe.servings
   * });
   *
   * if (result.success) {
   *   console.log("Calories per serving:", result.nutrition.perServing.calories);
   *   console.log("Ingredients calculated:", result.ingredientsCalculated);
   * }
   * ```
   */
  static async calculateRecipeNutrition(
    options: NutritionCalculationOptions
  ): Promise<NutritionCalculationResult> {
    const startTime = Date.now();

    try {
      const { ingredients, servings, language = "fr" } = options;

      let totalCalories = 0;
      let totalProtein = 0;
      let totalCarbs = 0;
      let totalFat = 0;
      let totalFiber = 0;
      let totalSugar = 0;
      let ingredientsCalculated = 0;
      let ingredientsFailed = 0;
      let totalConfidence = 0;

      // Calculate nutrition for each ingredient
      for (const ingredient of ingredients) {
        const nutrition = await this.getIngredientNutrition(
          ingredient,
          language,
          options.forceRecalculation
        );

        if (nutrition) {
          // Convert ingredient quantity to grams
          const grams = this.convertToGrams(ingredient.quantity, ingredient.unit);

          // Calculate nutrition for this quantity
          const factor = grams / 100; // OpenFoodFacts data is per 100g

          totalCalories += nutrition.nutritionPer100g.calories * factor;
          totalProtein += nutrition.nutritionPer100g.protein * factor;
          totalCarbs += nutrition.nutritionPer100g.carbohydrates * factor;
          totalFat += nutrition.nutritionPer100g.fat * factor;
          totalFiber += nutrition.nutritionPer100g.fiber * factor;
          totalSugar += nutrition.nutritionPer100g.sugar * factor;
          totalConfidence += nutrition.confidence;

          ingredientsCalculated++;
        } else {
          ingredientsFailed++;
        }
      }

      if (ingredientsCalculated === 0) {
        return {
          success: false,
          error: "Could not calculate nutrition for any ingredients",
          ingredientsCalculated: 0,
          ingredientsFailed: ingredients.length,
          duration: Date.now() - startTime,
        };
      }

      // Calculate per-serving values
      const nutritionInfo: NutritionInfo = {
        perServing: {
          calories: Math.round(totalCalories / servings),
          protein: Math.round((totalProtein / servings) * 10) / 10,
          carbohydrates: Math.round((totalCarbs / servings) * 10) / 10,
          fat: Math.round((totalFat / servings) * 10) / 10,
          fiber: Math.round((totalFiber / servings) * 10) / 10,
          sugar: Math.round((totalSugar / servings) * 10) / 10,
        },
        calculatedAt: new Date().toISOString(),
        confidence: totalConfidence / ingredientsCalculated, // Average confidence
      };

      return {
        success: true,
        nutrition: nutritionInfo,
        ingredientsCalculated,
        ingredientsFailed,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown error during nutrition calculation",
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Get nutrition for a single ingredient using hybrid strategy
   *
   * 1. Check cache
   * 2. Query OpenFoodFacts
   * 3. Fallback to AI estimation
   *
   * @param ingredient - Recipe ingredient
   * @param language - Language for search (fr or en)
   * @param forceRecalculation - Skip cache lookup
   * @returns Promise resolving to ingredient nutrition or null
   */
  static async getIngredientNutrition(
    ingredient: RecipeIngredient,
    language: "fr" | "en" = "fr",
    forceRecalculation = false
  ): Promise<IngredientNutrition | null> {
    // Normalize ingredient name for cache lookup
    const normalizedName = ingredient.name.toLowerCase().trim();

    // Step 1: Check cache (unless forced recalculation)
    if (!forceRecalculation) {
      const cached = await this.getCachedNutrition(normalizedName, language);
      if (cached) {
        return cached;
      }
    }

    // Step 2: Query OpenFoodFacts
    const offResult = await this.queryOpenFoodFacts(normalizedName, language);
    if (offResult) {
      // Cache the result
      await this.cacheNutrition(offResult);
      return offResult;
    }

    // Step 3: Fallback to AI estimation
    const aiResult = await this.estimateWithAI(normalizedName);
    if (aiResult) {
      // Cache the result
      await this.cacheNutrition(aiResult);
      return aiResult;
    }

    return null;
  }

  /**
   * Look up nutrition from cache
   */
  private static async getCachedNutrition(
    ingredientName: string,
    language: string
  ): Promise<IngredientNutrition | null> {
    try {
      const { data, error } = await supabase
        .from("nutrition_cache")
        .select("*")
        .eq("ingredient_name", ingredientName)
        .eq("language", language)
        .single();

      if (error || !data) return null;

      // Increment usage count
      await supabase
        .from("nutrition_cache")
        .update({ usage_count: data.usage_count + 1 })
        .eq("id", data.id);

      return {
        ingredientName: data.ingredient_name,
        nutritionPer100g: data.nutrition_per_100g,
        source: "cache",
        confidence: data.confidence,
        imageUrl: data.image_url || undefined,
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Query OpenFoodFacts API for nutrition data
   */
  private static async queryOpenFoodFacts(
    ingredientName: string,
    language: string
  ): Promise<IngredientNutrition | null> {
    try {
      const response = await axios.get<OpenFoodFactsSearchResponse>(
        `${OPENFOODFACTS_API}/cgi/search.pl`,
        {
          params: {
            search_terms: ingredientName,
            json: 1,
            lc: language,
            page_size: 5,
            fields:
              "product_name,nutriments,image_url,product_quantity,brands,categories",
          },
          timeout: 5000,
        }
      );

      // Validate response
      const validation = openFoodFactsSearchSchema.safeParse(response.data);
      if (!validation.success || validation.data.products.length === 0) {
        return null;
      }

      // Take the first (most relevant) product
      const product = validation.data.products[0];

      // Extract nutrition data
      const nutrition = this.extractOpenFoodFactsNutrition(product);
      if (!nutrition) return null;

      return {
        ingredientName,
        nutritionPer100g: nutrition,
        source: "openfoodfacts",
        confidence: 0.9, // High confidence for OpenFoodFacts data
        imageUrl: product.image_url,
      };
    } catch (error) {
      console.error(`OpenFoodFacts query failed for "${ingredientName}":`, error);
      return null;
    }
  }

  /**
   * Extract nutrition data from OpenFoodFacts product
   */
  private static extractOpenFoodFactsNutrition(
    product: OpenFoodFactsProduct
  ): IngredientNutrition["nutritionPer100g"] | null {
    const n = product.nutriments;

    // Require at least calories to be present
    if (!n["energy-kcal_100g"]) return null;

    return {
      calories: n["energy-kcal_100g"] || 0,
      protein: n.proteins_100g || 0,
      carbohydrates: n.carbohydrates_100g || 0,
      fat: n.fat_100g || 0,
      fiber: n.fiber_100g || 0,
      sugar: n.sugars_100g || 0,
    };
  }

  /**
   * Estimate nutrition using Claude AI
   */
  private static async estimateWithAI(
    ingredientName: string
  ): Promise<IngredientNutrition | null> {
    try {
      // Call Claude to estimate nutrition
      const response = await estimateNutrition(ingredientName, 100);

      // Extract and validate JSON
      const jsonString = extractJSON(response);
      const validation = safeParseAIResponse(
        jsonString,
        aiNutritionEstimateSchema
      );

      if (!validation.success) {
        console.error(
          `AI nutrition estimation failed for "${ingredientName}":`,
          validation.error
        );
        return null;
      }

      const estimate = validation.data;

      return {
        ingredientName,
        nutritionPer100g: {
          calories: estimate.calories,
          protein: estimate.protein,
          carbohydrates: estimate.carbohydrates,
          fat: estimate.fat,
          fiber: estimate.fiber,
          sugar: estimate.sugar,
        },
        source: "ai_estimate",
        confidence: estimate.confidence,
      };
    } catch (error) {
      console.error(`AI estimation failed for "${ingredientName}":`, error);
      return null;
    }
  }

  /**
   * Cache nutrition data in database
   */
  private static async cacheNutrition(
    nutrition: IngredientNutrition
  ): Promise<void> {
    try {
      await supabase.from("nutrition_cache").insert({
        ingredient_name: nutrition.ingredientName,
        language: "fr", // Default to French
        nutrition_per_100g: nutrition.nutritionPer100g,
        image_url: nutrition.imageUrl || null,
        source: nutrition.source === "cache" ? "openfoodfacts" : nutrition.source,
        confidence: nutrition.confidence,
        usage_count: 1,
      });
    } catch (error) {
      // Non-critical - log but don't fail
      console.error("Failed to cache nutrition:", error);
    }
  }

  /**
   * Convert ingredient quantity to grams
   *
   * @param quantity - Ingredient quantity
   * @param unit - Ingredient unit
   * @returns Estimated weight in grams
   */
  private static convertToGrams(quantity: number, unit: string): number {
    const normalizedUnit = unit.toLowerCase().trim();
    const factor = UNIT_TO_GRAMS[normalizedUnit];

    if (!factor) {
      // Unknown unit - assume grams as fallback
      console.warn(`Unknown unit "${unit}", assuming grams`);
      return quantity;
    }

    return quantity * factor;
  }

  /**
   * Update recipe nutrition in database
   *
   * @param recipeId - Recipe ID
   * @param nutrition - Nutrition info to save
   * @returns Promise resolving to service response
   */
  static async updateRecipeNutrition(
    recipeId: string,
    nutrition: NutritionInfo
  ): Promise<ServiceResponse<void>> {
    try {
      const { error } = await supabase
        .from("recipes")
        .update({ nutrition })
        .eq("id", recipeId);

      if (error) throw error;

      return { data: undefined, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error("Unknown error"),
      };
    }
  }

  /**
   * Batch calculate nutrition for multiple recipes
   *
   * Useful for recalculating nutrition after OpenFoodFacts database updates.
   *
   * @param recipeIds - Array of recipe IDs
   * @returns Promise resolving to summary of results
   */
  static async batchCalculateNutrition(
    recipeIds: string[]
  ): Promise<{
    successful: number;
    failed: number;
    errors: Array<{ recipeId: string; error: string }>;
  }> {
    let successful = 0;
    let failed = 0;
    const errors: Array<{ recipeId: string; error: string }> = [];

    for (const recipeId of recipeIds) {
      try {
        // Fetch recipe
        const { data: recipe, error: fetchError } = await supabase
          .from("recipes")
          .select("ingredients, servings")
          .eq("id", recipeId)
          .single();

        if (fetchError || !recipe) {
          failed++;
          errors.push({ recipeId, error: "Recipe not found" });
          continue;
        }

        // Calculate nutrition
        const result = await this.calculateRecipeNutrition({
          ingredients: recipe.ingredients,
          servings: recipe.servings,
          forceRecalculation: true,
        });

        if (result.success && result.nutrition) {
          await this.updateRecipeNutrition(recipeId, result.nutrition);
          successful++;
        } else {
          failed++;
          errors.push({ recipeId, error: result.error || "Unknown error" });
        }
      } catch (error) {
        failed++;
        errors.push({
          recipeId,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return { successful, failed, errors };
  }
}
