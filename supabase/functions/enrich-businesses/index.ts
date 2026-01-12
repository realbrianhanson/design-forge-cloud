import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Google Places API endpoints
const PLACES_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText";
const PLACES_DETAILS_URL = "https://places.googleapis.com/v1/places";

interface GooglePlace {
  id: string;
  displayName?: { text: string };
  rating?: number;
  userRatingCount?: number;
  priceLevel?: string;
  photos?: Array<{ name: string }>;
  currentOpeningHours?: {
    weekdayDescriptions?: string[];
    openNow?: boolean;
  };
  formattedAddress?: string;
}

interface EnrichmentResult {
  businessId: string;
  businessName: string;
  success: boolean;
  googlePlaceId?: string;
  rating?: number;
  reviewCount?: number;
  photoUrl?: string;
  error?: string;
}

// Convert Google price level to numeric
function mapPriceLevel(priceLevel?: string): number | null {
  const mapping: Record<string, number> = {
    "PRICE_LEVEL_FREE": 0,
    "PRICE_LEVEL_INEXPENSIVE": 1,
    "PRICE_LEVEL_MODERATE": 2,
    "PRICE_LEVEL_EXPENSIVE": 3,
    "PRICE_LEVEL_VERY_EXPENSIVE": 4,
  };
  return priceLevel ? mapping[priceLevel] ?? null : null;
}

// Search for a business on Google Places
async function findGooglePlace(
  apiKey: string,
  businessName: string,
  address: string | null,
  city: string | null
): Promise<GooglePlace | null> {
  const searchQuery = address 
    ? `${businessName} ${address}, ${city || 'Jacksonville'}, FL`
    : `${businessName} ${city || 'Jacksonville'}, FL`;

  try {
    const response = await fetch(PLACES_SEARCH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "places.id,places.displayName,places.rating,places.userRatingCount,places.priceLevel,places.photos,places.formattedAddress",
      },
      body: JSON.stringify({
        textQuery: searchQuery,
        locationBias: {
          circle: {
            center: { latitude: 30.3322, longitude: -81.6557 },
            radius: 30000,
          },
        },
        maxResultCount: 1,
      }),
    });

    if (!response.ok) {
      console.error(`Google Places search failed: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data.places?.[0] || null;
  } catch (error) {
    console.error("Error searching Google Places:", error);
    return null;
  }
}

// Get photo URL from Google Places
function getPhotoUrl(apiKey: string, photoReference: string, maxWidth = 800): string {
  return `https://places.googleapis.com/v1/${photoReference}/media?maxHeightPx=${maxWidth}&maxWidthPx=${maxWidth}&key=${apiKey}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("GOOGLE_PLACES_API_KEY");
    if (!apiKey) {
      throw new Error("GOOGLE_PLACES_API_KEY not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    let limit = 50;
    let forceRefresh = false;
    let businessIds: string[] | null = null;

    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      if (body.limit) limit = body.limit;
      if (body.forceRefresh) forceRefresh = body.forceRefresh;
      if (body.businessIds) businessIds = body.businessIds;
    }

    // Query businesses that need enrichment
    let query = supabase
      .from("businesses")
      .select("id, name, address, city")
      .eq("status", "active");

    // Either specific IDs or businesses without ratings/photos
    if (businessIds && businessIds.length > 0) {
      query = query.in("id", businessIds);
    } else if (!forceRefresh) {
      // Find businesses missing ratings OR cover images
      query = query.or("rating.is.null,cover_image_url.is.null");
    }

    query = query.limit(limit);

    const { data: businesses, error: fetchError } = await query;

    if (fetchError) {
      throw new Error(`Failed to fetch businesses: ${fetchError.message}`);
    }

    if (!businesses || businesses.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "No businesses need enrichment",
          enriched: 0,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Enriching ${businesses.length} businesses with Google Places data...`);

    const results: EnrichmentResult[] = [];
    let enrichedCount = 0;
    let errorCount = 0;

    for (const business of businesses) {
      const result: EnrichmentResult = {
        businessId: business.id,
        businessName: business.name,
        success: false,
      };

      try {
        // Search for this business on Google
        const googlePlace = await findGooglePlace(
          apiKey,
          business.name,
          business.address,
          business.city
        );

        if (!googlePlace) {
          result.error = "No matching place found on Google";
          results.push(result);
          continue;
        }

        result.googlePlaceId = googlePlace.id;

        // Build update object
        const updateData: Record<string, unknown> = {
          last_synced_at: new Date().toISOString(),
        };

        // Add rating
        if (googlePlace.rating) {
          updateData.rating = googlePlace.rating;
          result.rating = googlePlace.rating;
        }

        // Add review count
        if (googlePlace.userRatingCount) {
          updateData.review_count = googlePlace.userRatingCount;
          result.reviewCount = googlePlace.userRatingCount;
        }

        // Add price level
        const priceLevel = mapPriceLevel(googlePlace.priceLevel);
        if (priceLevel !== null) {
          updateData.price_level = priceLevel;
        }

        // Add photo
        if (googlePlace.photos && googlePlace.photos.length > 0) {
          const photoUrl = getPhotoUrl(apiKey, googlePlace.photos[0].name);
          updateData.cover_image_url = photoUrl;
          result.photoUrl = photoUrl;
        }

        // Update the business
        const { error: updateError } = await supabase
          .from("businesses")
          .update(updateData)
          .eq("id", business.id);

        if (updateError) {
          result.error = `Update failed: ${updateError.message}`;
          errorCount++;
        } else {
          result.success = true;
          enrichedCount++;
          console.log(`✓ Enriched: ${business.name} - Rating: ${result.rating}, Reviews: ${result.reviewCount}`);
        }

      } catch (error) {
        result.error = error instanceof Error ? error.message : "Unknown error";
        errorCount++;
      }

      results.push(result);

      // Rate limiting: 50ms delay between requests
      await new Promise(r => setTimeout(r, 50));
    }

    return new Response(
      JSON.stringify({
        success: true,
        timestamp: new Date().toISOString(),
        summary: {
          total: businesses.length,
          enriched: enrichedCount,
          errors: errorCount,
        },
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in enrich-businesses:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
