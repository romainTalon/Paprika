// Supabase Edge Function: Recipe Import
// 100% AI parsing with DeepSeek V3 (cost-optimized)
// Supports multiple AI models via AI_MODEL env var

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Anthropic from "npm:@anthropic-ai/sdk@0.28.0";
import * as cheerio from "npm:cheerio@1.0.0-rc.12";
import { z } from "npm:zod@3.22.4";

// =============================================================================
// AI Model Configuration
// =============================================================================

type AIProvider = "anthropic" | "openai" | "deepseek";

interface ModelConfig {
  provider: AIProvider;
  model: string;
  costPer1kInputTokens: number;  // in euros
  costPer1kOutputTokens: number; // in euros
}

const AI_MODELS: Record<string, ModelConfig> = {
  "claude-sonnet-4.5": {
    provider: "anthropic",
    model: "claude-sonnet-4-5-20250929",
    costPer1kInputTokens: 0.003,
    costPer1kOutputTokens: 0.015,
  },
  "gpt-4o-mini": {
    provider: "openai",
    model: "gpt-4o-mini",
    costPer1kInputTokens: 0.00015,
    costPer1kOutputTokens: 0.0006,
  },
  "deepseek-chat": {
    provider: "deepseek",
    model: "deepseek-chat",
    costPer1kInputTokens: 0.00014,
    costPer1kOutputTokens: 0.00028,
  },
};

// Default model (can be overridden with AI_MODEL env var)
const DEFAULT_MODEL = "deepseek-chat";

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

// =============================================================================
// Helper Functions
// =============================================================================

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
// AI Model Abstraction
// =============================================================================

/**
 * Call any AI model with unified interface
 */
async function callAIModel(
  modelKey: string,
  systemPrompt: string,
  userPrompt: string,
  apiKeys: { anthropic?: string; openai?: string; deepseek?: string }
): Promise<{ text: string; inputTokens: number; outputTokens: number }> {
  const config = AI_MODELS[modelKey];
  if (!config) {
    throw new Error(`Unknown model: ${modelKey}`);
  }

  console.log(`🤖 Calling ${config.provider} ${config.model}`);

  if (config.provider === "anthropic") {
    if (!apiKeys.anthropic) throw new Error("Anthropic API key not configured");

    const anthropic = new Anthropic({ apiKey: apiKeys.anthropic });
    const response = await anthropic.messages.create({
      model: config.model,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const content = response.content[0];
    if (content.type !== "text") {
      throw new Error("Expected text response from Anthropic");
    }

    return {
      text: content.text,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    };
  }

  if (config.provider === "openai") {
    if (!apiKeys.openai) throw new Error("OpenAI API key not configured");

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKeys.openai}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 4096,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${error}`);
    }

    const data = await response.json();
    return {
      text: data.choices[0].message.content,
      inputTokens: data.usage.prompt_tokens,
      outputTokens: data.usage.completion_tokens,
    };
  }

  if (config.provider === "deepseek") {
    if (!apiKeys.deepseek) throw new Error("DeepSeek API key not configured");

    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKeys.deepseek}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 4096,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`DeepSeek API error: ${error}`);
    }

    const data = await response.json();
    return {
      text: data.choices[0].message.content,
      inputTokens: data.usage.prompt_tokens,
      outputTokens: data.usage.completion_tokens,
    };
  }

  throw new Error(`Unsupported provider: ${config.provider}`);
}

/**
 * Calculate actual cost based on token usage
 */
function calculateCost(modelKey: string, inputTokens: number, outputTokens: number): number {
  const config = AI_MODELS[modelKey];
  const inputCost = (inputTokens / 1000) * config.costPer1kInputTokens;
  const outputCost = (outputTokens / 1000) * config.costPer1kOutputTokens;
  return inputCost + outputCost;
}

// =============================================================================
// AI-Powered HTML Parsing
// =============================================================================

async function parseHTMLWithAI(
  url: string,
  apiKeys: { anthropic?: string; openai?: string; deepseek?: string }
) {
  const modelKey = Deno.env.get("AI_MODEL") || DEFAULT_MODEL;
  console.log(`🤖 Starting AI parsing with ${modelKey} for URL:`, url);
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

    // Prepare prompts
    const systemPrompt = `Tu es un expert en extraction de recettes de cuisine.
Ton rôle est d'analyser du contenu web (HTML ou images) et d'en extraire les informations de recette de manière structurée.

IMPORTANT:
- Extrais UNIQUEMENT les informations présentes dans le contenu fourni
- Ne jamais inventer ou halluciner des données
- Si une information est manquante, retourne null pour ce champ (sauf pour servings)
- Si le nombre de portions n'est pas spécifié, utilise 4 comme valeur par défaut
- Respecte strictement le format JSON demandé
- Pour les quantités, utilise des nombres décimaux (ex: 1.5, 0.25)
- Pour les unités, normalise en français (cuillère à soupe, tasse, grammes, etc.)
- Si un ingrédient n'a pas de quantité spécifique (ex: "sel", "poivre"), utilise quantity: 0 et unit: ""`;

    const userPrompt = `Analyse ce HTML de recette et extrais les informations en JSON.

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
${cleanedHTML.slice(0, 100000)}`;

    // Call AI model (universal)
    const aiResponse = await callAIModel(modelKey, systemPrompt, userPrompt, apiKeys);

    // Calculate actual cost
    const cost = calculateCost(modelKey, aiResponse.inputTokens, aiResponse.outputTokens);
    console.log(`💰 Cost: €${cost.toFixed(6)} (${aiResponse.inputTokens} input + ${aiResponse.outputTokens} output tokens)`);

    const jsonString = extractJSON(aiResponse.text);

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
        error: "AI returned invalid JSON",
      };
    }

    const validation = safeParseAIResponse(JSON.stringify(parsedData), aiRecipeImportSchema);

    if (!validation.success) {
      console.error("❌ AI validation failed:");
      console.error("Raw AI response:", aiResponse.text.substring(0, 500));
      console.error("Extracted JSON:", jsonString.substring(0, 500));
      console.error("Validation error:", validation.error.message);
      return {
        success: false,
        error: `AI returned invalid recipe data: ${validation.error.message}`,
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
        importStrategy: "ai",
      },
      cost,
      modelUsed: modelKey,
    };
  } catch (error) {
    console.error("❌ AI parsing error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "HTML parsing with AI failed",
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

    // Get AI API keys
    const apiKeys = {
      anthropic: Deno.env.get("ANTHROPIC_API_KEY"),
      openai: Deno.env.get("OPENAI_API_KEY"),
      deepseek: Deno.env.get("DEEPSEEK_API_KEY"),
    };

    // Check that required API key is configured
    const modelKey = Deno.env.get("AI_MODEL") || DEFAULT_MODEL;
    const requiredProvider = AI_MODELS[modelKey]?.provider;

    if (requiredProvider === "anthropic" && !apiKeys.anthropic) {
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

    if (requiredProvider === "openai" && !apiKeys.openai) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "OpenAI API key not configured",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    if (requiredProvider === "deepseek" && !apiKeys.deepseek) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "DeepSeek API key not configured",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    // Parse with AI
    const aiResult = await parseHTMLWithAI(url, apiKeys);
    if (aiResult.success) {
      // Increment import counter
      await supabaseClient.rpc("increment_import_count", {
        p_user_id: userId,
      });

      return new Response(
        JSON.stringify({
          success: true,
          recipe: aiResult.recipe,
          strategy: "ai",
          model: aiResult.modelUsed,
          cost: aiResult.cost,
          duration: Date.now() - startTime,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // AI parsing failed
    return new Response(
      JSON.stringify({
        success: false,
        error: aiResult.error || "Could not extract recipe from this URL.",
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
