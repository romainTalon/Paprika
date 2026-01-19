/**
 * Zod Validation Schemas for AI Responses
 *
 * This module provides Zod schemas to validate and type-check AI-generated data.
 * This is critical because AI responses can be unpredictable and may contain:
 * - Malformed JSON
 * - Missing required fields
 * - Incorrect data types
 * - Hallucinated or invalid data
 *
 * Always validate AI responses before storing them in the database.
 *
 * @module lib/validators
 */

import { z } from "zod";

/**
 * Validates recipe difficulty levels
 */
export const recipeDifficultySchema = z.enum(["easy", "medium", "hard"]);

/**
 * Validates a single recipe ingredient from AI import
 */
export const aiIngredientSchema = z.object({
  name: z.string().min(1, "Ingredient name cannot be empty"),
  quantity: z.number().positive("Quantity must be positive"),
  unit: z.string().min(1, "Unit cannot be empty"),
  notes: z.string().nullable().optional(),
});

/**
 * Validates a single recipe step from AI import
 */
export const aiRecipeStepSchema = z.object({
  order: z.number().int().positive("Step order must be a positive integer"),
  instruction: z.string().min(1, "Instruction cannot be empty"),
  duration: z.number().int().positive().nullable().optional(),
});

/**
 * Validates a complete recipe imported from AI (HTML or Vision)
 *
 * This is the main schema for validating Claude's recipe extraction output.
 */
export const aiRecipeImportSchema = z.object({
  title: z.string().min(1, "Recipe title is required"),
  description: z.string().nullable().optional(),
  servings: z.number().int().positive("Servings must be a positive integer"),
  prepTime: z.number().int().positive().nullable().optional(),
  cookTime: z.number().int().positive().nullable().optional(),
  difficulty: recipeDifficultySchema.nullable().optional(),
  tags: z.array(z.string()).default([]),
  ingredients: z
    .array(aiIngredientSchema)
    .min(1, "Recipe must have at least one ingredient"),
  steps: z
    .array(aiRecipeStepSchema)
    .min(1, "Recipe must have at least one step"),
  coverImageUrl: z.string().url().nullable().optional(),
});

/**
 * Type inference from aiRecipeImportSchema
 */
export type AIRecipeImport = z.infer<typeof aiRecipeImportSchema>;

/**
 * Validates JSON-LD recipe data extracted from HTML
 *
 * JSON-LD is a structured data format commonly found in recipe websites.
 * This schema is more lenient than aiRecipeImportSchema because JSON-LD
 * can vary significantly between sites.
 */
export const jsonLDRecipeSchema = z.object({
  "@type": z.literal("Recipe").or(z.array(z.string()).refine(arr => arr.includes("Recipe"))),
  name: z.string().optional(),
  description: z.string().optional(),
  recipeYield: z.union([z.string(), z.number()]).optional(),
  prepTime: z.string().optional(), // ISO 8601 duration (e.g., "PT30M")
  cookTime: z.string().optional(),
  totalTime: z.string().optional(),
  recipeIngredient: z.array(z.string()).optional(),
  recipeInstructions: z.union([
    z.array(z.string()),
    z.array(z.object({ "@type": z.string(), text: z.string() })),
    z.string(),
  ]).optional(),
  image: z.union([z.string(), z.array(z.string()), z.object({ url: z.string() })]).optional(),
  keywords: z.union([z.string(), z.array(z.string())]).optional(),
});

/**
 * Type inference from jsonLDRecipeSchema
 */
export type JSONLDRecipe = z.infer<typeof jsonLDRecipeSchema>;

/**
 * Validates normalized ingredient data from AI
 */
export const normalizedIngredientSchema = z.object({
  name: z.string().min(1, "Ingredient name is required"),
  quantity: z.number().positive("Quantity must be positive"),
  unit: z.string().min(1, "Unit is required"),
  notes: z.string().nullable().optional(),
});

/**
 * Type inference from normalizedIngredientSchema
 */
export type NormalizedIngredient = z.infer<typeof normalizedIngredientSchema>;

/**
 * Validates nutrition data per 100g from AI estimation
 */
export const aiNutritionEstimateSchema = z.object({
  calories: z.number().nonnegative("Calories cannot be negative"),
  protein: z.number().nonnegative("Protein cannot be negative"),
  carbohydrates: z.number().nonnegative("Carbohydrates cannot be negative"),
  fat: z.number().nonnegative("Fat cannot be negative"),
  fiber: z.number().nonnegative("Fiber cannot be negative"),
  sugar: z.number().nonnegative("Sugar cannot be negative"),
  confidence: z
    .number()
    .min(0, "Confidence must be between 0 and 1")
    .max(1, "Confidence must be between 0 and 1"),
});

/**
 * Type inference from aiNutritionEstimateSchema
 */
export type AINutritionEstimate = z.infer<typeof aiNutritionEstimateSchema>;

/**
 * Validates OpenFoodFacts API product response
 *
 * OpenFoodFacts is a free, open database of food products.
 * This schema validates the nutrition data from their API.
 */
export const openFoodFactsProductSchema = z.object({
  product_name: z.string().optional(),
  nutriments: z.object({
    "energy-kcal_100g": z.number().optional(),
    proteins_100g: z.number().optional(),
    carbohydrates_100g: z.number().optional(),
    fat_100g: z.number().optional(),
    fiber_100g: z.number().optional(),
    sugars_100g: z.number().optional(),
  }),
  image_url: z.string().url().optional(),
  product_quantity: z.string().optional(),
});

/**
 * Type inference from openFoodFactsProductSchema
 */
export type OpenFoodFactsProduct = z.infer<typeof openFoodFactsProductSchema>;

/**
 * Validates OpenFoodFacts API search response
 */
export const openFoodFactsSearchSchema = z.object({
  count: z.number(),
  page: z.number(),
  page_size: z.number(),
  products: z.array(openFoodFactsProductSchema),
});

/**
 * Type inference from openFoodFactsSearchSchema
 */
export type OpenFoodFactsSearch = z.infer<typeof openFoodFactsSearchSchema>;

/**
 * Helper function to safely parse and validate AI JSON response
 *
 * @param jsonString - JSON string from AI response
 * @param schema - Zod schema to validate against
 * @returns Parsed and validated data or null if invalid
 *
 * @example
 * ```typescript
 * const recipe = safeParseAIResponse(aiResponse, aiRecipeImportSchema);
 * if (!recipe) {
 *   console.error("Invalid recipe data from AI");
 *   return;
 * }
 * // recipe is now type-safe and validated
 * ```
 */
export function safeParseAIResponse<T>(
  jsonString: string,
  schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; error: z.ZodError } {
  try {
    const parsed = JSON.parse(jsonString);
    return schema.safeParse(parsed);
  } catch (error) {
    return {
      success: false,
      error: new z.ZodError([
        {
          code: "custom",
          message: `Invalid JSON: ${error instanceof Error ? error.message : "Unknown error"}`,
          path: [],
        },
      ]),
    };
  }
}

/**
 * Helper to convert ISO 8601 duration to minutes
 *
 * JSON-LD uses ISO 8601 duration format (e.g., "PT30M" = 30 minutes)
 * This helper converts it to a simple number.
 *
 * @param duration - ISO 8601 duration string
 * @returns Duration in minutes or null if invalid
 *
 * @example
 * ```typescript
 * parseDuration("PT1H30M") // 90
 * parseDuration("PT45M")   // 45
 * parseDuration("P1D")     // 1440
 * ```
 */
export function parseDuration(duration: string | undefined): number | null {
  if (!duration) return null;

  // ISO 8601 duration format: PT30M, PT1H30M, P1D, etc.
  const match = duration.match(/PT?(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return null;

  const hours = parseInt(match[1] || "0", 10);
  const minutes = parseInt(match[2] || "0", 10);

  return hours * 60 + minutes;
}

/**
 * Helper to normalize servings from various formats
 *
 * JSON-LD can represent servings as:
 * - "4" (string)
 * - 4 (number)
 * - "4 servings"
 * - "Serves 4-6"
 *
 * @param recipeYield - Recipe yield from JSON-LD
 * @returns Normalized servings count
 *
 * @example
 * ```typescript
 * parseServings("4")           // 4
 * parseServings("Serves 4-6")  // 4 (takes lower bound)
 * parseServings(4)             // 4
 * ```
 */
export function parseServings(
  recipeYield: string | number | undefined
): number {
  if (!recipeYield) return 4; // Default to 4 servings

  if (typeof recipeYield === "number") {
    return Math.max(1, Math.floor(recipeYield));
  }

  // Extract first number from string
  const match = recipeYield.match(/\d+/);
  return match ? Math.max(1, parseInt(match[0], 10)) : 4;
}
