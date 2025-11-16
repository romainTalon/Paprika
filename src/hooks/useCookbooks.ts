/**
 * useCookbooks Hook
 *
 * Custom hook for managing cookbooks with TanStack Query.
 * Provides data fetching, caching, and mutations for cookbook operations.
 *
 * @module hooks/useCookbooks
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CookbookService } from "@/services";
import type { ServiceResponse } from "@/types/database";

/**
 * Cookbook data structure
 * Note: Matches the database schema exactly
 */
export interface Cookbook {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  coverImageUrl: string | null;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Hook to fetch all cookbooks for current user
 *
 * @param userId - User ID
 * @returns Query result with cookbooks data
 *
 * @example
 * ```typescript
 * const { data: cookbooks, isLoading, error, refetch } = useCookbooks(userId);
 *
 * if (isLoading) return <Loading />;
 * if (error) return <Error message={error.message} />;
 *
 * return cookbooks.map(cookbook => <CookbookCard key={cookbook.id} {...cookbook} />);
 * ```
 */
export function useCookbooks(userId: string | undefined) {
  return useQuery({
    queryKey: ["cookbooks", userId],
    queryFn: async () => {
      if (!userId) throw new Error("User ID is required");

      const { data, error } = await CookbookService.getAll(userId);

      if (error) throw error;
      if (!data) throw new Error("No data returned");

      return data as Cookbook[];
    },
    enabled: !!userId, // Only run query if userId exists
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
    gcTime: 1000 * 60 * 30, // Keep in cache for 30 minutes (renamed from cacheTime in v5)
  });
}

/**
 * Hook to fetch a single cookbook by ID
 *
 * @param cookbookId - Cookbook ID
 * @returns Query result with cookbook data
 */
export function useCookbook(cookbookId: string | undefined) {
  return useQuery({
    queryKey: ["cookbook", cookbookId],
    queryFn: async () => {
      if (!cookbookId) throw new Error("Cookbook ID is required");

      const { data, error } = await CookbookService.getById(cookbookId);

      if (error) throw error;
      if (!data) throw new Error("Cookbook not found");

      return data as Cookbook;
    },
    enabled: !!cookbookId,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook to create a new cookbook
 *
 * @returns Mutation function and status
 *
 * @example
 * ```typescript
 * const createCookbook = useCreateCookbook();
 *
 * const handleCreate = async () => {
 *   try {
 *     const cookbook = await createCookbook.mutateAsync({
 *       userId,
 *       name: "My New Cookbook",
 *       description: "Family recipes"
 *     });
 *     console.log("Created:", cookbook.id);
 *   } catch (error) {
 *     console.error("Failed:", error);
 *   }
 * };
 * ```
 */
export function useCreateCookbook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      userId: string;
      name: string;
      description?: string;
      coverImageUrl?: string;
      isDefault?: boolean;
    }) => {
      const { data, error } = await CookbookService.create(
        params.userId,
        params.name,
        params.description,
        params.coverImageUrl,
        params.isDefault
      );

      if (error) throw error;
      if (!data) throw new Error("Failed to create cookbook");

      return data as Cookbook;
    },
    onSuccess: (_, variables) => {
      // Invalidate cookbooks list to trigger refetch
      queryClient.invalidateQueries({ queryKey: ["cookbooks", variables.userId] });
    },
  });
}

/**
 * Hook to update an existing cookbook
 *
 * @returns Mutation function and status
 */
export function useUpdateCookbook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      cookbookId: string;
      userId: string;
      updates: {
        name?: string;
        description?: string;
        coverImageUrl?: string;
        isDefault?: boolean;
      };
    }) => {
      const { data, error} = await CookbookService.update(
        params.cookbookId,
        params.updates
      );

      if (error) throw error;
      if (!data) throw new Error("Failed to update cookbook");

      return data as Cookbook;
    },
    onSuccess: (_, variables) => {
      // Invalidate both the list and the individual cookbook
      queryClient.invalidateQueries({ queryKey: ["cookbooks", variables.userId] });
      queryClient.invalidateQueries({ queryKey: ["cookbook", variables.cookbookId] });
    },
  });
}

/**
 * Hook to delete a cookbook
 *
 * @returns Mutation function and status
 */
export function useDeleteCookbook() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { cookbookId: string; userId: string }) => {
      const { error } = await CookbookService.delete(params.cookbookId);

      if (error) throw error;

      return params.cookbookId;
    },
    onSuccess: (_, variables) => {
      // Invalidate cookbooks list
      queryClient.invalidateQueries({ queryKey: ["cookbooks", variables.userId] });
      // Remove individual cookbook from cache
      queryClient.removeQueries({ queryKey: ["cookbook", variables.cookbookId] });
    },
  });
}

/**
 * Hook to get cookbook stats (recipe count)
 *
 * @param cookbookId - Cookbook ID
 * @returns Query result with stats
 */
export function useCookbookStats(cookbookId: string | undefined) {
  return useQuery({
    queryKey: ["cookbook-stats", cookbookId],
    queryFn: async () => {
      if (!cookbookId) throw new Error("Cookbook ID is required");

      const { data, error } = await CookbookService.getRecipeCount(cookbookId);

      if (error) throw error;

      return { recipeCount: data || 0 };
    },
    enabled: !!cookbookId,
    staleTime: 1000 * 60 * 2, // Refresh stats more frequently (2 min)
  });
}
