import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(
  supabaseUrl,
  serviceRoleKey
);

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({
          success: false,
          error: "POST required",
        }),
        {
          status: 405,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Get active listings that need price collection.
    const { data: listings, error: listingsError } = await supabase
      .from("listings")
      .select(`
        id,
        product_id,
        retailer_id,
        retailer_product_id,
        url,
        seller_name,
        condition,
        currency,
        active
      `)
      .eq("active", true)
      .limit(50);

    if (listingsError) {
      throw new Error(
        `Could not read listings: ${listingsError.message}`
      );
    }

    if (!listings || listings.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "No active listings need collection",
          collected: 0,
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    /*
     * IMPORTANT:
     *
     * We are intentionally NOT generating mock prices anymore.
     *
     * Real retailer/API collectors will be added here.
     *
     * Until a genuine source has been configured for a listing,
     * we leave its price history untouched.
     */

    const results = listings.map((listing) => ({
      listing_id: listing.id,
      retailer: listing.seller_name,
      status: "not_collected",
      reason: "No real price source configured yet",
    }));

    return new Response(
      JSON.stringify({
        success: true,
        message: "Collector ran without generating fake data",
        collected: 0,
        skipped: results.length,
        results,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : String(error),
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
});