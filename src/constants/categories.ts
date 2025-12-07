/**
 * Grocery Categories
 *
 * Predefined categories for organizing grocery items.
 * Each category has an id, emoji, and French label.
 */

export const GROCERY_CATEGORIES = [
  { id: "legumes", emoji: "🥬", label: "Légumes" },
  { id: "fruits", emoji: "🍎", label: "Fruits" },
  { id: "viandes", emoji: "🍖", label: "Viandes" },
  { id: "poissons", emoji: "🐟", label: "Poissons" },
  { id: "laitiers", emoji: "🥛", label: "Produits laitiers" },
  { id: "boulangerie", emoji: "🥖", label: "Boulangerie" },
  { id: "epicerie", emoji: "🥫", label: "Épicerie" },
  { id: "surgeles", emoji: "🧊", label: "Surgelés" },
  { id: "boissons", emoji: "🍷", label: "Boissons" },
  { id: "autres", emoji: "🛒", label: "Autres" },
] as const;

export type GroceryCategory = (typeof GROCERY_CATEGORIES)[number];
export type GroceryCategoryId = GroceryCategory["id"];

/**
 * Get the full category display string (emoji + label)
 */
export function getCategoryDisplay(categoryId: string): string {
  const category = GROCERY_CATEGORIES.find((c) => c.id === categoryId);
  return category ? `${category.emoji} ${category.label}` : `🛒 Autres`;
}

/**
 * Get category by id
 */
export function getCategoryById(
  categoryId: string
): GroceryCategory | undefined {
  return GROCERY_CATEGORIES.find((c) => c.id === categoryId);
}

/**
 * Default category for new items
 */
export const DEFAULT_CATEGORY_ID = "autres";
