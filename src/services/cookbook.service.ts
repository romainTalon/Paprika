/**
 * Cookbook Service
 * CRUD operations for cookbooks with freemium enforcement
 */

import { createClient } from "@supabase/supabase-js";
import type { Cookbook, NewCookbook, ServiceResponse } from "@/types";

// Initialize Supabase client
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export class CookbookService {
  /**
   * Get all cookbooks for a user
   */
  static async getUserCookbooks(userId: string): Promise<ServiceResponse<Cookbook[]>> {
    try {
      const { data, error } = await supabase
        .from("cookbooks")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return { data: data as Cookbook[], error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  /**
   * Get a single cookbook by ID
   */
  static async getCookbook(cookbookId: string, userId: string): Promise<ServiceResponse<Cookbook>> {
    try {
      const { data, error } = await supabase
        .from("cookbooks")
        .select("*")
        .eq("id", cookbookId)
        .eq("user_id", userId)
        .single();

      if (error) throw error;

      return { data: data as Cookbook, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  /**
   * Get the default cookbook for a user
   */
  static async getDefaultCookbook(userId: string): Promise<ServiceResponse<Cookbook>> {
    try {
      const { data, error } = await supabase
        .from("cookbooks")
        .select("*")
        .eq("user_id", userId)
        .eq("is_default", true)
        .single();

      if (error) throw error;

      return { data: data as Cookbook, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  /**
   * Create a new cookbook
   * Freemium limit: 2 cookbooks for free users (enforced by DB trigger)
   */
  static async createCookbook(
    userId: string,
    cookbook: Omit<NewCookbook, "userId">
  ): Promise<ServiceResponse<Cookbook>> {
    try {
      const { data, error } = await supabase
        .from("cookbooks")
        .insert({
          user_id: userId,
          ...cookbook,
        })
        .select()
        .single();

      if (error) {
        // Check if it's a freemium limit error
        if (error.message?.includes("limit reached")) {
          throw new Error("You've reached the cookbook limit (2/2). Upgrade to Premium for unlimited cookbooks.");
        }
        throw error;
      }

      return { data: data as Cookbook, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  /**
   * Update a cookbook
   */
  static async updateCookbook(
    cookbookId: string,
    userId: string,
    updates: Partial<Omit<Cookbook, "id" | "userId" | "createdAt" | "updatedAt">>
  ): Promise<ServiceResponse<Cookbook>> {
    try {
      const { data, error } = await supabase
        .from("cookbooks")
        .update(updates)
        .eq("id", cookbookId)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) throw error;

      return { data: data as Cookbook, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  /**
   * Delete a cookbook (soft delete via is_archived if needed)
   */
  static async deleteCookbook(cookbookId: string, userId: string): Promise<ServiceResponse<boolean>> {
    try {
      const { error } = await supabase
        .from("cookbooks")
        .delete()
        .eq("id", cookbookId)
        .eq("user_id", userId);

      if (error) throw error;

      return { data: true, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  /**
   * Set a cookbook as default
   * Automatically unsets other default cookbooks for the user
   */
  static async setDefaultCookbook(cookbookId: string, userId: string): Promise<ServiceResponse<Cookbook>> {
    try {
      // First, unset all default cookbooks for this user
      await supabase
        .from("cookbooks")
        .update({ is_default: false })
        .eq("user_id", userId);

      // Then set this one as default
      const { data, error } = await supabase
        .from("cookbooks")
        .update({ is_default: true })
        .eq("id", cookbookId)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) throw error;

      return { data: data as Cookbook, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  /**
   * Get recipe count for a cookbook
   */
  static async getRecipeCount(cookbookId: string): Promise<ServiceResponse<number>> {
    try {
      const { count, error } = await supabase
        .from("recipes")
        .select("*", { count: "exact", head: true })
        .eq("cookbook_id", cookbookId);

      if (error) throw error;

      return { data: count || 0, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }
}
