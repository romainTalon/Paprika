/**
 * Nutrition Calculate Edge Function
 *
 * Calculates nutritional information for recipes using a 3-tier strategy:
 * 1. Cache: Check nutrition_cache table
 * 2. OpenFoodFacts: Query free nutrition database
 * 3. AI: Estimate with DeepSeek for unknown ingredients
 *
 * @module supabase/functions/nutrition-calculate
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

// ===== CORS Headers =====
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ===== Types =====
interface NutritionPer100g {
  calories: number; // kcal
  protein: number; // g
  carbohydrates: number; // g
  fat: number; // g
  fiber: number; // g
  sugar: number; // g
}

interface CalculateNutritionRequest {
  recipeId: string;
  userId: string;
  ingredients: Array<{
    name: string;
    quantity: number;
    unit: string;
  }>;
  servings: number;
}

interface CalculateNutritionResponse {
  success: boolean;
  recipeId: string;
  nutrition?: {
    total: NutritionPer100g;
    perServing: NutritionPer100g;
    ingredients: Array<{
      name: string;
      nutrition: NutritionPer100g;
      source: "cache" | "openfoodfacts" | "ai_estimate";
      confidence: number;
    }>;
  };
  cost?: number;
  error?: string;
}

// ===== Unit Conversion =====
// Table de conversion unités → grammes
const UNIT_TO_GRAMS: Record<string, number> = {
  // Poids (toutes variantes françaises)
  "g": 1,
  "gramme": 1,
  "grammes": 1,
  "gr": 1,
  "kg": 1000,
  "kilo": 1000,
  "kilos": 1000,
  "kilogramme": 1000,
  "kilogrammes": 1000,
  "mg": 0.001,
  "milligramme": 0.001,
  "milligrammes": 0.001,

  // Volume (approximations - toutes variantes françaises)
  "ml": 1, // ~1ml eau = 1g
  "millilitre": 1,
  "millilitres": 1,
  "l": 1000,
  "litre": 1000,
  "litres": 1000,
  "cl": 10,
  "centilitre": 10,
  "centilitres": 10,
  "dl": 100,
  "décilitre": 100,
  "décilitres": 100,

  // Cuillères (approximations)
  "cuillère à soupe": 15,
  "cuillères à soupe": 15,
  "cuillere à soupe": 15,
  "cuilleres à soupe": 15,
  "cuillère à café": 5,
  "cuillères à café": 5,
  "cuillere à café": 5,
  "cuilleres à café": 5,
  "c. à soupe": 15,
  "c. à café": 5,
  "càs": 15,
  "càc": 5,
  "cs": 15,
  "cc": 5,

  // Tasses
  "tasse": 240, // ~240ml standard
  "tasses": 240,
  "cup": 240,
  "cups": 240,
  "verre": 200,
  "verres": 200,

  // Pièces (très approximatif)
  "pièce": 150, // dépend BEAUCOUP de l'aliment
  "pièces": 150,
  "piece": 150,
  "pieces": 150,
  "unité": 150,
  "unités": 150,
  "unite": 150,
  "unites": 150,

  // Conditionnements
  "paquet": 500,
  "paquets": 500,
  "boîte": 400,
  "boîtes": 400,
  "boite": 400,
  "boites": 400,
  "sachet": 100,
  "sachets": 100,
  "botte": 100,
  "bottes": 100,
  "petite botte": 100,
  "bouquet": 50,
  "bouquets": 50,

  // Pincée
  "pincée": 1,
  "pincees": 1,
  "pincee": 1,
  "pinch": 1,
};

function convertToGrams(quantity: number, unit: string): number {
  const normalized = unit.toLowerCase().trim();
  const factor = UNIT_TO_GRAMS[normalized];

  if (!factor) {
    console.warn(`⚠️ Unknown unit "${unit}" - using default 100g. Please add to conversion table.`);
    return quantity * 100; // Default fallback
  }

  return quantity * factor;
}

// ===== Cache Helpers =====
async function getCachedNutrition(
  ingredientName: string,
  language: string,
  supabase: any
): Promise<NutritionPer100g | null> {
  const { data, error } = await supabase
    .from("nutrition_cache")
    .select("nutrition_per_100g, confidence, source, usage_count")
    .eq("ingredient_name", ingredientName.toLowerCase())
    .eq("language", language)
    .order("confidence", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return null;

  // Increment usage count
  await supabase
    .from("nutrition_cache")
    .update({ usage_count: data.usage_count + 1 })
    .eq("ingredient_name", ingredientName.toLowerCase())
    .eq("language", language);

  return data.nutrition_per_100g as NutritionPer100g;
}

async function cacheNutrition(
  ingredientName: string,
  language: string,
  nutrition: NutritionPer100g,
  source: string,
  confidence: number,
  supabase: any
): Promise<void> {
  await supabase.from("nutrition_cache").insert({
    ingredient_name: ingredientName.toLowerCase(),
    language,
    nutrition_per_100g: nutrition,
    source,
    confidence: confidence.toFixed(2),
    usage_count: 1,
  });
}

// ===== AI Nutrition Calculation (DeepSeek with full recipe context) =====
interface AIIngredientResult {
  name: string;
  grams: number;
  nutritionPer100g: NutritionPer100g;
  nutritionTotal: NutritionPer100g;
}

interface AIResponse {
  ingredients: AIIngredientResult[];
  total: NutritionPer100g;
  perServing: NutritionPer100g;
}

async function calculateNutritionWithAI(
  recipeTitle: string,
  ingredients: Array<{ name: string; quantity: number; unit: string }>,
  servings: number,
  apiKey: string
): Promise<{ result: AIResponse; cost: number } | null> {
  try {
    // Build ingredients list for prompt
    const ingredientsList = ingredients
      .map((ing) => `- ${ing.quantity} ${ing.unit} de ${ing.name}`)
      .join("\n");

    const prompt = `Tu es un expert en nutrition. Voici une recette:

**Titre:** ${recipeTitle}
**Portions:** ${servings}

**Ingrédients:**
${ingredientsList}

**Ta mission:**
1. Pour chaque ingrédient, identifie le type EXACT selon le contexte de la recette (ex: "crème" dans une soupe = crème liquide 30% MG, pas crème glacée!)
2. Convertis chaque quantité en grammes selon la densité réelle (ex: 250ml de crème liquide ≈ 255g, 250ml d'huile ≈ 230g)
3. Calcule les valeurs nutritionnelles pour 100g de chaque ingrédient
4. Calcule le total pour chaque ingrédient (basé sur les grammes réels)
5. Agrège les totaux pour toute la recette
6. Divise par ${servings} pour obtenir la nutrition par portion

**Réponds UNIQUEMENT avec ce JSON (sans markdown, sans \`\`\`json):**
{
  "ingredients": [
    {
      "name": "nom de l'ingrédient",
      "grams": <nombre de grammes après conversion>,
      "nutritionPer100g": {
        "calories": <kcal>,
        "protein": <g>,
        "carbohydrates": <g>,
        "fat": <g>,
        "fiber": <g>,
        "sugar": <g>
      },
      "nutritionTotal": {
        "calories": <kcal total pour cet ingrédient>,
        "protein": <g total>,
        "carbohydrates": <g total>,
        "fat": <g total>,
        "fiber": <g total>,
        "sugar": <g total>
      }
    }
  ],
  "total": {
    "calories": <kcal total recette>,
    "protein": <g total>,
    "carbohydrates": <g total>,
    "fat": <g total>,
    "fiber": <g total>,
    "sugar": <g total>
  },
  "perServing": {
    "calories": <kcal par portion>,
    "protein": <g par portion>,
    "carbohydrates": <g par portion>,
    "fat": <g par portion>,
    "fiber": <g par portion>,
    "sugar": <g par portion>
  }
}`;

    console.log("🤖 Calling DeepSeek with full recipe context...");

    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content:
              "Tu es un expert en nutrition. Tu réponds UNIQUEMENT avec du JSON valide, sans markdown, sans texte additionnel, sans ```json.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      console.error("❌ DeepSeek API error:", response.status);
      return null;
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content?.trim() || "";

    console.log("📝 AI Response length:", content.length, "chars");

    // Parse JSON (remove markdown if present)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("❌ Invalid AI response format - no JSON found");
      console.error("Response content:", content.substring(0, 500));
      return null;
    }

    const result = JSON.parse(jsonMatch[0]) as AIResponse;

    // Validate response structure
    if (
      !result.ingredients || !result.total || !result.perServing
    ) {
      console.error("❌ Invalid AI response structure");
      return null;
    }

    // Calculate cost
    const inputTokens = data.usage?.prompt_tokens || 0;
    const outputTokens = data.usage?.completion_tokens || 0;
    const cost = (inputTokens / 1000) * 0.00014 +
      (outputTokens / 1000) * 0.00028;

    console.log(`✅ AI calculation successful (${inputTokens} + ${outputTokens} tokens = €${cost.toFixed(4)})`);

    return { result, cost };
  } catch (error) {
    console.error("❌ AI calculation failed:", error);
    return null;
  }
}

// ===== Edge Function Handler =====
serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Debug: Log environment variables (check they exist)
    console.log("🔧 Environment check:", {
      hasSupabaseUrl: !!Deno.env.get("SUPABASE_URL"),
      hasServiceRoleKey: !!Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
      hasDeepseekKey: !!Deno.env.get("DEEPSEEK_API_KEY"),
    });

    // Auth
    const authHeader = req.headers.get("Authorization");
    console.log("🔑 Authorization header present:", !!authHeader);

    if (!authHeader) {
      console.error("❌ Missing Authorization header");
      return new Response(
        JSON.stringify({ success: false, error: "Missing authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error("❌ Missing Supabase credentials:", {
        hasUrl: !!supabaseUrl,
        hasServiceRoleKey: !!supabaseServiceRoleKey,
      });
      return new Response(
        JSON.stringify({
          success: false,
          error: "Server configuration error: Missing Supabase credentials",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create Supabase client with SERVICE_ROLE_KEY (required for auth.getUser() in Edge Functions)
    const supabase = createClient(
      supabaseUrl,
      supabaseServiceRoleKey
    );

    // Extract JWT token from Authorization header
    const token = authHeader.replace("Bearer ", "");
    console.log("🔍 Verifying user token...");

    // Verify user by passing the JWT token directly
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError) {
      console.error("❌ Token verification failed:", {
        error: userError.message,
        status: userError.status,
      });
      return new Response(
        JSON.stringify({
          success: false,
          error: `Invalid token: ${userError.message}`,
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!user) {
      console.error("❌ No user found from token");
      return new Response(
        JSON.stringify({ success: false, error: "No user found" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("✅ User authenticated:", user.id);

    // Parse request
    const requestBody = await req.json() as CalculateNutritionRequest & { recipeTitle?: string };
    const { recipeId, userId, ingredients, servings } = requestBody;
    let recipeTitle = requestBody.recipeTitle || "Recette";

    if (!recipeId || !userId || !ingredients || !servings) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Fetch recipe title if not provided
    if (!requestBody.recipeTitle) {
      const { data: recipe } = await supabase
        .from("recipes")
        .select("title")
        .eq("id", recipeId)
        .single();

      if (recipe) {
        recipeTitle = recipe.title;
      }
    }

    console.log(`📝 Recipe: "${recipeTitle}" (${servings} portions, ${ingredients.length} ingredients)`);


    // Get API keys
    const deepseekApiKey = Deno.env.get("DEEPSEEK_API_KEY");
    if (!deepseekApiKey) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing DEEPSEEK_API_KEY" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Calculate nutrition with AI (single call with full context)
    const aiResult = await calculateNutritionWithAI(
      recipeTitle,
      ingredients,
      servings,
      deepseekApiKey
    );

    if (!aiResult) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to calculate nutrition with AI",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { result, cost } = aiResult;
    const { total, perServing } = result;

    // Log results
    console.log(`\n📊 RESULTS:`);
    console.log(`  Total: ${total.calories.toFixed(0)} kcal, ${total.protein.toFixed(1)}g protein`);
    console.log(`  Per serving: ${perServing.calories.toFixed(0)} kcal, ${perServing.protein.toFixed(1)}g protein`);
    console.log(`  💰 Cost: €${cost.toFixed(4)}`);

    // Save to recipe
    const { error: updateError } = await supabase
      .from("recipes")
      .update({
        nutrition: {
          total,
          perServing,
          ingredients: result.ingredients,
          calculatedAt: new Date().toISOString(),
          source: "deepseek_ai",
        },
      })
      .eq("id", recipeId)
      .eq("user_id", userId);

    if (updateError) {
      console.error("❌ Failed to save nutrition:", updateError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to save nutrition" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`✅ Nutrition saved successfully!`);

    return new Response(
      JSON.stringify({
        success: true,
        recipeId,
        nutrition: {
          total,
          perServing,
          ingredients: result.ingredients,
        },
        cost,
      } as CalculateNutritionResponse),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Nutrition calculation error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Internal server error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
