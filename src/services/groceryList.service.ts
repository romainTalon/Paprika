/**
 * Grocery List Service
 * Manage grocery lists and items
 */

import { supabase } from "@/lib/supabase";
import type {
  GroceryList,
  GroceryItem,
  NewGroceryList,
  NewGroceryItem,
  ServiceResponse,
  RecipeIngredient,
} from "@/types";
import { DEFAULT_CATEGORY_ID, getCategoryDisplay } from "@/constants/categories";

export class GroceryListService {
  // =============================================================================
  // MAPPING HELPERS (snake_case <-> camelCase)
  // =============================================================================

  /**
   * Map database GroceryList (snake_case) to TypeScript (camelCase)
   */
  private static mapGroceryList(dbList: any): GroceryList {
    return {
      id: dbList.id,
      userId: dbList.user_id,
      name: dbList.name,
      isActive: dbList.is_active,
      isArchived: dbList.is_archived,
      createdAt: dbList.created_at,
      updatedAt: dbList.updated_at,
    };
  }

  /**
   * Map database GroceryItem (snake_case) to TypeScript (camelCase)
   */
  private static mapGroceryItem(dbItem: any): GroceryItem {
    return {
      id: dbItem.id,
      groceryListId: dbItem.grocery_list_id,
      name: dbItem.name,
      quantity: dbItem.quantity,
      unit: dbItem.unit,
      category: dbItem.category,
      imageUrl: dbItem.image_url,
      isChecked: dbItem.is_checked,
      checkedAt: dbItem.checked_at,
      notes: dbItem.notes,
      addedFrom: dbItem.added_from,
      sourceId: dbItem.source_id,
      createdAt: dbItem.created_at,
    };
  }

  // =============================================================================
  // GROCERY LISTS
  // =============================================================================

  /**
   * Get all grocery lists for a user
   */
  static async getUserLists(userId: string, includeArchived = false): Promise<ServiceResponse<GroceryList[]>> {
    try {
      let query = supabase
        .from("grocery_lists")
        .select("*")
        .eq("user_id", userId);

      if (!includeArchived) {
        query = query.eq("is_archived", false);
      }

      const { data, error} = await query.order("created_at", { ascending: false });

      if (error) throw error;

      return { data: data ? data.map(this.mapGroceryList) : [], error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  /**
   * Get all grocery lists for a user WITH item stats
   * Performance optimized: 2 queries instead of N+1
   * Returns lists with itemCount and checkedCount
   */
  static async getUserListsWithStats(
    userId: string,
    includeArchived = false
  ): Promise<ServiceResponse<Array<GroceryList & { itemCount: number; checkedCount: number }>>> {
    try {
      // Query 1: Fetch all lists
      let listsQuery = supabase
        .from("grocery_lists")
        .select("*")
        .eq("user_id", userId);

      if (!includeArchived) {
        listsQuery = listsQuery.eq("is_archived", false);
      }

      const { data: lists, error: listsError } = await listsQuery.order("created_at", { ascending: false });

      if (listsError) throw listsError;
      if (!lists || lists.length === 0) {
        return { data: [], error: null };
      }

      // Query 2: Fetch ALL items for ALL lists in ONE query
      const { data: items, error: itemsError } = await supabase
        .from("grocery_items")
        .select("grocery_list_id, is_checked")
        .in("grocery_list_id", lists.map((l) => l.id));

      if (itemsError) throw itemsError;

      // Aggregate stats by list ID
      const statsByListId = (items || []).reduce((acc, item) => {
        const listId = item.grocery_list_id;
        if (!acc[listId]) {
          acc[listId] = { total: 0, checked: 0 };
        }
        acc[listId].total++;
        if (item.is_checked) {
          acc[listId].checked++;
        }
        return acc;
      }, {} as Record<string, { total: number; checked: number }>);

      // Map lists with stats
      const listsWithStats = lists.map((list) => ({
        ...this.mapGroceryList(list),
        itemCount: statsByListId[list.id]?.total ?? 0,
        checkedCount: statsByListId[list.id]?.checked ?? 0,
      }));

      return { data: listsWithStats, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  /**
   * Get active grocery list
   * Freemium: Only 1 active list for free users
   */
  static async getActiveList(userId: string): Promise<ServiceResponse<GroceryList>> {
    try {
      const { data, error } = await supabase
        .from("grocery_lists")
        .select("*")
        .eq("user_id", userId)
        .eq("is_active", true)
        .single();

      if (error) {
        // If no active list, return null (not an error)
        if (error.code === "PGRST116") {
          return { data: null, error: null };
        }
        throw error;
      }

      return { data: this.mapGroceryList(data), error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  /**
   * Create a new grocery list
   * Freemium limit: 1 active list for free users (enforced by DB trigger)
   */
  static async createList(userId: string, name: string = "Ma Liste"): Promise<ServiceResponse<GroceryList>> {
    try {
      const { data, error } = await supabase
        .from("grocery_lists")
        .insert({
          user_id: userId,
          name,
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        // Check if it's a freemium limit error
        if (error.message?.includes("limit reached")) {
          throw new Error(
            "Active grocery list limit reached (1/1). Upgrade to Premium or archive your current list."
          );
        }
        throw error;
      }

      return { data: this.mapGroceryList(data), error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  /**
   * Update grocery list
   */
  static async updateList(
    listId: string,
    userId: string,
    updates: Partial<Omit<GroceryList, "id" | "userId" | "createdAt" | "updatedAt">>
  ): Promise<ServiceResponse<GroceryList>> {
    try {
      const { data, error } = await supabase
        .from("grocery_lists")
        .update(updates)
        .eq("id", listId)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) throw error;

      return { data: this.mapGroceryList(data), error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  /**
   * Archive a grocery list
   */
  static async archiveList(listId: string, userId: string): Promise<ServiceResponse<GroceryList>> {
    try {
      const { data, error } = await supabase
        .from("grocery_lists")
        .update({ is_archived: true, is_active: false })
        .eq("id", listId)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) throw error;

      return { data: this.mapGroceryList(data), error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  /**
   * Delete a grocery list (and all its items)
   */
  static async deleteList(listId: string, userId: string): Promise<ServiceResponse<boolean>> {
    try {
      const { error } = await supabase
        .from("grocery_lists")
        .delete()
        .eq("id", listId)
        .eq("user_id", userId);

      if (error) throw error;

      return { data: true, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  // =============================================================================
  // GROCERY ITEMS
  // =============================================================================

  /**
   * Get all items for a grocery list
   */
  static async getListItems(listId: string): Promise<ServiceResponse<GroceryItem[]>> {
    try {
      const { data, error } = await supabase
        .from("grocery_items")
        .select("*")
        .eq("grocery_list_id", listId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      return { data: data ? data.map(this.mapGroceryItem) : [], error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  /**
   * Get items grouped by category
   */
  static async getItemsByCategory(listId: string): Promise<ServiceResponse<Record<string, GroceryItem[]>>> {
    try {
      const { data, error } = await supabase
        .from("grocery_items")
        .select("*")
        .eq("grocery_list_id", listId)
        .order("category", { ascending: true })
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Map and group by category
      const items = data ? data.map(this.mapGroceryItem) : [];
      const grouped: Record<string, GroceryItem[]> = {};
      items.forEach((item) => {
        const category = item.category || "Autres";
        if (!grouped[category]) {
          grouped[category] = [];
        }
        grouped[category].push(item);
      });

      return { data: grouped, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  /**
   * Add item to grocery list
   */
  static async addItem(
    listId: string,
    item: Omit<NewGroceryItem, "groceryListId">
  ): Promise<ServiceResponse<GroceryItem>> {
    try {
      const { data, error } = await supabase
        .from("grocery_items")
        .insert({
          grocery_list_id: listId,
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,
          category: item.category,
          image_url: item.imageUrl,
          is_checked: item.isChecked,
          checked_at: item.checkedAt,
          notes: item.notes,
          added_from: item.addedFrom, // Map camelCase to snake_case
          source_id: item.sourceId,
        })
        .select()
        .single();

      if (error) throw error;

      return { data: this.mapGroceryItem(data), error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  /**
   * Update grocery item
   */
  static async updateItem(
    itemId: string,
    updates: {
      name?: string;
      quantity?: string | null;
      unit?: string | null;
      category?: string;
      imageUrl?: string | null;
      isChecked?: boolean;
      notes?: string | null;
    }
  ): Promise<ServiceResponse<GroceryItem>> {
    try {
      // Map camelCase to snake_case for database
      const dbUpdates: any = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.quantity !== undefined) dbUpdates.quantity = updates.quantity;
      if (updates.unit !== undefined) dbUpdates.unit = updates.unit;
      if (updates.category !== undefined) dbUpdates.category = updates.category;
      if (updates.imageUrl !== undefined) dbUpdates.image_url = updates.imageUrl;
      if (updates.isChecked !== undefined) dbUpdates.is_checked = updates.isChecked;
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes;

      const { data, error } = await supabase
        .from("grocery_items")
        .update(dbUpdates)
        .eq("id", itemId)
        .select()
        .single();

      if (error) throw error;

      return { data: this.mapGroceryItem(data), error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  /**
   * Toggle item checked status
   */
  static async toggleItem(itemId: string): Promise<ServiceResponse<GroceryItem>> {
    try {
      // Get current item
      const { data: item, error: fetchError } = await supabase
        .from("grocery_items")
        .select("is_checked")
        .eq("id", itemId)
        .single();

      if (fetchError) throw fetchError;

      // Toggle and update checked_at
      const updates: any = {
        is_checked: !item.is_checked,
      };

      if (!item.is_checked) {
        updates.checked_at = new Date().toISOString();
      } else {
        updates.checked_at = null;
      }

      const { data, error } = await supabase
        .from("grocery_items")
        .update(updates)
        .eq("id", itemId)
        .select()
        .single();

      if (error) throw error;

      return { data: this.mapGroceryItem(data), error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  /**
   * Delete grocery item
   */
  static async deleteItem(itemId: string): Promise<ServiceResponse<boolean>> {
    try {
      const { error } = await supabase.from("grocery_items").delete().eq("id", itemId);

      if (error) throw error;

      return { data: true, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  /**
   * Clear all checked items from a list
   */
  static async clearCheckedItems(listId: string): Promise<ServiceResponse<boolean>> {
    try {
      const { error } = await supabase
        .from("grocery_items")
        .delete()
        .eq("grocery_list_id", listId)
        .eq("is_checked", true);

      if (error) throw error;

      return { data: true, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  /**
   * Generate grocery list from meal plan
   * This aggregates ingredients from all recipes in a meal plan
   */
  static async generateFromMealPlan(
    userId: string,
    mealPlanId: string,
    listName: string = "Ma Liste de Courses"
  ): Promise<ServiceResponse<GroceryList>> {
    try {
      // Get meal plan recipes (you'll need to implement this)
      // For now, this is a placeholder that creates an empty list
      // TODO: Implement full meal plan → grocery list logic

      const { data: list, error: listError } = await this.createList(userId, listName);

      if (listError) throw listError;

      // TODO: Fetch recipes from meal plan
      // TODO: Aggregate ingredients
      // TODO: Add items to grocery list

      return { data: list!, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  // =============================================================================
  // DUPLICATE MERGING & BULK OPERATIONS
  // =============================================================================

  /**
   * Normalize item name for comparison
   * - Lowercase
   * - Trim whitespace
   * - Remove accents
   */
  static normalizeItemName(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  /**
   * Add item to grocery list with duplicate merging
   * If an item with the same normalized name and category exists,
   * merge quantities instead of creating a duplicate.
   */
  static async addItemWithMerge(
    listId: string,
    item: Omit<NewGroceryItem, "groceryListId">
  ): Promise<ServiceResponse<GroceryItem>> {
    try {
      const normalizedName = this.normalizeItemName(item.name);
      const category = item.category || DEFAULT_CATEGORY_ID;

      // Fetch existing items in the same category
      const { data: existingItems, error: fetchError } = await supabase
        .from("grocery_items")
        .select("*")
        .eq("grocery_list_id", listId)
        .eq("category", category);

      if (fetchError) throw fetchError;

      // Find a match based on normalized name
      const match = existingItems?.find(
        (existing) => this.normalizeItemName(existing.name) === normalizedName
      );

      if (match) {
        // Merge quantities
        const existingQty = parseFloat(String(match.quantity)) || 0;
        const newQty = typeof item.quantity === 'number' ? item.quantity : parseFloat(String(item.quantity)) || 0;
        const mergedQty = existingQty + newQty;

        // Update the existing item
        const { data, error } = await supabase
          .from("grocery_items")
          .update({
            quantity: String(mergedQty), // Convert to string for decimal type
            // Uncheck if it was checked (user is adding more)
            is_checked: false,
            checked_at: null,
          })
          .eq("id", match.id)
          .select()
          .single();

        if (error) throw error;

        return { data: this.mapGroceryItem(data), error: null };
      }

      // No match found, insert new item
      return this.addItem(listId, { ...item, category });
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  /**
   * Add ingredients from a recipe to the grocery list
   * Uses merge logic to avoid duplicates.
   */
  static async addItemsFromRecipe(
    listId: string,
    recipeId: string,
    ingredients: RecipeIngredient[],
    category?: string
  ): Promise<ServiceResponse<{ added: number; merged: number }>> {
    try {
      let added = 0;
      let merged = 0;

      for (const ingredient of ingredients) {
        const normalizedName = this.normalizeItemName(ingredient.name);
        const itemCategory = category || getCategoryDisplay(DEFAULT_CATEGORY_ID);

        // Check if item already exists
        const { data: existingItems } = await supabase
          .from("grocery_items")
          .select("*")
          .eq("grocery_list_id", listId)
          .eq("category", itemCategory);

        const match = existingItems?.find(
          (existing) => this.normalizeItemName(existing.name) === normalizedName
        );

        if (match) {
          // Merge quantities
          const existingQty = parseFloat(String(match.quantity)) || 0;
          const newQty = ingredient.quantity || 0;

          await supabase
            .from("grocery_items")
            .update({
              quantity: String(existingQty + newQty), // Convert to string for decimal type
              is_checked: false,
              checked_at: null,
            })
            .eq("id", match.id);

          merged++;
        } else {
          // Insert new item
          await supabase.from("grocery_items").insert({
            grocery_list_id: listId,
            name: ingredient.name,
            quantity: ingredient.quantity ? String(ingredient.quantity) : null, // Convert to string
            unit: ingredient.unit || null,
            category: itemCategory,
            added_from: "recipe", // snake_case for database
            source_id: recipeId, // snake_case for database
          });

          added++;
        }
      }

      return { data: { added, merged }, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  /**
   * Get or create active list for a user
   * If no active list exists, creates one with the default name.
   */
  static async getOrCreateActiveList(
    userId: string,
    defaultName: string = "Ma Liste"
  ): Promise<ServiceResponse<GroceryList>> {
    try {
      // Try to get the active list
      const { data: activeList, error: fetchError } = await this.getActiveList(userId);

      if (fetchError) throw fetchError;

      // If active list exists, return it
      if (activeList) {
        return { data: activeList, error: null };
      }

      // No active list, create one
      return this.createList(userId, defaultName);
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }
}
