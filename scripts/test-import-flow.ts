/**
 * Test Script: Complete Recipe Import Flow
 *
 * Tests the entire recipe import pipeline:
 * 1. Import recipe from URL (3-tier strategy)
 * 2. Calculate nutrition
 * 3. Search ingredient images
 * 4. Save to database
 *
 * Usage:
 *   npx tsx scripts/test-import-flow.ts
 */

// Load environment variables from .env.local
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(__dirname, "../.env.local") });
import {
  RecipeImportService,
  NutritionService,
  ImageService,
} from "../src/services";

// Test URLs (popular French recipe sites with JSON-LD)
const TEST_URLS = [
  "https://www.marmiton.org/recettes/recette_pate-a-crepes_12372.aspx",
  "https://www.750g.com/crepes-faciles-r12500.htm",
];

/**
 * Complete recipe import flow
 */
async function testCompleteImport(url: string, userId: string) {
  console.log("\n" + "=".repeat(80));
  console.log(`🧪 TESTING RECIPE IMPORT FROM: ${url}`);
  console.log("=".repeat(80) + "\n");

  try {
    // ============================================================================
    // STEP 1: Check Import Limits
    // ============================================================================
    console.log("📊 Step 1: Checking import limits...");
    const limitStatus = await RecipeImportService.checkImportLimit(userId);

    console.log(`   ✓ Can import: ${limitStatus.canImport}`);
    console.log(`   ✓ Imports used: ${limitStatus.importsUsed}/${limitStatus.importsLimit}`);
    console.log(`   ✓ Remaining: ${limitStatus.importsRemaining}`);
    console.log(`   ✓ Premium: ${limitStatus.isPremium}\n`);

    if (!limitStatus.canImport) {
      console.log("   ❌ Import limit reached! Skipping import.\n");
      return null;
    }

    // ============================================================================
    // STEP 2: Import Recipe
    // ============================================================================
    console.log("🤖 Step 2: Importing recipe from URL...");
    const startTime = Date.now();

    const importResult = await RecipeImportService.importFromURL({
      url,
      userId,
      skipLimitCheck: false, // Test the limit check
    });

    const importDuration = Date.now() - startTime;

    if (!importResult.success || !importResult.recipe) {
      console.log(`   ❌ Import failed: ${importResult.error}\n`);
      return null;
    }

    const recipe = importResult.recipe;

    console.log(`   ✓ Strategy used: ${importResult.strategy}`);
    console.log(`   ✓ Confidence: ${importResult.confidence}`);
    console.log(`   ✓ Cost: €${importResult.cost?.toFixed(3) || 0}`);
    console.log(`   ✓ Duration: ${importDuration}ms`);
    console.log(`   ✓ Title: "${recipe.title}"`);
    console.log(`   ✓ Servings: ${recipe.servings}`);
    console.log(`   ✓ Ingredients: ${recipe.ingredients.length}`);
    console.log(`   ✓ Steps: ${recipe.steps.length}\n`);

    // ============================================================================
    // STEP 3: Calculate Nutrition
    // ============================================================================
    console.log("🥗 Step 3: Calculating nutrition...");
    const nutritionStart = Date.now();

    const nutritionResult = await NutritionService.calculateRecipeNutrition({
      ingredients: recipe.ingredients,
      servings: recipe.servings,
    });

    const nutritionDuration = Date.now() - nutritionStart;

    if (nutritionResult.success && nutritionResult.nutrition) {
      const nutrition = nutritionResult.nutrition.perServing;

      console.log(`   ✓ Ingredients calculated: ${nutritionResult.ingredientsCalculated}`);
      console.log(`   ✓ Ingredients failed: ${nutritionResult.ingredientsFailed}`);
      console.log(`   ✓ Duration: ${nutritionDuration}ms`);
      console.log(`   ✓ Per serving:`);
      console.log(`      - Calories: ${nutrition.calories} kcal`);
      console.log(`      - Protein: ${nutrition.protein}g`);
      console.log(`      - Carbs: ${nutrition.carbohydrates}g`);
      console.log(`      - Fat: ${nutrition.fat}g`);
      console.log(`      - Fiber: ${nutrition.fiber}g`);
      console.log(`   ✓ Confidence: ${(nutritionResult.nutrition.confidence * 100).toFixed(0)}%\n`);

      // Attach nutrition to recipe
      recipe.nutrition = nutritionResult.nutrition;
    } else {
      console.log(`   ⚠️  Nutrition calculation failed: ${nutritionResult.error}\n`);
    }

    // ============================================================================
    // STEP 4: Search Ingredient Images (first 3 ingredients only for speed)
    // ============================================================================
    console.log("🖼️  Step 4: Searching ingredient images (first 3)...");
    const imageStart = Date.now();

    const ingredientNames = recipe.ingredients.slice(0, 3).map((ing) => ing.name);
    const imageMap: Record<string, string> = {};

    for (const name of ingredientNames) {
      const result = await ImageService.searchIngredientImage({
        ingredientName: name,
        size: "regular",
      });

      if (result.success && result.imageUrl) {
        imageMap[name] = result.imageUrl;
        console.log(`   ✓ Found image for "${name}"`);
        if (result.attribution) {
          console.log(`      Photo by ${result.attribution.photographerName} on Unsplash`);
        }
      } else {
        console.log(`   ⚠️  No image found for "${name}"`);
      }

      // Small delay to respect rate limits
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    const imageDuration = Date.now() - imageStart;
    console.log(`   ✓ Duration: ${imageDuration}ms`);
    console.log(`   ✓ Images found: ${Object.keys(imageMap).length}/${ingredientNames.length}\n`);

    // Attach images to ingredients
    recipe.ingredients = recipe.ingredients.map((ing) => ({
      ...ing,
      imageUrl: imageMap[ing.name] || ing.imageUrl,
    }));

    // ============================================================================
    // STEP 5: Save to Database
    // ============================================================================
    console.log("💾 Step 5: Saving recipe to database...");
    const saveStart = Date.now();

    const saveResult = await RecipeImportService.saveImportedRecipe(
      recipe,
      userId
    );

    const saveDuration = Date.now() - saveStart;

    if (saveResult.error || !saveResult.data) {
      console.log(`   ❌ Save failed: ${saveResult.error?.message}\n`);
      return null;
    }

    const recipeId = saveResult.data;
    console.log(`   ✓ Recipe saved with ID: ${recipeId}`);
    console.log(`   ✓ Duration: ${saveDuration}ms\n`);

    // Update with nutrition if available
    if (nutritionResult.success && nutritionResult.nutrition) {
      const updateResult = await NutritionService.updateRecipeNutrition(
        recipeId,
        nutritionResult.nutrition
      );

      if (!updateResult.error) {
        console.log(`   ✓ Nutrition data updated\n`);
      }
    }

    // ============================================================================
    // SUMMARY
    // ============================================================================
    const totalDuration = Date.now() - startTime;

    console.log("📈 SUMMARY");
    console.log("=".repeat(80));
    console.log(`✅ Recipe imported successfully!`);
    console.log(`   Recipe ID: ${recipeId}`);
    console.log(`   Title: ${recipe.title}`);
    console.log(`   Strategy: ${importResult.strategy}`);
    console.log(`   Total cost: €${importResult.cost?.toFixed(3) || 0}`);
    console.log(`   Total time: ${totalDuration}ms`);
    console.log(`   Nutrition: ${nutritionResult.success ? "✓" : "✗"}`);
    console.log(`   Images: ${Object.keys(imageMap).length} found`);
    console.log("=".repeat(80) + "\n");

    return recipeId;
  } catch (error) {
    console.error("\n❌ FATAL ERROR:", error);
    if (error instanceof Error) {
      console.error("   Message:", error.message);
      console.error("   Stack:", error.stack);
    }
    return null;
  }
}

/**
 * Test individual services
 */
async function testIndividualServices() {
  console.log("\n" + "=".repeat(80));
  console.log("🧪 TESTING INDIVIDUAL SERVICES");
  console.log("=".repeat(80) + "\n");

  // Test 1: Anthropic API
  console.log("🤖 Test 1: Anthropic Claude API");
  try {
    const { anthropic, CLAUDE_MODEL } = await import("../src/lib/anthropic");
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 50,
      messages: [{ role: "user", content: "Réponds juste 'OK' si tu me reçois." }],
    });

    const content = response.content[0];
    if (content.type === "text") {
      console.log(`   ✓ Claude répond: "${content.text}"`);
    }
  } catch (error) {
    console.log(`   ❌ Anthropic API failed:`, error instanceof Error ? error.message : error);
  }

  // Test 2: Unsplash API
  console.log("\n🖼️  Test 2: Unsplash API");
  try {
    const result = await ImageService.searchIngredientImage({
      ingredientName: "tomate",
      size: "small",
    });

    if (result.success) {
      console.log(`   ✓ Unsplash fonctionne!`);
      console.log(`   ✓ Image URL: ${result.imageUrl?.substring(0, 60)}...`);
      if (result.attribution) {
        console.log(`   ✓ Photo by: ${result.attribution.photographerName}`);
      }
    } else {
      console.log(`   ❌ Unsplash failed: ${result.error}`);
    }
  } catch (error) {
    console.log(`   ❌ Unsplash API failed:`, error instanceof Error ? error.message : error);
  }

  // Test 3: Supabase Connection
  console.log("\n🗄️  Test 3: Supabase Connection");
  try {
    const { supabase } = await import("../src/lib/supabase");
    const { data, error } = await supabase.from("users").select("id").limit(1);

    if (error) throw error;
    console.log(`   ✓ Supabase connected!`);
    console.log(`   ✓ Can query database`);
  } catch (error) {
    console.log(`   ❌ Supabase failed:`, error instanceof Error ? error.message : error);
  }

  console.log("\n" + "=".repeat(80) + "\n");
}

/**
 * Main test runner
 */
async function main() {
  console.log("\n");
  console.log("╔═══════════════════════════════════════════════════════════════════════════════╗");
  console.log("║                                                                               ║");
  console.log("║                    🧪 PAPRIKA - RECIPE IMPORT TEST SUITE                      ║");
  console.log("║                                                                               ║");
  console.log("╚═══════════════════════════════════════════════════════════════════════════════╝");

  // Check environment variables
  console.log("\n🔐 Checking environment variables...");
  const requiredVars = [
    "EXPO_PUBLIC_SUPABASE_URL",
    "EXPO_PUBLIC_SUPABASE_ANON_KEY",
    "ANTHROPIC_API_KEY",
    "UNSPLASH_ACCESS_KEY",
  ];

  const missing: string[] = [];
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missing.push(varName);
      console.log(`   ❌ ${varName} is missing`);
    } else {
      // Show first 10 chars to verify
      const value = process.env[varName]!;
      const preview = value.substring(0, 15) + "...";
      console.log(`   ✓ ${varName}: ${preview}`);
    }
  }

  if (missing.length > 0) {
    console.log("\n❌ Missing environment variables!");
    console.log("   Please add them to .env.local and restart.\n");
    process.exit(1);
  }

  console.log("   ✓ All required variables present!\n");

  // Test individual services first
  await testIndividualServices();

  // Test complete import flow
  const testUserId = "test-user-" + Date.now();
  console.log(`📝 Using test user ID: ${testUserId}\n`);

  for (const url of TEST_URLS) {
    const recipeId = await testCompleteImport(url, testUserId);

    if (recipeId) {
      console.log(`✅ Recipe imported successfully: ${recipeId}\n`);
    } else {
      console.log(`⚠️  Recipe import skipped or failed\n`);
    }

    // Wait a bit between tests
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  console.log("\n" + "=".repeat(80));
  console.log("🎉 ALL TESTS COMPLETED!");
  console.log("=".repeat(80) + "\n");
}

// Run tests
main().catch((error) => {
  console.error("\n💥 Unhandled error:", error);
  process.exit(1);
});
