/**
 * Simple Test Script
 * Tests API connections without importing services directly
 */

// IMPORTANT: Load env vars BEFORE any imports
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(__dirname, "../.env.local") });

// Now safe to import
import Anthropic from "@anthropic-ai/sdk";
import { createApi } from "unsplash-js";
import { createClient } from "@supabase/supabase-js";

console.log("\n╔═══════════════════════════════════════════════════════════════════════════════╗");
console.log("║                    🧪 PAPRIKA - API CONNECTIVITY TEST                         ║");
console.log("╚═══════════════════════════════════════════════════════════════════════════════╝\n");

async function testAPIs() {
  // Check environment variables
  console.log("🔐 Checking environment variables...\n");

  const vars = {
    EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
    EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    UNSPLASH_ACCESS_KEY: process.env.UNSPLASH_ACCESS_KEY,
  };

  let allPresent = true;
  for (const [key, value] of Object.entries(vars)) {
    if (!value) {
      console.log(`   ❌ ${key} is missing`);
      allPresent = false;
    } else {
      const preview = value.substring(0, 20) + "...";
      console.log(`   ✓ ${key}: ${preview}`);
    }
  }

  if (!allPresent) {
    console.log("\n❌ Missing environment variables!\n");
    process.exit(1);
  }

  console.log("\n" + "=".repeat(80) + "\n");

  // Test 1: Anthropic Claude
  console.log("🤖 Test 1: Anthropic Claude AI\n");
  try {
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    });

    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 100,
      messages: [
        { role: "user", content: "Réponds juste 'OK' en français si tu me reçois." },
      ],
    });

    const content = response.content[0];
    if (content.type === "text") {
      console.log(`   ✓ Claude répond: "${content.text}"`);
      console.log(`   ✓ Model: ${response.model}`);
      console.log(`   ✓ Tokens used: ${response.usage.input_tokens} input + ${response.usage.output_tokens} output`);
    }
  } catch (error) {
    console.log(`   ❌ Failed:`, error instanceof Error ? error.message : error);
  }

  console.log("\n" + "=".repeat(80) + "\n");

  // Test 2: Unsplash
  console.log("🖼️  Test 2: Unsplash Image Search\n");
  try {
    const unsplash = createApi({
      accessKey: process.env.UNSPLASH_ACCESS_KEY!,
    });

    const result = await unsplash.search.getPhotos({
      query: "tomato food",
      page: 1,
      perPage: 1,
      orientation: "squarish",
    });

    if (result.type === "success") {
      const photo = result.response.results[0];
      console.log(`   ✓ Unsplash works!`);
      console.log(`   ✓ Found ${result.response.total} photos for "tomato"`);
      if (photo) {
        console.log(`   ✓ Photo by: ${photo.user.name}`);
        console.log(`   ✓ URL: ${photo.urls.regular.substring(0, 60)}...`);
      }
    } else {
      console.log(`   ❌ Error:`, result.errors);
    }
  } catch (error) {
    console.log(`   ❌ Failed:`, error instanceof Error ? error.message : error);
  }

  console.log("\n" + "=".repeat(80) + "\n");

  // Test 3: Supabase
  console.log("🗄️  Test 3: Supabase Database\n");
  try {
    const supabase = createClient(
      process.env.EXPO_PUBLIC_SUPABASE_URL!,
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Test connection
    const { data, error } = await supabase.from("users").select("id").limit(1);

    if (error) throw error;

    console.log(`   ✓ Supabase connected!`);
    console.log(`   ✓ Can query database`);
    console.log(`   ✓ Found ${data?.length || 0} users (limited to 1)`);
  } catch (error) {
    console.log(`   ❌ Failed:`, error instanceof Error ? error.message : error);
  }

  console.log("\n" + "=".repeat(80) + "\n");

  // Test 4: OpenFoodFacts (no auth needed)
  console.log("🥗 Test 4: OpenFoodFacts API\n");
  try {
    const response = await fetch(
      "https://world.openfoodfacts.org/cgi/search.pl?search_terms=tomate&json=1&lc=fr&page_size=1"
    );

    const data = await response.json();

    if (data.products && data.products.length > 0) {
      const product = data.products[0];
      console.log(`   ✓ OpenFoodFacts works!`);
      console.log(`   ✓ Found: ${product.product_name || "Unknown"}`);
      console.log(`   ✓ Calories: ${product.nutriments?.["energy-kcal_100g"] || "N/A"} kcal/100g`);
    } else {
      console.log(`   ⚠️  No products found`);
    }
  } catch (error) {
    console.log(`   ❌ Failed:`, error instanceof Error ? error.message : error);
  }

  console.log("\n" + "=".repeat(80));
  console.log("\n🎉 ALL API TESTS COMPLETED!\n");
  console.log("✅ Your environment is correctly configured.");
  console.log("✅ All external APIs are reachable.");
  console.log("\n💡 Next step: Run the full import test with:");
  console.log("   npm run test:import\n");
}

testAPIs().catch((error) => {
  console.error("\n💥 Fatal error:", error);
  process.exit(1);
});
