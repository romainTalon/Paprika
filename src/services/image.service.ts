/**
 * Image Service
 *
 * Handles image search and storage for ingredients and recipes:
 * 1. Search TheMealDB for normalized ingredient photos (white background)
 * 2. Upload and store images in Supabase Storage
 * 3. Generate image URLs for database storage
 *
 * @module services/image
 */

import { supabase } from "@/lib/supabase";
import type {
  IngredientImageResult,
  IngredientImageOptions,
  ServiceResponse,
} from "@/types/ai";

/**
 * TheMealDB base URL for ingredient images
 * Format: https://www.themealdb.com/images/ingredients/{Name}.png
 */
const THEMEALDB_IMAGE_BASE_URL =
  "https://www.themealdb.com/images/ingredients";

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
   * Search for an ingredient image on TheMealDB
   *
   * @param options - Image search options
   * @returns Promise resolving to image result
   *
   * @example
   * ```typescript
   * const result = await ImageService.searchIngredientImage({
   *   ingredientName: "tomate"
   * });
   *
   * if (result.success) {
   *   console.log("Image URL:", result.imageUrl);
   * }
   * ```
   */
  static async searchIngredientImage(
    options: IngredientImageOptions
  ): Promise<IngredientImageResult> {
    const { ingredientName } = options;

    try {
      // Normalize ingredient name for TheMealDB
      // Examples: "tomate" → "Tomato", "chicken breast" → "Chicken Breast"
      const normalizedName = this.normalizeIngredientName(ingredientName);

      // Build TheMealDB image URL
      const imageUrl = `${THEMEALDB_IMAGE_BASE_URL}/${encodeURIComponent(normalizedName)}.png`;

      // Check if image exists by trying to fetch it
      const response = await fetch(imageUrl, { method: "HEAD" });

      if (!response.ok) {
        // Image not found on TheMealDB
        return {
          success: false,
          error: `No image found for "${ingredientName}" on TheMealDB`,
        };
      }

      // Image found!
      return {
        success: true,
        imageUrl,
        source: "themealdb",
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

      // Small delay to avoid overwhelming the server
      await this.delay(50);
    }

    return imageMap;
  }

  /**
   * Normalize ingredient name for TheMealDB
   *
   * Converts ingredient names to TheMealDB format:
   * - Capitalizes first letter of each word
   * - Handles basic French→English mapping
   *
   * @param name - Raw ingredient name
   * @returns Normalized name for TheMealDB
   *
   * @example
   * ```typescript
   * normalizeIngredientName("tomate")        → "Tomato"
   * normalizeIngredientName("chicken breast") → "Chicken Breast"
   * normalizeIngredientName("oignon")        → "Onion"
   * ```
   */
  private static normalizeIngredientName(name: string): string {
    // Basic French→English mapping for common ingredients
    const frenchToEnglish: Record<string, string> = {
      // Vegetables
      tomate: "Tomato",
      tomates: "Tomato",
      oignon: "Onion",
      oignons: "Onion",
      ail: "Garlic",
      carotte: "Carrot",
      carottes: "Carrot",
      pomme: "Apple",
      pommes: "Apple",
      "pomme de terre": "Potato",
      "pommes de terre": "Potato",
      courgette: "Zucchini",
      courgettes: "Zucchini",
      aubergine: "Eggplant",
      aubergines: "Eggplant",
      poivron: "Bell Pepper",
      poivrons: "Bell Pepper",
      champignon: "Mushroom",
      champignons: "Mushroom",
      épinard: "Spinach",
      épinards: "Spinach",
      salade: "Lettuce",
      laitue: "Lettuce",
      concombre: "Cucumber",
      brocoli: "Broccoli",
      chou: "Cabbage",
      "chou-fleur": "Cauliflower",
      haricot: "Bean",
      haricots: "Bean",
      "haricots verts": "Green Beans",
      pois: "Peas",
      "petits pois": "Peas",
      radis: "Radish",
      navet: "Turnip",
      betterave: "Beetroot",
      céleri: "Celery",
      poireau: "Leek",
      poireaux: "Leek",

      // Meats
      poulet: "Chicken",
      boeuf: "Beef",
      porc: "Pork",
      agneau: "Lamb",
      veau: "Veal",
      bacon: "Bacon",
      jambon: "Ham",
      saucisse: "Sausage",
      saucisses: "Sausage",
      "blanc de poulet": "Chicken Breast",
      "blancs de poulet": "Chicken Breast",
      "cuisse de poulet": "Chicken Thighs",
      "cuisses de poulet": "Chicken Thighs",
      dinde: "Turkey",
      canard: "Duck",

      // Seafood
      saumon: "Salmon",
      thon: "Tuna",
      crevette: "Shrimp",
      crevettes: "Shrimp",
      moule: "Mussel",
      moules: "Mussel",
      calamar: "Squid",
      poulpe: "Octopus",
      cabillaud: "Cod",
      truite: "Trout",
      anchois: "Anchovy",
      sardine: "Sardine",

      // Dairy
      lait: "Milk",
      beurre: "Butter",
      fromage: "Cheese",
      crème: "Cream",
      "crème fraîche": "Cream",
      yaourt: "Yogurt",
      "fromage blanc": "Cottage Cheese",
      parmesan: "Parmesan",
      mozzarella: "Mozzarella",
      gruyère: "Gruyere",

      // Grains & Pasta
      riz: "Rice",
      pâte: "Pasta",
      pâtes: "Pasta",
      farine: "Flour",
      pain: "Bread",
      spaghetti: "Spaghetti",
      macaroni: "Macaroni",
      quinoa: "Quinoa",
      boulgour: "Bulgur",
      couscous: "Couscous",

      // Herbs & Spices
      basilic: "Basil",
      persil: "Parsley",
      thym: "Thyme",
      romarin: "Rosemary",
      origan: "Oregano",
      coriandre: "Cilantro",
      menthe: "Mint",
      laurier: "Bay Leaf",
      "feuille de laurier": "Bay Leaf",
      sel: "Salt",
      poivre: "Pepper",
      paprika: "Paprika",
      cumin: "Cumin",
      curry: "Curry Powder",
      cannelle: "Cinnamon",
      muscade: "Nutmeg",
      gingembre: "Ginger",
      piment: "Chili",

      // Fruits
      citron: "Lemon",
      orange: "Orange",
      banane: "Banana",
      fraise: "Strawberry",
      fraises: "Strawberry",
      framboise: "Raspberry",
      framboises: "Raspberry",
      myrtille: "Blueberry",
      myrtilles: "Blueberry",
      pêche: "Peach",
      abricot: "Apricot",
      prune: "Plum",
      raisin: "Grapes",
      ananas: "Pineapple",
      mangue: "Mango",
      avocat: "Avocado",

      // Nuts & Seeds
      amande: "Almond",
      amandes: "Almond",
      noix: "Walnut",
      noisette: "Hazelnut",
      noisettes: "Hazelnut",
      pistache: "Pistachio",
      cacahuète: "Peanut",
      cacahuètes: "Peanut",

      // Others
      oeuf: "Egg",
      oeufs: "Egg",
      sucre: "Sugar",
      huile: "Oil",
      "huile d'olive": "Olive Oil",
      vinaigre: "Vinegar",
      moutarde: "Mustard",
      miel: "Honey",
      chocolat: "Chocolate",
      "chocolat noir": "Dark Chocolate",
      tofu: "Tofu",
      "pâte feuilletée": "Puff Pastry",
      "pâte brisée": "Shortcrust Pastry",
    };

    // Normalize to lowercase for lookup
    const lowerName = name.toLowerCase().trim();

    // Check if we have a French→English mapping
    if (frenchToEnglish[lowerName]) {
      return frenchToEnglish[lowerName];
    }

    // Fallback: capitalize first letter of each word (for English ingredients)
    return name
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
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
   * Helper to delay execution
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
