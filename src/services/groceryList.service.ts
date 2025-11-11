/**
 * Grocery List Service
 * Manage grocery lists and items
 */

import { createClient } from "@supabase/supabase-js";
import type { GroceryList, GroceryItem, NewGroceryList, NewGroceryItem, ServiceResponse } from "@/types";

// Initialize Supabase client
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export class GroceryListService {
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

      return { data: data as GroceryList[], error: null };
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

      return { data: data as GroceryList, error: null };
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

      return { data: data as GroceryList, error: null };
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

      return { data: data as GroceryList, error: null };
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

      return { data: data as GroceryList, error: null };
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

      return { data: data as GroceryItem[], error: null };
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

      // Group by category
      const grouped: Record<string, GroceryItem[]> = {};
      (data as GroceryItem[]).forEach((item) => {
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
          ...item,
        })
        .select()
        .single();

      if (error) throw error;

      return { data: data as GroceryItem, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  /**
   * Update grocery item
   */
  static async updateItem(
    itemId: string,
    updates: Partial<Omit<GroceryItem, "id" | "groceryListId" | "createdAt">>
  ): Promise<ServiceResponse<GroceryItem>> {
    try {
      const { data, error } = await supabase
        .from("grocery_items")
        .update(updates)
        .eq("id", itemId)
        .select()
        .single();

      if (error) throw error;

      return { data: data as GroceryItem, error: null };
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

      return { data: data as GroceryItem, error: null };
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
}
