/**
 * Anthropic Claude AI Client Wrapper
 *
 * This module provides a configured Claude AI client and utility functions
 * for recipe import and nutrition calculation tasks.
 *
 * @module lib/anthropic
 */

import Anthropic from "@anthropic-ai/sdk";

// Environment variable validation
const apiKey = process.env.ANTHROPIC_API_KEY;

if (!apiKey) {
  throw new Error(
    "Missing Anthropic API key. " +
      "Please ensure ANTHROPIC_API_KEY is set in your environment variables."
  );
}

/**
 * Anthropic client instance configured with API key
 *
 * @example
 * ```typescript
 * import { anthropic } from "@/lib/anthropic";
 *
 * const response = await anthropic.messages.create({
 *   model: "claude-3-5-sonnet-20241022",
 *   max_tokens: 4096,
 *   messages: [{ role: "user", content: "Hello!" }]
 * });
 * ```
 */
export const anthropic = new Anthropic({
  apiKey,
});

/**
 * Claude model to use for recipe import and nutrition tasks
 * Claude 3.5 Sonnet offers the best balance of:
 * - 200K token context window (handles large HTML pages)
 * - Excellent structured output (JSON generation)
 * - Vision capabilities (screenshot parsing)
 * - Cost-effectiveness (~€0.01-0.03 per import)
 *
 * Latest model: claude-3-5-sonnet-20241022
 */
export const CLAUDE_MODEL = "claude-3-5-sonnet-20241022" as const;

/**
 * Default token limits for different tasks
 */
export const TOKEN_LIMITS = {
  /** Recipe import from HTML (needs detailed output) */
  RECIPE_IMPORT: 4096,
  /** Nutrition calculation (shorter responses) */
  NUTRITION: 2048,
  /** Vision AI screenshot parsing */
  VISION: 4096,
  /** Ingredient normalization */
  INGREDIENT_NORMALIZE: 1024,
} as const;

/**
 * System prompts for different AI tasks
 */
export const SYSTEM_PROMPTS = {
  RECIPE_IMPORT: `Tu es un expert en extraction de recettes de cuisine.
Ton rôle est d'analyser du contenu web (HTML ou images) et d'en extraire les informations de recette de manière structurée.

IMPORTANT:
- Extrais UNIQUEMENT les informations présentes dans le contenu fourni
- Ne jamais inventer ou halluciner des données
- Si une information est manquante, retourne null pour ce champ
- Respecte strictement le format JSON demandé
- Pour les quantités, utilise des nombres décimaux (ex: 1.5, 0.25)
- Pour les unités, normalise en français (cuillère à soupe, tasse, grammes, etc.)`,

  NUTRITION: `Tu es un nutritionniste expert.
Ton rôle est d'estimer les valeurs nutritionnelles d'ingrédients alimentaires.

IMPORTANT:
- Base tes estimations sur des données nutritionnelles réelles
- Fournis des valeurs par 100g pour la cohérence
- Indique un niveau de confiance (0.0 à 1.0)
- Si tu n'es pas sûr, indique une confiance faible
- Retourne les valeurs en JSON structuré`,

  INGREDIENT_NORMALIZE: `Tu es un expert en normalisation d'ingrédients de cuisine.
Ton rôle est de convertir des descriptions d'ingrédients en texte libre vers un format structuré.

IMPORTANT:
- Sépare la quantité, l'unité et le nom de l'ingrédient
- Convertis les nombres textuels en chiffres (ex: "deux" → 2)
- Normalise les unités (ex: "c. à soupe" → "cuillère à soupe")
- Gère les quantités approximatives (ex: "une pincée" → 0.5g)`,
} as const;

/**
 * Creates a Claude message for recipe import from HTML
 *
 * @param html - The HTML content to parse
 * @param url - Original URL (for context)
 * @returns Promise resolving to Claude's response
 *
 * @example
 * ```typescript
 * const response = await parseRecipeFromHTML(htmlContent, "https://example.com/recipe");
 * const recipe = JSON.parse(response.content[0].text);
 * ```
 */
export async function parseRecipeFromHTML(
  html: string,
  url: string
): Promise<Anthropic.Message> {
  return anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: TOKEN_LIMITS.RECIPE_IMPORT,
    system: SYSTEM_PROMPTS.RECIPE_IMPORT,
    messages: [
      {
        role: "user",
        content: `Analyse ce HTML de recette et extrais les informations en JSON.

URL source: ${url}

Format JSON attendu:
{
  "title": "string",
  "description": "string | null",
  "servings": number,
  "prepTime": number | null (en minutes),
  "cookTime": number | null (en minutes),
  "difficulty": "easy" | "medium" | "hard" | null,
  "tags": string[],
  "ingredients": [
    {
      "name": "string",
      "quantity": number,
      "unit": "string",
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
${html.slice(0, 100000)}`// Limit HTML to ~100K tokens to stay within context window
      },
    ],
  });
}

/**
 * Creates a Claude message for recipe import from screenshot
 *
 * @param imageBase64 - Base64-encoded screenshot
 * @param url - Original URL (for context)
 * @returns Promise resolving to Claude's response
 *
 * @example
 * ```typescript
 * const response = await parseRecipeFromScreenshot(base64Image, "https://example.com/recipe");
 * const recipe = JSON.parse(response.content[0].text);
 * ```
 */
export async function parseRecipeFromScreenshot(
  imageBase64: string,
  url: string
): Promise<Anthropic.Message> {
  return anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: TOKEN_LIMITS.VISION,
    system: SYSTEM_PROMPTS.RECIPE_IMPORT,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: "image/png",
              data: imageBase64,
            },
          },
          {
            type: "text",
            text: `Analyse cette capture d'écran de recette et extrais les informations en JSON.

URL source: ${url}

Format JSON attendu:
{
  "title": "string",
  "description": "string | null",
  "servings": number,
  "prepTime": number | null (en minutes),
  "cookTime": number | null (en minutes),
  "difficulty": "easy" | "medium" | "hard" | null,
  "tags": string[],
  "ingredients": [
    {
      "name": "string",
      "quantity": number,
      "unit": "string",
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
}`,
          },
        ],
      },
    ],
  });
}

/**
 * Normalizes an ingredient description into structured data
 *
 * @param ingredientText - Free-form ingredient text (e.g., "2 large tomatoes, diced")
 * @returns Promise resolving to normalized ingredient data
 *
 * @example
 * ```typescript
 * const normalized = await normalizeIngredient("2 grosses tomates coupées en dés");
 * // { name: "tomate", quantity: 2, unit: "unité", notes: "grosses, coupées en dés" }
 * ```
 */
export async function normalizeIngredient(
  ingredientText: string
): Promise<Anthropic.Message> {
  return anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: TOKEN_LIMITS.INGREDIENT_NORMALIZE,
    system: SYSTEM_PROMPTS.INGREDIENT_NORMALIZE,
    messages: [
      {
        role: "user",
        content: `Normalise cet ingrédient en JSON:

"${ingredientText}"

Format JSON attendu:
{
  "name": "string (nom de l'ingrédient sans quantité ni notes)",
  "quantity": number,
  "unit": "string (gramme, ml, cuillère à soupe, tasse, unité, pincée, etc.)",
  "notes": "string | null (précisions: 'coupé en dés', 'bio', 'à température ambiante', etc.)"
}`,
      },
    ],
  });
}

/**
 * Estimates nutrition information for an ingredient
 *
 * @param ingredientName - Name of the ingredient
 * @param quantity - Quantity in grams
 * @returns Promise resolving to nutrition estimate
 *
 * @example
 * ```typescript
 * const nutrition = await estimateNutrition("tomate", 100);
 * // { calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2, ... }
 * ```
 */
export async function estimateNutrition(
  ingredientName: string,
  quantity: number
): Promise<Anthropic.Message> {
  return anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: TOKEN_LIMITS.NUTRITION,
    system: SYSTEM_PROMPTS.NUTRITION,
    messages: [
      {
        role: "user",
        content: `Estime les valeurs nutritionnelles pour cet ingrédient:

Ingrédient: ${ingredientName}
Quantité: ${quantity}g

Format JSON attendu (valeurs par 100g):
{
  "calories": number,
  "protein": number (en grammes),
  "carbohydrates": number (en grammes),
  "fat": number (en grammes),
  "fiber": number (en grammes),
  "sugar": number (en grammes),
  "confidence": number (0.0 à 1.0, ton niveau de certitude)
}`,
      },
    ],
  });
}

/**
 * Helper to extract JSON from Claude's response
 *
 * Claude sometimes wraps JSON in markdown code blocks.
 * This function extracts the actual JSON string.
 *
 * @param response - Claude's message response
 * @returns Extracted JSON string
 *
 * @example
 * ```typescript
 * const response = await parseRecipeFromHTML(html, url);
 * const jsonString = extractJSON(response);
 * const recipe = JSON.parse(jsonString);
 * ```
 */
export function extractJSON(response: Anthropic.Message): string {
  const content = response.content[0];

  if (content.type !== "text") {
    throw new Error("Expected text response from Claude");
  }

  let text = content.text.trim();

  // Remove markdown code block if present
  if (text.startsWith("```json")) {
    text = text.replace(/^```json\n/, "").replace(/\n```$/, "");
  } else if (text.startsWith("```")) {
    text = text.replace(/^```\n/, "").replace(/\n```$/, "");
  }

  return text.trim();
}
