# Services Documentation

This directory contains all business logic services for the Paprika application.

## Service Categories

### 📦 CRUD Services
Basic data manipulation services following a consistent pattern.

- **CookbookService** - Manage recipe collections
- **RecipeService** - Manage individual recipes
- **MealPlanService** - Weekly meal planning
- **GroceryListService** - Shopping list management

### 🤖 AI-Powered Services
Advanced services using Claude AI, OpenFoodFacts, and TheMealDB.

- **RecipeImportService** - Import recipes from URLs using 3-tier AI strategy
- **NutritionService** - Calculate nutrition with OpenFoodFacts + AI fallback
- **ImageService** - Search and manage images with TheMealDB

---

## Usage Examples

### Complete Recipe Import Flow

Here's how to import a recipe from a URL and enrich it with nutrition and images:

```typescript
import {
  RecipeImportService,
  NutritionService,
  ImageService,
} from "@/services";

async function importRecipeComplete(url: string, userId: string) {
  // Step 1: Import recipe from URL
  console.log("Importing recipe from URL...");
  const importResult = await RecipeImportService.importFromURL({
    url,
    userId,
  });

  if (!importResult.success || !importResult.recipe) {
    console.error("Import failed:", importResult.error);
    return;
  }

  console.log(`✓ Recipe imported using ${importResult.strategy}`);
  console.log(`✓ Cost: €${importResult.cost}`);
  console.log(`✓ Confidence: ${importResult.confidence}`);

  const recipe = importResult.recipe;

  // Step 2: Calculate nutrition
  console.log("\nCalculating nutrition...");
  const nutritionResult = await NutritionService.calculateRecipeNutrition({
    ingredients: recipe.ingredients,
    servings: recipe.servings,
  });

  if (nutritionResult.success && nutritionResult.nutrition) {
    recipe.nutrition = nutritionResult.nutrition;
    console.log(`✓ Nutrition calculated for ${nutritionResult.ingredientsCalculated} ingredients`);
    console.log(`✓ Calories per serving: ${nutritionResult.nutrition.perServing.calories}`);
  }

  // Step 3: Search ingredient images
  console.log("\nSearching ingredient images...");
  const ingredientNames = recipe.ingredients.map((ing) => ing.name);
  const imageMap = await ImageService.batchSearchIngredientImages(ingredientNames);

  // Attach images to ingredients
  recipe.ingredients = recipe.ingredients.map((ing) => ({
    ...ing,
    imageUrl: imageMap[ing.name] || undefined,
  }));

  console.log(`✓ Found images for ${Object.keys(imageMap).length} ingredients`);

  // Step 4: Save to database
  console.log("\nSaving recipe...");
  const saveResult = await RecipeImportService.saveImportedRecipe(
    recipe,
    userId
  );

  if (saveResult.error) {
    console.error("Save failed:", saveResult.error);
    return;
  }

  console.log(`✓ Recipe saved with ID: ${saveResult.data}`);

  // Step 5: Update with nutrition
  if (nutritionResult.success && nutritionResult.nutrition) {
    await NutritionService.updateRecipeNutrition(
      saveResult.data!,
      nutritionResult.nutrition
    );
    console.log("✓ Nutrition data saved");
  }

  console.log("\n🎉 Recipe import complete!");
  return saveResult.data;
}

// Usage
const recipeId = await importRecipeComplete(
  "https://www.marmiton.org/recettes/recette_pate-a-crepes_12372.aspx",
  "user-123"
);
```

### Output Example
```
Importing recipe from URL...
✓ Recipe imported using json-ld
✓ Cost: €0
✓ Confidence: high

Calculating nutrition...
✓ Nutrition calculated for 6 ingredients
✓ Calories per serving: 245

Searching ingredient images...
✓ Found images for 5 ingredients

Saving recipe...
✓ Recipe saved with ID: abc-123-def-456
✓ Nutrition data saved

🎉 Recipe import complete!
```

---

## Individual Service Usage

### RecipeImportService

```typescript
import { RecipeImportService } from "@/services";

// Check import limits
const limitStatus = await RecipeImportService.checkImportLimit("user-123");
console.log(`${limitStatus.importsRemaining} imports remaining`);

// Import recipe
const result = await RecipeImportService.importFromURL({
  url: "https://example.com/recipe",
  userId: "user-123",
  cookbookId: "cookbook-456", // Optional
});

if (result.success) {
  console.log("Recipe:", result.recipe);
  console.log("Strategy:", result.strategy); // 'json-ld' | 'html-llm' | 'vision-ai'
  console.log("Cost:", result.cost); // €0, €0.01, or €0.03
}

// Force specific strategy (for testing)
const htmlResult = await RecipeImportService.importFromURL({
  url: "https://example.com/recipe",
  userId: "user-123",
  forceStrategy: "html-llm", // Skip JSON-LD, go straight to Claude
});
```

### NutritionService

```typescript
import { NutritionService } from "@/services";

// Calculate nutrition for a recipe
const result = await NutritionService.calculateRecipeNutrition({
  ingredients: [
    { name: "farine", quantity: 250, unit: "g" },
    { name: "lait", quantity: 500, unit: "ml" },
    { name: "œuf", quantity: 3, unit: "unité" },
  ],
  servings: 4,
});

if (result.success) {
  console.log("Nutrition per serving:");
  console.log("  Calories:", result.nutrition.perServing.calories);
  console.log("  Protein:", result.nutrition.perServing.protein, "g");
  console.log("  Carbs:", result.nutrition.perServing.carbohydrates, "g");
  console.log("Confidence:", result.nutrition.confidence);
}

// Get nutrition for single ingredient
const ingredientNutrition = await NutritionService.getIngredientNutrition(
  { name: "tomate", quantity: 100, unit: "g" },
  "fr"
);

// Batch recalculate nutrition for recipes
const batchResult = await NutritionService.batchCalculateNutrition([
  "recipe-id-1",
  "recipe-id-2",
  "recipe-id-3",
]);
console.log(`✓ ${batchResult.successful} recipes updated`);
```

### ImageService

```typescript
import { ImageService } from "@/services";

// Search for ingredient image
const result = await ImageService.searchIngredientImage({
  ingredientName: "tomate",
  size: "regular",
  language: "fr",
});

if (result.success) {
  console.log("Image URL:", result.imageUrl);
  console.log("Photographer:", result.attribution?.photographerName);
}

// Batch search
const images = await ImageService.batchSearchIngredientImages([
  "tomate",
  "oignon",
  "ail",
]);
console.log(images); // { tomate: "https://...", oignon: "https://..." }

// Upload custom image
const file = new File([blob], "recipe-cover.jpg");
const uploadResult = await ImageService.uploadImage(
  file,
  `recipes/${recipeId}/cover.jpg`
);
console.log("Uploaded to:", uploadResult.data);

// Download external image and upload to Supabase
const importResult = await ImageService.downloadAndUpload(
  "https://example.com/recipe-image.jpg",
  `recipes/${recipeId}/imported.jpg`
);
```

---

## Service Architecture Pattern

All services follow a consistent pattern:

### Static Methods
Services use static methods (no instantiation needed):

```typescript
// ✅ Correct
const result = await RecipeService.getById(recipeId);

// ❌ Wrong
const service = new RecipeService();
const result = await service.getById(recipeId);
```

### Response Format
All services return `ServiceResponse<T>` or domain-specific result types:

```typescript
type ServiceResponse<T> = {
  data: T | null;
  error: Error | null;
};

// Usage
const { data, error } = await RecipeService.getById(recipeId);
if (error) {
  console.error("Failed:", error.message);
  return;
}
console.log("Recipe:", data);
```

### Error Handling
Services catch errors and return them in the response:

```typescript
static async someMethod(): Promise<ServiceResponse<Data>> {
  try {
    const { data, error } = await supabase.from("table").query();
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error("Unknown error"),
    };
  }
}
```

---

## Environment Variables Required

Make sure these are set in your `.env.local` file:

```env
# Supabase (required for all services)
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Anthropic Claude AI (required for RecipeImportService, NutritionService)
ANTHROPIC_API_KEY=sk-ant-api03-...
```

---

## Cost Optimization Tips

### Recipe Import
The 3-tier strategy automatically optimizes costs:

- **70% free** (JSON-LD extraction)
- **20% at €0.01** (Claude HTML parsing)
- **10% at €0.03** (Claude Vision AI)

**Average cost per import: €0.01-0.02**

To maximize free tier usage:
- Test with popular recipe sites (most have JSON-LD)
- Cache imported recipes to avoid re-importing

### Nutrition Calculation
OpenFoodFacts is free and covers 90%+ of ingredients:

- **90% free** (OpenFoodFacts API)
- **10% at ~€0.001** (Claude AI estimation)

**Average cost per recipe: ~€0.001-0.005**

Nutrition data is cached globally, so subsequent lookups are instant and free.

### Image Search
TheMealDB is 100% free with no rate limits:

- **600+ ingredient images** available
- **Normalized white background** for consistent UI
- **No API key required**

For production, consider:
- Caching popular ingredient images in PostgreSQL
- Expanding the French→English dictionary
- Fallback to default emoji for missing ingredients

---

## Testing

### Unit Tests
Each service should have comprehensive unit tests:

```typescript
// Example: recipeImport.service.test.ts
describe("RecipeImportService", () => {
  it("should extract JSON-LD from recipe page", async () => {
    const result = await RecipeImportService.importFromURL({
      url: "https://www.marmiton.org/recettes/...",
      userId: "test-user",
      skipLimitCheck: true,
    });

    expect(result.success).toBe(true);
    expect(result.strategy).toBe("json-ld");
    expect(result.cost).toBe(0);
  });
});
```

### Integration Tests
Test the complete flow with real APIs:

```typescript
it("should import, calculate nutrition, and fetch images", async () => {
  const recipeId = await importRecipeComplete(testUrl, testUserId);
  expect(recipeId).toBeDefined();

  const { data: recipe } = await RecipeService.getById(recipeId);
  expect(recipe.nutrition).toBeDefined();
  expect(recipe.ingredients[0].imageUrl).toBeDefined();
});
```

---

## Monitoring & Analytics

Track these metrics for production:

### Import Service
- Success rate by strategy (target: 95%+ overall)
- Average cost per import (target: <€0.02)
- Strategy distribution (expect 70/20/10 split)
- Failed imports by domain

### Nutrition Service
- Cache hit rate (target: 80%+)
- OpenFoodFacts vs AI usage (expect 90/10 split)
- Average calculation time
- Confidence scores

### Image Service
- TheMealDB image hit rate (% found)
- French→English translation accuracy
- Storage usage (Supabase bucket size for recipe images)

---

## Future Enhancements

### Planned Features
- [ ] Vision AI screenshot capture (requires Puppeteer)
- [ ] DALL-E image generation fallback
- [ ] Recipe similarity detection (avoid duplicates)
- [ ] Multi-language support (currently French-focused)
- [ ] Bulk import from RSS feeds
- [ ] OCR for physical cookbook scanning

### Performance Optimizations
- [ ] Queue system for batch imports (Bull/BullMQ)
- [ ] Redis caching for hot data
- [ ] CDN for image delivery
- [ ] Parallel ingredient processing

---

For more information, see:
- [API Documentation](../../docs/03-data-model.md)
- [Tech Stack Details](../../docs/02-tech-stack.md)
- [Freemium Strategy](../../docs/06-freemium-strategy.md)
