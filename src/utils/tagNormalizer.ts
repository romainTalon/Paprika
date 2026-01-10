/**
 * Tag Normalization Utilities
 *
 * Provides utilities for normalizing tag arrays to ensure consistency
 * with predefined tag list. Used during recipe import and creation.
 */

import { normalizeTag, getAllTags } from "@/constants/recipeTags";

/**
 * Normalize an array of tags by:
 * 1. Mapping each tag via TAG_ALIASES
 * 2. Filtering out tags not in predefined list
 * 3. Removing duplicates (case-insensitive)
 * 4. Limiting to max 10 tags
 *
 * @param tags - Array of raw tags (possibly from AI extraction)
 * @returns Normalized array of valid, unique tags (max 10)
 *
 * @example
 * normalizeTagArray(["de saison", "entrée chaude", "quick", "vegetarian"])
 * // Returns: ["Été", "Entrée", "Rapide (<30 min)", "Végétarien"]
 */
export function normalizeTagArray(tags: string[]): string[] {
  if (!tags || tags.length === 0) return [];

  const allowedTags = getAllTags();

  // Step 1: Normalize each tag via TAG_ALIASES
  const normalized = tags.map((tag) => normalizeTag(tag));

  // Step 2: Filter to only valid tags (exist in predefined list)
  const valid = normalized.filter((tag) =>
    allowedTags.some((allowed) => allowed.toLowerCase() === tag.toLowerCase())
  );

  // Step 3: Remove duplicates (case-insensitive comparison)
  const unique = Array.from(
    new Set(valid.map((tag) => tag.toLowerCase()))
  ).map((lowerTag) => valid.find((t) => t.toLowerCase() === lowerTag)!);

  // Step 4: Limit to maximum 10 tags
  return unique.slice(0, 10);
}
