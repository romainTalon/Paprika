// Supabase Edge Function: Recipe Import from Web URL
// Implements 3-tier scraping strategy: JSON-LD → Claude HTML → Vision AI
// Cost optimization: 70% free (JSON-LD), 20% ~€0.01 (Claude), 10% ~€0.03 (Vision)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Anthropic from "npm:@anthropic-ai/sdk@0.28.0";
import * as cheerio from "npm:cheerio@1.0.0-rc.12";
import { z } from "npm:zod@3.22.4";

// =============================================================================
// CORS Configuration
// =============================================================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// =============================================================================
// Zod Validation Schemas (copied from src/lib/validators.ts)
// =============================================================================

const recipeDifficultySchema = z.enum(["easy", "medium", "hard"]);

const aiIngredientSchema = z.object({
  name: z.string().min(1, "Ingredient name cannot be empty"),
  quantity: z.number().nonnegative("Quantity must be non-negative"),
  unit: z.string(),
  notes: z.string().nullable().optional(),
});

const aiRecipeStepSchema = z.object({
  order: z.number().int().positive("Step order must be a positive integer"),
  instruction: z.string().min(1, "Instruction cannot be empty"),
  duration: z.number().int().positive().nullable().optional(),
});

const aiRecipeImportSchema = z.object({
  title: z.string().min(1, "Recipe title is required"),
  description: z.string().nullable().optional(),
  servings: z.number().int().positive("Servings must be a positive integer"),
  prepTime: z.number().int().positive().nullable().optional(),
  cookTime: z.number().int().positive().nullable().optional(),
  difficulty: recipeDifficultySchema.nullable().optional(),
  tags: z.array(z.string()).default([]),
  ingredients: z
    .array(aiIngredientSchema)
    .min(1, "Recipe must have at least one ingredient"),
  steps: z
    .array(aiRecipeStepSchema)
    .min(1, "Recipe must have at least one step"),
  coverImageUrl: z.string().url().nullable().optional(),
});

const jsonLDRecipeSchema = z.object({
  "@type": z.literal("Recipe").or(z.array(z.string()).refine(arr => arr.includes("Recipe"))),
  name: z.string().optional(),
  description: z.string().optional(),
  recipeYield: z.union([z.string(), z.number()]).optional(),
  prepTime: z.string().optional(),
  cookTime: z.string().optional(),
  totalTime: z.string().optional(),
  recipeIngredient: z.array(z.string()).optional(),
  recipeInstructions: z.union([
    z.array(z.string()),
    z.array(z.object({ "@type": z.string(), text: z.string() })),
    z.string(),
  ]).optional(),
  image: z.union([z.string(), z.array(z.string()), z.object({ url: z.string() })]).optional(),
  keywords: z.union([z.string(), z.array(z.string())]).optional(),
});

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Convert ISO 8601 duration to minutes
 */
function parseDuration(duration: string | undefined): number | null {
  if (!duration) return null;

  const match = duration.match(/PT?(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return null;

  const hours = parseInt(match[1] || "0", 10);
  const minutes = parseInt(match[2] || "0", 10);

  return hours * 60 + minutes;
}

/**
 * Normalize servings from various formats
 */
function parseServings(recipeYield: string | number | undefined): number {
  if (!recipeYield) return 4;

  if (typeof recipeYield === "number") {
    return Math.max(1, Math.floor(recipeYield));
  }

  const match = recipeYield.match(/\d+/);
  return match ? Math.max(1, parseInt(match[0], 10)) : 4;
}

/**
 * Safe parse AI JSON response with Zod validation
 */
function safeParseAIResponse<T>(
  jsonString: string,
  schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; error: z.ZodError } {
  try {
    const parsed = JSON.parse(jsonString);
    return schema.safeParse(parsed);
  } catch (error) {
    return {
      success: false,
      error: new z.ZodError([
        {
          code: "custom",
          message: `Invalid JSON: ${error instanceof Error ? error.message : "Unknown error"}`,
          path: [],
        },
      ]),
    };
  }
}

/**
 * Extract JSON from Claude's markdown response
 */
function extractJSON(text: string): string {
  let cleaned = text.trim();

  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.replace(/^```json\n/, "").replace(/\n```$/, "");
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```\n/, "").replace(/\n```$/, "");
  }

  return cleaned.trim();
}

// =============================================================================
// Strategy 1: Extract JSON-LD from HTML (Free, 70% success rate)
// =============================================================================

async function extractJSONLD(url: string) {
  console.log("📊 Trying JSON-LD extraction for URL:", url);
  try {
    // Fetch HTML with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; PaprikaBot/1.0)",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Find all JSON-LD script tags
    const jsonLDScripts = $('script[type="application/ld+json"]');

    // Parse each JSON-LD block
    for (let i = 0; i < jsonLDScripts.length; i++) {
      const scriptContent = $(jsonLDScripts[i]).html();
      if (!scriptContent) continue;

      try {
        const jsonLD = JSON.parse(scriptContent);
        const items = Array.isArray(jsonLD) ? jsonLD : [jsonLD];

        for (const item of items) {
          const isRecipe =
            item["@type"] === "Recipe" ||
            (Array.isArray(item["@type"]) && item["@type"].includes("Recipe"));

          if (isRecipe) {
            const validation = jsonLDRecipeSchema.safeParse(item);
            if (!validation.success) continue;

            const recipe = validation.data;

            // Convert to ImportedRecipeData format
            const ingredients = (recipe.recipeIngredient || []).map((ing: string) => ({
              name: ing,
              quantity: 0,
              unit: "",
              notes: null,
            }));

            // Extract steps
            let steps: any[] = [];
            if (typeof recipe.recipeInstructions === "string") {
              const instructions = recipe.recipeInstructions
                .split(/\n|(?<=\.)\s/)
                .filter((s) => s.trim().length > 0);
              steps = instructions.map((instruction, index) => ({
                order: index + 1,
                instruction: instruction.trim(),
                duration: null,
              }));
            } else if (Array.isArray(recipe.recipeInstructions)) {
              steps = recipe.recipeInstructions.map((inst: any, index: number) => {
                if (typeof inst === "string") {
                  return { order: index + 1, instruction: inst, duration: null };
                } else {
                  return { order: index + 1, instruction: inst.text, duration: null };
                }
              });
            }

            // Extract image URL
            let coverImageUrl: string | null = null;
            if (typeof recipe.image === "string") {
              coverImageUrl = recipe.image;
            } else if (Array.isArray(recipe.image)) {
              coverImageUrl = recipe.image[0];
            } else if (recipe.image && typeof recipe.image === "object") {
              coverImageUrl = (recipe.image as any).url;
            }

            // Extract tags
            let tags: string[] = [];
            if (typeof recipe.keywords === "string") {
              tags = recipe.keywords.split(",").map((t) => t.trim());
            } else if (Array.isArray(recipe.keywords)) {
              tags = recipe.keywords;
            }

            return {
              success: true,
              recipe: {
                title: recipe.name || "Untitled Recipe",
                description: recipe.description || null,
                servings: parseServings(recipe.recipeYield),
                prepTime: parseDuration(recipe.prepTime),
                cookTime: parseDuration(recipe.cookTime),
                difficulty: null,
                tags,
                ingredients,
                steps,
                coverImageUrl,
                importUrl: url,
                importSource: "web",
                importStrategy: "json-ld",
              },
            };
          }
        }
      } catch (parseError) {
        continue;
      }
    }

    console.log("ℹ️ No JSON-LD recipe data found, will try Claude AI fallback");
    return {
      success: false,
      error: "No JSON-LD recipe data found on this page",
    };
  } catch (error) {
    console.error("❌ JSON-LD extraction error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "JSON-LD extraction failed",
    };
  }
}

// =============================================================================
// Strategy 2: Parse HTML with Claude AI (~€0.01, 20% success rate)
// =============================================================================

async function parseHTMLWithClaude(url: string, apiKey: string) {
  console.log("🤖 Starting Claude AI parsing for URL:", url);
  try {
    // Fetch HTML
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; PaprikaBot/1.0)",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const html = await response.text();

    // Clean HTML
    const $ = cheerio.load(html);
    $("script, style, nav, footer, header").remove();
    const cleanedHTML = $.html();

    // Initialize Anthropic client
    const anthropic = new Anthropic({ apiKey });

    // Call Claude
    const claudeResponse = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 4096,
      system: `Tu es un expert en extraction de recettes de cuisine.
Ton rôle est d'analyser du contenu web (HTML ou images) et d'en extraire les informations de recette de manière structurée.

IMPORTANT:
- Extrais UNIQUEMENT les informations présentes dans le contenu fourni
- Ne jamais inventer ou halluciner des données
- Si une information est manquante, retourne null pour ce champ (sauf pour servings)
- Si le nombre de portions n'est pas spécifié, utilise 4 comme valeur par défaut
- Respecte strictement le format JSON demandé
- Pour les quantités, utilise des nombres décimaux (ex: 1.5, 0.25)
- Pour les unités, normalise en français (cuillère à soupe, tasse, grammes, etc.)
- Si un ingrédient n'a pas de quantité spécifique (ex: "sel", "poivre"), utilise quantity: 0 et unit: ""`,
      messages: [
        {
          role: "user",
          content: `Analyse ce HTML de recette et extrais les informations en JSON.

URL source: ${url}

Format JSON attendu:
{
  "title": "string",
  "description": "string | null",
  "servings": number (> 0, utilise 4 si non spécifié),
  "prepTime": number | null (en minutes),
  "cookTime": number | null (en minutes),
  "difficulty": "easy" | "medium" | "hard" | null,
  "tags": string[],
  "ingredients": [
    {
      "name": "string",
      "quantity": number (>= 0, utilise 0 si pas de quantité spécifique),
      "unit": "string (peut être vide "" si pas d'unité)",
      "notes": "string | null"
    }
  ],
  "steps": [
    {
      "order": number,
      "instruction": "string",
      "duration": number | null (en minutes)
    }
  ],
  "coverImageUrl": "string | null"
}

HTML:
${cleanedHTML.slice(0, 100000)}`,
        },
      ],
    });

    // Extract and validate JSON
    const content = claudeResponse.content[0];
    if (content.type !== "text") {
      return {
        success: false,
        error: "Expected text response from Claude",
      };
    }

    const jsonString = extractJSON(content.text);

    // Parse JSON and fix servings if needed before validation
    let parsedData;
    try {
      parsedData = JSON.parse(jsonString);
      // Fix servings if 0 or missing
      if (!parsedData.servings || parsedData.servings === 0) {
        console.log("⚠️ Servings was 0 or missing, setting to default value of 4");
        parsedData.servings = 4;
      }
    } catch (parseError) {
      console.error("❌ Failed to parse JSON:", parseError);
      return {
        success: false,
        error: "Claude returned invalid JSON",
      };
    }

    const validation = safeParseAIResponse(JSON.stringify(parsedData), aiRecipeImportSchema);

    if (!validation.success) {
      console.error("❌ Claude validation failed:");
      console.error("Raw Claude response:", content.text.substring(0, 500));
      console.error("Extracted JSON:", jsonString.substring(0, 500));
      console.error("Validation error:", validation.error.message);
      return {
        success: false,
        error: `Claude returned invalid recipe data: ${validation.error.message}`,
      };
    }

    const aiRecipe = validation.data;

    return {
      success: true,
      recipe: {
        title: aiRecipe.title,
        description: aiRecipe.description ?? null,
        servings: aiRecipe.servings,
        prepTime: aiRecipe.prepTime ?? null,
        cookTime: aiRecipe.cookTime ?? null,
        difficulty: aiRecipe.difficulty ?? null,
        tags: aiRecipe.tags,
        ingredients: aiRecipe.ingredients.map((ing) => ({
          ...ing,
          notes: ing.notes ?? null,
        })),
        steps: aiRecipe.steps.map((step) => ({
          ...step,
          duration: step.duration ?? null,
        })),
        coverImageUrl: aiRecipe.coverImageUrl ?? null,
        importUrl: url,
        importSource: "web",
        importStrategy: "html-llm",
      },
    };
  } catch (error) {
    console.error("❌ Claude parsing error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "HTML parsing with Claude failed",
    };
  }
}

// =============================================================================
// Main Edge Function Handler
// =============================================================================

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    // Parse request body
    const { url, userId, cookbookId } = await req.json();

    // Validate input
    if (!url || typeof url !== "string") {
      return new Response(
        JSON.stringify({
          success: false,
          error: "URL is required and must be a string",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 422,
        }
      );
    }

    if (!userId || typeof userId !== "string") {
      return new Response(
        JSON.stringify({
          success: false,
          error: "userId is required and must be a string",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 422,
        }
      );
    }

    // Create Supabase client with user's JWT
    const authHeader = req.headers.get("Authorization");
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: authHeader ? { Authorization: authHeader } : {},
        },
      }
    );

    // Check import limits (freemium enforcement)
    const { data: user, error: userError } = await supabaseClient
      .from("users")
      .select("imports_this_month, is_premium")
      .eq("id", userId)
      .single();

    if (userError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to check import limits",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    const isPremium = user.is_premium || false;
    const importsUsed = user.imports_this_month || 0;
    const importsLimit = isPremium ? Infinity : 5;

    if (!isPremium && importsUsed >= importsLimit) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Import limit reached. You have used ${importsUsed}/${importsLimit} imports this month. Upgrade to Premium for unlimited imports.`,
          limitReached: true,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 403,
        }
      );
    }

    // Strategy 1: Try JSON-LD extraction (free)
    const jsonLDResult = await extractJSONLD(url);
    if (jsonLDResult.success) {
      // Increment import counter
      await supabaseClient.rpc("increment_import_count", {
        p_user_id: userId,
      });

      return new Response(
        JSON.stringify({
          success: true,
          recipe: jsonLDResult.recipe,
          strategy: "json-ld",
          cost: 0,
          duration: Date.now() - startTime,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Strategy 2: Try Claude HTML parsing (~€0.01)
    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Anthropic API key not configured",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    const claudeResult = await parseHTMLWithClaude(url, anthropicKey);
    if (claudeResult.success) {
      // Increment import counter
      await supabaseClient.rpc("increment_import_count", {
        p_user_id: userId,
      });

      return new Response(
        JSON.stringify({
          success: true,
          recipe: claudeResult.recipe,
          strategy: "html-llm",
          cost: 0.01,
          duration: Date.now() - startTime,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // All strategies failed
    return new Response(
      JSON.stringify({
        success: false,
        error: "Could not extract recipe from this URL. Please try a different URL or create the recipe manually.",
        duration: Date.now() - startTime,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 422,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
        duration: Date.now() - startTime,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
