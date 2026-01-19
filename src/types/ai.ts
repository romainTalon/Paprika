/**
 * TypeScript Type Definitions for AI Services
 *
 * This module defines types specific to AI-powered features:
 * - Recipe import (3-tier strategy)
 * - Nutrition calculation
 * - Image generation
 *
 * @module types/ai
 */

import type { RecipeIngredient, RecipeStep, NutritionInfo } from "./database";

/**
 * Import strategies for recipe extraction
 */
export type ImportStrategy =
  | "json-ld"
  | "html-llm"
  | "vision-ai"
  | "instagram"
  | "tiktok";

/**
 * Import source tracking
 */
export type ImportSource = "manual" | "web" | "ocr";

/**
 * Confidence level for AI-extracted data
 */
export type ConfidenceLevel = "high" | "medium" | "low";

/**
 * Result of recipe import attempt
 */
export interface RecipeImportResult {
  /** Whether the import was successful */
  success: boolean;
  /** Which strategy was used */
  strategy: ImportStrategy;
  /** Extracted recipe data (if successful) */
  recipe?: ImportedRecipeData;
  /** Error message (if failed) */
  error?: string;
  /** Confidence in the extraction quality */
  confidence?: ConfidenceLevel;
  /** Time taken in milliseconds */
  duration?: number;
  /** Cost in euros (if applicable) */
  cost?: number;
}

/**
 * Imported recipe data structure (before saving to database)
 */
export interface ImportedRecipeData {
  title: string;
  description?: string;
  servings: number;
  prepTime?: number; // minutes
  cookTime?: number; // minutes
  difficulty?: "easy" | "medium" | "hard";
  tags: string[];
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  coverImageUrl?: string;
  importUrl: string;
  importSource: ImportSource;
  importStrategy: ImportStrategy;
}

/**
 * Options for recipe import
 */
export interface RecipeImportOptions {
  /** URL to import from */
  url: string;
  /** User ID performing the import */
  userId: string;
  /** Target cookbook ID (optional) */
  cookbookId?: string;
  /** Force a specific strategy (for testing) */
  forceStrategy?: ImportStrategy;
  /** Skip freemium limit check (for testing) */
  skipLimitCheck?: boolean;
}

/**
 * Nutrition calculation result
 */
export interface NutritionCalculationResult {
  /** Whether calculation was successful */
  success: boolean;
  /** Nutrition data per serving */
  nutrition?: NutritionInfo;
  /** Error message (if failed) */
  error?: string;
  /** Number of ingredients successfully calculated */
  ingredientsCalculated?: number;
  /** Number of ingredients that failed */
  ingredientsFailed?: number;
  /** Time taken in milliseconds */
  duration?: number;
}

/**
 * Single ingredient nutrition data (per 100g)
 */
export interface IngredientNutrition {
  ingredientName: string;
  nutritionPer100g: {
    calories: number;
    protein: number;
    carbohydrates: number;
    fat: number;
    fiber: number;
    sugar: number;
  };
  source: "openfoodfacts" | "ai_estimate" | "cache";
  confidence: number; // 0.0 - 1.0
  imageUrl?: string;
}

/**
 * Options for nutrition calculation
 */
export interface NutritionCalculationOptions {
  /** Recipe ingredients to calculate nutrition for */
  ingredients: RecipeIngredient[];
  /** Number of servings (for per-serving calculation) */
  servings: number;
  /** Force recalculation even if cached */
  forceRecalculation?: boolean;
  /** Language for OpenFoodFacts search */
  language?: "fr" | "en";
}

/**
 * Image search result for ingredients
 */
export interface IngredientImageResult {
  /** Whether image was found */
  success: boolean;
  /** Image URL (if found) */
  imageUrl?: string;
  /** Image source */
  source?: "themealdb" | "cache" | "ai-generated";
  /** Error message (if failed) */
  error?: string;
}

/**
 * Options for ingredient image search
 */
export interface IngredientImageOptions {
  /** Ingredient name to search for */
  ingredientName: string;
  /** Target image size */
  size?: "thumb" | "small" | "regular" | "full";
  /** Language for search query */
  language?: "fr" | "en";
}

/**
 * Freemium import limit tracking
 */
export interface ImportLimitStatus {
  /** Whether user can import */
  canImport: boolean;
  /** Imports used this month */
  importsUsed: number;
  /** Maximum imports allowed */
  importsLimit: number;
  /** Remaining imports */
  importsRemaining: number;
  /** Whether user is premium */
  isPremium: boolean;
  /** Next reset date */
  nextResetDate?: Date;
}

/**
 * Service response wrapper for error handling
 */
export interface ServiceResponse<T> {
  /** Response data (null if error) */
  data: T | null;
  /** Error object (null if success) */
  error: Error | null;
}

/**
 * AI cost tracking for analytics
 */
export interface AICostMetrics {
  /** Strategy used */
  strategy: ImportStrategy;
  /** Number of tokens used (if applicable) */
  tokensUsed?: number;
  /** Cost in euros */
  cost: number;
  /** Timestamp */
  timestamp: Date;
  /** User ID */
  userId: string;
}

/**
 * Recipe import statistics (for monitoring)
 */
export interface ImportStatistics {
  /** Total imports attempted */
  totalAttempts: number;
  /** Successful imports */
  successfulImports: number;
  /** Failed imports */
  failedImports: number;
  /** Success rate by strategy */
  successRateByStrategy: {
    "json-ld": number;
    "html-llm": number;
    "vision-ai": number;
    instagram: number;
    tiktok: number;
  };
  /** Average cost per import */
  averageCost: number;
  /** Average duration per import (ms) */
  averageDuration: number;
}
