---
name: recipe-domain
description: Understand Paprika recipe data structures and domain logic. Use when working with recipes, ingredients, nutrition, meal planning, or grocery lists. Includes data formats, validation rules, and business logic.
---

# Paprika Recipe Domain Knowledge

## When to Use This Skill

Apply this skill automatically when:
- Working with recipe data (create, edit, display)
- Handling ingredients and quantities
- Implementing nutrition calculations
- Working with meal planning features
- Generating grocery lists

## Core Data Structures

### Recipe Structure

```typescript
interface Recipe {
  id: string;
  userId: string;
  cookbookId: string;
  title: string;
  description?: string;
  servings: number;
  prepTime?: number;      // minutes
  cookTime?: number;      // minutes
  difficulty?: 'easy' | 'medium' | 'hard';
  imageUrl?: string;
  sourceUrl?: string;
  ingredients: Ingredient[];
  steps: RecipeStep[];
  nutrition?: NutritionInfo;
  tags?: string[];
  isFavorite: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### Ingredient Structure

```typescript
interface Ingredient {
  name: string;
  quantity: number;
  unit?: string;          // Optional! "1 carrot" is valid
  category?: string;      // For grocery list grouping
  notes?: string;
}
```

**Valid ingredient examples:**
- `{ name: "carrot", quantity: 1 }` - No unit
- `{ name: "flour", quantity: 200, unit: "g" }`
- `{ name: "olive oil", quantity: 2, unit: "tbsp" }`

### Recipe Step Structure

```typescript
interface RecipeStep {
  order: number;          // 1-based index
  instruction: string;
  duration?: number;      // minutes
  imageUrl?: string;
}
```

### Nutrition Info Structure

```typescript
interface NutritionInfo {
  calories?: number;      // per serving
  protein?: number;       // grams
  carbs?: number;         // grams
  fat?: number;           // grams
  fiber?: number;         // grams
  sugar?: number;         // grams
  sodium?: number;        // mg
}
```

## Fraction Parsing

The app supports fraction input for quantities:

```typescript
// Supported formats:
"1/2"     → 0.5
"3/4"     → 0.75
"1 1/2"   → 1.5
"2 3/4"   → 2.75

// Unicode fractions also supported:
"½"       → 0.5
"¼"       → 0.25
"¾"       → 0.75
"⅓"       → 0.333
"⅔"       → 0.667
```

Use `src/utils/fractionParser.ts` for parsing.

## Time Formatting

Times are stored in minutes, displayed as hours/minutes:

```typescript
// Storage: minutes (number)
prepTime: 150  // 2h30

// Display: formatted string
formatTime(150) → "2h30"
formatTime(45)  → "45 min"
formatTime(60)  → "1h"
```

## Serving Multiplier Logic

When adjusting servings, scale all ingredient quantities:

```typescript
const scaleFactor = newServings / originalServings;

const scaledIngredients = ingredients.map(ing => ({
  ...ing,
  quantity: ing.quantity * scaleFactor,
}));
```

## Meal Planning Structure

```typescript
interface MealPlan {
  id: string;
  userId: string;
  weekStart: string;      // ISO date (Monday)
  meals: MealSlot[];      // JSONB array
}

interface MealSlot {
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  recipes: MealSlotRecipe[];  // Max 5 recipes per slot
}

interface MealSlotRecipe {
  recipeId: string;
  servings: number;
  isCooked: boolean;
}
```

**Business Rules:**
- Max 5 recipes per meal slot
- Week starts on Monday (ISO week)
- Each slot can have multiple recipes (e.g., main + side dish)

## Grocery List Generation

When generating from meal plan:

1. Collect all ingredients from planned recipes
2. Multiply by servings adjustment
3. Group by category
4. Combine duplicate ingredients (same name + unit)
5. Create grocery items

```typescript
interface GroceryItem {
  id: string;
  groceryListId: string;
  name: string;
  quantity: number;
  unit?: string;
  category?: string;
  isChecked: boolean;
  source: 'manual' | 'meal_plan';
  recipeId?: string;      // If from meal plan
}
```

**Ingredient Categories:**
- Fruits & Vegetables
- Meat & Fish
- Dairy & Eggs
- Bakery
- Pantry
- Frozen
- Beverages
- Other

## Validation Rules (Zod)

```typescript
const recipeSchema = z.object({
  title: z.string().min(2, "Le titre doit faire au moins 2 caractères"),
  description: z.string().optional(),
  servings: z.number().min(1).max(50),
  prepTime: z.number().min(0).max(1440).optional(),
  cookTime: z.number().min(0).max(1440).optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  ingredients: z.array(ingredientSchema).min(1, "Au moins 1 ingrédient requis"),
  steps: z.array(stepSchema).min(1, "Au moins 1 étape requise"),
});

const ingredientSchema = z.object({
  name: z.string().min(1),
  quantity: z.number().positive(),
  unit: z.string().optional(),  // Optional!
});
```

## Freemium Limits

| Feature | Free | Premium |
|---------|------|---------|
| Cookbooks | 2 | Unlimited |
| Recipes | 20 | Unlimited |
| AI Imports/month | 5 | Unlimited |
| Grocery Lists | 1 | Unlimited |
| Meal Planning | Unlimited | Unlimited |

## AI Import Strategy (3-Tier)

1. **JSON-LD extraction** (free, ~70% success)
   - Parse structured data from webpage
   - Schema.org Recipe format

2. **LLM + HTML scraping** (~€0.01/import, ~20% success)
   - Claude 3.5 Sonnet
   - Extract from raw HTML

3. **Vision AI screenshot** (~€0.03/import, ~10% success)
   - Claude Vision
   - Screenshot analysis
   - Last resort

## Common Operations

### Check if user can add recipe
```typescript
const canAddRecipe = user.subscriptionPlan === 'premium' ||
  userRecipeCount < FREE_RECIPE_LIMIT;
```

### Calculate total time
```typescript
const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);
```

### Format difficulty
```typescript
const difficultyLabels = {
  easy: 'Facile',
  medium: 'Moyen',
  hard: 'Difficile',
};
```
