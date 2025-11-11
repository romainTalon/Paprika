// Supabase Edge Function: Reset Monthly Imports Counter
// This function resets the imports_this_month counter for all users
// Schedule: Run daily (will only reset when month changes)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role key
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Call the PostgreSQL function to reset imports
    const { data, error } = await supabaseClient.rpc("reset_imports_counter");

    if (error) {
      throw error;
    }

    // Get count of users that were reset
    const { count } = await supabaseClient
      .from("users")
      .select("*", { count: "exact", head: true })
      .lt("last_import_reset", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());

    return new Response(
      JSON.stringify({
        success: true,
        message: "Import counters reset successfully",
        usersReset: count || 0,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
