/**
 * Recipe Tag Categories
 *
 * Predefined tag categories for organizing recipes.
 * Each category has an id, emoji, and French label with associated tags.
 */

export interface TagCategory {
  id: string;
  emoji: string;
  label: string;
  tags: readonly string[];
}

export const RECIPE_TAG_CATEGORIES: readonly TagCategory[] = [
  {
    id: "cuisine",
    emoji: "🌍",
    label: "Cuisine",
    tags: [
      "Française",
      "Italienne",
      "Asiatique",
      "Mexicaine",
      "Japonaise",
      "Indienne",
      "Méditerranéenne",
      "Américaine",
      "Thaïlandaise",
      "Chinoise",
      "Libanaise",
      "Espagnole",
    ],
  },
  {
    id: "regime",
    emoji: "🥗",
    label: "Régime",
    tags: [
      "Végétarien",
      "Végétalien",
      "Sans gluten",
      "Sans lactose",
      "Cétogène",
      "Paléo",
      "Protéiné",
      "Faible en calories",
      "Halal",
      "Casher",
    ],
  },
  {
    id: "type",
    emoji: "🍽️",
    label: "Type",
    tags: [
      "Entrée",
      "Plat principal",
      "Accompagnement",
      "Dessert",
      "Petit-déjeuner",
      "Apéritif",
      "Soupe",
      "Salade",
      "Pâtisserie",
      "Snack",
      "Boisson",
    ],
  },
  {
    id: "vitesse",
    emoji: "⚡",
    label: "Vitesse",
    tags: [
      "Express (<15 min)",
      "Rapide (<30 min)",
      "Modéré (<1h)",
      "Long (>1h)",
      "Batch cooking",
      "À l'avance",
      "One pot",
    ],
  },
  {
    id: "occasion",
    emoji: "🎉",
    label: "Occasion",
    tags: [
      "Quotidien",
      "Week-end",
      "Fête",
      "Noël",
      "Pâques",
      "Été",
      "Hiver",
      "Pique-nique",
      "BBQ",
      "Romantique",
    ],
  },
  {
    id: "methode",
    emoji: "👨‍🍳",
    label: "Méthode",
    tags: [
      "Four",
      "Poêle",
      "Casserole",
      "Mijoteuse",
      "Air fryer",
      "Autocuiseur",
      "Grill",
      "Cru",
      "Sans cuisson",
      "Fermentation",
    ],
  },
] as const;

// Type exports
export type RecipeTagCategoryId = (typeof RECIPE_TAG_CATEGORIES)[number]["id"];

/**
 * Get all tags from all categories as a flat array
 */
export function getAllTags(): string[] {
  return RECIPE_TAG_CATEGORIES.flatMap((category) =>
    category.tags as unknown as string[]
  );
}

/**
 * Get category by ID
 */
export function getCategoryById(categoryId: string): TagCategory | undefined {
  return RECIPE_TAG_CATEGORIES.find((c) => c.id === categoryId);
}

/**
 * Find which category a tag belongs to
 */
export function getCategoryForTag(tag: string): TagCategory | undefined {
  return RECIPE_TAG_CATEGORIES.find((category) =>
    (category.tags as readonly string[]).includes(tag)
  );
}

/**
 * Validate if a tag exists in predefined list
 */
export function isValidTag(tag: string): boolean {
  return getAllTags().includes(tag);
}

/**
 * Get display label with emoji for category
 */
export function getCategoryDisplay(categoryId: string): string {
  const category = getCategoryById(categoryId);
  return category ? `${category.emoji} ${category.label}` : "🏷️ Tags";
}

/**
 * Tag aliases for mapping AI-extracted tags to predefined tags
 * Extended mapping covering ~100 common variations
 */
const TAG_ALIASES: Record<string, string> = {
  // === CUISINE VARIANTS ===
  // Française
  french: "Française",
  française: "Française",
  francaise: "Française",
  france: "Française",

  // Italienne
  italian: "Italienne",
  italienne: "Italienne",
  italy: "Italienne",
  italia: "Italienne",

  // Asiatique
  asian: "Asiatique",
  asiatique: "Asiatique",
  asia: "Asiatique",

  // Mexicaine
  mexican: "Mexicaine",
  mexicaine: "Mexicaine",
  mexico: "Mexicaine",
  "tex-mex": "Mexicaine",

  // Japonaise
  japanese: "Japonaise",
  japonaise: "Japonaise",
  japan: "Japonaise",
  sushi: "Japonaise",

  // Indienne
  indian: "Indienne",
  indienne: "Indienne",
  india: "Indienne",
  curry: "Indienne",

  // Méditerranéenne
  mediterranean: "Méditerranéenne",
  méditerranéenne: "Méditerranéenne",
  mediterraneenne: "Méditerranéenne",

  // Américaine
  american: "Américaine",
  américaine: "Américaine",
  americaine: "Américaine",
  usa: "Américaine",

  // Thaïlandaise
  thai: "Thaïlandaise",
  thaïlandaise: "Thaïlandaise",
  thailand: "Thaïlandaise",

  // Chinoise
  chinese: "Chinoise",
  chinoise: "Chinoise",
  china: "Chinoise",

  // Libanaise
  lebanese: "Libanaise",
  libanaise: "Libanaise",
  lebanon: "Libanaise",

  // Espagnole
  spanish: "Espagnole",
  espagnole: "Espagnole",
  spain: "Espagnole",

  // === RÉGIME VARIANTS ===
  // Végétarien
  vegetarian: "Végétarien",
  végétarien: "Végétarien",
  vegetarien: "Végétarien",
  veggie: "Végétarien",

  // Végétalien
  vegan: "Végétalien",
  végétalien: "Végétalien",
  vegetalien: "Végétalien",
  "plant-based": "Végétalien",
  "plant based": "Végétalien",

  // Sans gluten
  "gluten-free": "Sans gluten",
  "gluten free": "Sans gluten",
  "sans gluten": "Sans gluten",
  "gluten libre": "Sans gluten",

  // Sans lactose
  "lactose-free": "Sans lactose",
  "lactose free": "Sans lactose",
  "sans lactose": "Sans lactose",
  "dairy-free": "Sans lactose",
  "dairy free": "Sans lactose",

  // Cétogène
  keto: "Cétogène",
  ketogenic: "Cétogène",
  cétogène: "Cétogène",

  // Paléo
  paleo: "Paléo",
  paleolithic: "Paléo",
  paléo: "Paléo",

  // Faible en calories
  healthy: "Faible en calories",
  "low-calorie": "Faible en calories",
  "low calorie": "Faible en calories",
  "faible en calories": "Faible en calories",

  // === TYPE DE REPAS VARIANTS ===
  // Entrée
  starter: "Entrée",
  entrée: "Entrée",
  entree: "Entrée",
  appetizer: "Entrée",
  "entrée chaude": "Entrée",
  "entrée froide": "Entrée",

  // Apéritif
  apéritif: "Apéritif",
  aperitif: "Apéritif",

  // Plat principal
  main: "Plat principal",
  "main course": "Plat principal",
  "main dish": "Plat principal",
  plat: "Plat principal",

  // Accompagnement
  side: "Accompagnement",
  "side dish": "Accompagnement",
  garniture: "Accompagnement",

  // Dessert
  dessert: "Dessert",
  sweet: "Dessert",
  sucré: "Dessert",

  // Pâtisserie
  gâteau: "Pâtisserie",
  cake: "Pâtisserie",
  pâtisserie: "Pâtisserie",
  patisserie: "Pâtisserie",
  baking: "Pâtisserie",

  // Petit-déjeuner
  breakfast: "Petit-déjeuner",
  "petit-déjeuner": "Petit-déjeuner",
  "petit dejeuner": "Petit-déjeuner",
  brunch: "Petit-déjeuner",

  // Soupe
  soup: "Soupe",
  soupe: "Soupe",
  potage: "Soupe",

  // Salade
  salad: "Salade",
  salade: "Salade",

  // Snack
  snack: "Snack",
  collation: "Snack",

  // Boisson
  drink: "Boisson",
  boisson: "Boisson",
  beverage: "Boisson",
  smoothie: "Boisson",
  juice: "Boisson",
  jus: "Boisson",

  // === VITESSE VARIANTS ===
  // Express
  express: "Express (<15 min)",
  "très rapide": "Express (<15 min)",
  "super quick": "Express (<15 min)",
  "15 min": "Express (<15 min)",
  "15min": "Express (<15 min)",

  // Rapide
  quick: "Rapide (<30 min)",
  fast: "Rapide (<30 min)",
  rapide: "Rapide (<30 min)",
  "30 min": "Rapide (<30 min)",
  "30min": "Rapide (<30 min)",

  // Modéré
  medium: "Modéré (<1h)",
  moyen: "Modéré (<1h)",
  "1h": "Modéré (<1h)",
  "1 heure": "Modéré (<1h)",

  // Long
  slow: "Long (>1h)",
  lent: "Long (>1h)",
  long: "Long (>1h)",
  "2h": "Long (>1h)",
  mijotage: "Long (>1h)",

  // Batch cooking
  batch: "Batch cooking",
  "meal prep": "Batch cooking",

  // À l'avance
  "à préparer": "À l'avance",
  "make ahead": "À l'avance",

  // One pot
  "one-pot": "One pot",
  "one pot": "One pot",

  // === OCCASION VARIANTS ===
  // Quotidien
  daily: "Quotidien",
  everyday: "Quotidien",
  quotidien: "Quotidien",
  "tous les jours": "Quotidien",

  // Week-end
  weekend: "Week-end",
  "week-end": "Week-end",

  // Fête
  party: "Fête",
  fête: "Fête",
  fete: "Fête",
  celebration: "Fête",

  // Noël
  christmas: "Noël",
  noël: "Noël",
  noel: "Noël",
  xmas: "Noël",

  // Pâques
  easter: "Pâques",
  pâques: "Pâques",
  paques: "Pâques",

  // Été
  été: "Été",
  ete: "Été",
  summer: "Été",
  "de saison": "Été", // Mapper vers été par défaut
  saisonnier: "Été",
  seasonal: "Été",

  // Hiver
  hiver: "Hiver",
  winter: "Hiver",

  // Pique-nique
  picnic: "Pique-nique",
  "pique-nique": "Pique-nique",
  "pique nique": "Pique-nique",

  // BBQ
  bbq: "BBQ",
  barbecue: "BBQ",
  grill: "BBQ",
  grillé: "BBQ",

  // Romantique
  romantic: "Romantique",
  romantique: "Romantique",
  couple: "Romantique",

  // === MÉTHODE VARIANTS ===
  // Four
  oven: "Four",
  four: "Four",
  baked: "Four",
  rôti: "Four",

  // Poêle
  pan: "Poêle",
  poêle: "Poêle",
  poele: "Poêle",
  sauté: "Poêle",
  fried: "Poêle",

  // Casserole
  pot: "Casserole",
  casserole: "Casserole",
  "dutch oven": "Casserole",

  // Mijoteuse
  "slow cooker": "Mijoteuse",
  mijoteuse: "Mijoteuse",
  "crock pot": "Mijoteuse",

  // Air fryer
  "air fryer": "Air fryer",
  friteuse: "Air fryer",

  // Autocuiseur
  "pressure cooker": "Autocuiseur",
  autocuiseur: "Autocuiseur",
  "instant pot": "Autocuiseur",

  // Cru
  raw: "Cru",
  cru: "Cru",

  // Sans cuisson
  "no-cook": "Sans cuisson",
  "no cook": "Sans cuisson",
  "sans cuisson": "Sans cuisson",

  // Fermentation
  fermented: "Fermentation",
  fermenté: "Fermentation",
  fermentation: "Fermentation",
};

/**
 * Normalize a tag to match predefined tags
 * Returns the normalized tag or the original if no match found
 */
export function normalizeTag(tag: string): string {
  const normalized = tag.toLowerCase().trim();

  // Check exact match first (case-insensitive)
  const allTags = getAllTags();
  const exactMatch = allTags.find(
    (t) => t.toLowerCase() === normalized
  );
  if (exactMatch) return exactMatch;

  // Check alias
  if (TAG_ALIASES[normalized]) {
    return TAG_ALIASES[normalized];
  }

  // Return original if no match
  return tag;
}

/**
 * Check if two tags match (case-insensitive, with normalization)
 */
export function tagsMatch(tag1: string, tag2: string): boolean {
  const normalized1 = normalizeTag(tag1).toLowerCase().trim();
  const normalized2 = normalizeTag(tag2).toLowerCase().trim();
  return normalized1 === normalized2;
}
