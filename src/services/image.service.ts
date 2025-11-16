/**
 * Image Service
 *
 * Handles image search and storage for ingredients and recipes:
 * 1. Search Unsplash for high-quality ingredient photos
 * 2. Upload and store images in Supabase Storage
 * 3. Generate image URLs for database storage
 *
 * @module services/image
 */

import { createApi } from "unsplash-js";
import { supabase } from "@/lib/supabase";
import {
  unsplashSearchSchema,
  type UnsplashPhoto,
} from "@/lib/validators";
import type {
  IngredientImageResult,
  IngredientImageOptions,
  ServiceResponse,
} from "@/types/ai";

/**
 * Unsplash API client
 */
const unsplash = createApi({
  accessKey: process.env.UNSPLASH_ACCESS_KEY || "",
});

/**
 * Supabase Storage bucket for images
 */
const STORAGE_BUCKET = "recipe-images";

/**
 * ImageService
 *
 * Main service for searching and managing recipe/ingredient images.
 */
export class ImageService {
  /**
   * Search for an ingredient image on Unsplash
   *
   * @param options - Image search options
   * @returns Promise resolving to image result
   *
   * @example
   * ```typescript
   * const result = await ImageService.searchIngredientImage({
   *   ingredientName: "tomate",
   *   size: "regular"
   * });
   *
   * if (result.success) {
   *   console.log("Image URL:", result.imageUrl);
   *   console.log("Photographer:", result.attribution?.photographerName);
   * }
   * ```
   */
  static async searchIngredientImage(
    options: IngredientImageOptions
  ): Promise<IngredientImageResult> {
    const { ingredientName, size = "regular", language = "fr" } = options;

    try {
      // Check if Unsplash API key is configured
      if (!process.env.UNSPLASH_ACCESS_KEY) {
        return {
          success: false,
          error: "Unsplash API key not configured",
        };
      }

      // Build search query
      // Add "food" or "ingredient" to improve relevance
      const searchQuery =
        language === "fr"
          ? `${ingredientName} aliment`
          : `${ingredientName} food`;

      // Search Unsplash
      const response = await unsplash.search.getPhotos({
        query: searchQuery,
        page: 1,
        perPage: 5,
        orientation: "squarish", // Best for ingredient thumbnails
      });

      if (response.type === "error") {
        return {
          success: false,
          error: `Unsplash search failed: ${response.errors?.[0] || "Unknown error"}`,
        };
      }

      // Validate response
      const validation = unsplashSearchSchema.safeParse(response.response);
      if (!validation.success || validation.data.results.length === 0) {
        return {
          success: false,
          error: `No images found for "${ingredientName}"`,
        };
      }

      // Take the first (most relevant) photo
      const photo = validation.data.results[0];

      // Get URL for requested size
      const imageUrl = this.getPhotoUrl(photo, size);

      // Track download (required by Unsplash API guidelines)
      await this.trackUnsplashDownload(photo.id);

      return {
        success: true,
        imageUrl,
        source: "unsplash",
        attribution: {
          photographerName: photo.user.name,
          photographerUsername: photo.user.username,
        },
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? `Image search failed: ${error.message}`
            : "Image search failed",
      };
    }
  }

  /**
   * Search and cache images for multiple ingredients
   *
   * @param ingredientNames - Array of ingredient names
   * @returns Promise resolving to map of ingredient → image URL
   *
   * @example
   * ```typescript
   * const images = await ImageService.batchSearchIngredientImages([
   *   "tomate", "oignon", "ail"
   * ]);
   * console.log(images); // { tomate: "https://...", oignon: "https://...", ... }
   * ```
   */
  static async batchSearchIngredientImages(
    ingredientNames: string[]
  ): Promise<Record<string, string>> {
    const imageMap: Record<string, string> = {};

    for (const name of ingredientNames) {
      const result = await this.searchIngredientImage({
        ingredientName: name,
      });

      if (result.success && result.imageUrl) {
        imageMap[name] = result.imageUrl;
      }

      // Rate limit: Unsplash free tier allows 50 requests/hour
      // Add small delay between requests
      await this.delay(100);
    }

    return imageMap;
  }

  /**
   * Upload image to Supabase Storage
   *
   * @param file - File or Blob to upload
   * @param path - Storage path (e.g., "recipes/abc123.jpg")
   * @returns Promise resolving to public URL
   *
   * @example
   * ```typescript
   * const result = await ImageService.uploadImage(
   *   imageBlob,
   *   `recipes/${recipeId}/cover.jpg`
   * );
   *
   * if (result.data) {
   *   console.log("Uploaded to:", result.data);
   * }
   * ```
   */
  static async uploadImage(
    file: File | Blob,
    path: string
  ): Promise<ServiceResponse<string>> {
    try {
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(path, file, {
          cacheControl: "3600", // Cache for 1 hour
          upsert: true, // Overwrite if exists
        });

      if (error) throw error;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(data.path);

      return { data: publicUrl, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error("Upload failed"),
      };
    }
  }

  /**
   * Delete image from Supabase Storage
   *
   * @param path - Storage path to delete
   * @returns Promise resolving to service response
   */
  static async deleteImage(path: string): Promise<ServiceResponse<void>> {
    try {
      const { error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .remove([path]);

      if (error) throw error;

      return { data: undefined, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error("Delete failed"),
      };
    }
  }

  /**
   * Download image from URL and upload to Supabase Storage
   *
   * Useful for importing recipe images from external URLs.
   *
   * @param imageUrl - External image URL
   * @param storagePath - Target path in Supabase Storage
   * @returns Promise resolving to Supabase public URL
   */
  static async downloadAndUpload(
    imageUrl: string,
    storagePath: string
  ): Promise<ServiceResponse<string>> {
    try {
      // Fetch image
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }

      const blob = await response.blob();

      // Upload to Supabase
      return await this.uploadImage(blob, storagePath);
    } catch (error) {
      return {
        data: null,
        error:
          error instanceof Error
            ? error
            : new Error("Download and upload failed"),
      };
    }
  }

  /**
   * Get photo URL for specified size
   */
  private static getPhotoUrl(
    photo: UnsplashPhoto,
    size: "thumb" | "small" | "regular" | "full"
  ): string {
    return photo.urls[size];
  }

  /**
   * Track download (required by Unsplash API guidelines)
   *
   * Per Unsplash API Terms, you must trigger a download event
   * when you display an image to users.
   */
  private static async trackUnsplashDownload(photoId: string): Promise<void> {
    try {
      await unsplash.photos.trackDownload({ downloadLocation: photoId });
    } catch (error) {
      // Non-critical - log but don't fail
      console.error("Failed to track Unsplash download:", error);
    }
  }

  /**
   * Helper to delay execution (for rate limiting)
   */
  private static delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Initialize storage bucket if it doesn't exist
   *
   * Should be called during app initialization.
   */
  static async initializeStorage(): Promise<ServiceResponse<void>> {
    try {
      // Check if bucket exists
      const { data: buckets, error: listError } =
        await supabase.storage.listBuckets();

      if (listError) throw listError;

      const bucketExists = buckets?.some((b) => b.name === STORAGE_BUCKET);

      if (!bucketExists) {
        // Create bucket
        const { error: createError } = await supabase.storage.createBucket(
          STORAGE_BUCKET,
          {
            public: true, // Images are public
            fileSizeLimit: 5242880, // 5MB max
            allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
          }
        );

        if (createError) throw createError;

        console.log(`Created storage bucket: ${STORAGE_BUCKET}`);
      }

      return { data: undefined, error: null };
    } catch (error) {
      return {
        data: null,
        error:
          error instanceof Error
            ? error
            : new Error("Storage initialization failed"),
      };
    }
  }

  /**
   * Generate optimized image URL with transformations
   *
   * Supabase Storage supports image transformations via URL parameters.
   *
   * @param publicUrl - Original public URL
   * @param options - Transformation options
   * @returns Optimized image URL
   *
   * @example
   * ```typescript
   * const thumbnail = ImageService.getOptimizedUrl(originalUrl, {
   *   width: 200,
   *   height: 200,
   *   quality: 80
   * });
   * ```
   */
  static getOptimizedUrl(
    publicUrl: string,
    options: {
      width?: number;
      height?: number;
      quality?: number;
      format?: "webp" | "jpeg" | "png";
    }
  ): string {
    const params = new URLSearchParams();

    if (options.width) params.append("width", options.width.toString());
    if (options.height) params.append("height", options.height.toString());
    if (options.quality) params.append("quality", options.quality.toString());
    if (options.format) params.append("format", options.format);

    return params.toString()
      ? `${publicUrl}?${params.toString()}`
      : publicUrl;
  }
}
