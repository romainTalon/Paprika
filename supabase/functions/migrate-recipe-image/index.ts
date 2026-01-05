// Supabase Edge Function: Migrate Recipe Image
// Migrates external image URLs to Supabase Storage
// For Instagram/TikTok: extracts clean image without play button

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as cheerio from "npm:cheerio@1.0.0-rc.12";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const STORAGE_BUCKET = "recipe-images";

/**
 * Download image from URL and upload to Supabase Storage
 */
async function downloadAndUploadImage(
  imageUrl: string,
  recipeId: string,
  userId: string
): Promise<string | null> {
  try {
    console.log(`📥 Downloading image from: ${imageUrl}`);

    const response = await fetch(imageUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; PaprikaBot/1.0)",
      },
    });

    if (!response.ok) {
      console.error(`❌ Failed to fetch image: ${response.status}`);
      return null;
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    const extension = contentType.includes("png") ? "png" : "jpg";
    const blob = await response.blob();

    const filename = `${recipeId}-${Date.now()}.${extension}`;
    const storagePath = `recipes/${userId}/${filename}`;

    console.log(`⬆️  Uploading to Supabase Storage: ${storagePath}`);

    // Create admin client with SERVICE_ROLE_KEY
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
 * Extract clean image URL from Instagram (without play button)
 */
async function extractCleanInstagramImage(url: string): Promise<string | null> {
  try {
    console.log(`🔍 Extracting clean Instagram image from: ${url}`);

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; PaprikaBot/1.0)",
      },
    });

    if (!response.ok) return null;

    const html = await response.text();
    const $ = cheerio.load(html);

    let imageUrl = "";

    // Try to extract from modern Instagram Polaris structure
    $("script").each((_, element) => {
      const scriptContent = $(element).html() || "";

      if (scriptContent.includes("xig_polaris_media")) {
        // Extract video_image.uri (for Reels/Videos - without play button overlay)
        const videoImageMatch = scriptContent.match(/"video_image":\s*{\s*"uri":\s*"([^"]+)"/);
        if (videoImageMatch && videoImageMatch[1]) {
          const cleanUrl = videoImageMatch[1]
            .replace(/\\\//g, "/")
            .replace(/\\u0026/g, "&")
            .replace(/\\u00253D/g, "=");

          // Verify it doesn't have cmp1_ (composite overlay with play button)
          if (!cleanUrl.includes("cmp1_")) {
            console.log(`✅ Found clean video_image.uri from Instagram Polaris`);
            imageUrl = cleanUrl;
            return false;
          }
        }

        // Fallback: Try image_versions2 for photos
        const imageMatch = scriptContent.match(/"image_versions2":\s*{\s*"candidates":\s*\[\s*{\s*"url":\s*"([^"]+)"/);
        if (imageMatch && imageMatch[1]) {
          imageUrl = imageMatch[1].replace(/\\\//g, "/");
          console.log(`✅ Found image from Instagram image_versions2`);
          return false;
        }
      }
    });

    // Fallback to og:image if nothing found
    if (!imageUrl) {
      console.log("⚠️  No clean image found, using og:image");
      const ogImage = $('meta[property="og:image"]').attr("content");
      imageUrl = ogImage || "";
    }

    return imageUrl || null;
  } catch (error) {
    console.error("❌ Instagram extraction failed:", error);
    return null;
  }
}

/**
 * Main handler
 */
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { recipeId, externalUrl, importUrl, userId } = await req.json();

    if (!recipeId || !userId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "recipeId and userId are required",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    console.log(`🔄 Migrating image for recipe ${recipeId}...`);

    let imageUrlToDownload = externalUrl;

    // If it's Instagram and we have the import URL, extract clean image
    if (importUrl && (importUrl.includes("instagram.com") || importUrl.includes("tiktok.com"))) {
      console.log(`🎯 Detected social media URL, extracting clean image...`);

      if (importUrl.includes("instagram.com")) {
        const cleanUrl = await extractCleanInstagramImage(importUrl);
        if (cleanUrl) {
          imageUrlToDownload = cleanUrl;
          console.log(`✅ Using clean Instagram image`);
        }
      }
      // TODO: Add TikTok extraction if needed
    }

    // Download and upload to Storage
    if (!imageUrlToDownload) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "No image URL to migrate",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    const newUrl = await downloadAndUploadImage(imageUrlToDownload, recipeId, userId);

    if (!newUrl) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to download/upload image",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    // Update recipe in database
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: req.headers.get("Authorization") ? { Authorization: req.headers.get("Authorization")! } : {},
        },
      }
    );

    const { error: updateError } = await supabaseClient
      .from("recipes")
      .update({ cover_image_url: newUrl })
      .eq("id", recipeId);

    if (updateError) {
      console.error("❌ Failed to update recipe:", updateError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to update recipe in database",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    console.log(`✅ Recipe ${recipeId} migrated successfully`);

    return new Response(
      JSON.stringify({
        success: true,
        newUrl,
        oldUrl: externalUrl,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("❌ Migration error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
