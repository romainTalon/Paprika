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
// Allowed Recipe Tags (predefined list)
// =============================================================================
// IMPORTANT: Keep this synchronized with src/constants/recipeTags.ts

const ALLOWED_TAGS = [
  // Cuisine
  "Française", "Italienne", "Asiatique", "Mexicaine", "Japonaise",
  "Indienne", "Méditerranéenne", "Américaine", "Thaïlandaise",
  "Chinoise", "Libanaise", "Espagnole",

  // Régime
  "Végétarien", "Végétalien", "Sans gluten", "Sans lactose",
  "Cétogène", "Paléo", "Protéiné", "Faible en calories",
  "Halal", "Casher",

  // Type
  "Entrée", "Plat principal", "Accompagnement", "Dessert",
  "Petit-déjeuner", "Apéritif", "Soupe", "Salade",
  "Pâtisserie", "Snack", "Boisson",

  // Vitesse
  "Express (<15 min)", "Rapide (<30 min)", "Modéré (<1h)",
  "Long (>1h)", "Batch cooking", "À l'avance", "One pot",

  // Occasion
  "Quotidien", "Week-end", "Fête", "Noël", "Pâques",
  "Été", "Hiver", "Pique-nique", "BBQ", "Romantique",

  // Méthode
  "Four", "Poêle", "Casserole", "Mijoteuse", "Air fryer",
  "Autocuiseur", "Grill", "Cru", "Sans cuisson", "Fermentation"
];

// =============================================================================
// CORS Configuration
// =============================================================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// =============================================================================
// Supabase Storage Configuration
// =============================================================================

const STORAGE_BUCKET = "recipe-images";

// =============================================================================
// Zod Validation Schemas (copied from src/lib/validators.ts)
// =============================================================================

const recipeDifficultySchema = z.enum(["easy", "medium", "hard"]);

const aiIngredientSchema = z.object({
  name: z.string().min(1, "Ingredient name cannot be empty"),
  quantity: z.number().nonnegative("Quantity must be non-negative"),
  unit: z.string(),
  notes: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
});

const aiRecipeStepSchema = z.object({
  order: z.number().int().positive("Step order must be a positive integer"),
  instruction: z.string().min(1, "Instruction cannot be empty"),
  duration: z.number().int().positive().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
});

const aiRecipeImportSchema = z
  .object({
    title: z.string().min(1, "Recipe title is required"),
    description: z.string().nullable().optional(),
    servings: z.number().int().positive("Servings must be a positive integer"),
    prepTime: z.number().int().positive().nullable().optional(),
    cookTime: z.number().int().positive().nullable().optional(),
    difficulty: recipeDifficultySchema.nullable().optional(),
    tags: z.array(z.string()).default([]),
    ingredients: z.array(aiIngredientSchema).min(0), // ✅ Can be empty (partial import)
    steps: z.array(aiRecipeStepSchema).min(0), // ✅ Can be empty (partial import)
    coverImageUrl: z.string().nullable().optional(),
  })
  .refine((data) => data.ingredients.length > 0 || data.steps.length > 0, {
    message: "Recipe must have at least ingredients OR steps (not both empty)",
    path: ["ingredients"], // Show error on ingredients field
  });

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Download image from URL and upload to Supabase Storage
 * Returns the permanent Supabase Storage URL
 *
 * NOTE: Uses admin client with SERVICE_ROLE_KEY to bypass RLS policies
 *
 * Storage structure: recipes/{userId}/{recipeId}-{timestamp}.{ext}
 */
async function downloadAndUploadImage(
  imageUrl: string,
  recipeId: string,
  userId: string
): Promise<string | null> {
  try {
    console.log(`📥 Downloading image from: ${imageUrl}`);

    // Fetch the image
    const response = await fetch(imageUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; PaprikaBot/1.0)",
      },
    });

    if (!response.ok) {
      console.error(`❌ Failed to fetch image: ${response.status}`);
      return null;
    }

    // Get content type to determine file extension
    const contentType = response.headers.get("content-type") || "image/jpeg";
    const extension = contentType.includes("png") ? "png" : "jpg";

    // Get the image blob
    const blob = await response.blob();

    // Generate unique filename organized by user
    const filename = `${recipeId}-${Date.now()}.${extension}`;
    const storagePath = `recipes/${userId}/${filename}`;

    console.log(`⬆️  Uploading to Supabase Storage: ${storagePath}`);

    // Create admin client with SERVICE_ROLE_KEY to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Upload to Supabase Storage using admin client
    const { data, error } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, blob, {
        contentType,
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("❌ Upload error:", error);
      return null;
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabaseAdmin.storage.from(STORAGE_BUCKET).getPublicUrl(data.path);

    console.log(`✅ Image uploaded successfully: ${publicUrl}`);
    return publicUrl;
  } catch (error) {
    console.error("❌ Download and upload failed:", error);
    return null;
  }
}

/**
 * Convert relative URL to absolute URL using base URL
 */
function resolveUrl(urlString: string, baseUrl: string): string {
  try {
    return new URL(urlString, baseUrl).href;
  } catch {
    return urlString;
  }
}

/**
 * Check if a string is a valid URL (absolute or relative)
 * Returns the absolute URL if valid, null otherwise
 */
function normalizeImageUrl(str: string | null | undefined, baseUrl: string): string | null {
  if (!str || str === "") return null;

  try {
    // Try as absolute URL first
    const url = new URL(str);
    if (url.protocol === "http:" || url.protocol === "https:") {
      return url.href;
    }
    return null;
  } catch {
    // Try as relative URL
    if (str.startsWith("/") || str.startsWith("./") || str.startsWith("../")) {
      try {
        const absoluteUrl = new URL(str, baseUrl);
        return absoluteUrl.href;
      } catch {
        return null;
      }
    }
    return null;
  }
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
// URL Type Detection (Instagram, TikTok, Web)
// =============================================================================

type URLType = "instagram" | "tiktok" | "web";

interface URLDetectionResult {
  type: URLType;
  isValid: boolean;
  metadata?: {
    postId?: string;
    username?: string;
  };
}

/**
 * Detect if URL is from Instagram, TikTok, or regular web
 */
function detectURLType(url: string): URLDetectionResult {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();

    // Instagram detection
    if (hostname.includes("instagram.com")) {
      // Patterns: /p/{post_id}/ or /reel/{reel_id}/
      const postMatch = urlObj.pathname.match(/\/(p|reel)\/([A-Za-z0-9_-]+)/);
      if (postMatch) {
        return {
          type: "instagram",
          isValid: true,
          metadata: { postId: postMatch[2] },
        };
      }
      return { type: "instagram", isValid: false };
    }

    // TikTok detection
    if (hostname.includes("tiktok.com")) {
      // Pattern: /@{username}/video/{video_id}
      const videoMatch = urlObj.pathname.match(/\/@([^/]+)\/video\/(\d+)/);
      if (videoMatch) {
        return {
          type: "tiktok",
          isValid: true,
          metadata: {
            username: videoMatch[1],
            postId: videoMatch[2],
          },
        };
      }
      return { type: "tiktok", isValid: false };
    }

    // Regular web
    return { type: "web", isValid: true };
  } catch (error) {
    return { type: "web", isValid: false };
  }
}

// =============================================================================
// Instagram Extraction
// =============================================================================

interface SocialMediaExtraction {
  success: boolean;
  description?: string;
  imageUrl?: string;
  error?: string;
}

/**
 * Extract recipe description from Instagram post/reel
 * Uses HTML scraping (direct approach, faster than API trick)
 */
async function extractFromInstagram(url: string): Promise<SocialMediaExtraction> {
  try {
    // Direct HTML scraping with 15s timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        success: false,
        error: `Instagram blocked request: HTTP ${response.status}`,
      };
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    let description = "";
    let imageUrl = "";

    // Strategy 1: Try to find JSON-LD script
    $('script[type="application/ld+json"]').each((_, element) => {
      try {
        const jsonData = JSON.parse($(element).html() || "{}");
        if (jsonData.articleBody) {
          description = jsonData.articleBody;
        }
      } catch (e) {
        // Ignore parse errors
      }
    });

    // Strategy 2: Try to find window._sharedData or embedded JSON in scripts
    if (!description) {
      $("script").each((_, element) => {
        const scriptContent = $(element).html() || "";

        // Look for various Instagram data patterns
        const patterns = [
          /"caption"\s*:\s*{\s*"text"\s*:\s*"([^"]+)"/,
          /"edge_media_to_caption"\s*:\s*{\s*"edges"\s*:\s*\[\s*{\s*"node"\s*:\s*{\s*"text"\s*:\s*"([^"]+)"/,
          /"description"\s*:\s*"([^"]+)"/,
          /window\._sharedData\s*=\s*({.+?});/,
        ];

        for (const pattern of patterns) {
          const match = scriptContent.match(pattern);
          if (match && match[1]) {
            // For _sharedData, we need to parse the whole JSON
            if (pattern.source.includes("_sharedData")) {
              try {
                const sharedData = JSON.parse(match[1]);
                const postData =
                  sharedData?.entry_data?.PostPage?.[0]?.graphql?.shortcode_media;
                if (postData?.edge_media_to_caption?.edges?.[0]?.node?.text) {
                  description =
                    postData.edge_media_to_caption.edges[0].node.text;
                  return false;
                }
              } catch (e) {
                // Silently ignore parse errors
              }
            } else {
              // For simple patterns, use the captured text
              description = match[1]
                .replace(/\\n/g, "\n")
                .replace(/\\"/g, '"')
                .replace(/\\\\/g, "\\");
              return false;
            }
          }
        }
      });
    }

    // Strategy 3: Fallback to meta tags
    if (!description) {
      const ogDescription = $('meta[property="og:description"]').attr("content");
      const twitterDescription = $('meta[name="twitter:description"]').attr(
        "content"
      );
      description = ogDescription || twitterDescription || "";
    }

    // Get image (avoid video thumbnails with play button)
    // Priority: 1. display_url from JSON (clean image) 2. og:image (may have play button)
    console.log("🔍 Searching for clean image URL without play button overlay...");

    // Debug: Log scripts with Instagram Polaris data (modern structure)
    let scriptCount = 0;
    $("script").each((_, element) => {
      const scriptContent = $(element).html() || "";
      scriptCount++;

      // Look specifically for Instagram Polaris media data
      if (scriptContent.includes("xig_polaris_media") || scriptContent.includes("PolarisVideoMedia")) {
        console.log(`📋 Script #${scriptCount} contains Polaris media data (first 3000 chars):`, scriptContent.substring(0, 3000));
      }
    });

    $("script").each((_, element) => {
      const scriptContent = $(element).html() || "";

      // Try to extract from modern Instagram Polaris structure
      if (scriptContent.includes("xig_polaris_media")) {
        try {
          console.log("🔍 Found xig_polaris_media, parsing...");

          // Extract video_image.uri (for Reels/Videos - without play button overlay)
          const videoImageMatch = scriptContent.match(/"video_image":\s*{\s*"uri":\s*"([^"]+)"/);
          if (videoImageMatch && videoImageMatch[1]) {
            const cleanUrl = videoImageMatch[1]
              .replace(/\\\//g, "/")
              .replace(/\\u0026/g, "&")
              .replace(/\\u00253D/g, "=");

            // Verify it doesn't have cmp1_ (composite overlay with play button)
            if (!cleanUrl.includes("cmp1_")) {
              console.log(`✅ Found clean video_image.uri from Polaris (no play button): ${cleanUrl.substring(0, 100)}...`);
              imageUrl = cleanUrl;
              return false;
            } else {
              console.log("⚠️  video_image.uri has cmp1_ overlay, skipping");
            }
          }

          // Fallback: Try image_versions2 for photos
          const imageMatch = scriptContent.match(/"image_versions2":\s*{\s*"candidates":\s*\[\s*{\s*"url":\s*"([^"]+)"/);
          if (imageMatch && imageMatch[1]) {
            const cleanUrl = imageMatch[1].replace(/\\\//g, "/");
            console.log(`✅ Found image from Polaris image_versions2: ${cleanUrl.substring(0, 100)}...`);
            imageUrl = cleanUrl;
            return false;
          }
        } catch (e) {
          console.error("❌ Error parsing Polaris data:", e);
        }
      }

      // Instagram modern structure: look for various image URL patterns
      const displayUrlPatterns = [
        // Standard display_url (most common)
        /"display_url"\s*:\s*"([^"]+)"/,
        /"display_src"\s*:\s*"([^"]+)"/,

        // Video poster/cover images (without play button)
        /"video_url"\s*:\s*"[^"]+",\s*"thumbnail_src"\s*:\s*"([^"]+)"/,
        /"poster"\s*:\s*"([^"]+)"/,
        /"cover_frame_url"\s*:\s*"([^"]+)"/,

        // Image candidates (Instagram stores multiple sizes)
        /"image_versions2"\s*:\s*{\s*"candidates"\s*:\s*\[\s*{\s*"url"\s*:\s*"([^"]+)"/,

        // Carousel media
        /"carousel_media"\s*:\s*\[.*?"image_versions2".*?"url"\s*:\s*"([^"]+)"/,
      ];

      for (const pattern of displayUrlPatterns) {
        const match = scriptContent.match(pattern);
        if (match && match[1]) {
          // Clean the URL (unescape if needed)
          const cleanUrl = match[1]
            .replace(/\\u0026/g, "&")
            .replace(/\\\//g, "/")
            .replace(/\\"/g, '"');

          // Verify it's not the same as og:image (which has play button)
          const ogImage = $('meta[property="og:image"]').attr("content");
          if (cleanUrl !== ogImage) {
            console.log(`✅ Found clean image URL via pattern: ${pattern.source.substring(0, 50)}...`);
            imageUrl = cleanUrl;
            return false; // Stop searching once found
          }
        }
      }

      // Try to extract from window._sharedData (legacy Instagram)
      const sharedDataMatch = scriptContent.match(/window\._sharedData\s*=\s*({.+?});/);
      if (sharedDataMatch) {
        try {
          const sharedData = JSON.parse(sharedDataMatch[1]);
          const postData =
            sharedData?.entry_data?.PostPage?.[0]?.graphql?.shortcode_media;

          // For images: use display_url
          if (postData?.display_url) {
            console.log("✅ Found display_url in window._sharedData");
            imageUrl = postData.display_url;
            return false;
          }

          // For videos: try to get the best display_resources (without overlay)
          if (postData?.is_video && postData?.display_resources) {
            // Get the largest display resource (better quality)
            const bestResource = postData.display_resources[postData.display_resources.length - 1];
            if (bestResource?.src) {
              console.log("✅ Found video display_resources in window._sharedData");
              imageUrl = bestResource.src;
              return false;
            }
          }
        } catch (e) {
          // Silently ignore parse errors
        }
      }

      // Try modern Instagram __additionalDataLoaded patterns
      const additionalDataMatch = scriptContent.match(/__additionalDataLoaded\s*\([^,]+,\s*({.+?})\)/);
      if (additionalDataMatch) {
        try {
          const data = JSON.parse(additionalDataMatch[1]);
          // Navigate through possible paths
          const items = data?.items || data?.data?.xdt_api__v1__media__shortcode__web_info?.items;
          if (items && items.length > 0) {
            const item = items[0];
            // For carousel/albums, get first item
            const mediaItem = item.carousel_media?.[0] || item;

            // Image versions with candidates
            const foundImageUrl = mediaItem?.image_versions2?.candidates?.[0]?.url;
            if (foundImageUrl) {
              console.log("✅ Found image URL in __additionalDataLoaded");
              imageUrl = foundImageUrl;
              return false;
            }
          }
        } catch (e) {
          // Silently ignore parse errors
        }
      }
    });

    // Fallback to og:image if no display_url found
    if (!imageUrl) {
      console.log("⚠️  No clean image found, falling back to og:image (may have play button overlay)");
      const ogImage = $('meta[property="og:image"]').attr("content");
      imageUrl = ogImage || "";
    } else {
      console.log(`✅ Using clean image URL: ${imageUrl.substring(0, 100)}...`);
    }

    if (description) {
      // Check if description is too short and doesn't contain recipe keywords
      const hasRecipeKeywords = /ingredient|instruction|recipe|recette|étape|step/i.test(
        description
      );

      if (description.length < 500 && !hasRecipeKeywords) {
        console.log(
          "⚠️ Description too short and no recipe keywords - Instagram limitation"
        );
        return {
          success: false,
          error:
            "Cette recette Instagram ne peut pas être importée automatiquement. Instagram limite l'accès aux données complètes pour cette publication.",
        };
      }

      return {
        success: true,
        description: description,
        imageUrl: imageUrl || undefined,
      };
    }

    return {
      success: false,
      error: "Could not extract caption from Instagram post",
    };
  } catch (error) {
    console.error("❌ Instagram extraction failed:", error);

    // Handle abort errors gracefully
    if (error instanceof Error && error.name === "AbortError") {
      return {
        success: false,
        error: "Instagram request timeout (15s exceeded)",
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Instagram HTML scraping failed",
    };
  }
}

// =============================================================================
// TikTok Extraction
// =============================================================================

/**
 * Extract recipe description from TikTok video
 * Uses JSON embed + fallback to meta tags
 */
async function extractFromTikTok(url: string): Promise<SocialMediaExtraction> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        success: false,
        error: `TikTok blocked request: HTTP ${response.status}`,
      };
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // TikTok stores data in <script id="__UNIVERSAL_DATA_FOR_REHYDRATION__">
    const scriptData = $('#__UNIVERSAL_DATA_FOR_REHYDRATION__').html();

    if (scriptData) {
      try {
        const jsonData = JSON.parse(scriptData);
        const videoDetail = jsonData?.__DEFAULT_SCOPE__?.["webapp.video-detail"];
        const videoInfo = videoDetail?.itemInfo?.itemStruct;

        const description = videoInfo?.desc;
        const imageUrl = videoInfo?.video?.cover || videoInfo?.video?.dynamicCover;

        if (description) {
          return {
            success: true,
            description: description,
            imageUrl: imageUrl || undefined,
          };
        }
      } catch (parseError) {
        console.warn("⚠️ TikTok JSON parsing failed, trying meta tags");
      }
    }

    // Fallback to meta tags
    const ogDescription = $('meta[property="og:description"]').attr("content");
    const twitterDescription = $('meta[name="twitter:description"]').attr("content");
    const ogImage = $('meta[property="og:image"]').attr("content");

    const description = ogDescription || twitterDescription;

    if (description) {
      return {
        success: true,
        description: description,
        imageUrl: ogImage || undefined,
      };
    }

    return {
      success: false,
      error: "Could not extract caption from TikTok video",
    };
  } catch (error) {
    console.error("❌ TikTok extraction failed:", error);

    // Handle abort errors gracefully
    if (error instanceof Error && error.name === "AbortError") {
      return {
        success: false,
        error: "TikTok request timeout (15s exceeded)",
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "TikTok extraction failed",
    };
  }
}

// =============================================================================
// AI-Powered Text Parsing (for Social Media)
// =============================================================================

/**
 * Parse plain text description into recipe structure using AI
 * Optimized for Instagram/TikTok short descriptions
 * Accepts partial recipes (ingredients OR steps, not necessarily both)
 */
async function parseTextWithAI(
  description: string,
  imageUrl: string | undefined,
  sourceUrl: string,
  sourcePlatform: "instagram" | "tiktok",
  apiKeys: { anthropic?: string; openai?: string; deepseek?: string },
  userId: string
) {
  const modelKey = Deno.env.get("AI_MODEL") || DEFAULT_MODEL;
  const startTime = Date.now();

  try {
    const platformName = sourcePlatform === "instagram" ? "Instagram" : "TikTok";

    const systemPrompt = `Tu es un expert en extraction de recettes de cuisine depuis des descriptions ${platformName}.

IMPORTANT:
- Extrais TOUT ce que tu trouves (titre, ingrédients, étapes)
- IGNORE le texte promotionnel (pub app, "comment for recipe", liens, etc.)
- CHERCHE les mots-clés: "Ingredients:", "Instructions:", listes avec "-" ou "1.", etc.
- Si la description ne contient NI ingrédients NI étapes APRÈS avoir ignoré les pubs, retourne une erreur
- ACCEPTE les recettes partielles : SOIT ingrédients SOIT étapes (pas besoin des deux)
- ACCEPTE les recettes en anglais ET en français (traduis si besoin)
- Ne jamais inventer ou halluciner des ingrédients ou étapes
- Utilise 4 portions par défaut si non spécifié
- Normalise les unités en français (cuillère à soupe, tasse, grammes, etc.)

ÉTAPES - RÈGLES DE SÉPARATION:
- SÉPARE chaque action distincte en une étape séparée
- Une phrase avec un point = une étape distincte
- Découpe les longs paragraphes en étapes courtes et atomiques
- Chaque étape = une seule action claire

TAGS - RÈGLES STRICTES:
Tu DOIS sélectionner les tags UNIQUEMENT parmi cette liste prédéfinie:
${ALLOWED_TAGS.join(", ")}

Instructions pour les tags:
1. Analyse le contenu de la recette (titre, ingrédients, description)
2. Sélectionne 3 à 8 tags qui correspondent le mieux
3. Utilise EXACTEMENT les tags de la liste ci-dessus (respecte la casse)
4. N'invente AUCUN nouveau tag
5. Si un tag semble pertinent mais n'est pas dans la liste, ignore-le

Exemples:
- Soupe de butternut → Tags: ["Soupe", "Végétarien", "Hiver"] (pas "de saison")
- Entrée chaude italienne → Tags: ["Entrée", "Italienne", "Four"] (pas "entrée chaude")
- Quick vegetarian meal → Tags: ["Rapide (<30 min)", "Végétarien"] (pas "quick")`;

    const userPrompt = `Analyse cette description ${platformName} et détermine si elle contient une recette de cuisine.

Description:
"${description}"

URL source: ${sourceUrl}

Si c'est une VRAIE RECETTE avec au moins des ingrédients OU des étapes, extrais les informations en JSON:
{
  "title": "string (déduis un titre si absent)",
  "description": "string | null",
  "servings": number (utilise 4 si non spécifié),
  "prepTime": number | null (en minutes, déduis si mentionné),
  "cookTime": number | null (en minutes),
  "difficulty": "easy" | "medium" | "hard" | null (déduis selon complexité),
  "tags": string[] (UNIQUEMENT des tags de la liste prédéfinie, respecte la casse exacte),
  "ingredients": [
    {
      "name": "string",
      "quantity": number (utilise 0 si quantité imprécise),
      "unit": "string",
      "notes": "string | null"
    }
  ],
  "steps": [
    {
      "order": number (1, 2, 3...),
      "instruction": "string (une seule action par étape, courte et claire)",
      "duration": number | null (en minutes si mentionnée)
    }
  ],
  NOTE: Sépare chaque phrase/action en étape distincte. Ne regroupe PAS plusieurs actions dans une seule étape.
  "coverImageUrl": "${imageUrl || null}"
}

Si la description NE contient NI ingrédients NI étapes (juste une photo, un post lifestyle, etc.), réponds:
{
  "error": "NOT_A_RECIPE",
  "reason": "Cette recette ${platformName} ne peut pas être importée automatiquement. Les données complètes ne sont pas accessibles."
}`;

    // Call AI model
    const aiResponse = await callAIModel(modelKey, systemPrompt, userPrompt, apiKeys);
    const cost = calculateCost(modelKey, aiResponse.inputTokens, aiResponse.outputTokens);

    console.log(`💰 Cost: €${cost.toFixed(6)}`);

    let jsonString;
    try {
      jsonString = extractJSON(aiResponse.text);
    } catch (extractError) {
      console.error("❌ Failed to extract JSON from AI response:", extractError);
      console.error("AI response text:", aiResponse.text.substring(0, 500));
      return {
        success: false,
        error: "AI response format invalid",
      };
    }

    let parsedData;
    try {
      parsedData = JSON.parse(jsonString);

      // Check if AI determined it's not a recipe
      if (parsedData.error === "NOT_A_RECIPE") {
        return {
          success: false,
          error:
            parsedData.reason ||
            `Cette recette ${platformName} ne peut pas être importée automatiquement. Les données complètes ne sont pas accessibles.`,
        };
      }

      // Fix servings if needed
      if (!parsedData.servings || parsedData.servings === 0) {
        parsedData.servings = 4;
      }
    } catch (parseError) {
      console.error("❌ Failed to parse JSON:", parseError);
      console.error("JSON string:", jsonString.substring(0, 500));
      return {
        success: false,
        error: "AI returned invalid JSON",
      };
    }

    // Validate with Zod
    const validation = safeParseAIResponse(JSON.stringify(parsedData), aiRecipeImportSchema);

    if (!validation.success) {
      console.error("❌ AI validation failed:", validation.error.message);
      console.error("Parsed data:", JSON.stringify(parsedData, null, 2).substring(0, 1000));
      return {
        success: false,
        error: `Données de recette invalides: ${validation.error.message}`,
      };
    }

    const aiRecipe = validation.data;

    // Download and upload image to Supabase Storage if available
    let finalImageUrl = aiRecipe.coverImageUrl ?? null;

    // Normalize URL (handles both absolute and relative URLs)
    const normalizedImageUrl = normalizeImageUrl(imageUrl, sourceUrl);

    if (normalizedImageUrl) {
      console.log(`📸 Normalized image URL: ${normalizedImageUrl}`);
      // Generate unique ID for the recipe image
      const tempRecipeId = crypto.randomUUID();
      const uploadedUrl = await downloadAndUploadImage(normalizedImageUrl, tempRecipeId, userId);

      if (uploadedUrl) {
        console.log(`✅ Image stored in Supabase Storage: ${uploadedUrl}`);
        finalImageUrl = uploadedUrl;
      } else {
        console.log(`⚠️  Image upload failed, keeping external URL: ${normalizedImageUrl}`);
        finalImageUrl = normalizedImageUrl; // Fallback to external URL
      }
    } else if (imageUrl) {
      // Invalid or unsupported URL detected, set to null
      console.log(`⚠️  Invalid image URL detected, skipping: ${imageUrl}`);
      finalImageUrl = null;
    }

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
        ingredients: aiRecipe.ingredients,
        steps: aiRecipe.steps,
        coverImageUrl: finalImageUrl,
        importUrl: sourceUrl,
        importSource: "web" as const,
        importStrategy: sourcePlatform, // "instagram" or "tiktok"
      },
      cost,
      modelUsed: modelKey,
      duration: Date.now() - startTime,
    };
  } catch (error) {
    console.error("❌ Text parsing with AI failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Text parsing failed",
    };
  }
}

// =============================================================================
// AI-Powered HTML Parsing
// =============================================================================

async function parseHTMLWithAI(
  url: string,
  apiKeys: { anthropic?: string; openai?: string; deepseek?: string },
  userId: string
) {
  const modelKey = Deno.env.get("AI_MODEL") || DEFAULT_MODEL;
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
- Si un ingrédient n'a pas de quantité spécifique (ex: "sel", "poivre"), utilise quantity: 0 et unit: ""

TAGS - RÈGLES STRICTES:
Tu DOIS sélectionner les tags UNIQUEMENT parmi cette liste prédéfinie:
${ALLOWED_TAGS.join(", ")}

Instructions pour les tags:
1. Analyse le contenu de la recette (titre, ingrédients, description)
2. Sélectionne 3 à 8 tags qui correspondent le mieux
3. Utilise EXACTEMENT les tags de la liste ci-dessus (respecte la casse)
4. N'invente AUCUN nouveau tag
5. Si un tag semble pertinent mais n'est pas dans la liste, ignore-le

Exemples:
- Soupe de butternut → Tags: ["Soupe", "Végétarien", "Hiver"] (pas "de saison")
- Entrée chaude italienne → Tags: ["Entrée", "Italienne", "Four"] (pas "entrée chaude")
- Quick vegetarian meal → Tags: ["Rapide (<30 min)", "Végétarien"] (pas "quick")`;

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
  "tags": string[] (UNIQUEMENT des tags de la liste prédéfinie, respecte la casse exacte),
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

    // Download and upload image to Supabase Storage if available
    let finalImageUrl = aiRecipe.coverImageUrl ?? null;

    // Normalize and validate image URL (handles relative URLs)
    const normalizedImageUrl = normalizeImageUrl(aiRecipe.coverImageUrl, url);

    if (normalizedImageUrl) {
      console.log(`📸 Normalized image URL: ${normalizedImageUrl}`);
      // Generate unique ID for the recipe image
      const tempRecipeId = crypto.randomUUID();
      const uploadedUrl = await downloadAndUploadImage(
        normalizedImageUrl,
        tempRecipeId,
        userId
      );

      if (uploadedUrl) {
        console.log(`✅ Image stored in Supabase Storage: ${uploadedUrl}`);
        finalImageUrl = uploadedUrl;
      } else {
        console.log(`⚠️  Image upload failed, keeping normalized URL: ${normalizedImageUrl}`);
        finalImageUrl = normalizedImageUrl; // Fallback to normalized external URL
      }
    } else if (aiRecipe.coverImageUrl) {
      // Invalid URL detected, set to null
      console.log(`⚠️  Invalid image URL detected, skipping: ${aiRecipe.coverImageUrl}`);
      finalImageUrl = null;
    }

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
        coverImageUrl: finalImageUrl,
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
          error: `Limite d'imports atteinte. Vous avez utilisé ${importsUsed}/${importsLimit} imports ce mois-ci. Passez Premium pour des imports illimités.`,
          limitReached: true,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200, // Changed from 403 to 200 so client receives JSON in data
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

    // Detect URL type (Instagram/TikTok/web)
    const urlDetection = detectURLType(url);

    let aiResult: any;

    // Branch based on URL type
    if (urlDetection.type === "instagram") {

      // Extract description from Instagram
      const extraction = await extractFromInstagram(url);

      if (!extraction.success) {
        return new Response(
          JSON.stringify({
            success: false,
            error:
              extraction.error ||
              "Impossible d'extraire la description Instagram. La publication est peut-être privée ou le contenu est bloqué.",
            socialMediaError: true,
            platform: "instagram",
            duration: Date.now() - startTime,
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200, // Return 200 so Supabase client parses the body
          }
        );
      }

      // Parse text with AI
      aiResult = await parseTextWithAI(
        extraction.description!,
        extraction.imageUrl,
        url,
        "instagram",
        apiKeys,
        userId
      );
    } else if (urlDetection.type === "tiktok") {
      // Extract description from TikTok
      const extraction = await extractFromTikTok(url);

      if (!extraction.success) {
        return new Response(
          JSON.stringify({
            success: false,
            error:
              extraction.error ||
              "Impossible d'extraire la description TikTok. La vidéo est peut-être privée ou le contenu est bloqué.",
            socialMediaError: true,
            platform: "tiktok",
            duration: Date.now() - startTime,
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200, // Return 200 so Supabase client parses the body
          }
        );
      }

      // Parse text with AI
      aiResult = await parseTextWithAI(
        extraction.description!,
        extraction.imageUrl,
        url,
        "tiktok",
        apiKeys,
        userId
      );
    } else {
      // Web URL - use existing HTML parsing
      aiResult = await parseHTMLWithAI(url, apiKeys, userId);
    }

    // Handle result (same for all types)
    if (aiResult.success) {
      // Increment import counter
      await supabaseClient.rpc("increment_import_count", {
        p_user_id: userId,
      });

      return new Response(
        JSON.stringify({
          success: true,
          recipe: aiResult.recipe,
          strategy: aiResult.recipe.importStrategy || "ai",
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
        socialMediaError:
          urlDetection.type === "instagram" || urlDetection.type === "tiktok",
        platform:
          urlDetection.type === "instagram"
            ? "instagram"
            : urlDetection.type === "tiktok"
            ? "tiktok"
            : undefined,
        duration: Date.now() - startTime,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200, // Return 200 so Supabase client parses the body
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
