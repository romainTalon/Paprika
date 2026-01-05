/**
 * Recipe Service
 * CRUD operations for recipes with JSONB handling (ingredients, steps, nutrition)
 */

import { supabase } from "@/lib/supabase";
import type {
  Recipe,
  NewRecipe,
  ServiceResponse,
  RecipeIngredient,
  RecipeStep,
  NutritionInfo,
  RecipeDifficulty,
  ImportSource,
} from "@/types";

/**
 * Transform database row (snake_case) to Recipe type (camelCase)
 */
function mapDbRowToRecipe(row: any): Recipe {
  return {
    id: row.id,
    userId: row.user_id,
    cookbookId: row.cookbook_id,
    title: row.title,
    description: row.description,
    coverImageUrl: row.cover_image_url,
    servings: row.servings,
    prepTime: row.prep_time,
    cookTime: row.cook_time,
    difficulty: row.difficulty,
    tags: row.tags,
    ingredients: row.ingredients,
    steps: row.steps,
    nutrition: row.nutrition,
    isFavorite: row.is_favorite,
    isArchived: row.is_archived,
    viewsCount: row.views_count,
    importSource: row.import_source,
    importUrl: row.import_url,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export interface CreateRecipeInput {
  title: string;
  description?: string;
  coverImageUrl?: string;
  cookbookId?: string;
  servings?: number;
  prepTime?: number;
  cookTime?: number;
  difficulty?: RecipeDifficulty;
  tags?: string[];
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  nutrition?: NutritionInfo;
  importSource?: ImportSource;
  importUrl?: string;
}

export interface UpdateRecipeInput extends Partial<CreateRecipeInput> {
  isFavorite?: boolean;
  isArchived?: boolean;
}

export class RecipeService {
  /**
   * Get all recipes for a user
   */
  static async getUserRecipes(userId: string, includeArchived = false): Promise<ServiceResponse<Recipe[]>> {
    try {
      let query = supabase
        .from("recipes")
        .select("*")
        .eq("user_id", userId);

      if (!includeArchived) {
        query = query.eq("is_archived", false);
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) throw error;

      // Transform snake_case to camelCase
      const recipes = data?.map(mapDbRowToRecipe) || [];

      return { data: recipes, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  /**
   * Get recipes from a specific cookbook
   */
  static async getCookbookRecipes(
    cookbookId: string,
    userId: string,
    includeArchived = false
  ): Promise<ServiceResponse<Recipe[]>> {
    try {
      let query = supabase
        .from("recipes")
        .select("*")
        .eq("cookbook_id", cookbookId)
        .eq("user_id", userId);

      if (!includeArchived) {
        query = query.eq("is_archived", false);
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) throw error;

      // Transform snake_case to camelCase
      const recipes = data?.map(mapDbRowToRecipe) || [];

      return { data: recipes, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  /**
   * Get favorite recipes
   */
  static async getFavoriteRecipes(userId: string): Promise<ServiceResponse<Recipe[]>> {
    try {
      const { data, error } = await supabase
        .from("recipes")
        .select("*")
        .eq("user_id", userId)
        .eq("is_favorite", true)
        .eq("is_archived", false)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Transform snake_case to camelCase
      const recipes = data?.map(mapDbRowToRecipe) || [];

      return { data: recipes, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  /**
   * Get a single recipe by ID
   */
  static async getRecipe(recipeId: string, userId: string): Promise<ServiceResponse<Recipe>> {
    try {
      const { data, error } = await supabase
        .from("recipes")
        .select("*")
        .eq("id", recipeId)
        .eq("user_id", userId)
        .single();

      if (error) throw error;

      // Increment view count
      await supabase
        .from("recipes")
        .update({ views_count: (data.views_count || 0) + 1 })
        .eq("id", recipeId);

      return { data: mapDbRowToRecipe(data), error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  /**
   * Create a new recipe
   * Freemium limit: 20 recipes for free users (enforced by DB trigger)
   */
  static async createRecipe(userId: string, recipe: CreateRecipeInput): Promise<ServiceResponse<Recipe>> {
    try {
      const { data, error } = await supabase
        .from("recipes")
        .insert({
          user_id: userId,
          cookbook_id: recipe.cookbookId || null,
          title: recipe.title,
          description: recipe.description,
          cover_image_url: recipe.coverImageUrl,
          servings: recipe.servings || 4,
          prep_time: recipe.prepTime,
          cook_time: recipe.cookTime,
          difficulty: recipe.difficulty,
          tags: recipe.tags,
          ingredients: recipe.ingredients as any,
          steps: recipe.steps as any,
          nutrition: recipe.nutrition as any,
          import_source: recipe.importSource || "manual",
          import_url: recipe.importUrl,
        })
        .select()
        .single();

      if (error) {
        // Check if it's a freemium limit error
        if (error.message?.includes("limit reached") || error.message?.includes("recipe_limit")) {
          throw new Error("Limite atteinte (20/20 recettes). Passez à Premium pour des recettes illimitées.");
        }
        throw error;
      }

      return { data: mapDbRowToRecipe(data), error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  /**
   * Update a recipe
   */
  static async updateRecipe(
    recipeId: string,
    userId: string,
    updates: UpdateRecipeInput
  ): Promise<ServiceResponse<Recipe>> {
    try {
      // Build update object
      const updateData: any = {};

      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.coverImageUrl !== undefined) updateData.cover_image_url = updates.coverImageUrl;
      if (updates.cookbookId !== undefined) updateData.cookbook_id = updates.cookbookId;
      if (updates.servings !== undefined) updateData.servings = updates.servings;
      if (updates.prepTime !== undefined) updateData.prep_time = updates.prepTime;
      if (updates.cookTime !== undefined) updateData.cook_time = updates.cookTime;
      if (updates.difficulty !== undefined) updateData.difficulty = updates.difficulty;
      if (updates.tags !== undefined) updateData.tags = updates.tags;
      if (updates.ingredients !== undefined) updateData.ingredients = updates.ingredients;
      if (updates.steps !== undefined) updateData.steps = updates.steps;
      if (updates.nutrition !== undefined) updateData.nutrition = updates.nutrition;
      if (updates.isFavorite !== undefined) updateData.is_favorite = updates.isFavorite;
      if (updates.isArchived !== undefined) updateData.is_archived = updates.isArchived;

      const { data, error } = await supabase
        .from("recipes")
        .update(updateData)
        .eq("id", recipeId)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) throw error;

      return { data: mapDbRowToRecipe(data), error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  /**
   * Delete a recipe
   */
  static async deleteRecipe(recipeId: string, userId: string): Promise<ServiceResponse<boolean>> {
    try {
      const { error } = await supabase
        .from("recipes")
        .delete()
        .eq("id", recipeId)
        .eq("user_id", userId);

      if (error) throw error;

      return { data: true, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  /**
   * Toggle favorite status
   */
  static async toggleFavorite(recipeId: string, userId: string): Promise<ServiceResponse<Recipe>> {
    try {
      // Get current recipe
      const { data: recipe, error: fetchError } = await supabase
        .from("recipes")
        .select("is_favorite")
        .eq("id", recipeId)
        .eq("user_id", userId)
        .single();

      if (fetchError) throw fetchError;

      // Toggle
      const { data, error } = await supabase
        .from("recipes")
        .update({ is_favorite: !recipe.is_favorite })
        .eq("id", recipeId)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) throw error;

      return { data: mapDbRowToRecipe(data), error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  /**
   * Archive/unarchive a recipe
   */
  static async toggleArchive(recipeId: string, userId: string): Promise<ServiceResponse<Recipe>> {
    try {
      // Get current recipe
      const { data: recipe, error: fetchError } = await supabase
        .from("recipes")
        .select("is_archived")
        .eq("id", recipeId)
        .eq("user_id", userId)
        .single();

      if (fetchError) throw fetchError;

      // Toggle
      const { data, error } = await supabase
        .from("recipes")
        .update({ is_archived: !recipe.is_archived })
        .eq("id", recipeId)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) throw error;

      return { data: data as Recipe, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  /**
   * Search recipes by title or description
   */
  static async searchRecipes(userId: string, query: string): Promise<ServiceResponse<Recipe[]>> {
    try {
      const { data, error } = await supabase
        .from("recipes")
        .select("*")
        .eq("user_id", userId)
        .eq("is_archived", false)
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return { data: data as Recipe[], error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  /**
   * Filter recipes by tags
   */
  static async getRecipesByTags(userId: string, tags: string[]): Promise<ServiceResponse<Recipe[]>> {
    try {
      const { data, error } = await supabase
        .from("recipes")
        .select("*")
        .eq("user_id", userId)
        .eq("is_archived", false)
        .contains("tags", tags)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return { data: data as Recipe[], error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  /**
   * Migrate external image URL to Supabase Storage
   *
   * For Instagram/TikTok: Extracts clean image without play button
   * For other URLs: Downloads and uploads as-is
   *
   * Called automatically when opening a recipe with external image
   */
  static async migrateImageToStorage(
    recipeId: string,
    externalUrl: string,
    importUrl?: string | null
  ): Promise<ServiceResponse<string>> {
    try {
      console.log(`🔄 Migrating image for recipe ${recipeId}...`);

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error("User not authenticated");
      }

      // Call Edge Function to migrate image
      const { data, error } = await supabase.functions.invoke("migrate-recipe-image", {
        body: {
          recipeId,
          externalUrl,
          importUrl: importUrl || null,
          userId: user.id,
        },
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || "Migration failed");
      }

      console.log(`✅ Image migrated successfully: ${data.newUrl}`);

      return { data: data.newUrl, error: null };
    } catch (error) {
      console.error("❌ Image migration failed:", error);
      return { data: null, error: error as Error };
    }
  }

  /**
   * Check if image URL is external (not Supabase Storage)
   */
  static isExternalImage(imageUrl: string | null | undefined): boolean {
    if (!imageUrl) return false;
    return !imageUrl.includes("supabase.co/storage");
  }
}
