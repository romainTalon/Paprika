/**
 * Cookbook Service
 * CRUD operations for cookbooks with freemium enforcement
 */

import { supabase } from "@/lib/supabase";
import type { Cookbook, NewCookbook, ServiceResponse } from "@/types";

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

  // Alias methods for TanStack Query hooks compatibility
  static async getAll(userId: string): Promise<ServiceResponse<Cookbook[]>> {
    return this.getUserCookbooks(userId);
  }

  static async getById(cookbookId: string): Promise<ServiceResponse<Cookbook>> {
    // Note: We don't have userId here, which is needed for RLS
    // This will need to be updated once auth context is available
    try {
      const { data, error } = await supabase
        .from("cookbooks")
        .select("*")
        .eq("id", cookbookId)
        .single();

      if (error) throw error;

      return { data: data as Cookbook, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  static async create(
    userId: string,
    name: string,
    description?: string,
    coverImageUrl?: string,
    isDefault?: boolean
  ): Promise<ServiceResponse<Cookbook>> {
    return this.createCookbook(userId, {
      name,
      description,
      coverImageUrl,
      isDefault: isDefault || false,
    });
  }

  static async update(
    cookbookId: string,
    updates: {
      name?: string;
      description?: string;
      coverImageUrl?: string;
      isDefault?: boolean;
    }
  ): Promise<ServiceResponse<Cookbook>> {
    // Note: We need userId for RLS, will need to get from auth context later
    try {
      const { data, error } = await supabase
        .from("cookbooks")
        .update({
          name: updates.name,
          description: updates.description,
          cover_image_url: updates.coverImageUrl,
          is_default: updates.isDefault,
        })
        .eq("id", cookbookId)
        .select()
        .single();

      if (error) throw error;

      return { data: data as Cookbook, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  static async delete(cookbookId: string): Promise<ServiceResponse<boolean>> {
    // Note: We need userId for RLS, will need to get from auth context later
    try {
      const { error } = await supabase
        .from("cookbooks")
        .delete()
        .eq("id", cookbookId);

      if (error) throw error;

      return { data: true, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }
}
