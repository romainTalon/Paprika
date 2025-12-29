/**
 * useGroceryList Hook
 *
 * Custom hook for managing grocery lists with TanStack Query.
 * Provides data fetching, caching, and mutations for grocery list operations.
 *
 * @module hooks/useGroceryList
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { GroceryListService } from "@/services";
import type { GroceryList, GroceryItem, NewGroceryItem, RecipeIngredient } from "@/types";

// =============================================================================
// QUERY HOOKS
// =============================================================================

/**
 * Hook to fetch all grocery lists for current user
 */
export function useGroceryLists(userId: string | undefined, includeArchived = false) {
  return useQuery({
    queryKey: ["grocery-lists", userId, includeArchived],
    queryFn: async () => {
      if (!userId) throw new Error("User ID is required");

      const { data, error } = await GroceryListService.getUserLists(userId, includeArchived);

      if (error) throw error;
      if (!data) throw new Error("No data returned");

      return data;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
}

/**
 * Hook to fetch the active grocery list for current user
 */
export function useActiveGroceryList(userId: string | undefined) {
  return useQuery({
    queryKey: ["grocery-lists", userId, "active"],
    queryFn: async () => {
      if (!userId) throw new Error("User ID is required");

      const { data, error } = await GroceryListService.getActiveList(userId);

      if (error) throw error;

      // Note: data can be null if no active list exists
      return data;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
}

/**
 * Hook to fetch items for a grocery list
 */
export function useGroceryListItems(listId: string | undefined) {
  return useQuery({
    queryKey: ["grocery-items", listId],
    queryFn: async () => {
      if (!listId) throw new Error("List ID is required");

      const { data, error } = await GroceryListService.getListItems(listId);

      if (error) throw error;
      if (!data) throw new Error("No data returned");

      return data;
    },
    enabled: !!listId,
    staleTime: 1000 * 60 * 2, // Refresh items more frequently
    gcTime: 1000 * 60 * 30,
  });
}

/**
 * Hook to fetch items grouped by category
 */
export function useGroceryListItemsByCategory(listId: string | undefined) {
  return useQuery({
    queryKey: ["grocery-items", listId, "by-category"],
    queryFn: async () => {
      if (!listId) throw new Error("List ID is required");

      const { data, error } = await GroceryListService.getItemsByCategory(listId);

      if (error) throw error;
      if (!data) throw new Error("No data returned");

      return data;
    },
    enabled: !!listId,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 30,
  });
}

// =============================================================================
// MUTATION HOOKS - LISTS
// =============================================================================

/**
 * Hook to create a new grocery list
 */
export function useCreateGroceryList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { userId: string; name?: string }) => {
      const { data, error } = await GroceryListService.createList(params.userId, params.name);

      if (error) throw error;
      if (!data) throw new Error("Failed to create grocery list");

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["grocery-lists", variables.userId] });
    },
  });
}

/**
 * Hook to get or create active list
 */
export function useGetOrCreateActiveList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { userId: string; defaultName?: string }) => {
      const { data, error } = await GroceryListService.getOrCreateActiveList(
        params.userId,
        params.defaultName
      );

      if (error) throw error;
      if (!data) throw new Error("Failed to get or create grocery list");

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["grocery-lists", variables.userId] });
    },
  });
}

/**
 * Hook to update a grocery list
 */
export function useUpdateGroceryList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      listId: string;
      userId: string;
      updates: Partial<Pick<GroceryList, "name" | "isActive" | "isArchived">>;
    }) => {
      const { data, error } = await GroceryListService.updateList(
        params.listId,
        params.userId,
        params.updates
      );

      if (error) throw error;
      if (!data) throw new Error("Failed to update grocery list");

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["grocery-lists", variables.userId] });
    },
  });
}

/**
 * Hook to archive a grocery list
 */
export function useArchiveGroceryList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { listId: string; userId: string }) => {
      const { data, error } = await GroceryListService.archiveList(params.listId, params.userId);

      if (error) throw error;
      if (!data) throw new Error("Failed to archive grocery list");

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["grocery-lists", variables.userId] });
    },
  });
}

/**
 * Hook to delete a grocery list
 */
export function useDeleteGroceryList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { listId: string; userId: string }) => {
      const { data, error } = await GroceryListService.deleteList(params.listId, params.userId);

      if (error) throw error;

      return params.listId;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["grocery-lists", variables.userId] });
    },
  });
}

// =============================================================================
// MUTATION HOOKS - ITEMS
// =============================================================================

/**
 * Hook to add an item to a grocery list (with duplicate merging)
 */
export function useAddGroceryItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      listId: string;
      item: Omit<NewGroceryItem, "groceryListId">;
    }) => {
      const { data, error } = await GroceryListService.addItemWithMerge(
        params.listId,
        params.item
      );

      if (error) throw error;
      if (!data) throw new Error("Failed to add grocery item");

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["grocery-items", variables.listId] });
    },
  });
}

/**
 * Hook to update a grocery item
 */
export function useUpdateGroceryItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      itemId: string;
      listId: string;
      updates: {
        name?: string;
        quantity?: string | null;
        unit?: string | null;
        category?: string;
        imageUrl?: string | null;
        isChecked?: boolean;
        notes?: string | null;
      };
    }) => {
      const { data, error } = await GroceryListService.updateItem(params.itemId, params.updates);

      if (error) throw error;
      if (!data) throw new Error("Failed to update grocery item");

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["grocery-items", variables.listId] });
    },
  });
}

/**
 * Hook to toggle item checked status
 */
export function useToggleGroceryItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { itemId: string; listId: string }) => {
      const { data, error } = await GroceryListService.toggleItem(params.itemId);

      if (error) throw error;
      if (!data) throw new Error("Failed to toggle grocery item");

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["grocery-items", variables.listId] });
    },
  });
}

/**
 * Hook to delete a grocery item
 */
export function useDeleteGroceryItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { itemId: string; listId: string }) => {
      const { data, error } = await GroceryListService.deleteItem(params.itemId);

      if (error) throw error;

      return params.itemId;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["grocery-items", variables.listId] });
    },
  });
}

/**
 * Hook to clear all checked items from a list
 */
export function useClearCheckedItems() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { listId: string }) => {
      const { data, error } = await GroceryListService.clearCheckedItems(params.listId);

      if (error) throw error;

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["grocery-items", variables.listId] });
    },
  });
}

// =============================================================================
// MUTATION HOOKS - RECIPE EXPORT
// =============================================================================

/**
 * Hook to add ingredients from a recipe to the grocery list
 */
export function useAddIngredientsFromRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      userId: string;
      recipeId: string;
      ingredients: RecipeIngredient[];
      category?: string;
    }) => {
      // First, get or create the active list
      const { data: list, error: listError } = await GroceryListService.getOrCreateActiveList(
        params.userId
      );

      if (listError) throw listError;
      if (!list) throw new Error("Failed to get or create grocery list");

      // Then add the ingredients
      const { data, error } = await GroceryListService.addItemsFromRecipe(
        list.id,
        params.recipeId,
        params.ingredients,
        params.category
      );

      if (error) throw error;
      if (!data) throw new Error("Failed to add ingredients");

      return { list, stats: data };
    },
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ["grocery-lists", variables.userId] });
      queryClient.invalidateQueries({ queryKey: ["grocery-items", result.list.id] });
    },
  });
}
