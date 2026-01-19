/**
 * TypeScript Type Definitions for External APIs
 *
 * This module defines types for third-party API integrations:
 * - OpenFoodFacts (nutrition database)
 * - TheMealDB (ingredient images)
 * - Anthropic Claude (already typed by SDK)
 *
 * @module types/api
 */

/**
 * OpenFoodFacts API - Free nutrition database
 * API Docs: https://wiki.openfoodfacts.org/API
 */

/**
 * OpenFoodFacts product nutriments (per 100g)
 */
export interface OpenFoodFactsNutriments {
  /** Energy in kcal per 100g */
  "energy-kcal_100g"?: number;
  /** Proteins in g per 100g */
  proteins_100g?: number;
  /** Carbohydrates in g per 100g */
  carbohydrates_100g?: number;
  /** Fat in g per 100g */
  fat_100g?: number;
  /** Fiber in g per 100g */
  fiber_100g?: number;
  /** Sugars in g per 100g */
  sugars_100g?: number;
  /** Salt in g per 100g */
  salt_100g?: number;
  /** Sodium in g per 100g */
  sodium_100g?: number;
  /** Saturated fat in g per 100g */
  "saturated-fat_100g"?: number;
}

/**
 * OpenFoodFacts product data structure
 */
export interface OpenFoodFactsProduct {
  /** Product barcode */
  code?: string;
  /** Product name */
  product_name?: string;
  /** Product name in French */
  product_name_fr?: string;
  /** Generic product name */
  generic_name?: string;
  /** Nutrition data */
  nutriments: OpenFoodFactsNutriments;
  /** Product image URL */
  image_url?: string;
  /** Thumbnail image URL */
  image_thumb_url?: string;
  /** Product quantity (e.g., "500g") */
  product_quantity?: string;
  /** Product brands */
  brands?: string;
  /** Product categories */
  categories?: string;
  /** Nutri-Score grade (a-e) */
  nutriscore_grade?: string;
  /** Nova group (1-4, food processing level) */
  nova_group?: number;
}

/**
 * OpenFoodFacts API search response
 */
export interface OpenFoodFactsSearchResponse {
  /** Total number of results */
  count: number;
  /** Current page number */
  page: number;
  /** Page size */
  page_size: number;
  /** Number of pages */
  page_count?: number;
  /** Skip value */
  skip?: number;
  /** Array of products */
  products: OpenFoodFactsProduct[];
}

/**
 * OpenFoodFacts API product detail response
 */
export interface OpenFoodFactsProductResponse {
  /** Response status (1 = found, 0 = not found) */
  status: number;
  /** Status verbose message */
  status_verbose?: string;
  /** Product data */
  product?: OpenFoodFactsProduct;
}

/**
 * OpenFoodFacts search options
 */
export interface OpenFoodFactsSearchOptions {
  /** Search query */
  search_terms: string;
  /** Number of results per page */
  page_size?: number;
  /** Page number */
  page?: number;
  /** Language code (fr, en, etc.) */
  lc?: string;
  /** Tags filter (e.g., "categories:en:fruits") */
  tagtype_0?: string;
  tag_contains_0?: string;
  /** Sort by field */
  sort_by?: string;
}

/**
 * TheMealDB API - Free ingredient images
 * API Docs: https://www.themealdb.com/api.php
 *
 * TheMealDB provides normalized ingredient images on white background.
 * Format: https://www.themealdb.com/images/ingredients/{IngredientName}.png
 *
 * Example: https://www.themealdb.com/images/ingredients/Tomato.png
 */

/**
 * Stripe API - Payment processing
 * (Only basic types needed for client-side, full types from @stripe/stripe-js)
 */

/**
 * Stripe subscription status
 */
export type StripeSubscriptionStatus =
  | "active"
  | "canceled"
  | "incomplete"
  | "incomplete_expired"
  | "past_due"
  | "trialing"
  | "unpaid";

/**
 * Stripe price data (for display)
 */
export interface StripePriceInfo {
  /** Price ID */
  id: string;
  /** Amount in cents */
  amount: number;
  /** Currency code */
  currency: string;
  /** Billing interval */
  interval: "month" | "year";
  /** Product ID */
  product: string;
}

/**
 * Generic API error response
 */
export interface APIError {
  /** Error message */
  message: string;
  /** Error code (if available) */
  code?: string;
  /** HTTP status code */
  status?: number;
  /** Additional error details */
  details?: unknown;
}

/**
 * Generic paginated API response
 */
export interface PaginatedResponse<T> {
  /** Array of results */
  data: T[];
  /** Pagination metadata */
  pagination: {
    /** Current page */
    page: number;
    /** Items per page */
    pageSize: number;
    /** Total items */
    total: number;
    /** Total pages */
    totalPages: number;
    /** Has next page */
    hasNext: boolean;
    /** Has previous page */
    hasPrevious: boolean;
  };
}

/**
 * API request configuration
 */
export interface APIRequestConfig {
  /** Request method */
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  /** Request headers */
  headers?: Record<string, string>;
  /** Request body */
  body?: unknown;
  /** Request timeout in ms */
  timeout?: number;
  /** Retry configuration */
  retry?: {
    /** Maximum retry attempts */
    maxAttempts: number;
    /** Delay between retries in ms */
    delay: number;
  };
}
