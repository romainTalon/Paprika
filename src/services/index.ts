/**
 * Services Index
 *
 * Central export point for all services in the application.
 * This allows for clean imports throughout the codebase.
 *
 * @example
 * ```typescript
 * import {
 *   RecipeImportService,
 *   NutritionService,
 *   ImageService
 * } from "@/services";
 * ```
 */

// Existing services
export { CookbookService } from "./cookbook.service";
export { RecipeService } from "./recipe.service";
export { MealPlanService } from "./mealPlan.service";
export { GroceryListService } from "./groceryList.service";

// New AI-powered services
// Note: RecipeImportService, NutritionService, and ImageService are not exported here
// because they use Node.js-specific dependencies (cheerio, axios) that don't work in React Native.
// They will be used later via Edge Functions or a separate backend API.
// export { RecipeImportService } from "./recipeImport.service";
// export { NutritionService } from "./nutrition.service";
// export { ImageService } from "./image.service";
