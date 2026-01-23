/**
 * Ingredient Name Normalizer
 *
 * Utility functions for cleaning and normalizing ingredient names
 * to improve image lookup success rate on TheMealDB.
 *
 * @module utils/ingredientNormalizer
 */

/**
 * French units and measurement words to remove from ingredient names
 */
const FRENCH_UNITS = [
  // Spoon measurements
  "cuillère à soupe",
  "cuillères à soupe",
  "c. à soupe",
  "c.à.s",
  "cas",
  "cuillère à café",
  "cuillères à café",
  "c. à café",
  "c.à.c",
  "cac",
  // Cooking units
  "baton",
  "batons",
  "bâton",
  "bâtons",
  "branche",
  "branches",
  "gousse",
  "gousses",
  "pincée",
  "pincées",
  "feuille",
  "feuilles",
  "verre",
  "verres",
  "tasse",
  "tasses",
  "tranche",
  "tranches",
  "morceau",
  "morceaux",
  "filet",
  "filets",
  "bouquet",
  "bouquets",
  "botte",
  "bottes",
  "sachet",
  "sachets",
  "paquet",
  "paquets",
  "boîte",
  "boîtes",
  "pot",
  "pots",
  "bocal",
  "bocaux",
  "cube",
  "cubes",
  "noix",
  "bloc",
  "blocs",
  "rondelle",
  "rondelles",
  "zeste",
  "zestes",
  "jus",
];

/**
 * French articles and prepositions to remove
 */
const FRENCH_ARTICLES = [
  "de ",
  "d'",
  "du ",
  "des ",
  "la ",
  "le ",
  "les ",
  "un ",
  "une ",
  "l'",
  "aux ",
  "au ",
  "à ",
];

/**
 * Size/quality adjectives that don't help identify the ingredient
 */
const ADJECTIVES_TO_REMOVE = [
  "gros",
  "grosse",
  "petit",
  "petite",
  "petits",
  "petites",
  "moyen",
  "moyenne",
  "moyens",
  "moyennes",
  "grand",
  "grande",
  "grands",
  "grandes",
  "frais",
  "fraîche",
  "fraîches",
  "surgelé",
  "surgelée",
  "surgelés",
  "surgelées",
  "congelé",
  "congelée",
  "séché",
  "séchée",
  "séchés",
  "séchées",
  "haché",
  "hachée",
  "hachés",
  "hachées",
  "coupé",
  "coupée",
  "coupés",
  "coupées",
  "émincé",
  "émincée",
  "émincés",
  "émincées",
  "râpé",
  "râpée",
  "râpés",
  "râpées",
  "finement",
  "grossièrement",
  "environ",
  "ou",
];

/**
 * Remove accents from a string for fuzzy matching
 *
 * @param str - String with potential accents
 * @returns String without accents
 *
 * @example
 * removeAccents("échalote") // "echalote"
 * removeAccents("crème fraîche") // "creme fraiche"
 */
export function removeAccents(str: string): string {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/**
 * Clean ingredient name by removing quantities, units, and common modifiers
 *
 * @param rawName - Raw ingredient name (may include quantity, unit, etc.)
 * @returns Cleaned ingredient name
 *
 * @example
 * cleanIngredientName("2 batons de citronelles") // "citronelles"
 * cleanIngredientName("200g de beurre doux") // "beurre doux"
 * cleanIngredientName("1 cuillère à soupe d'huile d'olive") // "huile d'olive"
 * cleanIngredientName("3 gousses d'ail") // "ail"
 */
export function cleanIngredientName(rawName: string): string {
  let name = rawName.toLowerCase().trim();

  // Step 1: Remove leading numbers and fractions
  // "2", "1/2", "1.5", "200g", "1-2"
  name = name.replace(/^[\d\s,./\-–]+/g, "").trim();

  // Step 2: Remove metric units with numbers
  // "200g", "1kg", "50ml", "2cl", "1l"
  name = name.replace(/^\d+\s*(g|gr|kg|mg|ml|cl|dl|l|cc)\b\s*/gi, "").trim();

  // Step 3: Remove French units (sorted by length to match longer ones first)
  const sortedUnits = [...FRENCH_UNITS].sort((a, b) => b.length - a.length);
  for (const unit of sortedUnits) {
    const unitPattern = new RegExp(`^${escapeRegex(unit)}\\s*`, "gi");
    name = name.replace(unitPattern, "").trim();
  }

  // Step 4: Remove French articles and prepositions
  for (const article of FRENCH_ARTICLES) {
    if (name.startsWith(article)) {
      name = name.slice(article.length).trim();
    }
  }

  // Step 5: Remove leading adjectives
  const adjectivePattern = new RegExp(
    `^(${ADJECTIVES_TO_REMOVE.join("|")})\\s+`,
    "gi"
  );
  name = name.replace(adjectivePattern, "").trim();

  // Step 6: Clean up any remaining leading/trailing articles
  for (const article of FRENCH_ARTICLES) {
    if (name.startsWith(article)) {
      name = name.slice(article.length).trim();
    }
  }

  // Step 7: Clean up parentheses content (often notes/alternatives)
  // "tomates (ou tomates cerises)" -> "tomates"
  name = name.replace(/\s*\([^)]*\)\s*/g, " ").trim();

  // Step 8: Final cleanup - normalize whitespace
  name = name.replace(/\s+/g, " ").trim();

  return name;
}

/**
 * Generate singular/plural variations of an ingredient name
 *
 * @param name - Cleaned ingredient name
 * @returns Array of variations (original + singular/plural forms)
 *
 * @example
 * generateVariations("citronelles") // ["citronelles", "citronelle"]
 * generateVariations("tomate") // ["tomate", "tomates"]
 */
export function generateVariations(name: string): string[] {
  const variations: string[] = [name];
  const lowerName = name.toLowerCase();

  // Handle common French plural patterns
  if (lowerName.endsWith("s")) {
    // Remove trailing 's' for singular
    variations.push(name.slice(0, -1));
  } else {
    // Add 's' for plural
    variations.push(name + "s");
  }

  // Handle 'x' endings (common French plural)
  if (lowerName.endsWith("x")) {
    // "choux" -> "chou"
    variations.push(name.slice(0, -1));
  }

  // Handle 'aux' -> 'al' (French plural)
  if (lowerName.endsWith("aux")) {
    // "bocaux" -> "bocal"
    variations.push(name.slice(0, -3) + "al");
  }

  // Handle double letters before 's'
  // "citronnelles" could also be "citronelle"
  if (lowerName.length > 3 && lowerName.endsWith("es")) {
    const withoutEs = name.slice(0, -2);
    if (!variations.includes(withoutEs)) {
      variations.push(withoutEs);
    }
    const withoutS = name.slice(0, -1);
    if (!variations.includes(withoutS)) {
      variations.push(withoutS);
    }
  }

  return [...new Set(variations)]; // Remove duplicates
}

/**
 * Escape special regex characters in a string
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
