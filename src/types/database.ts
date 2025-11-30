/**
 * Database Types and Interfaces
 * Structured types for JSONB fields and enums
 */

// =============================================================================
// ENUMS
// =============================================================================

export type RecipeDifficulty = "easy" | "medium" | "hard";
export type ImportSource = "manual" | "web" | "ocr";
export type GroceryAddedFrom = "manual" | "recipe" | "meal_plan";
export type NutritionSource = "openfoodfacts" | "ai_estimate" | "manual";

// =============================================================================
// RECIPE JSONB TYPES
// =============================================================================

/**
 * Recipe Ingredient Structure
 * Stored in recipes.ingredients as JSONB array
 */
export interface RecipeIngredient {
  name: string;
  quantity: number;
  unit?: string; // Optional: can be empty for items like "1 carrot"
  notes?: string;
  imageUrl?: string;
}

/**
 * Recipe Step Structure
 * Stored in recipes.steps as JSONB array
 */
export interface RecipeStep {
  order: number;
  instruction: string;
  duration?: number; // minutes
  imageUrl?: string;
}

/**
 * Nutrition Information Structure
 * Stored in recipes.nutrition as JSONB object
 */
export interface NutritionInfo {
  perServing: {
    calories: number;
    protein: number; // grams
    carbohydrates: number; // grams
    fat: number; // grams
    fiber: number; // grams
    sugar: number; // grams
  };
  calculatedAt: string; // ISO 8601 timestamp
  confidence: number; // 0.0 - 1.0
}

// =============================================================================
// MEAL PLAN JSONB TYPES
// =============================================================================

/**
 * Meal Slot Structure
 * Part of meal_plans.meals JSONB
 */
export interface MealSlot {
  recipeId: string; // UUID
  servings: number;
  notes?: string;
  isCooked: boolean;
}

/**
 * Complete Week Meals Structure
 * Stored in meal_plans.meals as JSONB object
 * Keys: "[day]-[meal]" like "monday-breakfast"
 * Values: Array of MealSlots (supports multiple recipes per meal, max 5)
 */
export type WeekMeals = {
  [key: string]: MealSlot[] | undefined;
};

/**
 * Maximum number of recipes allowed per meal slot
 */
export const MAX_RECIPES_PER_SLOT = 5;

/**
 * Meal Types
 */
export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

/**
 * Week Days
 */
export type WeekDay = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

/**
 * Helper to create meal slot key
 */
export function getMealSlotKey(day: WeekDay, meal: MealType): string {
  return `${day}-${meal}`;
}

// =============================================================================
// NUTRITION CACHE JSONB TYPES
// =============================================================================

/**
 * Nutrition Per 100g Structure
 * Stored in nutrition_cache.nutrition_per_100g as JSONB
 */
export interface NutritionPer100g {
  calories: number;
  protein: number; // grams
  carbohydrates: number; // grams
  fat: number; // grams
  fiber: number; // grams
  sugar: number; // grams
}

// =============================================================================
// FREEMIUM LIMITS
// =============================================================================

export const FREEMIUM_LIMITS = {
  FREE: {
    cookbooks: 2,
    recipes: 20,
    importsPerMonth: 5,
    activeGroceryLists: 1,
  },
  PREMIUM: {
    cookbooks: Infinity,
    recipes: Infinity,
    importsPerMonth: Infinity,
    activeGroceryLists: Infinity,
  },
} as const;

// =============================================================================
// SERVICE RESPONSE TYPES
// =============================================================================

/**
 * Standard service response format
 * Follows Supabase pattern: {data, error}
 */
export interface ServiceResponse<T> {
  data: T | null;
  error: Error | null;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

export function isValidDifficulty(value: string): value is RecipeDifficulty {
  return ["easy", "medium", "hard"].includes(value);
}

export function isValidImportSource(value: string): value is ImportSource {
  return ["manual", "web", "ocr"].includes(value);
}

export function isValidMealType(value: string): value is MealType {
  return ["breakfast", "lunch", "dinner", "snack"].includes(value);
}

export function isValidWeekDay(value: string): value is WeekDay {
  return ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].includes(value);
}
